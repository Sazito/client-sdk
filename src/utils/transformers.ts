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

  // CMS fields
  title: 'name',  // CMS pages use 'title' field which we map to 'name'
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
  url: 'url',

  // Shop feature flags (General API)
  activate_add_to_cart_alert: 'addToCardAlert',
  activate_advanced_card_to_card: 'advancedCardToCard',
  activate_ayria_payment_customization: 'ayriaPaymentGateway',
  activate_azki_payment_customization: 'azkiPaymentGateway',
  activate_bazar_payment_customization: 'bazarPaymentGateway',
  activate_blog: 'shopBlog',
  activate_card_to_card_payment: 'cardToCardPayment',
  activate_checkout_dynamic_form: 'checkoutDynamicForm',
  activate_different_register_customization: 'multiTypeRegister',
  activate_digipay_payment: 'digipayPaymentGateway',
  activate_digipay_payment_customization: 'digipayPaymentGateway',
  activate_filter_products: 'productFilters',
  activate_ghesta_payment_customization: 'ghestaPaymentGateway',
  activate_mega_footer: 'megaFooter',
  activate_mellat_payment_customization: 'mellatPaymentGateway',
  activate_min_basket: 'checkoutMinimumAmount',
  activate_novapay_payment_customization: 'novapayPaymentGateway',
  activate_ozon_payment_customization: 'ozonPaymentGateway',
  activate_payment_in_place: 'paymentInPlace',
  activate_payping_payment: 'paypingPaymentGateway',
  activate_pec_payment_customization: 'pecPaymentGateway',
  activate_sabin_payment_customization: 'sabinPaymentGateway',
  activate_sadad_payment_customization: 'sadadPaymentGateway',
  activate_search: 'shopSearch',
  activate_sep_payment_customization: 'sepPaymentGateway',
  activate_shop_vat: 'shopVat',
  activate_snapppay_payment_customization: 'snapppayPaymentGateway',
  activate_tajrobe: 'tajrobe',
  activate_tara_payment_customization: 'taraPaymentGateway',
  activate_theme_config_settings: 'themeConfigSettings',
  activate_toman_payment_customization: 'tomanPaymentGateway',
  activate_torobpay_payment_customization: 'torobpayPaymentGateway',
  activate_up_payment_customization: 'asanpardakhtPaymentGateway',
  activate_vandar_payment_customization: 'vandarPaymentGateway',
  activate_wallet: 'wallet',
  activate_yourgate_payment_customization: 'yourgatePaymentGateway',
  activate_zarinpal_payment: 'zarinpalPaymentGateway',
  activate_zarinplus_payment_customization: 'zarinplusPaymentGateway',
  activate_zibal_payment_customization: 'zibalPaymentGateway',
  activate_zify_payment_customization: 'zifyPaymentGateway',
  disable_ordering: 'disableOrdering',
  pwa: 'progressiveWebApp',
  remove_front_basket: 'hideCheckout',
  remove_front_taint: 'sazitoBrandingRemoval'
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
 * Specific transformer for general info response
 * Merges 'general' and 'shop' fields into a single 'shop' field
 */
export function transformGeneralInfoResponse(data: any): any {
  if (!data) return data;

  const { general, shop, ...rest } = data;

  // Merge general and shop into a single shop object
  const mergedShop = {
    ...general,
    ...shop
  };

  return {
    ...rest,
    shop: mergedShop
  };
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
    tags,
    slug,
    ...cleanedProduct
  } = product;

  // Clean variants
  if (cleanedProduct.variants && Array.isArray(cleanedProduct.variants)) {
    cleanedProduct.variants = cleanedProduct.variants.map((variant: any) => {
      const {
        title,
        product: nestedProduct,
        status,
        soldCount,
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

  // Extract products (API returns as "products" but HTTP client converts to "items")
  if (data.items && Array.isArray(data.items)) {
    response.products.items = data.items.map((product: any) => cleanProduct(product));
    response.products.total = data.productsCount || 0;
    response.products.page = data.productsPageNumber || 1;
    response.products.pageSize = data.productsPageSize || 20;
  }

  // Extract blog pages
  if (data.blogPages && Array.isArray(data.blogPages)) {
    response.blogPages.items = data.blogPages.map((page: any) => cleanCmsPage(page));
    response.blogPages.total = data.blogPagesCount || 0;
    response.blogPages.page = data.blogPagesPageNumber || 1;
    response.blogPages.pageSize = data.blogPagesPageSize || 20;
  }

  // Extract CMS pages
  if (data.cmsPages && Array.isArray(data.cmsPages)) {
    response.cmsPages.items = data.cmsPages.map((page: any) => cleanCmsPage(page));
    response.cmsPages.total = data.cmsPagesCount || 0;
    response.cmsPages.page = data.cmsPagesPageNumber || 1;
    response.cmsPages.pageSize = data.cmsPagesPageSize || 20;
  }

  // Extract product categories (API returns as "product_categories" but HTTP client converts to "categories")
  if (data.categories && Array.isArray(data.categories)) {
    response.productCategories.items = data.categories.map((cat: any) => cleanCategory(cat));
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

/**
 * Clean category object by removing unwanted fields
 */
function cleanCategory(category: any): any {
  if (!category) return category;

  // Fields to remove from category
  const {
    staticUrl,
    products,
    items,  // Always null in list responses
    ...cleanedCategory
  } = category;

  return cleanedCategory;
}

/**
 * Clean CMS/Blog page object by removing unwanted fields
 */
function cleanCmsPage(page: any): any {
  if (!page) return page;

  // Fields to remove from CMS/blog page
  const {
    staticUrl,
    ...cleanedPage
  } = page;

  return cleanedPage;
}

/**
 * Specific transformer for entity route responses
 * Cleans entity data based on entity type
 */
export function transformEntityRouteResponse(response: any): any {
  const transformed = transformApiResponse(response);

  if (!transformed || !transformed.route) {
    return transformed;
  }

  const route = transformed.route;

  // Clean entity based on type
  if (route.entity) {
    switch (route.entityType) {
      case 'product':
        route.entity = cleanProduct(route.entity);
        break;
      case 'product_category':
        route.entity = cleanCategory(route.entity);
        break;
      case 'cms_page':
      case 'blog_page':
        route.entity = cleanCmsPage(route.entity);
        break;
    }

    // Remove duplicate id from entity since we have entityId at root
    const { id, ...entityWithoutId } = route.entity;
    route.entity = entityWithoutId;

    // Add url field at root level from entity.url
    if (!route.url && route.entity.url) {
      route.url = route.entity.url;
    }
  }

  return route;
}

/**
 * Clean category tree node recursively
 */
function cleanCategoryTreeNode(node: any): any {
  if (!node) return node;

  const cleanedNode = { ...node };

  // Clean the entity if it exists
  if (cleanedNode.entity) {
    cleanedNode.entity = cleanCategory(cleanedNode.entity);
  }

  // Recursively clean children
  if (cleanedNode.children && Array.isArray(cleanedNode.children)) {
    cleanedNode.children = cleanedNode.children.map(cleanCategoryTreeNode);
  }

  return cleanedNode;
}

/**
 * Specific transformer for category list responses
 * Cleans both the categories array and the tree structure
 */
export function transformCategoryListResponse(response: any): any {
  const transformed = transformApiResponse(response);

  if (!transformed) return transformed;

  // Clean categories array
  if (transformed.categories && Array.isArray(transformed.categories)) {
    transformed.categories = transformed.categories.map(cleanCategory);
  }

  // Clean tree structure
  if (transformed.tree && transformed.tree.treeStructure && transformed.tree.treeStructure.nodes) {
    transformed.tree.treeStructure.nodes = transformed.tree.treeStructure.nodes.map(cleanCategoryTreeNode);
  }

  return transformed;
}

/**
 * Specific transformer for single category responses
 */
export function transformCategoryResponse(response: any): any {
  const transformed = transformApiResponse(response);

  if (!transformed) return transformed;

  // API returns { product_category: {...} } which becomes { productCategory: {...} }
  // Extract the nested category object
  const category = transformed.productCategory || transformed;

  return cleanCategory(category);
}

/**
 * Specific transformer for CMS pages list responses
 * Cleans CMS page data
 */
export function transformCMSListResponse(response: any): any {
  const transformed = transformApiResponse(response);

  if (!transformed) return transformed;

  // Backend returns: { cms_pages: [...], page_number: 1, page_size: 10, total_count: 50 }
  // After transformApiResponse: { cmsPages: [...], page: 1, pageSize: 10, total: 50 }
  // We need to convert to: { items: [...], page: 1, pageSize: 10, total: 50 }

  if (transformed.cmsPages && Array.isArray(transformed.cmsPages)) {
    return {
      items: transformed.cmsPages.map(cleanCmsPage),
      total: transformed.total || transformed.cmsPages.length,
      page: transformed.page || transformed.pageNumber || 1,
      pageSize: transformed.pageSize || transformed.cmsPages.length
    };
  }

  // Fallback: if already has items array
  if (transformed.items && Array.isArray(transformed.items)) {
    return {
      items: transformed.items.map((item: any) => cleanCmsPage(item)),
      total: transformed.total || transformed.items.length,
      page: transformed.page || 1,
      pageSize: transformed.pageSize || transformed.items.length
    };
  }

  return transformed;
}

/**
 * Specific transformer for single CMS page response
 */
export function transformCMSPageResponse(response: any): any {
  const transformed = transformApiResponse(response);

  if (!transformed) return transformed;

  // API returns { cms_page: {...} } which becomes { cmsPage: {...} }
  // Extract the nested page object
  const page = transformed.cmsPage || transformed;

  return cleanCmsPage(page);
}

/**
 * Transform CMS filters to backend format
 * Backend expects: page_number, page_size, filters[] (JSON string)
 */
export function transformCMSFilters(filters?: any): any {
  if (!filters) return {};

  const transformed: any = {};

  // Pagination
  if (filters.page !== undefined) {
    transformed.page_number = filters.page;
  }
  if (filters.pageSize !== undefined) {
    transformed.page_size = filters.pageSize;
  }

  // CMS page type filter
  // Backend expects: filters[]={ "name": "cms_page_types", "value": "blog" }
  if (filters.cmsPageTypes) {
    const pageType = Array.isArray(filters.cmsPageTypes)
      ? filters.cmsPageTypes[0]
      : filters.cmsPageTypes;

    transformed['filters[]'] = JSON.stringify({
      name: 'cms_page_types',
      value: pageType
    });
  }

  return transformed;
}

/**
 * Clean menu node by removing unnecessary fields
 * Recursively cleans nested children
 */
function cleanMenuNode(node: any): any {
  if (!node) return node;

  const cleaned: any = {};

  // Keep only necessary fields
  if (node.entityType) cleaned.entityType = node.entityType;
  if (node.entityId !== undefined) cleaned.entityId = node.entityId;

  // Clean entity (remove staticUrl, id)
  if (node.entity) {
    const { staticUrl, id, ...cleanedEntity } = node.entity;
    if (Object.keys(cleanedEntity).length > 0) {
      cleaned.entity = cleanedEntity;
    }
  }

  // Keep details
  if (node.details) {
    cleaned.details = node.details;
  }

  // Recursively clean children
  if (node.children && Array.isArray(node.children)) {
    cleaned.children = node.children.map((child: any) => cleanMenuNode(child));
  }

  return cleaned;
}

/**
 * Transform menu response
 * Cleans menu tree structure recursively
 */
export function transformMenuResponse(response: any): any {
  const transformed = transformApiResponse(response);

  if (!transformed || !transformed.tree) {
    return transformed;
  }

  const tree = transformed.tree;

  // Clean the tree structure recursively
  if (tree.treeStructure && tree.treeStructure.nodes) {
    tree.treeStructure.nodes = tree.treeStructure.nodes.map((node: any) => cleanMenuNode(node));
  }

  return transformed;
}
