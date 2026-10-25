import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionSummary,validateSummary} from '../js/care/session-summary.js';
import {conversationBody} from '../js/care/request.js';
import {filterSessions} from '../js/measurement/filters.js';
const fixture=JSON.parse(readFileSync('fixtures/simulated-session.json')).session;
test('AI session summary contains only validated aggregate engineering data',()=>{
 const summary=sessionSummary({...fixture,notes:'secret-note'});assert.equal(summary.origin,'simulated');assert.equal(summary.accepted,100);for(const key of ['notes','startedAt','id','samples','descriptor'])assert.ok(!(key in summary));assert.ok(summary.channels[0].unit);
});
test('summary validation rejects bad provenance, infinite numbers and inconsistent ranges',()=>{
 const valid=sessionSummary(fixture);for(const v of [{...valid,origin:'live-patient'},{...valid,durationSeconds:Infinity},{...valid,accepted:-1},{...valid,channels:[{...valid.channels[0],mean:Infinity}]}])assert.throws(()=>validateSummary(v));
});
test('AI conversation trims complete pairs to fit UTF-8 wire limits and excludes unshared context',()=>{
 const history=Array.from({length:10},(_,i)=>({role:i%2?'assistant':'user',content:'光'.repeat(2000)}));const {body,messages}=conversationBody(history,'Explain','en');assert.ok(new TextEncoder().encode(body).length<=23500);assert.equal(messages[0].role,'user');assert.equal(messages.at(-1).content,'Explain');assert.equal(messages.length%2,1);assert.ok(!('session' in JSON.parse(body)));
});
test('history filters support complete archive, inclusive dates and separate replay/source filters',()=>{
 const sessions=[{...fixture,id:'a',startedAt:'2026-10-20T12:00:00',mode:'stream'},{...fixture,id:'b',startedAt:'2026-10-21T23:00:00',mode:'replay'}];assert.equal(filterSessions(sessions,{days:'all'}).length,2);assert.deepEqual(filterSessions(sessions,{days:'all',from:'2026-10-21',to:'2026-10-21'}).map(s=>s.id),['b']);assert.equal(filterSessions(sessions,{days:'all',source:'hardware'}).length,0);assert.equal(filterSessions(sessions,{days:'all',source:'replay'}).length,1);
});
test('invalid custom date intervals are rejected rather than silently matching wrong sessions',()=>assert.throws(()=>filterSessions([],{from:'2026-10-22',to:'2026-10-20'}),/dateRange/));
