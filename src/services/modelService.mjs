const pendingByService = new Map();

export function buildModelServiceUrl(baseUrl, path = '/api/ai/generate') {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) throw new Error('Configure a trusted model service URL in Settings. API keys belong only on that server.');
  let parsed;
  try { parsed = new URL(baseUrl.trim()); } catch { throw new Error('The model service URL must be an absolute HTTP(S) URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('The model service URL cannot contain credentials, query parameters or fragments.');
  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) throw new Error('Remote model services must use HTTPS; HTTP is allowed only for loopback.');
  return parsed.origin + parsed.pathname.replace(/\/+$/, '') + path;
}

/** Serialize a browser's batch/compare requests per service, preserving every requested model. */
export async function requestModelService(baseUrl, request, { signal, timeoutMs = 90000, fetchImpl = globalThis.fetch } = {}) {
  const url = buildModelServiceUrl(baseUrl);
  const previous = pendingByService.get(url) || Promise.resolve();
  let release;
  const queued = new Promise(resolve => { release = resolve; });
  pendingByService.set(url, queued);
  let cancelQueue;
  try {
    await new Promise((resolve, reject) => {
      cancelQueue = () => reject(new Error('Model generation was cancelled.'));
      if (signal?.aborted) { cancelQueue(); return; }
      signal?.addEventListener('abort', cancelQueue, { once: true });
      previous.then(resolve, resolve);
    });
  } catch (error) {
    // Preserve the queue barrier until prior work finishes, while cancelling this caller promptly.
    void previous.catch(() => {}).then(() => {
      release();
      if (pendingByService.get(url) === queued) pendingByService.delete(url);
    });
    throw error;
  } finally {
    signal?.removeEventListener('abort', cancelQueue);
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  let timer, timedOut = false;
  try {
    if (signal?.aborted) { cancel(); throw new DOMException('Cancelled', 'AbortError'); }
    signal?.addEventListener('abort', cancel, { once: true });
    timer = setTimeout(() => { timedOut = true; cancel(); }, Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 90000);
    // Explicit allowlist: legacy callers cannot serialize a provider key or upstream URL.
    const body = { provider: request.provider, model: request.model, operation: request.operation, contents: request.contents, systemInstruction: request.systemInstruction };
    const response = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    let payload;
    try { payload = await response.json(); } catch { throw new Error('The model service returned invalid JSON. Check the trusted service configuration.'); }
    if (!response.ok) {
      const messages = { 401: 'Model service authentication is required.', 403: 'The model service rejected this origin, provider or model.', 413: 'The model request is too large.', 422: 'The model request format is invalid.', 429: 'The model service is busy or rate limited. Try again shortly.', 502: 'The model provider returned an invalid result or rejected the request.', 503: 'The provider is not configured on the trusted model service.', 504: 'The upstream model request timed out.' };
      throw new Error(messages[response.status] || `Model service request failed (HTTP ${response.status}).`);
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('The model service returned an invalid response.');
    if (controller.signal.aborted) throw new DOMException("Cancelled", "AbortError");
    return payload;
  } catch (error) {
    if (signal?.aborted) throw new Error('Model generation was cancelled.');
    if (timedOut) throw new Error('The model service request timed out. Try a shorter request.');
    if (error instanceof TypeError) throw new Error('Could not reach the trusted model service. Check its URL and browser network permissions.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
    release();
    if (pendingByService.get(url) === queued) pendingByService.delete(url);
  }
}

export function validateQueryResult(result) {
  const isStringArray = value => Array.isArray(value) && value.every(item => typeof item === 'string');
  if (!result || typeof result !== 'object' || Array.isArray(result)
    || !['booleanQuery', 'fieldSpecificQuery', 'explanation'].every(key => typeof result[key] === 'string')
    || !Array.isArray(result.keywords) || !result.keywords.every(item => item && typeof item.original === 'string' && isStringArray(item.zhSynonyms) && isStringArray(item.enSynonyms))
    || !Array.isArray(result.schemaMapping) || !result.schemaMapping.every(item => item && ['field', 'mappedConcept', 'reason'].every(key => typeof item[key] === 'string'))
    || (result.suggestedUrls !== undefined && (!Array.isArray(result.suggestedUrls) || !result.suggestedUrls.every(item => item && typeof item.name === 'string' && typeof item.url === 'string')))) {
    throw new Error('The model service returned an invalid search strategy. Expected keywords, Boolean query, field-specific query and schema mapping.');
  }
  return result;
}
