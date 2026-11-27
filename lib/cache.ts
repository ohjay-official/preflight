type Entry<T> = { at: number; value: T };

/**
 * Short-lived in-memory cache. Concurrent loads for the same key share one promise.
 */
export function createTtlCache<T>(ttlMs: number) {
  const values = new Map<string, Entry<T>>();
  const inflight = new Map<string, Promise<T>>();

  return {
    get(key: string, load: () => Promise<T>): Promise<T> {
      const hit = values.get(key);
      if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value);
      const pending = inflight.get(key);
      if (pending) return pending;
      const promise = load()
        .then((value) => {
          values.set(key, { at: Date.now(), value });
          inflight.delete(key);
          return value;
        })
        .catch((error: unknown) => {
          inflight.delete(key);
          throw error;
        });
      inflight.set(key, promise);
      return promise;
    },
    clear(): void {
      values.clear();
      inflight.clear();
    },
  };
}

export async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (item === undefined) return;
      out[index] = await fn(item, index);
    }
  });
  await Promise.all(workers);
  return out;
}
