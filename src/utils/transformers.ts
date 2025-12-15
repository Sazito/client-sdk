/**
 * API Data Transformers
 * Convert between SDK-friendly camelCase and backend snake_case
 */

/**
 * Field name mapping for beautification
 * Maps backend field names to more developer-friendly SDK names
 */
const FIELD_NAME_MAP: Record<string, string> = {
  // Quantity/Count fields
  no_of_items: 'quantity',

  // Price fields
  single_item_price: 'unitPrice',
  total_items_price: 'lineTotal',
  items_total_raw_price: 'totalOriginalPrice',
  items_discount: 'totalDiscount',
  customer_profit: 'savings',
  customer_profit_percentage: 'savingsPercentage',
  total_amount: 'totalAmount',
  net_total: 'subtotal',
  gross_total: 'total',
  final_total: 'finalTotal',
  discount_total: 'discountTotal',
  shipping_total: 'shippingTotal',
  tax_total: 'taxTotal',

  // Identifier fields
  unique_identifier: 'identifier',
  invoice_identifier: 'identifier',
  payment_identifier: 'identifier',
  shipping_address_identifier: 'identifier',

  // User/Address fields
  first_name: 'firstName',
  last_name: 'lastName',
  mobile_phone: 'mobilePhone',
  phone_number: 'phoneNumber',
  postal_code: 'postalCode',
  user_comment: 'comment',

  // Product fields
  product_id: 'productId',
  variant_id: 'variantId',
  product_name: 'name',
  product_image: 'image',
  product_variant: 'variant',
  product_variants: 'variants',
  product_categories: 'categories',
  product_attributes: 'attributes',
  product_type: 'productType',
  short_description: 'shortDescription',
  stock_quantity: 'stockQuantity',
  stock_number: 'stockQuantity',
  sale_price: 'salePrice',
  raw_price: 'originalPrice',
  has_max_order: 'hasMaxOrder',
  max_no_of_order: 'maxOrderQuantity',
  min_order_count: 'minOrderQuantity',
  sold_count: 'soldCount',
  static_url: 'staticUrl',
  dynamic_form_id: 'dynamicFormId',
  event_entity_id: 'eventEntityId',
  theme_config: 'themeConfig',
  image_id: 'imageId',
  is_stock_managed: 'isStockManaged',
  commercial_files: 'commercialFiles',
  sort_index: 'sortIndex',
  attribute_type: 'attributeType',

  // Cart fields
  cart_products: 'items',
  cart_product_id: 'cartProductId',

  // Invoice fields
  invoice_items: 'items',

  // Product list fields
  products: 'items',
  total_count: 'total',

  // Shipping fields
  shipping_method_needed: 'needsShipping',
  shipping_method: 'shippingMethod',
  shipping_address: 'shippingAddress',
  shipping_items: 'shippingItems',
  delivery_time: 'deliveryTime',
  min_delivery_days: 'minDays',
  max_delivery_days: 'maxDays',

  // Payment fields
  payment_type: 'paymentType',
  payment_types: 'methods',
  reference_code: 'code',
  is_default: 'isDefault',

  // Boolean fields
  is_available: 'isAvailable',
  delete_coupon: 'deleteCoupon',

  // Form fields
  form_attributes: 'formAttributes',
  booking_attributes: 'bookingAttributes',
  readable_form_attr: 'formFields',

  // Date fields
  created_at: 'createdAt',
  updated_at: 'updatedAt',

  // Pagination fields
  page_number: 'page',
  page_size: 'pageSize',
  total_count_raw: 'totalCountRaw',
  max_price: 'maxPrice',
  min_price: 'minPrice',
  stock_alert_limit: 'stockAlertLimit',
  sub_categories: 'subCategories',

  // Order fields
  order_number: 'orderNumber',

  // Sort fields
  sort_order: 'sortOrder',

  // Filter fields
  pinned_ids: 'pinnedIds',

  // Region/City fields
  region_id: 'regionId',
  city_id: 'cityId',
  parent_id: 'parentId',

  // Discount fields
  discount_code: 'discountCode',

  // Entity route fields
  entity_name: 'entityType',
  entity_id: 'entityId',
  other_props: 'entity',

  // Shipping method/rate fields
  shipping_methods: 'shippingMethods',
  shipping_rates: 'shippingRates',
  grouped_shipping_rates: 'groupedShippingRates',
  items_shipping_rate: 'itemsShippingRate',
  shipping_rate: 'shippingRate',
  rate_id: 'rateId',
  invoice_item_id: 'invoiceItemId',
  invoice_item_ids: 'invoiceItemIds',

  // Scheduler/Booking fields
  scheduler_booking_attributes: 'schedulerBookingAttributes',

  // Inventory fields
  inventory_count: 'inventoryCount',

  // Order fields (additional)
  order_identifier: 'orderIdentifier',
  self_only: 'selfOnly',

  // Coupon fields
  coupon: 'coupon',

  // Coordinates fields
  user_set_coordinates_before: 'userSetCoordinatesBefore',

  // Image fields
  alt: 'alt',
  url: 'url'
};

/**
 * Reverse mapping for request transformation
 */
const REVERSE_FIELD_NAME_MAP: Record<string, string> = Object.entries(FIELD_NAME_MAP).reduce(
  (acc, [key, value]) => {
    // Only add to reverse map if the value doesn't already exist
    // This prevents conflicts (e.g., both cart_products and invoice_items → items)
    if (!acc[value]) {
      acc[value] = key;
    }
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Convert snake_case string to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Check if value is a plain object
 */
function isPlainObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

/**
 * Transform object keys from snake_case to camelCase with field name beautification
 * @param obj - Object to transform
 * @returns Transformed object with camelCase keys and beautiful field names
 */
export function transformResponseKeys(obj: any): any {
  if (!isPlainObject(obj)) {
    if (Array.isArray(obj)) {
      return obj.map(item => transformResponseKeys(item));
    }
    return obj;
  }

  const transformed: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // First try to use the beautiful field name mapping
    let newKey = FIELD_NAME_MAP[key];

    // If no mapping exists, convert snake_case to camelCase
    if (!newKey) {
      newKey = snakeToCamel(key);
    }

    // Recursively transform nested objects and arrays
    if (isPlainObject(value)) {
      transformed[newKey] = transformResponseKeys(value);
    } else if (Array.isArray(value)) {
      transformed[newKey] = value.map(item => transformResponseKeys(item));
    } else {
      transformed[newKey] = value;
    }
  }

  return transformed;
}

/**
 * Transform object keys from camelCase to snake_case for API requests
 * @param obj - Object to transform
 * @returns Transformed object with snake_case keys
 */
export function transformRequestKeys(obj: any): any {
  if (!isPlainObject(obj)) {
    if (Array.isArray(obj)) {
      return obj.map(item => transformRequestKeys(item));
    }
    return obj;
  }

  const transformed: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // First try to use the reverse mapping for known fields
    let newKey = REVERSE_FIELD_NAME_MAP[key];

    // If no mapping exists, convert camelCase to snake_case
    if (!newKey) {
      newKey = camelToSnake(key);
    }

    // Recursively transform nested objects and arrays
    if (isPlainObject(value)) {
      transformed[newKey] = transformRequestKeys(value);
    } else if (Array.isArray(value)) {
      transformed[newKey] = value.map(item => transformRequestKeys(item));
    } else {
      transformed[newKey] = value;
    }
  }

  return transformed;
}

/**
 * Transform API response data structure
 * Unwraps the { data: { result: { ... } } } structure and transforms keys
 */
export function transformApiResponse<T = any>(response: any): T {
  // Handle standard Sazito API response structure
  if (response?.data?.result) {
    const result = response.data.result;

    // If result has a single key (e.g., { product: {...} }, { cart: {...} })
    // extract and transform that entity
    const keys = Object.keys(result);
    if (keys.length === 1 && isPlainObject(result[keys[0]])) {
      return transformResponseKeys(result[keys[0]]) as T;
    }

    // Otherwise transform the entire result object
    return transformResponseKeys(result) as T;
  }

  // If already unwrapped, just transform keys
  return transformResponseKeys(response) as T;
}

/**
 * Specific transformer for cart responses
 * Handles the cart-specific data structure
 */
export function transformCartResponse(response: any): any {
  const cart = transformApiResponse(response);

  // Additional cart-specific transformations
  if (cart.items && Array.isArray(cart.items)) {
    cart.items = cart.items.map((item: any) => ({
      ...item,
      // Flatten product variant structure
      product: {
        variantId: item.variant?.id || item.product?.variantId,
        productId: item.variant?.product?.id || item.product?.productId,
        name: item.name || item.product?.name,
        image: item.image || item.product?.image,
        attributes: item.attributes || item.product?.attributes || [],
        hasMaxOrder: item.product?.hasMaxOrder || false,
        maxOrderQuantity: item.product?.maxOrderQuantity,
        minOrderQuantity: item.product?.minOrderQuantity
      }
    }));
  }

  return cart;
}

/**
 * Specific transformer for invoice responses
 * Handles the invoice-specific data structure
 */
export function transformInvoiceResponse(response: any): any {
  const invoice = transformApiResponse(response);

  // Additional invoice-specific transformations
  if (invoice.items && Array.isArray(invoice.items)) {
    invoice.items = invoice.items.map((item: any) => ({
      ...item,
      // Calculate discount from original price if not present
      discount: item.discount || (item.originalPrice ? item.originalPrice - item.unitPrice : 0)
    }));
  }

  return invoice;
}

/**
 * Clean product object by removing unwanted fields
 */
function cleanProduct(product: any): any {
  if (!product) return product;

  // Fields to remove from product
  const {
    staticUrl,
    summary,
    themeConfig,
    dynamicFormId,
    eventEntityId,
    attributes,
    tags,
    slug,
    ...cleanedProduct
  } = product;

  // Clean variants
  if (cleanedProduct.variants && Array.isArray(cleanedProduct.variants)) {
    cleanedProduct.variants = cleanedProduct.variants.map((variant: any) => {
      const {
        title,
        weight,
        product: nestedProduct,
        status,
        soldCount,
        dynamicFormId,
        ...cleanedVariant
      } = variant;
      return cleanedVariant;
    });
  }

  // Clean categories - keep only id, name, url
  if (cleanedProduct.categories && Array.isArray(cleanedProduct.categories)) {
    cleanedProduct.categories = cleanedProduct.categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      url: category.url
    }));
  }

  // Clean images - remove widthRatio, heightRatio, thumb
  if (cleanedProduct.images && Array.isArray(cleanedProduct.images)) {
    cleanedProduct.images = cleanedProduct.images.map((image: any) => {
      const {
        widthRatio,
        heightRatio,
        thumb,
        ...cleanedImage
      } = image;
      return cleanedImage;
    });
  }

  return cleanedProduct;
}

/**
 * Specific transformer for product list responses
 * Handles paginated product lists
 */
export function transformProductListResponse(response: any): any {
  const transformed = transformApiResponse(response);

  // Handle pagination structure
  if (transformed.items && Array.isArray(transformed.items)) {
    return {
      items: transformed.items.map((item: any) => cleanProduct(item)),
      total: transformed.total || transformed.items.length,
      page: transformed.page || 1,
      pageSize: transformed.pageSize || transformed.items.length,
      totalPages: transformed.totalPages || Math.ceil((transformed.total || transformed.items.length) / (transformed.pageSize || transformed.items.length))
    };
  }

  return transformed;
}

/**
 * Specific transformer for search responses
 * Search API returns multiple entity types (products, blog_pages, cms_pages, product_categories)
 * NOTE: Data comes already transformed to camelCase by http-client
 */
export function transformSearchResponse(data: any): any {
  if (!data) return data;

  const response: any = {
    products: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20
    },
    blogPages: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20
    },
    cmsPages: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20
    },
    productCategories: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20
    }
  };

  // Extract products
  if (data.items && Array.isArray(data.items)) {
    response.products.items = data.items.map((product: any) => cleanProduct(product));
    response.products.total = data.productsCount || 0;
    response.products.page = data.productsPageNumber || 1;
    response.products.pageSize = data.productsPageSize || 20;
  }

  // Extract blog pages
  if (data.blogPages && Array.isArray(data.blogPages)) {
    response.blogPages.items = data.blogPages;
    response.blogPages.total = data.blogPagesCount || 0;
    response.blogPages.page = data.blogPagesPageNumber || 1;
    response.blogPages.pageSize = data.blogPagesPageSize || 20;
  }

  // Extract CMS pages
  if (data.cmsPages && Array.isArray(data.cmsPages)) {
    response.cmsPages.items = data.cmsPages;
    response.cmsPages.total = data.cmsPagesCount || 0;
    response.cmsPages.page = data.cmsPagesPageNumber || 1;
    response.cmsPages.pageSize = data.cmsPagesPageSize || 20;
  }

  // Extract product categories
  if (data.productCategories && Array.isArray(data.productCategories)) {
    response.productCategories.items = data.productCategories;
    response.productCategories.total = data.productCategoriesCount || 0;
    response.productCategories.page = data.productCategoriesPageNumber || 1;
    response.productCategories.pageSize = data.productCategoriesPageSize || 20;
  }

  return response;
}

/**
 * Transform shipping address input for API request
 */
export function transformShippingAddressInput(input: any): any {
  return {
    shipping_address: transformRequestKeys(input)
  };
}

/**
 * Transform add to cart input for API request
 */
export function transformAddToCartInput(variantId: number, quantity: number, formAttributes?: any): any {
  const input: any = {
    product_variants: [
      {
        id: variantId,
        count: quantity
      }
    ]
  };

  if (formAttributes) {
    input.form_attributes = transformRequestKeys(formAttributes);
  }

  return input;
}

/**
 * Transform create cart input for API request
 */
export function transformCreateCartInput(input: any): any {
  const transformed: any = {
    product_variants: input.productVariants?.map((variant: any) => ({
      id: variant.id || variant.variantId,
      count: variant.count || variant.quantity,
      form_attributes: variant.formAttributes ? transformRequestKeys(variant.formAttributes) : undefined
    })) || []
  };

  if (input.coupon) {
    transformed.coupon = input.coupon;
  }

  return transformed;
}

/**
 * Extract and transform specific fields from response
 * Useful for extracting nested data
 */
export function extractField<T = any>(response: any, fieldPath: string): T | undefined {
  const transformed = transformApiResponse(response);
  const parts = fieldPath.split('.');

  let current = transformed;
  for (const part of parts) {
    if (current?.[part] === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current as T;
}

/**
 * Transform payment methods response
 */
export function transformPaymentMethodsResponse(response: any): any {
  const result = transformApiResponse(response);

  // Rename paymentTypes to methods if it exists
  if (result.paymentTypes) {
    return {
      methods: result.paymentTypes
    };
  }

  return result;
}
