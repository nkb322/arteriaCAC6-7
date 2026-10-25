const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{fork}=require('node:child_process');
const results=[];async function step(name,run){try{const detail=await run();results.push({name,status:'PASS',detail});console.log('PASS',name)}catch(e){results.push({name,status:'FAIL',detail:e.message});throw e}}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'arteria-rc-')),server=fork(path.resolve('scripts/serve.js'),['--production'],{env:{...process.env,PORT:'8768'},stdio:['ignore','pipe','pipe','ipc']});let context;
 const options={headless:true,acceptDownloads:true,viewport:{width:1440,height:1000},...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{channel:'chrome'})};
 try{
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('Arteria:'))resolve()});server.once('exit',()=>reject(Error('preview failed')))});
  context=await chromium.launchPersistentContext(profile,options);let page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const origin='http://127.0.0.1:8768';await page.goto(origin+'/#photon');
  await step('Production allowlist, headers, modules and honest source options',async()=>{
   const r=await page.request.get(origin);assert.match(r.headers()['content-security-policy'],/script-src 'self'/);assert.equal((await page.request.get(origin+'/tests/browser.cjs')).status(),404);assert.equal((await page.request.get(origin+'/netlify/functions/share-report.mjs')).status(),404);await page.waitForFunction(()=>!document.getElementById('scan-button').disabled);assert.deepEqual(await page.locator('#source-select option').evaluateAll(els=>els.map(e=>e.value)),['simulation','replay','mock']);
  });
  await step('Existing v1 measurement history migrates without losing samples',async()=>{
   const isolated=await context.browser().newContext();const migration=await isolated.newPage();await migration.goto(origin+'/fixtures/simulated-session.json');
   const fixture=JSON.parse(fs.readFileSync('fixtures/simulated-session.json','utf8')).session;
   await migration.evaluate(s=>new Promise((resolve,reject)=>{const r=indexedDB.open('arteria-measurements-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('sessions',{keyPath:'id'});r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('sessions','readwrite');tx.objectStore('sessions').put({...s,startedAt:new Date().toISOString()});tx.oncomplete=()=>{db.close();resolve();};};}),fixture);
   await migration.goto(origin+'/#trends');await migration.waitForSelector('.session-choice');assert.equal(await migration.locator('#history-samples').textContent(),'100');await isolated.close();
  });
  let checkpoint;
  await step('Incremental checkpoints preserve samples and another tab cannot steal active recording',async()=>{
   await page.selectOption('#duration-select','60');await page.click('#scan-button');await page.waitForFunction(()=>Number(document.getElementById('checkpoint-status').textContent.match(/\d+/)?.[0])>=25);
   checkpoint=await page.evaluate(async()=>{const {SessionStore}=await import('/js/measurement/session-store.js');const s=new SessionStore();return(await s.transaction(['chunks'],'readonly',tx=>tx.objectStore('chunks').getAll())).flatMap(c=>c.samples)});
   const second=await context.newPage();await second.goto(origin+'/#trends');await second.waitForFunction(()=>!document.getElementById('scan-button').disabled);assert.equal(await second.locator('.session-choice').count(),0);await second.close();assert.equal(await page.locator('#stop-button').isDisabled(),false);
  });
  await step('Browser closure/restart recovers committed samples, source and clocks',async()=>{
   await context.close();context=await chromium.launchPersistentContext(profile,options);page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/#trends');await page.waitForSelector('.session-choice');assert.match(await page.locator('.session-choice').textContent(),/Recovered/);
   const saved=await page.evaluate(async()=>{const {SessionStore}=await import('/js/measurement/session-store.js');return(await new SessionStore().list())[0]});assert.equal(saved.status,'interrupted');assert.equal(saved.recovered,true);assert.equal(saved.descriptor.origin,'simulated');assert.deepEqual(saved.samples.slice(0,checkpoint.length),checkpoint);return {samples:saved.samples.length,preservedCheckpointSamples:checkpoint.length};
  });
  await step('Recovered sessions export and replay without changing origin',async()=>{
   const d=page.waitForEvent('download');await page.click('#history-json');const saved=JSON.parse(fs.readFileSync(await(await d).path(),'utf8'));assert.equal(saved.session.recovered,true);await page.click('#history-replay');await page.selectOption('#replay-speed','4');await page.click('#scan-button');await page.waitForFunction(()=>!document.getElementById('current-json').disabled,{},{timeout:12000});assert.match(await page.locator('#overview-source').textContent(),/SIMULATED.*REPLAY/);
  });
  await step('Mock device exercises connection, duplicates, errors and a fresh restart',async()=>{
   await page.selectOption('#source-select','mock');await page.click('#scan-button');await page.waitForFunction(()=>document.getElementById('device-state').textContent==='Connection error',{},{timeout:10000});await page.waitForFunction(()=>!document.getElementById('current-json').disabled);assert.match(await page.locator('#acquisition-stats').textContent(),/Rejected frames: 7/);assert.match(await page.locator('#overview-source').textContent(),/SIMULATED/);await page.click('#scan-button');await page.waitForFunction(()=>Number(document.getElementById('overview-count').textContent)>3 && Number(document.getElementById('overview-count').textContent)<20);await page.click('#stop-button');await page.waitForFunction(()=>!document.getElementById('current-json').disabled);assert.ok(Number(await page.locator('#overview-count').textContent())<100);
  });
  await step('Session notes persist, two sessions compare, and an offline report is safe and complete',async()=>{
   await page.click('[data-view="trends"]');await page.waitForFunction(()=>document.querySelectorAll('.session-choice').length>=2);
   const id=await page.locator('.session-choice[aria-pressed="true"]').getAttribute('data-session-id');
   await page.fill('#session-notes','Review this recording <img src=x onerror=alert(1)>');await page.click('#save-session-notes');await page.waitForFunction(()=>document.getElementById('notes-status').textContent==='Notes saved locally.');
   await page.reload();await page.waitForSelector(`[data-session-id="${id}"]`);await page.click(`[data-session-id="${id}"]`);assert.match(await page.locator('#session-notes').inputValue(),/Review this recording/);
   const other=await page.locator('#compare-session option').nth(1).getAttribute('value');await page.selectOption('#compare-session',other);assert.equal(await page.locator('#comparison-panel').isVisible(),true);assert.equal(await page.locator('#comparison-panel svg').count(),2);assert.match(await page.locator('#comparison-stats').textContent(),/Accepted|accepted/);
   const d=page.waitForEvent('download');await page.click('#history-report');const report=await d;const html=fs.readFileSync(await report.path(),'utf8');assert.match(html,/SIMULATED/);assert.match(html,/Review this recording/);assert.ok(!html.includes('<img src=x'));await report.saveAs('test-results/session-report.html');
   const offline=await context.newPage();await offline.goto(require('node:url').pathToFileURL(path.resolve('test-results/session-report.html')).href);assert.equal(await offline.locator('svg').count(),1);assert.match(await offline.locator('body').textContent(),/No diagnosis/);await offline.close();
   await page.screenshot({path:'test-results/session-comparison.png',fullPage:true});
  });
  await step('Encrypted local download works without email/consent and tampering is rejected',async()=>{
   await page.click('[data-view="sharing"]');await page.fill('#share-notes','Private synthetic test note');await page.fill('#share-passphrase','Separate-passphrase-123');await page.fill('#share-passphrase-confirm','Separate-passphrase-123');let d=page.waitForEvent('download');await page.click('#download-encrypted');const encrypted=fs.readFileSync(await(await d).path(),'utf8');assert.ok(!encrypted.includes('Private synthetic'));
   await page.locator('#encrypted-file').setInputFiles({name:'note.arteria',mimeType:'application/octet-stream',buffer:Buffer.from(encrypted)});await page.fill('#decrypt-passphrase','Separate-passphrase-123');d=page.waitForEvent('download');await page.click('#decrypt-button');assert.match(fs.readFileSync(await(await d).path(),'utf8'),/Private synthetic test note/);
   const parts=encrypted.split('\n'),bytes=Buffer.from(parts[3],'base64');bytes[0]^=1;parts[3]=bytes.toString('base64');await page.locator('#encrypted-file').setInputFiles({name:'bad.arteria',mimeType:'application/octet-stream',buffer:Buffer.from(parts.join('\n'))});await page.fill('#decrypt-passphrase','Separate-passphrase-123');await page.click('#decrypt-button');await page.waitForFunction(()=>!document.getElementById('decrypt-button').disabled);assert.match(await page.locator('#decrypt-status').textContent(),/passphrase/);await page.click('#clear-note');assert.equal(await page.locator('#share-notes').inputValue(),'');
  });
  await step('Care actions, source-status popover and navigation history are functional',async()=>{
   await page.click('[data-view="care"]');assert.match(await page.locator('.chat-disclaimer').textContent(),/rule-based/);await page.click('#care-team-button');assert.equal(await page.locator('.view:visible').getAttribute('id'),'view-sharing');await page.goBack();assert.equal(await page.locator('.view:visible').getAttribute('id'),'view-care');await page.click('#notifications-button');assert.match(await page.locator('#top-popover').textContent(),/Current source status/);
  });
  await step('Clinic no-results, failure, access filter and injection-safe rendering',async()=>{
   await page.route('https://nominatim.openstreetmap.org/**',r=>{const q=new URL(r.request().url()).searchParams.get('q');return r.fulfill({status:q==='failure'?500:200,contentType:'application/json',body:JSON.stringify(q==='empty'?[]:[{lat:'29.424',lon:'-98.494',name:'San Antonio'}])})});
   await page.route('https://photon.komoot.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({features:[{properties:{name:'<img src=x onerror=alert(1)> Clinic',osm_value:'clinic'},geometry:{coordinates:[-98.494,29.424]}},{properties:{name:'Bad coordinates',osm_value:'clinic'},geometry:{coordinates:[9999,9999]}}]})}));
   await page.click('[data-view="locator"]');for(const [q,expected]of [['empty',/couldn’t find/],['failure',/couldn’t search/]]){await page.fill('#area-query',q);await page.locator('#area-search-form button').click();await page.waitForFunction(()=>!document.getElementById('locator-status').textContent.startsWith('Finding'));assert.match(await page.locator('#locator-status').textContent(),expected);}
   await page.fill('#area-query','San Antonio');await page.locator('#area-search-form button').click();await page.waitForSelector('.service-card');assert.equal(await page.locator('.service-card').count(),1);assert.equal(await page.locator('.service-card img').count(),0);await page.check('#step-free-filter');assert.equal(await page.locator('.service-card').count(),0);
  });
  await step('Spanish local-download controls, modal focus and mobile charts',async()=>{
   await page.selectOption('#language-select','es');assert.equal(await page.locator('#download-encrypted').textContent(),'Descargar nota cifrada');await page.click('#footer-accessibility');await page.keyboard.press('Escape');assert.equal(await page.locator(':focus').getAttribute('id'),'footer-accessibility');await page.setViewportSize({width:320,height:844});await page.click('[data-view="photon"]');const viewBox=await page.locator('#acquisition-chart svg').getAttribute('viewBox');assert.ok(Number(viewBox.split(' ')[2])<=760);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true);await page.selectOption('#language-select','en');
  });
  await step('Refresh recovers active acquisition and corrupt checkpoints remain isolated',async()=>{
   await page.click('[data-view="photon"]');await page.selectOption('#source-select','simulation');await page.selectOption('#duration-select','60');await page.click('#scan-button');await page.waitForFunction(()=>Number(document.getElementById('checkpoint-status').textContent.match(/\d+/)?.[0])>=25);
   page.once('dialog',d=>d.accept());await page.reload();await page.waitForFunction(()=>document.getElementById('recovery-status').textContent.includes('Recovered'));assert.match(await page.locator('#overview-source').textContent(),/SIMULATED/);
   const skipped=await page.evaluate(async()=>{const {SessionStore}=await import('/js/measurement/session-store.js');const store=new SessionStore(),s=(await store.list())[0];const {samples,derived,...meta}=s;meta.id='invalid-checkpoint';await store.checkpoint(meta,[{...samples[0],raw:{optical:'invalid'}}],0);await store.recover();return store.recoveryErrors});assert.equal(skipped,1);
  });
  await step('Explicit erase removes history AND recovery checkpoints',async()=>{
   await page.click('[data-view="trends"]');page.once('dialog',d=>d.accept());await page.click('#delete-all-sessions');await page.waitForFunction(()=>document.querySelectorAll('.session-choice').length===0);const counts=await page.evaluate(async()=>{const {SessionStore}=await import('/js/measurement/session-store.js');const s=new SessionStore();return Promise.all(['sessions','drafts','chunks'].map(name=>s.transaction([name],'readonly',tx=>tx.objectStore(name).count())))});assert.deepEqual(counts,[0,0,0]);
  });
  await page.setViewportSize({width:1440,height:1000});await page.click('[data-view="photon"]');await page.screenshot({path:'test-results/release-acquisition.png',fullPage:true});
  await step('No uncaught production application errors',async()=>assert.deepEqual(errors,[]));
 }finally{await context?.close();server.kill();fs.rmSync(profile,{recursive:true,force:true});fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/release-results.json',JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
