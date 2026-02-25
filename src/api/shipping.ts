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
import { transformShippingAddressResponse, transformShippingMethodsResponse } from '../utils/transformers';

interface ShippingMethodsResponse {
  shippingMethods?: ShippingMethod[];
}

export class ShippingAPI {
  constructor(
    private http: HttpClient,
    private credentials: CredentialsManager
  ) {}

  private sanitizeAddressInput(address: ShippingAddressInput): ShippingAddressInput {
    // Runtime safety: drop nested "user" when callers pass invoice shippingAddress objects.
    const sanitized = { ...(address as ShippingAddressInput & { user?: unknown }) };
    delete sanitized.user;
    return sanitized;
  }

  /**
   * Create shipping address
   */
  async createAddress(
    address: ShippingAddressInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<ShippingAddress>> {
    const sanitizedAddress = this.sanitizeAddressInput(address);
    const response = await this.http.post<ShippingAddress>(
      SHIPPING_ADDRESSES_API,
      { shipping_address: sanitizedAddress },
      options
    );

    // Store shipping address credentials
    if (response.data) {
      const normalizedAddress = transformShippingAddressResponse(response.data) as ShippingAddress | undefined;
      if (!normalizedAddress) {
        return response;
      }

      this.credentials.setShippingCredentials({
        id: normalizedAddress.id,
        identifier: normalizedAddress.identifier
      });
      return { data: normalizedAddress };
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

    const sanitizedAddress = this.sanitizeAddressInput(address);
    const response = await this.http.post<ShippingAddress>(
      SHIPPING_ADDRESSES_API,
      {
        identifier: shippingCreds.identifier,
        shipping_address: sanitizedAddress
      },
      options
    );

    // Update credentials
    if (response.data) {
      const normalizedAddress = transformShippingAddressResponse(response.data) as ShippingAddress | undefined;
      if (!normalizedAddress) {
        return response;
      }

      this.credentials.setShippingCredentials({
        id: normalizedAddress.id,
        identifier: normalizedAddress.identifier
      });
      return { data: normalizedAddress };
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

    const response = await this.http.get<ShippingAddress>(
      `${SHIPPING_ADDRESSES_API}/${shippingCreds.id}`,
      {
        ...options,
        params: { identifier: shippingCreds.identifier }
      }
    );

    if (response.data) {
      const normalizedAddress = transformShippingAddressResponse(response.data) as ShippingAddress | undefined;
      if (!normalizedAddress) {
        return response;
      }

      return { data: normalizedAddress };
    }

    return response;
  }

  /**
   * Get list of enabled shipping methods
   */
  async getMethods(options?: RequestOptions): Promise<SazitoResponse<ShippingMethod[]>> {
    const response = await this.http.get<ShippingMethodsResponse | ShippingMethod[]>(SHIPPING_METHODS_API, options);

    if (response.data) {
      return {
        data: transformShippingMethodsResponse<ShippingMethod[]>(response.data) as ShippingMethod[]
      };
    }

    if (response.error) {
      return { error: response.error };
    }

    return { data: [] };
  }

  /**
   * Clear shipping address credentials
   */
  clearAddress(): void {
    this.credentials.clearShippingCredentials();
  }
}
