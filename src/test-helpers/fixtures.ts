/**
 * Test Fixtures and Mock Data
 */

import type { Product, ProductVariant } from '../types/product';
import type { Cart, CartProduct } from '../types/cart';
import type { Invoice, InvoiceItem, ShippingAddress } from '../types/invoice';
import type { Order } from '../types/order';
import type { ShippingMethod } from '../types/shipping';
import type { PaymentMethod } from '../types/payment';

// Product Fixtures (raw API response format - snake_case)
export const mockProductVariantRaw = {
  id: 456,
  product_id: 123,
  sku: 'TEST-SKU-001',
  price: 10000,
  sale_price: 8000,
  stock_quantity: 50,
  is_available: true,
  product_attributes: [
    { name: 'color', value: 'Red' },
    { name: 'size', value: 'L' }
  ]
};

// Product Fixtures (transformed - camelCase)
export const mockProductVariant: ProductVariant = {
  id: 456,
  productId: 123,
  sku: 'TEST-SKU-001',
  price: 10000,
  salePrice: 8000,
  stockQuantity: 50,
  isAvailable: true,
  attributes: [
    { name: 'color', value: 'Red' },
    { name: 'size', value: 'L' }
  ]
};

// Raw API response format (snake_case)
export const mockProductRaw = {
  id: 123,
  slug: 'test-product',
  name: 'Test Product',
  description: 'This is a test product',
  price: 10000,
  sale_price: 8000,
  images: [
    {
      url: 'https://example.com/image.jpg',
      alt: 'Test Product Image',
      width: 800,
      height: 600
    }
  ],
  variants: [mockProductVariantRaw],
  stock_quantity: 50,
  is_available: true,
  product_categories: [
    {
      id: 1,
      name: 'Test Category',
      slug: 'test-category'
    }
  ],
  tags: [
    {
      id: 1,
      name: 'Test Tag',
      slug: 'test-tag'
    }
  ],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

// Transformed format (camelCase)
export const mockProduct: Product = {
  id: 123,
  slug: 'test-product',
  name: 'Test Product',
  description: 'This is a test product',
  price: 10000,
  salePrice: 8000,
  images: [
    {
      url: 'https://example.com/image.jpg',
      alt: 'Test Product Image',
      width: 800,
      height: 600
    }
  ],
  variants: [mockProductVariant],
  stockQuantity: 50,
  isAvailable: true,
  categories: [
    {
      id: 1,
      name: 'Test Category',
      slug: 'test-category'
    }
  ],
  tags: [
    {
      id: 1,
      name: 'Test Tag',
      slug: 'test-tag'
    }
  ],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
};

export const mockProducts = [
  mockProduct,
  {
    ...mockProduct,
    id: 124,
    slug: 'test-product-2',
    name: 'Test Product 2'
  },
  {
    ...mockProduct,
    id: 125,
    slug: 'test-product-3',
    name: 'Test Product 3'
  }
];

// Cart Fixtures
export const mockCartProduct: CartProduct = {
  id: 1,
  product: {
    variantId: 456,
    name: 'Test Product',
    url: 'https://example.com/products/test-product',
    image: {
      url: 'https://example.com/image.jpg',
      alt: 'Test Product'
    },
    attributes: [
      { name: 'color', value: 'Red' }
    ],
    hasMaxOrder: false,
    maxOrderQuantity: 10,
    minOrderQuantity: 1
  },
  quantity: 2,
  unitPrice: 10000,
  lineTotal: 20000
};

export const mockCart: Cart = {
  id: 0,
  identifier: '019b1e71-5dae-733b-9ec6-162214fc4223',
  items: [mockCartProduct],
  subtotal: 20000,
  total: 19800,
  needsShipping: true,
  deleteCoupon: false
};

// Invoice Fixtures
export const mockInvoiceItem: InvoiceItem = {
  id: 1,
  variant: {
    id: 456,
    product: {},
    attributes: [
      { name: 'color', value: 'Red' }
    ]
  },
  image: {
    url: 'https://example.com/image.jpg',
    alt: 'Test Product'
  },
  name: 'Test Product',
  unitPrice: 10000,
  lineTotal: 20000,
  quantity: 2
};

export const mockShippingAddress: ShippingAddress = {
  id: 1,
  identifier: '6070bb005466bcbec89567381c9fd100',
  firstName: 'John',
  lastName: 'Doe',
  mobilePhone: '09123456789',
  address: '123 Test St',
  region: {
    id: 8,
    name: 'Tehran'
  },
  city: {
    id: 301,
    name: 'Tehran'
  },
  postalCode: '1234567890',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
};

export const mockInvoice: Invoice = {
  id: 0,
  identifier: '019b1e71-67d4-74d5-a108-0d1379f6b3ff',
  items: [mockInvoiceItem],
  shippingAddress: mockShippingAddress,
  shippingItems: [],
  needsShipping: true,
  subtotal: 20000,
  total: 19800,
  finalTotal: 24800,
  discountTotal: 200,
  shippingTotal: 5000,
  taxTotal: 0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
};

// Order Fixtures
export const mockOrder: Order = {
  id: 1,
  orderNumber: 'ORD-2025-001',
  status: 'PROCESSING',
  items: [mockInvoiceItem],
  shippingAddress: mockShippingAddress,
  subtotal: 20000,
  discountTotal: 200,
  shippingTotal: 5000,
  taxTotal: 0,
  total: 24800,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
};

// Shipping Fixtures
export const mockShippingMethod: ShippingMethod = {
  id: 1,
  code: 'standard',
  name: 'Standard Shipping',
  description: 'Delivery in 3-5 business days',
  enabled: true,
  isFree: false,
  isCourier: false,
  isPost: true
};

// Payment Fixtures
export const mockPaymentMethod: PaymentMethod = {
  id: 1,
  code: 'zarinpalpayment',
  name: 'ZarinPal',
  description: {
    description: 'Pay securely with ZarinPal'
  },
  enabled: true
};

// API Response Fixtures
export const mockApiResponse = <T>(data: T) => ({
  result: data
});

export const mockApiError = (message: string, status: number = 400) => ({
  error: {
    message,
    status
  }
});

export const mockPaginatedResponse = <T>(items: T[], page = 1, pageSize = 20, total?: number) => ({
  products: items,  // API returns 'products' which transforms to 'items'
  total_count: total ?? items.length,  // API returns 'total_count' which transforms to 'total'
  page_number: page,  // API returns 'page_number' which transforms to 'page'
  page_size: pageSize  // API returns 'page_size' which transforms to 'pageSize'
});
