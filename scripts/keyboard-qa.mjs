/** Keyboard interaction and text resizing regressions; no screenshot-only a11y claims. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || '/workspace/browser-qa/node_modules/playwright/index.mjs'));
const output=path.resolve(process.env.KEYBOARD_QA_OUTPUT || 'artifacts/keyboard-qa');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page=await context.newPage();page.setDefaultTimeout(15000);const report={time:new Date().toISOString(),checks:[],limits:['Root font 200% plus 640px reflow scenario; not OS magnification, screen-reader or full-browser zoom certification.']};
const assert=(x,message)=>{if(!x)throw new Error(message);};
await page.addInitScript(()=>localStorage.setItem('visited-guided-search-v1.0','true'));
try{
 await page.goto(process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 const skip=page.getByRole('link',{name:/skip.*(main|content)|跳.*主.*内容|跳过导航/i}).first();
 if(await skip.count()){
  await page.keyboard.press('Tab');assert(await skip.evaluate(e=>e===document.activeElement),'Skip link is not first keyboard focus target');
  await page.keyboard.press('Enter');assert(await page.evaluate(()=>document.activeElement?.tagName==='MAIN'||document.activeElement?.id==='main-content'),'Skip link did not focus main content');
  report.checks.push({name:'Skip navigation is first focus target and focuses main',status:'PASS'});
 }else{report.checks.push({name:'Skip navigation link',status:'FAIL',detail:'No accessible skip link found'});}
 const settings=page.getByRole('button',{name:/^SETTINGS$|^设置$/i}).first();
 await settings.focus();await page.keyboard.press('Enter');
 const dialog=page.getByRole('dialog',{name:'System configuration'});await dialog.waitFor();
 assert(await dialog.evaluate(e=>e.contains(document.activeElement)),'Dialog did not receive focus');
 const items=dialog.locator('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]');
 const visible=[];for(let i=0;i<await items.count();i++)if(await items.nth(i).isVisible())visible.push(items.nth(i));
 await visible.at(-1).focus();await page.keyboard.press('Tab');assert(await visible[0].evaluate(e=>e===document.activeElement),'Forward focus escaped dialog');
 await page.keyboard.press('Shift+Tab');assert(await visible.at(-1).evaluate(e=>e===document.activeElement),'Reverse focus escaped dialog');
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await settings.evaluate(e=>e===document.activeElement),'Closing dialog did not restore launcher focus');
 report.checks.push({name:'Configuration dialog focus entry, forward/reverse trap, Escape and return',status:'PASS'});
 const focusedOutline=await settings.evaluate(e=>{const c=getComputedStyle(e);return {style:c.outlineStyle,width:parseFloat(c.outlineWidth)}});
 assert(focusedOutline.style!=='none'&&focusedOutline.width>=2,'Keyboard focus indicator not visible');report.checks.push({name:'Keyboard focus indicator has visible outline',status:'PASS'});
 for(const [name,launcher] of [
  ['Query history',page.getByRole('button',{name:'History',exact:true}).first()],
  ['Offline installation',page.locator('button[title*="离线安装"]:visible').first()]
 ]){
  await launcher.focus();await page.keyboard.press('Enter');
  const surface=page.getByRole('dialog').last();await surface.waitFor();
  assert(await surface.evaluate(e=>e.contains(document.activeElement)),`${name}: dialog entry focus`);
  const controls=surface.locator('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]');
  const present=[];for(let i=0;i<await controls.count();i++)if(await controls.nth(i).isVisible())present.push(controls.nth(i));
  await present.at(-1).focus();await page.keyboard.press('Tab');assert(await present[0].evaluate(e=>e===document.activeElement),`${name}: focus escaped`);
  await page.keyboard.press('Escape');await surface.waitFor({state:'hidden'});assert(await launcher.evaluate(e=>e===document.activeElement),`${name}: focus return lost`);
  report.checks.push({name:`${name}: focus entry, trap, Escape and return`,status:'PASS'});
 }
 for(const theme of ['dark','light']){
  await page.evaluate(t=>{localStorage.setItem('ai_retrieval_theme',t)},theme);await page.reload({waitUntil:'networkidle'});await page.setViewportSize({width:640,height:960});
  await page.addStyleTag({content:'html { font-size: 200% !important; }'});
  const geometry=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main select, main textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+2||r.left< -2}).map(e=>({tag:e.tagName,label:e.getAttribute('aria-label'),rect:{x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width}}))}));
  report.lastGeometry=geometry;assert(geometry.document<=geometry.viewport+2&&geometry.overflow.length===0,`${theme}: narrow root-font 200% control overflow`);
  await page.screenshot({path:path.join(output,`${theme}-root-font-200.png`),fullPage:true});
  report.checks.push({name:`${theme}: 200% root font with 640px reflow`,status:'PASS',geometry});
 }
 if(report.checks.some(c=>c.status==='FAIL'))process.exitCode=1;
}catch(error){report.failure=error.message;await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report.checks,null,2));
