/**
 * Entity Routes API
 * Resolves URLs to entity data (products, categories, CMS pages)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, EntityRouteResponse, RequestOptions } from '../types';
import { ENTITY_ROUTE_API } from '../constants/endpoints';
import { transformEntityRouteResponse } from '../utils/transformers';

export class EntityRoutesAPI {
  constructor(private http: HttpClient) {}

  /**
   * Resolve URL path to entity data
   * @param urlPart - URL pathname (e.g., '/product/laptop-abc' or '/category/electronics')
   * @returns Entity route with cleaned entity data based on type
   */
  async resolve(
    urlPart: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<EntityRouteResponse>> {
    const response = await this.http.get<any>(ENTITY_ROUTE_API, {
      ...options,
      params: { url_part: urlPart }
    });

    if (response.data) {
      const transformed = transformEntityRouteResponse(response.data);
      return { data: transformed };
    }

    return response;
  }
}
