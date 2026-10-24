import {LIMITS, VERSION, isObject, validateDescriptor} from './schema.js';
import {validateSample} from './validator.js';
import {processSamples} from './processing.js';
export function exportJSON(session) { return JSON.stringify({format: 'arteria-session', version: VERSION, session}, null, 2); }
const csvCell = value => '"' + String(value ?? '').replaceAll('"', '""').replace(/^[=+@\-]/, "'$&") + '"';
export function exportCSV(session) {
  const header = ['session_id', 'origin', 'mode', 'device_id', 'sequence', 'device_time_ms', 'received_at', 'original_received_at', 'battery_percent', ...session.descriptor.channels.map(c => `${c.id} [${c.unit}]`)];
  return [header, ...session.samples.map(s => [session.id, session.descriptor.origin, session.mode, session.descriptor.deviceId, s.sequence, s.deviceTimeMs, s.receivedAt, s.originalReceivedAt, s.batteryPercent, ...session.descriptor.channels.map(c => s.raw[c.id])])].map(row => row.map(csvCell).join(',')).join('\r\n');
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
  let previous = null;
  const samples = s.samples.map(value => {
    const sample = validateSample(value, descriptor, previous); previous = sample;
    if (typeof value.receivedAt !== 'string' || !Number.isFinite(Date.parse(value.receivedAt))) throw new Error('timestamp');
    sample.receivedAt = new Date(value.receivedAt).toISOString();
    if (value.originalReceivedAt !== undefined) {
      if (typeof value.originalReceivedAt !== 'string' || !Number.isFinite(Date.parse(value.originalReceivedAt))) throw new Error('timestamp');
      sample.originalReceivedAt = new Date(value.originalReceivedAt).toISOString();
    }
    return sample;
  });
  return {descriptor, mode: s.mode, startedAt: new Date(s.startedAt).toISOString(), samples, derived: processSamples(samples, descriptor)};
}
