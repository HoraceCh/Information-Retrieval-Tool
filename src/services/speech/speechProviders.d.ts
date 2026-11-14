export type SpeechProviderId = "gemini" | "openai" | "deepgram" | "whisper-local";
export interface SpeechProviderDefinition { id: SpeechProviderId; label: string; shortLabel: string; mode: "direct" | "proxy"; requiresProxy: boolean; }
export const SPEECH_PROVIDERS: readonly SpeechProviderDefinition[];
export const SPEECH_PROVIDER_IDS: readonly SpeechProviderId[];
export function isSpeechProviderId(value: unknown): value is SpeechProviderId;
export function getSpeechProxyPath(providerId: SpeechProviderId): string | null;
export function normalizeTranscript(value: unknown): string;
export function buildSpeechProxyUrl(baseUrl: string | undefined, providerId: SpeechProviderId): string;
