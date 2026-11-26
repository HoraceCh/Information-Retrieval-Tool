export interface ModelRequest { provider: string; model?: string; operation: 'query' | 'expand' | 'connection'; contents: string; systemInstruction: string; }
export interface ModelResponse { connected?: boolean; reasoning?: string; result?: unknown; provider?: string; model?: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number }; }
export function buildModelServiceUrl(baseUrl: string | undefined, path?: string): string;
export function requestModelService(baseUrl: string | undefined, request: ModelRequest, options?: { signal?: AbortSignal; timeoutMs?: number; fetchImpl?: typeof fetch }): Promise<ModelResponse>;
export function validateQueryResult(result: unknown): unknown;
