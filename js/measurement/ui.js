import {filterSessions} from './filters.js';
import {loadPreferences} from '../profile/preferences.js';
import {MeasurementController} from './controller.js';
import {SessionStore} from './session-store.js';
import {SimulationAdapter} from './adapters/simulation.js';
import {MockDeviceAdapter} from './adapters/mock-device.js';
import {ReplayAdapter} from './adapters/replay.js';
import {LIMITS} from './schema.js';
import {exportJSON, exportCSV, importSession} from './export.js';
import {processSamples} from './processing.js';
import {analyzeSession,analysisFallback} from './analysis.js';
import {recordingAnalytics} from './analytics.js';
import {sessionReport,comparisonReport} from './report.js';
import {drawChart} from './chart.js';
import {t, errorText, language} from './i18n.js';

const $ = id => document.getElementById(id);
const text = (id, value) => { if ($(id).textContent !== value) $(id).textContent = value; };
const store = new SessionStore();
const controller = new MeasurementController({store});
let sessions = [], selectedId = null, recording = null, uiError = null, storageError = null;
const notesDrafts=new Map();
let compareId=null;
let pendingDurationPreference=false;
let renderTimer = null, refreshedId = null, importGeneration = 0, ready = false, recoveredCount = 0;
const number = value => value === null || value === undefined ? '—' : new Intl.NumberFormat(language(), {maximumSignificantDigits: 6}).format(value);
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
  const jumps=Object.values(derived.channels).reduce((n,c)=>n+(c.stepJumps||0),0);
  if(jumps)labels.push(`${t('stepJumps')}: ${number(jumps)}`);
  const clipped = Object.values(derived.channels).reduce((n,c) => n+c.clipped,0);
  if (clipped) labels.push(`${t('clipCount')}: ${number(clipped)}`);
  return labels.join(' · ') || t('cleanCheck');
}
function download(session, format) {
  if (!session?.samples.length) return;
  try {
  const content=format==='html'?sessionReport(session,{locale:language()}):format==='csv'?exportCSV(session):exportJSON(session);
  const blob = new Blob([content], {type:format==='html'?'text/html;charset=utf-8':format==='csv'?'text/csv;charset=utf-8':'application/json'});
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `arteria-${session.id}.${format}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  uiError=null;
  } catch { uiError='export'; }
  scheduleRender();
}
function renderAnalysis(session){
 const section=$('post-scan-results');if(!section)return;
 const analysis=session?.analysis|| (session?.samples?.length?analyzeSession(session):null);
 section.hidden=!analysis||!session?.samples?.length;if(!analysis)return;
 const es=language()==='es',fmt=(v,max=2)=>v===null||v===undefined?'—':new Intl.NumberFormat(es?'es':'en',{maximumFractionDigits:max}).format(v),channels=session.descriptor.channels;
 $('analysis-meta').textContent=`${sourceLabel(session)} · ${date(session.startedAt)} · ${session.mode==='replay'?(es?'reproducción':'replay'):(es?'adquisición':'acquisition')} · ${analysis.nominalSampleRateHz} Hz nominal`;
 drawChart($('analysis-chart'),session,channels.find(c=>c.id===$('channel-select').value)?.id||channels[0]?.id);
 const metrics=es?[['Duración',`${fmt(analysis.durationSeconds)} s`],['Muestras válidas',fmt(analysis.accepted,0)],['Frecuencia efectiva',analysis.effectiveSampleRateHz===null?'—':`${fmt(analysis.effectiveSampleRateHz)} Hz`],['Integridad estimada',`${fmt(analysis.completenessPercent)}%`],['Muestras faltantes',`${fmt(analysis.missing,0)} · ${fmt(analysis.missingPercent)}%`],['Tramas rechazadas',fmt(analysis.rejected,0)]]:[['Duration',`${fmt(analysis.durationSeconds)} s`],['Valid samples',fmt(analysis.accepted,0)],['Effective sampling',analysis.effectiveSampleRateHz===null?'—':`${fmt(analysis.effectiveSampleRateHz)} Hz`],['Estimated completeness',`${fmt(analysis.completenessPercent)}%`],['Missing samples',`${fmt(analysis.missing,0)} · ${fmt(analysis.missingPercent)}%`],['Rejected frames',fmt(analysis.rejected,0)]];
 for(const c of channels){const m=analysis.channels[c.id];metrics.push([`${c.label} · mean`,`${fmt(m.mean)} ${c.unit}`],[`${c.label} · spread`,`${fmt(m.stddev)} ${c.unit} SD`],[`${c.label} · range`,`${fmt(m.range)} ${c.unit}`]);}
 $('analysis-metrics').replaceChildren(...metrics.map(([label,value])=>{const div=document.createElement('div');div.className='analysis-metric';const title=document.createElement('span'),number=document.createElement('strong');title.textContent=label;number.textContent=value;div.append(title,number);return div;}));
 const flags=Object.entries(analysis.qualityFlags).filter(([,value])=>value).map(([key])=>key);
 const flagNames=es?{missing:'muestras faltantes',rejected:'tramas rechazadas',timingGaps:'intervalos irregulares',flatline:'tramo constante',clipping:'muestras en límite',largeSteps:'cambios grandes'}:{missing:'missing samples',rejected:'rejected frames',timingGaps:'irregular timing',flatline:'flat segment',clipping:'at-limit samples',largeSteps:'large steps'};
 const qualityBox=document.createElement('div');const p=document.createElement('p');p.textContent=flags.length?(es?'Indicadores observados: ':'Observed flags: ')+flags.map(k=>flagNames[k]).join(', '):(es?'Estas comprobaciones no detectaron muestras faltantes, intervalos irregulares ni alertas de canal.':'These checks found no missing samples, irregular timing, or channel flags.');qualityBox.append(p);
 for(const c of channels){const m=analysis.channels[c.id],row=document.createElement('p');row.textContent=`${c.label} (${c.unit}): ${es?'media':'mean'} ${fmt(m.mean)}, DE ${fmt(m.stddev)}, rango ${fmt(m.range)}. ${m.firstHalfStddev!==null&&m.secondHalfStddev!==null?(es?'Dispersión por mitades':'Half-window spread')+`: ${fmt(m.firstHalfStddev)} → ${fmt(m.secondHalfStddev)} ${c.unit}.`:''}`;qualityBox.append(row);}
 const snr=document.createElement('p');snr.textContent=es?'SNR: no calculada (no hay una definición validada de ruido para esta fuente).':'SNR: not calculated (no defensible noise definition is available for this source).';qualityBox.append(snr);$('analysis-quality').replaceChildren(qualityBox);
 const saved=session.analysisReport;
 $('analysis-report').textContent=saved?.text||analysisFallback(analysis,language());
 $('analysis-report-meta').textContent=saved?`${es?'Análisis guardado':'Saved analysis'} · ${date(saved.generatedAt)} · ${saved.model||saved.provider||'AI'}`:(es?'Resumen técnico sin conexión; la explicación de IA es opcional.':'Offline technical summary; AI explanation is optional.');
 const compare=$('analysis-compare'),old=compare.value,candidates=sessions.filter(item=>item.id!==session.id);compare.replaceChildren(new Option(t('noComparison'),''),...candidates.map(item=>new Option(`${date(item.startedAt)} · ${sourceLabel(item)}`,item.id)));if(candidates.some(item=>item.id===old))compare.value=old;
 $('delete-ai-analysis').hidden=!saved;
 $('analyze-with-ai').disabled=!savedSessions().length;
}
export const savedSessions=()=>sessions;
export function measurementInfo(){return {state:controller.snapshot(),session:currentSession(),count:sessions.length,ready,storageError};}
export function historyJSON(){return JSON.stringify({format:"arteria-history",schemaVersion:1,exportedAt:new Date().toISOString(),recordings:sessions.map(s=>JSON.parse(exportJSON(s)))});}
export async function clearRecordings(){
  if(controller.active||controller.saving)throw Error("busy");
  await store.clear();controller.discardUnsaved();selectedId=null;compareId=null;recording=null;importGeneration++;$("replay-file").value="";$("source-select").value="simulation";sourceControls();notesDrafts.clear();refreshedId=null;recoveredCount=0;uiError=null;await refreshHistory();
}
function render() {
  renderTimer = null;
  const state = controller.snapshot(), session = currentSession();
  if(pendingDurationPreference&&!state.active&&!state.saving){$("duration-select").value=String(loadPreferences().duration);pendingDurationPreference=false;}
  const derived = session === state.session ? state.derived : session ? processSamples(session.samples, session.descriptor, session.rejected) : null;
  document.dispatchEvent(new Event('arteria-measurements'));
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
  $('overview-empty').hidden=!loadPreferences().onboarding||state.active||!!session?.samples.length;
  $('overview-saved-count').textContent=number(sessions.length);
  $('overview-report').disabled=state.active||state.saving||!sessions.length;
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
  $('scan-button').disabled = !ready || busy || state.unsaved || ($('source-select').value === 'replay' && !recording);
  $('delete-all-sessions').disabled = busy; $('recover-sessions').disabled=busy;
  text('recovery-compatibility',navigator.locks?'':t('manualRecovery'));
  $('checkpoint-status').textContent = state.active ? `${t('checkpoint')}: ${number(state.persistedCount)} ${t('samples')}` : '';
  text('recovery-status', recoveredCount ? `${t('recovered')}: ${number(recoveredCount)}` : '');
  $('scan-button').setAttribute('aria-busy', String(busy));
  $('stop-button').disabled = !state.active;$('pause-button').hidden=!state.active||!controller.canPause();$('pause-button').textContent=state.paused?(language()==='es'?'Continuar reproducción':'Resume replay'):(language()==='es'?'Pausar reproducción':'Pause replay');
  text('scan-state', statusLabel(state));
  $('scan-hint').textContent = state.unsaved ? t('unsaved') : state.paused?t('pausedHint'):state.active ? t('recordingHint') : session ? t('completeHint') : t('hardwareNote');
  const percent = state.session?.status === 'completed' ? 100 : Math.min(100, Math.round(state.elapsedMs / (controller.durationMs || 1) * 100));
  $('acquisition-progress').value = percent;
  $('progress-label').textContent = `${percent}% · ${number(state.elapsedMs/1000)} ${t('seconds')} ${t('elapsed')}`;
  $('acquisition-progress').setAttribute('aria-label', t('sessionLength'));
  const channelStats = channel && derived?.channels[channel.id];
  $('quality-explanation').textContent=!state.active&&!derived?.accepted?t('qualityStart'):!derived||derived.accepted<20?t('qualityCollecting'):derived.missing||derived.timingGaps?t('qualityGaps'):derived.rejected||Object.values(derived.channels).some(c=>c.flatline||c.clipped||c.stepJumps)?t('qualityReview'):t('qualityContinuous');
  $('acquisition-stats').textContent = `${t('accepted')}: ${number(derived?.accepted || 0)} · ${quality(derived)}${channelStats?.count ? ` · ${t('mean')}: ${number(channelStats.mean)} ${channel.unit} · ${t('range')}: ${number(channelStats.min)}–${number(channelStats.max)} ${channel.unit}` : ''}`;
  const error = uiError || state.error || storageError;
  text('measurement-error', error ? errorText(error) : '');
  $('retry-save').hidden = !state.unsaved;
  $('discard-session').hidden = !state.unsaved;
  for (const id of ['current-json', 'current-csv']) $(id).disabled = busy || !session?.samples.length;
  drawChart($('acquisition-chart'), session, channel?.id, {live:state.active});
  drawChart($('overview-chart'), session, channel?.id, {live:state.active});
  renderAnalysis(session);
  if (!state.active && !state.saving && !state.unsaved && state.session?.samples.length && refreshedId !== state.session.id) {
    refreshedId = state.session.id; void refreshHistory();
  }
}
function scheduleRender() { if (!renderTimer) renderTimer = setTimeout(render, 200); }
controller.subscribe(scheduleRender);
function filteredSessions(){
 try{return filterSessions(sessions,{days:$('range-select').value,from:$('history-from').value,to:$('history-to').value,source:$('history-source').value});}
 catch{return [];}
}
function invalidDates(){return $('history-from').value&&$('history-to').value&&$('history-from').value>$('history-to').value;}
function renderHistory() {
  for(const id of ['history-from','history-to'])$(id).setAttribute('aria-invalid',String(!!invalidDates()));
  const filtered = filteredSessions();
  $('history-count').textContent = number(filtered.length);
  $('history-samples').textContent = number(filtered.reduce((n,s) => n+s.samples.length,0));
  $('history-duration').textContent = `${number(filtered.reduce((n,s) => n + (s.derived?.durationMs || 0),0) / 1000)} ${t('seconds')}`;
  $('trend-range-title').textContent = t(['7','30'].includes($('range-select').value)?$('range-select').value==='30'?'month':'week':'allRecordings');
  $('history-status').textContent = invalidDates()?t('dateRange'):storageError?errorText(storageError):filtered.length?'':t('emptyHistory');
  if (!filtered.some(s => s.id === selectedId)) selectedId = filtered[0]?.id || null;
  $('session-list').replaceChildren(...filtered.map(s => {
    const button = document.createElement('button'); button.className = 'session-choice'; button.type = 'button';
    button.setAttribute('aria-pressed', String(s.id === selectedId));button.dataset.sessionId=s.id;
    button.textContent = `${date(s.startedAt)} · ${sourceLabel(s)} · ${number(s.samples.length)} ${t('samples')} · ${s.recovered ? t('recovered') : t(s.status)}`;
    button.addEventListener('click', () => { selectedId = s.id; renderHistory(); }); return button;
  }));
  renderSelected();renderActivity(filtered);renderRecent();
}
function openSession(id){selectedId=id;$('range-select').value='all';$('history-from').value='';$('history-to').value='';$('history-source').value='all';document.querySelector('[data-view="trends"]').click();renderHistory();}
function renderRecent(){
 $('overview-recent').replaceChildren();$('overview-ai').disabled=!sessions.length;
 if(!sessions.length){const p=document.createElement('p');p.textContent=t('emptyHistory');$('overview-recent').append(p);return;}
 for(const session of sessions.slice(0,3)){const b=document.createElement('button');b.className='recent-recording';b.textContent=`${date(session.startedAt)} · ${sourceLabel(session)} · ${quality(session.derived)}`;b.addEventListener('click',()=>openSession(session.id));$('overview-recent').append(b);}
}
function renderActivity(filtered){
 const a=recordingAnalytics(filtered),es=language()==='es';$('activity-summary').textContent=es?`${a.count} grabaciones · ${a.activeDays} días con grabación · ${a.withGaps} con intervalos ausentes · ${a.missing} muestras faltantes`:`${a.count} recordings · ${a.activeDays} recording days · ${a.withGaps} with gaps · ${a.missing} missing samples`;
 $('activity-chart').replaceChildren();
 for(const day of a.days){const b=document.createElement('button');b.className='activity-day';b.textContent=`${day.day}: ${day.count}`;b.title=es?'Ver grabaciones de este día':'Show recordings from this day';b.style.setProperty('--activity',String(day.count/Math.max(...a.days.map(d=>d.count),1)));b.addEventListener('click',()=>{$('range-select').value='all';$('history-from').value=day.day;$('history-to').value=day.day;renderHistory();});$('activity-chart').append(b);}
 const table=document.createElement('table'),head=document.createElement('tr');for(const value of [t('sessionAt'),t('source'),t('accepted'),t('missing'),t('rejected'),t('timingGaps')]){const th=document.createElement('th');th.textContent=value;head.append(th);}table.append(head);
 for(const row of a.rows){const tr=document.createElement('tr');for(const value of [date(row.startedAt),sourceLabel(filtered.find(s=>s.id===row.id)),row.accepted,row.missing,row.rejected,row.timingGaps]){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}table.append(tr);}$('quality-trends').replaceChildren(table);
}
function previewReport(content){$('report-preview-frame').srcdoc=content;$('report-print').disabled=true;$('report-print-status').textContent='';$('report-preview').showModal();}
function compared(){return [sessions.find(s=>s.id===selectedId),sessions.find(s=>s.id===compareId)];}
function askAria(ids,prompt='Explain this recording using its reviewed engineering summary.',analysis=true){document.querySelector('[data-view="care"]').click();document.dispatchEvent(new CustomEvent('arteria-explain-session',{detail:{ids:Array.isArray(ids)?ids:[ids],prompt,analysis}}));}
function renderSelected() {
  const session = filteredSessions().find(s => s.id === selectedId);
  populateChannels($('history-channel'), session);
  $('history-selection').textContent = session ? `${t('sessionAt')}: ${date(session.startedAt)} · ${sourceLabel(session)} · ${quality(session.derived)}` : '';
  for (const id of ['history-json','history-csv','history-delete','history-replay','history-report','history-preview','history-explain','save-session-notes']) $(id).disabled = !session;
  drawChart($('history-chart'), session, $('history-channel').value);
  $('session-notes').disabled=!session;
  $('session-notes').value=session?(notesDrafts.get(session.id)??session.notes??''):'';
  $('notes-status').textContent=notesDrafts.has(session?.id)?t('notesUnsaved'):'';
  renderComparison(session);
}
function renderComparison(primary) {
  const candidates=filteredSessions().filter(s=>s.id!==primary?.id),select=$('compare-session');
  if(!candidates.some(s=>s.id===compareId))compareId=null;
  select.replaceChildren(new Option(t('chooseComparison'),''),...candidates.map(s=>new Option(`${date(s.startedAt)} · ${sourceLabel(s)}`,s.id)));
  select.value=compareId||'';const other=candidates.find(s=>s.id===compareId);
  $('comparison-panel').hidden=!primary||!other;
  populateChannels($('compare-channel'),other);
  if(!primary||!other)return;
  const a=processSamples(primary.samples,primary.descriptor,primary.rejected),b=processSamples(other.samples,other.descriptor,other.rejected);
  const table=document.createElement('table');
  const rows=[[t('metric'),t('selectedSession'),t('comparisonSession')],[t('duration'),`${number(a.durationMs/1000)} s`,`${number(b.durationMs/1000)} s`],[t('accepted'),number(a.accepted),number(b.accepted)],[t('rejected'),number(a.rejected),number(b.rejected)],[t('quality'),quality(a),quality(b)],[t('channel'),primary.descriptor.channels.map(c=>`${c.label} (${c.unit})`).join(', '),other.descriptor.channels.map(c=>`${c.label} (${c.unit})`).join(', ')]];
  rows.forEach((values,i)=>{const row=document.createElement('tr');values.forEach(value=>{const cell=document.createElement(i===0?'th':'td');cell.textContent=value;row.append(cell);});table.append(row);});
  $('comparison-stats').replaceChildren(table);$('compare-a-source').textContent=`${date(primary.startedAt)} · ${sourceLabel(primary)}`;$('compare-b-source').textContent=`${date(other.startedAt)} · ${sourceLabel(other)}`;
  drawChart($('compare-a-chart'),primary,$('history-channel').value);drawChart($('compare-b-chart'),other,$('compare-channel').value);
}
async function refreshHistory() {
  try { sessions = await store.list(); storageError = null; }
  catch (error) { storageError = error.message; }
  renderHistory(); scheduleRender();
}
function sourceControls() {
  const replay = $('source-select').value === 'replay';
  $('replay-control').hidden = !replay; $('replay-speed-control').hidden = !replay;
  $('scenario-control').hidden = replay || $('source-select').value === 'mock'; $('duration-control').hidden = replay;
  $('replay-description').textContent = recording ? `${t('imported')}: ${date(recording.startedAt)} · ${recording.descriptor.origin === 'simulated' ? t('originSim') : t('originHardware')} · ${number(recording.samples.length)} ${t('samples')}` : t('recordingFile');
  scheduleRender();
}
$('source-select').addEventListener('change', sourceControls);
$('session-notes').addEventListener('input',()=>{if(selectedId){notesDrafts.set(selectedId,$('session-notes').value);$('notes-status').textContent=t('notesUnsaved');}});
$('save-session-notes').addEventListener('click',async()=>{
  const id=selectedId;if(!id)return;const value=$('session-notes').value;$('save-session-notes').disabled=true;
  try{await store.updateNotes(id,value);notesDrafts.delete(id);if(controller.session?.id===id)controller.session.notes=value;await refreshHistory();if(selectedId===id)$('notes-status').textContent=t('notesSaved');}
  catch{$('notes-status').textContent=errorText('storage');}
  finally{$('save-session-notes').disabled=!selectedId;}
});
$('overview-report').addEventListener('click',()=>download(sessions[0],'html'));
$('history-preview').addEventListener('click',()=>{const session=sessions.find(s=>s.id===selectedId);if(session)previewReport(sessionReport(session,{locale:language()}));});
$('report-preview-frame').addEventListener('load',()=>{$('report-print').disabled=!$('report-preview-frame').srcdoc;});
$('report-print').addEventListener('click',()=>{try{$('report-preview-frame').contentWindow.focus();$('report-preview-frame').contentWindow.print();$('report-print').focus();}catch{$('report-print-status').textContent=language()==='es'?'Descarga el informe y usa Imprimir en el navegador.':'Download the report and use your browser’s Print command.';}});
$('comparison-preview').addEventListener('click',()=>{const [a,b]=compared();if(a&&b)previewReport(comparisonReport(a,b,{locale:language()}));});
$('comparison-report').addEventListener('click',()=>{const [a,b]=compared();if(!a||!b)return;const url=URL.createObjectURL(new Blob([comparisonReport(a,b,{locale:language()})],{type:'text/html'}));const link=document.createElement('a');link.href=url;link.download='arteria-comparison.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('comparison-ai').addEventListener('click',()=>{const [a,b]=compared();if(a&&b)askAria([a.id,b.id]);});
$('overview-ai').addEventListener('click',()=>askAria(sessions.slice(0,2).map(s=>s.id)));
$('analyze-with-ai').addEventListener('click',()=>{const s=currentSession(),other=$('analysis-compare').value,ids=[s?.id,...(other?[other]:[])].filter(Boolean);if(!s?.samples.length)return;const prompt=language()==='es'?`Analiza ${other?'y compara con la segunda':'esta'} grabación usando solo las métricas técnicas compartidas. Resume integridad, frecuencia, variabilidad y comprobaciones. Distingue diferencias medidas de posibles explicaciones; no infieras hallazgos médicos.`:`Analyze ${other?'and compare with the second':'this'} recording using only the shared technical metrics. Summarize completeness, sampling, variability and observed checks. Distinguish measured differences from possible explanations; infer no medical findings.`;askAria(ids,prompt,true);});
$('ask-about-recording').addEventListener('click',()=>{const s=currentSession();if(s?.samples.length)askAria([s.id],language()==='es'?'Explica esta grabación en lenguaje sencillo y dime qué significa la variabilidad de la señal.':'Explain this recording in plain language and tell me what signal variability means.',false);});
$('delete-ai-analysis').addEventListener('click',async()=>{const s=currentSession();if(!s?.analysisReport)return;try{await store.deleteAnalysisReport(s.id);delete s.analysisReport;await refreshHistory();text('analysis-status',language()==='es'?'Se eliminó el análisis guardado en este dispositivo.':'Saved analysis deleted from this device.');}catch{text('analysis-status',errorText('storage'));}});
$('analysis-print').addEventListener('click',()=>{const s=currentSession();if(s)previewReport(sessionReport(s,{locale:language()}));});
$('analysis-json').addEventListener('click',()=>download(currentSession(),'json'));
$('analysis-status').textContent='';
document.addEventListener('arteria-analysis-generated',async event=>{
 const {sessionId,text:reportText,provider:reportProvider,generatedAt,comparisonIds}=event.detail||{};if(!sessionId||!reportText)return;
 const ids=Array.isArray(comparisonIds)?comparisonIds:[],comparisonSessions=ids.map(id=>sessions.find(item=>item.id===id)).filter(Boolean).map(item=>({id:item.id,startedAt:item.startedAt,source:item.descriptor.origin,mode:item.mode,analysis:item.analysis||analyzeSession(item)}));
 const report={version:'ai-analysis-v1',text:reportText,generatedAt:generatedAt||new Date().toISOString(),provider:reportProvider||'AI',model:typeof event.detail?.model==='string'?event.detail.model.slice(0,100):null,comparisonIds:ids,comparisonSessions};
 try{await store.updateAnalysisReport(sessionId,report);const s=sessions.find(item=>item.id===sessionId);if(s)s.analysisReport=report;if(controller.session?.id===sessionId)controller.session.analysisReport=report;await refreshHistory();text('analysis-status',language()==='es'?'Análisis guardado localmente con la grabación.':'Analysis saved locally with the recording.');}
 catch{text('analysis-status',language()==='es'?'La explicación llegó, pero no se pudo guardar localmente.':'The explanation arrived, but could not be saved locally.');}
});
$('report-preview-close').addEventListener('click',()=>$('report-preview').close());
$('report-preview').addEventListener('close',()=>{$('report-preview-frame').srcdoc='';});
$('history-explain').addEventListener('click',()=>{if(!selectedId)return;document.querySelector('[data-view="care"]').click();document.dispatchEvent(new CustomEvent('arteria-explain-session',{detail:selectedId}));});
$('history-report').addEventListener('click',()=>download(sessions.find(s=>s.id===selectedId),'html'));
$('compare-session').addEventListener('change',()=>{compareId=$('compare-session').value||null;renderComparison(filteredSessions().find(s=>s.id===selectedId));});
$('compare-channel').addEventListener('change',()=>renderComparison(filteredSessions().find(s=>s.id===selectedId)));
$('channel-select').addEventListener('change', scheduleRender);
$('history-channel').addEventListener('change', renderSelected);
$('range-select').addEventListener('change', renderHistory);
for(const id of ['history-from','history-to','history-source'])$(id).addEventListener('change',renderHistory);
$('history-reset-filters').addEventListener('click',()=>{$('history-from').value='';$('history-to').value='';$('history-source').value='all';$('range-select').value='7';renderHistory();});
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
    const adapter = replay ? new ReplayAdapter(recording, Number($('replay-speed').value)) : $('source-select').value === 'mock' ? new MockDeviceAdapter() : new SimulationAdapter($('scenario-select').value);
    const durationSeconds = replay ? Math.min(300, Math.max(1, (recording.samples.at(-1).deviceTimeMs-recording.samples[0].deviceTimeMs)/1000/Number($('replay-speed').value)+2)) : Number($('duration-select').value);
    const starting=controller.start(adapter, {durationSeconds});
    render();
    await starting;
    render();
  } catch (error) { uiError = error.message; }
  scheduleRender();
});
$('pause-button').addEventListener('click',()=>{controller.togglePause();scheduleRender();});
$('stop-button').addEventListener('click', () => void controller.stop());
$('retry-save').addEventListener('click', async () => { await controller.save(); if (!controller.unsaved) { refreshedId = null; await refreshHistory(); } scheduleRender(); });
$('discard-session').addEventListener('click', () => { if (confirm(t('deleteConfirm'))) { controller.discardUnsaved(); scheduleRender(); } });
$('recover-sessions').addEventListener('click',async()=>{
  if(controller.active||controller.saving)return;
  if(!navigator.locks&&!confirm(t('manualRecoveryConfirm')))return;
  try{recoveredCount+=await store.recover({exclusive:!navigator.locks});uiError=store.recoveryErrors?'recovery':null;await refreshHistory();}
  catch(error){uiError=error.message;}
  scheduleRender();
});
$('delete-all-sessions').addEventListener('click', async () => {
  if (controller.active || controller.saving || !confirm(t('deleteAllConfirm'))) return;
  try { await clearRecordings(); }
  catch(error){uiError=error.message;}
  scheduleRender();
});
$('current-json').addEventListener('click', () => download(currentSession(), 'json'));
$('current-csv').addEventListener('click', () => download(currentSession(), 'csv'));
for (const format of ['json','csv']) $('history-'+format).addEventListener('click', () => download(sessions.find(s => s.id === selectedId), format));
$('history-delete').addEventListener('click', async () => {
  if (!selectedId || !confirm(t('deleteConfirm'))) return;
  try { await store.delete(selectedId);notesDrafts.delete(selectedId); if (controller.session?.id === selectedId && !controller.active) controller.discardUnsaved(); selectedId = null; uiError = null; await refreshHistory(); }
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
document.addEventListener('arteria-view',event=>requestAnimationFrame(()=>{render();if(event.detail==='trends')renderHistory();}));
window.addEventListener('resize',()=>{scheduleRender();renderSelected();});
window.addEventListener('beforeunload', event => { if (controller.active || controller.saving || controller.unsaved || notesDrafts.size) { event.preventDefault(); event.returnValue = ''; } });
document.addEventListener('visibilitychange',()=>{if(document.hidden)void controller.checkpoint();});
window.addEventListener('pagehide',()=>{void controller.checkpoint();});
$('duration-select').value=String(loadPreferences().duration);
document.addEventListener('arteria-preferences',event=>{
  if(event.detail?.durationChanged){
    if(!controller.active&&!controller.saving)$('duration-select').value=String(loadPreferences().duration);
    else pendingDurationPreference=true;
  }
  render();renderSelected();
});
localize(); render();
void (async()=>{
  try { recoveredCount=await store.recover();if(store.recoveryErrors)uiError='recovery'; } catch(error) { storageError=error.message; }
  await refreshHistory();ready=true;render();
})();
