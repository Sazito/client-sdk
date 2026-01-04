/**
 * General API (Shop configuration and features)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, RequestOptions } from '../types';
import { GENERAL_API } from '../constants/endpoints';
import { transformGeneralInfoResponse } from '../utils/transformers';

/**
 * Feature flag with enabled state
 */
export interface FeatureFlag {
  enabled: boolean;
}

/**
 * Region information
 */
export interface Region {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * City information
 */
export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region: Region;
}

/**
 * Premium feature configuration
 */
export interface PremiumInfo {
  enabled: boolean;
  nextRenewal: string;
  subscriptionSubtype: string;
}

/**
 * Google Analytics code configuration
 */
export interface GoogleAnalyticsCode {
  code: string;
  enabled: boolean;
}

/**
 * Google Analytics configuration
 */
export interface GoogleInfo {
  analyticsCode: GoogleAnalyticsCode;
  analyticsId: GoogleAnalyticsCode;
  tagManager: GoogleAnalyticsCode;
}

/**
 * Logo configuration
 */
export interface LogoInfo {
  favicon: string;
  main: string;
}

/**
 * Social media links
 */
export interface SocialInfo {
  facebook: string;
  instagram: string;
  phone1: string;
  phone2: string;
  telegram: string;
  twitter: string;
  whatsapp: string;
}

/**
 * Domain information
 */
export interface DomainInfo {
  url: string;
}

/**
 * E-namad configuration
 */
export interface EnamadInfo {
  code: string;
}

/**
 * Shop information (merged general + shop config)
 */
export interface ShopInfo {
  name: string;
  description: string;
  city: City;
  registerType: string;
  showProductStockNumber: ShowProductStockNumberConfig;
}

/**
 * Checkout add to cart alert configuration
 */
export interface AddToCartAlertConfig {
  enabled: boolean;
}

/**
 * Checkout dynamic form configuration
 */
export interface DynamicFormConfig {
  enabled: boolean;
}

/**
 * Checkout email optional configuration
 */
export interface EmailOptionalConfig {
  enabled: boolean;
}

/**
 * Checkout manual configuration
 */
export interface ManualConfig {
  enabled: boolean;
}

/**
 * Minimum basket configuration
 */
export interface MinBasketConfig {
  enabled: boolean;
  minBasket: number;
}

/**
 * Mini cart configuration
 */
export interface MiniCartConfig {
  enabled: boolean;
}

/**
 * Postal code mandatory configuration
 */
export interface PostalCodeMandatoryConfig {
  enabled: boolean;
}

/**
 * Quick add to cart configuration
 */
export interface QuickAddToCartConfig {
  enabled: boolean;
}

/**
 * Checkout configuration
 */
export interface CheckoutConfig {
  addToCartAlert: AddToCartAlertConfig;
  dynamicForm: DynamicFormConfig;
  emailOptional: EmailOptionalConfig;
  manual: ManualConfig;
  minBasket: MinBasketConfig;
  miniCart: MiniCartConfig;
  postalCodeMandatory: PostalCodeMandatoryConfig;
  quickAddToCart: QuickAddToCartConfig;
}

/**
 * Show product stock number configuration
 */
export interface ShowProductStockNumberConfig {
  enabled: boolean;
}

/**
 * Tajrobe configurations
 */
export interface TajrobeConfigurations {
  autoPublishAttachment: boolean;
  autoPublishCommentDetail: boolean;
  enabled: boolean;
}

/**
 * Tajrobe configuration
 */
export interface TajrobeConfig {
  configurations: TajrobeConfigurations;
}

/**
 * Wallet configurations
 */
export interface WalletConfigurations {
  enabled: boolean;
  useWithDiscount: boolean;
  walletMinAmount: number;
  walletMinStatus: boolean;
}

/**
 * Wallet configuration
 */
export interface WalletConfig {
  configurations: WalletConfigurations;
}

/**
 * Shop features (all feature flags)
 */
export interface ShopFeatures {
  addToCardAlert: FeatureFlag;
  advancedCardToCard: FeatureFlag;
  ayriaPaymentGateway: FeatureFlag;
  azkiPaymentGateway: FeatureFlag;
  bazarPaymentGateway: FeatureFlag;
  shopBlog: FeatureFlag;
  cardToCardPayment: FeatureFlag;
  checkoutDynamicForm: FeatureFlag;
  multiTypeRegister: FeatureFlag;
  digipayPaymentGateway: FeatureFlag;
  productFilters: FeatureFlag;
  ghestaPaymentGateway: FeatureFlag;
  megaFooter: FeatureFlag;
  mellatPaymentGateway: FeatureFlag;
  checkoutMinimumAmount: FeatureFlag;
  novapayPaymentGateway: FeatureFlag;
  ozonPaymentGateway: FeatureFlag;
  paymentInPlace: FeatureFlag;
  paypingPaymentGateway: FeatureFlag;
  pecPaymentGateway: FeatureFlag;
  sabinPaymentGateway: FeatureFlag;
  sadadPaymentGateway: FeatureFlag;
  shopSearch: FeatureFlag;
  sepPaymentGateway: FeatureFlag;
  shopVat: FeatureFlag;
  snapppayPaymentGateway: FeatureFlag;
  tajrobe: FeatureFlag;
  taraPaymentGateway: FeatureFlag;
  themeConfigSettings: FeatureFlag;
  tomanPaymentGateway: FeatureFlag;
  torobpayPaymentGateway: FeatureFlag;
  asanpardakhtPaymentGateway: FeatureFlag;
  vandarPaymentGateway: FeatureFlag;
  wallet: FeatureFlag;
  yourgatePaymentGateway: FeatureFlag;
  zarinpalPaymentGateway: FeatureFlag;
  zarinplusPaymentGateway: FeatureFlag;
  zibalPaymentGateway: FeatureFlag;
  zifyPaymentGateway: FeatureFlag;
  disableOrdering: FeatureFlag;
  premium: PremiumInfo;
  progressiveWebApp: FeatureFlag;
  hideCheckout: FeatureFlag;
  sazitoBrandingRemoval: FeatureFlag;
}

/**
 * Complete general shop information response
 */
export interface GeneralInfo {
  checkout: CheckoutConfig;
  domain: DomainInfo;
  enamad: EnamadInfo;
  features: ShopFeatures;
  shop: ShopInfo;
  google: GoogleInfo;
  logo: LogoInfo;
  social: SocialInfo;
  tajrobe: TajrobeConfig;
  wallet: WalletConfig;
}

/**
 * Raw API response before merging general and shop
 */
interface RawGeneralInfo extends Omit<GeneralInfo, 'shop'> {
  general: {
    name: string;
    description: string;
    city: City;
  };
  shop: {
    registerType: string;
    showProductStockNumber: ShowProductStockNumberConfig;
  };
}

export class GeneralAPI {
  constructor(private http: HttpClient) {}

  /**
   * Get general shop information including configuration and features
   * Response is automatically transformed to camelCase by HTTP client
   * The 'general' and 'shop' fields are merged into a single 'shop' field
   */
  async getInfo(options?: RequestOptions): Promise<SazitoResponse<GeneralInfo>> {
    const response = await this.http.get<RawGeneralInfo>(GENERAL_API, options);
    if (response.data) {
      return { data: transformGeneralInfoResponse(response.data) };
    }
    return response as SazitoResponse<GeneralInfo>;
  }

  /**
   * Get shop features only
   */
  async getFeatures(options?: RequestOptions): Promise<SazitoResponse<ShopFeatures>> {
    const response = await this.getInfo(options);
    return {
      data: response?.data?.features
    };
  }

  /**
   * Get checkout configuration only
   */
  async getCheckoutConfig(options?: RequestOptions): Promise<SazitoResponse<CheckoutConfig>> {
    const response = await this.getInfo(options);
    return {
      data: response?.data?.checkout
    };
  }

  /**
   * Get wallet configuration only
   */
  async getWalletConfig(options?: RequestOptions): Promise<SazitoResponse<WalletConfig>> {
    const response = await this.getInfo(options);
    return {
      data: response?.data?.wallet
    };
  }

  /**
   * Get Tajrobe configuration only
   */
  async getTajrobeConfig(options?: RequestOptions): Promise<SazitoResponse<TajrobeConfig>> {
    const response = await this.getInfo(options);
    return {
      data: response?.data?.tajrobe
    };
  }
}
