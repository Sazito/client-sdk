/**
 * Orders API
 * Requires authentication
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  Order,
  OrderPublicId,
  OrdersListResponse,
  OrderFilters,
  RequestOptions
} from '../types';
import { ORDERS_API } from '../constants/endpoints';
import { transformOrderResponse, transformOrdersListResponse } from '../utils/transformers';

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
      pageNumber: filters?.pageNumber ?? 1,
      pageSize: filters?.pageSize ?? 20
    };

    if (filters?.filters && filters.filters.length > 0) {
      params.filters = JSON.stringify(filters.filters);
    }

    const response = await this.http.get<OrdersListResponse>(ORDERS_API, {
      ...options,
      skipTransform: true,
      params
    });

    return response.data
      ? { data: transformOrdersListResponse<OrdersListResponse>(response.data) }
      : response;
  }

  /**
   * Get single order by ID (requires authentication)
   */
  async get(
    orderId: OrderPublicId,
    options?: RequestOptions
  ): Promise<SazitoResponse<Order>> {
    const response = await this.http.get<Order>(`${ORDERS_API}/${orderId}`, {
      ...options,
      skipTransform: true
    });
    return response.data
      ? { data: transformOrderResponse<Order>(response.data) }
      : response;
  }
}
