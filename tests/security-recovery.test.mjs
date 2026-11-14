import test from "node:test";
import assert from "node:assert/strict";
import { clearAppStorage, isAppStorageKey } from "../src/utils/recoveryStorage.mjs";

function createStorage(entries) {
  const values = new Map(entries);
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    get values() { return values; },
  };
}

test("recognizes all application-owned namespaces, including legacy whitelist", () => {
  for (const key of [
    "ai_retrieval_providers",
    "ai_retrieval_history",
    "retrieval_ai_trajectories",
    "visited-guided-search-v1.0",
    "suYangFinalV6_react",
  ]) assert.equal(isAppStorageKey(key), true, key);
});

test("does not classify unrelated origin data as application-owned", () => {
  for (const key of ["google_auth", "other_app_settings", "analytics", "suYangFinalV6_react_backup"]) {
    assert.equal(isAppStorageKey(key), false, key);
  }
});

test("clears only application keys and preserves unrelated browser data", () => {
  const storage = createStorage([
    ["ai_retrieval_providers", "secret"],
    ["suYangFinalV6_react", "custom links"],
    ["other_app_settings", "keep"],
    ["google_auth", "keep"],
    ["retrieval_ai_trajectories", "keep? no"],
  ]);
  clearAppStorage(storage);
  assert.deepEqual([...storage.values.entries()], [
    ["other_app_settings", "keep"],
    ["google_auth", "keep"],
  ]);
});

test("handles empty storage", () => {
  const storage = createStorage([]);
  assert.doesNotThrow(() => clearAppStorage(storage));
  assert.equal(storage.length, 0);
});
