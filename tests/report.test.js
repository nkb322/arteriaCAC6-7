import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {sessionReport} from '../js/measurement/report.js';import {chartGeometry} from '../js/measurement/chart-data.js';
const session=JSON.parse(await readFile(new URL('../fixtures/simulated-session.json',import.meta.url),'utf8')).session;
test('offline session report includes source, units, quality, graphs and saved notes',()=>{
 const s=structuredClone(session);s.notes='Ask about the next appointment';const report=sessionReport(s);
 for(const text of ['SIMULATED','a.u.','<svg','Missing sequence samples','25','Ask about the next appointment','No diagnosis'])assert.ok(report.includes(text),text);
 assert.ok(!report.includes('<script'));assert.ok(!report.includes('https://'));assert.match(report,/default-src 'none'/);
});
test('report escapes adversarial names and notes; Spanish and replay remain explicit',()=>{
 const s=structuredClone(session);s.descriptor.deviceName='<img src=x onerror=alert(1)>';s.notes='<script>alert(1)</script>';s.mode='replay';
 const report=sessionReport(s,{locale:'es'});assert.ok(!report.includes('<img src=x'));assert.ok(!report.includes('<script>'));assert.match(report,/&lt;script&gt;/);assert.match(report,/SIMULADO/);assert.match(report,/REPRODUCCIÓN/);
});
test('shared graph geometry retains missing-sample discontinuity and finite flatline coordinates',()=>{
 const g=chartGeometry(session,session.descriptor.channels[0]);assert.equal((g.path.match(/M/g)||[]).length,2);
 const s=structuredClone(session);s.samples.forEach(v=>v.raw.optical=0);const flat=chartGeometry(s,s.descriptor.channels[0]);assert.ok(!/NaN|Infinity/.test(flat.path));
});
