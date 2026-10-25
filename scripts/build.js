import {mkdir,rm,cp} from 'node:fs/promises';
const out=new URL('../dist/',import.meta.url);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
// Explicit public allowlist: no source tests, environment files or backend code.
for(const name of ['index.html','app.js','styles.css','js','fixtures','LICENSE','_headers','manifest.webmanifest','icons'])await cp(new URL('../'+name,import.meta.url),new URL(name,out),{recursive:true});
const {readdir,readFile,writeFile}=await import('node:fs/promises');
const {createHash}=await import('node:crypto');
async function paths(dir,prefix=''){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const path=prefix+e.name;if(e.isDirectory())result.push(...await paths(new URL(e.name+'/',dir),path+'/'));else if(!['LICENSE','_headers'].includes(path)&&!path.startsWith('fixtures/'))result.push('/'+path);}return result;}
const assets=(await paths(out)).sort();const hash=createHash('sha256');for(const path of assets)hash.update(await readFile(new URL('.'+path,out)));
const worker=(await readFile(new URL('./service-worker-template.js',import.meta.url),'utf8')).replace('__CACHE_NAME__',JSON.stringify('arteria-shell-'+hash.digest('hex').slice(0,16))).replace('__PUBLIC_ASSETS__',JSON.stringify(assets));
await writeFile(new URL('sw.js',out),worker);
console.log('Release candidate built in dist/');
