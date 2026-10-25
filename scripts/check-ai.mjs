// Deliberate non-sensitive provider probe. No local session/profile/history is read.
import {pathToFileURL} from 'node:url';
export async function checkAI(base,{confirmed=false,fetchImpl=fetch}={}){
 if(!confirmed)throw Error('Explicit confirmation is required before a potentially billable provider call.');
 const root=new URL(base);if((root.protocol!=='https:'&&!(root.protocol==='http:'&&['127.0.0.1','localhost'].includes(root.hostname)))||root.username||root.password||root.pathname!=='/'||root.search||root.hash)throw Error('Use a secure site root or loopback HTTP.');
 const url=new URL('/api/care-chat',root),options={redirect:'error',cache:'no-store',signal:AbortSignal.timeout(25000)};
 const status=await fetchImpl(url,options);if(!status.ok)throw Error('AI status route unavailable.');const config=await status.json();
 if(config.available!==true)throw Error('AI disabled: configure the server enable flag, key and model access.');
 if(typeof config.provider!=='string'||/mock|test only/i.test(config.provider))throw Error('Mock provider status cannot verify live AI.');
 let messages=[];const results=[];
 for(const [language,text]of [['en','What can I do in Arteria?'],['en','How do I save that recording?'],['es','Explica qué significa un intervalo de datos ausentes, sin conclusiones médicas.']]){
  if(language==='es')messages=[];messages.push({role:'user',content:text});
  const response=await fetchImpl(url,{...options,signal:AbortSignal.timeout(25000),method:'POST',headers:{'Content-Type':'application/json',Origin:root.origin},body:JSON.stringify({language,messages})});
  if(!response.ok)throw Error(`AI request failed (HTTP ${response.status}); check server configuration/provider status.`);
  const data=await response.json();if(data.kind!=='ai'||typeof data.reply!=='string'||!data.reply.trim()||data.reply.length>4000||/mock|test only/i.test(data.provider||''))throw Error('No valid live-provider reply was returned.');
  results.push({language,reply:data.reply,provider:data.provider});messages.push({role:'assistant',content:data.reply});
 }
 return results;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{const base=process.argv.find(v=>v.startsWith('--url='))?.slice(6)||'http://127.0.0.1:8780/';const replies=await checkAI(base,{confirmed:process.argv.includes('--confirm-provider-call')});for(const result of replies)console.log(`${result.language} · ${result.provider}\n${result.reply}\n`);console.log('Received provider-labeled replies through the real handler. Review language, factual quality and provider usage logs; this is not clinical validation.');}catch(error){console.error(error.message);process.exitCode=1;}}
