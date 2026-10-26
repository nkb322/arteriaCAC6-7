const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{fork}=require('node:child_process');
(async()=>{
 const server=fork(path.resolve('tests/product-server.mjs'),[],{stdio:['ignore','pipe','pipe','ipc']});let browser;const errors=[];
 try{
  await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(String(data).includes('Arteria test product'))resolve();});server.once('exit',()=>reject(Error('test server failed')));});
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{channel:'chrome'})});
  const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});await context.addInitScript(()=>{
   class MockCharacteristic extends EventTarget{constructor(){super();this.value=null;this.timer=null;}async startNotifications(){window.__mockBleStarted=true;const self=this;this.timer=setInterval(()=>{const n=(self.n=(self.n||0)+1),bytes=new TextEncoder().encode(JSON.stringify({sequence:n,deviceTimeMs:n*40,raw:{optical:2000+Math.round(100*Math.sin(n/4))}})+'\n');self.value=new DataView(bytes.buffer);self.dispatchEvent(new Event('characteristicvaluechanged'));},40);return this;}async stopNotifications(){clearInterval(this.timer);}}
   const characteristic=new MockCharacteristic(),device=new EventTarget();device.name='Reference emulator';device.id='test-only-browser-id';device.gatt={connected:false,connect:async()=>{device.gatt.connected=true;return{getPrimaryService:async()=>({getCharacteristic:async()=>characteristic})};},disconnect(){device.gatt.connected=false;device.dispatchEvent(new Event('gattserverdisconnected'));}};
   Object.defineProperty(navigator,'bluetooth',{configurable:true,value:{requestDevice:async()=>device}});
  });
  const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8773/#photon');await page.waitForFunction(()=>!document.getElementById('scan-button').disabled);
  const cfg={schemaVersion:1,transport:'ble',descriptor:{schemaVersion:1,origin:'hardware',deviceId:'emulator-board',deviceName:'Reference emulator',sampleRateHz:25,channels:[{id:'optical',label:'Optical signal',unit:'a.u.',min:0,max:4095}]},ble:{serviceUUID:'1234',characteristicUUID:'abcd'}};
  await page.selectOption('#source-select','ble');
  await page.locator('#hardware-config-file').setInputFiles({name:'emulator-config.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(cfg))});
  await page.waitForFunction(()=>!document.getElementById('connect-device').disabled);
  assert.match(await page.locator('#device-connection-status').textContent(),/Configuration valid/);
  await page.click('#connect-device');
  await page.waitForFunction(()=>document.getElementById('device-connection-status').textContent.includes('Device connected')||document.getElementById('measurement-error').textContent.length>0);
  assert.equal(await page.locator('#device-connection-status').textContent(),'Device connected. Start a measurement when ready.',await page.locator('#measurement-error').textContent());
  assert.equal(await page.locator('#device-name').textContent(),'Reference emulator');
  await page.click('#scan-button');
  await page.waitForFunction(()=>Number(document.getElementById('overview-count').textContent)>20);
  assert.equal(await page.evaluate(()=>window.__mockBleStarted),true);
  assert.match(await page.locator('#analysis-meta').textContent(),/HARDWARE.*acquisition/i);
  await page.click('#stop-button');
  await page.waitForFunction(()=>Number(document.getElementById('history-count').textContent)>0);
  assert.equal(await page.locator('#device-connection-status').textContent(),'Device disconnected.');
  assert.match(await page.locator('#analysis-report').textContent(),/engineering data/i);
  assert.equal(await page.locator('#device-battery').textContent(),'Not supplied');
  const [{importSession,exportCSV}]=await Promise.all([import('../js/measurement/export.js')]);const fixture=JSON.parse(fs.readFileSync('fixtures/simulated-session.json','utf8')).session;const csv=exportCSV(importSession(JSON.stringify({format:'arteria-session',version:1,session:fixture})));
  await page.selectOption('#source-select','replay');await page.locator('#replay-file').setInputFiles({name:'recording.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});await page.waitForFunction(()=>document.getElementById('scan-button').disabled===false&&document.getElementById('replay-description').textContent.includes('100'));
  await page.click('#scan-button');await page.waitForFunction(()=>!document.getElementById('stop-button').disabled);await page.waitForFunction(()=>!document.getElementById('scan-button').disabled,undefined,{timeout:10000});assert.match(await page.locator('#analysis-meta').textContent(),/SIMULATED.*replay/i);assert.deepEqual(errors,[]);
  console.log('PASS browser BLE emulator connection, shared validated acquisition, disconnect/save, unavailable battery, CSV import and replay');
 }finally{await browser?.close();server.kill();fs.mkdirSync('test-results',{recursive:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
