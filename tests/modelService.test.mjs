import test from 'node:test';
import assert from 'node:assert/strict';
import { buildModelServiceUrl, requestModelService, validateQueryResult } from '../src/services/modelService.mjs';
const request={ provider:'gemini',model:'gemini-2.5-flash',operation:'query',contents:'robotics',systemInstruction:'JSON only' };
const base='http://127.0.0.1:8000';
const result={ keywords:[{original:'robotics',zhSynonyms:['机器人'],enSynonyms:['robotics']}],booleanQuery:'robotics',fieldSpecificQuery:'TS=(robotics)',schemaMapping:[{field:'TS',mappedConcept:'robotics',reason:'topic'}],explanation:'Search topic',suggestedUrls:[] };

test('trusted model URL rejects missing URL, embedded credentials and remote HTTP',()=>{
 assert.throws(()=>buildModelServiceUrl(''),/trusted model service/);
 assert.throws(()=>buildModelServiceUrl('https://user:pass@example.test'),/credentials/);
 assert.throws(()=>buildModelServiceUrl('https://example.test?key=anything'),/credentials/);
 assert.throws(()=>buildModelServiceUrl('http://remote.test'),/HTTPS/);
});

test('model service serializes only allowed payload fields, never legacy secrets or upstream URL',async()=>{
 const response=await requestModelService(base,{...request,apiKey:'never-transmit-fixture',endpoint:'https://untrusted.invalid'}, {fetchImpl:async(url,options)=>{
  assert.equal(url,base+'/api/ai/generate');
  assert.deepEqual(JSON.parse(options.body),request);
  assert.equal(options.body.includes('never-transmit-fixture'),false);
  assert.equal(options.headers.Authorization,undefined);
  return new Response(JSON.stringify({result,model:request.model,provider:request.provider}));
 }});
 assert.deepEqual(validateQueryResult(response.result),result);
});

test('batch and compare requests to one service queue without deterministic rate-limit failures',async()=>{
 let active=0,peak=0,calls=[];
 const fetchImpl=async(_url,options)=>{ active++; peak=Math.max(active,peak);calls.push(JSON.parse(options.body).model);await new Promise(resolve=>setTimeout(resolve,5));active--;return new Response('{}'); };
 await Promise.all(['a','b','c'].map(model=>requestModelService(base,{...request,model},{fetchImpl})));
 assert.equal(peak,1);assert.deepEqual(calls,['a','b','c']);
});

test('failed queued request does not block the following model or fall back to another provider',async()=>{
 let calls=0;
 const fetchImpl=async()=>{calls++;return calls===1?new Response('{}',{status:503}):new Response(JSON.stringify({connected:true}));};
 const first=requestModelService(base,request,{fetchImpl});
 const second=requestModelService(base,{...request,model:'second'},{fetchImpl});
 await assert.rejects(first,/not configured/);assert.equal((await second).connected,true);assert.equal(calls,2);
});

test('query result validator preserves field-specific and keyword-expansion contracts',()=>{
 assert.deepEqual(validateQueryResult(result),result);
 assert.throws(()=>validateQueryResult({...result,keywords:[{original:'robotics',zhSynonyms:'invalid',enSynonyms:[]}]}),/invalid search strategy/);
 assert.throws(()=>validateQueryResult({...result,fieldSpecificQuery:undefined}),/invalid search strategy/);
});

test('model service distinguishes elapsed timeout and caller cancellation',async()=>{
 const pendingFetch=async(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true}));
 await assert.rejects(requestModelService(base,request,{fetchImpl:pendingFetch,timeoutMs:5}),/timed out/);
 const controller=new AbortController();
 const pending=requestModelService(base,request,{fetchImpl:pendingFetch,signal:controller.signal});
 controller.abort();await assert.rejects(pending,/cancelled/);
});

test('query generation preserves database, template, correction and keyword output through server contract',async()=>{
 const {build}=await import('esbuild');
 const compiled=await build({entryPoints:['src/services/gemini.ts'],bundle:true,write:false,platform:'browser',format:'esm'});
 const {generateSearchQuery,testConnection}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const original=globalThis.fetch;
 const provider={id:'gemini',name:'Gemini server',isGemini:true,serviceUrl:base,models:'gemini-2.5-flash'};
 try{
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,base+'/api/ai/generate');
   const payload=JSON.parse(options.body);
   assert.equal(payload.provider,'gemini');
   if(payload.operation==='connection')return new Response(JSON.stringify({connected:true,model:'gemini-2.5-flash',provider:'gemini'}));
   assert.match(payload.contents,/CNKI/);assert.match(payload.contents,/Feedback fixture/);assert.match(payload.contents,/Template fixture/);
   assert.match(payload.systemInstruction,/fieldSpecificQuery/);
   return new Response(JSON.stringify({result,model:'gemini-2.5-flash',provider:'gemini',usage:{promptTokens:3,completionTokens:4,totalTokens:7}}));
  };
  const output=await generateSearchQuery('robotics','CNKI 知网 (中文学术)','双语混合','gemini-2.5-flash',provider,'Space','Feedback fixture',{name:'Template fixture',framework:'(concept A) AND (concept B)',constraintPrompt:'Preserve both concepts'});
  assert.deepEqual(output.keywords,result.keywords);assert.equal(output.fieldSpecificQuery,result.fieldSpecificQuery);
  assert.equal(output._appliedTemplate,'Template fixture');assert.equal(output._modelUsed,'gemini-2.5-flash');
  assert.deepEqual(output._usage,{promptTokens:3,completionTokens:4,totalTokens:7});
  assert.equal(await testConnection(provider,'gemini-2.5-flash'),true);
 }finally{globalThis.fetch=original;}
});

test('cancelling queued text work settles promptly and cannot let later work bypass the active request',async()=>{
 let finishFirst,calls=[];
 const fetchImpl=async(_url,options)=>{
  const model=JSON.parse(options.body).model;calls.push(model);
  if(model==='first')await new Promise(resolve=>{finishFirst=resolve;});
  return new Response('{}');
 };
 const first=requestModelService(base,{...request,model:'first'},{fetchImpl});
 await new Promise(resolve=>setTimeout(resolve,0));
 const controller=new AbortController();
 const second=requestModelService(base,{...request,model:'cancelled'},{fetchImpl,signal:controller.signal});
 const third=requestModelService(base,{...request,model:'third'},{fetchImpl});
 controller.abort();await assert.rejects(second,/cancelled/);
 assert.deepEqual(calls,['first']);finishFirst();await Promise.all([first,third]);
 assert.deepEqual(calls,['first','third']);
});

test('ordinary Web of Science generation rebuilds invalid native syntax from model concepts and preserves an advanced draft', async () => {
  const { build } = await import('esbuild');
  const compiled = await build({ entryPoints: ['src/services/gemini.ts'], bundle: true, write: false, platform: 'browser', format: 'esm' });
  const { generateSearchQuery } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const provider = { id: 'gemini', name: 'Gemini', isGemini: true, serviceUrl: base, models: request.model };
  const fixture = {
    ...result,
    keywords: [
      { original: 'robotic arm', zhSynonyms: ['机械臂'], enSynonyms: ['manipulator', 'invalid" OR "injection'] },
      { original: 'collision avoidance', zhSynonyms: ['碰撞规避'], enSynonyms: ['obstacle avoidance'] },
    ],
    booleanQuery: 'robotic-arm collision',
    fieldSpecificQuery: 'SU: robotic arm WITH collision',
  };
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ result: fixture, model: request.model, provider: provider.id }));
    const database = 'Web of Science核心合集 (SCI-E/SSCI/CPCI-S)';
    const draft = await generateSearchQuery('Robotic arm collision avoidance', database, '仅英文 (English Only)', request.model, provider, 'Space');
    assert.equal(draft.fieldSpecificQuery, 'TS=(("robotic arm" OR "manipulator") AND ("collision avoidance" OR "obstacle avoidance"))');
    assert.equal(draft.booleanQuery, '("robotic arm" "manipulator") AND ("collision avoidance" "obstacle avoidance")');
    assert.match(draft.explanation, /rebuilt from the extracted concept groups/);
    const advanced = await generateSearchQuery('robotics NOT drones', database, '仅英文 (English Only)', request.model, provider);
    assert.equal(advanced.fieldSpecificQuery, fixture.fieldSpecificQuery);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
