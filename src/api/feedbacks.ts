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
  // SDK-friendly
  productId?: number;

  // Backward-compatible raw key
  product_id?: number;

  rating?: number;
  comment: string;
}

export interface FeedbackFilters {
  // SDK-friendly
  productId?: number;
  page?: number;
  pageSize?: number;

  // Backward-compatible raw keys
  product_id?: number;
  page_size?: number;
}

export class FeedbacksAPI {
  constructor(private http: HttpClient) {}

  private transformFilters(filters?: FeedbackFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};
    const productId = filters.productId ?? filters.product_id;
    const pageSize = filters.pageSize ?? filters.page_size;

    if (productId !== undefined) params.product_id = productId;
    if (filters.page !== undefined) params.page = filters.page;
    if (pageSize !== undefined) params.page_size = pageSize;

    return params;
  }

  private transformCreateInput(input: CreateFeedbackInput): Record<string, any> {
    const productId = input.productId ?? input.product_id;

    return {
      ...input,
      productId,
      product_id: undefined
    };
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
    return this.http.post<Feedback>(FEEDBACKS_API, this.transformCreateInput(input), options);
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
