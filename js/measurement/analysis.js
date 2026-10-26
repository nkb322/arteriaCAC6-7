import {processSamples} from './processing.js';

export const ANALYSIS_VERSION = 'technical-analysis-v1';

// Deterministic engineering summary. It never converts arbitrary channel values
// into physiological measurements or assigns a medical score.
export function analyzeSession(session, calculatedAt = new Date().toISOString()) {
  if (!session?.descriptor?.channels || !Array.isArray(session.samples)) throw new Error('session');
  const {descriptor,samples,rejected=0}=session, derived=processSamples(samples,descriptor,rejected);
  const durationSeconds=derived.durationMs/1000;
  const expected=durationSeconds>0?Math.max(samples.length,Math.round(durationSeconds*descriptor.sampleRateHz)+1):samples.length;
  const denominator=samples.length+derived.missing+rejected;
  const channels=Object.fromEntries(descriptor.channels.map(channel=>{
    const c=derived.channels[channel.id], middle=Math.ceil(samples.length/2), first=samples.slice(0,middle).map(s=>s.raw[channel.id]), second=samples.slice(middle).map(s=>s.raw[channel.id]);
    const sd=values=>{if(!values.length)return null;const mean=values.reduce((a,b)=>a+b,0)/values.length;return Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/values.length);};
    const firstStddev=sd(first),secondStddev=sd(second);
    return [channel.id,{label:channel.label,unit:channel.unit,count:c.count,mean:c.mean,stddev:c.stddev,min:c.min,max:c.max,range:c.min===null?null:c.max-c.min,variability:c.stddev,firstHalfStddev:firstStddev,secondHalfStddev:secondStddev,clipped:c.clipped,stepJumps:c.stepJumps,flatline:c.flatline}];
  }));
  return {version:ANALYSIS_VERSION,calculatedAt,source:descriptor.origin,mode:session.mode,durationSeconds,accepted:derived.accepted,rejected:derived.rejected,missing:derived.missing,timingGaps:derived.timingGaps,
    nominalSampleRateHz:descriptor.sampleRateHz,effectiveSampleRateHz:durationSeconds>0?Math.max(0,(samples.length-1)/durationSeconds):null,
    missingPercent:denominator?derived.missing/denominator*100:0,invalidPercent:denominator?rejected/denominator*100:0,
    completenessPercent:expected?samples.length/expected*100:0,expectedSamples:expected,
    channels,signalToNoiseRatio:null,qualityFlags:{missing:derived.missing>0,rejected:rejected>0,timingGaps:derived.timingGaps>0,flatline:Object.values(channels).some(c=>c.flatline),clipping:Object.values(channels).some(c=>c.clipped>0),largeSteps:Object.values(channels).some(c=>c.stepJumps>0)}};
}

export function analysisFallback(analysis, locale='en') {
  const es=locale==='es',number=value=>new Intl.NumberFormat(es?'es':'en',{maximumFractionDigits:2}).format(value);
  const channel=Object.values(analysis.channels)[0];
  if(es)return `La grabación duró ${number(analysis.durationSeconds)} s y contiene ${number(analysis.accepted)} muestras aceptadas (${analysis.source==='simulated'?'origen simulado':'origen de hardware declarado'}). La frecuencia efectiva fue ${analysis.effectiveSampleRateHz===null?'no disponible':number(analysis.effectiveSampleRateHz)+' Hz'}; la integridad estimada fue ${number(analysis.completenessPercent)}%. ${analysis.missing||analysis.rejected||analysis.timingGaps?'Se detectaron datos faltantes, rechazados o intervalos irregulares; revisa las condiciones de captura.':'No se detectaron intervalos faltantes o de tiempo en estas comprobaciones.'}${channel?` La variabilidad (desviación estándar) de ${channel.label} fue ${number(channel.stddev)} ${channel.unit}; describe la dispersión de esta señal, no una medida clínica.`:''} Estos datos de ingeniería no diagnostican ni descartan enfermedades.`;
  const subject=channel?`${channel.label}${/\bsignal\b/i.test(channel.label)?'':' signal'}`:'';
  return `The recording lasted ${number(analysis.durationSeconds)} s and contains ${number(analysis.accepted)} accepted samples (${analysis.source==='simulated'?'simulated source':'declared hardware source'}). Effective sampling was ${analysis.effectiveSampleRateHz===null?'unavailable':number(analysis.effectiveSampleRateHz)+' Hz'}; estimated completeness was ${number(analysis.completenessPercent)}%. ${analysis.missing||analysis.rejected||analysis.timingGaps?'Missing, rejected, or irregularly timed data were detected; review the capture conditions.':'These checks found no missing samples or timing gaps.'}${channel?` ${subject} variability (standard deviation) was ${number(channel.stddev)} ${channel.unit}; this describes signal spread, not a clinical measurement.`:''} These engineering data do not diagnose or rule out disease.`;
}
