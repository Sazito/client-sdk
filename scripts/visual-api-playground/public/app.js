const SORT_OPTIONS = [
  { label: 'Price (Low to High)', value: '!price' },
  { label: 'Price (High to Low)', value: 'price' },
  { label: 'Newest', value: 'newest' },
  { label: 'Best Selling', value: 'best-selling' },
  { label: 'Availability', value: 'availability' },
  { label: 'Discount', value: 'discount' }
];

const OPERATIONS = [
  {
    id: 'products.list',
    label: 'Products: List',
    description: 'GET /api/v1/products with dedicated filter, sort, and pagination controls.',
    fields: [
      {
        key: 'filters.categories',
        label: 'Category IDs',
        type: 'number-list',
        section: 'filters',
        defaultValue: '',
        placeholder: '73'
      },
      {
        key: 'filters.availableOnly',
        label: 'Available Only',
        type: 'boolean',
        section: 'filters',
        defaultValue: true
      },
      {
        key: 'filters.discountedOnly',
        label: 'Discounted Only',
        type: 'boolean',
        section: 'filters',
        defaultValue: ''
      },
      {
        key: 'filters.priceMin',
        label: 'Min Price',
        type: 'number',
        section: 'filters',
        placeholder: '100000'
      },
      {
        key: 'filters.priceMax',
        label: 'Max Price',
        type: 'number',
        section: 'filters',
        placeholder: '900000'
      },
      {
        key: 'filters.pinnedIds',
        label: 'Pinned Product IDs',
        type: 'number-list',
        section: 'filters',
        placeholder: '101, 202'
      },
      {
        key: 'filters.similarTo',
        label: 'Similar To Product ID',
        type: 'number',
        section: 'filters',
        placeholder: '321'
      },
      {
        key: 'filters.sort',
        label: 'Sort',
        type: 'select',
        section: 'sort',
        options: SORT_OPTIONS,
        defaultValue: '!price'
      },
      {
        key: 'filters.page',
        label: 'Page',
        type: 'number',
        section: 'pagination',
        defaultValue: 1,
        min: 1
      },
      {
        key: 'filters.pageSize',
        label: 'Page Size',
        type: 'number',
        section: 'pagination',
        defaultValue: 5,
        min: 1
      }
    ]
  },
  {
    id: 'products.get',
    label: 'Products: Get Single',
    description: 'GET /api/v1/entity_route/route?url_part=... resolved via products.get().',
    fields: [
      {
        key: 'slugOrPath',
        label: 'Slug or Path',
        type: 'text',
        section: 'request',
        defaultValue: '/product/تست-دیسکریپشن',
        required: true
      }
    ]
  },
  {
    id: 'search.query',
    label: 'Search: Global',
    description: 'GET /api/v1/search with SDK filter mapping and pagination controls.',
    fields: [
      {
        key: 'query',
        label: 'Search Query',
        type: 'text',
        section: 'request',
        defaultValue: 'بیج',
        required: true
      },
      {
        key: 'filters.categoryId',
        label: 'Category ID',
        type: 'number',
        section: 'filters',
        placeholder: '73'
      },
      {
        key: 'filters.minPrice',
        label: 'Min Price',
        type: 'number',
        section: 'filters',
        placeholder: '100000'
      },
      {
        key: 'filters.maxPrice',
        label: 'Max Price',
        type: 'number',
        section: 'filters',
        placeholder: '900000'
      },
      {
        key: 'filters.page',
        label: 'Page',
        type: 'number',
        section: 'pagination',
        defaultValue: 1,
        min: 1
      },
      {
        key: 'filters.pageSize',
        label: 'Page Size',
        type: 'number',
        section: 'pagination',
        defaultValue: 5,
        min: 1
      }
    ]
  },
  {
    id: 'categories.list',
    label: 'Categories: List',
    description: 'GET /api/v1/product_categories with pagination form controls.',
    fields: [
      {
        key: 'filters.page',
        label: 'Page',
        type: 'number',
        section: 'pagination',
        defaultValue: 1,
        min: 1
      },
      {
        key: 'filters.pageSize',
        label: 'Page Size',
        type: 'number',
        section: 'pagination',
        defaultValue: 10,
        min: 1
      }
    ]
  },
  {
    id: 'categories.get',
    label: 'Categories: Get Single',
    description: 'GET /api/v1/product_categories/{idOrSlug}.',
    fields: [
      {
        key: 'idOrSlug',
        label: 'Category ID or Slug',
        type: 'text',
        section: 'request',
        defaultValue: '110',
        required: true
      }
    ]
  },
  {
    id: 'cms.listPages',
    label: 'CMS: List Pages',
    description: 'GET /api/v1/cms_pages filtered to regular CMS pages only.',
    fields: [
      {
        key: 'filters.page',
        label: 'Page',
        type: 'number',
        section: 'pagination',
        defaultValue: 1,
        min: 1
      },
      {
        key: 'filters.pageSize',
        label: 'Page Size',
        type: 'number',
        section: 'pagination',
        defaultValue: 10,
        min: 1
      }
    ]
  },
  {
    id: 'cms.getPage',
    label: 'CMS: Get Page',
    description: 'GET /api/v1/entity_route/route?url_part=... resolved via cms.getPage().',
    fields: [
      {
        key: 'urlPath',
        label: 'CMS URL Path',
        type: 'text',
        section: 'request',
        defaultValue: '/درباره-ما',
        required: true
      }
    ]
  },
  {
    id: 'cms.listBlogPosts',
    label: 'CMS: List Blog Posts',
    description: 'GET /api/v1/cms_pages filtered to blog posts only.',
    fields: [
      {
        key: 'filters.page',
        label: 'Page',
        type: 'number',
        section: 'pagination',
        defaultValue: 1,
        min: 1
      },
      {
        key: 'filters.pageSize',
        label: 'Page Size',
        type: 'number',
        section: 'pagination',
        defaultValue: 10,
        min: 1
      }
    ]
  },
  {
    id: 'cms.getBlogPost',
    label: 'CMS: Get Blog Post',
    description: 'GET /api/v1/entity_route/route?url_part=... resolved via cms.getBlogPost().',
    fields: [
      {
        key: 'urlPath',
        label: 'Blog URL Path',
        type: 'text',
        section: 'request',
        defaultValue: '/blog/how-to-buy',
        required: true
      }
    ]
  },
  {
    id: 'menu.getHeaderMenu',
    label: 'Menu: Header Menu',
    description: 'GET /api/v1/trees/fetch_single via menu.getHeaderMenu().',
    fields: [
      {
        key: 'identifier',
        label: 'Menu Identifier',
        type: 'text',
        section: 'request',
        defaultValue: 'headermenu'
      }
    ]
  },
  {
    id: 'booking.getEvent',
    label: 'Booking: Get Event',
    description: 'GET /api/v1/scheduler/events/{entityId} via booking.getEvent().',
    fields: [
      {
        key: 'entityId',
        label: 'Event Entity ID',
        type: 'number',
        section: 'request',
        defaultValue: 1,
        min: 1,
        required: true
      }
    ]
  },
  {
    id: 'booking.getEventAvailabilities',
    label: 'Booking: Get Availabilities',
    description: 'GET /api/v1/scheduler/availabilities via booking.getEventAvailabilities().',
    fields: [
      {
        key: 'eventEntityId',
        label: 'Event Entity ID',
        type: 'number',
        section: 'request',
        defaultValue: 1,
        min: 1,
        required: true
      },
      {
        key: 'duration',
        label: 'Duration (minutes)',
        type: 'number',
        section: 'request',
        defaultValue: 30,
        min: 1,
        required: true
      },
      {
        key: 'fromDate',
        label: 'From Date',
        type: 'text',
        section: 'request',
        defaultValue: '2026-02-16',
        required: true
      },
      {
        key: 'toDate',
        label: 'To Date',
        type: 'text',
        section: 'request',
        defaultValue: '2026-03-15',
        required: true
      },
      {
        key: 'timezone',
        label: 'Timezone',
        type: 'text',
        section: 'request',
        defaultValue: 'Asia/Tehran'
      }
    ]
  },
  {
    id: 'cart.get',
    label: 'Cart: Get Current',
    description: 'GET /api/v2/carts/{id} with stored cart credentials via cart.get().',
    fields: []
  },
  {
    id: 'cart.create',
    label: 'Cart: Create',
    description: 'POST /api/v2/carts via cart.create().',
    fields: [
      {
        key: 'input.variants',
        label: 'Variants (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: [
          { id: 114706, count: 1 }
        ],
        required: true
      },
      {
        key: 'input.coupon',
        label: 'Coupon',
        type: 'text',
        section: 'request',
        placeholder: 'OFF20'
      },
      {
        key: 'input.formAttributes',
        label: 'Form Attributes (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: {}
      },
      {
        key: 'input.schedulerBookingAttributes',
        label: 'Scheduler Booking Attributes (JSON)',
        type: 'json',
        section: 'request'
      }
    ]
  },
  {
    id: 'cart.addItemWithAttributes',
    label: 'Cart: Add Item With Attributes',
    description: 'POST /api/v2/carts/{id}/add_products_to_cart with form + scheduler booking attributes.',
    fields: [
      {
        key: 'variantId',
        label: 'Variant ID',
        type: 'number',
        section: 'request',
        defaultValue: 114706,
        min: 1,
        required: true
      },
      {
        key: 'count',
        label: 'Count',
        type: 'number',
        section: 'request',
        defaultValue: 1,
        min: 1,
        required: true
      },
      {
        key: 'attributes.formAttributes',
        label: 'Form Attributes (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: {
          national_code: '0011223344',
          agree_terms: true
        }
      },
      {
        key: 'attributes.schedulerBookingAttributes',
        label: 'Scheduler Booking Attributes (JSON)',
        type: 'json',
        section: 'request'
      },
      {
        key: 'attributes.coupon',
        label: 'Coupon',
        type: 'text',
        section: 'request',
        placeholder: 'OFF20'
      }
    ]
  },
  {
    id: 'cart.updateItem',
    label: 'Cart: Update Item Quantity',
    description: 'POST /api/v2/carts/{id}/update_products_in_cart via cart.updateItem().',
    fields: [
      {
        key: 'cartProductId',
        label: 'Cart Product ID',
        type: 'text',
        section: 'request',
        defaultValue: '1',
        required: true
      },
      {
        key: 'variantId',
        label: 'Variant ID',
        type: 'number',
        section: 'request',
        defaultValue: 114706,
        min: 1,
        required: true
      },
      {
        key: 'count',
        label: 'Count',
        type: 'number',
        section: 'request',
        defaultValue: 2,
        min: 0,
        required: true
      },
      {
        key: 'formAttributes',
        label: 'Form Attributes (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: {}
      },
      {
        key: 'coupon',
        label: 'Coupon',
        type: 'text',
        section: 'request',
        placeholder: 'OFF20'
      },
      {
        key: 'deleteCoupon',
        label: 'Delete Coupon',
        type: 'boolean',
        section: 'request',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'cart.removeItem',
    label: 'Cart: Remove Item',
    description: 'POST /api/v2/carts/{id}/remove_products_from_cart via cart.removeItem().',
    fields: [
      {
        key: 'cartProductId',
        label: 'Cart Product ID',
        type: 'text',
        section: 'request',
        defaultValue: '1',
        required: true
      },
      {
        key: 'variantId',
        label: 'Variant ID',
        type: 'number',
        section: 'request',
        defaultValue: 114706,
        min: 1,
        required: true
      }
    ]
  },
  {
    id: 'invoices.get',
    label: 'Invoices: Get Current',
    description: 'Uses POST /api/v2/invoices/{id}/refresh with stored cart+invoice credentials via invoices.get().',
    fields: []
  },
  {
    id: 'invoices.create',
    label: 'Invoices: Create',
    description: 'POST /api/v2/invoices from stored cart credentials via invoices.create().',
    fields: []
  },
  {
    id: 'invoices.refresh',
    label: 'Invoices: Refresh',
    description: 'POST /api/v2/invoices/{id}/refresh via invoices.refresh().',
    fields: []
  },
  {
    id: 'invoices.addShippingAddress',
    label: 'Invoices: Add Shipping Address',
    description: 'POST /api/v2/invoices/{id}/add_shipping_address via invoices.addShippingAddress().',
    fields: [
      {
        key: 'shippingAddressId',
        label: 'Shipping Address ID',
        type: 'number',
        section: 'request',
        defaultValue: 1,
        min: 1,
        required: true
      },
      {
        key: 'shippingAddressIdentifier',
        label: 'Shipping Address Identifier',
        type: 'text',
        section: 'request',
        defaultValue: 'shipping-address-identifier',
        required: true
      }
    ]
  },
  {
    id: 'invoices.assignShippingMethod',
    label: 'Invoices: Assign Shipping Method',
    description: 'POST /api/v2/invoices/{id}/add_shipping_method via invoices.assignShippingMethod().',
    fields: [
      {
        key: 'shippings',
        label: 'Shippings (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: [
          {
            rateId: 1,
            invoiceItemIds: ['1']
          }
        ],
        required: true
      }
    ]
  },
  {
    id: 'invoices.addDiscountCode',
    label: 'Invoices: Add Discount Code',
    description: 'POST /api/v2/invoices/{id}/add_discount_code via invoices.addDiscountCode().',
    fields: [
      {
        key: 'code',
        label: 'Discount Code',
        type: 'text',
        section: 'request',
        defaultValue: 'OFF20',
        required: true
      }
    ]
  },
  {
    id: 'invoices.addDetails',
    label: 'Invoices: Add Details',
    description: 'POST /api/v2/invoices/{id}/add_invoice_details via invoices.addDetails().',
    fields: [
      {
        key: 'comment',
        label: 'Comment',
        type: 'text',
        section: 'request',
        defaultValue: 'Please call before delivery.',
        required: true
      }
    ]
  },
  {
    id: 'dynamicForms.getForm',
    label: 'Dynamic Forms: Get Form',
    description: 'GET /api/v1/dynamic_form/{id} via dynamicForms.getForm().',
    fields: [
      {
        key: 'formId',
        label: 'Form ID',
        type: 'number',
        section: 'request',
        defaultValue: 1,
        min: 1,
        required: true
      }
    ]
  },
  {
    id: 'dynamicForms.uploadProductFormFile',
    label: 'Dynamic Forms: Upload File',
    description: 'POST /api/v1/service/filemanager/uploads/private/productform via dynamicForms.uploadProductFormFile().',
    fields: [
      {
        key: 'fileName',
        label: 'File Name',
        type: 'text',
        section: 'request',
        defaultValue: 'sample.txt',
        required: true
      },
      {
        key: 'fileContent',
        label: 'File Content (Text)',
        type: 'text',
        section: 'request',
        defaultValue: 'sample file content for dynamic form uploader',
        required: true
      }
    ]
  },
  {
    id: 'regions.list',
    label: 'Regions: List',
    description: 'GET /api/v1/regions via regions.list() with sorted regions/cities output.',
    fields: []
  },
  {
    id: 'feedbacks.getSeed',
    label: 'Feedbacks: Get Seed',
    description: 'GET /api/v1/feedbacks/seed/{orderIdentifier} via feedbacks.getSeed().',
    fields: [
      {
        key: 'orderIdentifier',
        label: 'Order Identifier',
        type: 'text',
        section: 'request',
        defaultValue: 'ORDER-1001',
        required: true
      }
    ]
  },
  {
    id: 'feedbacks.createOrderRating',
    label: 'Feedbacks: Create Order Rating',
    description: 'POST /api/v1/feedbacks/comments via feedbacks.createOrderRating().',
    fields: [
      {
        key: 'input.orderId',
        label: 'Order ID',
        type: 'text',
        section: 'request',
        defaultValue: '1001',
        required: true
      },
      {
        key: 'input.orderIdentifier',
        label: 'Order Identifier',
        type: 'text',
        section: 'request',
        defaultValue: 'ORDER-1001',
        required: true
      },
      {
        key: 'input.orderRate',
        label: 'Order Rate (1-5)',
        type: 'number',
        section: 'request',
        defaultValue: 5,
        min: 1,
        max: 5,
        required: true
      }
    ]
  },
  {
    id: 'feedbacks.submitProductReview',
    label: 'Feedbacks: Submit Product Review',
    description: 'POST /api/v1/feedbacks/comments/details via feedbacks.submitProductReview().',
    fields: [
      {
        key: 'input.commentId',
        label: 'Comment ID',
        type: 'text',
        section: 'request',
        defaultValue: 'comment-1',
        required: true
      },
      {
        key: 'input.productId',
        label: 'Product ID',
        type: 'text',
        section: 'request',
        defaultValue: '2001',
        required: true
      },
      {
        key: 'input.productVariantId',
        label: 'Product Variant ID',
        type: 'text',
        section: 'request',
        defaultValue: '3001',
        required: true
      },
      {
        key: 'input.productName',
        label: 'Product Name',
        type: 'text',
        section: 'request',
        defaultValue: 'Sample Product',
        required: true
      },
      {
        key: 'input.productRate',
        label: 'Product Rate (1-5)',
        type: 'number',
        section: 'request',
        defaultValue: 5,
        min: 1,
        max: 5,
        required: true
      },
      {
        key: 'input.recommendationStatus',
        label: 'Recommendation Status',
        type: 'select',
        section: 'request',
        options: [
          { label: 'RECOMMENDED', value: 'RECOMMENDED' },
          { label: 'NEUTRAL', value: 'NEUTRAL' },
          { label: 'NOT-RECOMMENDED', value: 'NOT-RECOMMENDED' },
          { label: 'NONE', value: 'NONE' }
        ],
        defaultValue: 'RECOMMENDED'
      },
      {
        key: 'input.text',
        label: 'Review Text',
        type: 'text',
        section: 'request',
        defaultValue: 'Great product and quality.',
        required: true
      },
      {
        key: 'input.productAttributes',
        label: 'Product Attributes (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: [{ name: 'Color', value: 'Black' }]
      },
      {
        key: 'input.productImage',
        label: 'Product Image (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: { url: 'https://example.com/image.jpg', alt: 'Product image' }
      },
      {
        key: 'input.pros',
        label: 'Pros (JSON array)',
        type: 'json',
        section: 'request',
        defaultValue: ['Good value', 'Durable']
      },
      {
        key: 'input.cons',
        label: 'Cons (JSON array)',
        type: 'json',
        section: 'request',
        defaultValue: ['Slow shipping']
      },
      {
        key: 'input.attachmentsServeKeys',
        label: 'Attachment Serve Keys (JSON array)',
        type: 'json',
        section: 'request',
        defaultValue: []
      },
      {
        key: 'input.owner',
        label: 'Owner',
        type: 'boolean',
        section: 'request',
        defaultValue: true
      },
      {
        key: 'input.isAnonymous',
        label: 'Anonymous',
        type: 'boolean',
        section: 'request',
        defaultValue: false
      }
    ]
  },
  {
    id: 'feedbacks.getProductStatistics',
    label: 'Feedbacks: Product Statistics',
    description: 'GET /api/v1/feedbacks/comments/details/{productId}?exclude=comments via feedbacks.getProductStatistics().',
    fields: [
      {
        key: 'productId',
        label: 'Product ID',
        type: 'text',
        section: 'request',
        defaultValue: '2001',
        required: true
      }
    ]
  },
  {
    id: 'feedbacks.getProductReviews',
    label: 'Feedbacks: Product Reviews',
    description: 'GET /api/v1/feedbacks/comments/details/{productId} via feedbacks.getProductReviews().',
    fields: [
      {
        key: 'productId',
        label: 'Product ID',
        type: 'text',
        section: 'request',
        defaultValue: '2001',
        required: true
      },
      {
        key: 'filters.pageNumber',
        label: 'Page Number',
        type: 'number',
        section: 'pagination',
        defaultValue: 1,
        min: 1
      },
      {
        key: 'filters.pageSize',
        label: 'Page Size',
        type: 'number',
        section: 'pagination',
        defaultValue: 10,
        min: 1
      }
    ]
  },
  {
    id: 'feedbacks.uploadReviewImages',
    label: 'Feedbacks: Upload Review Images',
    description: 'POST /api/v1/service/filemanager/uploads/public/tajrobe via feedbacks.uploadReviewImages().',
    fields: [
      {
        key: 'images',
        label: 'Images Input (JSON array)',
        type: 'json',
        section: 'request',
        defaultValue: [
          {
            name: 'review-image-1.jpg',
            alt: 'review image',
            content: 'dummy image content'
          }
        ]
      }
    ]
  },
  {
    id: 'invoices.addForm',
    label: 'Invoices: Add Checkout Form',
    description: 'POST /api/v2/invoices/{id}/add_form via invoices.addForm().',
    fields: [
      {
        key: 'input.identifier',
        label: 'Invoice Identifier (Optional)',
        type: 'text',
        section: 'request',
        placeholder: 'leave empty to use stored invoice identifier'
      },
      {
        key: 'input.formAttributes',
        label: 'Form Attributes (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: {
          full_name: 'Reza Mahmoudi',
          national_code: '0011223344'
        },
        required: true
      }
    ]
  },
  {
    id: 'invoices.getApplicableShippingMethods',
    label: 'Invoices: Applicable Shipping Methods',
    description: 'GET /api/v2/invoices/{id}/applicable_shipping_methods via invoices.getApplicableShippingMethods().',
    fields: []
  },
  {
    id: 'invoices.addCredit',
    label: 'Invoices: Add Credit',
    description: 'POST /api/v2/invoices/{id}/add_credit via invoices.addCredit().',
    fields: []
  },
  {
    id: 'invoices.removeCredit',
    label: 'Invoices: Remove Credit',
    description: 'POST /api/v2/invoices/{id}/remove_credit via invoices.removeCredit().',
    fields: []
  },
  {
    id: 'invoices.toggleCredit',
    label: 'Invoices: Toggle Credit',
    description: 'Toggles invoice credit by reading current invoice then calling add/remove credit.',
    fields: []
  },
  {
    id: 'shipping.createAddress',
    label: 'Shipping: Create Address',
    description: 'POST /api/v2/shipping_addresses via shipping.createAddress().',
    fields: [
      {
        key: 'address',
        label: 'Address (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: {
          firstName: 'Reza',
          lastName: 'Mahmoudi',
          mobilePhone: '09358109237',
          regionId: 8,
          cityId: 2211,
          address: 'Tehran, Valiasr St'
        },
        required: true
      }
    ]
  },
  {
    id: 'shipping.updateAddress',
    label: 'Shipping: Update Address',
    description: 'POST /api/v2/shipping_addresses with identifier via shipping.updateAddress().',
    fields: [
      {
        key: 'address',
        label: 'Address (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: {
          firstName: 'Reza',
          lastName: 'Mahmoudi',
          mobilePhone: '09358109237',
          regionId: 8,
          cityId: 2211,
          address: 'Tehran, Updated Address'
        },
        required: true
      }
    ]
  },
  {
    id: 'shipping.getAddress',
    label: 'Shipping: Get Address',
    description: 'GET /api/v2/shipping_addresses/{id} via shipping.getAddress().',
    fields: []
  },
  {
    id: 'shipping.getMethods',
    label: 'Shipping: Get Methods',
    description: 'GET /api/v2/shipping_methods via shipping.getMethods().',
    fields: []
  },
  {
    id: 'payments.getMethods',
    label: 'Payments: Get Methods',
    description: 'POST /api/v2/payments/list via payments.getMethods() (sends invoice_identifier).',
    fields: []
  },
  {
    id: 'payments.create',
    label: 'Payments: Create',
    description: 'POST /api/v2/payments via payments.create().',
    fields: [
      {
        key: 'paymentTypeId',
        label: 'Payment Type ID',
        type: 'number',
        section: 'request',
        defaultValue: 1,
        min: 1,
        required: true
      }
    ]
  },
  {
    id: 'payments.initialize',
    label: 'Payments: Initialize',
    description: 'POST /api/v2/payments/{id}/process_payment_step via payments.initialize().',
    fields: []
  },
  {
    id: 'payments.processStep',
    label: 'Payments: Process Step',
    description: 'POST /api/v2/payments/{id}/process_payment_step with JSON (exact application/json) or form mode.',
    fields: [
      {
        key: 'mode',
        label: 'Payload Mode',
        type: 'select',
        section: 'request',
        options: [
          { label: 'JSON (application/json)', value: 'json' },
          { label: 'Form (non-JSON)', value: 'form' }
        ],
        defaultValue: 'json'
      },
      {
        key: 'input',
        label: 'JSON Input',
        type: 'json',
        section: 'request',
        defaultValue: {
          imageUrl: 'https://example.com/receipt.jpg',
          code: '123456'
        }
      },
      {
        key: 'formFields',
        label: 'Form Fields (JSON)',
        type: 'json',
        section: 'request',
        defaultValue: {
          code: '123456',
          image_url: 'https://example.com/receipt.jpg'
        }
      }
    ]
  },
  {
    id: 'payments.pollUntilSettled',
    label: 'Payments: Poll Until Settled',
    description: 'Calls payments.initialize every 15s until action is no longer pending.',
    fields: [
      {
        key: 'intervalMs',
        label: 'Interval (ms)',
        type: 'number',
        section: 'request',
        defaultValue: 15000,
        min: 1000
      }
    ]
  },
  {
    id: 'users.login',
    label: 'Users: Login (Email/Password)',
    description: 'POST /api/v1/sessions/login via users.login().',
    fields: [
      {
        key: 'email',
        label: 'Email',
        type: 'text',
        section: 'request',
        defaultValue: 'dev@example.com',
        required: true
      },
      {
        key: 'password',
        label: 'Password',
        type: 'text',
        section: 'request',
        defaultValue: '123456',
        required: true
      }
    ]
  },
  {
    id: 'users.register',
    label: 'Users: Register',
    description: 'POST /api/v1/users/register via users.register().',
    fields: [
      {
        key: 'email',
        label: 'Email',
        type: 'text',
        section: 'request',
        defaultValue: 'new-user@example.com',
        required: true
      },
      {
        key: 'password',
        label: 'Password',
        type: 'text',
        section: 'request',
        defaultValue: '123456',
        required: true
      },
      {
        key: 'passwordConfirmation',
        label: 'Password Confirmation',
        type: 'text',
        section: 'request',
        defaultValue: '123456',
        required: true
      },
      {
        key: 'firstName',
        label: 'First Name',
        type: 'text',
        section: 'request',
        placeholder: 'Reza'
      },
      {
        key: 'lastName',
        label: 'Last Name',
        type: 'text',
        section: 'request',
        placeholder: 'Mahmoudi'
      },
      {
        key: 'mobilePhone',
        label: 'Mobile Phone',
        type: 'text',
        section: 'request',
        placeholder: '09123456789'
      }
    ]
  },
  {
    id: 'users.requestMobileOTP',
    label: 'Users: Mobile OTP Request',
    description: 'POST /api/v1/sessions/login_request via users.requestMobileOTP().',
    fields: [
      {
        key: 'mobilePhone',
        label: 'Mobile Phone',
        type: 'text',
        section: 'request',
        defaultValue: '09123456789',
        required: true
      }
    ]
  },
  {
    id: 'users.verifyMobileOTP',
    label: 'Users: Mobile OTP Verify',
    description: 'POST /api/v1/sessions/login_request_verification via users.verifyMobileOTP().',
    fields: [
      {
        key: 'mobilePhone',
        label: 'Mobile Phone',
        type: 'text',
        section: 'request',
        defaultValue: '09123456789',
        required: true
      },
      {
        key: 'token',
        label: 'Verification Token',
        type: 'text',
        section: 'request',
        defaultValue: '123456',
        required: true
      }
    ]
  },
  {
    id: 'users.requestEmailLogin',
    label: 'Users: Passwordless Email Request',
    description: 'POST /api/v1/users/email_login_request via users.requestEmailLogin().',
    fields: [
      {
        key: 'email',
        label: 'Email',
        type: 'text',
        section: 'request',
        defaultValue: 'dev@example.com',
        required: true
      }
    ]
  },
  {
    id: 'users.forgotPassword',
    label: 'Users: Forgot Password',
    description: 'POST /api/v1/users/forgot_password via users.forgotPassword().',
    fields: [
      {
        key: 'email',
        label: 'Email',
        type: 'text',
        section: 'request',
        defaultValue: 'dev@example.com',
        required: true
      }
    ]
  },
  {
    id: 'users.revivePassword',
    label: 'Users: Revive Password',
    description: 'POST /api/v1/users/revive_password via users.revivePassword().',
    fields: [
      {
        key: 'forgotPasswordToken',
        label: 'Forgot Password Token',
        type: 'text',
        section: 'request',
        defaultValue: 'token-here',
        required: true
      },
      {
        key: 'password',
        label: 'Password',
        type: 'text',
        section: 'request',
        defaultValue: 'new-123456',
        required: true
      },
      {
        key: 'passwordConfirmation',
        label: 'Password Confirmation',
        type: 'text',
        section: 'request',
        defaultValue: 'new-123456',
        required: true
      }
    ]
  },
  {
    id: 'users.getCurrentUser',
    label: 'Users: Current User',
    description: 'GET /api/v1/users/current (requires auth token for successful result).',
    fields: []
  },
  {
    id: 'users.updateProfile',
    label: 'Users: Update Profile',
    description: 'PUT /api/v1/users/{userId} via users.updateProfile().',
    fields: [
      {
        key: 'userId',
        label: 'User ID',
        type: 'number',
        section: 'request',
        defaultValue: 1,
        min: 1,
        required: true
      },
      {
        key: 'profile.firstName',
        label: 'First Name',
        type: 'text',
        section: 'request',
        placeholder: 'Reza'
      },
      {
        key: 'profile.lastName',
        label: 'Last Name',
        type: 'text',
        section: 'request',
        placeholder: 'Mahmoudi'
      },
      {
        key: 'profile.email',
        label: 'Email',
        type: 'text',
        section: 'request',
        placeholder: 'dev@example.com'
      },
      {
        key: 'profile.password',
        label: 'Password',
        type: 'text',
        section: 'request',
        placeholder: 'new-password'
      },
      {
        key: 'profile.passwordConfirmation',
        label: 'Password Confirmation',
        type: 'text',
        section: 'request',
        placeholder: 'new-password'
      },
      {
        key: 'profile.birthDate',
        label: 'Birth Date',
        type: 'text',
        section: 'request',
        placeholder: '1990-01-01'
      }
    ]
  },
  {
    id: 'users.requestMobilePhoneUpdate',
    label: 'Users: Update Phone Request',
    description: 'POST /api/v1/users/update_mobile_phone_request via users.requestMobilePhoneUpdate().',
    fields: [
      {
        key: 'mobilePhone',
        label: 'New Mobile Phone',
        type: 'text',
        section: 'request',
        defaultValue: '09123456789',
        required: true
      }
    ]
  },
  {
    id: 'users.verifyMobilePhoneUpdate',
    label: 'Users: Update Phone Verify',
    description: 'POST /api/v1/users/update_mobile_phone_verification via users.verifyMobilePhoneUpdate().',
    fields: [
      {
        key: 'mobilePhone',
        label: 'New Mobile Phone',
        type: 'text',
        section: 'request',
        defaultValue: '09123456789',
        required: true
      },
      {
        key: 'token',
        label: 'Verification Token',
        type: 'text',
        section: 'request',
        defaultValue: '123456',
        required: true
      }
    ]
  },
  {
    id: 'users.mergeUser',
    label: 'Users: Merge Accounts',
    description: 'POST /api/v1/users/merge_user via users.mergeUser().',
    fields: []
  },
  {
    id: 'wallet.getBalance',
    label: 'Wallet: Get Balance',
    description: 'GET /api/v1/users/wallet/balance (requires auth token for successful result).',
    fields: []
  },
  {
    id: 'wallet.applyCredit',
    label: 'Wallet: Apply Credit',
    description: 'POST /api/v2/invoices/{id}/add_credit (requires auth token for successful result).',
    fields: [
      {
        key: 'invoiceId',
        label: 'Invoice ID',
        type: 'number',
        section: 'request',
        defaultValue: 1,
        min: 1,
        required: true
      }
    ]
  },
  {
    id: 'wallet.removeCredit',
    label: 'Wallet: Remove Credit',
    description: 'POST /api/v2/invoices/{id}/remove_credit (requires auth token for successful result).',
    fields: [
      {
        key: 'invoiceId',
        label: 'Invoice ID',
        type: 'number',
        section: 'request',
        defaultValue: 1,
        min: 1,
        required: true
      }
    ]
  },
  {
    id: 'wallet.listTransactions',
    label: 'Wallet: List Transactions',
    description: 'GET /api/v1/wallet/transactions with page_number/page_size (requires auth token).',
    fields: [
      {
        key: 'filters.pageNumber',
        label: 'Page Number',
        type: 'number',
        section: 'pagination',
        defaultValue: 1,
        min: 1
      },
      {
        key: 'filters.pageSize',
        label: 'Page Size',
        type: 'number',
        section: 'pagination',
        defaultValue: 20,
        min: 1
      }
    ]
  },
  {
    id: 'general.getInfo',
    label: 'General: Shop Info',
    description: 'GET /api/v2/general/info for store-level settings and feature flags.',
    fields: []
  },
  {
    id: 'visits.track',
    label: 'Visits: Track (POST)',
    description: 'POST /api/v1/visits/add with no request payload.',
    fields: []
  }
];

const OPERATION_NAMESPACES = {
  catalog: 'Catalog APIs',
  content: 'Content APIs',
  booking: 'Booking APIs',
  customer: 'Customer & Auth APIs',
  engagement: 'Feedback & Engagement APIs',
  platform: 'Platform & Config APIs',
  salesFlow: 'Sales Flow APIs',
  other: 'Other APIs'
};

const OPERATION_NAMESPACE_ORDER = Object.values(OPERATION_NAMESPACES)
  .filter((namespace) => namespace !== OPERATION_NAMESPACES.salesFlow && namespace !== OPERATION_NAMESPACES.other)
  .sort((left, right) => left.localeCompare(right))
  .concat([OPERATION_NAMESPACES.salesFlow, OPERATION_NAMESPACES.other]);

const SECTION_LABELS = {
  request: 'Request',
  filters: 'Filters',
  sort: 'Sort',
  pagination: 'Pagination'
};

const JWT_STORAGE_KEY = 'sazito.visual-playground.global-jwt';
const SESSION_STORAGE_KEY = 'sazito.visual-playground.session-id';
const jwtInput = document.getElementById('jwt');
const domainInput = document.getElementById('domain');
const operationSelect = document.getElementById('operation');
const operationDescription = document.getElementById('operationDescription');
const dynamicFields = document.getElementById('dynamicFields');
const executeButton = document.getElementById('executeButton');
const expandAllButton = document.getElementById('expandAllButton');
const collapseAllButton = document.getElementById('collapseAllButton');
const copyFetchButton = document.getElementById('copyFetchButton');
const copyCurlButton = document.getElementById('copyCurlButton');
const statusOutput = document.getElementById('status');
const requestOutput = document.getElementById('requestOutput');
const responseOutput = document.getElementById('responseOutput');
const transportOutput = document.getElementById('transportOutput');
let lastCapturedRequest = null;

function loadStoredJwt() {
  if (typeof window === 'undefined') return '';

  try {
    return window.localStorage.getItem(JWT_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function persistJwt(value) {
  if (typeof window === 'undefined') return;

  try {
    if (value) {
      window.localStorage.setItem(JWT_STORAGE_KEY, value);
      return;
    }

    window.localStorage.removeItem(JWT_STORAGE_KEY);
  } catch {
    // Ignore localStorage access errors (private mode/security policies)
  }
}

function getSessionId() {
  if (typeof window === 'undefined') return 'playground-session';

  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;

    const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return 'playground-session';
  }
}

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function isContainer(value) {
  return Boolean(value) && typeof value === 'object';
}

function formatPrimitive(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  return 'undefined';
}

function getPrimitiveClass(value) {
  if (typeof value === 'string') return 'json-string';
  if (typeof value === 'number') return 'json-number';
  if (typeof value === 'boolean') return 'json-boolean';
  if (value === null) return 'json-null';
  return '';
}

function appendKey(target, key) {
  if (key === null || key === undefined) return;

  const keyToken = document.createElement('span');
  keyToken.className = 'json-key';
  keyToken.textContent = JSON.stringify(key);
  target.appendChild(keyToken);

  const colon = document.createElement('span');
  colon.className = 'json-punctuation';
  colon.textContent = ': ';
  target.appendChild(colon);
}

function createPrimitiveLine(value, depth, key, isLast) {
  const line = document.createElement('div');
  line.className = 'json-line';
  line.style.setProperty('--depth', String(depth));

  appendKey(line, key);

  const valueToken = document.createElement('span');
  valueToken.className = getPrimitiveClass(value);
  valueToken.textContent = formatPrimitive(value);
  line.appendChild(valueToken);

  if (!isLast) {
    const comma = document.createElement('span');
    comma.className = 'json-punctuation';
    comma.textContent = ',';
    line.appendChild(comma);
  }

  return line;
}

function createContainerNode(value, depth, key, isLast, isArray) {
  const openToken = isArray ? '[' : '{';
  const closeToken = isArray ? ']' : '}';
  const entries = isArray ? value.map((item, index) => [index, item]) : Object.entries(value);
  const hasEntries = entries.length > 0;

  const details = document.createElement('details');
  details.className = 'json-details';
  details.open = true;
  details.style.setProperty('--depth', String(depth));

  const summary = document.createElement('summary');
  summary.className = 'json-summary';

  appendKey(summary, key);

  const openBracket = document.createElement('span');
  openBracket.className = 'json-bracket';
  openBracket.textContent = openToken;
  summary.appendChild(openBracket);

  const closeBracket = document.createElement('span');
  closeBracket.className = 'json-bracket';
  closeBracket.textContent = '';
  summary.appendChild(closeBracket);

  const summaryComma = document.createElement('span');
  summaryComma.className = 'json-punctuation';
  summary.appendChild(summaryComma);

  details.appendChild(summary);

  const children = document.createElement('div');
  children.className = 'json-children';
  children.style.setProperty('--depth', String(depth));

  entries.forEach((entry, index) => {
    const [entryKey, entryValue] = entry;
    const childKey = isArray ? null : entryKey;
    const childLast = index === entries.length - 1;
    children.appendChild(createJsonNode(entryValue, depth + 1, childKey, childLast));
  });

  details.appendChild(children);

  if (hasEntries) {
    const closing = document.createElement('div');
    closing.className = 'json-line';
    closing.style.setProperty('--depth', String(depth));

    const close = document.createElement('span');
    close.className = 'json-bracket';
    close.textContent = closeToken;
    closing.appendChild(close);

    if (!isLast) {
      const comma = document.createElement('span');
      comma.className = 'json-punctuation';
      comma.textContent = ',';
      closing.appendChild(comma);
    }

    details.appendChild(closing);
  }

  const updateSummaryTokens = () => {
    const showInlineClose = !hasEntries || !details.open;
    closeBracket.textContent = showInlineClose ? closeToken : '';
    summaryComma.textContent = !isLast && showInlineClose ? ',' : '';
  };

  details.addEventListener('toggle', updateSummaryTokens);
  updateSummaryTokens();

  return details;
}

function createJsonNode(value, depth, key, isLast) {
  if (Array.isArray(value)) {
    return createContainerNode(value, depth, key, isLast, true);
  }

  if (isContainer(value)) {
    return createContainerNode(value, depth, key, isLast, false);
  }

  return createPrimitiveLine(value, depth, key, isLast);
}

function setJsonOutput(container, value) {
  const normalized = value === undefined ? null : value;
  container.innerHTML = '';
  container.appendChild(createJsonNode(normalized, 0, null, true));
}

function getActiveOutputContainer() {
  return document.querySelector('.tab-panel.active .json-output');
}

function setActiveOutputExpansion(expanded) {
  const container = getActiveOutputContainer();
  if (!container) return;

  const nodes = container.querySelectorAll('details.json-details');
  nodes.forEach(node => {
    node.open = expanded;
  });
}

function getOperationConfig(operationId) {
  return OPERATIONS.find(op => op.id === operationId);
}

function getOperationNamespace(operationId) {
  const [moduleName] = String(operationId).split('.');

  if (moduleName === 'booking') {
    return OPERATION_NAMESPACES.booking;
  }

  if (moduleName === 'products' || moduleName === 'categories' || moduleName === 'search') {
    return OPERATION_NAMESPACES.catalog;
  }

  if (moduleName === 'cms' || moduleName === 'menu') {
    return OPERATION_NAMESPACES.content;
  }

  if (moduleName === 'users' || moduleName === 'wallet') {
    return OPERATION_NAMESPACES.customer;
  }

  if (moduleName === 'feedbacks' || moduleName === 'visits') {
    return OPERATION_NAMESPACES.engagement;
  }

  if (moduleName === 'general') {
    return OPERATION_NAMESPACES.platform;
  }

  if (/^(cart|invoices|shipping|payments|dynamicForms|regions)$/.test(moduleName)) {
    return OPERATION_NAMESPACES.salesFlow;
  }

  return OPERATION_NAMESPACES.other;
}

function toFieldId(key) {
  return `field-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function getSdkFieldName(field) {
  if (field.sdkField) return field.sdkField;
  if (field.key.startsWith('filters.')) {
    return field.key.replace(/^filters\./, '');
  }
  return field.key;
}

function setDeepValue(target, path, value) {
  const keys = path.split('.');
  let ref = target;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    if (!ref[key] || typeof ref[key] !== 'object' || Array.isArray(ref[key])) {
      ref[key] = {};
    }
    ref = ref[key];
  }

  ref[keys[keys.length - 1]] = value;
}

function pruneEmptyObjects(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const cleaned = {};
  for (const [key, current] of Object.entries(value)) {
    if (current === undefined) continue;

    const normalized = pruneEmptyObjects(current);
    if (normalized === undefined) continue;
    if (typeof normalized === 'object' && !Array.isArray(normalized) && Object.keys(normalized).length === 0) {
      continue;
    }

    cleaned[key] = normalized;
  }

  if (Object.keys(cleaned).length === 0) {
    return undefined;
  }

  return cleaned;
}

function parseBoolean(rawValue) {
  if (rawValue === 'true') return true;
  if (rawValue === 'false') return false;
  return undefined;
}

function parseNumber(rawValue, key) {
  if (rawValue === '') return undefined;

  const number = Number(rawValue);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid number in field: ${key}`);
  }

  return number;
}

function parseNumberList(rawValue, key) {
  if (rawValue === '') return undefined;

  const items = rawValue
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return undefined;
  }

  const parsed = items.map(value => Number(value));
  if (parsed.some(value => !Number.isFinite(value))) {
    throw new Error(`Invalid number list in field: ${key}`);
  }

  return parsed;
}

function createInput(field) {
  if (field.type === 'json') {
    const input = document.createElement('textarea');
    input.value = field.defaultValue === undefined ? '' : pretty(field.defaultValue);
    return input;
  }

  if (field.type === 'select') {
    const select = document.createElement('select');
    (field.options || []).forEach(optionConfig => {
      const option = document.createElement('option');
      option.value = optionConfig.value;
      option.textContent = optionConfig.label;
      select.appendChild(option);
    });
    select.value = field.defaultValue ?? '';
    return select;
  }

  if (field.type === 'boolean') {
    const select = document.createElement('select');
    [
      { value: '', label: 'Not Set' },
      { value: 'true', label: 'true' },
      { value: 'false', label: 'false' }
    ].forEach(optionConfig => {
      const option = document.createElement('option');
      option.value = optionConfig.value;
      option.textContent = optionConfig.label;
      select.appendChild(option);
    });
    select.value = String(field.defaultValue ?? '');
    return select;
  }

  const input = document.createElement('input');
  input.type = field.type === 'number' ? 'number' : 'text';
  input.value = field.defaultValue ?? '';
  if (field.min !== undefined) input.min = String(field.min);
  if (field.max !== undefined) input.max = String(field.max);
  return input;
}

function createFieldRow(field) {
  const wrap = document.createElement('div');
  wrap.className = 'field-wrap';

  const inputId = toFieldId(field.key);
  const label = document.createElement('label');
  label.htmlFor = inputId;
  label.textContent = `${field.label} (${getSdkFieldName(field)})`;
  wrap.appendChild(label);

  const input = createInput(field);
  input.id = inputId;
  input.dataset.fieldKey = field.key;
  input.dataset.fieldType = field.type;
  input.dataset.required = field.required ? 'true' : 'false';
  input.placeholder = field.placeholder || '';
  wrap.appendChild(input);

  return wrap;
}

function createSectionHeader(section) {
  const header = document.createElement('p');
  header.className = 'field-section-title';
  header.textContent = SECTION_LABELS[section] || section;
  return header;
}

function renderFields() {
  const operation = getOperationConfig(operationSelect.value);
  dynamicFields.innerHTML = '';
  operationDescription.textContent = operation?.description || '';

  if (!operation) return;
  if (!operation.fields.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-fields';
    empty.textContent = 'No request input needed for this operation.';
    dynamicFields.appendChild(empty);
    return;
  }

  let activeSection = '';
  for (const field of operation.fields) {
    const section = field.section || 'request';
    if (section !== activeSection) {
      dynamicFields.appendChild(createSectionHeader(section));
      activeSection = section;
    }
    dynamicFields.appendChild(createFieldRow(field));
  }
}

function readInputFields() {
  const data = {};
  const inputs = dynamicFields.querySelectorAll('[data-field-key]');

  for (const input of inputs) {
    const key = input.dataset.fieldKey;
    const type = input.dataset.fieldType;
    const isRequired = input.dataset.required === 'true';
    const rawValue = input.value.trim();

    if (isRequired && rawValue === '') {
      throw new Error(`Field is required: ${key}`);
    }

    let parsed;

    if (type === 'json') {
      if (!rawValue) {
        parsed = undefined;
      } else {
        try {
          parsed = JSON.parse(rawValue);
        } catch {
          throw new Error(`Invalid JSON in field: ${key}`);
        }
      }
    } else if (type === 'number') {
      parsed = parseNumber(rawValue, key);
    } else if (type === 'number-list') {
      parsed = parseNumberList(rawValue, key);
    } else if (type === 'boolean') {
      parsed = parseBoolean(rawValue);
    } else {
      parsed = rawValue === '' ? undefined : rawValue;
    }

    if (parsed === undefined) continue;
    setDeepValue(data, key, parsed);
  }

  return pruneEmptyObjects(data) || {};
}

function setStatus(message, isError = false) {
  statusOutput.textContent = message;
  statusOutput.style.color = isError ? '#8b2200' : '#493f35';
}

function updateCopyButtons() {
  const enabled = Boolean(lastCapturedRequest && lastCapturedRequest.fullUrl);
  copyFetchButton.disabled = !enabled;
  copyCurlButton.disabled = !enabled;
}

function escapeSingleQuotedShell(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function normalizeRequestForExport(request) {
  if (!request || typeof request !== 'object') return null;
  if (!request.fullUrl) return null;

  return {
    method: String(request.method || 'GET').toUpperCase(),
    fullUrl: String(request.fullUrl),
    headers: request.headers && typeof request.headers === 'object' ? request.headers : {},
    body: request.body
  };
}

function buildFetchSnippet(request) {
  if (!request) return '';

  const lines = [
    `const response = await fetch(${JSON.stringify(request.fullUrl)}, {`,
    `  method: ${JSON.stringify(request.method)},`
  ];

  const headerEntries = Object.entries(request.headers || {});
  if (headerEntries.length > 0) {
    lines.push('  headers: {');
    for (const [key, value] of headerEntries) {
      lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(String(value))},`);
    }
    lines.push('  },');
  }

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body !== undefined && request.body !== null) {
    if (typeof request.body === 'string') {
      lines.push(`  body: ${JSON.stringify(request.body)},`);
    } else {
      lines.push('  body: JSON.stringify(');
      pretty(request.body).split('\n').forEach(line => lines.push(`    ${line}`));
      lines.push('  ),');
    }
  }

  lines.push('});');
  lines.push('');
  lines.push('const data = await response.json();');
  lines.push('console.log(data);');

  return lines.join('\n');
}

function buildCurlCommand(request) {
  if (!request) return '';

  const parts = ['curl', '-X', request.method, escapeSingleQuotedShell(request.fullUrl)];
  for (const [key, value] of Object.entries(request.headers || {})) {
    parts.push('-H', escapeSingleQuotedShell(`${key}: ${String(value)}`));
  }

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body !== undefined && request.body !== null) {
    const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    parts.push('--data-raw', escapeSingleQuotedShell(body));
  }

  return parts.join(' ');
}

async function copyText(text) {
  if (!text) return false;

  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

  const temp = document.createElement('textarea');
  temp.value = text;
  temp.setAttribute('readonly', '');
  temp.style.position = 'fixed';
  temp.style.opacity = '0';
  document.body.appendChild(temp);
  temp.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(temp);
  return copied;
}

async function handleCopyRequest(format) {
  if (!lastCapturedRequest) {
    setStatus('Run a request first, then copy fetch/cURL.', true);
    return;
  }

  const output = format === 'fetch'
    ? buildFetchSnippet(lastCapturedRequest)
    : buildCurlCommand(lastCapturedRequest);

  const copied = await copyText(output);
  if (!copied) {
    setStatus(`Unable to copy ${format}.`, true);
    return;
  }

  setStatus(format === 'fetch' ? 'Fetch snippet copied.' : 'cURL command copied.');
}

async function execute() {
  setStatus('Running request...');
  executeButton.disabled = true;

  let input;
  try {
    input = readInputFields();
  } catch (error) {
    setStatus(error.message, true);
    executeButton.disabled = false;
    return;
  }

  const payload = {
    operation: operationSelect.value,
    domain: domainInput.value.trim(),
    jwt: jwtInput.value.trim(),
    sessionId: getSessionId(),
    input
  };

  setJsonOutput(requestOutput, payload);

  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      setJsonOutput(responseOutput, data.error || data);
      setJsonOutput(transportOutput, { httpStatus: response.status });
      setStatus('Request failed. Check response tab.', true);
      return;
    }

    lastCapturedRequest = normalizeRequestForExport(data.request);
    updateCopyButtons();
    setJsonOutput(requestOutput, data.request || {});
    setJsonOutput(responseOutput, {
      meta: data.meta,
      response: data.response,
      storage: data.storage || {}
    });
    setJsonOutput(transportOutput, data.transport || {});

    const statusBadge = data.response?.ok ? 'success' : 'error';
    const httpStatus = data.transport?.httpStatus ?? data.response?.status ?? 'unknown';
    const duration = data.meta?.durationMs ?? 0;
    setStatus(`Completed (${statusBadge}) in ${duration}ms, HTTP ${httpStatus}.`);
  } catch (error) {
    setJsonOutput(responseOutput, { error: error.message || 'Network error' });
    setStatus('Network error while calling /api/execute.', true);
  } finally {
    executeButton.disabled = false;
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });

      panels.forEach(panel => {
        panel.classList.toggle('active', panel.dataset.panel === target);
      });
    });
  });
}

function bootstrap() {
  if (jwtInput) {
    jwtInput.value = loadStoredJwt();
    jwtInput.addEventListener('input', () => {
      persistJwt(jwtInput.value.trim());
    });
  }

  const groupedOperations = new Map(
    OPERATION_NAMESPACE_ORDER.map((namespace) => [namespace, []])
  );

  for (const operation of OPERATIONS) {
    const namespace = getOperationNamespace(operation.id);
    if (!groupedOperations.has(namespace)) {
      groupedOperations.set(namespace, []);
    }
    groupedOperations.get(namespace).push(operation);
  }

  for (const operations of groupedOperations.values()) {
    operations.sort((left, right) => left.label.localeCompare(right.label));
  }

  for (const [namespace, operations] of groupedOperations.entries()) {
    if (!operations.length) continue;

    const group = document.createElement('optgroup');
    group.label = namespace;

    for (const operation of operations) {
      const option = document.createElement('option');
      option.value = operation.id;
      option.textContent = operation.label;
      group.appendChild(option);
    }

    operationSelect.appendChild(group);
  }

  renderFields();
  updateCopyButtons();
  operationSelect.addEventListener('change', renderFields);
  executeButton.addEventListener('click', execute);
  expandAllButton.addEventListener('click', () => setActiveOutputExpansion(true));
  collapseAllButton.addEventListener('click', () => setActiveOutputExpansion(false));
  copyFetchButton.addEventListener('click', () => handleCopyRequest('fetch'));
  copyCurlButton.addEventListener('click', () => handleCopyRequest('curl'));
  setupTabs();
  setJsonOutput(requestOutput, {});
  setJsonOutput(responseOutput, {});
  setJsonOutput(transportOutput, {});
}

bootstrap();
