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
  const header = ['session_id', 'origin', 'mode', 'device_id', 'started_at', 'descriptor_json', 'rejected_count', 'sequence', 'device_time_ms', 'received_at', 'original_received_at', 'battery_percent', ...session.descriptor.channels.map(c => `${c.id} [${c.unit}]`),...metadata,...channelMetrics];
  const descriptor=JSON.stringify(session.descriptor);
  return [header, ...session.samples.map(s => [session.id, session.descriptor.origin, session.mode, session.descriptor.deviceId, session.startedAt, descriptor, session.rejected||0, s.sequence, s.deviceTimeMs, s.receivedAt, s.originalReceivedAt, s.batteryPercent, ...session.descriptor.channels.map(c => s.raw[c.id]),a.durationSeconds,a.nominalSampleRateHz,a.effectiveSampleRateHz,a.completenessPercent,...session.descriptor.channels.flatMap(c=>{const m=a.channels[c.id];return[m.mean,m.stddev,m.range];})])].map(row => row.map(csvCell).join(',')).join('\r\n');
}

function parseCSVRows(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;continue;}
    if(ch==='"'){if(cell)throw new Error('csv');quoted=true;}
    else if(ch===','){row.push(cell);cell='';}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(v=>v!==''))rows.push(row);row=[];}
    else cell+=ch;
  }
  if(quoted)throw new Error('csv');row.push(cell);if(row.some(v=>v!==''))rows.push(row);
  return rows;
}
function importCSV(text){
  let rows;try{rows=parseCSVRows(text);}catch(error){throw error.message==='csv'?error:new Error('csv');}
  if(rows.length<2||rows.length>LIMITS.samples+1)throw new Error('samples');
  const headers=rows.shift();if(new Set(headers).size!==headers.length)throw new Error('csv');
  const at=Object.fromEntries(headers.map((h,i)=>[h,i]));
  for(const key of ['session_id','origin','mode','device_id','started_at','descriptor_json','rejected_count','sequence','device_time_ms','received_at'])if(!Object.hasOwn(at,key))throw new Error('csvSchema');
  const records=rows.map(row=>{if(row.length!==headers.length)throw new Error('csv');return row;});
  const first=records[0],field=name=>first[at[name]];
  let descriptor;try{descriptor=validateDescriptor(JSON.parse(field('descriptor_json')));}catch{throw new Error('channels');}
  if(descriptor.origin!==field('origin')||descriptor.deviceId!==field('device_id')||!['stream','replay'].includes(field('mode')))throw new Error('origin');
  const channelColumns=descriptor.channels.map(c=>`${c.id} [${c.unit}]`);
  for(const name of channelColumns)if(!Object.hasOwn(at,name))throw new Error('channels');
  const stable=['session_id','origin','mode','device_id','started_at','descriptor_json','rejected_count'];
  for(const row of records)for(const name of stable)if(row[at[name]]!==field(name))throw new Error('csvSchema');
  const startedAt=field('started_at');if(!Number.isFinite(Date.parse(startedAt)))throw new Error('timestamp');
  const numeric=(row,name,optional=false)=>{const value=row[at[name]];if(optional&&value==='')return undefined;if(value===''||!Number.isFinite(Number(value)))throw new Error(name==='sequence'?'sequence':name.includes('time')?'timestamp':'value');return Number(value);};
  const samples=[];let previous=null,previousReceipt=-Infinity;
  for(const row of records){
    const raw=Object.fromEntries(descriptor.channels.map(c=>[c.id,numeric(row,`${c.id} [${c.unit}]`)]));
    const sample=validateSample({sequence:numeric(row,'sequence'),deviceTimeMs:numeric(row,'device_time_ms'),raw,...(Object.hasOwn(at,'battery_percent')&&row[at.battery_percent]!==''?{batteryPercent:numeric(row,'battery_percent')}: {})},descriptor,previous);previous=sample;
    const received=row[at.received_at];if(!Number.isFinite(Date.parse(received))||Date.parse(received)<previousReceipt)throw new Error('timestamp');previousReceipt=Date.parse(received);sample.receivedAt=new Date(received).toISOString();
    if(Object.hasOwn(at,'original_received_at')&&row[at.original_received_at]){const original=row[at.original_received_at];if(!Number.isFinite(Date.parse(original)))throw new Error('timestamp');sample.originalReceivedAt=new Date(original).toISOString();}
    samples.push(sample);
  }
  const rejected=Number(field('rejected_count'));if(!Number.isSafeInteger(rejected)||rejected<0)throw new Error('value');
  const session={id:field('session_id').slice(0,100)||'imported-csv',schemaVersion:VERSION,descriptor,mode:field('mode'),startedAt:new Date(startedAt).toISOString(),endedAt:null,samples,rejected,derived:processSamples(samples,descriptor,rejected)};session.analysis=analyzeSession(session);return session;
}
export function importSession(text) {
  if (new TextEncoder().encode(text).length > LIMITS.fileBytes) throw new Error('fileSize');
  if(!text.trimStart().startsWith('{'))return importCSV(text);
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
