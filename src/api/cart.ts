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
import { transformCartResponse } from '../utils/transformers';

export interface AddItemAttributesInput {
  formAttributes?: Record<string, any>;
  schedulerBookingAttributes?: CreateCartInput['schedulerBookingAttributes'];
}

export class CartAPI {
  constructor(
    private http: HttpClient,
    private credentials: CredentialsManager
  ) {}

  private persistCartCredentials(cart: Cart): void {
    this.credentials.setCartCredentials({
      id: cart.id,
      identifier: cart.identifier
    });
  }

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

    const response = await this.http.get<any>(`${CARTS_API}/${cartCreds.id}`, {
      ...options,
      params: { identifier: cartCreds.identifier }
    });

    if (response.data) {
      return { data: transformCartResponse(response.data) as Cart };
    }

    if (response.error) {
      this.clearCart();
    }

    return response;
  }

  /**
   * Create a new cart
   */
  async create(
    input: CreateCartInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<Cart>> {
    const response = await this.http.post<any>(CARTS_API, input, options);

    if (!response.data) {
      return response;
    }

    const cart = transformCartResponse(response.data) as Cart;

    // Store cart credentials for guest users
    this.persistCartCredentials(cart);

    return { data: cart };
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
    return this.addItemWithAttributes(
      variantId,
      count,
      { formAttributes },
      options
    );
  }

  /**
   * Add item to cart with standardized attributes payload.
   */
  async addItemWithAttributes(
    variantId: number,
    count: number,
    attributes?: AddItemAttributesInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<Cart>> {
    const cartCreds = this.credentials.getCartCredentials();

    if (!cartCreds) {
      // Create new cart if none exists
      return this.create({
        variants: [{
          id: variantId,
          count,
          formAttributes: attributes?.formAttributes
        }],
        schedulerBookingAttributes: attributes?.schedulerBookingAttributes
      }, options);
    }

    const response = await this.http.post<any>(
      `${CARTS_API}/${cartCreds.id}/add_products_to_cart`,
      {
        identifier: cartCreds.identifier,
        variants: [{
          id: variantId,
          count
        }],
        formAttributes: attributes?.formAttributes,
        schedulerBookingAttributes: attributes?.schedulerBookingAttributes
      },
      options
    );

    if (response.data) {
      const cart = transformCartResponse(response.data) as Cart;
      this.persistCartCredentials(cart);
      return { data: cart };
    }

    if (response.error?.status === 422) {
      this.clearCart();
    }

    return response;
  }

  /**
   * Update cart item quantity
   */
  async updateItem(
    cartProductId: number,
    variantId: number,
    count: number,
    formAttributes?: Record<string, any>,
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

    const response = await this.http.post<any>(
      `${CARTS_API}/${cartCreds.id}/update_products_in_cart`,
      {
        identifier: cartCreds.identifier,
        cartProductId,
        variants: [{
          id: variantId,
          count
        }],
        formAttributes
      },
      options
    );

    if (response.data) {
      const cart = transformCartResponse(response.data) as Cart;
      this.persistCartCredentials(cart);
      return { data: cart };
    }

    return response;
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

    const response = await this.http.post<any>(
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

    if (response.data) {
      const cart = transformCartResponse(response.data) as Cart;
      this.persistCartCredentials(cart);
      return { data: cart };
    }

    return response;
  }

  /**
   * Clear current cart credentials
   */
  clearCart(): void {
    this.credentials.clearCartCredentials();
  }
}
