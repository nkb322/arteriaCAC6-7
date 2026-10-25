import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
const root = process.argv.includes('--production') ? path.resolve('dist') : process.cwd();
const headerText=await readFile(path.join(root,'_headers'),'utf8').catch(()=>'');
const security=Object.fromEntries(headerText.split('\n').filter(line=>line.startsWith('  ')).map(line=>{const i=line.indexOf(':');return [line.slice(0,i).trim(),line.slice(i+1).trim()];}));
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.svg':'image/svg+xml'};
http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.split('/').some(part => part.startsWith('.'))) throw new Error();
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !(await stat(file)).isFile()) throw new Error();
    res.writeHead(200, {...security, 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch { res.writeHead(404).end('Not found'); }
}).listen(Number(process.env.PORT || 8766), '127.0.0.1', () => console.log('Arteria: http://127.0.0.1:' + (process.env.PORT || 8766)));
