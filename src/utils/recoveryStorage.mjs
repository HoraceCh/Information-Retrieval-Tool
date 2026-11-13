/**
 * This list is scoped to keys owned by the hosted AI Retrieval Tool.
 * The legacy whitelist key is intentionally explicit: do not reset the origin.
 */
export const isAppStorageKey = (key) =>
  key.startsWith("ai_retrieval_") ||
  key.startsWith("retrieval_ai_") ||
  key === "visited-guided-search-v1.0" ||
  key === "suYangFinalV6_react";

export function clearAppStorage(storage) {
  for (let i = storage.length - 1; i >= 0; i -= 1) {
    const key = storage.key(i);
    if (key !== null && isAppStorageKey(key)) {
      storage.removeItem(key);
    }
  }
}
