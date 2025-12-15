/**
 * Products API
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  Product,
  ProductFilters,
  RequestOptions,
  SearchResponse
} from '../types';
import { PRODUCTS_API, SEARCH_API, ENTITY_ROUTE_API } from '../constants/endpoints';
import { transformProductListResponse, transformSearchResponse } from '../utils/transformers';

export class ProductsAPI {
  constructor(private http: HttpClient) {}

  /**
   * Map SDK sort values to API sort values
   */
  private mapSortToApi(sort?: string): { sort: string; sortOrder?: string } | null {
    if (!sort) return null;

    const sortMap: Record<string, { sort: string; sortOrder?: string }> = {
      'newest': { sort: 'date' },
      'best-selling': { sort: 'sold' },
      'availability': { sort: 'stock_status' },
      'discount': { sort: 'raw_price' },
      '!price': { sort: 'price', sortOrder: 'asc' },
      'price': { sort: 'price' }
    };

    return sortMap[sort] || null;
  }

  /**
   * Transform filters to API request params
   */
  private transformFilters(filters?: ProductFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};
    const filterArray: Array<{ name: string; value?: any }> = [];

    // Build filters array
    if (filters.categories) {
      const categories = Array.isArray(filters.categories)
        ? filters.categories
        : [filters.categories];

      if (categories.length > 0) {
        filterArray.push({ name: 'product_categories', value: categories.join(',') });
      }
    }

    // availableOnly: false means show only out-of-stock items
    if (filters.availableOnly === false) {
      filterArray.push({ name: 'in_stock' });
    }

    // discountedOnly: true means show only products with discounts
    if (filters.discountedOnly) {
      filterArray.push({ name: 'has_raw_price', value: true });
    }

    if (filterArray.length > 0) {
      params['filters[]'] = JSON.stringify(filterArray);
    }

    // Handle sort mapping
    if (filters.sort) {
      const mapped = this.mapSortToApi(filters.sort);
      if (mapped) {
        params.sort = mapped.sort;
        if (mapped.sortOrder) {
          params.sort_order = mapped.sortOrder;
        }
      }
    }

    // Price range
    if (filters.priceMin !== undefined) params.min_price = filters.priceMin;
    if (filters.priceMax !== undefined) params.max_price = filters.priceMax;

    // Pagination
    if (filters.page) params.page = filters.page;
    if (filters.pageSize) params.pageSize = filters.pageSize;

    return params;
  }

  /**
   * Get a single product by slug or URL path
   * Uses the entity route API to resolve the product
   */
  async get(
    slugOrPath: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<Product>> {
    // Ensure the path starts with /product/
    const urlPart = slugOrPath.startsWith('/product/') 
      ? slugOrPath 
      : `/product/${slugOrPath}`;
    
    const response = await this.http.get<any>(ENTITY_ROUTE_API, {
      ...options,
      params: { url_part: urlPart }
    });

    // Extract product from entity route response
    // After transformation: route.entityType, route.entity
    if (response.data?.route) {
      const route = response.data.route;
      if (route.entity && route.entityType === 'product') {
        return { data: route.entity };
      }
    }

    if (response.error) {
      return response;
    }

    return {
      error: {
        message: 'Product not found or invalid entity type',
        type: 'api',
        status: 404
      }
    };
  }

  /**
   * List products with filters
   */
  async list(
    filters?: ProductFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<Product>>> {
    const params = this.transformFilters(filters);

    const response = await this.http.get<any>(PRODUCTS_API, {
      ...options,
      params
    });

    if (response.data) {
      const transformed = transformProductListResponse(response.data);
      return { data: transformed };
    }

    return response;
  }

  /**
   * Search across all entity types (products, blog pages, CMS pages, product categories)
   */
  async search(
    query: string,
    filters?: ProductFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<SearchResponse>> {
    // Search API uses different parameter names
    const params: Record<string, any> = {
      query,
      search_direction: 'center',
      page_size: filters?.pageSize || 20,
      page_number: filters?.page || 1
    };

    const response = await this.http.get<any>(SEARCH_API, {
      ...options,
      params
    });

    if (response.data) {
      const transformed = transformSearchResponse(response.data);
      return { data: transformed };
    }

    return response;
  }
}
