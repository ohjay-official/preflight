export type RetryOptions = {
  attempts?: number;
  backoffMs?: number[];
  fetchImpl?: typeof fetch;
};

const DEFAULT_BACKOFF = [250, 750];

/**
 * Fetch with a timeout and a short backoff on 429, 5xx, and network errors.
 * Timeouts are not retried, so one slow call cannot run three times.
 */
export async function requestWithBackoff(url: string, timeoutMs: number, options: RetryOptions = {}): Promise<Response> {
  const attempts = options.attempts ?? 3;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF;
  const fetchImpl = options.fetchImpl ?? fetch;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: "application/json", "user-agent": "Preflight" },
      });
      if (response.ok) return response;
      const retryable = response.status === 429 || response.status >= 500;
      lastError = new Error(`HTTP ${response.status}`);
      if (!retryable || attempt === attempts - 1) throw lastError;
    } catch (error) {
      const asError = error instanceof Error ? error : new Error("Request failed.");
      if (asError.name === "TimeoutError" || asError.name === "AbortError") throw asError;
      if (asError.message.startsWith("HTTP ") && attempt === attempts - 1) throw asError;
      if (asError.message.startsWith("HTTP ") && !asError.message.includes("HTTP 429") && !/HTTP 5\d\d/.test(asError.message)) {
        throw asError;
      }
      lastError = asError;
      if (attempt === attempts - 1) throw asError;
    }
    const wait = backoffMs[attempt] ?? backoffMs[backoffMs.length - 1] ?? 0;
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  }

  throw lastError ?? new Error("Request failed.");
}
