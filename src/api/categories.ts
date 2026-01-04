/**
 * Categories API
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  ProductCategory,
  RequestOptions
} from '../types';
import { PRODUCT_CATEGORIES_API } from '../constants/endpoints';
import { transformCategoryListResponse, transformCategoryResponse } from '../utils/transformers';

/**
 * Category tree node structure
 */
export interface CategoryTreeNode {
  id: number;
  entityType: 'product_category';
  entityId: number;
  entity: ProductCategory;
  details: any;
  children: CategoryTreeNode[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Category tree structure
 */
export interface CategoryTree {
  id: number;
  treeType: 'product_categories';
  treeStructure: {
    nodes: CategoryTreeNode[];
  };
}

/**
 * Category list response with hierarchical tree
 */
export interface CategoryListResponse {
  categories: ProductCategory[];
  tree: CategoryTree;
}

/**
 * Category list filters
 */
export interface CategoryFilters {
  // Pagination
  page?: number;
  pageSize?: number;
}

export class CategoriesAPI {
  constructor(private http: HttpClient) {}

  /**
   * Get a single category by ID or slug
   */
  async get(
    idOrSlug: string | number,
    options?: RequestOptions
  ): Promise<SazitoResponse<ProductCategory>> {
    const response = await this.http.get<any>(
      `${PRODUCT_CATEGORIES_API}/${idOrSlug}`,
      options
    );

    if (response.data) {
      const transformed = transformCategoryResponse(response.data);
      return { data: transformed };
    }

    return response;
  }

  /**
   * List all categories with hierarchical tree structure
   * @param filters Optional pagination filters
   * @param options Additional request options
   */
  async list(
    filters?: CategoryFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<CategoryListResponse>> {
    const params: any = {};

    if (filters?.page !== undefined) {
      params.page_number = filters.page;
    }
    if (filters?.pageSize !== undefined) {
      params.page_size = filters.pageSize;
    }

    const response = await this.http.get<any>(
      PRODUCT_CATEGORIES_API,
      {
        ...options,
        params
      }
    );

    if (response.data) {
      const transformed = transformCategoryListResponse(response.data);
      return { data: transformed };
    }

    return response;
  }
}
