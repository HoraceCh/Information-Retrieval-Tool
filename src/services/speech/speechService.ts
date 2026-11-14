import { transcribeAudio } from "../gemini";
import { buildSpeechProxyUrl, normalizeTranscript, type SpeechProviderId } from "./speechProviders.mjs";
export interface SpeechTranscriptionOptions { geminiKey?: string; proxyBaseUrl?: string; }

async function readProxyError(response: Response): Promise<string> {
  let payload: unknown;
  try { payload = await response.json(); }
  catch { return `Speech service request failed (HTTP ${response.status}).`; }
  const detail = payload && typeof payload === "object" && "detail" in payload
    ? (payload as { detail?: unknown }).detail
    : payload && typeof payload === "object" && "message" in payload
      ? (payload as { message?: unknown }).message
      : null;
  const message = typeof detail === "string" && detail.trim()
    ? detail.trim()
    : `Speech service request failed (HTTP ${response.status}).`;
  if (response.status === 401 || response.status === 403) return `Speech service authentication failed: ${message}`;
  if (response.status === 413) return `Audio file is too large: ${message}`;
  if (response.status === 415 || response.status === 422) return `Audio or language format is not supported: ${message}`;
  if (response.status === 429) return `Speech provider rate limit or quota reached: ${message}`;
  if (response.status === 503) return `Speech provider is not configured or temporarily unavailable: ${message}`;
  if (response.status === 504) return `Speech provider timed out: ${message}`;
  return message;
}

/** Provider-neutral transcription. Cloud credentials remain on a trusted server proxy. */
export async function transcribeWithProvider(providerId: SpeechProviderId, audioBlob: Blob, options: SpeechTranscriptionOptions = {}): Promise<string> {
  if (!(audioBlob instanceof Blob) || audioBlob.size === 0) throw new Error("No audio data was recorded. Please record again.");
  if (providerId === "gemini") return normalizeTranscript(await transcribeAudio(audioBlob, options.geminiKey));
  const url = buildSpeechProxyUrl(options.proxyBaseUrl, providerId);
  const form = new FormData();
  form.append("file", audioBlob, "recording");
  form.append("language", "auto");
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body: form, headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Could not reach the speech service. Check that it is running, the URL is correct, and browser network access is allowed.");
  }
  if (!response.ok) throw new Error(await readProxyError(response));
  let payload: unknown;
  try { payload = await response.json(); }
  catch { throw new Error("Speech service returned invalid JSON. Check the proxy service version and logs."); }
  if (!payload || typeof payload !== "object" || !("text" in payload)) throw new Error("Speech proxy returned an invalid response. Expected JSON with a text field.");
  const transcript = normalizeTranscript((payload as { text?: unknown }).text);
  if (!transcript) throw new Error("No speech was recognized. Please try again.");
  return transcript;
}
