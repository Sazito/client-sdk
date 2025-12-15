/**
 * Sazito SDK - Main Entry Point
 * Official JavaScript/TypeScript SDK for Sazito e-commerce platform
 */

// Main client
export { SazitoClient, createSazitoClient } from './core/client';

// Configuration
export type { SazitoConfig, CacheConfig, RetryConfig } from './core/config';

// Types
export * from './types';

// For advanced usage
export { HttpClient } from './core/http-client';
export { TokenStorage } from './utils/token-storage';
export { CredentialsManager } from './utils/credentials-manager';

// Data transformers (for manual transformation if needed)
export {
  transformResponseKeys,
  transformRequestKeys,
  transformApiResponse,
  transformCartResponse,
  transformInvoiceResponse,
  transformProductListResponse,
  transformShippingAddressInput,
  transformAddToCartInput,
  transformCreateCartInput
} from './utils/transformers';
