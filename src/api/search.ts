/**
 * Search API
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  SearchResponse,
  RequestOptions
} from '../types';
import { SEARCH_API } from '../constants/endpoints';
import { transformSearchResponse } from '../utils/transformers';

export interface SearchFilters {
  // SDK-friendly filters
  page?: number;
  pageSize?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;

  // Backward-compatible raw API keys
  page_size?: number;
  category_id?: number;
  min_price?: number;
  max_price?: number;
}

export class SearchAPI {
  constructor(private http: HttpClient) {}

  private transformFilters(filters?: SearchFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.page !== undefined) {
      params.page = filters.page;
    }

    const pageSize = filters.pageSize ?? filters.page_size;
    if (pageSize !== undefined) {
      params.page_size = pageSize;
    }

    const categoryId = filters.categoryId ?? filters.category_id;
    if (categoryId !== undefined) {
      params.category_id = categoryId;
    }

    const minPrice = filters.minPrice ?? filters.min_price;
    if (minPrice !== undefined) {
      params.min_price = minPrice;
    }

    const maxPrice = filters.maxPrice ?? filters.max_price;
    if (maxPrice !== undefined) {
      params.max_price = maxPrice;
    }

    return params;
  }

  /**
   * Search across multiple entity types (products, blog pages, CMS pages, categories)
   */
  async search(
    query: string,
    filters?: SearchFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<SearchResponse>> {
    const response = await this.http.get<any>(SEARCH_API, {
      ...options,
      params: {
        q: query,
        ...this.transformFilters(filters)
      }
    });

    // Transform and clean the response
    if (response.data) {
      const transformed = transformSearchResponse(response.data);
      return { data: transformed };
    }

    return response;
  }
}
