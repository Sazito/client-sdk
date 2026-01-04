/**
 * Visits API (Analytics and page views)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, RequestOptions } from '../types';
import { VISITS_API } from '../constants/endpoints';
import { transformRequestKeys } from '../utils/transformers';

/**
 * Visit tracking input (SDK uses camelCase)
 */
export interface VisitInput {
  url: string;
  referrer?: string;
  userAgent?: string;
  entityType?: 'product' | 'category' | 'page';
  entityId?: number;
}

/**
 * Visit tracking response (auto-transformed to camelCase by HTTP client)
 */
export interface VisitResponse {
  id: number;
  createdAt: string;
}

export class VisitsAPI {
  constructor(private http: HttpClient) {}

  /**
   * Track page visit
   * Automatically transforms camelCase input to snake_case for API
   */
  async track(
    input: VisitInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<VisitResponse>> {
    // Transform camelCase to snake_case for API request
    const transformedInput = transformRequestKeys(input);
    return this.http.post<VisitResponse>(VISITS_API, transformedInput, options);
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
        entityType: 'product',
        entityId: productId,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
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
        entityType: 'category',
        entityId: categoryId,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      },
      options
    );
  }
}
