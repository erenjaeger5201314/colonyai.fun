// Insert into a Map while keeping it bounded — oldest entries are evicted first
// (Map preserves insertion order). Used for the client-side HTML preview caches
// so long browsing sessions don't accumulate unbounded content in memory.
export function setBounded<V>(map: Map<string, V>, key: string, value: V, max = 30) {
  map.delete(key);
  map.set(key, value);
  while (map.size > max) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}
