/**
 * API Data Transformers
 * Convert between SDK-friendly camelCase and backend snake_case
 */

type NumericLike = number | string;
type BooleanLike = boolean | 'true' | 'false' | '1' | '0' | 1 | 0;
type TransformScalar = string | number | boolean | null | undefined;
type TransformValue = TransformScalar | TransformObject | TransformValue[] | object;

interface TransformObject {
  [key: string]: TransformValue;
}

interface ApiResponseEnvelope {
  data?: {
    result?: TransformObject;
  };
}

const PHONE_REQUEST_FIELDS = new Set(['mobile_phone', 'phone_number']);

/** Convert Persian and Arabic-Indic numerals to ASCII digits. */
export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const value = code >= 0x06f0 ? code - 0x06f0 : code - 0x0660;
    return String(value);
  });
}

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
  items_total_raw_price: 'itemsTotalRawPrice',
  items_discount: 'itemsDiscount',
  customer_profit: 'customerProfit',
  customer_profit_percentage: 'customerProfitPercentage',
  total_amount: 'totalAmount',
  net_total: 'netTotal',
  gross_total: 'grossTotal',
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
  user_comment: 'userComment',

  // Product fields
  product_id: 'productId',
  variant_id: 'variantId',
  product_name: 'name',
  product_image: 'image',
  product_variant: 'variant',
  product_variants: 'variants',
  product_categories: 'categories',
  product_attributes: 'attributes',
  variant_attributes: 'attributes',
  product_type: 'productType',

  // CMS fields
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
  min_basket_limit_violated: 'minBasketLimitViolated',

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
  payment_types: 'paymentTypes',
  payment_amount: 'amount',
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
  discount_usages: 'discountUsages',

  // Coordinates fields
  user_set_coordinates_before: 'userSetCoordinatesBefore',

  // Payment action fields
  show_order: 'showOrder',

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
const FIELD_VALUE_COUNTS: Record<string, number> = Object.values(FIELD_NAME_MAP).reduce(
  (acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

const REVERSE_FIELD_NAME_MAP: Record<string, string> = Object.entries(FIELD_NAME_MAP).reduce(
  (acc, [key, value]) => {
    // Only include values that map to exactly one backend key.
    // Ambiguous values (e.g., identifier, items, name) fall back to camelToSnake.
    if (FIELD_VALUE_COUNTS[value] === 1) {
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
function isPlainObject(value: TransformValue | undefined): value is TransformObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function removeKeys<T extends Record<string, TransformValue>>(obj: T, keys: string[]): Partial<T> {
  const cleaned = { ...obj };
  for (const key of keys) {
    delete (cleaned as Record<string, TransformValue>)[key];
  }
  return cleaned;
}

/**
 * Transform object keys from snake_case to camelCase with field name beautification
 * @param obj - Object to transform
 * @returns Transformed object with camelCase keys and beautiful field names
 */
export function transformResponseKeys(obj: TransformValue | object): TransformValue {
  if (!isPlainObject(obj)) {
    if (Array.isArray(obj)) {
      return obj.map(item => transformResponseKeys(item));
    }
    return obj as TransformValue;
  }

  const transformed: TransformObject = {};

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
export function transformRequestKeys(obj: TransformValue | object): TransformValue {
  if (!isPlainObject(obj)) {
    if (Array.isArray(obj)) {
      return obj.map(item => transformRequestKeys(item));
    }
    return obj as TransformValue;
  }

  const transformed: TransformObject = {};

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
      transformed[newKey] = typeof value === 'string' && PHONE_REQUEST_FIELDS.has(newKey)
        ? toEnglishDigits(value)
        : value;
    }
  }

  return transformed;
}

/**
 * Transform API response data structure
 * Unwraps the { data: { result: { ... } } } structure and transforms keys
 */
export function transformApiResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const envelope = response as ApiResponseEnvelope;

  // Handle standard Sazito API response structure
  if (isPlainObject(envelope?.data?.result)) {
    const result = envelope.data.result;

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
export function transformGeneralInfoResponse<T = TransformObject>(data: TransformValue | object): T {
  if (!data) return {} as T;
  if (!isPlainObject(data)) return {} as T;

  const {
    general,
    shop,
    checkout,
    features,
    wallet,
    tajrobe,
    domain,
    enamad,
    google,
    logo,
    social,
    ...rest
  } = data;

  // Merge general and shop into a single shop object
  const generalObject = isPlainObject(general) ? general : {};
  const shopObject = isPlainObject(shop) ? shop : {};

  const mergedShop = {
    ...generalObject,
    ...shopObject
  };

  const {
    registerType,
    showProductStockNumber,
    ...shopWithoutSettings
  } = mergedShop || {};

  const transformed = {
    ...rest,
    scripts: {
      enamad,
      google
    },
    shop: normalizeGeneralShop({
      ...shopWithoutSettings,
      domain,
      logo,
      social
    }),
    settings: {
      checkout: normalizeGeneralCheckout(checkout),
      features: normalizeGeneralFeatures(features),
      wallet: normalizeGeneralWallet(wallet),
      tajrobe: normalizeGeneralTajrobe(tajrobe),
      registerType: normalizeGeneralRegisterType(registerType),
      showProductStockNumber: normalizeGeneralShowProductStockNumber(showProductStockNumber)
    }
  };

  return transformed as T;
}

function normalizeGeneralCheckout(checkout: TransformValue): TransformObject {
  if (!isPlainObject(checkout)) {
    return {};
  }

  const minBasket = isPlainObject(checkout.minBasket) ? checkout.minBasket : {};
  const minAmountValue = minBasket.minAmount ?? minBasket.minBasket;
  const minAmount = typeof minAmountValue === 'number'
    ? minAmountValue
    : Number(minAmountValue);

  const normalized: TransformObject = {
    ...checkout,
    addToCartAlert: normalizeGeneralShowProductStockNumber(checkout.addToCartAlert),
    dynamicForm: normalizeGeneralShowProductStockNumber(checkout.dynamicForm),
    emailOptional: normalizeGeneralShowProductStockNumber(
      checkout.emailOptional ?? checkout.email_optional
    ),
    preventRedirect: normalizeGeneralShowProductStockNumber(
      checkout.preventRedirect ?? checkout.manual
    ),
    minBasket: {
      enabled: normalizeGeneralShowProductStockNumber(minBasket.enabled),
      minAmount: Number.isFinite(minAmount) ? minAmount : 0
    },
    miniCart: normalizeGeneralShowProductStockNumber(checkout.miniCart),
    postalCodeMandatory: normalizeGeneralShowProductStockNumber(checkout.postalCodeMandatory),
    quickAddToCart: normalizeGeneralShowProductStockNumber(checkout.quickAddToCart)
  };

  delete normalized.manual;
  return normalized;
}

function normalizeGeneralRegisterType(registerType: TransformValue): string {
  return typeof registerType === 'string' ? registerType : '';
}

function normalizeGeneralShowProductStockNumber(value: TransformValue): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, 'enabled')) {
    return normalizeGeneralShowProductStockNumber((value as TransformObject).enabled);
  }

  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }

  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }

  return false;
}

function normalizeGeneralShop(shop: TransformValue): TransformObject {
  if (!isPlainObject(shop)) {
    return {};
  }

  const normalizedShop = { ...shop };

  if (isPlainObject(normalizedShop.city)) {
    const cityWithoutMeta = removeKeys(normalizedShop.city, ['createdAt', 'updatedAt']) as TransformObject;

    let cleanedRegion = cityWithoutMeta.region;
    if (isPlainObject(cleanedRegion)) {
      cleanedRegion = removeKeys(cleanedRegion, ['createdAt', 'updatedAt', 'cities']);
    }

    cityWithoutMeta.region = cleanedRegion;
    normalizedShop.city = cityWithoutMeta;
  }

  return normalizedShop;
}

const FEATURE_FLAG_NAME_MAP: Record<string, string> = {
  addToCardAlert: 'addToCartAlertEnabled',
  addToCartAlert: 'addToCartAlertEnabled',
  advancedCardToCard: 'advancedCardToCardEnabled',
  cardToCardPayment: 'cardToCardPaymentEnabled',
  checkoutDynamicForm: 'checkoutDynamicFormEnabled',
  multiTypeRegister: 'multiTypeRegisterEnabled',
  productFilters: 'productFiltersEnabled',
  megaFooter: 'megaFooterEnabled',
  checkoutMinimumAmount: 'checkoutMinimumAmountEnabled',
  paymentInPlace: 'paymentInPlaceEnabled',
  shopBlog: 'blogEnabled',
  shopSearch: 'searchEnabled',
  shopVat: 'shopVatEnabled',
  tajrobe: 'tajrobeEnabled',
  themeConfigSettings: 'themeConfigSettingsEnabled',
  wallet: 'walletEnabled',
  progressiveWebApp: 'progressiveWebAppEnabled',
  disableOrdering: 'orderingDisabled',
  hideCheckout: 'checkoutHidden',
  sazitoBrandingRemoval: 'sazitoBrandingRemoved',
  ayriaPaymentGateway: 'ayriaPaymentGatewayEnabled',
  azkiPaymentGateway: 'azkiPaymentGatewayEnabled',
  bazarPaymentGateway: 'bazarPaymentGatewayEnabled',
  digipayPaymentGateway: 'digipayPaymentGatewayEnabled',
  ghestaPaymentGateway: 'ghestaPaymentGatewayEnabled',
  mellatPaymentGateway: 'mellatPaymentGatewayEnabled',
  novapayPaymentGateway: 'novapayPaymentGatewayEnabled',
  ozonPaymentGateway: 'ozonPaymentGatewayEnabled',
  paypingPaymentGateway: 'paypingPaymentGatewayEnabled',
  pecPaymentGateway: 'pecPaymentGatewayEnabled',
  sabinPaymentGateway: 'sabinPaymentGatewayEnabled',
  sadadPaymentGateway: 'sadadPaymentGatewayEnabled',
  sepPaymentGateway: 'sepPaymentGatewayEnabled',
  snapppayPaymentGateway: 'snapppayPaymentGatewayEnabled',
  taraPaymentGateway: 'taraPaymentGatewayEnabled',
  tomanPaymentGateway: 'tomanPaymentGatewayEnabled',
  torobpayPaymentGateway: 'torobpayPaymentGatewayEnabled',
  asanpardakhtPaymentGateway: 'asanpardakhtPaymentGatewayEnabled',
  vandarPaymentGateway: 'vandarPaymentGatewayEnabled',
  yourgatePaymentGateway: 'yourgatePaymentGatewayEnabled',
  zarinpalPaymentGateway: 'zarinpalPaymentGatewayEnabled',
  zarinplusPaymentGateway: 'zarinplusPaymentGatewayEnabled',
  zibalPaymentGateway: 'zibalPaymentGatewayEnabled',
  zifyPaymentGateway: 'zifyPaymentGatewayEnabled',
  activateEditOrderCustomization: 'editOrderEnabled',
  activateEditOrderCustomizationEnabled: 'editOrderEnabled'
};

const FEATURE_FLAG_BLOCKLIST = new Set([
  'activateAlopeykAdvanced',
  'activate_alopeyk_advanced'
]);

const FEATURE_FLAG_NAME_BLOCKLIST = new Set([
  'auditLogEnabled',
  'editOrderEnabled',
  'rahkaranAccountingCustomizationEnabled',
  'advancedThemeDesignerEnabled',
  'checkoutHidden',
  'eventPublisherEnabled',
  'exportOrdersEnabled',
  'exportProductsEnabled',
  'exportUsersEnabled',
  'fontCustomizationEnabled',
  'forwardShippingEnabled',
  'podroShippingEnabled',
  'postexShippingEnabled',
  'quotaNotificationsEnabled',
  'recaptchaEnabled',
  'rolePoliciesEnabled',
  'sepidarAccountingCustomizationEnabled',
  'shortUrlEnabled',
  'skuSearchEnabled',
  'snappShopCustomizationEnabled',
  'snappboxShippingEnabled',
  'stockAlertNotificationsEnabled',
  'tapsipackShippingEnabled',
  'themeConfigSettingsEnabled',
  'advancedTextEditorEnabled',
  'advancedShippingEnabled',
  'bulkActionEnabled',
  'discountBulkEnabled',
  'discountCodeEnabled',
  'orderBulkActionEnabled',
  'importProductsEnabled',
  'mahakAccountingCustomizationEnabled',
  'millipayPaymentCustomizationEnabled',
  'orderSmsNotificationsEnabled'
]);

function normalizeFeatureFlagName(rawKey: string): string {
  const camelKey = rawKey.includes('_') ? snakeToCamel(rawKey) : rawKey;
  const mapped = FEATURE_FLAG_NAME_MAP[camelKey];
  if (mapped) return mapped;

  // UX normalization: strip "activate" prefix from unrecognized flags.
  const withoutActivatePrefix = camelKey.startsWith('activate') && camelKey.length > 'activate'.length
    ? `${camelKey.charAt('activate'.length).toLowerCase()}${camelKey.slice('activate'.length + 1)}`
    : camelKey;

  if (
    withoutActivatePrefix.endsWith('Enabled') ||
    withoutActivatePrefix.endsWith('Disabled') ||
    withoutActivatePrefix.endsWith('Hidden') ||
    withoutActivatePrefix.endsWith('Removed')
  ) {
    return withoutActivatePrefix;
  }

  return `${withoutActivatePrefix}Enabled`;
}

function normalizeGeneralFeatures(features: TransformValue): TransformObject {
  if (!isPlainObject(features)) {
    return {};
  }

  const readBooleanish = (value: TransformValue): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
      return undefined;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') return true;
      if (normalized === 'false' || normalized === '0') return false;
      return undefined;
    }
    return undefined;
  };

  const rawFlags: Record<string, boolean> = {};
  const pushFlag = (key: string, value: TransformValue) => {
    if (FEATURE_FLAG_BLOCKLIST.has(key)) return;
    const normalized = readBooleanish(value);
    if (normalized === undefined) return;
    rawFlags[key] = normalized;
  };

  if (isPlainObject(features.flags)) {
    Object.entries(features.flags).forEach(([key, value]) => {
      pushFlag(key, value);
    });
  }

  if (isPlainObject(features.configurations)) {
    Object.entries(features.configurations).forEach(([key, value]) => {
      pushFlag(key, value);
    });
  }

  Object.entries(features).forEach(([key, value]) => {
    if (key === 'flags' || key === 'premium' || key === 'configurations') return;
    if (isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, 'enabled')) {
      pushFlag(key, (value as TransformObject).enabled);
      return;
    }
    pushFlag(key, value);
  });

  const flags: Record<string, boolean> = {};
  Object.entries(rawFlags).forEach(([key, value]) => {
    const normalizedName = normalizeFeatureFlagName(key);
    if (FEATURE_FLAG_NAME_BLOCKLIST.has(normalizedName)) return;
    flags[normalizedName] = value;
  });

  const normalized: TransformObject = { ...flags };
  if (isPlainObject(features.premium)) {
    normalized.premium = features.premium;
  }

  return normalized;
}

function normalizeGeneralWallet(wallet: TransformValue): TransformObject {
  if (!isPlainObject(wallet)) {
    return {};
  }

  const source = isPlainObject(wallet.configurations)
    ? { ...wallet, ...wallet.configurations }
    : { ...wallet };

  const toBoolean = (value: TransformValue): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'true') return true;
    if (value === 0 || value === '0' || value === 'false') return false;
    return undefined;
  };

  const toNumber = (value: TransformValue): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const enabled = toBoolean(source.enabled);
  const useWithDiscount = toBoolean(source.useWithDiscount);
  const minAmount = toNumber(source.minAmount ?? source.walletMinAmount);
  const minAmountRequired = toBoolean(source.minAmountRequired ?? source.walletMinStatus);

  return {
    enabled: enabled ?? false,
    useWithDiscount: useWithDiscount ?? false,
    minAmount: minAmount ?? 0,
    minAmountRequired: minAmountRequired ?? false
  };
}

function normalizeGeneralTajrobe(tajrobe: TransformValue): TransformObject {
  if (!isPlainObject(tajrobe)) {
    return {};
  }

  const source = isPlainObject(tajrobe.configurations)
    ? { ...tajrobe, ...tajrobe.configurations }
    : { ...tajrobe };

  let enabled: boolean = false;
  if (typeof source.enabled === 'boolean') {
    enabled = source.enabled;
  } else if (source.enabled === 1 || source.enabled === '1' || source.enabled === 'true') {
    enabled = true;
  }

  return { enabled };
}

/**
 * Specific transformer for cart responses
 * Handles the cart-specific data structure
 */
export function transformCartResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const cart = transformApiResponse<TransformObject>(response);
  if (!isPlainObject(cart)) {
    return {} as T;
  }

  const items = Array.isArray(cart.items)
    ? cart.items.map((item: TransformValue) => transformCartItem(item))
    : [];

  return {
    ...cart,
    items,
    netTotal: toNumber(cart.netTotal) ?? 0,
    grossTotal: toNumber(cart.grossTotal),
    needsShipping: Boolean(cart.needsShipping),
    minBasketLimitViolated: Boolean(cart.minBasketLimitViolated),
    deleteCoupon: cart.deleteCoupon === undefined ? undefined : Boolean(cart.deleteCoupon)
  } as T;
}

/**
 * Specific transformer for invoice responses
 * Handles the invoice-specific data structure
 */
interface NormalizedAddressRegion {
  id: number;
  name: string;
}

interface RawAddressRegion {
  id?: NumericLike;
  name?: string;
}

interface RawAddressCity {
  id?: NumericLike;
  name?: string;
  regionId?: NumericLike;
  latitude?: NumericLike;
  longitude?: NumericLike;
  region?: RawAddressRegion | NumericLike;
}

interface RawShippingAddress {
  id?: NumericLike;
  identifier?: string;
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
  phoneNumber?: string;
  email?: string;
  region?: RawAddressRegion | NumericLike;
  regionName?: string;
  regionId?: NumericLike;
  city?: RawAddressCity | NumericLike;
  cityName?: string;
  cityId?: NumericLike;
  address?: string;
  postalCode?: string;
  description?: string;
  latitude?: NumericLike;
  longitude?: NumericLike;
  userSetCoordinatesBefore?: BooleanLike;
  user?: RawUserProfile | TransformValue;
}

interface RawUserProfile {
  id?: NumericLike;
  email?: string;
  mobilePhone?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
}

interface NormalizedAddressCity {
  id: number;
  name: string;
  regionId?: number;
  latitude?: number;
  longitude?: number;
}

interface NormalizedShippingAddress {
  id: number;
  identifier: string;
  firstName: string;
  lastName: string;
  mobilePhone?: string;
  phoneNumber?: string;
  email?: string;
  region?: NormalizedAddressRegion;
  city: NormalizedAddressCity;
  address: string;
  postalCode?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  userSetCoordinatesBefore?: boolean;
}

interface NormalizedInvoiceAddressRegion extends NormalizedAddressRegion {
  city: NormalizedAddressCity;
}

interface NormalizedInvoiceShippingAddress {
  identifier: string;
  firstName: string;
  lastName: string;
  mobilePhone?: string;
  phoneNumber?: string;
  email?: string;
  region?: NormalizedInvoiceAddressRegion;
  address: string;
  postalCode?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  userSetCoordinatesBefore?: boolean;
}

interface NormalizedUserProfile {
  id?: number;
  email?: string;
  mobilePhone?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
}

interface RegionNormalizationOptions {
  fallbackId?: number;
  fallbackName?: string;
}

interface CityNormalizationOptions extends RegionNormalizationOptions {
  fallbackRegionId?: number;
}

export function transformInvoiceResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const invoice = transformApiResponse<TransformObject>(response);
  if (!isPlainObject(invoice)) {
    return {} as T;
  }

  const invoiceWithoutUserData = removeKeys(invoice, ['shippingMethod', 'user', 'userData']) as TransformObject;
  const items = Array.isArray(invoice.items)
    ? invoice.items.map((item: TransformValue) => transformInvoiceItem(item))
    : [];

  const discountUsages = Array.isArray(invoice.discountUsages) ? invoice.discountUsages : [];
  const firstDiscountUsage = discountUsages[0];
  const discountCode = isPlainObject(firstDiscountUsage) && isPlainObject(firstDiscountUsage.discountCode)
    ? toOptionalString(firstDiscountUsage.discountCode.code)
    : undefined;
  const shippingAddress = normalizeInvoiceShippingAddress(
    normalizeShippingAddress(invoice.shippingAddress as RawShippingAddress | undefined)
  );

  return {
    ...invoiceWithoutUserData,
    items,
    shippingAddress,
    shippingItems: Array.isArray(invoice.shippingItems)
      ? invoice.shippingItems.map((item: TransformValue) => transformInvoiceShippingItem(item))
      : [],
    discountUsages,
    netTotal: toNumber(invoice.netTotal) ?? 0,
    finalTotal: toNumber(invoice.finalTotal) ?? 0,
    vat: toNumber(invoice.vat) ?? 0,
    vatPercent: toNumber(invoice.vatPercent) ?? 0,
    itemsDiscount: toNumber(invoice.itemsDiscount) ?? 0,
    discountTotal: toNumber(invoice.discountTotal) ?? 0,
    customerProfit: toNumber(invoice.customerProfit) ?? 0,
    customerProfitPercentage: toNumber(invoice.customerProfitPercentage) ?? 0,
    itemsTotalRawPrice: toNumber(invoice.itemsTotalRawPrice) ?? 0,
    couponTotal: toNumber(invoice.couponTotal) ?? 0,
    shippingTotal: toNumber(invoice.shippingTotal) ?? 0,
    creditTotal: toNumber(invoice.creditTotal) ?? 0,
    needsShipping: Boolean(invoice.needsShipping),
    userComment: typeof invoice.userComment === 'string' ? invoice.userComment : undefined,
    discountCode
  } as T;
}

/** Normalize the documented checkout-order contract exactly once. */
export function transformOrderResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const result = unwrapRawResult(response);
  const order = isPlainObject(result.order) ? result.order : result;
  if (!isPlainObject(order)) {
    return {} as T;
  }

  const invoice = isPlainObject(order.invoice) ? order.invoice : {};
  const invoiceItems = Array.isArray(invoice.invoice_items)
    ? invoice.invoice_items.map(transformOrderInvoiceItem)
    : [];
  const shippingItems = Array.isArray(invoice.shipping_items)
    ? invoice.shipping_items.map(transformOrderShippingItem)
    : [];

  return {
    id: toIdentifier(order.id),
    orderNumber: toIdentifier(order.order_number),
    orderIdentifier: toOptionalString(order.order_identifier),
    invoice: {
      invoiceItems,
      shippingItems,
      netTotal: toNumber(invoice.net_total),
      finalTotal: toNumber(invoice.final_total),
      shippingTotal: toNumber(invoice.shipping_total),
      discountTotal: toNumber(invoice.discount_total),
      creditTotal: toNumber(invoice.credit_total),
      vat: toNumber(invoice.vat),
      vatPercent: toNumber(invoice.vat_percent),
      itemsDiscount: toNumber(invoice.items_discount),
      itemsTotalRawPrice: toNumber(invoice.items_total_raw_price),
      customerProfit: toNumber(invoice.customer_profit),
      customerProfitPercentage: toNumber(invoice.customer_profit_percentage),
      discountUsages: Array.isArray(invoice.discount_usages)
        ? invoice.discount_usages.map(transformOrderDiscountUsage)
        : undefined
    }
  } as T;
}

function transformOrderInvoiceItem(item: TransformValue): TransformObject {
  if (!isPlainObject(item)) return {};

  const variant = isPlainObject(item.product_variant) ? item.product_variant : {};
  const product = isPlainObject(variant.product) ? variant.product : {};
  const productVariantId = toNumber(item.product_variant_id);
  const variantAttributes = Array.isArray(item.variant_attributes)
    ? item.variant_attributes.map(transformOrderVariantAttribute)
    : [];
  const singleItemPrice = toNumber(item.single_item_price);
  const noOfItems = toNumber(item.no_of_items);
  const totalItemsPrice = toNumber(item.total_items_price);
  const customerProfit = toNumber(item.customer_profit) ?? 0;
  const commercialFiles = Array.isArray(variant.commercial_files)
    ? variant.commercial_files.map(transformOrderCommercialFile)
    : undefined;
  const productType = toOptionalString(product.product_type);

  return {
    // Stable InvoiceItem fields retained for existing SDK consumers.
    id: toIdentifier(item.id) ?? toIdentifier(item.product_variant_id),
    productVariantId,
    name: toOptionalString(item.name),
    image: isPlainObject(item.image)
      ? { url: toOptionalString(item.image.url) }
      : undefined,
    attributes: variantAttributes,
    quantity: noOfItems,
    unitPrice: singleItemPrice,
    lineTotal: totalItemsPrice,
    rawPrice: singleItemPrice,
    customerProfit,
    commercialFiles,
    productType,
    formAttributes: item.form_attributes,
    bookingAttributes: item.booking_attributes,
    // Direct camelCase mirrors of the process-step response.
    variantAttributes,
    singleItemPrice,
    noOfItems,
    totalItemsPrice,
    productVariant: {
      commercialFiles,
      product: {
        productType
      }
    }
  };
}

function transformOrderShippingItem(item: TransformValue): TransformObject {
  if (!isPlainObject(item) || !isPlainObject(item.rate)) return {};

  return {
    id: toIdentifier(item.id),
    invoiceItemIds: Array.isArray(item.invoice_item_ids)
      ? item.invoice_item_ids
          .map(toIdentifier)
          .filter((id): id is string | number => id !== undefined)
      : [],
    rate: {
      id: toIdentifier(item.rate.id),
      name: toOptionalString(item.rate.name),
      price: toNumber(item.rate.price),
      type: toOptionalString(item.rate.type),
      icon: toOptionalString(item.rate.icon),
      color: toOptionalString(item.rate.color)
    }
  };
}

function transformOrderVariantAttribute(attribute: TransformValue): TransformObject {
  if (!isPlainObject(attribute)) return {};
  return {
    name: toOptionalString(attribute.name),
    value: toOptionalString(attribute.value)
  };
}

function transformOrderCommercialFile(file: TransformValue): TransformObject {
  if (!isPlainObject(file)) return {};
  return { id: toIdentifier(file.id) };
}

function transformOrderDiscountUsage(usage: TransformValue): TransformObject {
  if (!isPlainObject(usage) || !isPlainObject(usage.discount_code)) return {};
  return {
    discountCode: {
      code: toOptionalString(usage.discount_code.code)
    }
  };
}

function unwrapRawResult(response: TransformValue | ApiResponseEnvelope | object): TransformObject {
  if (!isPlainObject(response)) return {};
  if (isPlainObject(response.data) && isPlainObject(response.data.result)) {
    return response.data.result;
  }
  return isPlainObject(response.result) ? response.result : response;
}

/** Normalize order collections and their pagination metadata. */
export function transformOrdersListResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const result = unwrapRawResult(response);
  if (!isPlainObject(result)) {
    return {} as T;
  }

  const orders = Array.isArray(result.orders)
    ? result.orders.map((order) => transformOrderResponse<TransformObject>(order))
    : [];
  const pageNumber = toNumber(result.page_number);
  const pageSize = toNumber(result.page_size);
  const totalCount = toNumber(result.total_count) ?? orders.length;

  return {
    orders,
    totalCount,
    totalCountRaw: toNumber(result.total_count_raw) ?? 0,
    totalNotSeen: toNumber(result.total_not_seen) ?? 0,
    totalSeen: toNumber(result.total_seen) ?? 0,
    ...(pageNumber !== undefined ? { pageNumber } : {}),
    ...(pageSize !== undefined ? { pageSize } : {})
  } as T;
}

/** Normalize wallet transaction collections and their pagination metadata. */
export function transformWalletTransactionsResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const result = transformApiResponse<TransformObject>(response);
  if (!isPlainObject(result)) {
    return {} as T;
  }

  const transactions = Array.isArray(result.transactions)
    ? result.transactions
    : Array.isArray(result.walletTransactions)
      ? result.walletTransactions
      : [];
  const pageNumber = toNumber(result.pageNumber ?? result.page);
  const pageSize = toNumber(result.pageSize);
  const totalCount = toNumber(result.totalCount ?? result.total);
  const resultWithoutGenericPagination = removeKeys(result, [
    'page',
    'total',
    'walletTransactions'
  ]);

  return {
    ...resultWithoutGenericPagination,
    transactions,
    ...(pageNumber !== undefined ? { pageNumber } : {}),
    ...(pageSize !== undefined ? { pageSize } : {}),
    ...(totalCount !== undefined ? { totalCount } : {})
  } as T;
}

export function transformShippingAddressResponse(data: RawShippingAddress): NormalizedShippingAddress | undefined {
  const normalized = normalizeShippingAddress(data);
  return normalized;
}

export function transformUserResponse(data: TransformValue | ApiResponseEnvelope | object): TransformObject | undefined {
  const user = transformApiResponse<TransformObject>(data);
  if (!isPlainObject(user)) {
    return undefined;
  }

  return normalizeUserProfile(user) as TransformObject | undefined;
}

function normalizeUserProfile(user?: TransformValue): NormalizedUserProfile | undefined {
  if (!user) {
    return undefined;
  }

  const userObject = unwrapUserProfileObject(user);
  if (!userObject) {
    return undefined;
  }

  const normalized: NormalizedUserProfile = {};

  const id = toNumber(userObject.id);
  if (id !== undefined) {
    normalized.id = id;
  }

  const email = toOptionalString(userObject.email);
  if (email) {
    normalized.email = email;
  }

  const mobilePhone = toOptionalString(userObject.mobilePhone) ?? toOptionalString(userObject.phoneNumber);
  if (mobilePhone) {
    normalized.mobilePhone = mobilePhone;
  }

  const phoneNumber = toOptionalString(userObject.phoneNumber);
  if (phoneNumber && phoneNumber !== mobilePhone) {
    normalized.phoneNumber = phoneNumber;
  }

  const firstName = toOptionalString(userObject.firstName);
  if (firstName) {
    normalized.firstName = firstName;
  }

  const lastName = toOptionalString(userObject.lastName);
  if (lastName) {
    normalized.lastName = lastName;
  }

  const birthDate = toOptionalString(userObject.birthDate);
  if (birthDate) {
    normalized.birthDate = birthDate;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeShippingAddress(address?: RawShippingAddress): NormalizedShippingAddress | undefined {
  // Fresh invoices may serialize an unselected address as `{}`. Treat that as
  // absent instead of manufacturing a truthy address full of empty defaults.
  if (!address || Object.keys(address).length === 0) {
    return undefined;
  }

  const embeddedUser = normalizeUserProfile(address.user);
  const regionFromAddress = unwrapEntityObject(address.region);
  const cityFromPayload = unwrapEntityObject(address.city);
  const regionFromCity = unwrapEntityObject(cityFromPayload?.region);

  const fallbackRegionName = toOptionalString(address.regionName) ?? toTextLabel(address.region);
  const region = normalizeAddressRegion(regionFromAddress ?? address.region, {
    fallbackId: toNumber(address.regionId),
    fallbackName: fallbackRegionName
  }) ?? normalizeAddressRegion(regionFromCity, {
    fallbackId: toNumber(address.regionId),
    fallbackName: fallbackRegionName
  });

  const regionId = toNumber(address.regionId) ?? region?.id;
  const fallbackCityName = toOptionalString(address.cityName)
    ?? toOptionalString(cityFromPayload?.name)
    ?? toTextLabel(address.city);
  const city = normalizeAddressCity(cityFromPayload ?? address.city, {
    fallbackId: toNumber(address.cityId),
    fallbackName: fallbackCityName,
    fallbackRegionId: regionId
  });
  const firstName = toOptionalString(address.firstName) ?? embeddedUser?.firstName ?? '';
  const lastName = toOptionalString(address.lastName) ?? embeddedUser?.lastName ?? '';

  const normalized: NormalizedShippingAddress = {
    id: toNumber(address.id) ?? 0,
    identifier: toOptionalString(address.identifier) ?? '',
    firstName,
    lastName,
    city: city ?? {
      id: toNumber(address.cityId ?? address.city) ?? 0,
      name: fallbackCityName ?? '',
      ...(regionId !== undefined ? { regionId } : {})
    },
    address: toOptionalString(address.address) ?? ''
  };

  const mobilePhone = toOptionalString(address.mobilePhone)
    ?? toOptionalString(address.phoneNumber)
    ?? embeddedUser?.mobilePhone
    ?? embeddedUser?.phoneNumber;
  const phoneNumber = toOptionalString(address.phoneNumber) ?? embeddedUser?.phoneNumber;
  if (mobilePhone) {
    normalized.mobilePhone = mobilePhone;
  }
  if (phoneNumber && phoneNumber !== mobilePhone) {
    normalized.phoneNumber = phoneNumber;
  }

  const email = toOptionalString(address.email) ?? embeddedUser?.email;
  if (email) {
    normalized.email = email;
  }

  if (region) {
    normalized.region = region;
  }

  const postalCode = toOptionalString(address.postalCode);
  if (postalCode) {
    normalized.postalCode = postalCode;
  }

  const description = toOptionalString(address.description);
  if (description) {
    normalized.description = description;
  }

  const latitude = toNumber(address.latitude);
  if (latitude !== undefined) {
    normalized.latitude = latitude;
  }

  const longitude = toNumber(address.longitude);
  if (longitude !== undefined) {
    normalized.longitude = longitude;
  }

  const userSetCoordinatesBefore = toOptionalBoolean(address.userSetCoordinatesBefore);
  if (userSetCoordinatesBefore !== undefined) {
    normalized.userSetCoordinatesBefore = userSetCoordinatesBefore;
  }

  return normalized;
}

function normalizeInvoiceShippingAddress(
  address?: NormalizedShippingAddress
): NormalizedInvoiceShippingAddress | undefined {
  if (!address) {
    return undefined;
  }

  const { id, city, region, ...invoiceAddress } = address;
  void id;
  const invoiceRegion: NormalizedInvoiceAddressRegion = {
    id: region?.id ?? city.regionId ?? 0,
    name: region?.name ?? '',
    city
  };

  return {
    ...invoiceAddress,
    region: invoiceRegion
  };
}

function normalizeAddressRegion(
  region: TransformValue | undefined,
  options: RegionNormalizationOptions = {}
): NormalizedAddressRegion | undefined {
  if (region === undefined || region === null) {
    return undefined;
  }

  const regionObject = unwrapEntityObject(region);
  const id = toNumber(regionObject?.id) ?? toNumber(region) ?? options.fallbackId;
  const name = toOptionalString(regionObject?.name)
    ?? toTextLabel(region)
    ?? options.fallbackName;
  if (id === undefined || !name) {
    return undefined;
  }

  return { id, name };
}

function normalizeAddressCity(
  city: TransformValue | undefined,
  options: CityNormalizationOptions = {}
): NormalizedAddressCity | undefined {
  if (city === undefined || city === null) {
    return undefined;
  }

  const cityObject = unwrapEntityObject(city);
  const id = toNumber(cityObject?.id) ?? toNumber(city) ?? options.fallbackId;
  const name = toOptionalString(cityObject?.name)
    ?? toTextLabel(city)
    ?? options.fallbackName;
  if (id === undefined || !name) {
    return undefined;
  }

  const normalized: NormalizedAddressCity = { id, name };

  const regionId = toNumber(cityObject?.regionId) ?? options.fallbackRegionId;
  if (regionId !== undefined) {
    normalized.regionId = regionId;
  }

  const latitude = toNumber(cityObject?.latitude);
  if (latitude !== undefined) {
    normalized.latitude = latitude;
  }

  const longitude = toNumber(cityObject?.longitude);
  if (longitude !== undefined) {
    normalized.longitude = longitude;
  }

  return normalized;
}

function unwrapEntityObject(value: TransformValue | undefined): TransformObject | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  // Some address payloads wrap entities as { data: { ... } }.
  if (isPlainObject(value.data)) {
    return value.data;
  }

  return value;
}

function unwrapUserProfileObject(value: TransformValue | undefined): TransformObject | undefined {
  const userObject = unwrapEntityObject(value);
  if (!userObject) {
    return undefined;
  }

  // Some payloads may wrap user as { user: { ... } }.
  if (
    Object.keys(userObject).length === 1 &&
    isPlainObject(userObject.user)
  ) {
    return unwrapEntityObject(userObject.user) ?? userObject.user;
  }

  return userObject;
}

function toTextLabel(value: TransformValue | undefined): string | undefined {
  const label = toOptionalString(value);
  if (!label) {
    return undefined;
  }

  return toNumber(label) === undefined ? label : undefined;
}

function transformInvoiceShippingItem(item: TransformValue): TransformValue {
  if (!isPlainObject(item)) {
    return {};
  }

  const rate = isPlainObject(item.rate)
    ? item.rate
    : isPlainObject(item.shippingRate)
      ? item.shippingRate
      : isPlainObject(item.shippingMethod)
        ? item.shippingMethod
        : item;

  return {
    invoiceItemIds: normalizeInvoiceItemIds(item),
    rate: normalizeShippingRate(rate)
  };
}

function normalizeInvoiceItemIds(item: TransformObject): Array<string | number> {
  const sourceIds = Array.isArray(item.invoiceItemIds)
    ? item.invoiceItemIds
    : item.invoiceItemId !== undefined
      ? [item.invoiceItemId]
      : [];

  return sourceIds
    .map((id: TransformValue) => toIdentifier(id))
    .filter((id): id is string | number => id !== undefined);
}

function toNumber(value: TransformValue | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalString(value: TransformValue | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toOptionalBoolean(value: TransformValue | undefined): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }

  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }

  return undefined;
}

function toIdentifier(value: TransformValue | undefined): string | number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  return undefined;
}

function transformCartItem(item: TransformValue): TransformObject {
  if (!isPlainObject(item)) {
    return {};
  }

  const product = transformCheckoutProduct(item);
  const productVariantId = toNumber(item.productVariantId ?? product.variantId) ?? product.variantId;

  return {
    id: toIdentifier(item.id ?? item.cartProductId) ?? '',
    createdAt: toOptionalString(item.createdAt),
    updatedAt: toOptionalString(item.updatedAt),
    productVariantId,
    quantity: toNumber(item.quantity) ?? 0,
    unitPrice: toNumber(item.unitPrice) ?? 0,
    lineTotal: toNumber(item.lineTotal) ?? 0,
    product,
    formAttributes: item.formAttributes,
    formFields: item.formFields,
    bookingAttributes: item.bookingAttributes
  };
}

function transformInvoiceItem(item: TransformValue): TransformObject {
  if (!isPlainObject(item)) {
    return {};
  }

  const product = transformCheckoutProduct(item);
  const productVariantId = toNumber(item.productVariantId ?? product.variantId) ?? product.variantId;
  const attributes = Array.isArray(product.attributes) ? product.attributes : [];
  const hasMaxOrder = toOptionalBoolean(product.hasMaxOrder ?? item.hasMaxOrder);

  return {
    id: toIdentifier(item.id ?? item.invoiceItemId ?? item.cartProductId) ?? '',
    productVariantId,
    productId: toNumber(product.productId ?? item.productId),
    name: toOptionalString(item.name) ?? toOptionalString(product.name) ?? '',
    url: toOptionalString(product.url) ?? toOptionalString(item.url),
    attributes,
    productType: toOptionalString(product.productType) ?? toOptionalString(item.productType),
    hasMaxOrder,
    maxOrderQuantity: toNumber(product.maxOrderQuantity ?? item.maxOrderQuantity),
    minOrderQuantity: toNumber(product.minOrderQuantity ?? item.minOrderQuantity),
    image: cleanImage(item.image ?? product.image),
    quantity: toNumber(item.quantity) ?? 0,
    unitPrice: toNumber(item.unitPrice) ?? 0,
    lineTotal: toNumber(item.lineTotal) ?? 0,
    rawPrice: toNumber(item.rawPrice ?? item.originalPrice) ?? 0,
    customerProfit: toNumber(item.customerProfit) ?? 0,
    commercialFiles: item.commercialFiles,
    formAttributes: item.formAttributes,
    bookingAttributes: item.bookingAttributes,
    formFields: item.formFields
  };
}

function transformCheckoutProduct(source: TransformValue): TransformObject {
  if (!isPlainObject(source)) {
    return {
      variantId: 0,
      name: '',
      attributes: []
    };
  }

  const variant = isPlainObject(source.variant) ? source.variant : undefined;
  const variantProduct = isPlainObject(variant?.product) ? variant.product : undefined;
  const product = isPlainObject(source.product) ? source.product : undefined;

  const variantId = toNumber(
    product?.variantId ?? variant?.id ?? source.productVariantId ?? source.variantId
  ) ?? 0;
  const attributes = Array.isArray(product?.attributes)
    ? product.attributes
    : Array.isArray(variant?.attributes)
      ? variant.attributes
      : Array.isArray(source.attributes)
        ? source.attributes
      : [];

  return {
    variantId,
    productId: toNumber(product?.productId ?? source.productId ?? variantProduct?.id),
    name: toOptionalString(product?.name) ?? toOptionalString(source.name) ?? '',
    url: toOptionalString(product?.url) ?? toOptionalString(source.url) ?? toOptionalString(variantProduct?.url),
    image: cleanImage(product?.image ?? source.image),
    attributes,
    productType: toOptionalString(product?.productType) ?? toOptionalString(source.productType) ?? toOptionalString(variantProduct?.productType),
    hasMaxOrder: product?.hasMaxOrder ?? source.hasMaxOrder ?? variant?.hasMaxOrder,
    maxOrderQuantity: toNumber(product?.maxOrderQuantity ?? source.maxOrderQuantity ?? variant?.maxOrderQuantity),
    minOrderQuantity: toNumber(product?.minOrderQuantity ?? source.minOrderQuantity ?? variant?.minOrderQuantity)
  };
}

/**
 * Clean product object by removing unwanted fields
 */
function cleanProduct(product: TransformValue): TransformObject {
  if (!isPlainObject(product)) return {};

  // Fields to remove from product
  const cleanedProduct = removeKeys(product, ['staticUrl', 'summary', 'tags', 'slug']) as TransformObject;

  // Clean variants
  if (cleanedProduct.variants && Array.isArray(cleanedProduct.variants)) {
    cleanedProduct.variants = cleanedProduct.variants.map((variant: TransformValue) =>
      isPlainObject(variant) ? removeKeys(variant, ['name', 'title', 'product', 'status', 'soldCount']) : {}
    );
  }

  // Clean categories - keep only id, name, url
  if (cleanedProduct.categories && Array.isArray(cleanedProduct.categories)) {
    cleanedProduct.categories = cleanedProduct.categories.map((category: TransformValue) => {
      if (!isPlainObject(category)) {
        return {};
      }

      return {
        id: category.id,
        name: category.name,
        url: category.url
      };
    });
  }

  // Clean images - remove widthRatio, heightRatio, thumb
  if (cleanedProduct.images && Array.isArray(cleanedProduct.images)) {
    cleanedProduct.images = cleanedProduct.images.map((image: TransformValue) =>
      cleanImage(image) ?? {}
    );
  }

  return cleanedProduct;
}

function cleanImage(image: TransformValue | undefined): TransformValue | undefined {
  if (!isPlainObject(image)) {
    return image;
  }

  return removeKeys(image, ['widthRatio', 'heightRatio', 'thumb', 'order']) as TransformObject;
}

function cleanProductListItem(product: TransformValue): TransformObject {
  const cleaned = cleanProduct(product);
  if (!cleaned) return cleaned;

  return removeKeys(cleaned, ['themeConfig']);
}

/**
 * Specific transformer for product list responses
 * Handles paginated product lists
 */
export function transformProductListResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const transformed = transformApiResponse<TransformObject>(response);

  // Handle pagination structure
  if (transformed.items && Array.isArray(transformed.items)) {
    const total = toNumber(transformed.total) ?? transformed.items.length;
    const pageSize = toNumber(transformed.pageSize) ?? transformed.items.length;
    const page = toNumber(transformed.page) ?? 1;
    const totalPages = toNumber(transformed.totalPages) ?? Math.ceil(total / pageSize);

    return {
      items: transformed.items.map((item: TransformValue) => cleanProductListItem(item)),
      total,
      page,
      pageSize,
      totalPages
    } as T;
  }

  return transformed as T;
}

/**
 * Specific transformer for search responses
 * Search API returns multiple entity types (products, blog_pages, cms_pages, product_categories)
 * NOTE: Data comes already transformed to camelCase by http-client
 */
export function transformSearchResponse<T = TransformObject>(data: TransformValue | object): T {
  interface SearchBucket {
    items: TransformObject[];
    total: number;
    page: number;
    pageSize: number;
  }

  interface NormalizedSearchResponse {
    products: SearchBucket;
    blogPages: SearchBucket;
    cmsPages: SearchBucket;
    productCategories: SearchBucket;
  }

  if (!isPlainObject(data)) {
    return {
      products: { items: [], total: 0, page: 1, pageSize: 20 },
      blogPages: { items: [], total: 0, page: 1, pageSize: 20 },
      cmsPages: { items: [], total: 0, page: 1, pageSize: 20 },
      productCategories: { items: [], total: 0, page: 1, pageSize: 20 }
    } as T;
  }

  const dataObject = data as TransformObject;
  const response: NormalizedSearchResponse = {
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
  if (Array.isArray(dataObject.items)) {
    response.products.items = dataObject.items.map((product: TransformValue) => cleanProductListItem(product));
    response.products.total = toNumber(dataObject.productsCount) ?? 0;
    response.products.page = toNumber(dataObject.productsPageNumber) ?? 1;
    response.products.pageSize = toNumber(dataObject.productsPageSize) ?? 20;
  }

  // Extract blog pages
  if (Array.isArray(dataObject.blogPages)) {
    response.blogPages.items = dataObject.blogPages.map((page: TransformValue) => cleanCmsPageListItem(page));
    response.blogPages.total = toNumber(dataObject.blogPagesCount) ?? 0;
    response.blogPages.page = toNumber(dataObject.blogPagesPageNumber) ?? 1;
    response.blogPages.pageSize = toNumber(dataObject.blogPagesPageSize) ?? 20;
  }

  // Extract CMS pages
  if (Array.isArray(dataObject.cmsPages)) {
    response.cmsPages.items = dataObject.cmsPages.map((page: TransformValue) => cleanCmsPageListItem(page));
    response.cmsPages.total = toNumber(dataObject.cmsPagesCount) ?? 0;
    response.cmsPages.page = toNumber(dataObject.cmsPagesPageNumber) ?? 1;
    response.cmsPages.pageSize = toNumber(dataObject.cmsPagesPageSize) ?? 20;
  }

  // Extract product categories (API returns as "product_categories" but HTTP client converts to "categories")
  if (Array.isArray(dataObject.categories)) {
    response.productCategories.items = dataObject.categories.map((cat: TransformValue) => cleanCategoryListItem(cat));
    response.productCategories.total = toNumber(dataObject.productCategoriesCount) ?? 0;
    response.productCategories.page = toNumber(dataObject.productCategoriesPageNumber) ?? 1;
    response.productCategories.pageSize = toNumber(dataObject.productCategoriesPageSize) ?? 20;
  }

  return response as T;
}

/**
 * Transform shipping address input for API request
 */
export function transformShippingAddressInput(input: TransformValue): TransformObject {
  if (isPlainObject(input)) {
    const shippingAddress = { ...input };
    delete shippingAddress.user;
    return {
      shipping_address: transformRequestKeys(shippingAddress)
    };
  }

  return {
    shipping_address: transformRequestKeys(input)
  };
}

/**
 * Transform add to cart input for API request
 */
export function transformAddToCartInput(variantId: number, quantity: number, formAttributes?: TransformValue): TransformObject {
  const input: TransformObject = {
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
export function transformCreateCartInput(input: TransformValue): TransformObject {
  if (!isPlainObject(input)) {
    return {
      product_variants: []
    };
  }

  const variants = input.variants || input.productVariants || [];
  const transformed: TransformObject = {
    product_variants: Array.isArray(variants)
      ? variants.map((variant: TransformValue) => {
        if (!isPlainObject(variant)) {
          return {};
        }

        return {
          id: variant.id || variant.variantId,
          count: variant.count || variant.quantity,
          form_attributes: variant.formAttributes ? transformRequestKeys(variant.formAttributes) : undefined
        };
      })
      : []
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
export function extractField<T = TransformValue>(response: TransformValue | ApiResponseEnvelope | object, fieldPath: string): T | undefined {
  const transformed = transformApiResponse<TransformObject>(response);
  const parts = fieldPath.split('.');

  let current: TransformValue | undefined = transformed;
  for (const part of parts) {
    if (!isPlainObject(current) || current[part] === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current as T;
}

/**
 * Transform payment methods response
 */
export function transformPaymentMethodsResponse<T = TransformObject[]>(response: TransformValue | ApiResponseEnvelope | object): T {
  const result = transformApiResponse<TransformObject>(response);
  if (!isPlainObject(result)) {
    return [] as T;
  }

  const paymentTypes = Array.isArray(result.paymentTypes)
    ? result.paymentTypes
    : Array.isArray(result.methods)
      ? result.methods
      : [];

  return paymentTypes.map((method: TransformValue) => {
    if (!isPlainObject(method)) {
      return {
        id: 0,
        code: '',
        title: '',
        titleFa: '',
        description: null,
        paymentSubType: null,
        order: 0,
        isDefault: false
      };
    }

    return {
      id: toNumber(method.id) ?? 0,
      code: method.code,
      title: typeof method.title === 'string' ? method.title : '',
      titleFa: typeof method.titleFa === 'string' ? method.titleFa : '',
      description: typeof method.description === 'string' ? method.description : null,
      paymentSubType: toNumber(method.paymentSubType) ?? null,
      order: toNumber(method.order) ?? 0,
      isDefault: Boolean(method.isDefault)
    };
  }) as T;
}

/**
 * Transform shipping methods response
 */
export function transformShippingMethodsResponse<T = TransformObject[]>(response: TransformValue | ApiResponseEnvelope | object): T {
  const payload = transformApiResponse<TransformValue>(response);
  const shippingMethods = Array.isArray(payload)
    ? payload
    : isPlainObject(payload) && Array.isArray(payload.shippingMethods)
      ? payload.shippingMethods
      : [];

  return shippingMethods.map((method: TransformValue) => normalizeShippingMethod(method)) as T;
}

/**
 * Transform applicable shipping methods response
 */
export function transformApplicableShippingMethodsResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const result = transformApiResponse<TransformObject>(response);
  if (!isPlainObject(result)) {
    return {
      shippingMethods: [],
      groupedShippingRates: {},
      itemsShippingRate: []
    } as T;
  }

  // The real API returns `shippingMethods` as an array of item-group objects:
  //   [{ invoiceItemIds: [...], shippingRate: [rate1, rate2, ...] }]
  // Each entry represents a group of items and ALL their available rates.
  // We convert this to Record<groupKey, ShippingRate[]> for deriveShippingGroups.
  const groupedShippingRates: Record<string, TransformValue[]> = {};

  if (Array.isArray(result.shippingMethods)) {
    result.shippingMethods.forEach((entry: TransformValue, idx: number) => {
      if (!isPlainObject(entry)) return;
      const rates = Array.isArray(entry.shippingRate)
        ? entry.shippingRate.map((r: TransformValue) => normalizeShippingRate(r))
        : [];
      if (rates.length === 0) return;
      const itemIds: (string | number)[] = Array.isArray(entry.invoiceItemIds) ? entry.invoiceItemIds : [];
      const key = itemIds.length > 0 ? itemIds.map(String).sort().join(',') : String(idx);
      groupedShippingRates[key] = rates;
    });
  }

  // Also support older API shape: groupedShippingRates as a plain object
  if (Object.keys(groupedShippingRates).length === 0 && isPlainObject(result.groupedShippingRates)) {
    for (const [key, rates] of Object.entries(result.groupedShippingRates)) {
      groupedShippingRates[key] = Array.isArray(rates)
        ? rates.map((rate: TransformValue) => normalizeShippingRate(rate))
        : [];
    }
  }

  return {
    shippingMethods: [],
    groupedShippingRates,
    itemsShippingRate: Array.isArray(result.itemsShippingRate)
      ? result.itemsShippingRate.map((entry: TransformValue) => {
        if (!isPlainObject(entry)) {
          return {
            invoiceItemId: '',
            shippingRate: normalizeShippingRate(undefined)
          };
        }

        return {
          invoiceItemId: toIdentifier(entry.invoiceItemId)
            ?? normalizeInvoiceItemIds(entry)[0]
            ?? '',
          shippingRate: normalizeShippingRate(entry.shippingRate ?? entry.rate ?? entry)
        };
      })
      : []
  } as T;
}

function normalizeShippingMethod(method: TransformValue): TransformObject {
  if (!isPlainObject(method)) {
    return {
      id: 0,
      name: '',
      type: ''
    };
  }

  return {
    id: toNumber(method.id) ?? 0,
    name: toOptionalString(method.name) ?? '',
    type: toOptionalString(method.type) ?? ''
  };
}

function normalizeShippingRate(rate: TransformValue): TransformObject {
  if (!isPlainObject(rate)) {
    return {
      id: 0,
      name: '',
      price: 0
    };
  }

  return {
    id: toNumber(rate.id ?? rate.rateId) ?? 0,
    name: toOptionalString(rate.name) ?? '',
    price: toNumber(rate.price ?? rate.amount) ?? 0,
    description: toOptionalString(rate.description ?? rate.deliveryDescription ?? rate.details),
    icon: toOptionalString(rate.icon ?? rate.iconUrl ?? rate.logo),
    color: toOptionalString(rate.color ?? rate.bgColor ?? rate.backgroundColor ?? rate.iconColor),
    type: toOptionalString(rate.type)
  };
}

/**
 * Clean category object by removing unwanted fields
 */
function cleanCategory(category: TransformValue): TransformObject {
  if (!isPlainObject(category)) return {};

  // Fields to remove from category
  return removeKeys(category, ['staticUrl', 'products', 'items']); // items is always null in list responses
}

function cleanCategoryListItem(category: TransformValue): TransformObject {
  const cleaned = cleanCategory(category);
  if (!cleaned) return {};

  return removeKeys(cleaned, ['themeConfig']);
}

/**
 * Clean CMS/Blog page object by removing unwanted fields
 */
function cleanCmsPage(page: TransformValue): TransformObject {
  if (!isPlainObject(page)) return {};

  // Fields to remove from CMS/blog page
  return removeKeys(page, ['staticUrl', 'urlKey']);
}

function cleanCmsPageListItem(page: TransformValue): TransformObject {
  const cleaned = cleanCmsPage(page);
  if (!cleaned) return {};

  return removeKeys(cleaned, ['themeConfig']);
}

/**
 * Specific transformer for entity route responses
 * Cleans entity data based on entity type
 */
export function transformEntityRouteResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const transformed = transformApiResponse<TransformObject>(response);

  if (!transformed || !transformed.route) {
    return (transformed ?? {}) as T;
  }

  const route = isPlainObject(transformed.route) ? transformed.route : {};

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
    if (isPlainObject(route.entity)) {
      route.entity = removeKeys(route.entity, ['id']);
    }

    // Add url field at root level from entity.url
    if (!route.url && isPlainObject(route.entity) && route.entity.url) {
      route.url = route.entity.url;
    }
  }

  return route as T;
}

/**
 * Clean category tree node recursively
 */
function cleanCategoryTreeNode(node: TransformValue): TransformObject {
  if (!isPlainObject(node)) return {};

  const cleanedNode = { ...node };

  // Clean the entity if it exists
  if (cleanedNode.entity) {
    cleanedNode.entity = cleanCategoryListItem(cleanedNode.entity);
    // Node already exposes `entityId`; drop duplicate `entity.id` from tree payload.
    if (isPlainObject(cleanedNode.entity)) {
      cleanedNode.entity = removeKeys(cleanedNode.entity, ['id']);
    }
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
export function transformCategoryListResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const transformed = transformApiResponse<TransformObject>(response);

  if (!transformed) return {} as T;

  // Clean categories array
  if (transformed.categories && Array.isArray(transformed.categories)) {
    transformed.categories = transformed.categories.map(cleanCategoryListItem);
  }

  // Clean tree structure
  if (isPlainObject(transformed.tree) && isPlainObject(transformed.tree.treeStructure) && Array.isArray(transformed.tree.treeStructure.nodes)) {
    transformed.tree.treeStructure.nodes = transformed.tree.treeStructure.nodes.map(cleanCategoryTreeNode);
  }

  return transformed as T;
}

/**
 * Specific transformer for single category responses
 */
export function transformCategoryResponse<T = TransformValue>(response: TransformValue | ApiResponseEnvelope | object): T {
  const transformed = transformApiResponse<TransformObject>(response);

  if (!transformed) return {} as T;

  // API returns { product_category: {...} } which becomes { productCategory: {...} }
  // Extract the nested category object
  const category = transformed.productCategory || transformed;

  return cleanCategory(category) as T;
}

/**
 * Specific transformer for CMS pages list responses
 * Cleans CMS page data
 */
export function transformCMSListResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const transformed = transformApiResponse<TransformObject>(response);

  if (!transformed) return {} as T;

  // Backend returns: { cms_pages: [...], page_number: 1, page_size: 10, total_count: 50 }
  // After transformApiResponse: { cmsPages: [...], page: 1, pageSize: 10, total: 50 }
  // We need to convert to: { items: [...], page: 1, pageSize: 10, total: 50 }

  if (transformed.cmsPages && Array.isArray(transformed.cmsPages)) {
    return {
      items: transformed.cmsPages.map(cleanCmsPageListItem),
      total: transformed.total || transformed.cmsPages.length,
      page: transformed.page || transformed.pageNumber || 1,
      pageSize: transformed.pageSize || transformed.cmsPages.length
    } as T;
  }

  // Fallback: if already has items array
  if (transformed.items && Array.isArray(transformed.items)) {
    return {
      items: transformed.items.map((item: TransformValue) => cleanCmsPageListItem(item)),
      total: transformed.total || transformed.items.length,
      page: transformed.page || 1,
      pageSize: transformed.pageSize || transformed.items.length
    } as T;
  }

  return transformed as T;
}

/**
 * Specific transformer for single CMS page response
 */
export function transformCMSPageResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const transformed = transformApiResponse<TransformObject>(response);

  if (!transformed) return {} as T;

  // API returns { cms_page: {...} } which becomes { cmsPage: {...} }
  // Extract the nested page object
  const page = transformed.cmsPage || transformed;

  return cleanCmsPage(page) as T;
}

/**
 * Transform CMS filters to backend format
 * Backend expects: page_number, page_size, filters[] (JSON string)
 */
export function transformCMSFilters(filters?: TransformValue | object): TransformObject {
  if (!isPlainObject(filters)) return {};

  const transformed: TransformObject = {};

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
function cleanMenuNode(node: TransformValue): TransformObject {
  if (!isPlainObject(node)) return {};

  const cleaned: TransformObject = {};

  // Keep only necessary fields
  if (node.entityType) cleaned.entityType = node.entityType;
  if (node.entityId !== undefined) cleaned.entityId = node.entityId;

  // Clean entity (remove staticUrl, id)
  if (isPlainObject(node.entity)) {
    const cleanedEntity = removeKeys(node.entity, ['staticUrl', 'id']);
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
    cleaned.children = node.children.map((child: TransformValue) => cleanMenuNode(child));
  }

  return cleaned;
}

/**
 * Transform menu response
 * Cleans menu tree structure recursively
 */
export function transformMenuResponse<T = TransformObject>(response: TransformValue | ApiResponseEnvelope | object): T {
  const transformed = transformApiResponse<TransformObject>(response);

  if (!transformed || !transformed.tree) {
    return (transformed ?? {}) as T;
  }

  const tree = isPlainObject(transformed.tree) ? transformed.tree : {};

  // Clean the tree structure recursively
  if (isPlainObject(tree.treeStructure) && Array.isArray(tree.treeStructure.nodes)) {
    tree.treeStructure.nodes = tree.treeStructure.nodes.map((node: TransformValue) => cleanMenuNode(node));
  }

  return transformed as T;
}
