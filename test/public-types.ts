import type {
  SazitoConfig,
  Product,
  ProductListItem,
  ProductVariant,
  ProductAttribute,
  ProductAttributeValueObject,
  ProductsAPI,
  CategoryListResponse,
  AddItemAttributesInput,
  LoginInput,
  WalletBalance,
  TransactionFilters,
  CMSPage,
  Booking,
  DynamicForm,
  GeneralInfo,
  Region,
  GeneralRegion,
  GeneralCity,
  RegionWithCities,
  FeedbackSeed
} from '@sazito/client-sdk';

const sdkConfig: SazitoConfig = {
  domain: 'shop.example.com',
  apiKey: 'test-api-key'
};
void sdkConfig;
// @ts-expect-error The API origin is fixed by the SDK.
sdkConfig.apiBaseUrl = 'https://other.example.com';

const color: ProductAttributeValueObject = {
  value: 'Blue',
  fieldType: 'color',
  extra: '#123456'
};

const attribute: ProductAttribute = {
  name: 'Color',
  attributeType: 'differentiator',
  type: 'string',
  value: color
};

const productAttributes: NonNullable<Product['attributes']> = [attribute];
const variantAttributes: ProductVariant['attributes'] = productAttributes;

void variantAttributes;

declare const products: ProductsAPI;
const listResult: Promise<import('@sazito/client-sdk').SazitoResponse<import('@sazito/client-sdk').PaginatedResponse<ProductListItem>>> = products.list();
void listResult;

declare const card: ProductListItem;
const imageCount: number = card.imageCount;
void imageCount;
// @ts-expect-error Categories are only available on product details.
void card.categories;
// @ts-expect-error Product timestamps are absent from the storefront contract.
void card.createdAt;
if (card.variants) {
  // @ts-expect-error Variant titles are only available on product details.
  void card.variants[0].title;
}
declare const detail: Product;
if (detail.variants) {
  const sku: string | undefined = detail.variants[0].sku;
  void sku;
  // @ts-expect-error Storefront variants do not embed the parent product.
  void detail.variants[0].product;
}

const walletFilters: TransactionFilters = { pageNumber: 1, pageSize: 20 };
void walletFilters;

// @ts-expect-error Wallet filters use camelCase, not the backend's snake_case.
const legacyWalletFilters: TransactionFilters = { page_size: 20 };
void legacyWalletFilters;

type HostModuleTypes = [
  ProductsAPI,
  CategoryListResponse,
  AddItemAttributesInput,
  LoginInput,
  WalletBalance,
  CMSPage,
  Booking,
  DynamicForm,
  GeneralInfo,
  Region,
  GeneralRegion,
  GeneralCity,
  RegionWithCities,
  FeedbackSeed
];

declare const hostModuleTypes: HostModuleTypes;
void hostModuleTypes;
