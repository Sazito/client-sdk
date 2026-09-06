/**
 * Common types used throughout the SDK
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

/** Error returned by every SDK API method. */
export interface SazitoError {
  status?: number;
  message: string;
  type: 'network' | 'api' | 'validation';
  details?: JsonValue;
}

/**
 * Unified response pattern for all API calls.
 * API failures are returned in `error`; public API methods do not throw them.
 */
export type SazitoResponse<T> =
  | { data: T; error?: never }
  | { data?: never; error: SazitoError };

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
 * Request options that can be passed to an API call
 */
export interface RequestOptions {
  /** Override retry count (0-3); explicitly opts non-idempotent requests into retries. */
  retries?: number;
  timeout?: number;      // Override timeout in ms
  cache?: boolean;       // Override cache behavior
  headers?: Record<string, string>;
  signal?: AbortSignal;  // For request cancellation
  skipTransform?: boolean; // Return the raw parsed body (no result-unwrap / key transform)
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Product attribute (e.g., color, size)
 */
/**
 * Rich attribute value for typed fields like color swatches.
 * `value` is the human-readable label; `extra` carries the payload
 * (e.g. a hex color when `fieldType` is `'color'`).
 */
export interface ProductAttributeValueObject {
  value: string;
  extra?: string;
  fieldType?: string;
}

export interface ProductAttribute {
  name: string;
  value: string | ProductAttributeValueObject;
}

/**
 * Normalized product snapshot embedded in checkout entities
 * (cart items, invoice items, successful order items).
 */
export interface CheckoutProductSnapshot {
  variantId: number;
  productId?: number;
  name: string;
  url?: string;
  image?: Image;
  attributes: ProductAttribute[];
  productType?: string;
  hasMaxOrder?: boolean;
  maxOrderQuantity?: number;
  minOrderQuantity?: number;
}

/**
 * Region (استان)
 */
export interface Region {
  id: number;
  name: string;
  cities?: City[];
}

/**
 * City (شهر)
 */
export interface City {
  id: number;
  name: string;
  regionId?: number;
  latitude?: number;
  longitude?: number;
}
