import test from "node:test";
import assert from "node:assert/strict";
import { SPEECH_PROVIDERS, isSpeechProviderId, getSpeechProxyPath, normalizeTranscript, buildSpeechProxyUrl } from "../src/services/speech/speechProviders.mjs";

test("registry exposes Gemini, OpenAI, Deepgram and local Whisper", () => assert.deepEqual(SPEECH_PROVIDERS.map(p => p.id), ["gemini", "openai", "deepgram", "whisper-local"]));
test("provider definitions are immutable", () => { assert.equal(Object.isFrozen(SPEECH_PROVIDERS), true); assert.equal(Object.isFrozen(SPEECH_PROVIDERS[0]), true); });
test("provider id validation rejects unknown values", () => { assert.equal(isSpeechProviderId("openai"), true); assert.equal(isSpeechProviderId("unknown"), false); assert.equal(isSpeechProviderId(null), false); });
test("proxy paths are provider-specific", () => { assert.equal(getSpeechProxyPath("openai"), "/api/speech/openai/transcriptions"); assert.equal(getSpeechProxyPath("deepgram"), "/api/speech/deepgram/transcriptions"); assert.equal(getSpeechProxyPath("whisper-local"), "/api/speech/whisper/transcriptions"); assert.equal(getSpeechProxyPath("gemini"), "/api/speech/gemini/transcriptions"); });
test("proxy URL requires an explicit base URL and normalizes trailing slash", () => { assert.throws(() => buildSpeechProxyUrl("", "openai"), /speech service URL/); assert.equal(buildSpeechProxyUrl("https://example.test///", "deepgram"), "https://example.test/api/speech/deepgram/transcriptions"); });
test("local HTTP is permitted for loopback Whisper service", () => assert.equal(buildSpeechProxyUrl("http://127.0.0.1:8000/", "whisper-local"), "http://127.0.0.1:8000/api/speech/whisper/transcriptions"));
test("remote HTTP proxy is rejected", () => assert.throws(() => buildSpeechProxyUrl("http://speech.example.test", "openai"), /HTTPS/));
test("proxy URL rejects credentials, query strings, fragments and invalid URLs", () => {
  assert.throws(() => buildSpeechProxyUrl("https://user:pass@example.test", "openai"), /cannot contain credentials/);
  assert.throws(() => buildSpeechProxyUrl("https://example.test?token=x", "openai"), /cannot contain credentials/);
  assert.throws(() => buildSpeechProxyUrl("not-a-url", "openai"), /valid absolute/);
});
test("proxy URL rejects unknown providers", () => assert.throws(() => buildSpeechProxyUrl("https://example.test", "unknown"), /Unsupported speech provider/));
test("transcript normalization trims whitespace and strips UTF-8 BOM", () => { assert.equal(normalizeTranscript("\uFEFF  robotics\n"), "robotics"); assert.equal(normalizeTranscript("  "), ""); assert.equal(normalizeTranscript({ text: "not a transcript" }), ""); });


test("speech proxy errors are classified for common HTTP statuses", async () => {
  const { formatSpeechProxyError } = await import("../src/services/speech/speechProviders.mjs");
  assert.match(formatSpeechProxyError(401, "bad key"), /authentication failed/i);
  assert.match(formatSpeechProxyError(413, "too large"), /too large/i);
  assert.match(formatSpeechProxyError(422, "bad audio"), /format is not supported/i);
  assert.match(formatSpeechProxyError(429, "quota"), /rate limit or quota/i);
  assert.match(formatSpeechProxyError(503, "offline"), /not configured or temporarily unavailable/i);
  assert.match(formatSpeechProxyError(504, "upstream timeout"), /timed out/i);
});

test("speech proxy error formatter falls back safely when detail is absent", async () => {
  const { formatSpeechProxyError } = await import("../src/services/speech/speechProviders.mjs");
  assert.equal(formatSpeechProxyError(500, ""), "Speech service request failed (HTTP 500).");
});
