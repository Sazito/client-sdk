/**
 * CMS API (Content Management - Pages, Blogs, etc.)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  RequestOptions
} from '../types';
import { CmsPage, CMSPageType } from '../types/search';
import { CMS_PAGES_API, ENTITY_ROUTE_API } from '../constants/endpoints';
import {
  transformCMSListResponse,
  transformCMSFilters,
  transformEntityRouteResponse
} from '../utils/transformers';

/**
 * CMS Page type (re-exported from search types for convenience)
 * Both regular pages and blog posts use this structure
 */
export type CMSPage = CmsPage;

/**
 * Re-export CMSPageType for convenience
 */
export type { CMSPageType };

/**
 * Filters for CMS pages list
 * Backend uses: page_number, page_size, filters[]
 */
export interface CMSFilters {
  page?: number;
  pageSize?: number;
  cmsPageTypes?: CMSPageType | CMSPageType[];  // Filter by page type: 'normal' or 'blog'
}

export class CMSAPI {
  constructor(private http: HttpClient) {}

  /**
   * Get CMS page by URL path
   * Uses entity routes API (recommended approach)
   * @param urlPath - Page URL path (e.g., '/about-us')
   * @param options - Request options
   */
  async getPage(
    urlPath: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<CMSPage>> {
    const response = await this.http.get<any>(
      ENTITY_ROUTE_API,
      {
        ...options,
        params: { url_part: urlPath }
      }
    );

    // Transform entity route response and extract the entity
    const transformed = transformEntityRouteResponse(response.data);

    // Verify it's a CMS page (not blog, product, etc.)
    if (transformed.entityType !== 'cms_page' || transformed.entity?.cmsPageType === 'blog') {
      throw new Error(`Expected CMS page at ${urlPath}, but got ${transformed.entityType}`);
    }

    return {
      ...response,
      data: transformed.entity
    };
  }

  /**
   * List CMS pages (excludes blog posts)
   * @param filters - Filter options (will automatically exclude blog type)
   * @param options - Request options
   */
  async listPages(
    filters?: CMSFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<CMSPage>>> {
    // Ensure we're only getting normal CMS pages, not blog posts
    const cmsFilters = {
      ...filters,
      cmsPageTypes: 'normal' as CMSPageType
    };

    const transformedParams = transformCMSFilters(cmsFilters);

    const response = await this.http.get<PaginatedResponse<CMSPage>>(
      CMS_PAGES_API,
      {
        ...options,
        params: transformedParams
      }
    );

    return {
      ...response,
      data: transformCMSListResponse(response.data)
    };
  }

  /**
   * Get blog post by URL path
   * Uses entity routes API (recommended approach)
   * @param urlPath - Blog post URL path (e.g., '/blog/my-post')
   * @param options - Request options
   */
  async getBlogPost(
    urlPath: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<CMSPage>> {
    const response = await this.http.get<any>(
      ENTITY_ROUTE_API,
      {
        ...options,
        params: { url_part: urlPath }
      }
    );

    // Transform entity route response and extract the entity
    const transformed = transformEntityRouteResponse(response.data);

    // Verify it's a blog post
    if (transformed.entityType !== 'cms_page' || transformed.entity?.cmsPageType !== 'blog') {
      throw new Error(`Expected blog post at ${urlPath}, but got ${transformed.entityType}`);
    }

    return {
      ...response,
      data: transformed.entity
    };
  }

  /**
   * List blog posts
   * @param filters - Filter options (will automatically filter for blog type)
   * @param options - Request options
   */
  async listBlogPosts(
    filters?: CMSFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<CMSPage>>> {
    // Ensure we're only getting blog posts, not normal CMS pages
    const blogFilters = {
      ...filters,
      cmsPageTypes: 'blog' as CMSPageType
    };

    const transformedParams = transformCMSFilters(blogFilters);

    const response = await this.http.get<PaginatedResponse<CMSPage>>(
      CMS_PAGES_API,
      {
        ...options,
        params: transformedParams
      }
    );

    return {
      ...response,
      data: transformCMSListResponse(response.data)
    };
  }

  /**
   * List all CMS content (both pages and blog posts)
   * @param filters - Filter options
   * @param options - Request options
   */
  async listAll(
    filters?: CMSFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<CMSPage>>> {
    const transformedParams = transformCMSFilters(filters);

    const response = await this.http.get<PaginatedResponse<CMSPage>>(
      CMS_PAGES_API,
      {
        ...options,
        params: transformedParams
      }
    );

    return {
      ...response,
      data: transformCMSListResponse(response.data)
    };
  }
}
