/**
 * Entity Routes API
 * Resolves URLs to entity data (products, categories, CMS pages)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, Product, ProductCategory, RequestOptions } from '../types';
import { ENTITY_ROUTE_API } from '../constants/endpoints';


export interface CMSPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export type EntityType = 'product' | 'category' | 'cms_page' | 'tag';

export interface EntityRouteResponse {
  entity_type: EntityType;
  entity: Product | ProductCategory | CMSPage | any;
  url: string;
}

export class EntityRoutesAPI {
  constructor(private http: HttpClient) {}

  /**
   * Resolve URL path to entity data
   * @param urlPart - URL pathname (e.g., '/products/laptop-abc' or '/category/electronics')
   */
  async resolve(
    urlPart: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<EntityRouteResponse>> {
    return this.http.get<EntityRouteResponse>(ENTITY_ROUTE_API, {
      ...options,
      params: { url_part: urlPart }
    });
  }
}
