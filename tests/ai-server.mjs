// Test-only bridge. Every upstream is a labeled fixture, never a real model call.
import {localAIServer} from '../scripts/serve-ai.mjs';
import {createHandler} from '../netlify/functions/care-chat.mjs';
let mode='ok',requests=[],aborted=0;
const env={ARTERIA_AI_ENABLED:'true',ARTERIA_AI_API_KEY:'AI-TEST-ONLY-KEY'};
const upstream=async(_url,options)=>{
 const payload=JSON.parse(options.body);requests.push(payload);options.signal.addEventListener('abort',()=>aborted++,{once:true});
 await new Promise(resolve=>setTimeout(resolve,mode==='slow'?600:mode==='timeout'?200:10));
 if(mode==='rate')return new Response('',{status:429});
 if(mode==='fail')throw Error('AI-TEST-ONLY-KEY must not appear in the client');
 const text=payload.instructions.includes('Reply in Spanish.')?'Respuesta simulada para la prueba: un intervalo indica datos ausentes, no un diagnóstico.':'Mock provider fixture: Arteria records and reviews signals. A gap describes missing data, not a diagnosis.';
 return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text}]}]}));
};
let handler=createHandler({env,fetchImpl:upstream});
const server=localAIServer({handler:async request=>{const response=await handler(request);const body=await response.json();if(body.provider)body.provider='Mock provider (test only)';return new Response(JSON.stringify(body),{status:response.status,headers:response.headers});}});
process.on('message',message=>{if(message.mode){mode=message.mode;requests=[];aborted=0;handler=createHandler({env:mode==='missing'?{}:env,fetchImpl:upstream,timeoutMs:mode==='timeout'?40:20000});process.send({ok:true});}else process.send({requests,aborted});});
server.listen(8779,'127.0.0.1',()=>console.log('Arteria AI fixture bridge ready'));
