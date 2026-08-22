/**
 * Menu API (Header Menu, Navigation Trees)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  RequestOptions
} from '../types';
import { MenuTree, MenuItem, MenuNode } from '../types/menu';
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
    const transformed = response.data
      ? transformMenuResponse<{ tree: MenuTree }>(response.data)
      : response.data;

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
  private convertRawTreeToNavigation(nodes: MenuNode[]): MenuItem[] {
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
      .map(({ shouldBeDropped: _shouldBeDropped, ...item }) => item);
  }

  /**
   * Extract the display title for a menu node
   */
  private findNodeTitle(node: MenuNode): string {
    const { details, entity } = node;
    const customTitle = this.firstNonEmpty(details?.title, details?.name);
    const entityTitle = this.firstNonEmpty(entity?.title, entity?.name);

    if (details?.isTitleDefault === true) {
      return entityTitle || customTitle;
    }

    if (details?.isTitleDefault === false) {
      return customTitle || entityTitle;
    }

    // URL nodes commonly omit isTitleDefault. Prefer their details label, but
    // retain the entity label as a fallback for inconsistent backend payloads.
    return customTitle || entityTitle;
  }

  private firstNonEmpty(...values: Array<string | undefined>): string {
    return values.find(value => typeof value === 'string' && value.trim().length > 0) || '';
  }

  /**
   * Extract the URL for a menu node
   */
  private findNodeUrl(node: MenuNode): string {
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
  private shouldDropNode(node: MenuNode): boolean {
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
