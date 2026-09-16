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
export type { ModuleContext } from './core/module-context';
export type { ProductsAPI } from './api/products';
export type { CategoriesAPI, CategoryTreeNode, CategoryTree, CategoryListResponse, CategoryFilters } from './api/categories';
export type { CartAPI, AddItemAttributesInput, UpdateItemAttributesInput } from './api/cart';
export type { OrdersAPI } from './api/orders';
export type { InvoicesAPI, AddInvoiceFormInput } from './api/invoices';
export type { ShippingAPI } from './api/shipping';
export type { PaymentsAPI } from './api/payments';
export type {
  UsersAPI,
  LoginInput,
  RegisterInput,
  MobileLoginInput,
  VerifyMobileInput,
  EmailLoginRequestInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
  UpdateMobilePhoneRequestInput,
  UpdateMobilePhoneVerificationInput,
  LoginResponse
} from './api/users';
export type { SearchAPI, SearchFilters } from './api/search';
export type { WalletAPI, WalletTransactionReason, WalletTransaction, WalletBalance, Wallet, TransactionFilters, WalletTransactionsResponse } from './api/wallet';
export type { CMSAPI, CMSPage, CMSFilters } from './api/cms';
export type { ImagesAPI, UploadImageResponse } from './api/images';
export type { VisitsAPI, VisitInput, VisitResponse } from './api/visits';
export type {
  BookingAPI,
  Event,
  SchedulerEvent,
  BookingTimeSlot,
  BookingAvailableDay,
  EventAvailabilitiesResponse,
  EventAvailabilityFilters,
  CreateBookingInput,
  Booking,
  EventFilters
} from './api/booking';
export type { EntityRoutesAPI } from './api/entity-routes';
export type { MenuAPI } from './api/menu';
export type {
  GeneralAPI,
  Region as GeneralRegion,
  City as GeneralCity,
  PremiumInfo,
  GoogleAnalyticsCode,
  GoogleInfo,
  LogoInfo,
  SocialInfo,
  DomainInfo,
  EnamadInfo,
  ShopInfo,
  CheckoutConfig,
  TajrobeConfig,
  WalletConfig,
  ShopFeatures,
  ScriptsInfo,
  SettingsInfo,
  GeneralInfo
} from './api/general';
export type {
  DynamicFormsAPI,
  DynamicFormFieldType,
  SelectOption,
  DynamicFormField,
  DynamicForm,
  UploadedDynamicFormFile
} from './api/dynamic-forms';
export type { RegionsAPI, RegionCity, RegionWithCities } from './api/regions';
export type {
  FeedbacksAPI,
  RecommendationStatus,
  FeedbackProductAttribute,
  FeedbackProductImage,
  FeedbackSeedItem,
  FeedbackSeed,
  CreateOrderRatingInput,
  CommentResponse,
  ProductReviewRequest,
  ProductReviewDraft,
  SubmitOrderFeedbackInput,
  SubmitOrderFeedbackResult,
  ProductStatistics,
  ProductReview,
  ProductReviewsFilters,
  ProductReviewsResponse,
  ReviewAttachmentInput,
  ReviewUploadedImage,
  ReviewImageUploadResponse
} from './api/feedbacks';
export { buildProductReviewInput } from './api/feedbacks';

// For advanced usage
export { HttpClient } from './core/http-client';
export { TokenStorage } from './utils/token-storage';
export { CredentialsManager, MemoryStorage, type StorageAdapter } from './utils/credentials-manager';

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
  createGeneralAPI,
  createDynamicFormsAPI,
  createRegionsAPI
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
  createGeneralAPI as general,
  createDynamicFormsAPI as dynamicForms,
  createRegionsAPI as regions
} from './modules';

// Data transformers (for manual transformation if needed)
export {
  transformResponseKeys,
  transformRequestKeys,
  toEnglishDigits,
  transformApiResponse,
  transformCartResponse,
  transformInvoiceResponse,
  transformProductListResponse,
  transformShippingAddressInput,
  transformAddToCartInput,
  transformCreateCartInput
} from './utils/transformers';
