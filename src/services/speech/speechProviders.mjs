export const SPEECH_PROVIDERS = Object.freeze([
  { id: "gemini", label: "Gemini", shortLabel: "Gemini", mode: "direct", requiresProxy: false },
  { id: "openai", label: "OpenAI", shortLabel: "OpenAI ASR", mode: "proxy", requiresProxy: true },
  { id: "deepgram", label: "Deepgram", shortLabel: "Deepgram", mode: "proxy", requiresProxy: true },
  { id: "whisper-local", label: "Whisper 本地服务", shortLabel: "Whisper", mode: "proxy", requiresProxy: true }
]);
export const SPEECH_PROVIDER_IDS = Object.freeze(SPEECH_PROVIDERS.map(provider => provider.id));
export function isSpeechProviderId(value) { return SPEECH_PROVIDER_IDS.includes(value); }
export function getSpeechProxyPath(providerId) {
  const paths = { openai: "/api/speech/openai/transcriptions", deepgram: "/api/speech/deepgram/transcriptions", "whisper-local": "/api/speech/whisper/transcriptions" };
  return paths[providerId] || null;
}
export function normalizeTranscript(value) { return typeof value === "string" ? value.replace(/^\\uFEFF/, "").trim() : ""; }
export function buildSpeechProxyUrl(baseUrl, providerId) {
  const path = getSpeechProxyPath(providerId);
  if (!path) throw new Error("Unsupported speech provider.");
  if (typeof baseUrl !== "string" || !baseUrl.trim()) throw new Error("This speech provider needs a secure speech proxy. Configure VITE_SPEECH_PROXY_URL; do not put provider secrets in browser storage.");
  return baseUrl.trim().replace(/\\/+$/, "") + path;
}
