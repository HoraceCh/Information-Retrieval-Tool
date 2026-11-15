import { transcribeAudio } from "../gemini";
import { buildSpeechProxyUrl, formatSpeechProxyError, normalizeTranscript, type SpeechProviderId } from "./speechProviders.mjs";
export interface SpeechTranscriptionOptions { geminiKey?: string; proxyBaseUrl?: string; timeoutMs?: number; signal?: AbortSignal; }

async function readProxyError(response: Response): Promise<string> {
  let payload: unknown;
  try { payload = await response.json(); }
  catch { return `Speech service request failed (HTTP ${response.status}).`; }
  const detail = payload && typeof payload === "object" && "detail" in payload
    ? (payload as { detail?: unknown }).detail
    : payload && typeof payload === "object" && "message" in payload
      ? (payload as { message?: unknown }).message
      : null;
  return formatSpeechProxyError(response.status, detail);
}

class SpeechServiceResponseError extends Error {}

/** Provider-neutral transcription. Cloud credentials remain on a trusted server proxy. */
export async function transcribeWithProvider(providerId: SpeechProviderId, audioBlob: Blob, options: SpeechTranscriptionOptions = {}): Promise<string> {
  if (!(audioBlob instanceof Blob) || audioBlob.size === 0) throw new Error("No audio data was recorded. Please record again.");
  if (providerId === "gemini") return normalizeTranscript(await transcribeAudio(audioBlob, options.geminiKey, options.signal));
  const url = buildSpeechProxyUrl(options.proxyBaseUrl, providerId);
  const form = new FormData();
  form.append("file", audioBlob, "recording");
  form.append("language", "auto");
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(options.timeoutMs) && (options.timeoutMs ?? 0) > 0 ? options.timeoutMs! : 90_000;
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { method: "POST", body: form, headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response.ok) throw new SpeechServiceResponseError(await readProxyError(response));
    let payload: unknown;
    try { payload = await response.json(); }
    catch { throw new SpeechServiceResponseError("Speech service returned invalid JSON. Check the proxy service version and logs."); }
    if (!payload || typeof payload !== "object" || !("text" in payload)) {
      throw new SpeechServiceResponseError("Speech proxy returned an invalid response. Expected JSON with a text field.");
    }
    const transcript = normalizeTranscript((payload as { text?: unknown }).text);
    if (!transcript) throw new SpeechServiceResponseError("No speech was recognized. Please try again.");
    return transcript;
  } catch (error) {
    if (options.signal?.aborted) throw new Error("Speech transcription was cancelled.");
    if (timedOut || (error instanceof Error && error.name === "AbortError")) {
      throw new Error(`Speech service request timed out after ${Math.round(timeoutMs / 1000)} seconds. Try a shorter recording or another provider.`);
    }
    if (error instanceof SpeechServiceResponseError) throw new Error(error.message);
    throw new Error("Could not reach the speech service. Check that it is running, the URL is correct, and browser network access is allowed.");
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}
