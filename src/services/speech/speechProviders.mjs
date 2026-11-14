export const SPEECH_PROVIDERS = Object.freeze([
  Object.freeze({ id: "gemini", label: "Gemini", shortLabel: "Gemini", mode: "direct", requiresProxy: false }),
  Object.freeze({ id: "openai", label: "OpenAI", shortLabel: "OpenAI ASR", mode: "proxy", requiresProxy: true }),
  Object.freeze({ id: "deepgram", label: "Deepgram", shortLabel: "Deepgram", mode: "proxy", requiresProxy: true }),
  Object.freeze({ id: "whisper-local", label: "Whisper 本地服务", shortLabel: "Whisper", mode: "proxy", requiresProxy: true })
]);
export const SPEECH_PROVIDER_IDS = Object.freeze(SPEECH_PROVIDERS.map(provider => provider.id));
export function isSpeechProviderId(value) { return SPEECH_PROVIDER_IDS.includes(value); }
export function getSpeechProxyPath(providerId) {
  const paths = { openai: "/api/speech/openai/transcriptions", deepgram: "/api/speech/deepgram/transcriptions", "whisper-local": "/api/speech/whisper/transcriptions" };
  return paths[providerId] || null;
}
export function normalizeTranscript(value) {
  if (typeof value !== "string") return "";
  return value.replace(/^\uFEFF/, "").trim();
}
export function buildSpeechProxyUrl(baseUrl, providerId) {
  const path = getSpeechProxyPath(providerId);
  if (!path) throw new Error("Unsupported speech provider.");
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new Error("This speech provider needs a speech service URL. Configure a local Whisper service or a trusted HTTPS proxy.");
  }
  let parsed;
  try { parsed = new URL(baseUrl.trim()); }
  catch { throw new Error("Speech service URL must be a valid absolute HTTP(S) URL."); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Speech service URL must use HTTP(S) and cannot contain credentials, query parameters, or fragments.");
  }
  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  if (parsed.protocol !== "https:" && !localHosts.has(parsed.hostname)) {
    throw new Error("Remote speech services must use HTTPS. Plain HTTP is allowed only for localhost.");
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, "") + path;
}

export function formatSpeechProxyError(status, detail) {
  const message = typeof detail === "string" && detail.trim() ? detail.trim() : `Speech service request failed (HTTP ${status}).`;
  if (status === 401 || status === 403) return `Speech service authentication failed: ${message}`;
  if (status === 413) return `Audio file is too large: ${message}`;
  if (status === 415 || status === 422) return `Audio or language format is not supported: ${message}`;
  if (status === 429) return `Speech provider rate limit or quota reached: ${message}`;
  if (status === 503) return `Speech provider is not configured or temporarily unavailable: ${message}`;
  if (status === 504) return `Speech provider timed out: ${message}`;
  return message;
}
