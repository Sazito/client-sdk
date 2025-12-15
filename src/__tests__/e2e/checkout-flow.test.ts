/**
 * E2E Test: Complete Checkout Flow
 * Tests the entire guest checkout process from browsing to payment
 */

import { createSazitoClient } from '../../core/client';
import { mockFetch } from '../../test-helpers/mock-fetch';
import {
  mockProduct,
  mockInvoice,
  mockApiResponse
} from '../../test-helpers/fixtures';

describe('E2E: Guest Checkout Flow', () => {
  let mockFetchFn: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
  });

  it('should complete full guest checkout flow', async () => {
    // Step 1: Browse and view product
    mockFetchFn = mockFetch({
      result: {
        route: {
          entity_type: 'product',
          entity: mockProduct
        }
      }
    });

    const client = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const productResponse = await client.products.get('test-product');
    expect(productResponse.data).toBeDefined();
    expect(productResponse.data?.name).toBe(mockProduct.name);

    // Step 2: Create cart and add item
    const mockCartData = {
      id: 123,
      unique_identifier: 'cart-abc-xyz',
      cart_products: [],
      net_total: 20000,
      gross_total: 20000,
      shipping_method_needed: true,
      delete_coupon: false
    };

    mockFetchFn = mockFetch(mockApiResponse({ cart: mockCartData }));
    const cartConfig = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const createCartResponse = await cartConfig.cart.create({
      variants: [{ id: 456, count: 2 }]
    });
    expect(createCartResponse.data).toBeDefined();

    // Step 3: Create invoice from cart
    mockFetchFn = mockFetch(mockApiResponse({ invoice: mockInvoice }));
    const invoiceClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const invoiceResponse = await invoiceClient.invoices.create();
    expect(invoiceResponse.data).toBeDefined();

    // Step 4: Add shipping address
    mockFetchFn = mockFetch(mockApiResponse({ invoice: mockInvoice }));
    const shippingClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const addressResponse = await shippingClient.invoices.addShippingAddress(
      1, // shippingAddressId
      'addr-identifier' // shippingAddressIdentifier
    );
    expect(addressResponse.data).toBeDefined();

    // Step 5: Select shipping method
    mockFetchFn = mockFetch(mockApiResponse({ invoice: mockInvoice }));
    const methodClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const methodResponse = await methodClient.invoices.assignShippingMethod([
      { rateId: 1, invoiceItemIds: ['1', '2'] }
    ]);
    expect(methodResponse.data).toBeDefined();

    // Step 6: Initialize payment
    mockFetchFn = mockFetch(mockApiResponse({
      payment: {
        id: 'pay-123',
        status: 'pending',
        redirectUrl: 'https://payment-gateway.com/pay'
      }
    }));
    const paymentClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const paymentResponse = await paymentClient.payments.create(1);
    expect(paymentResponse.data).toBeDefined();
    expect(paymentResponse.data?.status).toBe('pending');
  });

  it('should handle checkout flow with discount code', async () => {
    // Create cart
    const mockCartData = {
      id: 123,
      unique_identifier: 'cart-abc-xyz',
      cart_products: [],
      net_total: 20000,
      gross_total: 20000,
      shipping_method_needed: true,
      delete_coupon: false
    };

    mockFetchFn = mockFetch(mockApiResponse({ cart: mockCartData }));
    const client = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    await client.cart.create({
      variants: [{ id: 456, count: 2 }],
      coupon: 'SUMMER2025'
    });

    // Create invoice
    mockFetchFn = mockFetch(mockApiResponse({ invoice: mockInvoice }));
    const invoiceClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const invoiceResponse = await invoiceClient.invoices.create();
    expect(invoiceResponse.data).toBeDefined();

    // Apply discount code
    mockFetchFn = mockFetch(mockApiResponse({ invoice: { ...mockInvoice, discountTotal: 2000 } }));
    const discountClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const discountResponse = await discountClient.invoices.addDiscountCode('SUMMER2025');
    expect(discountResponse.data).toBeDefined();
    expect(discountResponse.data?.discountTotal).toBeGreaterThan(0);
  });
});
