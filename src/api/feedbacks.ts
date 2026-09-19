/**
 * Feedbacks API (Tajrobe reviews + legacy feedback methods)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  RequestOptions
} from '../types';
import {
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

/**
 * The editable part of a product review. Use `buildProductReviewInput` to
 * combine this draft with an item returned by `getSeed`.
 */
export interface ProductReviewDraft {
  productRate: number;
  text?: string;
  pros?: string[];
  cons?: string[];
  recommendationStatus?: RecommendationStatus;
  attachmentsServeKeys?: string[];
  owner?: boolean;
  isAnonymous?: boolean;
}

/**
 * Build the wire-ready product review input from a seed item. This keeps all
 * backend-specific fields returned by the seed while applying the user's
 * editable values in one place.
 */
export function buildProductReviewInput(
  item: FeedbackSeedItem,
  commentId: string | number,
  draft: ProductReviewDraft
): ProductReviewRequest {
  return {
    ...item,
    commentId,
    productId: item.productId,
    productVariantId: item.productVariantId,
    productName: item.productName,
    productAttributes: item.productAttributes,
    productImage: item.productImage,
    productRate: draft.productRate,
    text: draft.text ?? '',
    pros: draft.pros ?? [],
    cons: draft.cons ?? [],
    recommendationStatus: draft.recommendationStatus ?? 'NONE',
    attachmentsServeKeys: draft.attachmentsServeKeys ?? [],
    owner: draft.owner ?? true,
    isAnonymous: draft.isAnonymous ?? false
  };
}

export interface SubmitOrderFeedbackInput {
  /** Order identifier used to load and validate the feedback seed. */
  orderIdentifier: string;
  orderRate: number;
  /**
   * Optional seed already loaded by the host. Supplying it avoids a second
   * seed request when the UI needs the items to render its form.
   */
  seed?: FeedbackSeed;
  /** Product reviews to submit, in the desired order. */
  reviews?: Array<{
    item: FeedbackSeedItem;
    draft: ProductReviewDraft;
  }>;
}

export interface SubmitOrderFeedbackResult {
  status: 'submitted' | 'already_submitted';
  seed: FeedbackSeed;
  commentId?: string;
  submittedProductCount: number;
  requestedProductCount: number;
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

  private normalizeProductStatistics(data: any): ProductStatistics['productStatistics'] {
    const statistics = data?.productStatistics ?? data?.product_statistics ?? data ?? {};
    const recommendations = statistics?.recommendations ?? {};

    return {
      averageRate: Number(statistics?.averageRate ?? statistics?.average_rate ?? 0),
      totalCount: Number(
        statistics?.totalCount
        ?? statistics?.total_count
        ?? statistics?.total
        ?? 0
      ),
      recommendations: {
        recommendedPercentage: Number(
          recommendations?.recommendedPercentage
          ?? recommendations?.recommended_percentage
          ?? 0
        ),
        recommendedTotalCount: Number(
          recommendations?.recommendedTotalCount
          ?? recommendations?.recommended_total_count
          ?? 0
        )
      }
    };
  }

  private normalizeProductReviewsResponse(data: any): ProductReviewsResponse {
    const productComments = data?.productComments ?? data?.product_comments ?? {};
    const entitySource = data?.entities ?? productComments?.results;
    const entities = Array.isArray(entitySource) ? entitySource : [];
    const productStatistics = this.normalizeProductStatistics(
      data?.productStatistics ?? data?.product_statistics ?? data
    );

    return {
      entities: entities.map((entity: any) => this.normalizeProductReview(entity)),
      pageNumber: Number(data?.pageNumber ?? data?.page_number ?? data?.page ?? 1),
      pageSize: Number(data?.pageSize ?? data?.page_size ?? 10),
      totalCount: Number(
        data?.totalCount
        ?? data?.total_count
        ?? data?.total
        ?? productComments?.total
        ?? entities.length
      ),
      averageRate: productStatistics.averageRate,
      recommendations: productStatistics.recommendations
    };
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
    const identifier = typeof input?.orderIdentifier === 'string' ? input.orderIdentifier.trim() : '';
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
   * Run the complete feedback flow in a safe, sequential order.
   *
   * The seed is always loaded first. An already-submitted seed returns a
   * successful completion result without creating another comment. Product
   * submissions stop at the first failure and the returned error includes the
   * comment ID and progress so the host can resume without recreating the
   * order rating.
   */
  async submitOrderFeedback(
    input: SubmitOrderFeedbackInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<SubmitOrderFeedbackResult>> {
    const identifier = typeof input?.orderIdentifier === 'string' ? input.orderIdentifier.trim() : '';
    if (!identifier) {
      return { error: { type: 'validation', message: 'Order identifier is required.' } };
    }
    if (!this.validRating(input?.orderRate)) {
      return { error: { type: 'validation', message: 'Order rating must be an integer from 1 to 5.' } };
    }

    let seed: FeedbackSeed;
    if (input.seed) {
      if (input.seed.orderIdentifier !== identifier || !this.validId(input.seed.orderId) ||
        typeof input.seed.hasCommentAlready !== 'boolean' || !Array.isArray(input.seed.items)) {
        return { error: { type: 'validation', message: 'The supplied feedback seed does not match the order identifier.' } };
      }
      seed = input.seed;
    } else {
      const seedResponse = await this.getSeed(identifier, { ...options, cache: false });
      if (seedResponse.error) return seedResponse;
      seed = seedResponse.data;
    }
    const requestedReviews = input?.reviews ?? [];

    if (seed.hasCommentAlready) {
      return {
        data: {
          status: 'already_submitted',
          seed,
          submittedProductCount: 0,
          requestedProductCount: requestedReviews.length
        }
      };
    }

    // A review must originate from this seed. This catches accidentally
    // mixing items from another order before any state-changing request.
    const seedKeys = new Set(seed.items.map(item => `${item.productId}:${item.productVariantId}`));
    const seenKeys = new Set<string>();
    for (const review of requestedReviews) {
      const key = `${review?.item?.productId}:${review?.item?.productVariantId}`;
      if (!review?.item || !seedKeys.has(key) || seenKeys.has(key)) {
        return {
          error: {
            type: 'validation',
            message: 'Each product review must use a unique item from the feedback seed.'
          }
        };
      }
      seenKeys.add(key);
    }

    const ratingResponse = await this.createOrderRating({
      orderId: seed.orderId,
      orderIdentifier: seed.orderIdentifier,
      orderRate: input.orderRate
    }, options);
    if (ratingResponse.error) return ratingResponse;

    const commentId = ratingResponse.data.id;
    let submittedProductCount = 0;
    for (const review of requestedReviews) {
      const productResponse = await this.submitProductReview(
        buildProductReviewInput(review.item, commentId, review.draft),
        options
      );
      if (productResponse.error) {
        return {
          error: {
            ...productResponse.error,
            details: {
              feedback: {
                commentId,
                submittedProductCount,
                requestedProductCount: requestedReviews.length
              },
              ...(productResponse.error.details !== undefined
                ? { cause: productResponse.error.details }
                : {})
            }
          }
        };
      }
      submittedProductCount += 1;
    }

    return {
      data: {
        status: 'submitted',
        seed,
        commentId,
        submittedProductCount,
        requestedProductCount: requestedReviews.length
      }
    };
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
    if (!this.validRating(input?.productRate)) {
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
      const responseData = response.data.data ?? response.data;
      const productStatistics = this.normalizeProductStatistics(
        responseData.productStatistics ?? responseData.product_statistics ?? responseData
      );

      return { data: { productStatistics } };
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
    if (!Array.isArray(images) || images.length === 0) {
      return { error: { type: 'validation', message: 'At least one review image is required.' } };
    }

    for (const image of images) {
      const file = image?.file as Blob | undefined;
      if (!file || typeof file.size !== 'number' || file.size <= 0) {
        return { error: { type: 'validation', message: 'Review images must contain non-empty files.' } };
      }
      if (image.name !== undefined && typeof image.name !== 'string') {
        return { error: { type: 'validation', message: 'Review image names must be strings.' } };
      }
      if (image.alt !== undefined && typeof image.alt !== 'string') {
        return { error: { type: 'validation', message: 'Review image alt text must be strings.' } };
      }
    }

    const formData = new FormData();

    images.forEach((image, index) => {
      const name = image.name?.trim() || `image-${index + 1}`;
      const alt = image.alt?.trim() ?? '';
      // Supplying the filename also makes Blob inputs behave like File inputs.
      formData.append('images[][file]', image.file, name);
      formData.append('images[][name]', name);
      formData.append('images[][alt]', alt);
    });

    const uploadHeaders = { ...options?.headers };
    Object.keys(uploadHeaders)
      .filter(key => key.toLowerCase() === 'content-type')
      .forEach(key => delete uploadHeaders[key]);
    const response = await this.http.post<any>(FEEDBACKS_PUBLIC_UPLOAD_API, formData, {
      ...options,
      headers: uploadHeaders
    });

    if (response.data) {
      const rawList = Array.isArray(response.data.images)
        ? response.data.images
        : Array.isArray(response.data.data?.images)
          ? response.data.data.images
          : Array.isArray(response.data.result?.images)
            ? response.data.result.images
            : [];
      const list = rawList.map((image: any) => {
        const serveKey = image?.serveKey ?? image?.serve_key;
        if (serveKey === undefined || serveKey === null || !String(serveKey).trim()) return null;
        return {
          id: String(image?.id ?? ''),
          url: String(image?.url ?? ''),
          alt: String(image?.alt ?? ''),
          serveUrl: String(image?.serveUrl ?? image?.serve_url ?? ''),
          serveKey: String(serveKey).trim()
        } satisfies ReviewUploadedImage;
      });
      if (!list.length || list.some((image: ReviewUploadedImage | null) => image === null)) {
        return { error: { type: 'api', message: 'Upload response did not contain completed serve keys.' } };
      }
      return { data: { images: list as ReviewUploadedImage[] } };
    }

    return response;
  }

}
