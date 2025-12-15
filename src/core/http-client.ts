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
    this.baseUrl = 'http://api.sazito.com:8080';
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
    const url = this.buildUrl(endpoint, options?.params);
    const cacheKey = CacheManager.generateKey('GET', url, options?.params);

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
    options?: RequestOptions
  ): Promise<SazitoResponse<T>> {
    const url = this.buildUrl(endpoint);

    // Transform request body to snake_case
    const transformedBody = body ? transformRequestKeys(body) : undefined;

    // Invalidate related cache
    const apiName = this.getApiName(endpoint);
    this.cache.deletePattern(`GET:.*${apiName}`);

    return this.request<T>('POST', url, {
      ...options,
      body: transformedBody
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

    // Transform request body to snake_case
    const transformedBody = body ? transformRequestKeys(body) : undefined;

    // Invalidate related cache
    const apiName = this.getApiName(endpoint);
    this.cache.deletePattern(`GET:.*${apiName}`);

    return this.request<T>('PUT', url, {
      ...options,
      body: transformedBody
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
    options?: RequestOptions & { body?: any },
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
        headers: this.getHeaders(options?.headers),
        body: options?.body ? JSON.stringify(options.body) : undefined,
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

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Extract result from data.result if present
      const result = data?.result !== undefined ? data.result : data;

      if (this.config.debug) {
        console.log(`[Sazito SDK] ${method} ${url}:`, { status: response.status, data: result });
      }

      // Transform response to camelCase and beautified field names
      let transformedResult = result ? transformResponseKeys(result) : result;

      // Unwrap single-key responses for specific entity types (e.g., { cart: {...} } -> {...})
      // Don't unwrap 'route' responses as they need to be accessed as response.data.route
      const unwrapKeys = ['cart', 'product', 'user', 'order', 'invoice', 'payment', 'shipping'];
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
            message: transformedResult?.message || result?.message || response.statusText || 'Request failed',
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
          message: error.name === 'AbortError' ? 'Request timeout' : error.message || 'Network error',
          type: 'network',
          details: error
        }
      };
    }
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
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-forwarded-host': this.domain,  // Send domain in header
      ...customHeaders
    };

    // Auto-inject JWT from cookie (raw JWT, no Bearer prefix)
    const token = this.tokenStorage.get();
    if (token) {
      headers['Authorization'] = token;  // Raw JWT, NOT "Bearer {token}"
    }

    return headers;
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

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
