import test from "node:test";
import assert from "node:assert/strict";
import { transcribeGeminiAudio } from "../src/services/speech/geminiTranscription.mjs";

class FakeFileReader {
  static instances = [];
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
    FakeFileReader.instances.push(this);
  }
  readAsDataURL() { this.readyState = 1; }
  abort() {
    if (this.readyState !== 1) return;
    this.readyState = 2;
    this.onabort?.();
  }
  complete(dataUrl = "data:audio/webm;base64,YXVkaW8=") {
    this.result = dataUrl;
    this.readyState = 2;
    this.onload?.();
  }
}

function makeAudio() {
  return new Blob(["recorded audio"], { type: "audio/webm;codecs=opus" });
}

test("Gemini transcription passes AbortSignal to the SDK and returns normalized text", async () => {
  FakeFileReader.instances = [];
  const controller = new AbortController();
  let request;
  const pending = transcribeGeminiAudio(makeAudio(), {
    signal: controller.signal,
    FileReaderConstructor: FakeFileReader,
    generateContent: async value => {
      request = value;
      return { text: "  recognized words  " };
    }
  });
  const reader = FakeFileReader.instances[0];
  assert.ok(reader);
  reader.complete();
  assert.equal(await pending, "recognized words");
  assert.equal(request.model, "gemini-3.5-transcribe");
  assert.equal(request.config.abortSignal, controller.signal);
  assert.equal(request.contents[0].inlineData.mimeType, "audio/webm");
  assert.equal(request.contents[0].inlineData.data, "YXVkaW8=");
});

test("Gemini transcription aborts FileReader when cancelled during audio encoding", async () => {
  FakeFileReader.instances = [];
  const controller = new AbortController();
  let sdkCalled = false;
  const pending = transcribeGeminiAudio(makeAudio(), {
    signal: controller.signal,
    FileReaderConstructor: FakeFileReader,
    generateContent: async () => { sdkCalled = true; return { text: "late" }; }
  });
  const reader = FakeFileReader.instances[0];
  controller.abort();
  await assert.rejects(pending, error => error.name === "AbortError");
  assert.equal(reader.readyState, 2);
  assert.equal(sdkCalled, false);
});

test("Gemini transcription does not publish a response that arrives after cancellation", async () => {
  FakeFileReader.instances = [];
  const controller = new AbortController();
  let request;
  let resolveGeneration;
  const pending = transcribeGeminiAudio(makeAudio(), {
    signal: controller.signal,
    FileReaderConstructor: FakeFileReader,
    generateContent: value => {
      request = value;
      return new Promise(resolve => { resolveGeneration = resolve; });
    }
  });
  FakeFileReader.instances[0].complete();
  await Promise.resolve();
  assert.ok(request);
  assert.equal(request.config.abortSignal, controller.signal);
  controller.abort();
  resolveGeneration({ text: "late transcript" });
  await assert.rejects(pending, error => error.name === "AbortError");
});

test("already-aborted Gemini transcription never starts file encoding or SDK work", async () => {
  FakeFileReader.instances = [];
  const controller = new AbortController();
  controller.abort();
  let sdkCalled = false;
  await assert.rejects(
    transcribeGeminiAudio(makeAudio(), {
      signal: controller.signal,
      FileReaderConstructor: FakeFileReader,
      generateContent: async () => { sdkCalled = true; return { text: "unexpected" }; }
    }),
    error => error.name === "AbortError"
  );
  assert.equal(FakeFileReader.instances.length, 0);
  assert.equal(sdkCalled, false);
});
