import {t, language} from './i18n.js';
const ns = 'http://www.w3.org/2000/svg';
function svgElement(name, attrs) { const el = document.createElementNS(ns, name); for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value); return el; }
export function drawChart(container, session, channelId, {live = false} = {}) {
  container.replaceChildren();
  const channel = session?.descriptor.channels.find(c => c.id === channelId) || session?.descriptor.channels[0];
  if (!session?.samples.length || !channel) { const note = document.createElement('p'); note.className = 'chart-empty'; note.textContent = t('noData'); container.append(note); return; }
  const samples = live ? session.samples.slice(-500) : session.samples;
  let min = Infinity, max = -Infinity;
  for (const sample of samples) { min = Math.min(min, sample.raw[channel.id]); max = Math.max(max, sample.raw[channel.id]); }
  const padding = Math.max((max - min) * .1, 1); min -= padding; max += padding;
  const first = samples[0].deviceTimeMs, span = Math.max(1, samples.at(-1).deviceTimeMs - first);
  const svg = svgElement('svg', {viewBox:'0 0 760 200', role:'img', 'aria-label':`${channel.label} (${channel.unit}), ${samples.length} ${t('samples')}. ${t('sessionAt')}: ${new Date(session.startedAt).toLocaleString(language())}. ${session.descriptor.origin === 'simulated' ? t('originSim') : t('originHardware')}.`});
  for (let i = 0; i < 4; i++) svg.append(svgElement('line', {x1:55, x2:740, y1:15 + i * 50, y2:15 + i * 50, stroke:'#e6ece9', 'stroke-dasharray':'4 4'}));
  // Bin min/max values, retaining spikes and every discontinuity instead of bridging missing data.
  const stride = Math.max(1, Math.ceil(samples.length / 600));
  let path = '', previousIndex = -1;
  const indices = new Set([0, samples.length - 1]);
  for (let i = 0; i < samples.length; i += stride) {
    let low = i, high = i;
    for (let j = i; j < Math.min(i + stride, samples.length); j++) {
      if (samples[j].raw[channel.id] < samples[low].raw[channel.id]) low = j;
      if (samples[j].raw[channel.id] > samples[high].raw[channel.id]) high = j;
      if (j && (samples[j].sequence > samples[j - 1].sequence + 1 || samples[j].deviceTimeMs - samples[j - 1].deviceTimeMs > 1800 / session.descriptor.sampleRateHz)) { indices.add(j - 1); indices.add(j); }
    }
    indices.add(low); indices.add(high);
  }
  for (const i of [...indices].sort((a, b) => a - b)) {
    const sample = samples[i];
    const gap = previousIndex < 0 || (i > 0 && (sample.sequence > samples[i - 1].sequence + 1 || sample.deviceTimeMs - samples[i - 1].deviceTimeMs > 1800 / session.descriptor.sampleRateHz));
    const x = 55 + (sample.deviceTimeMs - first) / span * 685, y = 165 - (sample.raw[channel.id] - min) / (max - min) * 150;
    path += `${gap ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `; previousIndex = i;
  }
  svg.append(svgElement('path', {d:path, fill:'none', stroke:'#319b82', 'stroke-width':2, 'vector-effect':'non-scaling-stroke'}));
  for (const [x,y,value] of [[3,18,max.toFixed(1)],[3,166,min.toFixed(1)],[55,187,((first - session.samples[0].deviceTimeMs)/1000).toFixed(1)],[700,187,((samples.at(-1).deviceTimeMs-session.samples[0].deviceTimeMs)/1000).toFixed(1)]]) {
    const label=svgElement('text',{x,y,fill:'#667b72','font-size':10});label.textContent=value;svg.append(label);
  }
  const caption = document.createElement('p'); caption.className = 'measurement-note'; caption.textContent = `${channel.label} · ${channel.unit} · ${t('axis')}`;
  container.append(svg, caption);
}
