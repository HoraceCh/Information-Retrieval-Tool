import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Exercise the real browser service module; external provider responses are mocked.
const compiled = await build({ entryPoints: ['src/services/speech/speechService.ts'], bundle: true, write: false, platform: 'browser', format: 'esm', define: { 'import.meta.env': '{}' } });
const { transcribeWithProvider } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const audio = new Blob(['recorded-audio-fixture'], { type: 'audio/wav' });
const options = { proxyBaseUrl: 'http://127.0.0.1:8000', timeoutMs: 1000 };
const originalFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = originalFetch; });

test('configured Gemini uses trusted proxy without needing a browser key', async () => {
  globalThis.fetch = async (url, request) => {
    assert.equal(url, 'http://127.0.0.1:8000/api/speech/gemini/transcriptions');
    assert.equal(request.body.get('language'), 'auto');
    assert.equal(request.body.get('file').size, audio.size);
    return new Response(JSON.stringify({ text: '  你好 robotics  ' }));
  };
  assert.equal(await transcribeWithProvider('gemini', audio, options), '你好 robotics');
});

test('Gemini proxy failure never falls back to direct BYOK', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ detail: 'Provider not configured.' }), { status: 503 }); };
  await assert.rejects(transcribeWithProvider('gemini', audio, options), /not configured/);
  assert.equal(calls, 1);
});

test('invalid JSON is actionable and does not retry or switch providers', async () => {
  globalThis.fetch = async () => new Response('<html>unavailable</html>');
  await assert.rejects(transcribeWithProvider('openai', audio, options), /invalid JSON/);
});

test('empty audio is rejected before network work', async () => {
  globalThis.fetch = async () => { throw new Error('must not call fetch'); };
  await assert.rejects(transcribeWithProvider('whisper-local', new Blob([]), options), /No audio data/);
});

test('timeout aborts pending proxy fetch with an actionable message', async () => {
  globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true }));
  await assert.rejects(transcribeWithProvider('deepgram', audio, { ...options, timeoutMs: 10 }), /timed out/);
});

test('caller cancellation remains distinct from timeout', async () => {
  const controller = new AbortController();
  globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true }));
  const pending = transcribeWithProvider('whisper-local', audio, { ...options, signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, /cancelled/);
});

test('network failure can be followed by a successful new request', async () => {
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  await assert.rejects(transcribeWithProvider('openai', audio, options), /Could not reach/);
  globalThis.fetch = async () => new Response(JSON.stringify({ text: 'recovered' }));
  assert.equal(await transcribeWithProvider('openai', audio, options), 'recovered');
});

test('Gemini without a trusted service URL fails before any direct provider request', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('unexpected direct request'); };
  await assert.rejects(transcribeWithProvider('gemini', audio), /speech service URL/);
  assert.equal(calls, 0);
});
