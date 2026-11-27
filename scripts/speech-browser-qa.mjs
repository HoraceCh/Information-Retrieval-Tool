/** Browser integration regression only: Chromium synthetic microphone + mocked proxy.
 * This does not exercise a real speech model, cloud credential or external service.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || '/workspace/browser-qa/node_modules/playwright/index.mjs'));
const output=path.resolve(process.env.SPEECH_QA_OUTPUT || 'artifacts/speech-browser-qa');fs.mkdirSync(output,{recursive:true});
const base=process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['microphone'],reducedMotion:'reduce'});
const page=await context.newPage();page.setDefaultTimeout(15000);
const report={time:new Date().toISOString(),base,kind:'MOCKED PROXY + SYNTHETIC MICROPHONE; not real provider E2E',browser:await browser.version(),checks:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
await page.addInitScript(()=>{localStorage.setItem('visited-guided-search-v1.0','true');localStorage.setItem('ai_retrieval_speech_proxy_url','https://speech-qa.invalid');});
let mode='success',requestCount=0,payloads=[],pending=[];
await page.route('https://speech-qa.invalid/**',async route=>{
 const req=route.request();if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'*'}});return;}
 requestCount++;payloads.push({path:new URL(req.url()).pathname,bytes:req.postDataBuffer()?.length||0,contentType:req.headers()['content-type']});
 let response={status:200,contentType:'application/json',body:JSON.stringify({text:`Mock transcript ${requestCount} 机器人 motion planning`})};
 if(mode==='invalid-json')response.body='not JSON';
 if(mode==='unavailable')response={...response,status:503,body:JSON.stringify({detail:'QA mock backend unavailable'})};
 if(mode==='timeout-response')response={...response,status:504,body:JSON.stringify({detail:'QA mock upstream timeout'})};
 if(mode==='network'){await route.abort('failed');return;}
 if(mode==='hold')await new Promise(resolve=>pending.push(resolve));
 await route.fulfill({...response,headers:{'access-control-allow-origin':'*'}}).catch(()=>{});
});
const assert=(value,message)=>{if(!value)throw new Error(message);};
const trigger=()=>page.getByRole('button',{name:/语音输入|Voice Input/i}).first();
const cancel=()=>page.getByRole('button',{name:/^(取消|Cancel)$/}).first();
const query=()=>page.locator('#query-intent, #guided-input-panel textarea').first();
async function start(){await trigger().click();await page.getByRole('button',{name:/完成并转写|^Transcribe$/}).waitFor();}
async function recordAndStop(){await start();await page.getByText(/00:01\s*\/\s*01:00/).waitFor();await page.getByRole('button',{name:/完成并转写|^Transcribe$/}).click();}
async function idle(){await page.locator('#speech-provider-select').waitFor({state:'visible'});}
try{
 await page.goto(base,{waitUntil:'networkidle'});
 await page.locator('#speech-proxy-url').fill('https://speech-qa.invalid');
 const mapping={gemini:'gemini',openai:'openai',deepgram:'deepgram','whisper-local':'whisper'};
 for(const [provider,segment] of Object.entries(mapping)){
  await page.locator('#speech-provider-select').selectOption(provider);await query().fill('Initial query');
  const before=requestCount;await recordAndStop();await idle();
  assert(requestCount===before+1,`${provider}: expected one request`);
  assert(payloads.at(-1).path===`/api/speech/${segment}/transcriptions`,`${provider}: wrong proxy route`);
  assert(payloads.at(-1).bytes>500&&payloads.at(-1).contentType.startsWith('multipart/form-data'),`${provider}: missing recorded multipart audio`);
  assert((await query().inputValue()).includes(`Mock transcript ${requestCount}`),`${provider}: result was not inserted into query`);
  report.checks.push({name:`${provider}: record/stop/multipart/proxy route/result insertion`,status:'PASS',evidence:'mocked response'});
 }
 // Persistence is observable only after a reload, not from local state.
 await page.reload({waitUntil:'networkidle'});assert(await page.locator('#speech-provider-select').inputValue()==='whisper-local','Provider persistence lost');assert(await page.locator('#speech-proxy-url').inputValue()==='https://speech-qa.invalid','Service URL persistence lost');
 report.checks.push({name:'Provider and endpoint persist across reload',status:'PASS'});
 let count=requestCount;await start();await cancel().click();await idle();assert(requestCount===count,'Cancel recording submitted audio');
 report.checks.push({name:'Cancel recording discards audio',status:'PASS'});
 mode='hold';await query().fill('Cancel fixture');await recordAndStop();await page.getByText(/正在使用.*转写|Transcribing with/).waitFor();await cancel().click();await idle();pending.splice(0).forEach(release=>release());assert(await query().inputValue()==='Cancel fixture','Cancelled response inserted into query');
 report.checks.push({name:'Cancel pending request returns to idle without inserting text',status:'PASS'});
 for(const [testMode,errorText] of [['invalid-json',/invalid JSON/],['network',/Could not reach/],['unavailable',/not configured|unavailable/],['timeout-response',/timed out/]]){
  mode=testMode;await recordAndStop();await idle();await page.getByText(errorText).first().waitFor();
  report.checks.push({name:`${testMode}: visible error and idle recovery`,status:'PASS',evidence:'mocked failure; 504 is upstream error mapping, not an elapsed client timeout'});
 }
 mode='success';await recordAndStop();await idle();await recordAndStop();await idle();assert((await query().inputValue()).includes(`Mock transcript ${requestCount}`),'Repeated recording did not recover');
 report.checks.push({name:'Repeated recordings recover after failures',status:'PASS'});
 await page.screenshot({path:path.join(output,'speech-recovered.png'),fullPage:true});assert(report.errors.length===0,'Unexpected browser errors');
}catch(error){report.failure=error.message;await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
finally{pending.splice(0).forEach(release=>release());report.requests=payloads;fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();}
console.log(`${report.checks.length} mocked speech browser regression checks passed; no live provider/model validation.`);
