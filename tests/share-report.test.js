import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../netlify/functions/share-report.mjs';
const encryptedFile='ARTERIA-ENCRYPTED-V1\n'+Buffer.alloc(16,1).toString('base64')+'\n'+Buffer.alloc(12,2).toString('base64')+'\n'+Buffer.alloc(32,3).toString('base64');
const env={RESEND_API_KEY:'fake-test-key',RESEND_FROM_EMAIL:'test@example.com',ARTERIA_ALLOWED_RECIPIENTS:'allowed@example.com'};
const request=(body={email:'allowed@example.com',encryptedFile},headers={},method='POST')=>new Request('https://arteria.example/.netlify/functions/share-report',{method,headers:{origin:'https://arteria.example','content-type':'application/json',...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})});
test('email guards method, origin, content type, input and canonical attachment',async()=>{
  const h=createHandler({env});assert.equal((await h(request({}, {},'GET'))).status,405);assert.equal((await h(request({}, {origin:'https://evil.example'}))).status,403);assert.equal((await h(request({}, {'content-type':'text/plain'}))).status,415);
  assert.equal((await h(request({email:'bad',encryptedFile}))).status,400);assert.equal((await h(request({email:'allowed@example.com',encryptedFile:'bad'}))).status,400);assert.equal((await h(request({email:'allowed@example.com',encryptedFile,website:'bot'}))).status,400);
});
test('email is disabled without credentials AND configured recipients',async()=>{
  for(const config of [{},{...env,ARTERIA_ALLOWED_RECIPIENTS:''}])assert.equal((await createHandler({env:config})(request())).status,503);
});
test('arbitrary recipients never reach provider',async()=>{
  let called=false;const h=createHandler({env,fetchImpl:async()=>{called=true;return new Response()}});assert.equal((await h(request({email:'other@example.com',encryptedFile}))).status,403);assert.equal(called,false);
});
test('configured encrypted email uses only ciphertext and idempotent provider request',async()=>{
  let captured;const h=createHandler({env,fetchImpl:async(url,options)=>{captured={url,options};return new Response('{}')}});assert.equal((await h(request())).status,200);const body=JSON.parse(captured.options.body);assert.deepEqual(body.to,['allowed@example.com']);assert.equal(Buffer.from(body.attachments[0].content,'base64').toString(),encryptedFile);assert.equal(captured.options.headers['Idempotency-Key'].length,64);assert.ok(captured.options.signal);
});
test('per-instance email cap resets and provider failures do not disclose secrets',async()=>{
  let time=0;const h=createHandler({env,now:()=>time,fetchImpl:async()=>new Response('{}')});for(let i=0;i<3;i++)assert.equal((await h(request())).status,200);assert.equal((await h(request())).status,429);time=60001;assert.equal((await h(request())).status,200);
  const failing=createHandler({env,fetchImpl:async()=>{throw Error('secret-test-key')}});const response=await failing(request());assert.equal(response.status,502);assert.ok(!(await response.text()).includes('secret-test-key'));
});
test('oversized and malformed streamed bodies are bounded',async()=>{
  const h=createHandler({env});assert.equal((await h(request({}, {'content-length':'999999'}))).status,413);
  const r=new Request('https://arteria.example/.netlify/functions/share-report',{method:'POST',headers:{origin:'https://arteria.example','content-type':'application/json'},body:'{broken'});assert.equal((await h(r)).status,400);
});
