/**
 * Orders API
 * Requires authentication
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  Order,
  OrdersListResponse,
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
  ): Promise<SazitoResponse<OrdersListResponse>> {
    const params: Record<string, any> = {
      page_number: filters?.pageNumber ?? 1,
      page_size: filters?.pageSize ?? 100
    };

    if (filters?.filters && filters.filters.length > 0) {
      params.filters = JSON.stringify(filters.filters);
    }

    return this.http.get<OrdersListResponse>(ORDERS_API, {
      ...options,
      params
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
