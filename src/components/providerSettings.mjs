/** Public-release settings contain display preferences and trusted service URLs only. */
export const PROVIDER_STORAGE_KEY = 'ai_retrieval_providers';
export const LEGACY_SECRET_STORAGE_KEYS = Object.freeze([
  'ai_retrieval_api_key', 'ai_retrieval_api_keys', 'ai_retrieval_gemini_key',
  'ai_retrieval_gemini_api_key', 'retrieval_ai_api_key', 'retrieval_ai_gemini_key',
]);
const ownedSecretKey = key => /^(ai_retrieval_|retrieval_ai_)/.test(key) && /(?:api.?key|token|secret|credential)/i.test(key);

export function safeServiceUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash ||
        !(url.protocol === 'https:' || (url.protocol === 'http:' && loopback))) return '';
    return url.toString().replace(/\/$/, '');
  } catch { return ''; }
}

export function sanitizeProviders(records, defaults = []) {
  const result = [];
  const seen = new Set();
  for (const record of Array.isArray(records) ? records : []) {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' ||
        !/^[a-zA-Z0-9_.-]{1,80}$/.test(record.id) || seen.has(record.id)) continue;
    const fallback = defaults.find(provider => provider.id === record.id);
    const text = (value, otherwise, limit) => typeof value === 'string' && value.trim() ? value.trim().slice(0, limit) : otherwise;
    result.push({
      id: record.id,
      name: text(record.name, fallback?.name || record.id, 120),
      isGemini: record.id === 'gemini' || record.isGemini === true,
      models: text(record.models, fallback?.models || '', 4000),
      // A legacy upstream endpoint must never silently become a trusted proxy.
      serviceUrl: safeServiceUrl(record.serviceUrl) || safeServiceUrl(fallback?.serviceUrl),
    });
    seen.add(record.id);
  }
  for (const provider of defaults) {
    if (!seen.has(provider.id)) result.push(...sanitizeProviders([provider]));
  }
  return result;
}

export function migrateProviderSettings(storage, defaults = []) {
  let records = [];
  try { records = JSON.parse(storage.getItem(PROVIDER_STORAGE_KEY) || '[]'); }
  catch { /* Malformed legacy settings are replaced, never preserved verbatim. */ }
  const providers = sanitizeProviders(records, defaults);
  // Rewrite before rendering any legacy fields; no raw record is logged or returned.
  storage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(providers));
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key && (LEGACY_SECRET_STORAGE_KEYS.includes(key) || ownedSecretKey(key))) storage.removeItem(key);
  }
  const speechUrl = storage.getItem('ai_retrieval_speech_proxy_url');
  if (speechUrl) {
    const safeUrl = safeServiceUrl(speechUrl);
    if (safeUrl) storage.setItem('ai_retrieval_speech_proxy_url', safeUrl);
    else storage.removeItem('ai_retrieval_speech_proxy_url');
  }
  return providers;
}
