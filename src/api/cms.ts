/**
 * CMS API (Content Management - Pages, Blogs, etc.)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  RequestOptions
} from '../types';
import { CMS_PAGES_API, CMS_BLOG_API } from '../constants/endpoints';

export interface CMSPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: {
    url: string;
  };
  author?: {
    id: number;
    name: string;
  };
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CMSFilters {
  page?: number;
  per_page?: number;
  published?: boolean;
}

export class CMSAPI {
  constructor(private http: HttpClient) {}

  /**
   * Get CMS page by ID or slug
   */
  async getPage(
    idOrSlug: string | number,
    options?: RequestOptions
  ): Promise<SazitoResponse<CMSPage>> {
    return this.http.get<CMSPage>(`${CMS_PAGES_API}/${idOrSlug}`, options);
  }

  /**
   * List CMS pages
   */
  async listPages(
    filters?: CMSFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<CMSPage>>> {
    return this.http.get<PaginatedResponse<CMSPage>>(CMS_PAGES_API, {
      ...options,
      params: filters
    });
  }

  /**
   * Get blog post by ID or slug
   */
  async getBlogPost(
    idOrSlug: string | number,
    options?: RequestOptions
  ): Promise<SazitoResponse<BlogPost>> {
    return this.http.get<BlogPost>(`${CMS_BLOG_API}/${idOrSlug}`, options);
  }

  /**
   * List blog posts
   */
  async listBlogPosts(
    filters?: CMSFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<BlogPost>>> {
    return this.http.get<PaginatedResponse<BlogPost>>(CMS_BLOG_API, {
      ...options,
      params: filters
    });
  }
}
