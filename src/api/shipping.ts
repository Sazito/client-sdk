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

interface ShippingAddressesResponse {
  shippingAddresses?: unknown;
  addresses?: unknown;
  items?: unknown;
  data?: unknown;
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

  /* Address responses vary between bare objects and nested envelopes such as
     `result.data.shipping_address`. Peel every known wrapper before normalizing. */
  private unwrapAddressPayload(data: unknown): unknown {
    let current = data;
    const visited = new Set<unknown>();
    while (current && typeof current === 'object' && !Array.isArray(current)) {
      if (visited.has(current)) {
        break;
      }
      visited.add(current);
      const record = current as Record<string, unknown>;
      const nested = record.shippingAddress ?? record.shipping_address ?? record.data;
      if (nested === undefined) {
        break;
      }
      current = nested;
    }
    return current;
  }

  private extractAddressList(data: unknown): unknown[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (!data || typeof data !== 'object') {
      return [];
    }

    const record = data as ShippingAddressesResponse;
    const candidates = [
      record.shippingAddresses,
      record.addresses,
      record.items,
      record.data
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
    return [];
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
      const normalizedAddress = transformShippingAddressResponse(
        this.unwrapAddressPayload(response.data) as never
      ) as ShippingAddress | undefined;
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
   * Update the address referenced by the currently stored credentials.
   * @deprecated Do not use during checkout. Existing invoices can reference
   * this row, so mutation can rewrite address data shown on previous orders.
   * Create a new address snapshot with createAddress instead.
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
      const normalizedAddress = transformShippingAddressResponse(
        this.unwrapAddressPayload(response.data) as never
      ) as ShippingAddress | undefined;
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
   * Get the authenticated user's shipping addresses, newest first.
   * This endpoint is intentionally not cached: checkout must see an address
   * created by the user's most recent order immediately.
   */
  async listAddresses(options?: RequestOptions): Promise<SazitoResponse<ShippingAddress[]>> {
    const response = await this.http.get<unknown>(SHIPPING_ADDRESSES_API, {
      ...options,
      cache: options?.cache ?? false
    });

    if (response.error) {
      return { error: response.error };
    }

    const addresses = this.extractAddressList(response.data)
      .map((item) =>
        transformShippingAddressResponse(
          this.unwrapAddressPayload(item) as never
        ) as ShippingAddress | undefined
      )
      .filter((address): address is ShippingAddress =>
        // V2 lookups are identifier-driven and valid responses can have id=0.
        Boolean(address?.identifier)
      )
      .sort((left, right) => right.id - left.id);

    return { data: addresses };
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
      const normalizedAddress = transformShippingAddressResponse(
        this.unwrapAddressPayload(response.data) as never
      ) as ShippingAddress | undefined;
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
