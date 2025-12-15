/**
 * Search API
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  Product,
  RequestOptions
} from '../types';
import { SEARCH_API } from '../constants/endpoints';

export interface SearchFilters {
  q: string;           // Search query
  page?: number;
  per_page?: number;
  category_id?: number;
  min_price?: number;
  max_price?: number;
}

export class SearchAPI {
  constructor(private http: HttpClient) {}

  /**
   * Search products
   */
  async search(
    query: string,
    filters?: Omit<SearchFilters, 'q'>,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<Product>>> {
    return this.http.get<PaginatedResponse<Product>>(SEARCH_API, {
      ...options,
      params: {
        q: query,
        ...filters
      }
    });
  }
}
