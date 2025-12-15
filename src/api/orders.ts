/**
 * Orders API
 * Requires authentication
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  Order,
  OrderFilters,
  RequestOptions
} from '../types';
import { ORDERS_API } from '../constants/endpoints';

export class OrdersAPI {
  constructor(private http: HttpClient) {}

  /**
   * List orders (requires authentication)
   */
  async list(
    filters?: OrderFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<Order>>> {
    return this.http.get<PaginatedResponse<Order>>(ORDERS_API, {
      ...options,
      params: filters
    });
  }

  /**
   * Get single order by ID (requires authentication)
   */
  async get(
    orderId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Order>> {
    return this.http.get<Order>(`${ORDERS_API}/${orderId}`, options);
  }
}
