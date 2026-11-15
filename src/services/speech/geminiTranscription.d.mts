export interface GeminiTranscriptionRequest {
  model: string;
  contents: Array<{ inlineData: { mimeType: string; data: string } } | string>;
  config: { abortSignal?: AbortSignal };
}
export interface GeminiTranscriptionOptions {
  signal?: AbortSignal;
  generateContent: (request: GeminiTranscriptionRequest) => Promise<{ text?: string | null }>;
  FileReaderConstructor?: typeof FileReader;
}
export function readAudioBlobAsBase64(audioBlob: Blob, signal?: AbortSignal, FileReaderConstructor?: typeof FileReader): Promise<string>;
export function transcribeGeminiAudio(audioBlob: Blob, options: GeminiTranscriptionOptions): Promise<string>;
