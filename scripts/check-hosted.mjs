// Read-only deployment smoke check. Never sends AI content, credentials or sessions.
import {pathToFileURL} from 'node:url';
export async function checkHosted(base,{fetchImpl=fetch}={}){
 const root=new URL(base);
 if((root.protocol!=='https:'&&!(root.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(root.hostname)))||root.username||root.password||root.pathname!=='/'||root.search||root.hash)throw Error('Use an HTTPS site root without credentials, query or fragment.');
 const results=[];
 async function get(path,type){const response=await fetchImpl(new URL(path,root),{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error(`${path}: HTTP ${response.status}`);if(!response.headers.get('content-type')?.includes(type))throw Error(`${path}: unexpected content type`);return response;}
 const home=await get('/','text/html'),html=await home.text();if(!html.includes('id="care-retry"')||!html.includes('id="view-profile"'))throw Error('Hosted HTML does not match this release.');
 if(!home.headers.get('content-security-policy')?.includes("default-src 'self'"))throw Error('Missing expected security headers.');results.push('Release HTML and security headers');
 const assets=new Set([...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1]).filter(p=>!p.startsWith('#')&&!/^[a-z]+:/i.test(p)&&!p.startsWith('//')));
 for(const asset of assets){const url=new URL(asset,root);if(url.origin!==root.origin)throw Error('Unexpected asset origin');await get(url.pathname,url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.js')?'javascript':'');}results.push(`${assets.size} referenced local assets`);
 const status=await get('/api/care-chat','application/json');if(!status.headers.get('cache-control')?.includes('no-store'))throw Error('AI status must not be cached');const body=await status.json();if(typeof body.available!=='boolean'||!['string','object'].includes(typeof body.provider)||Object.keys(body).some(k=>!['available','provider'].includes(k)))throw Error('Invalid AI status schema');results.push(body.available?'AI configuration enabled (inference still unverified)':'AI disabled; configure server credentials to enable');
 return results;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{for(const result of await checkHosted(process.argv[2]||''))console.log('PASS',result);console.log('Read-only smoke check complete. AI inference, email, browser workflows and platform rate limiting require separate verification.');}catch{console.error('FAIL deployment check: verify the site root, release assets, security headers and /api/care-chat routing. No credentials or response bodies logged.');process.exitCode=1;}}
