import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled = await build({ entryPoints: ['src/services/speech/speechService.ts'], bundle: true, write: false, platform: 'browser', format: 'esm' });
const { transcribeWithProvider } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const audio = () => new Blob(['recorded audio'], { type: 'audio/webm;codecs=opus' });
const originalFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = originalFetch; });
const options = signal => ({ proxyBaseUrl: 'http://127.0.0.1:8000', signal });

test('Gemini transcription passes AbortSignal only to the trusted proxy and normalizes text', async () => {
  const controller = new AbortController();
  globalThis.fetch = async (url, request) => {
    assert.equal(url, 'http://127.0.0.1:8000/api/speech/gemini/transcriptions');
    assert.ok(request.signal instanceof AbortSignal);
    assert.equal(request.body.get('file').size, audio().size);
    return new Response(JSON.stringify({ text: ' recognized words ' }));
  };
  assert.equal(await transcribeWithProvider('gemini', audio(), options(controller.signal)), 'recognized words');
});

test('Gemini cancellation aborts the in-flight proxy upload', async () => {
  const controller = new AbortController();
  let signal;
  globalThis.fetch = async (_url, request) => new Promise((_resolve, reject) => {
    signal = request.signal;
    signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), { once: true });
  });
  const pending = transcribeWithProvider('gemini', audio(), options(controller.signal));
  controller.abort();
  await assert.rejects(pending, /cancelled/);
  assert.equal(signal.aborted, true);
});

test('Gemini transcription never publishes a response that arrives after cancellation', async () => {
  const controller = new AbortController();
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const pending = transcribeWithProvider('gemini', audio(), options(controller.signal));
  controller.abort();
  finish(new Response(JSON.stringify({ text: 'late transcript' })));
  await assert.rejects(pending, /cancelled/);
});

test('already-aborted Gemini transcription never starts network work', async () => {
  const controller = new AbortController(); controller.abort();
  globalThis.fetch = async () => { throw new Error('must not call fetch'); };
  await assert.rejects(transcribeWithProvider('gemini', audio(), options(controller.signal)), /cancelled/);
});
