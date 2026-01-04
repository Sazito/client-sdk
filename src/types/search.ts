/**
 * Search-related types
 */

import { Product, ProductCategory } from './product';
import { Image, ProductAttribute } from './common';

/**
 * CMS Page types
 */
export type CMSPageType = 'normal' | 'blog';

/**
 * Blog page entity from search results
 */
export interface BlogPage {
  id?: number;  // Optional: removed in entity routes (available as entityId at root)
  name: string;
  url: string;
  enabled?: boolean;
  cmsPageType?: CMSPageType;
  content?: string;
  summary?: string;
  image?: Image;
  themeConfig?: any;
  attributes?: ProductAttribute[];
  createdAt: string;
  updatedAt: string;
}

/**
 * CMS page entity from search results
 */
export interface CmsPage {
  id?: number;  // Optional: removed in entity routes (available as entityId at root)
  name: string;
  url: string;
  enabled?: boolean;
  cmsPageType?: CMSPageType;
  content?: string;
  summary?: string;
  image?: Image;
  themeConfig?: any;
  attributes?: ProductAttribute[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Search response containing multiple entity types
 * Each entity type has its own array and pagination info
 */
export interface SearchResponse {
  products: {
    items: Product[];
    total: number;
    page: number;
    pageSize: number;
  };
  blogPages: {
    items: BlogPage[];
    total: number;
    page: number;
    pageSize: number;
  };
  cmsPages: {
    items: CmsPage[];
    total: number;
    page: number;
    pageSize: number;
  };
  productCategories: {
    items: ProductCategory[];
    total: number;
    page: number;
    pageSize: number;
  };
}
