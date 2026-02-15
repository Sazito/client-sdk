/**
 * Feedbacks API (Comments and reviews)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  RequestOptions
} from '../types';
import { FEEDBACKS_API } from '../constants/endpoints';

export interface Feedback {
  id: number;
  user?: {
    id: number;
    name: string;
  };
  productId?: number;
  rating?: number;         // 1-5 stars
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackInput {
  productId?: number;
  rating?: number;
  comment: string;
}

export interface FeedbackFilters {
  productId?: number;
  page?: number;
  pageSize?: number;
}

export class FeedbacksAPI {
  constructor(private http: HttpClient) {}

  private transformFilters(filters?: FeedbackFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.productId !== undefined) params.product_id = filters.productId;
    if (filters.page !== undefined) params.page = filters.page;
    if (filters.pageSize !== undefined) params.page_size = filters.pageSize;

    return params;
  }

  /**
   * List feedbacks
   */
  async list(
    filters?: FeedbackFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<Feedback>>> {
    return this.http.get<PaginatedResponse<Feedback>>(FEEDBACKS_API, {
      ...options,
      params: this.transformFilters(filters)
    });
  }

  /**
   * Create feedback/review
   */
  async create(
    input: CreateFeedbackInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<Feedback>> {
    return this.http.post<Feedback>(FEEDBACKS_API, input, options);
  }

  /**
   * Get single feedback
   */
  async get(
    feedbackId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Feedback>> {
    return this.http.get<Feedback>(`${FEEDBACKS_API}/${feedbackId}`, options);
  }
}
