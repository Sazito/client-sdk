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
  product_id?: number;
  rating?: number;         // 1-5 stars
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackInput {
  product_id: number;
  rating?: number;
  comment: string;
}

export interface FeedbackFilters {
  product_id?: number;
  page?: number;
  per_page?: number;
}

export class FeedbacksAPI {
  constructor(private http: HttpClient) {}

  /**
   * List feedbacks
   */
  async list(
    filters?: FeedbackFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<Feedback>>> {
    return this.http.get<PaginatedResponse<Feedback>>(FEEDBACKS_API, {
      ...options,
      params: filters
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
