import {VERSION, LIMITS, validateDescriptor} from './schema.js';
import {validateSample} from './validator.js';
import {FrameParser} from './parser.js';
import {processSamples} from './processing.js';

export class MeasurementController {
  constructor({store, now = () => Date.now(), autoTick = true} = {}) {
    this.store = store; this.now = now; this.autoTick = autoTick;
    this.status = 'disconnected'; this.session = null; this.active = false;
    this.listeners = new Set(); this.generation = 0; this.error = null; this.unsaved = false;
    this.saving = false; this.pendingStop = null;
  }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit() { for (const listener of this.listeners) listener(); }
  snapshot() {
    const session = this.session;
    return {status: this.status, active: this.active, saving: this.saving, unsaved: this.unsaved, error: this.error, session,
      elapsedMs: this.active ? this.now() - this.startTime : this.elapsedMs || 0,
      derived: session ? processSamples(session.samples, session.descriptor, session.rejected) : null};
  }
  async start(adapter, {durationSeconds = 20} = {}) {
    if (this.active || this.saving || this.pendingStop) throw new Error('busy');
    if (this.unsaved) throw new Error('storage');
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 300) throw new Error('duration');
    const descriptor = validateDescriptor(adapter.descriptor);
    if (!['stream', 'replay'].includes(adapter.mode) || typeof adapter.start !== 'function' || typeof adapter.stop !== 'function') throw new Error('adapter');
    const token = ++this.generation;
    this.adapter = adapter; this.startTime = this.now(); this.durationMs = durationSeconds * 1000;
    this.lastReceived = null; this.status = 'connecting'; this.error = null; this.unsaved = false; this.active = true;
    this.session = {id: crypto.randomUUID(), schemaVersion: VERSION, descriptor, mode: adapter.mode,
      startedAt: new Date(this.startTime).toISOString(), endedAt: null, status: 'recording', samples: [], rejected: 0, rejectionReasons: {}, derived: null};
    if (adapter.mode === 'replay' && adapter.recording) this.session.replayOf = {startedAt: adapter.recording.startedAt, origin: descriptor.origin};
    const reject = reason => {
      if (!this.active || token !== this.generation) return;
      this.session.rejected++; this.session.rejectionReasons[reason] = (this.session.rejectionReasons[reason] || 0) + 1; this.emit();
    };
    const accept = value => {
      if (!this.active || token !== this.generation) return;
      try {
        if (this.session.samples.length >= LIMITS.samples) { void this.stop('sampleLimit'); return; }
        const sample = validateSample(value, descriptor, this.session.samples.at(-1));
        sample.receivedAt = new Date(this.now()).toISOString();
        if (adapter.mode === 'replay' && typeof value.receivedAt === 'string') sample.originalReceivedAt = value.originalReceivedAt || value.receivedAt;
        this.session.samples.push(sample); this.lastReceived = this.now();
        this.status = descriptor.origin === 'simulated' ? 'demo' : adapter.mode === 'replay' ? 'replay' : 'live'; this.emit();
      } catch (error) { reject(error.message); }
    };
    this.parser = null;
    try {
      this.parser = adapter.createParser ? adapter.createParser(accept, reject) : new FrameParser(accept, reject);
      if (typeof this.parser?.push !== 'function' || typeof this.parser?.finish !== 'function') throw new Error('adapter');
      this.emit();
      if (this.autoTick) this.timer = setInterval(() => this.tick(), 100);
      await adapter.start({onChunk: chunk => {
        if (token !== this.generation || !this.active) return;
        try { this.parser.push(chunk); } catch { reject('decoder'); }
      },
        onEnd: () => { if (token === this.generation && this.active) void this.stop('complete'); },
        onError: () => { if (token === this.generation && this.active) void this.stop('connection'); }});
      if (token !== this.generation || !this.active) return;
      this.tick();
    } catch {
      if (this.active && token === this.generation) await this.stop('connection');
    }
  }
  tick() {
    if (!this.active) return;
    const elapsed = this.now() - this.startTime;
    const staleAfterMs = Math.max(1500, 5000 / this.session.descriptor.sampleRateHz);
    if (this.now() - (this.lastReceived ?? this.startTime) > staleAfterMs) this.status = 'stale';
    if (elapsed >= this.durationMs) void this.stop('complete');
    this.emit();
  }
  stop(reason = 'stopped') {
    if (this.pendingStop) return this.pendingStop;
    if (!this.active) return Promise.resolve();
    // Drain partial frames while the generation is still active, then invalidate every callback.
    try { this.parser?.finish?.(); }
    catch { this.session.rejected++; this.session.rejectionReasons.decoder = (this.session.rejectionReasons.decoder || 0) + 1; }
    this.active = false; ++this.generation; clearInterval(this.timer);
    this.elapsedMs = Math.max(0, this.now() - this.startTime);
    const session = this.session;
    session.endedAt = new Date(this.now()).toISOString();
    session.status = reason === 'complete' && session.samples.length ? 'completed' : reason === 'stopped' ? 'stopped' : 'interrupted';
    session.derived = processSamples(session.samples, session.descriptor, session.rejected);
    this.status = ['connection', 'sampleLimit'].includes(reason) ? 'error' : 'disconnected';
    this.error = ['connection', 'sampleLimit'].includes(reason) ? reason : !session.samples.length ? 'noSamples' : null;
    this.saving = Boolean(session.samples.length); this.emit();
    this.pendingStop = (async () => {
      try { await this.adapter.stop(); } catch { this.error = 'disconnect'; this.status = 'error'; }
      if (session.samples.length) await this.save();
    })().finally(() => { this.saving = false; this.pendingStop = null; this.emit(); });
    return this.pendingStop;
  }
  discardUnsaved() {
    if (this.active || this.saving) throw new Error('busy');
    this.session = null; this.unsaved = false; this.error = null; this.status = 'disconnected'; this.emit();
  }
  async save() {
    if (!this.session?.samples.length) return;
    try { await this.store.save(structuredClone(this.session)); this.unsaved = false; if (this.error === 'storage') this.error = null; }
    catch { this.unsaved = true; this.error = 'storage'; }
    this.emit();
  }
}
