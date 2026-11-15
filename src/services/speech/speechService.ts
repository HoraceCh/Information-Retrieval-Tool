import { transcribeAudio } from "../gemini";
import { buildSpeechProxyUrl, normalizeTranscript, type SpeechProviderId } from "./speechProviders.mjs";
export interface SpeechTranscriptionOptions { geminiKey?: string; proxyBaseUrl?: string; }
/** Provider-neutral transcription. All non-Gemini providers require a trusted proxy; never ship provider secrets in browser assets. */
export async function transcribeWithProvider(providerId: SpeechProviderId, audioBlob: Blob, options: SpeechTranscriptionOptions = {}): Promise<string> {
  if (!(audioBlob instanceof Blob) || audioBlob.size === 0) throw new Error("No audio data was recorded. Please record again.");
  if (providerId === "gemini") return normalizeTranscript(await transcribeAudio(audioBlob, options.geminiKey));
  const url = buildSpeechProxyUrl(options.proxyBaseUrl, providerId);
  const form = new FormData(); form.append("file", audioBlob, "recording"); form.append("language", "auto");
  const response = await fetch(url, { method: "POST", body: form, headers: { Accept: "application/json" } });
  if (!response.ok) { const detail = await response.text().catch(() => ""); throw new Error(detail || `Speech service request failed (HTTP ${response.status}).`); }
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("text" in payload)) throw new Error("Speech proxy returned an invalid response. Expected JSON with a text field.");
  const transcript = normalizeTranscript((payload as { text?: unknown }).text);
  if (!transcript) throw new Error("No speech was recognized. Please try again.");
  return transcript;
}
