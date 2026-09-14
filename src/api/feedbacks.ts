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
  [key: string]: unknown;
  name: string;
  value: unknown;
}

export interface FeedbackProductImage {
  [key: string]: unknown;
  url: string;
  alt?: string;
}

export interface FeedbackSeedItem {
  /** Additional backend seed fields are retained for product submission. */
  [key: string]: unknown;
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
  orderId: string | number;
  orderIdentifier: string;
  orderRate: number;
}

export interface CommentResponse {
  id: string;
}

export interface ProductReviewRequest {
  /** Spread the selected FeedbackSeedItem to retain backend-specific fields. */
  [key: string]: unknown;
  commentId: string | number;
  productId: string | number;
  productVariantId: string | number;
  productName?: string;
  productAttributes?: FeedbackProductAttribute[];
  productImage?: FeedbackProductImage;
  productRate: number;
  text?: string;
  pros?: string[];
  cons?: string[];
  recommendationStatus?: RecommendationStatus;
  attachmentsServeKeys?: string[];
  owner?: boolean;
  isAnonymous?: boolean;
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

  private validId(value: unknown): value is string | number {
    return (typeof value === 'string' && value.trim().length > 0) ||
      (typeof value === 'number' && Number.isSafeInteger(value) && value > 0);
  }

  private validRating(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
  }

  private normalizeOrderId(value: unknown): number | null {
    if (!this.validId(value)) return null;
    const numericId = typeof value === 'number' ? value : Number(value.trim());
    return Number.isSafeInteger(numericId) && numericId > 0 ? numericId : null;
  }

  private normalizeSeedItem(item: any): FeedbackSeedItem | null {
    const productId = item?.product_id ?? item?.productId;
    const productVariantId = item?.product_variant_id ?? item?.productVariantId;
    if (!this.validId(productId) || !this.validId(productVariantId)) return null;

    // Keep unknown seed fields in their original wire format, including nested
    // values. The general response transformer can rename or collide these keys.
    const extra = { ...item };
    for (const key of [
      'product_id', 'productId', 'product_variant_id', 'productVariantId',
      'product_name', 'productName', 'name', 'product_attributes', 'productAttributes',
      'attributes', 'product_image', 'productImage', 'image'
    ]) delete extra[key];

    const attributes = item.product_attributes ?? item.productAttributes ?? item.attributes;
    return {
      ...extra,
      productId: String(productId).trim(),
      productVariantId: String(productVariantId).trim(),
      productName: String(item.product_name ?? item.productName ?? item.name ?? ''),
      productAttributes: Array.isArray(attributes) ? attributes : [],
      productImage: item.product_image ?? item.productImage ?? item.image ?? { url: '', alt: '' }
    };
  }

  private normalizeSeed(data: any, identifier: string): FeedbackSeed | null {
    const orderId = data?.order_id ?? data?.orderId;
    const orderIdentifier = data?.order_identifier ?? data?.orderIdentifier;
    const hasCommentAlready = data?.has_comment_already ?? data?.hasCommentAlready;
    if (!this.validId(orderId) || orderIdentifier !== identifier ||
      typeof hasCommentAlready !== 'boolean' || !Array.isArray(data?.items)) return null;

    const items: FeedbackSeedItem[] = [];
    for (const item of data.items) {
      const normalized = this.normalizeSeedItem(item);
      if (!normalized) return null;
      items.push(normalized);
    }
    return {
      orderId: String(orderId).trim(),
      orderIdentifier,
      hasCommentAlready,
      items
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
    const identifier = typeof orderIdentifier === 'string' ? orderIdentifier.trim() : '';
    if (!identifier) {
      return { error: { type: 'validation', message: 'Order identifier is required.' } };
    }

    const response = await this.http.get<any>(`${FEEDBACKS_SEED_API}/${encodeURIComponent(identifier)}`, {
      ...options,
      cache: false,
      skipTransform: true
    });
    if (response.error) return response;

    const body = response.data?.result ?? response.data;
    const seedData = body?.seed ?? body?.data ?? body;
    const seed = this.normalizeSeed(seedData, identifier);
    return seed
      ? { data: seed }
      : { error: { type: 'api', message: 'Feedback seed is invalid or does not match the requested order.' } };
  }

  /**
   * Submit order/shop rating and get a comment identifier for product review steps.
   */
  async createOrderRating(
    input: CreateOrderRatingInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<CommentResponse>> {
    const orderId = this.normalizeOrderId(input?.orderId);
    if (orderId === null) {
      return { error: { type: 'validation', message: 'Order ID is required and must be valid.' } };
    }
    const identifier = typeof input.orderIdentifier === 'string' ? input.orderIdentifier.trim() : '';
    if (!identifier) {
      return { error: { type: 'validation', message: 'Order identifier is required.' } };
    }
    if (!this.validRating(input.orderRate)) {
      return { error: { type: 'validation', message: 'Order rating must be an integer from 1 to 5.' } };
    }

    const response = await this.http.post<any>(FEEDBACKS_COMMENTS_API, {
      orderId,
      orderIdentifier: identifier,
      orderRate: input.orderRate
    }, { ...options, retries: 0, skipTransform: false });
    if (response.error) return response;

    const id = response.data?.id ?? response.data?.commentId ?? response.data?.comment?.id;
    return this.validId(id)
      ? { data: { id: String(id).trim() } }
      : { error: { type: 'api', message: 'Order rating response is missing a valid comment ID. Check the seed before submitting again.' } };
  }

  /**
   * Submit product-level review details.
   */
  async submitProductReview(
    input: ProductReviewRequest,
    options?: RequestOptions
  ): Promise<SazitoResponse<void>> {
    const productId = this.normalizeOrderId(input?.productId);
    const productVariantId = this.normalizeOrderId(input?.productVariantId);
    if (!this.validId(input?.commentId) || productId === null || productVariantId === null) {
      return { error: { type: 'validation', message: 'Comment ID, product ID, and product variant ID are required.' } };
    }
    if (!this.validRating(input.productRate)) {
      return { error: { type: 'validation', message: 'Product rating must be an integer from 1 to 5.' } };
    }
    const recommendationStatus = input.recommendationStatus ?? 'NONE';
    if (!['RECOMMENDED', 'NEUTRAL', 'NOT-RECOMMENDED', 'NONE'].includes(recommendationStatus)) {
      return { error: { type: 'validation', message: 'Recommendation status is invalid.' } };
    }
    for (const key of ['pros', 'cons', 'attachmentsServeKeys'] as const) {
      const values = input[key];
      if (values !== undefined && (!Array.isArray(values) || values.some(value =>
        typeof value !== 'string' || (key === 'attachmentsServeKeys' && !value.trim())))) {
        return { error: { type: 'validation', message: `${key} must contain strings${key === 'attachmentsServeKeys' ? ' with completed, non-empty serve keys' : ''}.` } };
      }
    }
    if ((input.text !== undefined && typeof input.text !== 'string') ||
      (input.isAnonymous !== undefined && typeof input.isAnonymous !== 'boolean') ||
      (input.owner !== undefined && typeof input.owner !== 'boolean')) {
      return { error: { type: 'validation', message: 'Review text must be a string and anonymity/owner must be booleans.' } };
    }

    const seedFields = { ...input };
    for (const key of [
      'commentId', 'productId', 'productVariantId', 'productRate', 'productName',
      'productAttributes', 'productImage', 'recommendationStatus', 'attachmentsServeKeys', 'isAnonymous'
    ]) delete seedFields[key];

    return this.http.post<void>(FEEDBACKS_COMMENT_DETAILS_API, {
      ...seedFields,
      ...(input.productName !== undefined ? { product_name: input.productName } : {}),
      ...(input.productAttributes !== undefined ? { product_attributes: input.productAttributes } : {}),
      ...(input.productImage !== undefined ? { product_image: input.productImage } : {}),
      // Apply validated values after seed extras, including snake_case keys.
      comment_id: typeof input.commentId === 'string' ? input.commentId.trim() : input.commentId,
      product_id: productId,
      product_variant_id: productVariantId,
      product_rate: input.productRate,
      text: input.text ?? '',
      pros: input.pros ?? [],
      cons: input.cons ?? [],
      recommendation_status: recommendationStatus,
      attachments_serve_keys: input.attachmentsServeKeys ?? [],
      owner: input.owner ?? true,
      is_anonymous: input.isAnonymous ?? false
    }, { ...options, retries: 0, skipRequestTransform: true });
  }

  /**
   * Fetch product review statistics (without review list).
   */
  async getProductStatistics(
    productId: string | number,
    options?: RequestOptions
  ): Promise<SazitoResponse<ProductStatistics>> {
    const normalizedProductId = this.normalizeOrderId(productId);
    if (normalizedProductId === null) {
      return { error: { type: 'validation', message: 'Product ID is required and must be a positive integer.' } };
    }
    const response = await this.http.get<any>(`${FEEDBACKS_COMMENT_DETAILS_API}/${encodeURIComponent(String(normalizedProductId))}`, {
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
    productId: string | number,
    filters?: ProductReviewsFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<ProductReviewsResponse>> {
    const normalizedProductId = this.normalizeOrderId(productId);
    if (normalizedProductId === null) {
      return { error: { type: 'validation', message: 'Product ID is required and must be a positive integer.' } };
    }
    const response = await this.http.get<any>(`${FEEDBACKS_COMMENT_DETAILS_API}/${encodeURIComponent(String(normalizedProductId))}`, {
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
   * @deprecated For order feedback, use getSeed, createOrderRating, then submitProductReview.
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
