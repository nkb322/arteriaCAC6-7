import {processSamples} from '../measurement/processing.js';
import {analyzeSession} from '../measurement/analysis.js';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const finite=v=>Number.isFinite(v)&&Math.abs(v)<=1e100;
const count=v=>Number.isSafeInteger(v)&&v>=0&&v<=100000000;
export function validateSummary(value){
 if(!object(value)||!['simulated','hardware'].includes(value.origin)||!['stream','replay'].includes(value.mode)||!finite(value.durationSeconds)||value.durationSeconds<0||value.durationSeconds>1e9)throw Error('session');
 const result={origin:value.origin,mode:value.mode,durationSeconds:value.durationSeconds};
 for(const key of ['accepted','rejected','missing','timingGaps']){if(!count(value[key]))throw Error('session');result[key]=value[key];}
 for(const key of ['nominalSampleRateHz','effectiveSampleRateHz','missingPercent','completenessPercent'])if(value[key]!==undefined){if(value[key]!==null&&!finite(value[key]))throw Error('session');if(key.endsWith('Percent')&&(value[key]<0||value[key]>100))throw Error('session');result[key]=value[key];}
 if(!Array.isArray(value.channels)||!value.channels.length||value.channels.length>8)throw Error('session');
 result.channels=value.channels.map(c=>{
  if(!object(c)||typeof c.label!=='string'||!c.label.trim()||c.label.length>80||typeof c.unit!=='string'||!c.unit.trim()||c.unit.length>30)throw Error('session');
  const r={label:c.label,unit:c.unit};
  for(const key of ['mean','min','max']){if(!finite(c[key]))throw Error('session');r[key]=c[key];}
  for(const key of ['stddev','range','firstHalfStddev','secondHalfStddev'])if(c[key]!==undefined){if(c[key]!==null&&!finite(c[key]))throw Error('session');if(c[key]!==null&&c[key]<0)throw Error('session');r[key]=c[key];}
  if(r.min>r.max||r.mean<r.min||r.mean>r.max)throw Error('session');
  for(const key of ['clipped','stepJumps']){if(!count(c[key]))throw Error('session');r[key]=c[key];}
  if(typeof c.flatline!=='boolean')throw Error('session');r.flatline=c.flatline;return r;
 });
 return result;
}
export function sessionSummary(session){
 if(!session?.samples?.length)throw Error('session');
 const d=processSamples(session.samples,session.descriptor,session.rejected),a=session.analysis||analyzeSession(session);
 return validateSummary({origin:session.descriptor.origin,mode:session.mode,durationSeconds:d.durationMs/1000,accepted:d.accepted,rejected:d.rejected,missing:d.missing,timingGaps:d.timingGaps,
  nominalSampleRateHz:a.nominalSampleRateHz,effectiveSampleRateHz:a.effectiveSampleRateHz,missingPercent:a.missingPercent,completenessPercent:a.completenessPercent,
  channels:session.descriptor.channels.map(c=>({label:c.label,unit:c.unit,mean:d.channels[c.id].mean,min:d.channels[c.id].min,max:d.channels[c.id].max,stddev:a.channels[c.id].stddev,range:a.channels[c.id].range,firstHalfStddev:a.channels[c.id].firstHalfStddev,secondHalfStddev:a.channels[c.id].secondHalfStddev,clipped:d.channels[c.id].clipped,stepJumps:d.channels[c.id].stepJumps||0,flatline:d.channels[c.id].flatline}))});
}
