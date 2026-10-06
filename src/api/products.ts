/**
 * Products API
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  ProductListItem,
  Product,
  ProductFilters,
  RequestOptions,
  SearchResponse,
  JsonObject,
  JsonValue
} from '../types';
import { PRODUCTS_API, PRODUCT_DETAILS_API, SEARCH_API } from '../constants/endpoints';
import { transformProductListResponse, transformSearchResponse, transformProductDetailsResponse } from '../utils/transformers';

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
  private transformFilters(filters?: ProductFilters): Record<string, JsonValue> {
    if (!filters) return {};

    const params: Record<string, JsonValue> = {};
    const filterArray: Array<{ name: string; value?: JsonValue }> = [];

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

    // Similar products
    if (filters.similarTo) {
      filterArray.push({
        name: 'similar_to',
        value: {
          entity_name: 'product',
          entity_id: filters.similarTo
        }
      });
    }

    if (filterArray.length > 0) {
      params['filters[]'] = JSON.stringify(filterArray);
    }

    // Pinned products
    if (filters.pinnedIds && filters.pinnedIds.length > 0) {
      params['pinned_ids'] = JSON.stringify(filters.pinnedIds);
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
    if (filters.pageSize) params.page_size = filters.pageSize;

    return params;
  }

  /**
   * Get a single product by slug or URL path
   * Uses the storefront product details API
   */
  async get(
    slugOrPath: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<Product>> {
    // The details API expects the slug, unlike entity routes' full pathname.
    const slug = slugOrPath.replace(/^\/product\//, '').split(/[/?#]/)[0];
    let urlPart = slug;
    try {
      urlPart = decodeURIComponent(slug);
    } catch {
      // Preserve malformed percent escapes rather than throwing from an API method.
    }

    const response = await this.http.get<JsonObject>(PRODUCT_DETAILS_API, {
      ...options,
      params: { url_part: urlPart }
    });

    if (response.data) {
      const product = transformProductDetailsResponse<Product>(response.data);
      if (product) return { data: product };
      return { error: { message: 'Product not found', type: 'api', status: 404 } };
    }

    if (response.error) {
      return { error: response.error };
    }

    return {
      error: {
        message: 'No data returned from product endpoint',
        type: 'api'
      }
    };
  }

  /**
   * List products with filters
   */
  async list(
    filters?: ProductFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<ProductListItem>>> {
    const params = this.transformFilters(filters);

    const response = await this.http.get<PaginatedResponse<ProductListItem>>(PRODUCTS_API, {
      ...options,
      params
    });

    if (response.data) {
      const transformed = transformProductListResponse<PaginatedResponse<ProductListItem>>(response.data);
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
    const params: Record<string, JsonValue> = {
      query,
      search_direction: 'center',
      page_size: filters?.pageSize || 20,
      page_number: filters?.page || 1
    };

    const response = await this.http.get<SearchResponse>(SEARCH_API, {
      ...options,
      params
    });

    if (response.data) {
      const transformed = transformSearchResponse<SearchResponse>(response.data);
      return { data: transformed };
    }

    return response;
  }
}
