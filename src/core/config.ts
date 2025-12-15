/**
 * SDK Configuration
 */

export interface CacheConfig {
  enabled: boolean;
  ttl?: number;  // Time to live in milliseconds
}

export interface RetryConfig {
  enabled: boolean;
  retries: number;      // 0-3
  retryDelay: number;   // milliseconds
}

export interface SazitoConfig {
  domain: string;                    // Without https (e.g., 'mystore.sazito.com')
  timeout?: number;                  // Request timeout in ms (default: 30000)
  retry?: RetryConfig;
  cache?: {
    products?: CacheConfig;
    categories?: CacheConfig;
    cart?: CacheConfig;
    orders?: CacheConfig;
    search?: CacheConfig;
    cms?: CacheConfig;
    tags?: CacheConfig;
    entityRoutes?: CacheConfig;
  };
  customFetchApi?: typeof fetch;    // Custom fetch implementation
  debug?: boolean;
}

export const DEFAULT_CONFIG: Required<Omit<SazitoConfig, 'domain' | 'customFetchApi'>> = {
  timeout: 30000,
  retry: {
    enabled: true,
    retries: 3,
    retryDelay: 1000
  },
  cache: {
    products: { enabled: true, ttl: 600000 },      // 10 min
    categories: { enabled: true, ttl: 600000 },    // 10 min
    cart: { enabled: false },                       // Never cache
    orders: { enabled: false },                     // Never cache
    search: { enabled: true, ttl: 300000 },        // 5 min
    cms: { enabled: true, ttl: 600000 },           // 10 min
    tags: { enabled: true, ttl: 600000 },          // 10 min
    entityRoutes: { enabled: true, ttl: 600000 }   // 10 min
  },
  debug: false
};

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig: SazitoConfig): Required<SazitoConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    retry: {
      ...DEFAULT_CONFIG.retry,
      ...userConfig.retry
    },
    cache: {
      ...DEFAULT_CONFIG.cache,
      ...userConfig.cache
    },
    customFetchApi: userConfig.customFetchApi || (typeof fetch !== 'undefined' ? fetch : undefined) as typeof fetch
  };
}
