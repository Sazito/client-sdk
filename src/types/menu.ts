/**
 * Menu and Navigation Types
 */

/**
 * Clean navigation menu item returned by SDK
 */
export interface MenuItem {
  name: string;
  url: string;
  children: MenuItem[];
}

/**
 * Raw menu tree structure from API (camelCased by HTTP client)
 */
export interface MenuTree {
  id: number;
  identifier: string;
  treeStructure: {
    nodes: MenuNode[];
  };
}

/**
 * Raw menu node from API (camelCased by HTTP client)
 */
export interface MenuNode {
  entityType: 'product_category' | 'product' | 'cms_page' | 'blog_page' | 'url';
  entityId: number | null;
  entity?: {
    id?: number;
    name?: string;        // For products/categories
    title?: string;       // For CMS/blog pages
    url?: string;
    enabled?: boolean;
  };
  details?: {
    title?: string;
    isTitleDefault?: boolean;
    url?: string;         // For entityType "url"
    name?: string;        // For entityType "url"
    entityType?: string;
    includeChildren?: boolean;  // For product_category
  };
  children: MenuNode[];
}
