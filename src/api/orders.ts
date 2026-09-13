/**
 * Orders API
 * Authenticated order listing and public detail retrieval using ID and identifier
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
      params
    });

    return response.data
      ? { data: transformOrdersListResponse<OrdersListResponse>(response.data) }
      : response;
  }

  /**
   * Get a public order by ID and its secret order identifier.
   * The backend must validate that the identifier belongs to this order.
   * Sends `GET /api/v1/orders/{id}?order_identifier={orderIdentifier}`.
   */
  async get(
    orderId: OrderPublicId,
    orderIdentifier: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<Order>> {
    const id = typeof orderId === 'string' ? orderId.trim() : orderId;
    if (!((typeof id === 'string' && id.length > 0) ||
      (typeof id === 'number' && Number.isSafeInteger(id) && id >= 0))) {
      return { error: { type: 'validation', message: 'Order ID is required and must be valid.' } };
    }

    const identifier = typeof orderIdentifier === 'string' ? orderIdentifier.trim() : '';
    if (!identifier) {
      return { error: { type: 'validation', message: 'Order identifier is required.' } };
    }

    const response = await this.http.get<Order>(`${ORDERS_API}/${encodeURIComponent(String(id))}`, {
      ...options,
      params: { orderIdentifier: identifier }
    });
    return response.data
      ? { data: transformOrderResponse<Order>(response.data) }
      : response;
  }
}
