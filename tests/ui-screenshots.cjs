const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{fork}=require('node:child_process');

(async()=>{
  const server=fork(path.resolve('tests/product-server.mjs'),[],{stdio:['ignore','pipe','pipe','ipc']});
  const output=process.env.ARTERIA_SCREENSHOT_DIR||path.resolve('..','arteria-ui-review');
  let browser;
  try{
    await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('Arteria test product'))resolve();});server.once('exit',()=>reject(Error('screenshot server exited')));});
    fs.mkdirSync(output,{recursive:true});
    browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{channel:'chrome'})});
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const base='http://127.0.0.1:8773';
    await page.goto(base+'/#overview');await page.waitForFunction(()=>!document.getElementById('scan-button').disabled);
    await page.click('[data-view="photon"]');await page.selectOption('#duration-select','10');await page.click('#scan-button');
    await page.waitForFunction(()=>Number(document.getElementById('overview-count').textContent)>30);await page.click('#stop-button');await page.waitForFunction(()=>!document.getElementById('scan-button').disabled);
    const views=['overview','photon','trends','locator','sharing','care','profile'];
    for(const [size,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
      await page.setViewportSize(viewport);
      for(const view of views){
        if(view==='profile')await page.click('#top-profile');else await page.click(`[data-view="${view}"]`);await page.waitForTimeout(150);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
        assert.equal(overflow,false,`${view} overflows at ${size}`);
        await page.locator(`#view-${view}`).screenshot({path:path.join(output,`${size}-${view}.png`),animations:'disabled'});
        await page.screenshot({path:path.join(output,`${size}-${view}-application.png`),fullPage:true,animations:'disabled'});
        if(view==='care'&&size==='desktop'){
          await page.check('#care-ai-consent');await page.fill('#chat-input','What does signal quality mean?');await page.click('#chat-form [type="submit"]');
          await page.waitForFunction(()=>document.getElementById('chat-form').getAttribute('aria-busy')==='false');
          await page.locator('#view-care').screenshot({path:path.join(output,'desktop-care-response.png'),animations:'disabled'});
        }
        if(view==='trends'&&size==='desktop'){
          await page.click('#history-preview');await page.waitForFunction(()=>document.getElementById('report-preview').open);
          await page.locator('#report-preview').screenshot({path:path.join(output,'desktop-report-preview.png'),animations:'disabled'});
          await page.keyboard.press('Escape');
        }
      }
    }
    assert.deepEqual(errors,[]);
    console.log(`Captured ${fs.readdirSync(output).length} screenshots in ${output}`);
  }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
