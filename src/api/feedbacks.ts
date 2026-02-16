/**
 * Feedbacks API (Tajrobe reviews + legacy feedback methods)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  RequestOptions
} from '../types';
import {
  FEEDBACKS_API,
  FEEDBACKS_SEED_API,
  FEEDBACKS_COMMENTS_API,
  FEEDBACKS_COMMENT_DETAILS_API,
  FEEDBACKS_PUBLIC_UPLOAD_API
} from '../constants/endpoints';

export type RecommendationStatus = 'RECOMMENDED' | 'NEUTRAL' | 'NOT-RECOMMENDED' | 'NONE';

export interface FeedbackProductAttribute {
  name: string;
  value: string;
}

export interface FeedbackProductImage {
  url: string;
  alt: string;
}

export interface FeedbackSeedItem {
  productId: string;
  productVariantId: string;
  productName: string;
  productAttributes: FeedbackProductAttribute[];
  productImage: FeedbackProductImage;
}

export interface FeedbackSeed {
  orderId: string;
  orderIdentifier: string;
  hasCommentAlready: boolean;
  items: FeedbackSeedItem[];
}

export interface CreateOrderRatingInput {
  orderId: string;
  orderIdentifier: string;
  orderRate: number;
}

export interface CommentResponse {
  id: string;
}

export interface ProductReviewRequest {
  commentId: string;
  productId: string;
  productVariantId: string;
  productName: string;
  productAttributes: FeedbackProductAttribute[];
  productImage: FeedbackProductImage;
  productRate: number;
  text: string;
  pros: string[];
  cons: string[];
  recommendationStatus: RecommendationStatus;
  attachmentsServeKeys: string[];
  owner: boolean;
  isAnonymous: boolean;
}

export interface ProductStatistics {
  productStatistics: {
    averageRate: number;
    totalCount: number;
    recommendations: {
      recommendedPercentage: number;
      recommendedTotalCount: number;
    };
  };
}

export interface ProductReview {
  productRate: number;
  userFirstName: string;
  userLastName: string;
  createdAt: string;
  owner: boolean;
  text: string;
  recommendationStatus: RecommendationStatus;
  pros: string[];
  cons: string[];
  isAnonymous: boolean;
  metadata: {
    variantOptions: any[];
    productName: string;
    variantId: string;
  };
  attachments: Array<{
    serveUrl: string;
  }>;
}

export interface ProductReviewsFilters {
  pageNumber?: number;
  pageSize?: number;
}

export interface ProductReviewsResponse {
  entities: ProductReview[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  averageRate: number;
  recommendations: {
    recommendedPercentage: number;
    recommendedTotalCount: number;
  };
}

export interface ReviewAttachmentInput {
  file: File | Blob;
  name?: string;
  alt?: string;
}

export interface ReviewUploadedImage {
  id: string;
  url: string;
  alt: string;
  serveUrl: string;
  serveKey: string;
}

export interface ReviewImageUploadResponse {
  images: ReviewUploadedImage[];
}

/**
 * Legacy feedback model kept for backwards compatibility.
 */
export interface Feedback {
  id: number;
  user?: {
    id: number;
    name: string;
  };
  productId?: number;
  rating?: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

/**
 * Legacy create payload kept for backwards compatibility.
 */
export interface CreateFeedbackInput {
  productId?: number;
  rating?: number;
  comment: string;
}

/**
 * Legacy filters kept for backwards compatibility.
 */
export interface FeedbackFilters {
  productId?: number;
  page?: number;
  pageSize?: number;
}

export class FeedbacksAPI {
  constructor(private http: HttpClient) {}

  private normalizeSeedItem(item: any): FeedbackSeedItem {
    return {
      productId: String(item?.productId ?? ''),
      productVariantId: String(item?.productVariantId ?? ''),
      productName: String(item?.productName ?? item?.name ?? ''),
      productAttributes: Array.isArray(item?.productAttributes)
        ? item.productAttributes
        : Array.isArray(item?.attributes) ? item.attributes : [],
      productImage: item?.productImage || item?.image || { url: '', alt: '' }
    };
  }

  private normalizeSeed(data: any): FeedbackSeed {
    const items = Array.isArray(data?.items) ? data.items : [];
    return {
      orderId: String(data?.orderId ?? ''),
      orderIdentifier: String(data?.orderIdentifier ?? ''),
      hasCommentAlready: Boolean(data?.hasCommentAlready),
      items: items.map((item: any) => this.normalizeSeedItem(item))
    };
  }

  private normalizeProductReview(entity: any): ProductReview {
    const metadata = entity?.metadata || {};
    return {
      ...entity,
      metadata: {
        variantOptions: Array.isArray(metadata.variantOptions) ? metadata.variantOptions : [],
        productName: String(metadata.productName ?? metadata.name ?? ''),
        variantId: String(metadata.variantId ?? '')
      }
    };
  }

  private normalizeProductReviewsResponse(data: any): ProductReviewsResponse {
    const entities = Array.isArray(data?.entities) ? data.entities : [];
    const recommendations = data?.recommendations || {};

    return {
      entities: entities.map((entity: any) => this.normalizeProductReview(entity)),
      pageNumber: Number(data?.pageNumber ?? 1),
      pageSize: Number(data?.pageSize ?? 10),
      totalCount: Number(data?.totalCount ?? entities.length),
      averageRate: Number(data?.averageRate ?? 0),
      recommendations: {
        recommendedPercentage: Number(recommendations.recommendedPercentage ?? 0),
        recommendedTotalCount: Number(recommendations.recommendedTotalCount ?? 0)
      }
    };
  }

  private transformLegacyFilters(filters?: FeedbackFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.productId !== undefined) params.product_id = filters.productId;
    if (filters.page !== undefined) params.page = filters.page;
    if (filters.pageSize !== undefined) params.page_size = filters.pageSize;

    return params;
  }

  /**
   * Validate order and get products that can be reviewed.
   */
  async getSeed(
    orderIdentifier: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<FeedbackSeed>> {
    const response = await this.http.get<any>(`${FEEDBACKS_SEED_API}/${orderIdentifier}`, options);

    if (response.data) {
      const seedData = response.data.seed || response.data.data || response.data;
      return { data: this.normalizeSeed(seedData) };
    }

    return response;
  }

  /**
   * Submit order/shop rating and get a comment identifier for product review steps.
   */
  async createOrderRating(
    input: CreateOrderRatingInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<CommentResponse>> {
    const response = await this.http.post<any>(FEEDBACKS_COMMENTS_API, input, options);

    if (response.data) {
      const id = response.data.id ?? response.data.commentId ?? response.data.comment?.id;
      return { data: { id: String(id ?? '') } };
    }

    return response;
  }

  /**
   * Submit product-level review details.
   */
  async submitProductReview(
    input: ProductReviewRequest,
    options?: RequestOptions
  ): Promise<SazitoResponse<void>> {
    return this.http.post<void>(FEEDBACKS_COMMENT_DETAILS_API, input, options);
  }

  /**
   * Fetch product review statistics (without review list).
   */
  async getProductStatistics(
    productId: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<ProductStatistics>> {
    const response = await this.http.get<any>(`${FEEDBACKS_COMMENT_DETAILS_API}/${productId}`, {
      ...options,
      params: { exclude: 'comments' }
    });

    if (response.data) {
      const productStatistics = response.data.productStatistics
        || response.data.data?.productStatistics
        || response.data;

      return { data: { productStatistics } as ProductStatistics };
    }

    return response;
  }

  /**
   * Fetch paginated product reviews.
   */
  async getProductReviews(
    productId: string,
    filters?: ProductReviewsFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<ProductReviewsResponse>> {
    const response = await this.http.get<any>(`${FEEDBACKS_COMMENT_DETAILS_API}/${productId}`, {
      ...options,
      params: {
        page_number: filters?.pageNumber ?? 1,
        page_size: filters?.pageSize ?? 10
      }
    });

    if (response.data) {
      const reviewsData = response.data.data || response.data;
      return { data: this.normalizeProductReviewsResponse(reviewsData) };
    }

    return response;
  }

  /**
   * Upload review images and get serve keys for attachments.
   */
  async uploadReviewImages(
    images: ReviewAttachmentInput[],
    options?: RequestOptions
  ): Promise<SazitoResponse<ReviewImageUploadResponse>> {
    const formData = new FormData();

    images.forEach((image, index) => {
      formData.append('images[][file]', image.file);
      formData.append('images[][name]', image.name || `image-${index + 1}`);
      formData.append('images[][alt]', image.alt || image.name || `image-${index + 1}`);
    });

    const response = await this.http.post<any>(FEEDBACKS_PUBLIC_UPLOAD_API, formData, options);

    if (response.data) {
      const list = Array.isArray(response.data.images)
        ? response.data.images
        : Array.isArray(response.data.data?.images)
          ? response.data.data.images
          : Array.isArray(response.data.result?.images)
            ? response.data.result.images
            : [];
      return { data: { images: list } };
    }

    return response;
  }

  /**
   * Legacy list method kept for backwards compatibility.
   */
  async list(
    filters?: FeedbackFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<Feedback>>> {
    return this.http.get<PaginatedResponse<Feedback>>(FEEDBACKS_API, {
      ...options,
      params: this.transformLegacyFilters(filters)
    });
  }

  /**
   * Legacy create method kept for backwards compatibility.
   */
  async create(
    input: CreateFeedbackInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<Feedback>> {
    return this.http.post<Feedback>(FEEDBACKS_API, input, options);
  }

  /**
   * Legacy get method kept for backwards compatibility.
   */
  async get(
    feedbackId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Feedback>> {
    return this.http.get<Feedback>(`${FEEDBACKS_API}/${feedbackId}`, options);
  }
}
