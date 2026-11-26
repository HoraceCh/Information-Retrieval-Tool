export type SpeechProviderId = "gemini" | "openai" | "deepgram" | "whisper-local";
export interface SpeechProviderDefinition {
  readonly id: SpeechProviderId;
  readonly label: string;
  readonly shortLabel: string;
  readonly mode: "proxy";
  readonly requiresProxy: boolean;
}
export const SPEECH_PROVIDERS: readonly SpeechProviderDefinition[];
export const SPEECH_PROVIDER_IDS: readonly SpeechProviderId[];
export function isSpeechProviderId(value: unknown): value is SpeechProviderId;
export function getSpeechProxyPath(providerId: SpeechProviderId): string | null;
export function normalizeTranscript(value: unknown): string;
export function buildSpeechProxyUrl(baseUrl: string | undefined, providerId: SpeechProviderId): string;
export function formatSpeechProxyError(status: number, detail: unknown): string;
