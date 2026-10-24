import {MeasurementController} from './controller.js';
import {SessionStore} from './session-store.js';
import {SimulationAdapter} from './adapters/simulation.js';
import {ReplayAdapter} from './adapters/replay.js';
import {LIMITS} from './schema.js';
import {exportJSON, exportCSV, importSession} from './export.js';
import {processSamples} from './processing.js';
import {drawChart} from './chart.js';
import {t, errorText, language} from './i18n.js';

const $ = id => document.getElementById(id);
const text = (id, value) => { if ($(id).textContent !== value) $(id).textContent = value; };
const store = new SessionStore();
const controller = new MeasurementController({store});
let sessions = [], selectedId = null, recording = null, uiError = null, storageError = null;
let renderTimer = null, refreshedId = null, importGeneration = 0;
const number = value => value === null || value === undefined ? '—' : new Intl.NumberFormat(language(), {maximumFractionDigits: 1}).format(value);
const date = value => value ? new Date(value).toLocaleString(language(), {dateStyle:'medium',timeStyle:'medium'}) : t('noLast');
const sourceLabel = session => session ? `${session.descriptor.origin === 'simulated' ? t('originSim') : t('originHardware')} · ${session.mode === 'replay' ? t('playback') : t('stream')}` : '—';
const statusLabel = state => state.saving ? t('saving') : t(state.status === 'replay' ? 'replayState' : state.status);
const currentSession = () => controller.session || sessions[0];
function populateChannels(select, session) {
  const channels = session?.descriptor.channels || [];
  if (JSON.stringify([...select.options].map(o => [o.value, o.textContent])) === JSON.stringify(channels.map(c => [c.id, `${c.label} (${c.unit})`]))) return;
  const old = select.value;
  select.replaceChildren(...channels.map(c => new Option(`${c.label} (${c.unit})`, c.id)));
  if (channels.some(c => c.id === old)) select.value = old;
}
function quality(derived) {
  if (!derived || derived.accepted < 20) return t('pendingCheck');
  const labels = [];
  if (derived.missing) labels.push(`${t('missing')}: ${number(derived.missing)}`);
  if (derived.rejected) labels.push(`${t('rejected')}: ${number(derived.rejected)}`);
  if (derived.timingGaps) labels.push(`${t('timingGaps')}: ${number(derived.timingGaps)}`);
  if (Object.values(derived.channels).some(c => c.flatline)) labels.push(t('flatCheck'));
  const clipped = Object.values(derived.channels).reduce((n,c) => n+c.clipped,0);
  if (clipped) labels.push(`${t('clipCount')}: ${number(clipped)}`);
  return labels.join(' · ') || t('cleanCheck');
}
function download(session, format) {
  if (!session?.samples.length) return;
  const blob = new Blob([format === 'csv' ? exportCSV(session) : exportJSON(session)], {type:format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json'});
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `arteria-${session.id}.${format}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function render() {
  renderTimer = null;
  const state = controller.snapshot(), session = currentSession();
  const derived = session === state.session ? state.derived : session ? processSamples(session.samples, session.descriptor, session.rejected) : null;
  populateChannels($('channel-select'), session);
  const channel = session?.descriptor.channels.find(c => c.id === $('channel-select').value) || session?.descriptor.channels[0];
  const latest = session?.samples.at(-1);
  text('device-state', statusLabel(state));
  $('device-name').textContent = state.active ? state.session.descriptor.deviceName : t('noDevice');
  $('device-battery').textContent = state.active && state.session.descriptor.origin === 'hardware' && state.session.mode === 'stream' && latest?.batteryPercent !== undefined ? `${number(latest.batteryPercent)}%` : t('noBattery');
  $('device-last').textContent = latest ? `${t('lastSample')}: ${date(latest.receivedAt)}` : t('noLast');
  $('device-state').dataset.state = state.status;
  $('device-state').closest('.patch-card').dataset.state = state.status;
  $('overview-source').textContent = sourceLabel(session);
  $('overview-count').textContent = number(derived?.accepted || 0);
  $('overview-status').textContent = state.active ? statusLabel(state) : session ? t(session.status) : t('disconnected');
  $('overview-summary').textContent = session ? `${session.descriptor.deviceName} · ${t('sessionAt')}: ${date(session.startedAt)}` : t('noData');
  $('overview-last').textContent = latest ? date(latest.receivedAt) : t('noLast');
  $('overview-provenance').textContent = sourceLabel(session);
  $('overview-value').textContent = latest && channel ? number(latest.raw[channel.id]) : '—';
  $('overview-unit').textContent = channel ? `${channel.label} · ${channel.unit}` : '—';
  $('overview-quality').textContent = quality(derived);
  $('overview-duration').textContent = `${number((derived?.durationMs || 0) / 1000)} ${t('seconds')}`;
  $('overview-gaps').textContent = `${t('missing')}: ${number(derived?.missing || 0)} · ${t('rejected')}: ${number(derived?.rejected || 0)}`;
  const busy = state.active || state.saving;
  for (const id of ['source-select','scenario-select','duration-select','replay-speed','replay-file']) $(id).disabled = busy;
  $('scan-button').disabled = busy || state.unsaved || ($('source-select').value === 'replay' && !recording);
  $('scan-button').setAttribute('aria-busy', String(busy));
  $('stop-button').disabled = !state.active;
  text('scan-state', statusLabel(state));
  $('scan-hint').textContent = state.unsaved ? t('unsaved') : state.active ? t('recordingHint') : session ? t('completeHint') : t('hardwareNote');
  const percent = state.session?.status === 'completed' ? 100 : Math.min(100, Math.round(state.elapsedMs / (controller.durationMs || 1) * 100));
  $('acquisition-progress').value = percent;
  $('progress-label').textContent = `${percent}% · ${number(state.elapsedMs/1000)} ${t('seconds')} ${t('elapsed')}`;
  $('acquisition-progress').setAttribute('aria-label', t('sessionLength'));
  const channelStats = channel && derived?.channels[channel.id];
  $('acquisition-stats').textContent = `${t('accepted')}: ${number(derived?.accepted || 0)} · ${quality(derived)}${channelStats?.count ? ` · ${t('mean')}: ${number(channelStats.mean)} ${channel.unit} · ${t('range')}: ${number(channelStats.min)}–${number(channelStats.max)} ${channel.unit}` : ''}`;
  const error = uiError || state.error || storageError;
  text('measurement-error', error ? errorText(error) : '');
  $('retry-save').hidden = !state.unsaved;
  $('discard-session').hidden = !state.unsaved;
  for (const id of ['current-json', 'current-csv']) $(id).disabled = busy || !session?.samples.length;
  drawChart($('acquisition-chart'), session, channel?.id, {live:state.active});
  drawChart($('overview-chart'), session, channel?.id, {live:state.active});
  if (!state.active && !state.saving && !state.unsaved && state.session?.samples.length && refreshedId !== state.session.id) {
    refreshedId = state.session.id; void refreshHistory();
  }
}
function scheduleRender() { if (!renderTimer) renderTimer = setTimeout(render, 200); }
controller.subscribe(scheduleRender);
function filteredSessions() {
  const cutoff = Date.now() - Number($('range-select').value) * 86400000;
  return sessions.filter(s => Date.parse(s.startedAt) >= cutoff);
}
function renderHistory() {
  const filtered = filteredSessions();
  $('history-count').textContent = number(filtered.length);
  $('history-samples').textContent = number(filtered.reduce((n,s) => n+s.samples.length,0));
  $('history-duration').textContent = `${number(filtered.reduce((n,s) => n + (s.derived?.durationMs || 0),0) / 1000)} ${t('seconds')}`;
  $('trend-range-title').textContent = t($('range-select').value === '30' ? 'month' : 'week');
  $('history-status').textContent = storageError ? errorText(storageError) : filtered.length ? '' : t('emptyHistory');
  if (!filtered.some(s => s.id === selectedId)) selectedId = filtered[0]?.id || null;
  $('session-list').replaceChildren(...filtered.map(s => {
    const button = document.createElement('button'); button.className = 'session-choice'; button.type = 'button';
    button.setAttribute('aria-pressed', String(s.id === selectedId));
    button.textContent = `${date(s.startedAt)} · ${sourceLabel(s)} · ${number(s.samples.length)} ${t('samples')} · ${t(s.status)}`;
    button.addEventListener('click', () => { selectedId = s.id; renderHistory(); }); return button;
  }));
  renderSelected();
}
function renderSelected() {
  const session = filteredSessions().find(s => s.id === selectedId);
  populateChannels($('history-channel'), session);
  $('history-selection').textContent = session ? `${t('sessionAt')}: ${date(session.startedAt)} · ${sourceLabel(session)} · ${quality(session.derived)}` : '';
  for (const id of ['history-json','history-csv','history-delete','history-replay']) $(id).disabled = !session;
  drawChart($('history-chart'), session, $('history-channel').value);
}
async function refreshHistory() {
  try { sessions = await store.list(); storageError = null; }
  catch (error) { storageError = error.message; }
  renderHistory(); scheduleRender();
}
function sourceControls() {
  const replay = $('source-select').value === 'replay';
  $('replay-control').hidden = !replay; $('replay-speed-control').hidden = !replay;
  $('scenario-control').hidden = replay; $('duration-control').hidden = replay;
  $('replay-description').textContent = recording ? `${t('imported')}: ${date(recording.startedAt)} · ${recording.descriptor.origin === 'simulated' ? t('originSim') : t('originHardware')} · ${number(recording.samples.length)} ${t('samples')}` : t('recordingFile');
  scheduleRender();
}
$('source-select').addEventListener('change', sourceControls);
$('channel-select').addEventListener('change', scheduleRender);
$('history-channel').addEventListener('change', renderSelected);
$('range-select').addEventListener('change', renderHistory);
$('replay-file').addEventListener('change', async () => {
  const generation = ++importGeneration, file = $('replay-file').files[0]; recording = null; uiError = null;
  try { if (file) { if (file.size > LIMITS.fileBytes) throw new Error('fileSize'); const text = await file.text(); if (generation !== importGeneration) return; recording = importSession(text); } }
  catch (error) { uiError = error.message; }
  if (generation === importGeneration) sourceControls();
});
$('scan-button').addEventListener('click', async () => {
  uiError = null;
  $('scan-button').disabled = true;
  $('current-json').disabled = true; $('current-csv').disabled = true;
  try {
    const replay = $('source-select').value === 'replay';
    if (replay && !recording) throw new Error('samples');
    const adapter = replay ? new ReplayAdapter(recording, Number($('replay-speed').value)) : new SimulationAdapter($('scenario-select').value);
    const durationSeconds = replay ? Math.min(300, Math.max(1, (recording.samples.at(-1).deviceTimeMs-recording.samples[0].deviceTimeMs)/1000/Number($('replay-speed').value)+2)) : Number($('duration-select').value);
    await controller.start(adapter, {durationSeconds});
    render();
  } catch (error) { uiError = error.message; }
  scheduleRender();
});
$('stop-button').addEventListener('click', () => void controller.stop());
$('retry-save').addEventListener('click', async () => { await controller.save(); if (!controller.unsaved) { refreshedId = null; await refreshHistory(); } scheduleRender(); });
$('discard-session').addEventListener('click', () => { if (confirm(t('deleteConfirm'))) { controller.discardUnsaved(); scheduleRender(); } });
$('current-json').addEventListener('click', () => download(currentSession(), 'json'));
$('current-csv').addEventListener('click', () => download(currentSession(), 'csv'));
for (const format of ['json','csv']) $('history-'+format).addEventListener('click', () => download(sessions.find(s => s.id === selectedId), format));
$('history-delete').addEventListener('click', async () => {
  if (!selectedId || !confirm(t('deleteConfirm'))) return;
  try { await store.delete(selectedId); if (controller.session?.id === selectedId && !controller.active) controller.session = null; selectedId = null; uiError = null; await refreshHistory(); }
  catch (error) { uiError = error.message; }
  scheduleRender();
});
$('history-replay').addEventListener('click', () => {
  const session = sessions.find(s => s.id === selectedId); if (!session) return;
  if (controller.active || controller.saving) { uiError = 'busy'; scheduleRender(); return; }
  try { recording = importSession(exportJSON(session)); $('source-select').value = 'replay'; sourceControls(); document.querySelector('[data-view="photon"]').click(); }
  catch (error) { uiError = error.message; scheduleRender(); }
});
$('patch-details').addEventListener('click', () => document.querySelector('[data-view="photon"]').click());
function localize() {
  document.querySelectorAll('[data-m]').forEach(el => { el.textContent = t(el.dataset.m); });
  $('history-channel').setAttribute('aria-label', t('channel')); $('channel-select').setAttribute('aria-label',t('channel'));
  sourceControls(); renderHistory(); scheduleRender();
}
document.addEventListener('arteria-language', localize);
window.addEventListener('beforeunload', event => { if (controller.active || controller.saving || controller.unsaved) { event.preventDefault(); event.returnValue = ''; } });
localize(); render(); void refreshHistory();
