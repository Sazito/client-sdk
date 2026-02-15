/**
 * Visits API (Analytics and page views)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, RequestOptions } from '../types';
import { VISITS_API } from '../constants/endpoints';

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

function isRequestOptions(input: unknown): input is RequestOptions {
  if (!input || typeof input !== 'object') return false;
  const candidate = input as Record<string, unknown>;
  return (
    'retries' in candidate ||
    'timeout' in candidate ||
    'cache' in candidate ||
    'headers' in candidate ||
    'signal' in candidate
  );
}

export class VisitsAPI {
  constructor(private http: HttpClient) {}

  /**
   * Track visit analytics event.
   * Backend endpoint `/api/v1/visits/add` does not accept a payload.
   */
  async track(
    inputOrOptions?: VisitInput | RequestOptions,
    options?: RequestOptions
  ): Promise<SazitoResponse<VisitResponse>> {
    const resolvedOptions = options ?? (isRequestOptions(inputOrOptions) ? inputOrOptions : undefined);
    return this.http.post<VisitResponse>(VISITS_API, undefined, resolvedOptions);
  }

  /**
   * Track product view
   */
  async trackProduct(
    productId: number,
    url: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<VisitResponse>> {
    void productId;
    void url;
    return this.track(options);
  }

  /**
   * Track category view
   */
  async trackCategory(
    categoryId: number,
    url: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<VisitResponse>> {
    void categoryId;
    void url;
    return this.track(options);
  }
}
