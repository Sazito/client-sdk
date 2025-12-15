/**
 * Search-related types
 */

import { Product, ProductCategory } from './product';
import { Image } from './common';

/**
 * Blog page entity from search results
 */
export interface BlogPage {
  id: number;
  name: string;
  url: string;
  summary?: string;
  image?: Image;
  createdAt: string;
  updatedAt: string;
}

/**
 * CMS page entity from search results
 */
export interface CmsPage {
  id: number;
  name: string;
  url: string;
  summary?: string;
  image?: Image;
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
