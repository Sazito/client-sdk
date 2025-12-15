# Sazito Client SDK

Official JavaScript/TypeScript SDK for Sazito e-commerce platform - Client Edition. A modern, type-safe, and developer-friendly SDK that works seamlessly with React, Next.js, and vanilla JavaScript.

## Features

- ✅ **Zero Dependencies** - Uses native fetch API
- ✅ **TypeScript-First** - 100% type coverage with excellent autocomplete
- ✅ **Tree-Shakeable** - Import only what you need
- ✅ **Beautiful Field Names** - Automatic transformation from `no_of_items` → `quantity`, `single_item_price` → `unitPrice`
- ✅ **React Friendly** - Built-in hooks for React applications
- ✅ **SSR Support** - Works with Next.js server-side rendering
- ✅ **Guest Checkout** - Full support for anonymous users
- ✅ **Secure** - HTTP-only cookie storage for JWT tokens
- ✅ **Smart Caching** - Per-API configurable caching with TTL
- ✅ **Auto-Retry** - Automatic retry with exponential backoff
- ✅ **Unified Responses** - No thrown exceptions, all errors in response

## Installation

```bash
npm install @sazito/client-sdk
# or
yarn add @sazito/client-sdk
# or
pnpm add @sazito/client-sdk
```

## Quick Start

### Vanilla JavaScript/TypeScript

```typescript
import { createSazitoClient } from '@sazito/client-sdk';

// Initialize the SDK
const sazito = createSazitoClient({
  domain: 'mystore.sazito.com'  // Your store domain
});

// All requests go to: http://api.sazito.com:8080
// With header: x-forwarded-host: mystore.sazito.com

// Get products
const response = await sazito.products.list({ page: 1, per_page: 20 });

if (response.error) {
  console.error(response.error.message);
} else {
  console.log(response.data.items);
}
```

### React

```typescript
import { createSazitoClient } from '@sazito/client-sdk';

// Create client instance (outside component or in context)
const sazito = createSazitoClient({
  domain: 'mystore.sazito.com'
});

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const response = await sazito.products.list();
      if (response.data) {
        setProducts(response.data.items);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Next.js SSR

```typescript
import { createSazitoClient } from '@sazito/client-sdk';

export async function getServerSideProps() {
  const sazito = createSazitoClient({
    domain: 'mystore.sazito.com'
  });

  const response = await sazito.products.get(123);

  return {
    props: {
      product: response.data || null
    }
  };
}
```

## Configuration

```typescript
const sazito = createSazitoClient({
  domain: 'mystore.sazito.com',     // Required - Your store domain
  timeout: 30000,                    // Request timeout (default: 30s)
  retry: {
    enabled: true,
    retries: 3,                      // 0-3 retries
    retryDelay: 1000                 // Delay between retries
  },
  cache: {
    products: { enabled: true, ttl: 600000 },    // 10 min
    categories: { enabled: true, ttl: 600000 },  // 10 min
    cart: { enabled: false },                     // Never cache
    orders: { enabled: false }                    // Never cache
  },
  customFetchApi: fetch,             // Optional custom fetch
  debug: false                       // Enable debug logging
});

// Note: All requests are sent to http://api.sazito.com:8080
// with your domain in the x-forwarded-host header
```

## API Modules

The SDK includes **17 complete API modules**:

1. **products** - Browse and search products
2. **categories** - Product categories
3. **tags** - Product tags
4. **cart** - Shopping cart with guest support
5. **orders** - Order history
6. **invoices** - Complete checkout flow
7. **shipping** - Addresses and methods
8. **payments** - 20+ payment gateways
9. **users** - Authentication and profiles
10. **search** - Advanced product search
11. **feedbacks** - Reviews and comments
12. **wallet** - User wallet
13. **cms** - CMS pages and blog
14. **images** - File upload
15. **visits** - Analytics tracking
16. **booking** - Event scheduling
17. **entityRoutes** - URL resolver

For complete API documentation, see [API_REFERENCE.md](API_REFERENCE.md).

## Quick API Reference

### Products

```typescript
// Get single product
const response = await sazito.products.get(123);  // by ID
const response = await sazito.products.get('product-slug');  // by slug

// List products
const response = await sazito.products.list({
  category_id: 5,
  page: 1,
  per_page: 20,
  sort: 'price_asc'
});

// Search products
const response = await sazito.products.search('laptop');
```

### Cart

```typescript
// Create cart
const response = await sazito.cart.create({
  product_variants: [
    { id: 123, count: 2 }
  ]
});

// Get cart
const response = await sazito.cart.get();

// Add item to cart
const response = await sazito.cart.addItem(123, 2);

// Update item quantity
const response = await sazito.cart.updateItem(cartProductId, 3);

// Remove item
const response = await sazito.cart.removeItem(cartProductId, variantId);

// Clear cart
sazito.cart.clearCart();
```

### Checkout (Invoices)

```typescript
// Create invoice from cart
const response = await sazito.invoices.create();

// Get invoice
const response = await sazito.invoices.get();

// Refresh invoice
const response = await sazito.invoices.refresh();

// Add discount code
const response = await sazito.invoices.addDiscountCode('SUMMER2025');

// Get applicable shipping methods
const response = await sazito.invoices.getApplicableShippingMethods();

// Assign shipping method
const response = await sazito.invoices.assignShippingMethod([
  {
    rate_id: 123,
    invoice_item_ids: ['1', '2']
  }
]);

// Add shipping address
const response = await sazito.invoices.addShippingAddress(
  addressId,
  addressIdentifier
);
```

### Shipping

```typescript
// Create shipping address
const response = await sazito.shipping.createAddress({
  first_name: 'John',
  last_name: 'Doe',
  mobile_phone: '09123456789',
  region_id: 1,
  city_id: 5,
  address: 'Street address',
  postal_code: '1234567890'
});

// Update shipping address
const response = await sazito.shipping.updateAddress({
  // ... same fields
});

// Get shipping address
const response = await sazito.shipping.getAddress();

// Get shipping methods
const response = await sazito.shipping.getMethods();
```

### Payments

```typescript
// Get payment methods
const response = await sazito.payments.getMethods();

// Create payment
const response = await sazito.payments.create(paymentTypeId);

// Initialize payment (get gateway URL)
const response = await sazito.payments.initialize();

if (response.data.action === 'POST') {
  // Create form and submit to gateway
  const form = document.createElement('form');
  form.action = response.data.address;
  form.method = 'POST';
  // Add payload fields
  Object.entries(response.data.payload).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
} else if (response.data.action === 'REDIRECT') {
  // Redirect to gateway
  window.location.href = response.data.address;
}

// For card-to-card payments
const response = await sazito.payments.processStep({
  payment_identifier: '...',
  image_url: 'uploaded-receipt-url',
  code: 'tracking-code'
});
```

### Orders

```typescript
// List orders (requires authentication)
const response = await sazito.orders.list({
  page: 1,
  per_page: 20
});

// Get single order
const response = await sazito.orders.get(orderId);
```

## Authentication

The SDK uses HTTP-only cookies for secure token storage.

```typescript
// After user login (you handle the login UI)
sazito.setAuthToken('jwt-token-from-login');

// Check if authenticated
const isAuth = sazito.isAuthenticated();

// Get current token
const token = sazito.getAuthToken();

// Logout
sazito.clearAuth();
```

## Guest Checkout

The SDK automatically handles guest users. Cart, invoice, shipping, and payment credentials are stored in localStorage and automatically included in requests.

```typescript
// Guest user adds to cart - credentials automatically saved
await sazito.cart.addItem(123, 2);

// Guest user creates invoice - works seamlessly
await sazito.invoices.create();

// After login, merge guest cart with user account
// (You'll need to implement the merge logic on your backend)
```

## Error Handling

All API methods return a unified response with no thrown exceptions:

```typescript
const response = await sazito.products.get(123);

if (response.error) {
  // Handle error
  console.error(response.error.message);
  console.error(response.error.status);  // HTTP status code
  console.error(response.error.type);    // 'network' | 'api' | 'validation'
} else {
  // Success - use data
  console.log(response.data);
}
```

## Per-Request Options

Override global configuration per request:

```typescript
// Disable cache for this request
const response = await sazito.products.get(123, { cache: false });

// No retries for this request
const response = await sazito.cart.addItem(123, 2, undefined, { retries: 0 });

// Custom timeout
const response = await sazito.products.list({}, { timeout: 10000 });

// Custom headers
const response = await sazito.products.get(123, {
  headers: { 'X-Custom-Header': 'value' }
});
```

## Cache Management

```typescript
// Clear all cache
sazito.clearCache();

// Clear specific credentials
sazito.cart.clearCart();
sazito.invoices.clearInvoice();
sazito.shipping.clearAddress();
sazito.payments.clearPayment();

// Clear everything (auth + cache + credentials)
sazito.clearAll();
```

## CDN Usage (UMD)

```html
<script src="https://unpkg.com/@sazito/client-sdk@latest/dist/index.umd.js"></script>
<script>
  const sazito = SazitoSDK.createSazitoClient({
    domain: 'mystore.sazito.com'
  });

  sazito.products.list().then(response => {
    if (response.data) {
      console.log(response.data.items);
    }
  });
</script>
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type { Product, Cart, Invoice, SazitoResponse } from '@sazito/client-sdk';

// Full autocomplete and type safety
const response: SazitoResponse<Product> = await sazito.products.get(123);
```

## License

MIT

## Documentation

📚 **Complete Documentation:**

- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Comprehensive guide with React & Next.js integration examples
- **[Quick Start](docs/QUICK_START.md)** - Get started quickly with common use cases
- **[API Reference](docs/API_REFERENCE.md)** - Detailed documentation for all 17 API modules

🎨 **Data Transformations:**

- **[Transformers Guide](docs/TRANSFORMERS_GUIDE.md)** - How the SDK beautifies API field names automatically
- **[Data Transformation](docs/DATA_TRANSFORMATION.md)** - Complete developer guide to field mappings and transformations
- **[API Params & Responses](docs/API_PARAMS_RESPONSES.md)** - Complete reference of request/response transformations
- **[Product Filters Reference](docs/PRODUCT_FILTERS_REFERENCE.md)** - Detailed product filtering and sorting guide

📋 **Planning & Architecture:**

- **[Sazito SDK Plan](docs/SAZITO_SDK_PLAN.md)** - Original SDK design and architecture
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[Authentication Analysis](docs/AUTHENTICATION_ANALYSIS.md)** - Authentication flow documentation
- **[Cart/Invoice/Shipping/Payment](docs/CART_INVOICE_SHIPPING_PAYMENT.md)** - E-commerce flow analysis

