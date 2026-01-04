/**
 * Product-related types
 */

import { Image, ProductAttribute } from './common';

export interface ProductVariant {
  id: number;
  productId?: number;
  sku?: string;
  enabled: boolean;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  isStockManaged: boolean;
  isAvailable?: boolean;
  attributes: ProductAttribute[];
  maxOrderQuantity: number;
  hasMaxOrder: boolean;
  minOrderQuantity: number;
  weight?: number;
  dynamicFormId?: number;
  sortIndex: number;
  imageId?: number;
  commercialFiles?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id?: number;  // Optional: removed in entity routes (available as entityId at root)
  name: string;
  url: string;
  enabled: boolean;
  productType: string;
  themeConfig?: any;
  dynamicFormId?: number;
  eventEntityId?: number;
  attributes?: ProductAttribute[];
  images: Image[];
  variants: ProductVariant[];
  categories: ProductCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id?: number;  // Optional: removed in entity routes (available as entityId at root)
  name: string;
  url: string;
  enabled?: boolean;
  description?: string;
  productsCount?: number;
  themeConfig?: any;
  attributes?: ProductAttribute[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export type ProductSort =
  | 'newest'          // Sort by date (newest first)
  | 'best-selling'    // Sort by sold count
  | 'availability'    // Sort by stock status
  | 'discount'        // Sort by discount amount
  | '!price'          // Sort by price ascending (cheapest first)
  | 'price';          // Sort by price descending (most expensive first)

export interface ProductFilters {
  // Pagination
  page?: number;
  pageSize?: number;

  // Sorting
  sort?: ProductSort;

  // Category filtering
  categories?: number | number[];  // Category ID(s)

  // Price filtering
  priceMin?: number;
  priceMax?: number;

  // Availability filtering
  availableOnly?: boolean;    // Filter only in-stock products
  discountedOnly?: boolean;   // Filter only discounted products

  // Pinned products
  pinnedIds?: number[];        // Product IDs to pin at the top

  // Similar products
  similarTo?: number;          // Find products similar to this product ID
}
