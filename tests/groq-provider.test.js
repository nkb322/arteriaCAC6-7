import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,DEFAULT_GROQ_MODEL} from '../netlify/functions/care-chat.mjs';
import {sessionSummary} from '../js/care/session-summary.js';
import {readFileSync} from 'node:fs';

const env={ARTERIA_AI_ENABLED:'true',GROQ_API_KEY:'GROQ-TEST-ONLY-KEY'};
const fixture=JSON.parse(readFileSync('fixtures/simulated-session.json','utf8')).session;
const request=(body)=>new Request('https://arteria.example/api/care-chat',{method:'POST',headers:{origin:'https://arteria.example','content-type':'application/json'},body:JSON.stringify(body)});
const groqReply=text=>new Response(JSON.stringify({choices:[{message:{role:'assistant',content:text}}]}));

test('default Groq model handles consented Spanish measurement analysis and contextual follow-up',async()=>{
 const payloads=[];
 const handler=createHandler({env,fetchImpl:async(url,options)=>{assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer GROQ-TEST-ONLY-KEY');payloads.push(JSON.parse(options.body));return groqReply('Resumen de la grabación: Sesión simulada revisada.\nCalidad de la señal: Se muestran métricas técnicas, no clínicas.\nPatrones observables: Los valores corresponden a la señal compartida.\nResumen sencillo: Esto describe el registro, no la salud de una persona.\nPreguntas para continuar: ¿Quieres revisar una métrica?');}});
 const summary=sessionSummary(fixture),analysis={language:'es',messages:[{role:'user',content:'Explica esta grabación.'}],session:summary,sessionConsent:true,analysisMode:true};
 const first=await handler(request(analysis));assert.equal(first.status,200);const result=await first.json();assert.equal(result.provider,'GroqCloud');assert.equal(result.model,DEFAULT_GROQ_MODEL);assert.match(result.reply,/Calidad de la señal/);
 const wire=JSON.stringify(payloads[0]);assert.equal(payloads[0].model,'openai/gpt-oss-20b');assert.equal(payloads[0].messages[0].role,'system');assert.match(payloads[0].messages[0].content,/Reply in Spanish/);assert.match(wire,/User-shared recording data/);for(const privateField of ['"samples"','"notes"','"deviceId"','"startedAt"'])assert.ok(!wire.includes(privateField));
 const followup=await handler(request({language:'es',messages:[...analysis.messages,{role:'assistant',content:result.reply},{role:'user',content:'¿Qué significa la integridad estimada?'}],session:summary,sessionConsent:true}));assert.equal(followup.status,200);assert.equal(payloads.length,2);assert.deepEqual(payloads[1].messages.slice(-2).map(m=>m.role),['assistant','user']);
});

test('Groq quota errors retain bounded Retry-After and do not leak upstream text',async()=>{
 const handler=createHandler({env,fetchImpl:async()=>new Response('sensitive provider details',{status:429,headers:{'retry-after':'37'}})});
 const response=await handler(request({language:'en',messages:[{role:'user',content:'Explain a measurement'}]}));assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'37');assert.deepEqual(await response.json(),{code:'rate'});
});

test('provider-specific credentials never cross-fallback between Groq and OpenAI',async()=>{
 const groqWithoutKey=createHandler({env:{ARTERIA_AI_ENABLED:'true',ARTERIA_AI_PROVIDER:'groq',OPENAI_API_KEY:'OPENAI-ONLY-TEST'}});
 const openaiWithoutKey=createHandler({env:{ARTERIA_AI_ENABLED:'true',ARTERIA_AI_PROVIDER:'openai',GROQ_API_KEY:'GROQ-ONLY-TEST'}});
 assert.equal((await groqWithoutKey(request({language:'en',messages:[{role:'user',content:'hello'}]}))).status,503);
 assert.equal((await openaiWithoutKey(request({language:'en',messages:[{role:'user',content:'hello'}]}))).status,503);
 assert.equal((await createHandler({env})(new Request('https://arteria.example/api/care-chat',{method:'GET'})).then(r=>r.json())).provider,'GroqCloud');
});
