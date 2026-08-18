/**
 * API service layer.
 *
 * Every network call in the app goes through here so that timeouts, retries,
 * aborts and error shapes are handled in exactly one place.
 *
 * If VITE_API_URL is not set, `isConfigured()` returns false and callers fall
 * back to the bundled local data — the site works with no backend at all.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const DEFAULT_TIMEOUT = 12_000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'unknown', cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.cause = cause;
  }
}

/** Human-readable message for a failure. Errors explain what to do next. */
function describe(status) {
  if (status === 0) return 'Cannot reach the server. Check your connection and try again.';
  if (status === 401 || status === 403) return 'The server rejected this request. Check the API key.';
  if (status === 404) return 'That endpoint does not exist on the server.';
  if (status === 429) return 'Too many messages. Wait a moment and try again.';
  if (status >= 500) return 'The server ran into a problem. Try again in a moment.';
  return 'The request failed.';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Retry only on network failures and 5xx — never on 4xx, which will not fix itself. */
const isRetryable = (err) => err instanceof ApiError && (err.status === 0 || err.status >= 500);

async function request(path, opts = {}) {
  const {
    method = 'GET',
    body,
    signal: externalSignal,
    timeout = DEFAULT_TIMEOUT,
    retries = 1,
    headers = {},
  } = opts;

  if (!BASE_URL) {
    throw new ApiError('No API URL configured.', { code: 'not-configured' });
  }

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeout);
    const onExternalAbort = () => controller.abort(externalSignal.reason);
    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        signal: controller.signal,
        headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        let detail = '';
        try {
          detail = (await res.json())?.error || '';
        } catch { /* body was not JSON — the status is enough */ }
        throw new ApiError(detail || describe(res.status), { status: res.status, code: 'http' });
      }

      return res.status === 204 ? null : await res.json();
    } catch (err) {
      // A caller-initiated abort is not a failure — surface it untouched.
      if (externalSignal?.aborted) throw err;

      const wrapped =
        err instanceof ApiError
          ? err
          : new ApiError(
              err?.name === 'TimeoutError' ? 'The server took too long to respond.' : describe(0),
              { status: 0, code: err?.name === 'TimeoutError' ? 'timeout' : 'network', cause: err }
            );

      if (attempt < retries && isRetryable(wrapped)) {
        attempt += 1;
        await sleep(400 * 2 ** (attempt - 1)); // 400ms, 800ms, …
        continue;
      }
      throw wrapped;
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }
}

export const api = {
  /** True when a backend is configured. Callers use this to decide on fallbacks. */
  isConfigured: () => Boolean(BASE_URL),
  baseUrl: BASE_URL,

  /** Portfolio content (stats, projects, experience…). */
  getPortfolio: (opts) => request('/api/portfolio', { ...opts, retries: 2 }),

  /**
   * Send the conversation to the assistant.
   * @param {{role:'user'|'assistant', content:string}[]} messages
   * @returns {Promise<{reply:string}>}
   */
  sendMessage: (messages, opts) =>
    request('/api/chat', { ...opts, method: 'POST', body: { messages }, timeout: 30_000, retries: 0 }),
};

export default api;
