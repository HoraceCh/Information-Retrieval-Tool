// Browser enforcement and server-only UI regression. All credentials and replies
// used here are synthetic fixtures; this does not validate a live provider/model.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || '/workspace/browser-qa/node_modules/playwright/index.mjs'));
const base = process.env.UI_BASE || 'http://127.0.0.1:4173/';
const output = path.resolve(process.env.UI_EVIDENCE || 'artifacts/server-ui-targeted');
fs.mkdirSync(output, { recursive: true });
const report = {
  time: new Date().toISOString(), base, browser: 'Chromium', checks: [], errors: [],
  limits: ['Network transcription and connection replies are fixtures, not live providers.', 'Microphone permission uses native Chromium policy with a synthetic media device, not physical hardware.', 'Forced-colors checks cover visible controls and keyboard outline, not full accessibility certification.'],
};
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--use-fake-device-for-media-stream'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const requests = [];
page.on('pageerror', () => report.errors.push('Uncaught page error'));
await page.addInitScript(() => {
  localStorage.setItem('visited-guided-search-v1.0', 'true');
  if (!sessionStorage.getItem('server-ui-seeded')) {
    localStorage.setItem('ai_retrieval_providers', JSON.stringify([{ id: 'gemini', name: 'Google Gemini', isGemini: true, models: 'gemini-3.5-flash,chosen-fixture-model', serviceUrl: '', apiKey: 'synthetic-only', authType: 'Bearer', endpoint: 'https://upstream.invalid' }]));
    localStorage.setItem('ai_retrieval_api_key', 'synthetic-only');
    localStorage.setItem('ai_retrieval_active_prov', 'gemini');
    localStorage.setItem('ai_retrieval_active_mod', 'chosen-fixture-model');
    localStorage.setItem('unrelated_app_token', 'preserve-test-preference');
    sessionStorage.setItem('server-ui-seeded', 'yes');
  }
  window.__nativeMediaCalls = 0;
  const native = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = constraints => {
    window.__nativeMediaCalls += 1;
    return native(constraints);
  };
});
await page.route('**/*', async route => {
  const request = route.request();
  if (!['fetch', 'xhr'].includes(request.resourceType())) return route.continue();
  const url = new URL(request.url());
  const body = request.headers()['content-type']?.includes('application/json') ? request.postDataJSON() : null;
  const hasAuthorization = Boolean(request.headers().authorization);
  requests.push({ method: request.method(), path: url.pathname, keys: body && typeof body === 'object' ? Object.keys(body).sort() : [] });
  if (hasAuthorization) {
    report.errors.push('Browser attempted an Authorization credential');
    return route.abort();
  }
  const headers = { 'Access-Control-Allow-Origin': new URL(base).origin };
  if (url.pathname === '/api/ai/generate' && body?.operation === 'connection') {
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ connected: true }) });
  }
  if (url.pathname === '/api/speech/gemini/transcriptions') {
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ text: 'fixture transcript' }) });
  }
  return route.fulfill({ status: 502, headers, contentType: 'application/json', body: JSON.stringify({ detail: 'Unexpected fixture route' }) });
});
async function passed(name, evidence = {}) { report.checks.push({ name, status: 'PASS', ...evidence }); }
async function screenshot(name) {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true });
}
async function settings() {
  await page.getByRole('button', { name: 'Settings', exact: true }).first().click();
  await page.getByRole('dialog', { name: 'System configuration' }).waitFor();
}
async function connection() {
  const button = page.getByRole('button', { name: /TEST CONNECTION|测试连接/ });
  await button.click();
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(button => /TEST CONNECTION|测试连接/.test(button.textContent))?.disabled);
}
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#speech-provider-select').waitFor();
  report.previewAssets = await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => new URL(node.src).pathname));
  report.browserVersion = browser.version();
  const migration = await page.evaluate(() => ({ providers: JSON.parse(localStorage.getItem('ai_retrieval_providers')), oldKey: localStorage.getItem('ai_retrieval_api_key'), model: localStorage.getItem('ai_retrieval_active_mod'), unrelated: localStorage.getItem('unrelated_app_token') }));
  assert.equal(migration.oldKey, null);
  assert.equal(migration.model, 'chosen-fixture-model');
  assert.equal(migration.unrelated, 'preserve-test-preference');
  assert.deepEqual(Object.keys(migration.providers[0]).sort(), ['id', 'isGemini', 'models', 'name', 'serviceUrl']);
  await passed('Legacy settings purge preserves model and unrelated data');

  await page.locator('.ui-speech-trigger').click();
  await page.getByRole('alert').filter({ hasText: /请先配置|Configure a trusted speech service/ }).waitFor();
  assert.equal(await page.evaluate(() => window.__nativeMediaCalls), 0);
  assert.equal(requests.length, 0);
  await passed('Missing speech service rejects before native microphone and network');
  await page.locator('#speech-proxy-url').fill('https://trusted.invalid?token=synthetic-only');
  await page.locator('.ui-speech-trigger').click();
  assert.equal(await page.evaluate(() => window.__nativeMediaCalls), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('ai_retrieval_speech_proxy_url')), null);
  assert.equal(requests.length, 0);
  await passed('Unsafe speech URL is not persisted and cannot request microphone or network');

  await settings();
  assert.equal(await page.locator('input[type="password"]').count(), 0);
  assert.equal(await page.locator('#provider-api-key').count(), 0);
  assert.equal(await page.getByRole('combobox', { name: 'Provider model' }).inputValue(), 'chosen-fixture-model');
  await connection();
  assert.equal(requests.length, 0);
  const unsafe = ['https://user:synthetic-only@trusted.invalid', 'https://trusted.invalid?token=synthetic-only', 'https://trusted.invalid#synthetic-only', 'http://remote.invalid'];
  for (const value of unsafe) {
    await page.locator('#model-service-url').fill(value);
    await connection();
    assert.equal(await page.locator('#model-service-url').getAttribute('aria-invalid'), 'true');
    assert.equal(requests.length, 0);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ai_retrieval_providers'))[0]);
    assert.equal(stored.serviceUrl, '');
  }
  await passed('Missing and unsafe model URLs do not issue network requests or persist secrets', { rejectedCases: unsafe.length });
  await page.locator('#model-service-url').fill(new URL(base).origin);
  await connection();
  await page.getByText(/Connection Successful|连接成功/).waitFor();
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].keys, ['contents', 'model', 'operation', 'provider', 'systemInstruction']);
  await passed('Valid model service retry succeeds using credential-free fixture contract');
  await page.getByRole('button', { name: 'Close settings', exact: true }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await settings();
  assert.equal(await page.locator('#model-service-url').inputValue(), new URL(base).origin);
  assert.equal(await page.getByRole('combobox', { name: 'Provider model' }).inputValue(), 'chosen-fixture-model');
  await screenshot('settings-persisted');
  await passed('Service URL and selected model survive browser reload');
  await page.getByRole('button', { name: 'Close settings', exact: true }).click();

  await page.locator('#speech-proxy-url').fill(new URL(base).origin);
  const cdp = await context.newCDPSession(page);
  const { targetInfo } = await cdp.send('Target.getTargetInfo');
  await cdp.send('Browser.setPermission', { permission: { name: 'microphone' }, setting: 'denied', origin: new URL(base).origin, browserContextId: targetInfo.browserContextId });
  assert.equal(await page.evaluate(async () => (await navigator.permissions.query({ name: 'microphone' })).state), 'denied');
  await page.locator('.ui-speech-trigger').click();
  await page.getByRole('alert').filter({ hasText: /麦克风访问被拒绝|Microphone permission denied/ }).waitFor();
  assert.equal(await page.evaluate(() => window.__nativeMediaCalls), 1);
  assert.equal(requests.length, 1);
  await screenshot('native-microphone-denied');
  await passed('Native browser permission denial is shown and produces no upload', { permission: 'denied', media: 'native API; synthetic device' });
  await cdp.send('Browser.setPermission', { permission: { name: 'microphone' }, setting: 'granted', origin: new URL(base).origin, browserContextId: targetInfo.browserContextId });
  await page.locator('.ui-speech-trigger').click();
  await page.locator('.ui-speech-recording').waitFor();
  await page.waitForFunction(() => document.querySelector('.ui-speech-recording')?.textContent.includes('00:01'));
  await page.getByRole('button', { name: /完成并转写|^Transcribe$/ }).click();
  await page.waitForFunction(() => document.querySelector('#query-intent')?.value.includes('fixture transcript'));
  assert.equal(await page.evaluate(() => window.__nativeMediaCalls), 2);
  assert.equal(requests.length, 2);
  await passed('Permission grant allows retry, recording, fixture upload and transcript insertion');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ forcedColors: 'active' });
  assert(await page.evaluate(() => matchMedia('(forced-colors: active)').matches));
  await page.locator('#speech-provider-select').focus();
  const outline = await page.locator('#speech-provider-select').evaluate(element => {
    const style = getComputedStyle(element);
    return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
  });
  assert(outline.width >= 2 && outline.style !== 'none');
  assert(await page.locator('.ui-speech-trigger').isVisible());
  assert(await page.locator('#speech-proxy-url').isVisible());
  const overflow = await page.evaluate(() => ({ page: document.documentElement.scrollWidth > innerWidth + 2, inputs: [...document.querySelectorAll('main select, main input, main textarea')].some(element => element.getBoundingClientRect().right > innerWidth + 2) }));
  assert(!overflow.page && !overflow.inputs);
  await screenshot('mobile-forced-colors');
  await passed('Forced-colors mobile controls remain visible with keyboard outline and no field overflow', { outline });
  assert.equal(report.errors.length, 0);
} catch (error) {
  report.checks.push({ name: 'Browser regression stopped', status: 'FAIL', reason: error.message });
  await screenshot('failure').catch(() => {});
  process.exitCode = 1;
} finally {
  report.networkRequests = requests;
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ checks: report.checks.map(({ name, status }) => ({ name, status })), errors: report.errors.length, output }, null, 2));
