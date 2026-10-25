import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeSession,analysisFallback} from '../js/measurement/analysis.js';
import {SIMULATION_DESCRIPTOR} from '../js/measurement/adapters/simulation.js';
import {sessionSummary} from '../js/care/session-summary.js';
import {sessionReport} from '../js/measurement/report.js';

const fixture=()=>({id:'known-data',descriptor:structuredClone(SIMULATION_DESCRIPTOR),mode:'stream',startedAt:'2026-01-01T00:00:00.000Z',rejected:0,samples:[0,1,3,4].map((sequence,index)=>({sequence,deviceTimeMs:sequence*40,receivedAt:new Date(Date.UTC(2026,0,1,0,0,0,sequence*40)).toISOString(),raw:{optical:[1,2,4,5][index]}}))});

test('measurement analysis calculates known rates, completeness, missing data and population spread',()=>{
 const a=analyzeSession(fixture(),'2026-01-01T00:00:01.000Z'),c=a.channels.optical;
 assert.equal(a.version,'technical-analysis-v1');assert.equal(a.durationSeconds,.16);assert.equal(a.accepted,4);assert.equal(a.missing,1);assert.equal(a.effectiveSampleRateHz,18.75);assert.equal(a.nominalSampleRateHz,25);assert.equal(a.completenessPercent,80);assert.equal(a.missingPercent,20);assert.equal(c.mean,3);assert.equal(c.stddev,Math.sqrt(2.5));assert.equal(c.min,1);assert.equal(c.max,5);assert.equal(c.range,4);assert.equal(a.signalToNoiseRatio,null);
});
test('invalid frames lower estimated completeness and empty/interrupted data stay safe',()=>{
 const s=fixture();s.rejected=1;const a=analyzeSession(s);assert.equal(a.invalidPercent,1/(4+1+1)*100);assert.equal(a.completenessPercent,80);assert.match(analysisFallback(a,'en'),/simulated source/);assert.throws(()=>analyzeSession({...s,samples:undefined}),/session/);
 const partial={...s,samples:s.samples.slice(0,1)};assert.equal(analyzeSession(partial).effectiveSampleRateHz,null);
});
test('Care Companion summary sends calculated aggregate metrics and no raw samples',()=>{
 const summary=sessionSummary(fixture());assert.equal(summary.effectiveSampleRateHz,18.75);assert.equal(summary.channels[0].stddev,Math.sqrt(2.5));assert.ok(!('samples'in summary));assert.ok(!('deviceId'in summary));
});
test('saved session report includes calculated metrics and safely escaped AI narrative in both locales',()=>{
 const s=fixture();s.analysis=analyzeSession(s);s.analysisReport={version:'ai-analysis-v1',text:'Grounded narrative <script>bad</script>',generatedAt:'2026-01-02T00:00:00.000Z',provider:'Test',comparisonSessions:[{id:'prior',startedAt:'2025-12-01T00:00:00.000Z',source:'simulated',mode:'replay',analysis:analyzeSession(fixture())}]};
 const en=sessionReport(s),es=sessionReport(s,{locale:'es'});assert.match(en,/Effective sampling rate/);assert.match(en,/Estimated completeness/);assert.match(en,/Compared recordings/);assert.match(en,/AI-generated explanation/);assert.ok(!en.includes('<script>bad'));assert.match(en,/&lt;script&gt;bad/);assert.match(es,/Frecuencia efectiva/);assert.match(es,/Grabaciones comparadas/);assert.match(es,/Explicación generada por IA/);
});
