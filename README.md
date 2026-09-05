# Sazito Client SDK

Official JavaScript/TypeScript SDK for Sazito storefronts.

Read the full developer documentation at [developers.sazito.com](https://developers.sazito.com).

This SDK is built for application developers who want a typed, framework-agnostic client with:
- automatic request/response key transformation
- unified response objects (`{ data, error }`)
- configurable retry/timeout/cache behavior
- guest checkout credential handling
- modular API access for products, cart, invoices, shipping, payments, user, CMS, analytics, and more

## Package

- Name: `@sazito/client-sdk`
- Version: See `package.json`
- License: `MIT`

## Requirements

- Node.js 18+ (recommended) or any runtime with `fetch`
- Browser environments with `fetch`

## Install

```bash
npm install @sazito/client-sdk
```

```bash
yarn add @sazito/client-sdk
```

```bash
pnpm add @sazito/client-sdk
```

## Quick Start

```ts
import { createSazitoClient } from '@sazito/client-sdk';

const sazito = createSazitoClient({
  domain: 'mystore.sazito.com'
});

const res = await sazito.products.list({
  page: 1,
  pageSize: 20,
  sort: 'newest'
});

if (res.error) {
  console.error(res.error.message, res.error.status);
} else {
  console.log(res.data.items);
}
```

## Checkout component

For a ready-made React/Next.js checkout UI, install the companion package:

```bash
pnpm add @sazito/client-sdk @sazito/checkout
```

Create one SDK client, provide it to the checkout, and import the checkout
stylesheet once:

```tsx
'use client';

import '@sazito/checkout/styles.css';
import { createSazitoClient } from '@sazito/client-sdk';
import { SazitoCheckoutPage, SazitoProvider } from '@sazito/checkout/next';

const sazito = createSazitoClient({ domain: 'mystore.sazito.com' });

export default function CheckoutPage() {
  return (
    <SazitoProvider client={sazito}>
      <SazitoCheckoutPage
        credentials={{ cart: { identifier: 'cart-identifier' } }}
        config={{
          locale: 'fa',
          continueShoppingUrl: '/',
          theme: {
            accent: '#4f46e5',
            accentForeground: '#ffffff',
            radius: 16
          }
        }}
      />
    </SazitoProvider>
  );
}
```

The component provides a typed, RTL-first flow for `cart → shipping → payment → result`,
including cart editing, address and shipping-rate selection, discounts, payment
gateway redirects, and pending-payment polling. It reuses the credentials stored
by the SDK client, so credentials created through `sazito.cart` and
`sazito.invoices` can be used by the component. For theming, custom buttons,
analytics, payment returns, and a fully custom layout, see the
[checkout guide](https://developers.sazito.com/docs/guides/checkout).

## Core Response Model

All SDK methods return a `SazitoResponse<T>`:

```ts
type SazitoResponse<T> = {
  data?: T;
  error?: {
    status?: number;
    message: string;
    type: 'network' | 'api' | 'validation';
    details?: any;
  };
};
```

Typical usage:

```ts
const response = await sazito.categories.get(110);

if (response.error) {
  // API/network/validation issue
  return;
}

// success path
console.log(response.data);
```

## Configuration

```ts
import { createSazitoClient } from '@sazito/client-sdk';

const sazito = createSazitoClient({
  domain: 'mystore.sazito.com',
  timeout: 30000,
  debug: false,
  retry: {
    enabled: true,
    retries: 3,
    retryDelay: 1000
  },
  cache: {
    products: { enabled: true, ttl: 600000 },
    categories: { enabled: true, ttl: 600000 },
    cart: { enabled: false },
    orders: { enabled: false },
    search: { enabled: true, ttl: 300000 },
    cms: { enabled: true, ttl: 600000 },
    tags: { enabled: true, ttl: 600000 },
    entityRoutes: { enabled: true, ttl: 600000 }
  }
});
```

### Config Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `domain` | `string` | Yes | Store domain without protocol |
| `timeout` | `number` | No | Global request timeout in ms (default `30000`) |
| `retry` | object | No | Retry policy for 5xx responses |
| `cache` | object | No | Per-module cache strategy |
| `customFetchApi` | `typeof fetch` | No | Override fetch implementation |
| `debug` | `boolean` | No | Enables SDK debug logging |

## Per-Request Overrides

Any API call can receive `RequestOptions`:

```ts
const response = await sazito.products.get('/product/sample-slug', {
  cache: false,
  timeout: 5000,
  retries: 1,
  headers: {
    'X-Request-ID': 'req-123'
  }
});
```

Supported request options:
- `retries`
- `timeout`
- `cache`
- `headers`
- `signal`

## Authentication

```ts
sazito.setAuthToken('YOUR_JWT');

const isLoggedIn = sazito.isAuthenticated();
const token = sazito.getAuthToken();

sazito.clearAuth();
```

Auth token behavior:
- SDK injects `Authorization` header automatically when a token exists.
- Token is sent as raw JWT (not `Bearer <token>`).
- Token is persisted under `user_id_token` in `localStorage` (with cookie fallback).

## Cache and Credential Utilities

```ts
sazito.clearCache();
sazito.clearCredentials();
sazito.clearAll();

sazito.cart.clearCart();
sazito.invoices.clearInvoice();
sazito.shipping.clearAddress();
sazito.payments.clearPayment();
```

## API Surface

### Client Modules

The client instance exposes:
- `products`
- `categories`
- `cart`
- `orders`
- `invoices`
- `shipping`
- `payments`
- `users`
- `search`
- `feedbacks`
- `wallet`
- `cms`
- `images`
- `visits`
- `booking`
- `entityRoutes`
- `menu`
- `general`
- `dynamicForms`
- `regions`

### Methods by Module

| Module | Methods |
|---|---|
| `products` | `get`, `list`, `search` |
| `categories` | `get`, `list` |
| `cart` | `get`, `create`, `addItem`, `addItemWithAttributes`, `updateItem`, `updateItemWithAttributes`, `removeItem`, `clearCart` |
| `orders` | `list`, `get` |
| `invoices` | `get`, `create`, `refresh`, `addShippingAddress`, `addDiscountCode`, `assignShippingMethod`, `addDetails`, `addForm`, `addCredit`, `removeCredit`, `toggleCredit`, `getApplicableShippingMethods`, `clearInvoice` |
| `shipping` | `createAddress`, `updateAddress` (legacy), `listAddresses`, `getAddress`, `getMethods`, `clearAddress` |
| `payments` | `getMethods`, `create`, `initialize`, `verify`, `verifyPaymentCallback`, `getPaymentStep`, `processStep`, `processStepForm`, `pollUntilSettled`, `clearPayment` |
| `users` | `login`, `requestMobileOTP`, `verifyMobileOTP`, `requestEmailLogin`, `register`, `getCurrentUser`, `updateProfile`, `requestMobilePhoneUpdate`, `verifyMobilePhoneUpdate`, `forgotPassword`, `revivePassword`, `mergeUser` |
| `search` | `query` |
| `feedbacks` | `getSeed`, `createOrderRating`, `submitProductReview`, `getProductStatistics`, `getProductReviews`, `uploadReviewImages`, `list`, `create`, `get` |
| `wallet` | `getBalance`, `applyCredit`, `removeCredit`, `listTransactions` |
| `cms` | `getPage`, `listPages`, `getBlogPost`, `listBlogPosts`, `listAll` |
| `images` | `upload`, `delete` |
| `visits` | `track`, `trackProduct`, `trackCategory` |
| `booking` | `listEvents`, `getEvent`, `createBooking`, `listBookings`, `cancelBooking` |
| `entityRoutes` | `resolve` |
| `menu` | `getHeaderMenu` |
| `general` | `getInfo`, `getFeatures`, `getCheckoutConfig`, `getWalletConfig`, `getTajrobeConfig` |
| `dynamicForms` | `getForm`, `uploadProductFormFile` |
| `regions` | `list` |

## Usage Examples

### Products and Search

```ts
const product = await sazito.products.get('/product/some-product-slug');

const list = await sazito.products.list({
  categories: [73, 94],
  priceMin: 100000,
  priceMax: 900000,
  availableOnly: true,
  discountedOnly: true,
  sort: '!price',
  page: 1,
  pageSize: 12
});

const search = await sazito.search.query('shoes', {
  categoryId: 73,
  minPrice: 100000,
  maxPrice: 900000,
  page: 1,
  pageSize: 10
});
```

### Checkout Modules Flow

```ts
// 1) Add product to cart
const cartRes = await sazito.cart.addItemWithAttributes(12345, 2);
if (cartRes.error) throw new Error(cartRes.error.message);

// 2) Create invoice from cart
const invoiceRes = await sazito.invoices.create();
if (invoiceRes.error) throw new Error(invoiceRes.error.message);

// 3) Add shipping address
const addrRes = await sazito.shipping.createAddress({
  firstName: 'John',
  lastName: 'Doe',
  mobilePhone: '09123456789',
  regionId: 1,
  cityId: 10,
  address: 'No. 10, Example St',
  postalCode: '1234567890'
});
if (addrRes.error) throw new Error(addrRes.error.message);

// 4) Attach shipping address to invoice
const attachRes = await sazito.invoices.addShippingAddress(addrRes.data.id, addrRes.data.identifier);
if (attachRes.error) throw new Error(attachRes.error.message);

// 5) Fetch methods and assign shipping
const methodsRes = await sazito.invoices.getApplicableShippingMethods();
if (methodsRes.error) throw new Error(methodsRes.error.message);
if (methodsRes.data?.itemsShippingRate?.length) {
  const assignments = methodsRes.data.itemsShippingRate.map((entry) => ({
    rateId: entry.shippingRate.id,
    invoiceItemIds: [entry.invoiceItemId],
  }));

  const assignRes = await sazito.invoices.assignShippingMethod(assignments);
  if (assignRes.error) throw new Error(assignRes.error.message);
}

// 6) Payment
const paymentMethods = await sazito.payments.getMethods();
if (paymentMethods.error) throw new Error(paymentMethods.error.message);
if (paymentMethods.data?.length) {
  const paymentCreateRes = await sazito.payments.create(paymentMethods.data[0].id);
  if (paymentCreateRes.error) throw new Error(paymentCreateRes.error.message);

  const action = await sazito.payments.initialize();
  if (action.error) throw new Error(action.error.message);
  console.log(action.data);
}
```

### Users/Auth

```ts
const login = await sazito.users.login({
  email: 'dev@example.com',
  password: 'strong-password'
});

if (login.data?.jwt) {
  sazito.setAuthToken(login.data.jwt);
}

const me = await sazito.users.getCurrentUser();
```

### CMS and Entity Routes

```ts
const route = await sazito.entityRoutes.resolve('/product/some-product-slug');
const page = await sazito.cms.getPage('/about-us');
const blog = await sazito.cms.getBlogPost('/blog/how-to-buy');
```

### Menu and General Config

```ts
const menu = await sazito.menu.getHeaderMenu();
const info = await sazito.general.getInfo();
const features = await sazito.general.getFeatures();
```

### Analytics Visits

```ts
await sazito.visits.track();
```

## Data Transformation Behavior

The SDK transforms request and response keys to improve developer ergonomics.

Common examples:
- `no_of_items` -> `quantity`
- `single_item_price` -> `unitPrice`
- `product_variant_id` -> `variantId`
- `first_name` -> `firstName`
- `postal_code` -> `postalCode`

Notes:
- Request payloads are transformed before being sent.
- Response payloads are transformed before being returned.
- Some APIs accept both SDK-friendly and raw fields for backward compatibility.

## Visual API Playground

Run the local visual playground:

```bash
pnpm visual:apis
```

Then open:
- `http://127.0.0.1:4173`

Files:
- `scripts/visual-docs-server.js`
- `scripts/visual-api-playground/public/index.html`
- `scripts/visual-api-playground/public/app.js`
- `scripts/visual-api-playground/public/styles.css`

## Development

Project scripts:

```bash
pnpm build          # Build dist outputs
pnpm dev            # Rollup watch mode
pnpm typecheck      # TypeScript check (no emit)
pnpm lint           # ESLint on src/
pnpm validate       # typecheck + lint
```

### Releases

Run releases from a clean Git worktree. The release script checks npm authentication,
validates each package, bumps its version, publishes it, creates a package-specific
commit and tag, and pushes the resulting refs. When releasing both packages, the SDK
is published before checkout.

```bash
pnpm release:checkout -- patch
pnpm release:sdk -- patch
pnpm release:all -- patch
```

Use `minor` or `major` instead of `patch` when needed. Pass `--no-push` to leave the
release commits and tags local, or `--yes` to skip confirmation in CI.

## Fumadocs Documentation Site

SDK docs are implemented as a separate Fumadocs app in `docs/`.

Run docs locally from the repository root:

```bash
pnpm docs:install
pnpm docs:dev
```

Build/start docs:

```bash
pnpm docs:build
pnpm docs:start
```

This docs app is tracked in GitHub, but it is not included in the published npm package.
Publishing is controlled by the root `files` list in `package.json`, which only ships:
- `dist/`
- `README.md`
- `LICENSE`

Relevant docs routes:
- `app/docs/[[...slug]]` for the rendered docs pages
- `app/llms-docs/[[...slug]]` for markdown-friendly LLM exports (`/docs/*.mdx` rewrite target)
- `app/llms.txt` and `app/llms-full.txt` for index/full LLM text exports

Output formats:
- `dist/index.js` (CJS)
- `dist/index.esm.js` (ESM)
- `dist/index.umd.js` (UMD)
- `dist/index.d.ts` (types)

## Repository Structure

```txt
src/
  api/           API modules
  core/          client, config, HTTP layer, cache
  constants/     endpoint constants
  types/         exported SDK types
  utils/         token storage, credentials, transformers
scripts/
  visual-docs-server.js
  visual-api-playground/public/
docs/
  app/           Next.js routes and layouts
  content/docs/  MDX documentation pages
  lib/           Fumadocs source/layout config
```

## Troubleshooting

### `error.type === 'validation'`
Usually means prerequisite state is missing (for example no cart/invoice credentials in guest flow). Initialize earlier steps first.

### `error.type === 'network'`
Check connectivity, runtime `fetch` support, and request timeout.

### Authentication issues
Make sure token is set with `setAuthToken` and that your backend accepts raw JWT in `Authorization`.

### CMS helpers may throw
`cms.getPage` / `cms.getBlogPost` validate entity type and can throw when URL resolves to another entity type. Wrap these calls in `try/catch`.

## Minimal TypeScript Example

```ts
import { createSazitoClient, SazitoResponse, Product } from '@sazito/client-sdk';

const client = createSazitoClient({ domain: 'mystore.sazito.com' });

async function getProduct(path: string): Promise<Product | null> {
  const res: SazitoResponse<Product> = await client.products.get(path);
  return res.data ?? null;
}
```
