import {isObject} from './schema.js';
export function validateSample(value, descriptor, previous = null) {
  if (!isObject(value) || !Number.isSafeInteger(value.sequence) || value.sequence < 0) throw new Error('sequence');
  if (!Number.isFinite(value.deviceTimeMs) || value.deviceTimeMs < 0 || value.deviceTimeMs > Number.MAX_SAFE_INTEGER) throw new Error('timestamp');
  if (previous && (value.sequence <= previous.sequence || value.deviceTimeMs <= previous.deviceTimeMs)) throw new Error('order');
  if (!isObject(value.raw) || Object.keys(value.raw).length !== descriptor.channels.length) throw new Error('channels');
  const raw = {};
  for (const channel of descriptor.channels) {
    const v = value.raw[channel.id];
    if (!Object.hasOwn(value.raw, channel.id) || (!Number.isFinite(v) || Math.abs(v) > Number.MAX_SAFE_INTEGER)) throw new Error('value');
    if ((channel.min !== undefined && v < channel.min) || (channel.max !== undefined && v > channel.max)) throw new Error('range');
    raw[channel.id] = v;
  }
  const sample = {sequence: value.sequence, deviceTimeMs: value.deviceTimeMs, raw};
  if (value.batteryPercent !== undefined) {
    if (!Number.isFinite(value.batteryPercent) || value.batteryPercent < 0 || value.batteryPercent > 100) throw new Error('battery');
    sample.batteryPercent = value.batteryPercent;
  }
  return sample;
}
