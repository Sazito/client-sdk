/**
 * Shipping API (Addresses and Methods)
 */

import { HttpClient } from '../core/http-client';
import { CredentialsManager } from '../utils/credentials-manager';
import {
  SazitoResponse,
  ShippingAddress,
  ShippingAddressInput,
  ShippingMethod,
  RequestOptions
} from '../types';
import { SHIPPING_ADDRESSES_API, SHIPPING_METHODS_API } from '../constants/endpoints';

export class ShippingAPI {
  constructor(
    private http: HttpClient,
    private credentials: CredentialsManager
  ) {}

  /**
   * Create shipping address
   */
  async createAddress(
    address: ShippingAddressInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<ShippingAddress>> {
    const response = await this.http.post<ShippingAddress>(
      SHIPPING_ADDRESSES_API,
      { shipping_address: address },
      options
    );

    // Store shipping address credentials
    if (response.data) {
      this.credentials.setShippingCredentials({
        id: response.data.id,
        identifier: response.data.identifier
      });
    }

    return response;
  }

  /**
   * Update shipping address
   */
  async updateAddress(
    address: ShippingAddressInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<ShippingAddress>> {
    const shippingCreds = this.credentials.getShippingCredentials();

    if (!shippingCreds) {
      // Create new address if none exists
      return this.createAddress(address, options);
    }

    const response = await this.http.post<ShippingAddress>(
      SHIPPING_ADDRESSES_API,
      {
        identifier: shippingCreds.identifier,
        shipping_address: address
      },
      options
    );

    // Update credentials
    if (response.data) {
      this.credentials.setShippingCredentials({
        id: response.data.id,
        identifier: response.data.identifier
      });
    }

    return response;
  }

  /**
   * Get shipping address
   */
  async getAddress(options?: RequestOptions): Promise<SazitoResponse<ShippingAddress>> {
    const shippingCreds = this.credentials.getShippingCredentials();

    if (!shippingCreds) {
      return {
        error: {
          message: 'No shipping address found',
          type: 'validation'
        }
      };
    }

    return this.http.get<ShippingAddress>(
      `${SHIPPING_ADDRESSES_API}/${shippingCreds.id}`,
      {
        ...options,
        params: { identifier: shippingCreds.identifier }
      }
    );
  }

  /**
   * Get list of enabled shipping methods
   */
  async getMethods(options?: RequestOptions): Promise<SazitoResponse<ShippingMethod[]>> {
    return this.http.post<ShippingMethod[]>(
      `${SHIPPING_METHODS_API}/list`,
      {},
      options
    );
  }

  /**
   * Clear shipping address credentials
   */
  clearAddress(): void {
    this.credentials.clearShippingCredentials();
  }
}
