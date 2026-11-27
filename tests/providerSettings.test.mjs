import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateProviderSettings, PROVIDER_STORAGE_KEY, safeServiceUrl } from '../src/components/providerSettings.mjs';

class MemoryStorage extends Map {
  get length() { return this.size; }
  key(index) { return [...this.keys()][index] ?? null; }
  getItem(name) { return this.get(name) ?? null; }
  setItem(name, value) { this.set(name, value); }
  removeItem(name) { this.delete(name); }
}

test('upgrading rewrites provider preferences without retaining credentials or adopting an upstream as a proxy', () => {
  const storage = new MemoryStorage();
  const defaults = [{ id: 'gemini', name: 'Gemini', models: 'default', isGemini: true, serviceUrl: '' }];
  storage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify([{
    id: 'gemini', name: 'Chosen name', models: 'preferred', apiKey: 'fixture-only',
    endpoint: 'https://upstream.invalid', headers: { Authorization: 'fixture-only' },
  }]));
  storage.setItem('retrieval_ai_api_key', 'fixture-only');
  storage.setItem('ai_retrieval_speech_proxy_url', 'https://gateway.invalid/?token=fixture-only');
  storage.setItem('unrelated_credentials', 'unrelated');
  storage.setItem('ai_retrieval_theme', 'light');
  const expected = [{ ...defaults[0], name: 'Chosen name', models: 'preferred' }];
  assert.deepEqual(migrateProviderSettings(storage, defaults), expected);
  assert.deepEqual(JSON.parse(storage.getItem(PROVIDER_STORAGE_KEY)), expected);
  assert.equal(storage.getItem('retrieval_ai_api_key'), null);
  assert.equal(storage.getItem('ai_retrieval_speech_proxy_url'), null);
  assert.equal(storage.getItem('unrelated_credentials'), 'unrelated');
  assert.equal(storage.getItem('ai_retrieval_theme'), 'light');
  assert.deepEqual(migrateProviderSettings(storage, defaults), expected);
});

test('invalid saved JSON is replaced and a storage write failure is observable', () => {
  const storage = new MemoryStorage([[PROVIDER_STORAGE_KEY, '{']]);
  assert.deepEqual(migrateProviderSettings(storage), []);
  storage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => migrateProviderSettings(storage), /quota/);
});

test('trusted-service URLs accept HTTPS and HTTP loopback only and exclude authentication material', () => {
  for (const bad of ['http://remote.invalid', 'https://user:pass@gateway.invalid', 'https://gateway.invalid/?key=fixture', 'https://gateway.invalid/#auth', 'file:///etc']) {
    assert.equal(safeServiceUrl(bad), '');
  }
  for (const good of ['https://gateway.invalid/base', 'http://[::1]:8000', 'http://127.0.0.1:8000']) {
    assert.equal(safeServiceUrl(good), good);
  }
});
