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
export type { SearchFilters } from './api/search';

// For advanced usage
export { HttpClient } from './core/http-client';
export { TokenStorage } from './utils/token-storage';
export { CredentialsManager } from './utils/credentials-manager';

// Module factories
export {
  createProductsAPI,
  createCategoriesAPI,
  createCartAPI,
  createOrdersAPI,
  createInvoicesAPI,
  createShippingAPI,
  createPaymentsAPI,
  createUsersAPI,
  createSearchAPI,
  createFeedbacksAPI,
  createWalletAPI,
  createCMSAPI,
  createImagesAPI,
  createVisitsAPI,
  createBookingAPI,
  createEntityRoutesAPI,
  createMenuAPI,
  createGeneralAPI
} from './modules';

// Shorthand aliases for module factories
export {
  createProductsAPI as products,
  createCategoriesAPI as categories,
  createCartAPI as cart,
  createOrdersAPI as orders,
  createInvoicesAPI as invoices,
  createShippingAPI as shipping,
  createPaymentsAPI as payments,
  createUsersAPI as users,
  createSearchAPI as search,
  createFeedbacksAPI as feedbacks,
  createWalletAPI as wallet,
  createCMSAPI as cms,
  createImagesAPI as images,
  createVisitsAPI as visits,
  createBookingAPI as booking,
  createEntityRoutesAPI as entityRoutes,
  createMenuAPI as menu,
  createGeneralAPI as general
} from './modules';

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
