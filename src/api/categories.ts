/**
 * Categories API
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  ProductCategory,
  RequestOptions
} from '../types';
import { PRODUCT_CATEGORIES_API } from '../constants/endpoints';

export class CategoriesAPI {
  constructor(private http: HttpClient) {}

  /**
   * Get a single category by ID or slug
   */
  async get(
    idOrSlug: string | number,
    options?: RequestOptions
  ): Promise<SazitoResponse<ProductCategory>> {
    return this.http.get<ProductCategory>(
      `${PRODUCT_CATEGORIES_API}/${idOrSlug}`,
      options
    );
  }

  /**
   * List all categories
   */
  async list(
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<ProductCategory>>> {
    return this.http.get<PaginatedResponse<ProductCategory>>(
      PRODUCT_CATEGORIES_API,
      options
    );
  }
}
