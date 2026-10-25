import {mkdir,rm,cp} from 'node:fs/promises';
const out=new URL('../dist/',import.meta.url);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
// Explicit public allowlist: no source tests, environment files or backend code.
for(const name of ['index.html','app.js','styles.css','js','fixtures','LICENSE','_headers'])await cp(new URL('../'+name,import.meta.url),new URL(name,out),{recursive:true});
console.log('Release candidate built in dist/');
