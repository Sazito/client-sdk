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
   * Search across multiple entity types (products, blog pages, CMS pages, categories)
   */
  async search(
    query: string,
    filters?: Omit<SearchFilters, 'q'>,
    options?: RequestOptions
  ): Promise<SazitoResponse<SearchResponse>> {
    const response = await this.http.get<any>(SEARCH_API, {
      ...options,
      params: {
        q: query,
        ...filters
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
