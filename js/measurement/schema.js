// This is Arteria's internal interchange schema, NOT an assumed device wire protocol.
export const VERSION = 1;
export const LIMITS = Object.freeze({samples: 100000, channels: 8, frameBytes: 16384, fileBytes: 24 * 1024 * 1024});
export const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const identifier = /^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/;
export function validateDescriptor(value) {
  if (!isObject(value) || value.schemaVersion !== VERSION) throw new Error('schema');
  if (!['simulated', 'hardware'].includes(value.origin)) throw new Error('origin');
  if (typeof value.deviceId !== 'string' || !value.deviceId.trim() || value.deviceId.length > 100) throw new Error('device');
  if (typeof value.deviceName !== 'string' || !value.deviceName.trim() || value.deviceName.length > 100) throw new Error('device');
  if (!Number.isFinite(value.sampleRateHz) || value.sampleRateHz <= 0 || value.sampleRateHz > 5000) throw new Error('sampleRate');
  if (!Array.isArray(value.channels) || !value.channels.length || value.channels.length > LIMITS.channels) throw new Error('channels');
  const names = new Set();
  const channels = value.channels.map(channel => {
    if (!isObject(channel) || !identifier.test(channel.id) || names.has(channel.id)) throw new Error('channels');
    names.add(channel.id);
    if (typeof channel.label !== 'string' || !channel.label.trim() || channel.label.length > 80 || typeof channel.unit !== 'string' || !channel.unit.trim() || channel.unit.length > 30) throw new Error('channels');
    const c = {id: channel.id, label: channel.label, unit: channel.unit};
    for (const key of ['min', 'max']) if (channel[key] !== undefined) {
      if (!Number.isFinite(channel[key])) throw new Error('channels');
      c[key] = channel[key];
    }
    if (c.min !== undefined && c.max !== undefined && c.min >= c.max) throw new Error('channels');
    return c;
  });
  return {schemaVersion: VERSION, origin: value.origin, deviceId: value.deviceId, deviceName: value.deviceName, sampleRateHz: value.sampleRateHz, channels};
}
