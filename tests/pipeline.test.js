import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateDescriptor, LIMITS} from '../js/measurement/schema.js';
import {validateSample} from '../js/measurement/validator.js';
import {FrameParser} from '../js/measurement/parser.js';
import {processSamples} from '../js/measurement/processing.js';
import {MeasurementController} from '../js/measurement/controller.js';
import {SessionStore} from '../js/measurement/session-store.js';
import {exportCSV, exportJSON, importSession} from '../js/measurement/export.js';
import {SIMULATION_DESCRIPTOR as descriptor, simulatedSample} from '../js/measurement/adapters/simulation.js';
import {ReplayAdapter} from '../js/measurement/adapters/replay.js';
const sample = (n = 0) => simulatedSample(n);
const session = () => ({id:'test-session',schemaVersion:1,descriptor,mode:'stream',startedAt:'2026-10-24T22:00:00.000Z', endedAt:'2026-10-24T22:00:01.000Z',status:'completed',rejected:0,samples:[0,1,2].map(i=>({...sample(i),receivedAt:new Date(1792879200000+i*40).toISOString()}))});
function harness(origin = 'simulated', storeFailure = false) {
  let time=10000, saved=[];
  const store={save:async s=>{if(storeFailure)throw Error('quota');saved.push(structuredClone(s));}};
  const controller=new MeasurementController({store,now:()=>time,autoTick:false});
  const adapter={descriptor:{...descriptor,origin},mode:'stream',start:async callbacks=>{adapter.callbacks=callbacks;},stop:async()=>{adapter.stopped=true;}};
  return {controller,adapter,saved,setTime:v=>time=v,send:value=>adapter.callbacks.onChunk(JSON.stringify(value)+'\n')};
}
test('schema rejects unknown versions, origins and ambiguous channels',()=>{
  assert.equal(validateDescriptor(descriptor).sampleRateHz,25);
  for(const change of [{schemaVersion:2},{origin:'real-ish'},{sampleRateHz:0},{channels:[descriptor.channels[0],descriptor.channels[0]]},{channels:[{id:'x',unit:'',label:'x'}]}])assert.throws(()=>validateDescriptor({...descriptor,...change}));
});
test('samples reject nonfinite, missing, extra, out-of-range values and invalid battery',()=>{
  for(const raw of [{optical:NaN},{optical:Infinity},{},{optical:-1},{optical:2,extra:2}])assert.throws(()=>validateSample({...sample(),raw},descriptor));
  assert.throws(()=>validateSample({...sample(),batteryPercent:101},descriptor));
  assert.equal(validateSample({...sample(),batteryPercent:0},descriptor).batteryPercent,0);
});
test('ordering rejects duplicates, reversals and clock reset',()=>{
  assert.throws(()=>validateSample(sample(1),descriptor,sample(1)));
  assert.throws(()=>validateSample({...sample(2),deviceTimeMs:0},descriptor,sample(1)));
});
test('parser handles split bytes, multiple frames, CRLF and malformed lines',()=>{
  const values=[],errors=[];const parser=new FrameParser(v=>values.push(v),e=>errors.push(e));
  const encoded=new TextEncoder().encode('{"name":"señal"}\r\n{"x":1}\n');
  encoded.forEach(byte=>parser.push(new Uint8Array([byte])));
  parser.push('broken\n{"ok":true}\n');parser.push('{"incomplete"');parser.finish();
  assert.deepEqual(values,[{name:'señal'},{x:1},{ok:true}]);assert.deepEqual(errors,['json','truncated']);
});
test('oversized frames are discarded until the next delimiter; decoder recovers',()=>{
  const values=[],errors=[];const p=new FrameParser(v=>values.push(v),e=>errors.push(e));
  p.push('x'.repeat(LIMITS.frameBytes+1)+'\n{}\n');assert.deepEqual(values,[{}]);assert.deepEqual(errors,['frameSize']);
  p.push(new Uint8Array([255]));assert.equal(errors.at(-1),'encoding');p.push('{}\n');assert.equal(values.length,2);
});
test('processing detects sequence gaps, timing gaps, flatline and clipping',()=>{
  const values=[...Array(30)].map((_,i)=>({sequence:i<10?i:i+3,deviceTimeMs:(i<10?i:i+3)*40,raw:{optical:4095}}));
  const d=processSamples(values,descriptor,2);assert.equal(d.missing,3);assert.equal(d.timingGaps,1);assert.equal(d.channels.optical.clipped,30);assert.equal(d.channels.optical.flatline,true);assert.equal(d.channels.optical.mean,4095);assert.equal(d.rejected,2);
});
test('controller transitions connecting → demo → stale → demo → disconnected, calculates metrics and saves',async()=>{
  const h=harness();await h.controller.start(h.adapter);assert.equal(h.controller.status,'connecting');
  h.send(sample());assert.equal(h.controller.status,'demo');h.setTime(12000);h.controller.tick();assert.equal(h.controller.status,'stale');
  h.send(sample(50));assert.equal(h.controller.status,'demo');await h.controller.stop();assert.equal(h.controller.status,'disconnected');
  assert.equal(h.saved.length,1);assert.equal(h.saved[0].derived.missing,49);assert.equal(h.saved[0].analysis.version,'technical-analysis-v1');assert.equal(h.saved[0].analysis.accepted,2);assert.equal(h.adapter.stopped,true);
});
test('live label is reserved for hardware descriptors; stale source failure retains samples',async()=>{
  const h=harness('hardware');await h.controller.start(h.adapter);h.send(sample());assert.equal(h.controller.status,'live');h.adapter.callbacks.onError(Error('unplug'));
  await h.controller.pendingStop;assert.equal(h.controller.status,'error');assert.equal(h.saved[0].samples.length,1);assert.equal(h.saved[0].status,'interrupted');
});
test('late chunks after stop and previous generation cannot contaminate sessions',async()=>{
  const h=harness();await h.controller.start(h.adapter);const old=h.adapter.callbacks;h.send(sample());await h.controller.stop();old.onChunk(JSON.stringify(sample(5))+'\n');assert.equal(h.controller.session.samples.length,1);
  await h.controller.start(h.adapter);old.onChunk(JSON.stringify(sample(6))+'\n');assert.equal(h.controller.session.samples.length,0);await h.controller.stop();
});
test('invalid frames are rejected without killing acquisition',async()=>{
  const h=harness();await h.controller.start(h.adapter);h.adapter.callbacks.onChunk('broken\n');h.send({...sample(),raw:{optical:'2000'}});h.send(sample());assert.equal(h.controller.session.rejected,2);assert.equal(h.controller.session.samples.length,1);await h.controller.stop();
});
test('automatic completion, explicit interruption and no-sample sessions',async()=>{
  const h=harness();await h.controller.start(h.adapter,{durationSeconds:1});h.send(sample());h.setTime(11001);h.controller.tick();await h.controller.pendingStop;assert.equal(h.saved[0].status,'completed');
  await h.controller.start(h.adapter);await h.controller.stop();assert.equal(h.controller.error,'noSamples');assert.equal(h.saved.length,1);
});
test('storage failure retains exportable data and reports unsaved state',async()=>{
  const h=harness('simulated',true);await h.controller.start(h.adapter);h.send(sample());await h.controller.stop();assert.equal(h.controller.unsaved,true);assert.equal(h.controller.error,'storage');assert.ok(exportJSON(h.controller.session).includes('optical'));
});
test('browser storage absence reports failure rather than pretending persistence',async()=>{await assert.rejects(new SessionStore(null).list(),/storage/);});
test('JSON round trip validates every sample and preserves provenance',()=>{
  const original=session();const loaded=importSession(exportJSON(original));assert.deepEqual(loaded.samples,original.samples);assert.equal(loaded.descriptor.origin,'simulated');assert.equal(loaded.analysis.version,'technical-analysis-v1');
  const corrupted=structuredClone(original);corrupted.samples[1].deviceTimeMs=0;assert.throws(()=>importSession(exportJSON(corrupted)),/order/);
  assert.throws(()=>importSession('{"format":"other"}'),/schema/);
});
test('CSV includes units, origin and separate clocks with quoted safe fields',()=>{
  const s=session();s.descriptor={...descriptor,deviceId:'=SUM(1,1)'};const csv=exportCSV(s);assert.match(csv,/optical \[a.u.\]/);assert.match(csv,/effective_sample_rate_hz/);assert.match(csv,/optical_stddev \[a.u.\]/);assert.match(csv,/device_time_ms/);assert.match(csv,/received_at/);assert.match(csv,/simulated/);assert.match(csv,/'=SUM/);assert.equal(csv.split('\r\n').length,4);
});
test('real replay adapter pumps a validated recording through the full controller',async()=>{
  const saved=[];const c=new MeasurementController({store:{save:async s=>saved.push(s)}});
  const recording=importSession(exportJSON(session()));await c.start(new ReplayAdapter(recording,4));
  await new Promise(resolve=>{const off=c.subscribe(()=>{if(!c.active&&!c.saving){off();resolve();}})});
  assert.equal(saved.length,1);assert.equal(saved[0].mode,'replay');assert.equal(saved[0].descriptor.origin,'simulated');assert.equal(saved[0].samples.length,3);assert.equal(saved[0].samples[0].originalReceivedAt,recording.samples[0].receivedAt);
});
test('UTF-8 frame limit counts bytes, not just characters',()=>{
  const errors=[];const p=new FrameParser(()=>{},e=>errors.push(e));p.push('é'.repeat(LIMITS.frameBytes/2+1)+'\n');assert.deepEqual(errors,['frameSize']);
});
test('software numeric bounds prevent overflow in derived statistics',()=>{assert.throws(()=>validateSample({...sample(),raw:{optical:1e308}}, {...descriptor,channels:[{id:'optical',label:'x',unit:'a.u.'}]}));});
test('failed save cannot be silently overwritten by a new acquisition',async()=>{
  const h=harness('simulated',true);await h.controller.start(h.adapter);h.send(sample());await h.controller.stop();await assert.rejects(h.controller.start(h.adapter),/storage/);h.controller.discardUnsaved();assert.equal(h.controller.unsaved,false);assert.equal(h.controller.session,null);
});
test('failed custom decoder creation closes source and resets active state',async()=>{
  const h=harness();h.adapter.createParser=()=>{throw Error('bad decoder')};await h.controller.start(h.adapter);assert.equal(h.controller.active,false);assert.equal(h.controller.status,'error');assert.equal(h.adapter.stopped,true);
});
test('custom decoder failure cannot escape callbacks or block cleanup',async()=>{
  const h=harness();h.adapter.createParser=()=>({push(){throw Error('broken')},finish(){throw Error('partial')}});await h.controller.start(h.adapter);h.adapter.callbacks.onChunk('raw');await h.controller.stop();assert.equal(h.controller.session.rejected,2);assert.equal(h.adapter.stopped,true);
});
test('cancelling pending connection ignores its eventual completion',async()=>{
  const h=harness();let release;h.adapter.start=()=>new Promise(resolve=>release=resolve);const starting=h.controller.start(h.adapter);await h.controller.stop();release();await starting;assert.equal(h.controller.active,false);assert.equal(h.controller.status,'disconnected');assert.equal(h.adapter.stopped,true);
});
test('truncated UTF-8 byte sequences are rejected on stream closure',()=>{
  const errors=[];const p=new FrameParser(()=>{},e=>errors.push(e));p.push(new Uint8Array([0xc3]));p.finish();assert.deepEqual(errors,['encoding']);
});
test('included replay fixture is valid and remains explicitly synthetic',async()=>{
  const {readFile}=await import('node:fs/promises');const s=importSession(await readFile(new URL('../fixtures/simulated-session.json',import.meta.url),'utf8'));assert.equal(s.descriptor.origin,'simulated');assert.equal(s.samples.length,100);assert.equal(s.derived.missing,25);
  const wrong=session();wrong.schemaVersion=2;assert.throws(()=>importSession(exportJSON(wrong)),/schema/);
});
