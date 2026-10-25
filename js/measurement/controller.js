import {VERSION, LIMITS, validateDescriptor} from './schema.js';
import {validateSample} from './validator.js';
import {FrameParser} from './parser.js';
import {processSamples, SignalProcessor} from './processing.js';

export class MeasurementController {
  constructor({store, now, monotonicNow, autoTick = true} = {}) {
    this.store = store; this.now = now || Date.now; this.clock = monotonicNow || now || (() => performance.now()); this.autoTick = autoTick;
    this.checkpointing = null; this.persistedCount = 0;
    this.status = 'disconnected'; this.session = null; this.active = false;
    this.listeners = new Set(); this.generation = 0; this.error = null; this.unsaved = false;
    this.saving = false; this.pendingStop = null;
  }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit() { for (const listener of this.listeners) listener(); }
  snapshot() {
    const session = this.session;
    return {status: this.status, active: this.active, saving: this.saving, unsaved: this.unsaved, error: this.error, session,
      persistedCount:this.persistedCount,
      paused:!!this.paused,
      elapsedMs: this.active ? this.activeElapsed() : this.elapsedMs || 0,
      derived: session ? this.processor.snapshot(session.rejected) : null};
  }
  async start(adapter, {durationSeconds = 20} = {}) {
    if (this.active || this.saving || this.pendingStop) throw new Error('busy');
    if (this.unsaved) throw new Error('storage');
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 300) throw new Error('duration');
    const descriptor = validateDescriptor(adapter.descriptor);
    if (!['stream', 'replay'].includes(adapter.mode) || typeof adapter.start !== 'function' || typeof adapter.stop !== 'function') throw new Error('adapter');
    const token = ++this.generation;
    this.paused=false;this.pausedMs=0;this.adapter = adapter; this.startTime = this.now(); this.startTick = this.clock(); this.lastCheckpoint = this.startTick; this.persistedCount = 0; this.processor = new SignalProcessor(descriptor); this.durationMs = durationSeconds * 1000;
    this.lastReceiptEpoch = 0; this.sessionBytes=16384; this.lastReceived = null; this.status = 'connecting'; this.error = null; this.unsaved = false; this.active = true;
    this.session = {id: crypto.randomUUID(), schemaVersion: VERSION, descriptor, mode: adapter.mode,
      startedAt: new Date(this.startTime).toISOString(), endedAt: null, notes:adapter.recording?.notes||'',status: 'recording', samples: [], rejected: 0, rejectionReasons: {}, derived: null};
    if (adapter.mode === 'replay' && adapter.recording) this.session.replayOf = {startedAt: adapter.recording.startedAt, origin: descriptor.origin};
    const reject = reason => {
      if (!['json','encoding','frameSize','truncated','sequence','timestamp','order','channels','value','range','battery','decoder'].includes(reason))reason='decoder';
      if (!this.active || token !== this.generation) return;
      this.session.rejected++; this.session.rejectionReasons[reason] = (Object.hasOwn(this.session.rejectionReasons,reason) ? this.session.rejectionReasons[reason] : 0) + 1; this.emit();
    };
    const accept = value => {
      if (!this.active || token !== this.generation) return;
      try {
        if (this.session.samples.length >= LIMITS.samples) { void this.stop('sampleLimit'); return; }
        const sample = validateSample(value, descriptor, this.session.samples.at(-1));
        const epoch = Math.max(this.now(),this.startTime, this.lastReceiptEpoch || 0); this.lastReceiptEpoch = epoch;
        sample.receivedAt = new Date(epoch).toISOString();
        if (adapter.mode === 'replay' && typeof value.receivedAt === 'string') sample.originalReceivedAt = value.originalReceivedAt || value.receivedAt;
        const bytes=JSON.stringify(sample).length+1;
        if(this.sessionBytes+bytes>LIMITS.fileBytes){void this.stop('sampleLimit');return;}
        this.sessionBytes+=bytes; this.session.samples.push(sample); this.processor.add(sample); this.lastReceived = this.clock();
        if(this.session.samples.length === 1) void this.checkpoint();
        this.status = descriptor.origin === 'simulated' ? 'demo' : adapter.mode === 'replay' ? 'replay' : 'live'; this.emit();
      } catch (error) { reject(error.message); }
    };
    this.parser = null;
    try {
      const release = this.store?.lockSession ? await this.store.lockSession(this.session.id) : null;
      if (!this.active || token !== this.generation) { release?.(); return; }
      this.releaseLock=release;
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
  activeElapsed(){const tick=this.clock();return Math.max(0,tick-this.startTick-(this.pausedMs||0)-(this.paused?tick-this.pauseTick:0));}
  canPause(){return this.adapter?.mode==='replay'&&typeof this.adapter.pause==='function'&&typeof this.adapter.resume==='function';}
  togglePause(){
    if(!this.active||!this.canPause()||!this.session.samples.length)return;
    if(this.paused){this.adapter.resume();this.pausedMs+=this.clock()-this.pauseTick;this.paused=false;this.lastReceived=this.clock();this.status=this.session.descriptor.origin==='simulated'?'demo':'replay';}
    else{this.adapter.pause();this.pauseTick=this.clock();this.paused=true;this.status='paused';}this.emit();
  }
  tick() {
    if (!this.active) return;
    const elapsed = this.activeElapsed();
    if (this.clock()-this.lastCheckpoint>=1000) { this.lastCheckpoint=this.clock(); void this.checkpoint(); }
    const staleAfterMs = Math.max(1500, 5000 / this.session.descriptor.sampleRateHz);
    if (!this.paused&&this.clock() - (this.lastReceived ?? this.startTick) > staleAfterMs) this.status = 'stale';
    if (elapsed >= this.durationMs) void this.stop('complete');
    this.emit();
  }
  stop(reason = 'stopped') {
    if (this.pendingStop) return this.pendingStop;
    if (!this.active) return Promise.resolve();
    // Drain partial frames while the generation is still active, then invalidate every callback.
    try { this.parser?.finish?.(); }
    catch { this.session.rejected++; this.session.rejectionReasons.decoder = (this.session.rejectionReasons.decoder || 0) + 1; }
    this.elapsedMs=this.activeElapsed();this.paused=false;this.active = false; ++this.generation; clearInterval(this.timer);
    const session = this.session;
    session.endedAt = new Date(Math.max(this.now(),this.startTime,this.lastReceiptEpoch||0)).toISOString();
    session.status = reason === 'complete' && session.samples.length ? 'completed' : reason === 'stopped' ? 'stopped' : 'interrupted';
    session.derived = this.processor.snapshot(session.rejected);
    this.status = ['connection', 'sampleLimit'].includes(reason) ? 'error' : 'disconnected';
    this.error = ['connection', 'sampleLimit'].includes(reason) ? reason : !session.samples.length ? 'noSamples' : null;
    this.saving = Boolean(session.samples.length); this.emit();
    this.pendingStop = (async () => {
      try { await this.adapter.stop(); } catch { this.error = 'disconnect'; this.status = 'error'; }
      await this.checkpointing;
      if (session.samples.length) await this.save();
      this.releaseLock?.(); this.releaseLock = null;
    })().finally(() => { this.saving = false; this.pendingStop = null; this.emit(); });
    return this.pendingStop;
  }
  checkpoint() {
    if (!this.active || !this.store?.checkpoint || this.checkpointing || this.session.samples.length===this.persistedCount) return this.checkpointing || Promise.resolve();
    const session=this.session, offset=this.persistedCount, end=session.samples.length;
    const {samples,derived,...metadata}=session;
    this.checkpointing=this.store.checkpoint(structuredClone(metadata),structuredClone(samples.slice(offset,end)),offset)
      .then(()=>{this.persistedCount=end;if(this.error==='checkpoint')this.error=null;})
      .catch(()=>{this.error='checkpoint';})
      .finally(()=>{this.checkpointing=null;this.emit();});
    return this.checkpointing;
  }
  discardUnsaved() {
    if (this.active || this.saving) throw new Error('busy');
    this.session = null; this.elapsedMs=0; this.durationMs=0; this.persistedCount=0; this.processor=null; this.unsaved = false; this.error = null; this.status = 'disconnected'; this.emit();
  }
  async save() {
    if (!this.session?.samples.length) return;
    try { await this.store.save(structuredClone(this.session)); this.unsaved = false; this.persistedCount=this.session.samples.length; if (['storage','checkpoint'].includes(this.error)) this.error = null; }
    catch { this.unsaved = true; this.error = 'storage'; }
    this.emit();
  }
}
