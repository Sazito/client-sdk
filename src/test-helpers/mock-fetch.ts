/**
 * Mock Fetch Utilities
 */

export interface MockResponseOptions {
  status?: number;
  ok?: boolean;
  statusText?: string;
  headers?: Record<string, string>;
}

/**
 * Creates a mock fetch function that returns the specified response
 */
export const mockFetch = (
  response: any,
  options: MockResponseOptions = {}
): jest.Mock => {
  const {
    status = 200,
    ok = status >= 200 && status < 300,
    statusText = 'OK',
    headers = { 'Content-Type': 'application/json' }
  } = options;

  return jest.fn(() =>
    Promise.resolve({
      ok,
      status,
      statusText,
      headers: new Headers(headers),
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      blob: () => Promise.resolve(new Blob([JSON.stringify(response)])),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      clone: () => ({ json: () => Promise.resolve(response) })
    })
  ) as jest.Mock;
};

/**
 * Creates a mock fetch that rejects with an error
 */
export const mockFetchError = (error: Error): jest.Mock => {
  return jest.fn(() => Promise.reject(error)) as jest.Mock;
};

/**
 * Creates a mock fetch that times out
 */
export const mockFetchTimeout = (delay: number = 1000): jest.Mock => {
  return jest.fn(
    () =>
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), delay);
      })
  ) as jest.Mock;
};

/**
 * Creates a mock fetch that succeeds after N retries
 */
export const mockFetchWithRetries = (
  failCount: number,
  successResponse: any
): jest.Mock => {
  let attempts = 0;

  return jest.fn(() => {
    attempts++;
    if (attempts <= failCount) {
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve({ error: 'Server error' })
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: () => Promise.resolve(successResponse)
    });
  }) as jest.Mock;
};
