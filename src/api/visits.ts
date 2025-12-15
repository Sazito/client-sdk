/**
 * Visits API (Analytics and page views)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, RequestOptions } from '../types';
import { VISITS_API } from '../constants/endpoints';


export interface VisitInput {
  url: string;
  referrer?: string;
  user_agent?: string;
  entity_type?: 'product' | 'category' | 'page';
  entity_id?: number;
}

export interface VisitResponse {
  id: number;
  created_at: string;
}

export class VisitsAPI {
  constructor(private http: HttpClient) {}

  /**
   * Track page visit
   */
  async track(
    input: VisitInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<VisitResponse>> {
    return this.http.post<VisitResponse>(VISITS_API, input, options);
  }

  /**
   * Track product view
   */
  async trackProduct(
    productId: number,
    url: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<VisitResponse>> {
    return this.track(
      {
        url,
        entity_type: 'product',
        entity_id: productId,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      },
      options
    );
  }

  /**
   * Track category view
   */
  async trackCategory(
    categoryId: number,
    url: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<VisitResponse>> {
    return this.track(
      {
        url,
        entity_type: 'category',
        entity_id: categoryId,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      },
      options
    );
  }
}
