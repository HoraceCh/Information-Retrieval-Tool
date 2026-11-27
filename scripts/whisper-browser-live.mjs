// Manual acceptance with a real loopback Whisper server and a WAV-backed browser microphone.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [manifestPath, language] = process.argv.slice(2);
if (!manifestPath || !['zh', 'en'].includes(language)) {
  throw new Error('Usage: node scripts/whisper-browser-live.mjs <frozen-manifest.json> <zh|en>');
}
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const sample = JSON.parse(fs.readFileSync(manifestPath)).find(row => row.language === language);
assert(sample?.sha256 && sample.duration_seconds > 0 && sample.duration_seconds < 55, 'A frozen sample under 55 seconds is required');
const root = fs.realpathSync(path.dirname(manifestPath));
const audio = fs.realpathSync(path.resolve(root, sample.audio));
assert(audio.startsWith(root + path.sep), 'Audio must be inside the manifest directory');
assert.equal(createHash('sha256').update(fs.readFileSync(audio)).digest('hex'), sample.sha256);
const base = process.env.WHISPER_TEST_URL || 'http://127.0.0.1:8000';
const service = new URL(base);
assert(['127.0.0.1', 'localhost', '[::1]'].includes(service.hostname) && !service.username && !service.password && !service.search && !service.hash);
const endpoint = base.replace(/\/$/, '') + '/api/speech/whisper/transcriptions';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
    '--use-file-for-fake-audio-capture=' + audio],
});
try {
  const context = await browser.newContext({permissions: ['microphone'], reducedMotion: 'reduce'});
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem('visited-guided-search-v1.0', 'true'));
  await page.goto(process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173/');
  await page.locator('#speech-provider-select').selectOption('whisper-local');
  await page.locator('#speech-proxy-url').fill(base);
  await page.getByRole('button', {name: /语音输入|Voice Input/i}).first().click();
  const stop = page.getByRole('button', {name: /完成并转写|^Transcribe$/});
  await stop.waitFor();
  // Wait for the actual recorder clock so the microphone can play the entire sample.
  const seconds = String(Math.ceil(sample.duration_seconds)).padStart(2, '0');
  await page.getByText(new RegExp('00:' + seconds + '\\s*/\\s*01:00')).waitFor({timeout: 60000});
  const pending = page.waitForResponse(response => response.url() === endpoint && response.request().method() === 'POST', {timeout: 95000});
  await stop.click();
  const response = await pending;
  assert.equal(response.status(), 200);
  const {text} = await response.json();
  assert(typeof text === 'string' && text.trim().length > 0);
  await page.waitForFunction(expected => document.querySelector('#query-intent')?.value.includes(expected), text);
  console.log(JSON.stringify({browser: await browser.version(), language, sampleSha256: sample.sha256,
    source: 'file-backed microphone', permission: 'pre-granted', provider: 'whisper-local',
    httpStatus: response.status(), transcriptCharacters: [...text].length, insertedInQuery: true}));
} finally {
  await browser.close();
}
