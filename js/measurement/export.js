import {LIMITS, VERSION, isObject, validateDescriptor} from './schema.js';
import {validateSample} from './validator.js';
import {processSamples} from './processing.js';
import {analyzeSession} from './analysis.js';
const sessionAnalysis=session=>session.analysis||analyzeSession(session);
export function exportJSON(session) { return JSON.stringify({format: 'arteria-session', version: VERSION, session}); }
const csvCell = value => {
  let text=String(value ?? '');
  if(typeof value!=='number' && /^[\s\u0000-\u001f]*[=+@\-]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
};
export function exportCSV(session) {
  const a=sessionAnalysis(session),metadata=['recording_duration_s','nominal_sample_rate_hz','effective_sample_rate_hz','estimated_completeness_percent'];
  const channelMetrics=session.descriptor.channels.flatMap(c=>[`${c.id}_mean [${c.unit}]`,`${c.id}_stddev [${c.unit}]`,`${c.id}_range [${c.unit}]`]);
  const header = ['session_id', 'origin', 'mode', 'device_id', 'sequence', 'device_time_ms', 'received_at', 'original_received_at', 'battery_percent', ...session.descriptor.channels.map(c => `${c.id} [${c.unit}]`),...metadata,...channelMetrics];
  return [header, ...session.samples.map(s => [session.id, session.descriptor.origin, session.mode, session.descriptor.deviceId, s.sequence, s.deviceTimeMs, s.receivedAt, s.originalReceivedAt, s.batteryPercent, ...session.descriptor.channels.map(c => s.raw[c.id]),a.durationSeconds,a.nominalSampleRateHz,a.effectiveSampleRateHz,a.completenessPercent,...session.descriptor.channels.flatMap(c=>{const m=a.channels[c.id];return[m.mean,m.stddev,m.range];})])].map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function importSession(text) {
  if (new TextEncoder().encode(text).length > LIMITS.fileBytes) throw new Error('fileSize');
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('json'); }
  if (!isObject(data) || data.format !== 'arteria-session' || data.version !== VERSION || !isObject(data.session)) throw new Error('schema');
  const s = data.session;
  if (s.schemaVersion !== VERSION) throw new Error('schema');
  const descriptor = validateDescriptor(s.descriptor);
  if (!Array.isArray(s.samples) || !s.samples.length || s.samples.length > LIMITS.samples) throw new Error('samples');
  if (!['stream', 'replay'].includes(s.mode) || typeof s.startedAt !== 'string' || !Number.isFinite(Date.parse(s.startedAt))) throw new Error('schema');
  let previous = null, previousReceipt = Date.parse(s.startedAt), previousOriginal = -Infinity;
  const samples = s.samples.map(value => {
    const sample = validateSample(value, descriptor, previous); previous = sample;
    if (typeof value.receivedAt !== 'string' || !Number.isFinite(Date.parse(value.receivedAt))) throw new Error('timestamp');
    if(Date.parse(value.receivedAt)<previousReceipt)throw new Error('timestamp');
    previousReceipt=Date.parse(value.receivedAt);sample.receivedAt = new Date(value.receivedAt).toISOString();
    if (value.originalReceivedAt !== undefined) {
      if (typeof value.originalReceivedAt !== 'string' || !Number.isFinite(Date.parse(value.originalReceivedAt))) throw new Error('timestamp');
      if(Date.parse(value.originalReceivedAt)<previousOriginal)throw new Error('timestamp');
      previousOriginal=Date.parse(value.originalReceivedAt);sample.originalReceivedAt = new Date(value.originalReceivedAt).toISOString();
    }
    return sample;
  });
  if(s.notes!==undefined && (typeof s.notes!=='string'||s.notes.length>2000))throw new Error('notes');
  const session={id:typeof s.id==='string'&&s.id.length<=100?s.id:'imported-session',notes:s.notes||'',descriptor,mode:s.mode,startedAt:new Date(s.startedAt).toISOString(),endedAt:typeof s.endedAt==='string'&&Number.isFinite(Date.parse(s.endedAt))?new Date(s.endedAt).toISOString():null,samples,rejected:Number.isSafeInteger(s.rejected)&&s.rejected>=0?s.rejected:0,derived:processSamples(samples,descriptor)};
  session.analysis=analyzeSession(session);
  if(s.analysisReport&&s.analysisReport.version==='ai-analysis-v1'&&typeof s.analysisReport.text==='string'&&s.analysisReport.text.length<=4000&&Number.isFinite(Date.parse(s.analysisReport.generatedAt))){
    const comparisonSessions=(Array.isArray(s.analysisReport.comparisonSessions)?s.analysisReport.comparisonSessions:[]).slice(0,2).flatMap(item=>{
      const a=item?.analysis;if(!item||typeof item.id!=='string'||!Number.isFinite(Date.parse(item.startedAt))||!['simulated','hardware'].includes(item.source)||!['stream','replay'].includes(item.mode)||!a||typeof a!=='object'||!a.channels||!Number.isFinite(a.durationSeconds)||!Number.isFinite(a.completenessPercent))return[];
      const channels=Object.values(a.channels);if(!channels.length||channels.length>8||channels.some(c=>typeof c.label!=='string'||typeof c.unit!=='string'||!Number.isFinite(c.mean)||!Number.isFinite(c.stddev)||!Number.isFinite(c.range)))return[];
      return[{id:item.id,startedAt:new Date(item.startedAt).toISOString(),source:item.source,mode:item.mode,analysis:{durationSeconds:a.durationSeconds,completenessPercent:a.completenessPercent,channels:channels.map(c=>({label:c.label.slice(0,80),unit:c.unit.slice(0,30),mean:c.mean,stddev:c.stddev,range:c.range}))}}];
    });
    session.analysisReport={version:'ai-analysis-v1',text:s.analysisReport.text,generatedAt:new Date(s.analysisReport.generatedAt).toISOString(),provider:typeof s.analysisReport.provider==='string'?s.analysisReport.provider.slice(0,80):'AI',model:typeof s.analysisReport.model==='string'?s.analysisReport.model.slice(0,100):null,comparisonIds:Array.isArray(s.analysisReport.comparisonIds)?s.analysisReport.comparisonIds.filter(v=>typeof v==='string').slice(0,2):[],comparisonSessions};
  }
  return session;
}
