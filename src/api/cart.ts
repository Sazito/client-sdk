/**
 * Cart API
 * Supports both authenticated and guest users via credentials
 */

import { HttpClient } from '../core/http-client';
import { CredentialsManager } from '../utils/credentials-manager';
import {
  SazitoResponse,
  Cart,
  CreateCartInput,
  RequestOptions
} from '../types';
import { CARTS_API } from '../constants/endpoints';

export class CartAPI {
  constructor(
    private http: HttpClient,
    private credentials: CredentialsManager
  ) {}

  /**
   * Get current cart
   */
  async get(options?: RequestOptions): Promise<SazitoResponse<Cart>> {
    const cartCreds = this.credentials.getCartCredentials();

    if (!cartCreds) {
      return {
        error: {
          message: 'No cart found. Please create a cart first.',
          type: 'validation'
        }
      };
    }

    return this.http.get<Cart>(`${CARTS_API}/${cartCreds.id}`, {
      ...options,
      params: { identifier: cartCreds.identifier }
    });
  }

  /**
   * Create a new cart
   */
  async create(
    input: CreateCartInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<Cart>> {
    const response = await this.http.post<Cart>(CARTS_API, input, options);

    // Store cart credentials for guest users
    if (response.data) {
      this.credentials.setCartCredentials({
        id: response.data.id,
        identifier: response.data.identifier
      });
    }

    return response;
  }

  /**
   * Add item to cart
   */
  async addItem(
    variantId: number,
    count: number,
    formAttributes?: Record<string, any>,
    options?: RequestOptions
  ): Promise<SazitoResponse<Cart>> {
    const cartCreds = this.credentials.getCartCredentials();

    if (!cartCreds) {
      // Create new cart if none exists
      return this.create({
        variants: [{
          id: variantId,
          count,
          formAttributes
        }]
      }, options);
    }

    const response = await this.http.post<Cart>(
      `${CARTS_API}/${cartCreds.id}/add_products_to_cart`,
      {
        identifier: cartCreds.identifier,
        variants: [{
          id: variantId,
          count
        }],
        formAttributes
      },
      options
    );

    return response;
  }

  /**
   * Update cart item quantity
   */
  async updateItem(
    cartProductId: number,
    count: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Cart>> {
    const cartCreds = this.credentials.getCartCredentials();

    if (!cartCreds) {
      return {
        error: {
          message: 'No cart found',
          type: 'validation'
        }
      };
    }

    return this.http.post<Cart>(
      `${CARTS_API}/${cartCreds.id}/update_products_in_cart`,
      {
        identifier: cartCreds.identifier,
        cartProductId,
        variants: [{
          id: cartProductId,
          count
        }]
      },
      options
    );
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    cartProductId: number,
    variantId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Cart>> {
    const cartCreds = this.credentials.getCartCredentials();

    if (!cartCreds) {
      return {
        error: {
          message: 'No cart found',
          type: 'validation'
        }
      };
    }

    return this.http.post<Cart>(
      `${CARTS_API}/${cartCreds.id}/remove_products_from_cart`,
      {
        identifier: cartCreds.identifier,
        cartProductId,
        variants: [{
          id: variantId
        }]
      },
      options
    );
  }

  /**
   * Clear current cart credentials
   */
  clearCart(): void {
    this.credentials.clearCartCredentials();
  }
}
