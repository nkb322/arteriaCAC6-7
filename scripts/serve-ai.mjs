// Loopback-only bridge to the exact Netlify handler. No mock routes or request logging.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {Readable} from 'node:stream';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHandler} from '../netlify/functions/care-chat.mjs';
export function localAIServer({handler=createHandler(),root=path.resolve('dist')}={}){
 const types={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
 return http.createServer(async(req,res)=>{
  try{
   const address=req.socket.localPort,host=req.headers.host;
   if(![`127.0.0.1:${address}`,`localhost:${address}`].includes(host)){res.writeHead(421).end();return;}
   const url=new URL(req.url,'http://'+host);
   if(url.pathname==='/api/care-chat'){
    const abort=new AbortController();req.on('aborted',()=>abort.abort());res.on('close',()=>{if(!res.writableEnded)abort.abort();});
    const request=new Request(url,{method:req.method,headers:req.headers,signal:abort.signal,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
    const response=await handler(request);if(res.destroyed)return;
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
   }
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
   const name=decodeURIComponent(url.pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
   if(name.split('/').some(s=>s.startsWith('.'))||!file.startsWith(root+path.sep)||!(await stat(file)).isFile()){res.writeHead(404).end();return;}
   const headers=Object.fromEntries((await readFile(path.join(root,'_headers'),'utf8')).split('\n').filter(l=>l.startsWith('  ')&&!l.trim().startsWith('Cache-Control:')).map(l=>{const i=l.indexOf(':');return[l.slice(0,i).trim(),l.slice(i+1).trim()];}));
   res.writeHead(200,{...headers,'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:await readFile(file));
  }catch(error){if(!res.headersSent)res.writeHead(['ENOENT','ENOTDIR'].includes(error.code)?404:400,{'Cache-Control':'no-store'});res.end();}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const flag=process.argv.find(v=>v.startsWith('--port=')),port=flag?Number(flag.slice(7)):8780;
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid local port');
 const server=localAIServer();server.on('error',()=>{console.error('Local AI server could not start. Check the port and run npm run build.');process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log(`Arteria AI: http://127.0.0.1:${port}/#care (real handler; provider calls require server configuration and consent)`));
}
