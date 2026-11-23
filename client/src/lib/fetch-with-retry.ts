type RetryOptions = RequestInit & {
  maxAttempts?: number;
  delayMs?: number;
  maxDelayMs?: number;
};

const isTransientStatus = (status: number) =>
  status === 408 || status === 429 || status >= 500;

const sleep = (ms: number, signal?: AbortSignal | null) =>
  new Promise<void>((resolve, reject) => {
    if (!signal) {
      setTimeout(resolve, ms);
      return;
    }
    if (signal.aborted) return reject(signal.reason);

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });

/**
 * Fetch with retry for transient HTTP statuses (408, 429, 5xx). Non-transient error responses are thrown immediately.
 * The delay between attempts doubles each time, starting at `delayMs` and capped at `maxDelayMs`.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  { maxAttempts = 3, delayMs = 500, maxDelayMs = 3000, ...init }: RetryOptions =
    {},
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res: Response | undefined;
    try {
      res = await fetch(input, init);
    } catch (err) {
      if (init.signal?.aborted) throw err;
      lastError = err; // network error, retry
    }

    if (res) {
      if (res.ok) return res;
      lastError = new Error(`Request failed: ${res.status} ${res.statusText}`);
      if (!isTransientStatus(res.status)) throw lastError;
    }

    // Exponential backoff for retry
    // Waits delayMs, then 2x delayMs, then 4x delayMs ... up to maxDelayMs
    if (attempt < maxAttempts) {
      const delay = Math.min(delayMs * 2 ** (attempt - 1), maxDelayMs);
      await sleep(delay, init.signal);
    }
  }

  throw lastError;
}
