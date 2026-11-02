/**
 * Product-related types
 */

import { ProductAttribute, JsonObject } from './common';

/** Slim image returned by all storefront product reads. */
export interface ProductImage {
  id: number;
  alt?: string;
  url: string;
  width?: number;
  height?: number;
}

/** Variant fields available on list and search cards. */
export interface ProductListVariant {
  id: number;
  enabled: boolean;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  isStockManaged: boolean;
  attributes: ProductAttribute[];
  hasMaxOrder: boolean;
  maxOrderQuantity: number;
  minOrderQuantity: number;
  dynamicFormId?: number;
  sortIndex: number;
  imageId?: number;
}

/** Details variants additionally expose their SKU. */
export interface ProductVariant extends ProductListVariant {
  sku?: string;
}

/** Product card returned by storefront list and search. */
export interface ProductListItem {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
  /** Search may return an empty string on the SDP branch. */
  productType: string;
  dynamicFormId?: number;
  eventEntityId?: number;
  attributes?: ProductAttribute[];
  /** Total image count returned by the API. */
  imageCount: number;
  images: ProductImage[] | null;
  variants: ProductListVariant[] | null;
}

export interface ProductBreadcrumbCategory {
  id: number;
  name: string;
  url: string;
}

/** Taxonomy term (category, attribute, or attribute value) with its display name. */
export interface ProductTaxonomyTerm {
  /** Taxonomy identifier; distinct from storefront category IDs. */
  id: string;
  /** Persian display name. */
  name: string;
  /** English name when the taxonomy provides one. */
  enName?: string;
}

/** Specification row: a taxonomy attribute and its selected values. */
export interface ProductTaxonomyMetafield {
  attribute: ProductTaxonomyTerm;
  values: ProductTaxonomyTerm[];
}

/** Display-ready specification row: attribute name and joined value names. */
export interface ProductTaxonomyFeature {
  label: string;
  value: string;
}

/** Taxonomy category path and specification table returned with product details. */
export interface ProductTaxonomy {
  /** Assigned taxonomy category; null when the product is uncategorized. */
  category: ProductTaxonomyTerm | null;
  /** Category ancestors followed by the category itself, root first. */
  breadcrumb: ProductTaxonomyTerm[];
  /** Breadcrumb names joined with " > "; empty when there is no category. */
  categoryPath: string;
  /** Specification rows with attribute and value identifiers. */
  metafields: ProductTaxonomyMetafield[];
  /** Specification table rows, one per metafield with a name and at least one value. */
  features: ProductTaxonomyFeature[];
}

/** Storefront detail product; entity routes move id to entityId. */
export interface Product {
  id?: number;  // Optional: removed in entity routes (available as entityId at root)
  name: string;
  url: string;
  enabled: boolean;
  productType: string;
  themeConfig?: JsonObject;
  dynamicFormId?: number;
  eventEntityId?: number;
  attributes?: ProductAttribute[];
  images: ProductImage[] | null;
  variants: ProductVariant[] | null;
  categories: ProductBreadcrumbCategory[] | null;
  /** Present on `products.get()` when the API returns taxonomy data; absent on entity routes. */
  taxonomy?: ProductTaxonomy;
}

export interface ProductCategory {
  id?: number;  // Optional: removed in entity routes (available as entityId at root)
  name: string;
  url: string;
  enabled?: boolean;
  description?: string;
  productsCount?: number;
  themeConfig?: JsonObject;
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
