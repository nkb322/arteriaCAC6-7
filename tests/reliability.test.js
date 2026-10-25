import {test} from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {SignalProcessor,processSamples} from '../js/measurement/processing.js';
import {MeasurementController} from '../js/measurement/controller.js';
import {SIMULATION_DESCRIPTOR as descriptor,simulatedSample} from '../js/measurement/adapters/simulation.js';
import {importSession,exportCSV,exportJSON} from '../js/measurement/export.js';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../fixtures/simulated-session.json',import.meta.url),'utf8')).session;
test('incremental statistics match batch statistics after gaps and malformed-frame counts',()=>{
  const p=new SignalProcessor(descriptor);const samples=Array.from({length:1500},(_,i)=>simulatedSample(i<100?i:i+7));
  samples.forEach(s=>p.add(s));assert.deepEqual(p.snapshot(3),processSamples(samples,descriptor,3));
});
test('100,000-sample processing stays linear and finite',()=>{
  const p=new SignalProcessor(descriptor),start=performance.now();for(let i=0;i<100000;i++)p.add(simulatedSample(i));
  assert.equal(p.snapshot().accepted,100000);assert.ok(Number.isFinite(p.snapshot().channels.optical.stddev));assert.ok(performance.now()-start<5000);
});
test('canonical CSV preserves negative numbers but neutralizes textual formulas',()=>{
  const s=structuredClone(fixture);s.descriptor.channels[0].unit='\t=cmd';s.samples[0].raw.optical=-2;
  const csv=exportCSV(s);assert.ok(csv.includes('"-2"'));assert.ok(!csv.includes('"\'-2"'));s.descriptor.deviceId=' \t=cmd';assert.ok(exportCSV(s).includes("' \t=cmd"));
});
test('recording imports reject reversed receipt timestamps',()=>{
  const s=structuredClone(fixture);s.samples[1].receivedAt='2020-01-01T00:00:00.000Z';assert.throws(()=>importSession(exportJSON(s)),/timestamp/);
});
test('checkpoint batches append only new accepted samples; finalization waits for checkpoint',async()=>{
  let time=1000,callbacks,release,offsets=[],saves=[];
  const store={checkpoint:(metadata,chunk,offset)=>{offsets.push([offset,chunk.length,metadata.descriptor.origin]);return new Promise(resolve=>release=resolve);},save:async s=>saves.push(s)};
  const c=new MeasurementController({store,now:()=>time,autoTick:false});const adapter={descriptor,mode:'stream',start:async c=>callbacks=c,stop:async()=>{}};
  await c.start(adapter);callbacks.onChunk(JSON.stringify(simulatedSample(0))+'\n');callbacks.onChunk(JSON.stringify(simulatedSample(1))+'\n');
  const closing=c.stop();await Promise.resolve();assert.equal(saves.length,0);release();await closing;assert.equal(saves.length,1);assert.equal(saves[0].samples.length,2);assert.deepEqual(offsets,[[0,1,'simulated']]);
});
test('monotonic acquisition duration survives wall-clock rollback',async()=>{
  let wall=10000,clock=100,callbacks;const c=new MeasurementController({store:{save:async()=>{}},now:()=>wall,monotonicNow:()=>clock,autoTick:false});
  await c.start({descriptor,mode:'stream',start:async c=>callbacks=c,stop:async()=>{}},{durationSeconds:1});callbacks.onChunk(JSON.stringify(simulatedSample(0))+'\n');wall=5000;clock=200;callbacks.onChunk(JSON.stringify(simulatedSample(1))+'\n');clock=1101;c.tick();await c.pendingStop;assert.equal(c.session.status,'completed');assert.equal(c.session.samples[0].receivedAt,c.session.samples[1].receivedAt);assert.ok(Date.parse(c.session.endedAt)>=Date.parse(c.session.startedAt));
});
test('large-step instability requires declared range and adjacent normally timed samples',()=>{
 const samples=[{sequence:0,deviceTimeMs:0,raw:{optical:100}},{sequence:1,deviceTimeMs:40,raw:{optical:3000}},{sequence:9,deviceTimeMs:360,raw:{optical:100}}];
 assert.equal(processSamples(samples,descriptor).channels.optical.stepJumps,1);
 assert.equal(processSamples(samples,{...descriptor,channels:[{id:'optical',label:'x',unit:'a.u.'}]}).channels.optical.stepJumps,0);
});
