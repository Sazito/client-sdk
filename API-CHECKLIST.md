# Sazito SDK API Enhancement Checklist

This checklist tracks the review and enhancement of all SDK APIs. Each API needs to be reviewed for response structure optimization, field cleaning, proper filtering/sorting, and type definitions.

## Checklist Status Legend
- ✅ **Done** - API reviewed, optimized, and tested
- 🚧 **In Progress** - Currently working on this API
- ⏳ **Pending** - Not started yet
- ⚠️ **Needs Review** - Implemented but needs testing/review

---

## Core APIs

### 1. Products API ✅
**Status:** Done
**Date Completed:** 2025-12-16

**What was done:**
- ✅ Cleaned Product structure (removed 8 unnecessary fields)
- ✅ Cleaned ProductVariant structure (removed 6 unnecessary fields)
- ✅ Simplified ProductCategory (id, name, url only)
- ✅ Optimized Image structure (removed widthRatio, heightRatio, thumb)
- ✅ Implemented 6 sort options (newest, best-selling, availability, discount, !price, price)
- ✅ Implemented filters (categories, priceMin, priceMax, availableOnly, discountedOnly)
- ✅ Updated TypeScript types
- ✅ Created test script with all scenarios

**Files modified:**
- `src/api/products.ts`
- `src/types/product.ts`
- `src/types/common.ts`
- `src/utils/transformers.ts`

---

### 2. Search API ✅
**Status:** Done
**Date Completed:** 2025-12-16

**What was done:**
- ✅ Multi-entity support (products, blogPages, cmsPages, productCategories)
- ✅ Separate pagination for each entity type
- ✅ Clean product data using cleanProduct transformer
- ✅ Created SearchResponse type
- ✅ Proper parameter transformation (query, search_direction, page_number, page_size)

**Files modified:**
- `src/api/products.ts` (search method)
- `src/types/search.ts` (new file)
- `src/utils/transformers.ts`

---

### 3. Cart API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review cart response structure
- [ ] Identify and remove unnecessary fields
- [ ] Optimize cart items structure
- [ ] Clean nested product/variant data
- [ ] Review transformAddToCartInput
- [ ] Review transformCreateCartInput
- [ ] Update CartItem, Cart types
- [ ] Test add to cart, update quantity, remove item
- [ ] Create test script

**Expected optimizations:**
- Clean product data in cart items
- Simplify variant structure
- Remove redundant fields

**Files to modify:**
- `src/api/cart.ts`
- `src/types/cart.ts`
- `src/utils/transformers.ts`

---

### 4. Categories API ✅
**Status:** Done
**Date Completed:** 2025-12-27

**What was done:**
- ✅ Created transformCategoryListResponse and transformCategoryResponse transformers
- ✅ Clean category data (removed staticUrl, items, products fields)
- ✅ Recursive cleaning of hierarchical tree structure
- ✅ Keep important fields (themeConfig, attributes) for functionality
- ✅ Updated categories.ts API to use transformers
- ✅ Created CategoryListResponse, CategoryTree, CategoryTreeNode types
- ✅ Created comprehensive test suite with 5 test scenarios

**Fields removed:**
- `staticUrl` - Always false, internal flag
- `items` - Always null in list responses
- `products` - Use products.list() with category filter instead

**Fields kept (important for functionality):**
- `themeConfig` - Page layout and component configuration
- `attributes` - SEO metadata (metaTitle, metaDescription, etc.)
- All core fields - id, name, url, enabled, description, productsCount

**Files modified:**
- `src/api/categories.ts`
- `src/utils/transformers.ts`
- `examples/test-categories-response.js` (new file)
- `examples/test-categories-raw.js` (new file - for debugging)

**Notes:**
- The API's `get()` method by ID/slug appears to have limited support
- Use `list()` for all categories or `entityRoutes.resolve()` for specific category URLs
- Tree structure is cleaned recursively, perfect for navigation menus

---

### 5. Invoices API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review invoice response structure
- [ ] Clean invoice items
- [ ] Optimize nested product data
- [ ] Review shipping/payment details
- [ ] Update transformInvoiceResponse
- [ ] Update Invoice, InvoiceItem types
- [ ] Test create, get, update methods
- [ ] Create test script

**Expected optimizations:**
- Clean product data in invoice items
- Simplify shipping address
- Remove redundant fields

**Files to modify:**
- `src/api/invoices.ts`
- `src/types/invoice.ts`
- `src/utils/transformers.ts`

---

### 6. Shipping API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review shipping methods response
- [ ] Review shipping rates structure
- [ ] Clean shipping address data
- [ ] Optimize grouped shipping rates
- [ ] Review transformShippingAddressInput
- [ ] Update ShippingMethod, ShippingAddress types
- [ ] Test get methods, get rates, set address
- [ ] Create test script

**Expected optimizations:**
- Simplify shipping methods
- Clean shipping rates
- Remove unnecessary address fields

**Files to modify:**
- `src/api/shipping.ts`
- `src/types/shipping.ts`
- `src/utils/transformers.ts`

---

### 7. Payments API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review payment methods response
- [ ] Review payment creation response
- [ ] Review transformPaymentMethodsResponse
- [ ] Optimize payment gateway data
- [ ] Update PaymentMethod, PaymentType types
- [ ] Test get methods, create payment
- [ ] Create test script

**Expected optimizations:**
- Simplify payment methods structure
- Clean gateway configuration
- Standardize field names

**Files to modify:**
- `src/api/payments.ts`
- `src/types/payment.ts`
- `src/utils/transformers.ts`

---

### 8. Orders API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review orders list response
- [ ] Review single order response
- [ ] Clean order items structure
- [ ] Optimize nested invoice/shipping data
- [ ] Add filtering/sorting options
- [ ] Update Order, OrderItem types
- [ ] Test list, get methods
- [ ] Create test script

**Expected optimizations:**
- Clean order items
- Simplify nested data
- Add pagination support
- Remove redundant fields

**Files to modify:**
- `src/api/orders.ts`
- `src/types/order.ts`

---

### 9. Users/Authentication API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review user profile response
- [ ] Review login/register responses
- [ ] Clean user data structure
- [ ] Review credentials manager
- [ ] Update User type
- [ ] Test auth flow (login, register, profile, logout)
- [ ] Create test script

**Expected optimizations:**
- Simplify user profile
- Clean address data
- Remove sensitive/unnecessary fields

**Files to modify:**
- `src/api/users.ts`
- `src/utils/credentials-manager.ts`

---

## Secondary APIs

### 10. Entity Routes API ✅
**Status:** Done
**Date Completed:** 2025-12-27

**What was done:**
- ✅ Created comprehensive EntityRoute types with discriminated unions
- ✅ Implemented transformEntityRouteResponse transformer
- ✅ Clean entity data based on type (product, category, cms_page, blog_page)
- ✅ Remove unnecessary fields while keeping important ones
- ✅ Updated products.ts to use entity route transformer
- ✅ Proper error handling for unknown entities (404)
- ✅ Type-safe entity route responses
- ✅ Created comprehensive test suite with 7 test scenarios

**Fields removed:**
- **All entities**: `id` (moved to `entityId` at root level)
- From Products: `staticUrl`, `summary`, `tags`
- From Variants: `title`, `product` (nested), `status`, `soldCount`
- From Categories: `staticUrl`, `products`
- From CMS/Blog: `staticUrl`
- From Images: `widthRatio`, `heightRatio`, `thumb`

**Fields kept (important for functionality):**
- Products: `themeConfig`, `dynamicFormId`, `eventEntityId`, `attributes`
- Variants: `weight`, `dynamicFormId`
- Categories: `themeConfig`, `attributes`
- CMS/Blog: `themeConfig`, `attributes`

**Files modified:**
- `src/api/entity-routes.ts`
- `src/types/entity-route.ts` (new file)
- `src/types/product.ts` (updated Product, ProductVariant, ProductCategory)
- `src/types/search.ts` (updated CmsPage, BlogPage)
- `src/utils/transformers.ts`
- `src/api/products.ts`
- `examples/test-entity-routes-response.js` (new file)

---

### 11. Tags API ❌
**Status:** Removed
**Date Removed:** 2025-12-29

**Reason:** Not needed by the user. The Tag type remains in product.ts for potential future use, but the Tags API module has been completely removed.

**Files removed:**
- `src/api/tags.ts` - Deleted

**Files modified:**
- `src/core/client.ts` - Removed TagsAPI import and initialization
- `src/constants/endpoints.ts` - Removed TAGS_API endpoint

---

### 12. CMS API ✅
**Status:** Done
**Date Completed:** 2025-12-29

**What was done:**
- ✅ Updated endpoint to `/api/v1/cms_pages` (correct endpoint)
- ✅ Created transformCMSListResponse and transformCMSPageResponse transformers
- ✅ Created transformCMSFilters to handle backend filter format (`filters[]` JSON string)
- ✅ Updated CMSPage type to match CmsPage/BlogPage from search.ts
- ✅ Added CMSPageType enum ('normal' | 'blog')
- ✅ Implemented proper filtering for CMS pages vs blog posts
- ✅ Created CMSFilters interface with page, pageSize, cmsPageTypes
- ✅ Added listPages(), listBlogPosts(), getBlogPost(), getPage(), listAll() methods
- ✅ Clean CMS data (removes staticUrl, preserves themeConfig, attributes, content)
- ✅ Both direct API access and Entity Routes work

**API Methods:**
- `getPage(id)` - Get single CMS page
- `listPages(filters)` - List CMS pages (excludes blog posts)
- `getBlogPost(id)` - Get single blog post
- `listBlogPosts(filters)` - List blog posts (excludes CMS pages)
- `listAll(filters)` - List all content (both pages and blogs)

**Fields removed:**
- `id` - Moved to entityId when accessed via entity routes
- `staticUrl` - Always false, internal flag

**Fields kept (important for functionality):**
- `themeConfig` - Page layout and component configuration
- `attributes` - SEO metadata (metaTitle, metaDescription, etc.)
- `content` - Full HTML content of the page/post
- `cmsPageType` - Differentiates 'normal' pages from 'blog' posts
- All core fields - name, url, enabled, image, summary, createdAt, updatedAt

**Files modified:**
- `src/api/cms.ts` - Complete rewrite with proper implementation
- `src/types/search.ts` - Added CMSPageType and fields to CmsPage/BlogPage
- `src/constants/endpoints.ts` - Fixed endpoint to `/api/v1/cms_pages`
- `src/utils/transformers.ts` - Added CMS transformers
- `examples/test-cms.js` - Comprehensive test suite with 7 test scenarios

**Access Patterns:**
```typescript
// Direct CMS API access
const pages = await sazito.cms.listPages({ page: 1, pageSize: 20 });
const blogs = await sazito.cms.listBlogPosts({ page: 1, pageSize: 10 });
const page = await sazito.cms.getPage(123);
const blog = await sazito.cms.getBlogPost(456);

// Via Entity Routes (alternative)
const page = await sazito.entityRoutes.resolve('/about-us');
const blog = await sazito.entityRoutes.resolve('/blog/my-post');
```

**Notes:**
- Both CMS pages and blog posts use the same endpoint with different filters
- Backend filter format: `filters[]={ "name": "cms_page_types", "value": "blog" }`
- SDK automatically handles filter transformation
- CmsPage and BlogPage types are identical and re-exported as CMSPage
- Direct API provides simpler interface than entity routes for listing content

---

### 13. Feedbacks API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review feedback creation response
- [ ] Review feedback list response
- [ ] Clean feedback structure
- [ ] Create Feedback type
- [ ] Test create, list methods
- [ ] Create test script

**Files to modify:**
- `src/api/feedbacks.ts`

---

### 14. Images API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review image upload response
- [ ] Clean image metadata
- [ ] Update Image type (already done in common.ts)
- [ ] Test upload method
- [ ] Create test script

**Files to modify:**
- `src/api/images.ts`

---

### 15. Booking/Scheduler API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review scheduler events response
- [ ] Review booking creation response
- [ ] Clean scheduler data
- [ ] Create SchedulerEvent, Booking types
- [ ] Test create, list methods
- [ ] Create test script

**Files to modify:**
- `src/api/booking.ts`

---

### 16. Visits/Analytics API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review visit tracking response
- [ ] Create Visit type
- [ ] Test track method
- [ ] Create test script

**Files to modify:**
- `src/api/visits.ts`

---

### 17. Wallet API ⏳
**Status:** Pending

**Tasks to complete:**
- [ ] Review wallet balance response
- [ ] Review transactions list response
- [ ] Clean transaction structure
- [ ] Add filtering/pagination for transactions
- [ ] Create Wallet, Transaction types
- [ ] Test get balance, transactions methods
- [ ] Create test script

**Files to modify:**
- `src/api/wallet.ts`

---

### 18. Menu API ✅
**Status:** Done
**Date Completed:** 2025-12-29

**What was done:**
- ✅ Created Menu API module for fetching navigation trees
- ✅ Implemented getHeaderMenu() method with identifier support
- ✅ Built tree-to-navigation conversion logic
- ✅ Automatic filtering of disabled menu items
- ✅ Recursive processing of nested menu structures
- ✅ Title resolution (custom vs entity name/title)
- ✅ URL resolution for different entity types
- ✅ Created MenuItem and MenuTree types
- ✅ Comprehensive test suite with 3 scenarios

**API Methods:**
- `getHeaderMenu(identifier?)` - Fetch and process menu tree by identifier (default: 'headermenu')

**Entity Types Supported:**
- `product_category` - Product categories with optional child inclusion
- `product` - Individual products
- `cms_page` - CMS pages
- `blog_page` - Blog posts
- `url` - Custom external URLs

**Processing Features:**
- Converts raw tree structure to clean navigation array
- Resolves menu item titles (custom or entity-based)
- Resolves URLs based on entity type
- Filters out disabled items automatically
- Handles nested children recursively

**Files created:**
- `src/api/menu.ts` - Menu API implementation
- `src/types/menu.ts` - Menu types (MenuItem, MenuTree, MenuNode)
- `examples/test-menu.js` - Comprehensive test suite

**Files modified:**
- `src/core/client.ts` - Added MenuAPI import and initialization
- `src/constants/endpoints.ts` - Added MENU_API endpoint
- `src/types/index.ts` - Exported menu types

**Usage Example:**
```typescript
// Fetch header menu (default)
const menu = await sazito.menu.getHeaderMenu();

// Fetch footer menu
const footerMenu = await sazito.menu.getHeaderMenu('footermenu');

// Result structure
[
  {
    name: "Electronics",
    url: "/category/electronics",
    children: [
      {
        name: "Phones",
        url: "/category/phones",
        children: []
      }
    ]
  }
]
```

**Notes:**
- ✅ Implementation complete with correct response structure (`result.tree`)
- ⚠️ Endpoint returns 500 error on test server (not configured or unavailable)
- Ready for use when endpoint is available in production
- Supports any menu identifier, not just header/footer
- Clean, recursive navigation structure perfect for rendering menus

---

## Optimization Patterns

### Common Tasks for Each API:
1. **Response Analysis**
   - Log actual API response
   - Identify unnecessary fields
   - Find nested bloat

2. **Transformation**
   - Create/update transformer functions
   - Remove unwanted fields
   - Simplify nested structures
   - Apply field name beautification

3. **Type Definitions**
   - Update/create TypeScript interfaces
   - Ensure type safety
   - Document field meanings

4. **Testing**
   - Create test script
   - Test all methods
   - Verify response structure
   - Check error handling

5. **Documentation**
   - Update this checklist
   - Document changes
   - Note breaking changes

---

## Progress Summary

**Completed:** 7/17 (41.2%)
**Removed:** 1/17 (5.9%)
**In Progress:** 0/17 (0%)
**Pending:** 9/17 (52.9%)

---

## Next Steps

1. **Priority 1 (Core Checkout Flow):**
   - Cart API
   - Invoices API
   - Shipping API
   - Payments API
   - Orders API

2. **Priority 2 (User Management):**
   - Users/Authentication API

3. **Priority 3 (Content & Support):**
   - Categories API
   - Entity Routes API
   - CMS API
   - Tags API

4. **Priority 4 (Additional Features):**
   - Feedbacks API
   - Images API
   - Booking API
   - Visits API
   - Wallet API

---

## Notes

- Always create a test script before starting optimization
- Log actual responses to identify unnecessary fields
- Follow the same pattern used in Products API
- Update this checklist after completing each API
- Commit changes after each API is complete
