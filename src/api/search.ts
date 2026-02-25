/**
 * Search API
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  SearchResponse,
  RequestOptions,
  JsonValue
} from '../types';
import { SEARCH_API } from '../constants/endpoints';
import { transformSearchResponse } from '../utils/transformers';

export interface SearchFilters {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

export class SearchAPI {
  constructor(private http: HttpClient) {}

  private transformFilters(filters?: SearchFilters): Record<string, JsonValue> {
    if (!filters) return {};

    const params: Record<string, JsonValue> = {};

    if (filters.page !== undefined) params.page_number = filters.page;
    if (filters.pageSize !== undefined) params.page_size = filters.pageSize;
    if (filters.categoryId !== undefined) params.category_id = filters.categoryId;
    if (filters.minPrice !== undefined) params.min_price = filters.minPrice;
    if (filters.maxPrice !== undefined) params.max_price = filters.maxPrice;

    return params;
  }

  /**
   * Query across multiple entity types (products, blog pages, CMS pages, categories)
   */
  async query(
    term: string,
    filters?: SearchFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<SearchResponse>> {
    const transformedFilters = this.transformFilters(filters);

    const response = await this.http.get<SearchResponse>(SEARCH_API, {
      ...options,
      params: {
        ...transformedFilters,
        query: term,
        page_number: transformedFilters.page_number ?? 1,
        page_size: transformedFilters.page_size ?? 20,
        search_direction: 'center'
      }
    });

    // Transform and clean the response
    if (response.data) {
      const transformed = transformSearchResponse<SearchResponse>(response.data);
      return { data: transformed };
    }

    return response;
  }
}
