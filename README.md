# Sazito Client SDK

Official JavaScript/TypeScript SDK for Sazito e-commerce platform - Client Edition. A modern, type-safe, and developer-friendly SDK that works seamlessly with React, Next.js, and vanilla JavaScript.

> **Current Version**: 1.0.1 | **License**: MIT | **Framework Agnostic**

## 🌟 Features

- ✨ **Zero Dependencies** - Uses native fetch API, no external dependencies
- 📘 **TypeScript-First** - 100% type coverage with excellent IntelliSense autocomplete
- 🌳 **Tree-Shakeable** - Import only what you need, optimized bundle size
- 🎨 **Beautiful Field Names** - Automatic transformation: `no_of_items` → `quantity`, `single_item_price` → `unitPrice`
- ⚛️ **React Friendly** - Built with React in mind, easy integration
- 🖥️ **SSR Support** - Works with Next.js server-side rendering out of the box
- 👤 **Guest Checkout** - Full support for anonymous users with automatic credential management
- 🔒 **Secure** - HTTP-only cookie storage for JWT tokens with localStorage fallback
- 💾 **Smart Caching** - Per-API configurable caching with TTL and automatic invalidation
- 🔄 **Auto-Retry** - Automatic retry with exponential backoff for failed requests
- ✅ **Unified Responses** - No thrown exceptions, all errors returned in response object
- 🌐 **CDN Ready** - Available via UMD for direct browser usage
- 📦 **17 Complete API Modules** - Products, Cart, Orders, Payments, CMS, and more

## 📦 Installation

```bash
# npm
npm install @sazito/client-sdk

# yarn
yarn add @sazito/client-sdk

# pnpm
pnpm add @sazito/client-sdk
```

## 🚀 Quick Start

### Vanilla JavaScript/TypeScript

```typescript
import { createSazitoClient } from '@sazito/client-sdk';

// Initialize the SDK with your store domain
const sazito = createSazitoClient({
  domain: 'mystore.sazito.com'
});

// All requests are proxied through: http://api.sazito.com:8080
// with your domain passed via x-forwarded-host header

// Fetch products with automatic field transformation
const response = await sazito.products.list({ 
  page: 1, 
  pageSize: 20,
  sort: 'price_asc'
});

if (response.error) {
  console.error('Error:', response.error.message);
} else {
  // Beautiful, transformed field names
  console.log('Products:', response.data.items);
  console.log('Total:', response.data.total);
  console.log('Pages:', response.data.totalPages);
}
```

### React Integration

```typescript
import { createSazitoClient } from '@sazito/client-sdk';
import { useState, useEffect } from 'react';

// Create client instance (ideally in a context or outside component)
const sazito = createSazitoClient({
  domain: 'mystore.sazito.com'
});

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      const response = await sazito.products.list({
        page: 1,
        pageSize: 20
      });
      
      if (response.error) {
        setError(response.error.message);
      } else {
        setProducts(response.data.items);
      }
      setLoading(false);
    }
    
    fetchProducts();
  }, []);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <p>{product.price} USD</p>
        </div>
      ))}
    </div>
  );
}
```

### Next.js (App Router & Pages Router)

```typescript
// app/products/[id]/page.tsx (App Router)
import { createSazitoClient } from '@sazito/client-sdk';

const sazito = createSazitoClient({
  domain: 'mystore.sazito.com'
});

export default async function ProductPage({ params }) {
  const response = await sazito.products.get(params.id);

  if (response.error) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <h1>{response.data.name}</h1>
      <p>{response.data.description}</p>
      <p className="price">${response.data.price}</p>
    </div>
  );
}

// pages/products/[id].tsx (Pages Router)
export async function getServerSideProps({ params }) {
  const sazito = createSazitoClient({
    domain: 'mystore.sazito.com'
  });

  const response = await sazito.products.get(params.id);

  if (response.error) {
    return { notFound: true };
  }

  return {
    props: {
      product: response.data
    }
  };
}
```

## ⚙️ Configuration

```typescript
const sazito = createSazitoClient({
  // Required: Your Sazito store domain
  domain: 'mystore.sazito.com',
  
  // Optional: Request timeout in milliseconds (default: 30000)
  timeout: 30000,
  
  // Optional: Retry configuration
  retry: {
    enabled: true,           // Enable/disable auto-retry (default: true)
    retries: 3,             // Number of retry attempts 0-3 (default: 3)
    retryDelay: 1000        // Initial delay between retries in ms (default: 1000)
  },
  
  // Optional: Per-API caching configuration
  cache: {
    products: { enabled: true, ttl: 600000 },    // Cache for 10 minutes
    categories: { enabled: true, ttl: 600000 },  // Cache for 10 minutes
    cart: { enabled: false },                     // Never cache cart
    orders: { enabled: false },                   // Never cache orders
    cms: { enabled: true, ttl: 1800000 }         // Cache for 30 minutes
  },
  
  // Optional: Custom fetch implementation (default: native fetch)
  customFetchApi: fetch,
  
  // Optional: Enable debug logging (default: false)
  debug: false
});

// Technical Note:
// All API requests are sent to: http://api.sazito.com:8080
// Your store domain is passed via the x-forwarded-host header
```

## 📚 API Modules

The SDK provides **17 comprehensive API modules** covering all aspects of e-commerce:

| Module | Description | Key Features |
|--------|-------------|--------------|
| **products** | Product catalog | Browse, search, get details, variants, filters |
| **categories** | Product categories | Hierarchical categories, filtering |
| **cart** | Shopping cart | Guest support, add/update/remove items |
| **invoices** | Checkout flow | Create invoice, discount codes, shipping assignment |
| **orders** | Order management | Order history, tracking, details |
| **shipping** | Shipping & addresses | Address CRUD, shipping methods, rates |
| **payments** | Payment processing | 20+ gateways, initialization, callbacks |
| **users** | User management | Authentication, profiles, preferences |
| **search** | Advanced search | Full-text search, filters, sorting |
| **feedbacks** | Reviews & ratings | Comments, ratings, moderation |
| **wallet** | User wallet | Balance, transactions, top-up |
| **cms** | Content management | Pages, blog posts, dynamic content |
| **menu** | Navigation menus | Menu structure, links, categories |
| **images** | File management | Upload, resize, CDN URLs |
| **visits** | Analytics | Track visits, events, conversions |
| **booking** | Appointments | Event scheduling, reservations |
| **entityRoutes** | URL routing | Resolve slugs to entities |

📖 **Complete documentation**: [API_REFERENCE.md](docs/API_REFERENCE.md)

## 💡 Quick API Reference

### 🛍️ Products

```typescript
// Get single product by ID or slug
const response = await sazito.products.get(123);
const response = await sazito.products.get('laptop-gaming-pro');

// List products with filtering
const response = await sazito.products.list({
  categories: 5,
  page: 1,
  pageSize: 20,
  sort: 'newest',  // newest, best-selling, availability, discount, !price (asc), price (desc)
  priceMin: 100,
  priceMax: 1000,
  availableOnly: true
});

// Get product variants
const response = await sazito.products.getVariants(123);

// Search products
const response = await sazito.search.search('laptop', {
  page: 1,
  pageSize: 20
});
```

### 🛒 Shopping Cart

```typescript
// Create a new cart (usually automatic on first add)
const response = await sazito.cart.create({
  product_variants: [
    { id: 123, count: 2 },
    { id: 456, count: 1 }
  ]
});

// Get current cart
const response = await sazito.cart.get();
console.log(response.data.items);  // Cart items
console.log(response.data.totalPrice);  // Total amount
console.log(response.data.quantity);  // Total items

// Add item to cart
const response = await sazito.cart.addItem(variantId, 2);

// Update item quantity
const response = await sazito.cart.updateItem(cartProductId, 3);

// Remove item from cart
const response = await sazito.cart.removeItem(cartProductId, variantId);

// Clear entire cart
sazito.cart.clearCart();
```

### 💰 Checkout (Invoices)

```typescript
// Step 1: Create invoice from cart
const response = await sazito.invoices.create();
const invoiceId = response.data.id;

// Get current invoice
const response = await sazito.invoices.get();

// Refresh invoice (recalculate totals, shipping, etc.)
const response = await sazito.invoices.refresh();

// Apply discount code
const response = await sazito.invoices.addDiscountCode('SUMMER2026');

// Remove discount code
const response = await sazito.invoices.removeDiscountCode();

// Step 2: Get applicable shipping methods for invoice
const response = await sazito.invoices.getApplicableShippingMethods();

// Step 3: Assign shipping method to invoice items
const response = await sazito.invoices.assignShippingMethod([
  {
    rate_id: 123,
    invoice_item_ids: ['item-1', 'item-2']
  }
]);

// Step 4: Add/update shipping address
const response = await sazito.invoices.addShippingAddress(
  addressId,
  'home'  // address identifier
);

// Clear invoice credentials
sazito.invoices.clearInvoice();
```
### 🚚 Shipping & Addresses

```typescript
// Create shipping address
const response = await sazito.shipping.createAddress({
  first_name: 'John',
  last_name: 'Doe',
  mobile_phone: '09123456789',
  region_id: 1,
  city_id: 5,
  address: '123 Main St, Apt 4B',
  postal_code: '1234567890',
  landline_phone: '02112345678'  // Optional
});

// Update shipping address
const response = await sazito.shipping.updateAddress({
  id: addressId,
  first_name: 'Jane',
  // ... other fields
});

// Get all shipping addresses
const response = await sazito.shipping.getAddress();

// Delete shipping address
const response = await sazito.shipping.deleteAddress(addressId);

// Get available shipping methods
const response = await sazito.shipping.getMethods();

// Clear shipping credentials
sazito.shipping.clearAddress();
```

### 💳 Payments

```typescript
// Step 1: Get available payment methods
const response = await sazito.payments.getMethods();
const paymentMethods = response.data.items;

// Step 2: Create payment for invoice
const response = await sazito.payments.create(paymentTypeId);

// Step 3: Initialize payment (get gateway URL and params)
const response = await sazito.payments.initialize();

// Handle different payment methods
if (response.data.action === 'POST') {
  // For POST-based gateways (most common)
  const form = document.createElement('form');
  form.action = response.data.address;
  form.method = 'POST';
  
  // Add form fields from payload
  Object.entries(response.data.payload).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value as string;
    form.appendChild(input);
  });
  
  document.body.appendChild(form);
  form.submit();
  
} else if (response.data.action === 'REDIRECT') {
  // For redirect-based gateways
  window.location.href = response.data.address;
}

// For card-to-card payments (manual verification)
const response = await sazito.payments.processStep({
  payment_identifier: 'payment-id',
  image_url: 'receipt-image-url',  // Uploaded receipt
  code: 'tracking-code-123'
});

// Clear payment credentials
sazito.payments.clearPayment();
```

### 📦 Orders

```typescript
// List user orders (requires authentication)
const response = await sazito.orders.list({
  page: 1,
  pageSize: 20,
  status: 'completed'  // Optional filter
});

// Get single order details
const response = await sazito.orders.get(orderId);
console.log(response.data.items);  // Order items
console.log(response.data.status);  // Order status
console.log(response.data.totalPrice);  // Total amount
```

### 📄 CMS & Content

```typescript
// Get CMS pages
const response = await sazito.cms.getPages();

// Get single page
const response = await sazito.cms.getPage('about-us');

// Get blog posts
const response = await sazito.cms.listBlogPosts({
  page: 1,
  pageSize: 10
});

// Get single blog post
const response = await sazito.cms.getBlogPost('article-slug');

// Get menus
const response = await sazito.menu.get('main-menu');
```

## 🔐 Authentication

The SDK uses secure HTTP-only cookies for token storage with localStorage fallback.

```typescript
// After successful user login (you handle the login form/UI)
const token = 'jwt-token-from-your-login-endpoint';
sazito.setAuthToken(token);

// Check authentication status
const isAuthenticated = sazito.isAuthenticated();

// Get current auth token
const token = sazito.getAuthToken();

// Logout (clear authentication)
sazito.clearAuth();

// Example login flow
async function login(username: string, password: string) {
  // Call your authentication endpoint
  const loginResponse = await fetch('https://api.sazito.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const { token } = await loginResponse.json();
  
  // Store token in SDK
  sazito.setAuthToken(token);
  
  // Now all authenticated requests will include this token
  const orders = await sazito.orders.list();
}
```

## 👤 Guest Checkout

The SDK provides seamless support for guest (anonymous) users. Cart, invoice, shipping, and payment credentials are automatically managed in localStorage.

```typescript
// Guest user workflow - NO authentication required

// 1. Guest adds items to cart
await sazito.cart.addItem(variantId, 2);
// Cart credentials automatically saved to localStorage

// 2. Guest views cart
const cartResponse = await sazito.cart.get();
console.log('Guest cart:', cartResponse.data);

// 3. Guest creates invoice (starts checkout)
await sazito.invoices.create();
// Invoice credentials automatically saved

// 4. Guest adds shipping address
await sazito.shipping.createAddress({
  first_name: 'John',
  last_name: 'Doe',
  mobile_phone: '09123456789',
  region_id: 1,
  city_id: 5,
  address: '123 Main St',
  postal_code: '1234567890'
});

// 5. Guest completes payment
const paymentMethods = await sazito.payments.getMethods();
await sazito.payments.create(paymentMethods.data.items[0].id);
const gateway = await sazito.payments.initialize();
// ... redirect to payment gateway

// Optional: Merge guest cart with user account after login
async function handleGuestToUserMerge() {
  // Get guest credentials before login
  const guestCart = await sazito.cart.get();
  
  // User logs in
  sazito.setAuthToken(userToken);
  
  // Transfer guest cart items to user account
  if (guestCart.data) {
    for (const item of guestCart.data.items) {
      await sazito.cart.addItem(item.variantId, item.quantity);
    }
  }
  
  // Clear guest data
  sazito.cart.clearCart();
  sazito.invoices.clearInvoice();
}
```

## ⚠️ Error Handling

The SDK uses a unified response pattern with no thrown exceptions. All errors are returned in the response object.

```typescript
// All API methods return: { data?, error?, meta? }
const response = await sazito.products.get(123);

if (response.error) {
  // Error occurred
  console.error('Error message:', response.error.message);
  console.error('HTTP status:', response.error.status);
  console.error('Error type:', response.error.type);
  
  // Error types:
  // - 'network': Network/connection issues
  // - 'api': API returned error response
  // - 'validation': Invalid request parameters
  
  // Handle specific errors
  if (response.error.status === 404) {
    console.log('Product not found');
  } else if (response.error.status === 401) {
    console.log('Authentication required');
    // Redirect to login
  }
} else {
  // Success - use data
  console.log('Product:', response.data);
}

// Example: Comprehensive error handling
async function fetchProductWithErrorHandling(productId: number) {
  const response = await sazito.products.get(productId);
  
  if (response.error) {
    switch (response.error.type) {
      case 'network':
        showToast('Network error. Please check your connection.');
        break;
      case 'api':
        if (response.error.status === 404) {
          showToast('Product not found');
        } else {
          showToast(`Error: ${response.error.message}`);
        }
        break;
      case 'validation':
        showToast('Invalid product ID');
        break;
    }
    return null;
  }
  
  return response.data;
}
```

## 🎛️ Per-Request Options

Override global SDK configuration on a per-request basis:

```typescript
// Disable cache for a specific request
const response = await sazito.products.get(123, { 
  cache: false 
});

// Disable retries for critical operations
const response = await sazito.cart.addItem(variantId, 2, undefined, { 
  retries: 0 
});

// Custom timeout for specific request
const response = await sazito.products.list({}, { 
  timeout: 5000  // 5 seconds instead of default 30s
});

// Add custom headers
const response = await sazito.products.get(123, {
  headers: { 
    'X-Custom-Header': 'value',
    'X-Request-ID': 'unique-id-123'
  }
});

// Combine multiple options
const response = await sazito.products.list(
  { page: 1, pageSize: 50 },
  {
    cache: false,
    timeout: 10000,
    retries: 1,
    headers: { 'X-Priority': 'high' }
  }
);
```

## 🗄️ Cache & Credentials Management

```typescript
// Clear all cache (products, categories, etc.)
sazito.clearCache();

// Clear specific credentials
sazito.cart.clearCart();              // Clear cart credentials
sazito.invoices.clearInvoice();       // Clear invoice credentials
sazito.shipping.clearAddress();       // Clear shipping credentials
sazito.payments.clearPayment();       // Clear payment credentials

// Clear authentication token
sazito.clearAuth();

// Clear everything (auth + cache + all credentials)
sazito.clearAll();

// Example: Logout and cleanup
function handleLogout() {
  // Clear authentication
  sazito.clearAuth();
  
  // Clear user-specific data
  sazito.clearCache();
  sazito.cart.clearCart();
  sazito.invoices.clearInvoice();
  
  // Or simply use:
  sazito.clearAll();
  
  // Redirect to home
  window.location.href = '/';
}
```

## 🌐 CDN Usage (UMD Build)

Use the SDK directly in the browser without a build step:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Sazito Store</title>
</head>
<body>
  <div id="products"></div>

  <!-- Load from CDN -->
  <script src="https://unpkg.com/@sazito/client-sdk@latest/dist/index.umd.js"></script>
  
  <script>
    // SDK is available as SazitoSDK global
    const sazito = SazitoSDK.createSazitoClient({
      domain: 'mystore.sazito.com'
    });

    // Fetch and display products
    async function loadProducts() {
      const response = await sazito.products.list({ 
        page: 1, 
        pageSize: 10 
      });

      if (response.data) {
        const productsDiv = document.getElementById('products');
        response.data.items.forEach(product => {
          const div = document.createElement('div');
          div.innerHTML = `
            <h3>${product.name}</h3>
            <p>Price: $${product.price}</p>
          `;
          productsDiv.appendChild(div);
        });
      }
    }

    loadProducts();
  </script>
</body>
</html>
```

## 📘 TypeScript Support

The SDK is built with TypeScript and provides comprehensive type definitions:

```typescript
import { 
  createSazitoClient,
  SazitoResponse,
  Product,
  Cart,
  Invoice,
  Order,
  ShippingAddress,
  PaymentMethod,
  SazitoConfig
} from '@sazito/client-sdk';

// Full type safety and autocomplete
const config: SazitoConfig = {
  domain: 'mystore.sazito.com',
  timeout: 30000,
  debug: false
};

const sazito = createSazitoClient(config);

// Typed responses
const productResponse: SazitoResponse<Product> = await sazito.products.get(123);

if (productResponse.data) {
  // TypeScript knows all available properties
  const product: Product = productResponse.data;
  console.log(product.name);
  console.log(product.price);
  console.log(product.variants);
}

// Typed list responses
interface ProductListResponse {
  items: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
}

const listResponse: SazitoResponse<ProductListResponse> = 
  await sazito.products.list({ page: 1 });

// All types are exported for your convenience
function processCart(cart: Cart) {
  cart.items.forEach(item => {
    console.log(`${item.productName}: ${item.quantity} x $${item.unitPrice}`);
  });
}
```

## 🎨 Data Transformations

The SDK automatically transforms API field names to beautiful, developer-friendly names:

| API Field | SDK Field | Description |
|-----------|-----------|-------------|
| `no_of_items` | `quantity` | Number of items |
| `single_item_price` | `unitPrice` | Price per unit |
| `total_payable_price` | `totalPrice` | Total amount |
| `cart_product_id` | `cartProductId` | Cart item ID |
| `product_variant_id` | `variantId` | Product variant ID |
| `first_name` | `firstName` | First name |
| `last_name` | `lastName` | Last name |
| `mobile_phone` | `mobilePhone` | Mobile number |
| `postal_code` | `postalCode` | ZIP/postal code |

**Benefits:**
- ✨ Clean, readable code
- 🎯 Consistent naming across your app
- 📝 Better IDE autocomplete
- 🔄 Automatic bidirectional transformation (request & response)

📖 **Complete transformation guide**: [TRANSFORMERS_GUIDE.md](docs/TRANSFORMERS_GUIDE.md)

## 🚀 Example: Complete E-commerce Flow

```typescript
import { createSazitoClient } from '@sazito/client-sdk';

const sazito = createSazitoClient({
  domain: 'mystore.sazito.com'
});

async function completeCheckout() {
  // 1. Browse products
  const products = await sazito.products.list({ page: 1, pageSize: 20 });
  
  // 2. Add to cart
  await sazito.cart.addItem(products.data.items[0].variants[0].id, 2);
  
  // 3. View cart
  const cart = await sazito.cart.get();
  console.log(`Cart total: $${cart.data.totalPrice}`);
  
  // 4. Create invoice
  await sazito.invoices.create();
  
  // 5. Apply discount code
  await sazito.invoices.addDiscountCode('WELCOME10');
  
  // 6. Add shipping address
  await sazito.shipping.createAddress({
    first_name: 'John',
    last_name: 'Doe',
    mobile_phone: '09123456789',
    region_id: 1,
    city_id: 5,
    address: '123 Main Street',
    postal_code: '1234567890'
  });
  
  // 7. Get shipping methods
  const shippingMethods = await sazito.invoices.getApplicableShippingMethods();
  
  // 8. Assign shipping method
  const invoice = await sazito.invoices.get();
  await sazito.invoices.assignShippingMethod([{
    rate_id: shippingMethods.data[0].rates[0].id,
    invoice_item_ids: invoice.data.items.map(item => item.id)
  }]);
  
  // 9. Get payment methods
  const paymentMethods = await sazito.payments.getMethods();
  
  // 10. Create payment
  await sazito.payments.create(paymentMethods.data.items[0].id);
  
  // 11. Initialize payment gateway
  const gateway = await sazito.payments.initialize();
  
  // 12. Redirect to payment gateway
  if (gateway.data.action === 'REDIRECT') {
    window.location.href = gateway.data.address;
  }
}
```

## 📚 Documentation

### Core Documentation
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Comprehensive guide with React & Next.js examples
- **[Quick Start](docs/QUICK_START.md)** - Get started in 5 minutes
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation for all 17 modules
- **[Testing Guide](docs/TESTING.md)** - Testing strategies and examples

### Data & Transformations
- **[Transformers Guide](docs/TRANSFORMERS_GUIDE.md)** - Field name transformation system
- **[Data Transformation](docs/DATA_TRANSFORMATION.md)** - Developer guide to transformations
- **[API Params & Responses](docs/API_PARAMS_RESPONSES.md)** - Complete transformation reference
- **[Product Filters](docs/PRODUCT_FILTERS_REFERENCE.md)** - Product filtering and sorting

### Architecture & Planning
- **[SDK Plan](docs/SAZITO_SDK_PLAN.md)** - Architecture and design decisions
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[Authentication Analysis](docs/AUTHENTICATION_ANALYSIS.md)** - Auth flow documentation
- **[Cart/Invoice Flow](docs/CART_INVOICE_SHIPPING_PAYMENT.md)** - E-commerce flow analysis

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

## 📄 License

MIT © Sazito

---

**Need Help?**
- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/sazito/client-sdk/issues)
- 💬 [Discussions](https://github.com/sazito/client-sdk/discussions)

