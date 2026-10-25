// Test-only production preview. Provider calls are mocked and explicitly labeled.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHandler} from '../netlify/functions/care-chat.mjs';
const root=path.resolve('dist'),port=Number(process.env.PORT||8773),requests=[];
let mode='ok';const env={ARTERIA_AI_ENABLED:'true',ARTERIA_AI_PROVIDER:'openai',ARTERIA_AI_MODEL:'mock-model',ARTERIA_AI_API_KEY:'TEST-ONLY-SERVER-KEY'};
const fakeFetch=async(_url,options)=>{
 const body=JSON.parse(options.body);requests.push(body);
 await new Promise(resolve=>setTimeout(resolve,mode==='slow'?1000:150));
 if(mode==='fail')return new Response('private provider error',{status:401});
 if(mode==='rate')return new Response('',{status:429});
 const last=body.input.at(-1).content,spanish=body.instructions.includes('Reply in Spanish.'),analysis=last.includes('Analyze ')||last.includes('Analiza ');const text=mode==='unsafe'?'You have DVT.':analysis?(spanish?'Resumen de la grabación: Datos simulados compartidos.\nCalidad de la señal: Las métricas resumen la integridad técnica.\nPatrones observables: La dispersión describe variabilidad en a.u.\nResumen sencillo: Esto no es una medida clínica.\nPreguntas para continuar: ¿Qué significa la variabilidad?':'Recording overview: Simulated recording summary.\nSignal quality: Metrics describe technical completeness.\nObservable patterns: Spread describes variability in a.u.\nPlain-language summary: This is not a clinical measurement.\nFollow-up questions: What does variability mean?'):last.includes('User-shared recording data')?'Mock provider test: the shared recording is simulated. Gaps describe missing data, not a diagnosis.':spanish?'Respuesta de prueba del proveedor simulado: puedo explicar tus grabaciones.':'Mock provider test: a signal gap means part of the recording is missing. I can explain the app without seeing your sessions.';
 return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text}]}]}));
};
let handler=createHandler({env,fetchImpl:fakeFetch});
const headerText=await readFile(path.join(root,'_headers'),'utf8');const security=Object.fromEntries(headerText.split('\n').filter(l=>l.startsWith('  ')).map(l=>{const i=l.indexOf(':');return[l.slice(0,i).trim(),l.slice(i+1).trim()];}));
http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://127.0.0.1:'+port);
 if(url.pathname==='/__test/requests'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(requests));return;}
 if(url.pathname==='/__test/mode'){mode=url.searchParams.get('value')||'ok';requests.length=0;handler=createHandler({env:mode==='unavailable'?{}:env,fetchImpl:fakeFetch});res.writeHead(200).end('ok');return;}
 if(url.pathname==='/api/care-chat'){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const response=await handler(new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}));
  const value=await response.json();if(value.provider)value.provider='Mock provider (test only)';res.writeHead(response.status,{...security,'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(value));return;
 }
 const pathname=decodeURIComponent(url.pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(pathname.split('/').some(s=>s.startsWith('.'))||!file.startsWith(root+path.sep)||!(await stat(file)).isFile())throw Error();
 const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{...security,'Content-Type':type,'Cache-Control':'no-store'}).end(await readFile(file));
 }catch{res.writeHead(404).end('not found');}
}).listen(port,'127.0.0.1',()=>console.log('Arteria test product: '+port));
