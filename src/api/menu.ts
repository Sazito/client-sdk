/**
 * Menu API (Header Menu, Navigation Trees)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  RequestOptions
} from '../types';
import { MenuTree, MenuItem } from '../types/menu';
import { MENU_API } from '../constants/endpoints';
import { transformMenuResponse } from '../utils/transformers';

export class MenuAPI {
  constructor(private http: HttpClient) {}

  /**
   * Fetch header menu by identifier
   * @param identifier - Menu identifier (default: 'headermenu')
   * @param options - Request options
   */
  async getHeaderMenu(
    identifier: string = 'headermenu',
    options?: RequestOptions
  ): Promise<SazitoResponse<MenuItem[]>> {
    const response = await this.http.get<{ tree: MenuTree }>(
      MENU_API,
      {
        ...options,
        params: { identifier }
      }
    );

    // Transform and clean the response (removes staticUrl, unnecessary fields)
    const transformed = response.data ? transformMenuResponse(response.data) : response.data;

    // Transform the raw tree structure into a clean navigation array
    // Response is camelCased by HTTP client: tree.treeStructure.nodes
    const nodes = transformed?.tree?.treeStructure?.nodes || [];
    const processedMenu = this.convertRawTreeToNavigation(nodes);

    return {
      ...response,
      data: processedMenu
    };
  }

  /**
   * Convert raw tree structure to clean navigation items
   * Filters out disabled items and processes nested children recursively
   */
  private convertRawTreeToNavigation(nodes: any[]): MenuItem[] {
    if (!nodes || nodes.length === 0) return [];

    const output = nodes.map(node => ({
      name: this.findNodeTitle(node),
      url: this.findNodeUrl(node),
      children: this.convertRawTreeToNavigation(node.children || []),
      shouldBeDropped: this.shouldDropNode(node)
    }));

    // Filter out disabled items
    return output
      .filter(item => !item.shouldBeDropped)
      .map(({ shouldBeDropped, ...item }) => item);
  }

  /**
   * Extract the display title for a menu node
   */
  private findNodeTitle(node: any): string {
    const { entityType, details, entity } = node;

    // If isTitleDefault is true, use entity name/title
    // If isTitleDefault is false or undefined, use custom title from details
    if (details && !details.isTitleDefault && details.title) {
      // Custom title set by user
      return details.title;
    } else if (details && !details.isTitleDefault && details.name) {
      // For entityType "url", use details.name
      return details.name;
    } else if (entityType === 'product_category' || entityType === 'product') {
      // Use entity name for products/categories
      return entity?.name || '';
    } else if (entityType === 'cms_page' || entityType === 'blog_page') {
      // Use entity name for CMS pages (not title!)
      return entity?.name || '';
    }

    return '';
  }

  /**
   * Extract the URL for a menu node
   */
  private findNodeUrl(node: any): string {
    if (
      node.entityType === 'product' ||
      node.entityType === 'product_category' ||
      node.entityType === 'cms_page' ||
      node.entityType === 'blog_page'
    ) {
      return node.entity?.url || '#';
    } else if (node.entityType === 'url') {
      return node.details?.url || '#';
    }
    return '#';
  }

  /**
   * Determine if a node should be filtered out (disabled items)
   */
  private shouldDropNode(node: any): boolean {
    if (
      node.entityType === 'product' ||
      node.entityType === 'product_category' ||
      node.entityType === 'cms_page' ||
      node.entityType === 'blog_page'
    ) {
      return !node.entity?.enabled;
    }
    return false;
  }
}
