// Incremental descriptive engineering checks, never a clinical quality/risk score.
export class SignalProcessor {
  constructor(descriptor) {
    this.descriptor = descriptor; this.count = 0; this.missing = 0; this.timingGaps = 0;
    this.channels = Object.fromEntries(descriptor.channels.map(c => [c.id, {mean:0,m2:0,min:Infinity,max:-Infinity,clipped:0,stepJumps:0,run:0,last:null}]));
  }
  add(sample) {
    if (this.previous) {
      this.missing += sample.sequence - this.previous.sequence - 1;
      if (sample.deviceTimeMs - this.previous.deviceTimeMs > 1800 / this.descriptor.sampleRateHz) this.timingGaps++;
    } else this.first = sample;
    this.count++;
    for (const channel of this.descriptor.channels) {
      const s = this.channels[channel.id], v = sample.raw[channel.id], delta = v - s.mean;
      s.mean += delta / this.count; s.m2 += delta * (v - s.mean);
      s.min = Math.min(s.min,v); s.max = Math.max(s.max,v);
      if (v === channel.min || v === channel.max) s.clipped++;
      if(this.previous && sample.sequence===this.previous.sequence+1 && sample.deviceTimeMs-this.previous.deviceTimeMs<=1800/this.descriptor.sampleRateHz && channel.min!==undefined && channel.max!==undefined && Math.abs(v-s.last)>(channel.max-channel.min)*.2)s.stepJumps++;
      s.run = v === s.last ? s.run + 1 : 1; s.last = v;
    }
    this.previous = sample;
  }
  snapshot(rejected = 0) {
    const channels = Object.fromEntries(this.descriptor.channels.map(c => {
      const s = this.channels[c.id];
      return [c.id,{count:this.count,mean:this.count?s.mean:null,min:this.count?s.min:null,max:this.count?s.max:null,
        stddev:this.count?Math.sqrt(Math.max(0,s.m2/this.count)):null,clipped:s.clipped,stepJumps:s.stepJumps,flatline:s.run>=Math.max(20,Math.ceil(this.descriptor.sampleRateHz))}];
    }));
    return {algorithm:'descriptive-v2',accepted:this.count,rejected,missing:this.missing,timingGaps:this.timingGaps,
      durationMs:this.previous ? this.previous.deviceTimeMs-this.first.deviceTimeMs : 0,channels};
  }
}
export function processSamples(samples, descriptor, rejected = 0) {
  const processor = new SignalProcessor(descriptor); for (const sample of samples) processor.add(sample); return processor.snapshot(rejected);
}
