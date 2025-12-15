/**
 * Common types used throughout the SDK
 */

/**
 * Unified response pattern for all API calls
 * No exceptions are thrown - errors are returned in the error field
 */
export interface SazitoResponse<T> {
  data?: T;
  error?: {
    status?: number;
    message: string;
    type: 'network' | 'api' | 'validation';
    details?: any;
  };
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Request options that can be passed to any API call
 */
export interface RequestOptions {
  retries?: number;      // Override retry count (0-3)
  timeout?: number;      // Override timeout in ms
  cache?: boolean;       // Override cache behavior
  headers?: Record<string, string>;
  signal?: AbortSignal;  // For request cancellation
}

/**
 * Cookie options for token storage
 */
export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  maxAge?: number;       // In seconds
  path?: string;
  domain?: string;
}

/**
 * Image type used in products, categories, etc.
 */
export interface Image {
  id: number;
  name: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Product attribute (e.g., color, size)
 */
export interface ProductAttribute {
  name: string;
  value: string;
}

/**
 * Region (استان)
 */
export interface Region {
  id: number;
  name: string;
}

/**
 * City (شهر)
 */
export interface City {
  id: number;
  name: string;
  regionId?: number;
}
