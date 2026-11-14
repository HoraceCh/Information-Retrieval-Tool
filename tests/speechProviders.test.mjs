import test from "node:test";
import assert from "node:assert/strict";
import { SPEECH_PROVIDERS, isSpeechProviderId, getSpeechProxyPath, normalizeTranscript, buildSpeechProxyUrl } from "../src/services/speech/speechProviders.mjs";
test("registry exposes Gemini, OpenAI, Deepgram and local Whisper", () => assert.deepEqual(SPEECH_PROVIDERS.map(p => p.id), ["gemini", "openai", "deepgram", "whisper-local"]));
test("provider id validation rejects unknown values", () => { assert.equal(isSpeechProviderId("openai"), true); assert.equal(isSpeechProviderId("unknown"), false); assert.equal(isSpeechProviderId(null), false); });
test("proxy paths are provider-specific", () => { assert.equal(getSpeechProxyPath("openai"), "/api/speech/openai/transcriptions"); assert.equal(getSpeechProxyPath("deepgram"), "/api/speech/deepgram/transcriptions"); assert.equal(getSpeechProxyPath("whisper-local"), "/api/speech/whisper/transcriptions"); assert.equal(getSpeechProxyPath("gemini"), null); });
test("proxy URL requires explicit base URL and normalizes trailing slash", () => { assert.throws(() => buildSpeechProxyUrl("", "openai"), /secure speech proxy/); assert.equal(buildSpeechProxyUrl("https://example.test/", "deepgram"), "https://example.test/api/speech/deepgram/transcriptions"); });
test("transcript normalization trims whitespace and rejects non-strings", () => { assert.equal(normalizeTranscript("  robotics\\n"), "robotics"); assert.equal(normalizeTranscript("  "), ""); assert.equal(normalizeTranscript({ text: "no" }), ""); });
