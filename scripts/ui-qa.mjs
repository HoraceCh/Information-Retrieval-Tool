// Deterministic local UI evidence. Fixture results test rendering, not live AI.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || '/workspace/browser-qa/node_modules/playwright/index.mjs'));
const {default:AxeBuilder}=await import(pathToFileURL(process.env.AXE_MODULE || '/workspace/browser-qa/node_modules/@axe-core/playwright/dist/index.mjs'));
const out=path.resolve(process.env.QA_OUTPUT || 'artifacts/ui-qa');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{})});
const report={time:new Date().toISOString(),source:process.env.QA_SOURCE||'local-built-preview',base:process.env.QA_BASE||'http://127.0.0.1:4173/',fixture:'rendering-only; no live AI, speech or database claims',states:[],errors:[]};
const result={keywords:[{original:'机器人',zhSynonyms:['机器人','机械臂'],enSynonyms:['robotics','robotic arm']}],booleanQuery:'("robotics" OR "robotic arm") AND "motion planning"',fieldSpecificQuery:'TS=(("robotics" OR "robotic arm") AND "motion planning")',schemaMapping:[{field:'TS',mappedConcept:'Topic',reason:'Fixture field mapping'}],explanation:'QA fixture: robotics motion planning; verify the query on the target database.',suggestedUrls:[]};
async function evidence(page,name){
 await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
 const geometry=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main select, main input, main textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+2||r.left< -2}).map(e=>({tag:e.tagName,label:e.getAttribute('aria-label'),id:e.id}))}));
 report.states.push({name,geometry,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:axe.incomplete.map(v=>({id:v.id,count:v.nodes.length}))});
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
}
try{
for(const theme of ['dark','light'])for(const [device,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(({theme,result})=>{localStorage.setItem('visited-guided-search-v1.0','true');localStorage.setItem('ai_retrieval_theme',theme);localStorage.setItem('ai_retrieval_history',JSON.stringify([{id:'qa-fixture',timestamp:1700000000000,input:'QA fixture robotics motion planning',dbType:'Web of Science核心合集 (SCI-E/SSCI/CPCI-S)',langPref:'Bilingual (双语混合)',result}]))},{theme,result});
 await page.goto(report.base,{waitUntil:'networkidle'});
 await evidence(page,`${theme}-${device}-builder`);
 console.log('builder captured',theme,device,page.url(),await page.locator('footer').innerText());
 await page.locator('footer').getByText('HISTORY', {exact:true}).click();
 await page.getByText('QA fixture robotics motion planning',{exact:true}).click();
 await page.locator('.formula-code-box').waitFor();
 await evidence(page,`${theme}-${device}-result`);
  const synonym = page.getByRole('button',{name:'排除同义词 robotics',exact:true});
  await synonym.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.formula-code-box')?.textContent.includes('"robotics"'));
  if (!(await page.locator('.formula-code-box').innerText()).includes('robotic arm')) throw new Error('Excluding one synonym removed the remaining term');
  await evidence(page,`${theme}-${device}-keyword-edit`);
 if(device==='desktop'){
  await page.getByRole('button',{name:/测试检测|Test Check/}).click();
  await evidence(page,`${theme}-validation-error`);
  await page.getByRole('button',{name:/^SETTINGS$/i}).first().click();
  await evidence(page,`${theme}-settings`);
  // Leave the modal via its close control using the current DOM, then navigate.
  const close=page.locator('[role="dialog"] button[aria-label*="Close"], [role="dialog"] button[aria-label*="关闭"]');
  if(await close.count())await close.first().click();else await page.keyboard.press('Escape');
  // Reload resets only component UI while preserving fixture/theme.
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('button',{name:/项目介绍 \/ ABOUT|^About$/i}).first().click();
  await evidence(page,`${theme}-about`);
  await page.getByRole('button',{name:/官方网址速查 \(OFFICIAL WHITELIST\)/i}).first().click();
  await evidence(page,`${theme}-whitelist`);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('button[title*="离线安装"]:visible').first().click();
  await evidence(page,`${theme}-offline-dialog`);
 }
 await context.close();
}
}finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
const violations=report.states.reduce((n,s)=>n+s.violations.length,0);const overflow=report.states.filter(s=>s.geometry.scrollWidth>s.geometry.width+2||s.geometry.overflow.length);
for (const state of report.states) if (state.violations.length) console.error(JSON.stringify({state:state.name,violations:state.violations},null,2));
console.log(JSON.stringify({states:report.states.length,violations,overflow:overflow.map(s=>s.name),errors:report.errors},null,2));
if(violations||overflow.length||report.errors.length)process.exitCode=1;
