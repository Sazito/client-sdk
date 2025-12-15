/**
 * Tests for API Data Transformers
 */

import {
  transformResponseKeys,
  transformRequestKeys,
  transformApiResponse,
  transformCartResponse,
  transformInvoiceResponse,
  transformProductListResponse,
  transformShippingAddressInput,
  transformAddToCartInput,
  transformCreateCartInput
} from '../transformers';

describe('transformResponseKeys', () => {
  it('should transform snake_case keys to camelCase', () => {
    const input = {
      first_name: 'John',
      last_name: 'Doe',
      mobile_phone: '123456789'
    };

    const result = transformResponseKeys(input);

    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      mobilePhone: '123456789'
    });
  });

  it('should beautify field names using mapping', () => {
    const input = {
      no_of_items: 5,
      single_item_price: 100,
      total_items_price: 500
    };

    const result = transformResponseKeys(input);

    expect(result).toEqual({
      quantity: 5,
      unitPrice: 100,
      lineTotal: 500
    });
  });

  it('should handle nested objects', () => {
    const input = {
      product_name: 'Test Product',
      product_variant: {
        variant_id: 123,
        stock_quantity: 10
      }
    };

    const result = transformResponseKeys(input);

    expect(result).toEqual({
      name: 'Test Product',
      variant: {
        variantId: 123,
        stockQuantity: 10
      }
    });
  });

  it('should handle arrays', () => {
    const input = {
      cart_products: [
        {
          no_of_items: 2,
          single_item_price: 100
        },
        {
          no_of_items: 3,
          single_item_price: 200
        }
      ]
    };

    const result = transformResponseKeys(input);

    expect(result).toEqual({
      items: [
        {
          quantity: 2,
          unitPrice: 100
        },
        {
          quantity: 3,
          unitPrice: 200
        }
      ]
    });
  });

  it('should preserve non-object values', () => {
    const input = {
      count: 5,
      active: true,
      price: 100.5,
      name: 'Test',
      tags: ['tag1', 'tag2']
    };

    const result = transformResponseKeys(input);

    expect(result).toEqual(input);
  });
});

describe('transformRequestKeys', () => {
  it('should transform camelCase keys to snake_case', () => {
    const input = {
      firstName: 'John',
      lastName: 'Doe',
      mobilePhone: '123456789'
    };

    const result = transformRequestKeys(input);

    expect(result).toEqual({
      first_name: 'John',
      last_name: 'Doe',
      mobile_phone: '123456789'
    });
  });

  it('should reverse beautified field names', () => {
    const input = {
      quantity: 5,
      unitPrice: 100,
      lineTotal: 500
    };

    const result = transformRequestKeys(input);

    expect(result).toEqual({
      no_of_items: 5,
      single_item_price: 100,
      total_items_price: 500
    });
  });

  it('should handle nested objects', () => {
    const input = {
      firstName: 'John',
      address: {
        cityId: 301,
        postalCode: '1234567890'
      }
    };

    const result = transformRequestKeys(input);

    expect(result).toEqual({
      first_name: 'John',
      address: {
        city_id: 301,
        postal_code: '1234567890'
      }
    });
  });
});

describe('transformApiResponse', () => {
  it('should unwrap standard API response structure', () => {
    const input = {
      data: {
        result: {
          product: {
            product_name: 'Test',
            no_of_items: 5
          }
        }
      }
    };

    const result = transformApiResponse(input);

    expect(result).toEqual({
      name: 'Test',
      quantity: 5
    });
  });

  it('should handle multiple keys in result', () => {
    const input = {
      data: {
        result: {
          total: 100,
          page: 1,
          page_size: 20
        }
      }
    };

    const result = transformApiResponse(input);

    expect(result).toEqual({
      total: 100,
      page: 1,
      pageSize: 20
    });
  });

  it('should handle already unwrapped responses', () => {
    const input = {
      product_name: 'Test',
      no_of_items: 5
    };

    const result = transformApiResponse(input);

    expect(result).toEqual({
      name: 'Test',
      quantity: 5
    });
  });
});

describe('transformCartResponse', () => {
  it('should transform cart response with items', () => {
    const input = {
      data: {
        result: {
          cart: {
            id: 'cart-123',
            unique_identifier: 'abc-xyz',
            cart_products: [
              {
                id: 'cp-1',
                product_variant: {
                  id: 456,
                  product: {
                    id: 123
                  }
                },
                product_name: 'Test Product',
                no_of_items: 2,
                single_item_price: 100,
                total_items_price: 200
              }
            ],
            net_total: 200
          }
        }
      }
    };

    const result = transformCartResponse(input);

    expect(result.id).toBe('cart-123');
    expect(result.identifier).toBe('abc-xyz');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[0].unitPrice).toBe(100);
    expect(result.items[0].product.variantId).toBe(456);
    expect(result.items[0].product.productId).toBe(123);
  });
});

describe('transformInvoiceResponse', () => {
  it('should transform invoice response', () => {
    const input = {
      data: {
        result: {
          invoice: {
            id: 'inv-123',
            invoice_identifier: 'inv-abc',
            invoice_items: [
              {
                id: 'item-1',
                no_of_items: 2,
                single_item_price: 100,
                total_items_price: 200,
                raw_price: 120,
                customer_profit: 40
              }
            ],
            net_total: 240,
            gross_total: 200
          }
        }
      }
    };

    const result = transformInvoiceResponse(input);

    expect(result.id).toBe('inv-123');
    expect(result.identifier).toBe('inv-abc');
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[0].unitPrice).toBe(100);
    expect(result.items[0].originalPrice).toBe(120);
    expect(result.items[0].savings).toBe(40);
  });
});

describe('transformProductListResponse', () => {
  it('should transform paginated product list', () => {
    const input = {
      data: {
        result: {
          products: [
            { id: 1, product_name: 'Product 1' },
            { id: 2, product_name: 'Product 2' }
          ],
          total_count: 50,
          page_number: 1,
          page_size: 20
        }
      }
    };

    const result = transformProductListResponse(input);

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(50);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});

describe('transformShippingAddressInput', () => {
  it('should wrap and transform shipping address', () => {
    const input = {
      firstName: 'John',
      lastName: 'Doe',
      mobilePhone: '123456789',
      cityId: 301,
      postalCode: '1234567890'
    };

    const result = transformShippingAddressInput(input);

    expect(result).toEqual({
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        mobile_phone: '123456789',
        city_id: 301,
        postal_code: '1234567890'
      }
    });
  });
});

describe('transformAddToCartInput', () => {
  it('should transform add to cart input', () => {
    const result = transformAddToCartInput(456, 2);

    expect(result).toEqual({
      product_variants: [
        {
          id: 456,
          count: 2
        }
      ]
    });
  });

  it('should include form attributes if provided', () => {
    const formAttrs = {
      color: 'red',
      size: 'large'
    };

    const result = transformAddToCartInput(456, 2, formAttrs);

    expect(result.product_variants[0].id).toBe(456);
    expect(result.product_variants[0].count).toBe(2);
    expect(result.form_attributes).toBeDefined();
  });
});

describe('transformCreateCartInput', () => {
  it('should transform create cart input', () => {
    const input = {
      productVariants: [
        {
          id: 456,
          quantity: 2
        },
        {
          variantId: 789,
          count: 1
        }
      ],
      coupon: 'SUMMER2025'
    };

    const result = transformCreateCartInput(input);

    expect(result.product_variants).toHaveLength(2);
    expect(result.product_variants[0].id).toBe(456);
    expect(result.product_variants[0].count).toBe(2);
    expect(result.product_variants[1].id).toBe(789);
    expect(result.product_variants[1].count).toBe(1);
    expect(result.coupon).toBe('SUMMER2025');
  });
});
