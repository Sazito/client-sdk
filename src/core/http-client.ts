/**
 * HTTP Client with native fetch
 * Provides unified response pattern, retry logic, caching, and automatic data transformation
 */

import { SazitoResponse, RequestOptions } from '../types';
import { SazitoConfig } from './config';
import { TokenStorage } from '../utils/token-storage';
import { CacheManager } from './cache';
import { transformRequestKeys, transformResponseKeys } from '../utils/transformers';

export class HttpClient {
  private baseUrl: string;
  private domain: string;
  private config: Required<SazitoConfig>;
  private tokenStorage: TokenStorage;
  private cache: CacheManager;
  private fetchApi: typeof fetch;

  constructor(config: Required<SazitoConfig>) {
    this.config = config;
    this.baseUrl = config.apiBaseUrl.replace(/\/$/, '');
    this.domain = config.domain;
    this.tokenStorage = new TokenStorage();
    this.cache = new CacheManager();
    // Bind fetch to window context to avoid "Illegal invocation" error
    this.fetchApi = config.customFetchApi.bind(globalThis);
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    options?: RequestOptions & { params?: Record<string, any> }
  ): Promise<SazitoResponse<T>> {
    const transformedParams = options?.params
      ? transformRequestKeys(options.params) as Record<string, any>
      : undefined;
    const url = this.buildUrl(endpoint, transformedParams);
    const cacheKey = CacheManager.generateKey('GET', url, transformedParams);

    // Check cache first (if not disabled)
    if (options?.cache !== false) {
      const apiName = this.getApiName(endpoint);
      const cacheConfig = this.config.cache[apiName];

      if (cacheConfig?.enabled && cacheConfig.ttl) {
        const cached = this.cache.get<T>(cacheKey, cacheConfig.ttl);
        if (cached) {
          if (this.config.debug) {
            console.log('[Sazito SDK] Cache hit:', endpoint);
          }
          return { data: cached };
        }
      }
    }

    const response = await this.request<T>('GET', url, options);

    // Cache successful responses
    if (response.data && options?.cache !== false) {
      this.cache.set(cacheKey, response.data);
    }

    return response;
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions & { skipRequestTransform?: boolean }
  ): Promise<SazitoResponse<T>> {
    const url = this.buildUrl(endpoint);
    const isMultipartBody = this.isMultipartBody(body);
    const isFormUrlEncodedBody = this.isFormUrlEncodedBody(body);
    const isRawBody = isMultipartBody || isFormUrlEncodedBody;

    // Transform JSON-like payloads to snake_case; keep native body types untouched.
    const transformedBody = body
      ? isRawBody || options?.skipRequestTransform ? body : transformRequestKeys(body)
      : undefined;

    // Invalidate related cache
    const apiName = this.getApiName(endpoint);
    this.cache.deletePattern(`GET:.*${apiName}`);

    return this.request<T>('POST', url, {
      ...options,
      body: transformedBody,
      rawBody: isRawBody,
      omitJsonContentType: isMultipartBody
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<SazitoResponse<T>> {
    const url = this.buildUrl(endpoint);
    const isMultipartBody = this.isMultipartBody(body);

    // Transform JSON-like payloads to snake_case; keep multipart bodies untouched
    const transformedBody = body
      ? isMultipartBody ? body : transformRequestKeys(body)
      : undefined;

    // Invalidate related cache
    const apiName = this.getApiName(endpoint);
    this.cache.deletePattern(`GET:.*${apiName}`);

    return this.request<T>('PUT', url, {
      ...options,
      body: transformedBody,
      rawBody: isMultipartBody,
      omitJsonContentType: isMultipartBody
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<T>> {
    const url = this.buildUrl(endpoint);

    // Invalidate related cache
    const apiName = this.getApiName(endpoint);
    this.cache.deletePattern(`GET:.*${apiName}`);

    return this.request<T>('DELETE', url, options);
  }

  /**
   * Core request method
   */
  private async request<T>(
    method: string,
    url: string,
    options?: RequestOptions & {
      body?: any;
      rawBody?: boolean;
      omitJsonContentType?: boolean;
    },
    retryCount = 0
  ): Promise<SazitoResponse<T>> {
    const controller = new AbortController();
    const signal = options?.signal || controller.signal;

    // Set timeout
    const timeout = options?.timeout || this.config.timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.fetchApi(url, {
        method,
        headers: this.getHeaders(options?.headers, options?.omitJsonContentType),
        body: options?.body
          ? options.rawBody ? options.body : JSON.stringify(options.body)
          : undefined,
        signal
      });

      clearTimeout(timeoutId);

      // Check if we should retry
      const maxRetries = options?.retries !== undefined ? options.retries : this.config.retry.retries;
      if (!response.ok && this.shouldRetry(response.status) && retryCount < maxRetries) {
        if (this.config.debug) {
          console.log(`[Sazito SDK] Retrying request (${retryCount + 1}/${maxRetries}):`, url);
        }
        await this.delay(this.config.retry.retryDelay * (retryCount + 1));
        return this.request<T>(method, url, options, retryCount + 1);
      }

      // Parse the body without allowing malformed JSON on an HTTP error to be
      // misreported as a network failure.
      const data = await this.parseResponseBody(response);

      // Caller wants the raw parsed body (no result-unwrap / key transform).
      // Used where the generic transform is lossy (e.g. colliding *_identifier keys).
      if (options?.skipTransform && response.ok) {
        return { data: data as T };
      }

      // Extract result from data.result if present
      const result = data?.result !== undefined ? data.result : data;

      if (this.config.debug) {
        console.log(`[Sazito SDK] ${method} ${url}:`, this.redactDebugValue({
          status: response.status,
          data: result
        }));
      }

      // Transform response to camelCase and beautified field names
      let transformedResult = result ? transformResponseKeys(result) : result;

      // Unwrap single-key responses for specific entity types (e.g., { cart: {...} } -> {...})
      // Don't unwrap 'route' responses as they need to be accessed as response.data.route
      const unwrapKeys = ['cart', 'product', 'user', 'order', 'invoice', 'payment', 'shippingAddress'];
      if (transformedResult && typeof transformedResult === 'object' && !Array.isArray(transformedResult)) {
        const keys = Object.keys(transformedResult);
        if (keys.length === 1 && unwrapKeys.includes(keys[0]) && 
            typeof transformedResult[keys[0]] === 'object' && transformedResult[keys[0]] !== null) {
          transformedResult = transformedResult[keys[0]];
        }
      }

      // Return unified response - no exceptions
      if (response.ok) {
        return { data: transformedResult as T };
      } else {
        return {
          error: {
            status: response.status,
            message: this.extractErrorMessage(transformedResult, response.statusText),
            type: 'api',
            details: transformedResult
          }
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (this.config.debug) {
        console.error('[Sazito SDK] Request failed:', error);
      }

      // Network error or abort
      return {
        error: {
          message: error?.name === 'AbortError' ? 'Request timeout' : error?.message || 'Network error',
          type: 'network',
          details: this.serializeErrorDetails(error)
        }
      };
    }
  }

  /**
   * Parse JSON responses from text so an invalid JSON error body can still be
   * returned using the standard API-error envelope.
   */
  private async parseResponseBody(response: Response): Promise<any> {
    const rawBody = await response.text();
    if (!rawBody) {
      return undefined;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return rawBody;
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  }

  /** Extract a useful message from the common backend error shapes. */
  private extractErrorMessage(details: any, statusText: string): string {
    const visit = (value: any): string | undefined => {
      if (typeof value === 'string') {
        return value.trim() || undefined;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          const message = visit(item);
          if (message) return message;
        }
        return undefined;
      }

      if (!value || typeof value !== 'object') {
        return undefined;
      }

      for (const key of ['message', 'error', 'errors', 'detail', 'title']) {
        const message = visit(value[key]);
        if (message) return message;
      }

      return undefined;
    };

    return visit(details) || statusText || 'Request failed';
  }

  /** Keep network error details serializable, matching `SazitoError.details`. */
  private serializeErrorDetails(error: any): { name: string; message: string } {
    return {
      name: typeof error?.name === 'string' ? error.name : 'Error',
      message: typeof error?.message === 'string' ? error.message : String(error)
    };
  }

  /** Preserve debug structure without printing credentials or customer PII. */
  private redactDebugValue(value: unknown, key = ''): unknown {
    const sensitiveKey = /authorization|cookie|password|secret|token|identifier|tracking|mobile|phone|email|postal|address|first.?name|last.?name|receipt.?ref|ref.?id/i;
    if (sensitiveKey.test(key)) {
      if (value === undefined || value === null || value === '') return value;
      const text = String(value);
      return text.length <= 4 ? '[REDACTED]' : `[REDACTED:${text.slice(-4)}]`;
    }
    if (Array.isArray(value)) return value.map((entry) => this.redactDebugValue(entry));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([entryKey, entryValue]) => [
          entryKey,
          this.redactDebugValue(entryValue, entryKey)
        ])
      );
    }
    return value;
  }

  /**
   * Build full URL with query params
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = `${this.baseUrl}${endpoint}`;

    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return `${url}?${searchParams.toString()}`;
  }

  /**
   * Get request headers
   */
  private getHeaders(
    customHeaders?: Record<string, string>,
    omitJsonContentType = false
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'x-forwarded-host': this.domain,  // Send domain in header
      ...customHeaders
    };

    if (!omitJsonContentType) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    } else {
      delete headers['Content-Type'];
    }

    // Auto-inject JWT from cookie (raw JWT, no Bearer prefix)
    const token = this.tokenStorage.get();
    if (token) {
      headers['Authorization'] = token;  // Raw JWT, NOT "Bearer {token}"
    }

    return headers;
  }

  private isMultipartBody(body: any): boolean {
    return typeof FormData !== 'undefined' && body instanceof FormData;
  }

  private isFormUrlEncodedBody(body: any): boolean {
    return typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
  }

  /**
   * Check if status code should trigger a retry
   */
  private shouldRetry(status: number): boolean {
    // Retry on 5xx server errors
    return status >= 500 && status < 600;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract API name from endpoint for cache management
   */
  private getApiName(endpoint: string): keyof Required<SazitoConfig>['cache'] {
    if (endpoint.includes('/products')) return 'products';
    if (endpoint.includes('/product_categories')) return 'categories';
    if (endpoint.includes('/cart')) return 'cart';  // Matches both /cart and /carts
    if (endpoint.includes('/orders')) return 'orders';
    if (endpoint.includes('/search')) return 'search';
    if (endpoint.includes('/tags')) return 'tags';
    if (endpoint.includes('/entity_route')) return 'entityRoutes';
    return 'cms';
  }

  /**
   * Get token storage instance
   */
  getTokenStorage(): TokenStorage {
    return this.tokenStorage;
  }

  /** Whether verbose SDK diagnostics were enabled by the client config. */
  isDebugEnabled(): boolean {
    return this.config.debug;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
