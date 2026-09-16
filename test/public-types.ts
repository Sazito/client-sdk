import type {
  Product,
  ProductVariant,
  ProductAttribute,
  ProductAttributeValueObject,
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
} from '@sazito/client-sdk';

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
