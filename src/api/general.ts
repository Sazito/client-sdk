/**
 * General API (shop configuration and feature flags)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, RequestOptions, JsonObject, JsonValue } from '../types';
import { GENERAL_API } from '../constants/endpoints';
import { transformGeneralInfoResponse } from '../utils/transformers';

export interface Region {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region: Region;
}

export interface PremiumInfo {
  enabled: boolean;
  nextRenewal: string;
  subscriptionSubtype: string;
}

export interface GoogleAnalyticsCode {
  code: string;
  enabled: boolean;
}

export interface GoogleInfo {
  analyticsCode: GoogleAnalyticsCode;
  analyticsId: GoogleAnalyticsCode;
  tagManager: GoogleAnalyticsCode;
}

export interface LogoInfo {
  favicon: string;
  main: string;
}

export interface SocialInfo {
  facebook: string;
  instagram: string;
  phone1: string;
  phone2: string;
  telegram: string;
  twitter: string;
  whatsapp: string;
}

export interface DomainInfo {
  url: string;
}

export interface EnamadInfo {
  code: string;
}

export interface ShopInfo {
  name: string;
  description: string;
  city: City | null;
  domain: DomainInfo;
  logo: LogoInfo;
  social: SocialInfo;
}

export interface CheckoutConfig {
  addToCartAlert: boolean;
  dynamicForm: boolean;
  emailOptional: boolean;
  preventRedirect: boolean;
  minBasket: {
    enabled: boolean;
    minAmount: number;
  };
  miniCart: boolean;
  postalCodeMandatory: boolean;
  quickAddToCart: boolean;
}

export interface TajrobeConfig {
  enabled: boolean;
}

export interface WalletConfig {
  enabled: boolean;
  useWithDiscount: boolean;
  minAmount: number;
  minAmountRequired: boolean;
}

/**
 * Standardized feature shape:
 * - boolean feature switches as direct keys on the object
 * - premium details in `premium`
 */
export interface ShopFeatures {
  [featureName: string]: boolean | PremiumInfo | undefined;
  premium?: PremiumInfo;
}

export interface ScriptsInfo {
  enamad: EnamadInfo;
  google: GoogleInfo;
}

export interface SettingsInfo {
  checkout: CheckoutConfig;
  features: ShopFeatures;
  wallet: WalletConfig;
  tajrobe: TajrobeConfig;
  registerType: string;
  showProductStockNumber: boolean;
}

/**
 * Standardized General API response
 */
export interface GeneralInfo {
  shop: ShopInfo;
  settings: SettingsInfo;
  scripts: ScriptsInfo;
}

interface RawGeneralInfo {
  general?: {
    name?: string;
    description?: string;
    city?: City;
  };
  shop?: {
    registerType?: string;
    showProductStockNumber?: { enabled?: boolean } | boolean;
  };
  checkout?: JsonValue;
  features?: JsonObject;
  wallet?: JsonValue;
  tajrobe?: JsonValue;
  domain?: DomainInfo;
  enamad?: EnamadInfo;
  google?: GoogleInfo;
  logo?: LogoInfo;
  social?: SocialInfo;
}

export class GeneralAPI {
  constructor(private http: HttpClient) {}

  /**
   * Get normalized shop information including config and features.
   */
  async getInfo(options?: RequestOptions): Promise<SazitoResponse<GeneralInfo>> {
    const response = await this.http.get<RawGeneralInfo>(GENERAL_API, options);

    if (response.data) {
      return { data: transformGeneralInfoResponse<GeneralInfo>(response.data) };
    }

    if (response.error) {
      return { error: response.error };
    }

    return {
      error: {
        type: 'api',
        message: 'No data returned from general info endpoint.'
      }
    };
  }

  /**
   * Get standardized shop feature flags only.
   */
  async getFeatures(options?: RequestOptions): Promise<SazitoResponse<ShopFeatures>> {
    const response = await this.getInfo(options);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data?.settings?.features };
  }

  /**
   * Get standardized checkout config only.
   */
  async getCheckoutConfig(options?: RequestOptions): Promise<SazitoResponse<CheckoutConfig>> {
    const response = await this.getInfo(options);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data?.settings?.checkout };
  }

  /**
   * Get standardized wallet config only.
   */
  async getWalletConfig(options?: RequestOptions): Promise<SazitoResponse<WalletConfig>> {
    const response = await this.getInfo(options);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data?.settings?.wallet };
  }

  /**
   * Get standardized Tajrobe config only.
   */
  async getTajrobeConfig(options?: RequestOptions): Promise<SazitoResponse<TajrobeConfig>> {
    const response = await this.getInfo(options);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data?.settings?.tajrobe };
  }
}
