/**
 * Entity Route types
 * For resolving URL paths to entities (products, categories, CMS pages)
 */

import { Product, ProductCategory } from './product';
import { BlogPage, CmsPage } from './search';

/**
 * Entity type discriminator
 */
export type EntityType = 'product' | 'product_category' | 'cms_page' | 'blog_page' | 'unknown';

/**
 * Entity route response - polymorphic based on entity type
 */
export interface EntityRoute {
  entityType: EntityType;
  entityId: number;
  url: string;
}

/**
 * Product entity route
 */
export interface ProductEntityRoute extends EntityRoute {
  entityType: 'product';
  entity: Product;
}

/**
 * Product category entity route
 */
export interface ProductCategoryEntityRoute extends EntityRoute {
  entityType: 'product_category';
  entity: ProductCategory;
}

/**
 * CMS page entity route
 */
export interface CMSPageEntityRoute extends EntityRoute {
  entityType: 'cms_page';
  entity: CmsPage;
}

/**
 * Blog page entity route
 */
export interface BlogPageEntityRoute extends EntityRoute {
  entityType: 'blog_page';
  entity: BlogPage;
}

/**
 * Unknown entity route (404)
 */
export interface UnknownEntityRoute extends EntityRoute {
  entityType: 'unknown';
  entity?: never;
}

/**
 * Union type for all possible entity routes
 */
export type EntityRouteResponse =
  | ProductEntityRoute
  | ProductCategoryEntityRoute
  | CMSPageEntityRoute
  | BlogPageEntityRoute
  | UnknownEntityRoute;
