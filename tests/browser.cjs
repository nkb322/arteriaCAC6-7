// Browser-only regression and IndexedDB tests. No real hardware or email is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {fork} = require('node:child_process');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const results = [];
async function step(name, run) {
  try { const detail = await run(); results.push({name, status:'PASS', detail}); console.log('PASS',name); }
  catch (error) { results.push({name,status:'FAIL',detail:error.message}); throw error; }
}
(async () => {
  fs.mkdirSync('test-results',{recursive:true});
  const server=fork(path.resolve('scripts/serve.js'),[],{env:{...process.env,PORT:'8767'},stdio:['ignore','pipe','pipe','ipc']});
  let browser;
  try {
    await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(String(data).includes('Arteria:'))resolve()});server.once('exit',code=>reject(Error('Server exited '+code)));});
    browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {channel:'chrome'})});
    const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:8767');
    await page.waitForFunction(()=>document.getElementById('device-state').textContent==='Disconnected');
    await step('Honest empty state and preserved navigation',async()=>{
      assert.equal(await page.locator('#overview-count').textContent(),'0');assert.equal(await page.locator('#device-battery').textContent(),'Not supplied');
      for(const view of ['photon','trends','locator','sharing','care','overview']) {await page.locator(`[data-view="${view}"]`).click();assert.equal(await page.locator('.view:visible').getAttribute('id'),'view-'+view)}
    });
    await step('IndexedDB commits, survives a new connection, and deletes records',async()=>{
      const value=await page.evaluate(async()=>{const {SessionStore}=await import('/js/measurement/session-store.js');const store=new SessionStore();const s={id:'storage-fixture',startedAt:new Date().toISOString(),samples:[],descriptor:{},mode:'stream'};await store.save(s);const second=new SessionStore();const loaded=await second.get(s.id);await second.delete(s.id);return {loaded:loaded.id,deleted:await store.get(s.id)}});
      assert.equal(value.loaded,'storage-fixture');assert.equal(value.deleted,undefined);
    });
    await step('Acquisition feeds Overview, live SVG, missing-sample checks and stale/resume',async()=>{
      await page.click('[data-view="photon"]');await page.selectOption('#scenario-select','dropout');await page.selectOption('#duration-select','10');await page.click('#scan-button');
      await page.waitForFunction(()=>Number(document.getElementById('overview-count').textContent)>10);assert.match(await page.locator('#device-state').textContent(),/Demo/);
      await page.waitForFunction(()=>document.getElementById('device-state').textContent.startsWith('Stale'),{},{timeout:8000});
      await page.waitForFunction(()=>document.getElementById('device-state').textContent==='Demo streaming',{},{timeout:6000});
      assert.ok(await page.locator('#acquisition-chart path').getAttribute('d'));
      await page.click('#stop-button');await page.waitForFunction(()=>!document.getElementById('current-json').disabled);
      assert.match(await page.locator('#acquisition-stats').textContent(),/Missing sequence samples: 75/);assert.equal(await page.locator('#device-state').textContent(),'Disconnected');
    });
    let exported;
    await step('JSON and CSV downloads retain sample data, units and source',async()=>{
      let download=page.waitForEvent('download');await page.click('#current-json');exported=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
      assert.equal(exported.session.descriptor.origin,'simulated');assert.equal(exported.session.derived.missing,75);assert.ok(exported.session.samples.length>75);
      download=page.waitForEvent('download');await page.click('#current-csv');const csv=fs.readFileSync(await (await download).path(),'utf8');assert.match(csv,/optical \[a.u.\]/);assert.match(csv,/simulated/);assert.equal(csv.split('\r\n').length,exported.session.samples.length+1);
    });
    await step('History survives reload and restores Overview without hardcoded readings',async()=>{
      await page.reload();await page.waitForFunction(()=>Number(document.getElementById('overview-count').textContent)>75);await page.click('[data-view="trends"]');assert.equal(await page.locator('.session-choice').count(),1);assert.ok(await page.locator('#history-chart path').getAttribute('d'));
      const dates=await page.evaluate(async()=>{const {SessionStore}=await import('/js/measurement/session-store.js');const store=new SessionStore();const s=(await store.list())[0];s.id='old-fixture';s.startedAt=new Date(Date.now()-20*86400000).toISOString();await store.save(s);return s.startedAt});
      await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.session-choice').length===1);await page.selectOption('#range-select','30');await page.waitForFunction(()=>document.querySelectorAll('.session-choice').length===2);assert.match(await page.locator('#trend-range-title').textContent(),/30/);return dates;
    });
    await step('Saved recording replays through same pipeline with original timestamps',async()=>{
      await page.click('#history-replay');await page.selectOption('#replay-speed','4');await page.click('#scan-button');await page.waitForFunction(()=>!document.getElementById('current-json').disabled,{},{timeout:12000});
      const download=page.waitForEvent('download');await page.click('#current-json');const replay=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));assert.equal(replay.session.mode,'replay');assert.equal(replay.session.descriptor.origin,'simulated');assert.deepEqual(replay.session.samples.map(s=>s.raw),exported.session.samples.map(s=>s.raw));assert.equal(replay.session.samples[0].originalReceivedAt,exported.session.samples[0].receivedAt);
    });
    await step('Invalid recording rejected and valid JSON file loads',async()=>{
      await page.locator('#replay-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"format":"bad"}')});await page.waitForFunction(()=>document.getElementById('measurement-error').textContent.includes('Unsupported'));assert.equal(await page.locator('#scan-button').isDisabled(),true);
      await page.locator('#replay-file').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await page.waitForFunction(()=>!document.getElementById('scan-button').disabled);
    });
    await step('Bilingual measurement state, labels and accessibility controls',async()=>{
      await page.selectOption('#language-select','es');await page.waitForFunction(()=>document.getElementById('scan-button').textContent==='Iniciar adquisición');assert.match(await page.locator('#replay-description').textContent(),/SIMULADO/);assert.match(await page.locator('#history-chart svg').getAttribute('aria-label'),/SIMULADO/);
      await page.click('#accessibility-open');await page.check('#large-text-toggle');await page.check('#contrast-toggle');await page.check('#motion-toggle');await page.keyboard.press('Escape');assert.equal(await page.locator('#accessibility-modal').isVisible(),false);assert.equal(await page.locator('.nav-link').first().evaluate(el=>getComputedStyle(el).fontSize),'16px');await page.selectOption('#language-select','en');
    });
    await step('Clinic locator regression with controlled public-service responses',async()=>{
      await page.route('https://nominatim.openstreetmap.org/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify([{lat:'29.424',lon:'-98.494',name:'San Antonio'}])}));
      await page.route('https://photon.komoot.io/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({features:[{properties:{name:'Test Clinic',osm_value:'clinic',extra:{wheelchair:'yes'}},geometry:{coordinates:[-98.494,29.424]}}]})}));
      await page.click('[data-view="locator"]');assert.equal(await page.locator('#use-location-button').isDisabled(),true);await page.fill('#area-query','San Antonio');await page.locator('#area-search-form button').click();await page.waitForSelector('.service-card');assert.equal(await page.locator('.service-card h3').textContent(),'Test Clinic');await page.check('#step-free-filter');assert.equal(await page.locator('.service-card').count(),1);
    });
    await step('Existing encryption/decryption works; email transport is intercepted',async()=>{
      let body;await page.route('**/.netlify/functions/share-report',r=>{body=r.request().postDataJSON();return r.fulfill({contentType:'application/json',body:'{"message":"Encrypted file sent."}'})});
      await page.click('[data-view="sharing"]');await page.fill('#share-email','test@example.com');await page.fill('#share-notes','Synthetic regression note');await page.fill('#share-passphrase','Test-passphrase-123');await page.fill('#share-passphrase-confirm','Test-passphrase-123');await page.check('#share-consent');await page.click('#share-submit');await page.waitForFunction(()=>document.getElementById('share-status').textContent.includes('on its way'));
      assert.ok(!JSON.stringify(body).includes('Test-passphrase'));assert.ok(!JSON.stringify(body).includes('Synthetic regression note'));
      await page.locator('#encrypted-file').setInputFiles({name:'note.arteria',mimeType:'application/octet-stream',buffer:Buffer.from(body.encryptedFile)});await page.fill('#decrypt-passphrase','Test-passphrase-123');let d=page.waitForEvent('download');await page.click('#decrypt-button');assert.match(fs.readFileSync(await (await d).path(),'utf8'),/Synthetic regression note/);
      await page.fill('#decrypt-passphrase','incorrect');await page.click('#decrypt-button');await page.waitForFunction(()=>!document.getElementById('decrypt-button').disabled);assert.match(await page.locator('#decrypt-status').textContent(),/passphrase/);
    });
    await step('Companion and input-as-text regression',async()=>{
      await page.click('[data-view="care"]');await page.fill('#chat-input','<img src=x onerror=alert(1)>');await page.locator('#chat-form button[type=submit]').click();assert.equal(await page.locator('#chat-log img').count(),0);
    });
    await step('Responsive layouts keep six views within 320 and 390 px',async()=>{
      const overflow=[];for(const width of [390,320]){await page.setViewportSize({width,height:844});for(const v of ['overview','photon','trends','locator','sharing','care']){await page.click(`[data-view="${v}"]`);await page.waitForTimeout(100);const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));if(size.scroll>size.client)overflow.push({width,v,...size});}}assert.deepEqual(overflow,[]);
    });
    await page.setViewportSize({width:1440,height:1000});await page.click('[data-view="photon"]');await page.screenshot({path:'test-results/acquisition.png',fullPage:true});await page.click('[data-view="overview"]');await page.screenshot({path:'test-results/overview.png',fullPage:true});
    await step('Storage failure preserves export and blocks silent replacement',async()=>{
      const recovery=await context.newPage();await recovery.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:undefined}));
      await recovery.goto('http://127.0.0.1:8767/#photon');await recovery.click('#scan-button');await recovery.waitForFunction(()=>Number(document.getElementById('overview-count').textContent)>5);await recovery.click('#stop-button');
      await recovery.waitForFunction(()=>!document.getElementById('retry-save').hidden);assert.equal(await recovery.locator('#scan-button').isDisabled(),true);assert.equal(await recovery.locator('#current-json').isDisabled(),false);assert.match(await recovery.locator('#measurement-error').textContent(),/storage/);
      const d=recovery.waitForEvent('download');await recovery.click('#current-json');assert.ok(JSON.parse(fs.readFileSync(await (await d).path(),'utf8')).session.samples.length>5);await recovery.close();
    });
    await step('No uncaught application errors',async()=>assert.deepEqual(errors,[]));
  } finally { if(browser)await browser.close();server.kill();fs.writeFileSync('test-results/browser-results.json',JSON.stringify(results,null,2)); }
})().catch(error=>{console.error(error);process.exitCode=1});
