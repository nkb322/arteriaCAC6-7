// Descriptive engineering statistics only. No diagnostic score or inferred vital signs.
export function processSamples(samples, descriptor, rejected = 0) {
  let missing = 0, timingGaps = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    missing += b.sequence - a.sequence - 1;
    if (b.deviceTimeMs - a.deviceTimeMs > (1000 / descriptor.sampleRateHz) * 1.8) timingGaps++;
  }
  const channels = {};
  for (const channel of descriptor.channels) {
    let mean = 0, m2 = 0, min = Infinity, max = -Infinity, clipped = 0;
    samples.forEach((sample, i) => {
      const v = sample.raw[channel.id], d = v - mean;
      mean += d / (i + 1); m2 += d * (v - mean); min = Math.min(min, v); max = Math.max(max, v);
      if (v === channel.min || v === channel.max) clipped++;
    });
    const recent = samples.slice(-Math.max(20, Math.ceil(descriptor.sampleRateHz)));
    const flatline = recent.length >= Math.max(20, Math.ceil(descriptor.sampleRateHz)) && recent.every(s => s.raw[channel.id] === recent[0].raw[channel.id]);
    channels[channel.id] = {count: samples.length, mean: samples.length ? mean : null, min: samples.length ? min : null, max: samples.length ? max : null, stddev: samples.length ? Math.sqrt(m2 / samples.length) : null, clipped, flatline};
  }
  return {algorithm: 'descriptive-v1', accepted: samples.length, rejected, missing, timingGaps, durationMs: samples.length > 1 ? samples.at(-1).deviceTimeMs - samples[0].deviceTimeMs : 0, channels};
}
