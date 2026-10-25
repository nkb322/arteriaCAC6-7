import {createHash} from 'node:crypto';
const MAX=48*1024, HEADER='ARTERIA-ENCRYPTED-V1\n';
const reply=(status,message)=>new Response(JSON.stringify({message}),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function readBody(request){
  if(Number(request.headers.get('content-length'))>MAX*2)throw Error('large');
  const reader=request.body?.getReader();if(!reader)throw Error('body');
  let timer;const chunks=[];let length=0;
  try{
    await Promise.race([(async()=>{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX*2)throw Error('large');chunks.push(value);}})(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('body')),5000);})]);
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  }finally{clearTimeout(timer);void reader.cancel().catch(()=>{});}
}
function validFile(file){
  if(typeof file!=='string'||Buffer.byteLength(file)>MAX||!file.startsWith(HEADER))return false;
  const parts=file.slice(HEADER.length).split('\n');
  return parts.length===3 && parts.every((v,i)=>{
    if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(v))return false;
    const bytes=Buffer.from(v,'base64');return bytes.toString('base64')===v && (i===0?bytes.length===16:i===1?bytes.length===12:bytes.length>=16);
  });
}
export function createHandler({fetchImpl=fetch,env=process.env,now=Date.now}={}){
  const buckets=new Map();
  return async request=>{
    if(request.method!=='POST')return reply(405,'Use POST to send an encrypted report.');
    if(request.headers.get('origin')!==new URL(request.url).origin)return reply(403,'This request did not come from the Arteria app.');
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return reply(415,'Send the encrypted report as JSON.');
    let body;try{body=await readBody(request);}catch(error){return reply(error.message==='large'?413:400,'The encrypted report could not be read.');}
    if(!body||typeof body!=='object'||Array.isArray(body)||body.website)return reply(400,'The request could not be verified.');
    const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
    if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply(400,'Enter a valid email address.');
    if(!validFile(body.encryptedFile))return reply(400,'The attachment is not a valid Arteria encrypted file.');
    const allowed=new Set((env.ARTERIA_ALLOWED_RECIPIENTS||'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));
    if(!env.RESEND_API_KEY||!env.RESEND_FROM_EMAIL||!allowed.size)return reply(503,'Secure email isn’t set up yet. Please try again later.');
    if(!allowed.has(email))return reply(403,'Email is restricted to configured recipients. Download the encrypted file instead.');
    // Best-effort per-instance cap, not distributed authentication. The allowlist is mandatory.
    for(const [key,bucket]of buckets)if(now()-bucket.time>=60000)buckets.delete(key);
    for(const key of ['all',email]){const b=buckets.get(key)||{time:now(),count:0};if(b.count>=(key==='all'?20:3))return reply(429,'Too many requests. Download locally or try later.');}
    for(const key of ['all',email]){const b=buckets.get(key)||{time:now(),count:0};b.count++;buckets.set(key,b);}
    const es=body.language==='es';
    try{
      const response=await fetchImpl('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':createHash('sha256').update(email+'\n'+body.encryptedFile).digest('hex')},
        body:JSON.stringify({from:env.RESEND_FROM_EMAIL,to:[email],subject:es?'Tu nota cifrada de Arteria':'Your encrypted Arteria note',text:es?'Archivo cifrado en tu dispositivo. Comparte la frase de contraseña por otro canal. No es un documento clínico.':'Encrypted on your device. Share the passphrase through a separate channel. This is not a clinical document.',attachments:[{filename:'arteria-encrypted-note.arteria',content:Buffer.from(body.encryptedFile).toString('base64'),content_type:'application/octet-stream'}]})});
      if(!response.ok)return reply(502,'Delivery could not be confirmed. Download locally instead.');
      return reply(200,'Encrypted file sent.');
    }catch{return reply(502,'Delivery could not be confirmed. Download locally instead.');}
  };
}
export default createHandler();
