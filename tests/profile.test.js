import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePreferences,loadPreferences,savePreferences,initials,DEFAULTS} from '../js/profile/preferences.js';
import {chartGeometry} from '../js/measurement/chart-data.js';
test('profile preferences reject malformed values and bound optional names',()=>{
 assert.deepEqual(normalizePreferences(null),DEFAULTS);
 const p=normalizePreferences({displayName:' x'.repeat(100),avatar:'https://example.com',duration:300,windowSeconds:-2,grid:'yes'});
 assert.equal(p.displayName.length,60);assert.equal(p.avatar,'initials');assert.equal(p.duration,20);assert.equal(p.windowSeconds,20);assert.equal(p.grid,true);
});
test('profile storage round trip preserves valid recording and chart choices',()=>{
 let value;const storage={getItem:()=>value,setItem:(_,v)=>value=v};
 savePreferences({displayName:'  Ana María  ',avatar:'leaf',duration:10,windowSeconds:5,grid:false},storage);
 assert.deepEqual(loadPreferences(storage),{version:1,displayName:'Ana María',avatar:'leaf',duration:10,windowSeconds:5,grid:false,onboarding:true});
});
test('corrupt or unavailable preference storage falls back and save failure is explicit',()=>{
 assert.deepEqual(loadPreferences({getItem:()=>'{broken'}),DEFAULTS);
 const blocked={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}};
 assert.deepEqual(loadPreferences(blocked),DEFAULTS);assert.throws(()=>savePreferences({},blocked),/blocked/);
});
test('initials handle empty names, Unicode and long names without HTML interpretation',()=>{
 assert.equal(initials(''), 'G');assert.equal(initials('Ana María Sol'),'AM');assert.equal(initials('🌿 Patel'),'🌿P');
});
test('live window affects geometry without deleting samples or changing historical graphs',()=>{
 const session={descriptor:{sampleRateHz:1},samples:Array.from({length:31},(_,i)=>({sequence:i,deviceTimeMs:i*1000,raw:{x:i}}))};const channel={id:'x'};
 const live=chartGeometry(session,channel,{live:true,windowSeconds:5});assert.equal(live.count,6);assert.equal(live.startSeconds,25);assert.equal(session.samples.length,31);
 assert.equal(chartGeometry(session,channel,{windowSeconds:5}).count,31);
});
