#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { AsyncLocalStorage } = require('async_hooks');

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'scripts', 'visual-api-playground', 'public');
const DIST_ENTRY = path.join(ROOT_DIR, 'dist', 'index.js');
const API_BASE = 'http://api.sazito.com:8080';
const PLAYGROUND_DEFAULT_DOMAIN = 'noel-accessories.ir';

// Persist SDK "localStorage" credentials across requests in this Node process.
// Storage is isolated per (domain + sessionId) to avoid cross-session leakage.
const storageContext = new AsyncLocalStorage();
const storageNamespaces = new Map();

function getNamespaceStorage(namespace) {
  if (!storageNamespaces.has(namespace)) {
    storageNamespaces.set(namespace, new Map());
  }
  return storageNamespaces.get(namespace);
}

function getActiveStorage() {
  const namespace = storageContext.getStore() || 'default';
  return getNamespaceStorage(namespace);
}

function parseStoredValue(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

function getStorageSnapshot(namespace) {
  const storage = getNamespaceStorage(namespace);
  const snapshot = {};

  for (const [key, value] of storage.entries()) {
    snapshot[key] = parseStoredValue(value);
  }

  return snapshot;
}

function ensureLocalStorageShim() {
  const shim = {
    getItem(key) {
      const storage = getActiveStorage();
      return storage.has(String(key)) ? storage.get(String(key)) : null;
    },
    setItem(key, value) {
      const storage = getActiveStorage();
      storage.set(String(key), String(value));
    },
    removeItem(key) {
      const storage = getActiveStorage();
      storage.delete(String(key));
    },
    clear() {
      const storage = getActiveStorage();
      storage.clear();
    },
    key(index) {
      const storage = getActiveStorage();
      const keys = Array.from(storage.keys());
      return keys[index] ?? null;
    },
    get length() {
      const storage = getActiveStorage();
      return storage.size;
    }
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: shim,
    writable: true,
    configurable: true
  });
}

ensureLocalStorageShim();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function writeJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function writeText(res, statusCode, text) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Request body too large. Maximum size is 1MB.'));
      }
    });

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });

    req.on('error', reject);
  });
}

function sanitizeDomain(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;
  return value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function sanitizeSessionId(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;
  return value;
}

function sanitizeAuthToken(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim().replace(/^Bearer\s+/i, '');
  return value || null;
}

function toHeaderObject(headers) {
  if (!headers) return {};

  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  if (typeof headers === 'object') {
    return { ...headers };
  }

  return {};
}

function serializeError(error) {
  if (!error) return null;
  const details = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };

  if (error.cause) {
    details.cause = {
      name: error.cause.name,
      message: error.cause.message,
      code: error.cause.code,
      errno: error.cause.errno,
      syscall: error.cause.syscall,
      hostname: error.cause.hostname
    };
  }

  return details;
}

function parseRequestBody(body) {
  if (!body) return null;
  if (typeof body !== 'string') return body;

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function appendFormField(formData, key, value) {
  if (value === undefined) return;

  if (value === null) {
    formData.append(key, '');
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(item => appendFormField(formData, key, item));
    return;
  }

  if (typeof value === 'object') {
    formData.append(key, JSON.stringify(value));
    return;
  }

  formData.append(key, String(value));
}

function toFormDataFromObject(input) {
  if (typeof FormData === 'undefined') {
    return null;
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return new FormData();
  }

  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    appendFormField(formData, key, value);
  });
  return formData;
}

function summarizeResponse(response) {
  if (!response) {
    return { ok: false, status: null, data: null, error: { message: 'No SDK response returned' } };
  }

  if (response.error) {
    return {
      ok: false,
      status: response.error.status || null,
      data: null,
      error: response.error
    };
  }

  return {
    ok: true,
    status: 200,
    data: response.data,
    error: null
  };
}

async function executeOperation(payload) {
  if (!fs.existsSync(DIST_ENTRY)) {
    return {
      statusCode: 500,
      body: {
        error: {
          message: 'dist/index.js not found. Run `pnpm build` first, then restart the visual server.'
        }
      }
    };
  }

  const { createSazitoClient } = require(DIST_ENTRY);

  const operation = payload.operation;
  const domain = sanitizeDomain(payload.domain) || PLAYGROUND_DEFAULT_DOMAIN;
  const jwt = sanitizeAuthToken(payload.jwt);
  const input = payload.input || {};

  if (!operation || typeof operation !== 'string') {
    return {
      statusCode: 400,
      body: { error: { message: 'Missing required field: operation' } }
    };
  }

  const capture = {
    method: null,
    url: null,
    headers: null,
    body: null,
    status: null,
    responseHeaders: null,
    networkError: null
  };

  const customFetchApi = async (url, options = {}) => {
    const requestHeaders = toHeaderObject(options.headers);
    if (jwt && !requestHeaders.Authorization && !requestHeaders.authorization) {
      requestHeaders.Authorization = jwt;
    }

    const finalOptions = {
      ...options,
      headers: requestHeaders
    };

    capture.method = options.method || 'GET';
    capture.url = String(url);
    capture.headers = requestHeaders;
    capture.body = parseRequestBody(options.body);

    try {
      const response = await fetch(url, finalOptions);
      capture.status = response.status;
      capture.responseHeaders = Object.fromEntries(response.headers.entries());
      return response;
    } catch (error) {
      capture.networkError = serializeError(error);
      throw error;
    }
  };

  const client = createSazitoClient({
    domain,
    debug: false,
    customFetchApi
  });
  if (jwt) {
    client.setAuthToken(jwt);
  }

  const startedAt = new Date();
  let sdkResponse;
  const sdkRequest = {
    method: null,
    params: null
  };

  try {
    switch (operation) {
      case 'products.list': {
        const filters = input.filters || {};
        sdkRequest.method = 'client.products.list';
        sdkRequest.params = { filters };
        sdkResponse = await client.products.list(filters);
        break;
      }
      case 'products.get': {
        const slugOrPath = String(input.slugOrPath || '').trim();
        sdkRequest.method = 'client.products.get';
        sdkRequest.params = { slugOrPath };
        sdkResponse = await client.products.get(slugOrPath);
        break;
      }
      case 'search.query': {
        const query = String(input.query || '').trim();
        const filters = input.filters || {};
        sdkRequest.method = 'client.search.query';
        sdkRequest.params = { query, filters };
        sdkResponse = await client.search.query(query, filters);
        break;
      }
      case 'categories.list': {
        const filters = input.filters || {};
        sdkRequest.method = 'client.categories.list';
        sdkRequest.params = { filters };
        sdkResponse = await client.categories.list(filters);
        break;
      }
      case 'categories.get': {
        const idOrSlug = input.idOrSlug;
        sdkRequest.method = 'client.categories.get';
        sdkRequest.params = { idOrSlug };
        sdkResponse = await client.categories.get(idOrSlug);
        break;
      }
      case 'cms.listPages': {
        const filters = input.filters || {};
        sdkRequest.method = 'client.cms.listPages';
        sdkRequest.params = { filters };
        sdkResponse = await client.cms.listPages(filters);
        break;
      }
      case 'cms.getPage': {
        const urlPath = String(input.urlPath || '').trim();
        sdkRequest.method = 'client.cms.getPage';
        sdkRequest.params = { urlPath };
        sdkResponse = await client.cms.getPage(urlPath);
        break;
      }
      case 'cms.listBlogPosts': {
        const filters = input.filters || {};
        sdkRequest.method = 'client.cms.listBlogPosts';
        sdkRequest.params = { filters };
        sdkResponse = await client.cms.listBlogPosts(filters);
        break;
      }
      case 'cms.getBlogPost': {
        const urlPath = String(input.urlPath || '').trim();
        sdkRequest.method = 'client.cms.getBlogPost';
        sdkRequest.params = { urlPath };
        sdkResponse = await client.cms.getBlogPost(urlPath);
        break;
      }
      case 'menu.getHeaderMenu': {
        const identifier = String(input.identifier || '').trim() || 'headermenu';
        sdkRequest.method = 'client.menu.getHeaderMenu';
        sdkRequest.params = { identifier };
        sdkResponse = await client.menu.getHeaderMenu(identifier);
        break;
      }
      case 'booking.getEvent': {
        const entityId = Number(input.entityId);
        sdkRequest.method = 'client.booking.getEvent';
        sdkRequest.params = { entityId };
        sdkResponse = await client.booking.getEvent(entityId);
        break;
      }
      case 'booking.getEventAvailabilities': {
        const payload = {
          eventEntityId: Number(input.eventEntityId),
          duration: Number(input.duration),
          fromDate: String(input.fromDate || '').trim(),
          toDate: String(input.toDate || '').trim(),
          timezone: input.timezone ? String(input.timezone).trim() : undefined
        };
        sdkRequest.method = 'client.booking.getEventAvailabilities';
        sdkRequest.params = payload;
        sdkResponse = await client.booking.getEventAvailabilities(payload);
        break;
      }
      case 'cart.get':
        sdkRequest.method = 'client.cart.get';
        sdkRequest.params = {};
        sdkResponse = await client.cart.get();
        break;
      case 'cart.create': {
        const payload = input.input || {};
        sdkRequest.method = 'client.cart.create';
        sdkRequest.params = payload;
        sdkResponse = await client.cart.create(payload);
        break;
      }
      case 'cart.addItemWithAttributes': {
        const variantId = Number(input.variantId);
        const count = Number(input.count);
        const attributes = input.attributes || {};
        sdkRequest.method = 'client.cart.addItemWithAttributes';
        sdkRequest.params = { variantId, count, attributes };
        sdkResponse = await client.cart.addItemWithAttributes(variantId, count, attributes);
        break;
      }
      case 'cart.updateItem': {
        const cartProductId = String(input.cartProductId || '').trim();
        const variantId = Number(input.variantId);
        const count = Number(input.count);
        const formAttributes = input.formAttributes || undefined;
        const coupon = input.coupon ? String(input.coupon).trim() : undefined;
        const deleteCoupon = typeof input.deleteCoupon === 'boolean'
          ? input.deleteCoupon
          : undefined;
        const attributes = { formAttributes, coupon, deleteCoupon };
        sdkRequest.method = 'client.cart.updateItemWithAttributes';
        sdkRequest.params = { cartProductId, variantId, count, attributes };
        sdkResponse = await client.cart.updateItemWithAttributes(cartProductId, variantId, count, attributes);
        break;
      }
      case 'cart.removeItem': {
        const cartProductId = String(input.cartProductId || '').trim();
        const variantId = Number(input.variantId);
        sdkRequest.method = 'client.cart.removeItem';
        sdkRequest.params = { cartProductId, variantId };
        sdkResponse = await client.cart.removeItem(cartProductId, variantId);
        break;
      }
      case 'invoices.get':
        sdkRequest.method = 'client.invoices.get';
        sdkRequest.params = {};
        sdkResponse = await client.invoices.get();
        break;
      case 'invoices.create':
        sdkRequest.method = 'client.invoices.create';
        sdkRequest.params = {};
        sdkResponse = await client.invoices.create();
        break;
      case 'invoices.refresh':
        sdkRequest.method = 'client.invoices.refresh';
        sdkRequest.params = {};
        sdkResponse = await client.invoices.refresh();
        break;
      case 'invoices.addShippingAddress': {
        const shippingAddressId = Number(input.shippingAddressId);
        const shippingAddressIdentifier = String(input.shippingAddressIdentifier || '').trim();
        sdkRequest.method = 'client.invoices.addShippingAddress';
        sdkRequest.params = { shippingAddressId, shippingAddressIdentifier };
        sdkResponse = await client.invoices.addShippingAddress(shippingAddressId, shippingAddressIdentifier);
        break;
      }
      case 'invoices.assignShippingMethod': {
        const shippings = Array.isArray(input.shippings) ? input.shippings : [];
        sdkRequest.method = 'client.invoices.assignShippingMethod';
        sdkRequest.params = { shippings };
        sdkResponse = await client.invoices.assignShippingMethod(shippings);
        break;
      }
      case 'invoices.addDiscountCode': {
        const code = String(input.code || '').trim();
        sdkRequest.method = 'client.invoices.addDiscountCode';
        sdkRequest.params = { code };
        sdkResponse = await client.invoices.addDiscountCode(code);
        break;
      }
      case 'invoices.addDetails': {
        const comment = String(input.comment || '').trim();
        sdkRequest.method = 'client.invoices.addDetails';
        sdkRequest.params = { comment };
        sdkResponse = await client.invoices.addDetails(comment);
        break;
      }
      case 'dynamicForms.getForm': {
        const formId = Number(input.formId);
        sdkRequest.method = 'client.dynamicForms.getForm';
        sdkRequest.params = { formId };
        sdkResponse = await client.dynamicForms.getForm(formId);
        break;
      }
      case 'dynamicForms.uploadProductFormFile': {
        const fileName = String(input.fileName || 'sample.txt').trim() || 'sample.txt';
        const fileContent = String(input.fileContent || 'sample file');
        const uploadFile = typeof File !== 'undefined'
          ? new File([fileContent], fileName, { type: 'text/plain' })
          : new Blob([fileContent], { type: 'text/plain' });
        sdkRequest.method = 'client.dynamicForms.uploadProductFormFile';
        sdkRequest.params = { fileName, fileContentLength: fileContent.length };
        sdkResponse = await client.dynamicForms.uploadProductFormFile(uploadFile);
        break;
      }
      case 'regions.list':
        sdkRequest.method = 'client.regions.list';
        sdkRequest.params = {};
        sdkResponse = await client.regions.list();
        break;
      case 'feedbacks.getSeed': {
        const orderIdentifier = String(input.orderIdentifier || '').trim();
        sdkRequest.method = 'client.feedbacks.getSeed';
        sdkRequest.params = { orderIdentifier };
        sdkResponse = await client.feedbacks.getSeed(orderIdentifier);
        break;
      }
      case 'feedbacks.createOrderRating': {
        const payload = {
          orderId: String(input.input?.orderId || '').trim(),
          orderIdentifier: String(input.input?.orderIdentifier || '').trim(),
          orderRate: Number(input.input?.orderRate)
        };
        sdkRequest.method = 'client.feedbacks.createOrderRating';
        sdkRequest.params = payload;
        sdkResponse = await client.feedbacks.createOrderRating(payload);
        break;
      }
      case 'feedbacks.submitProductReview': {
        const payload = input.input || {};
        sdkRequest.method = 'client.feedbacks.submitProductReview';
        sdkRequest.params = payload;
        sdkResponse = await client.feedbacks.submitProductReview(payload);
        break;
      }
      case 'feedbacks.getProductStatistics': {
        const productId = String(input.productId || '').trim();
        sdkRequest.method = 'client.feedbacks.getProductStatistics';
        sdkRequest.params = { productId };
        sdkResponse = await client.feedbacks.getProductStatistics(productId);
        break;
      }
      case 'feedbacks.getProductReviews': {
        const productId = String(input.productId || '').trim();
        const filters = input.filters || {};
        sdkRequest.method = 'client.feedbacks.getProductReviews';
        sdkRequest.params = { productId, filters };
        sdkResponse = await client.feedbacks.getProductReviews(productId, filters);
        break;
      }
      case 'feedbacks.uploadReviewImages': {
        const images = Array.isArray(input.images) ? input.images : [];
        const payload = images.map((item, index) => ({
          file: new Blob([String(item.content || `image-${index + 1}`)], { type: 'text/plain' }),
          name: item.name ? String(item.name) : `image-${index + 1}.txt`,
          alt: item.alt ? String(item.alt) : `image-${index + 1}`
        }));
        sdkRequest.method = 'client.feedbacks.uploadReviewImages';
        sdkRequest.params = {
          images: payload.map(item => ({ name: item.name, alt: item.alt }))
        };
        sdkResponse = await client.feedbacks.uploadReviewImages(payload);
        break;
      }
      case 'invoices.addForm': {
        const payload = input.input || {};
        const normalizedPayload = {
          formAttributes: payload.formAttributes || {},
          identifier: payload.identifier ? String(payload.identifier).trim() : undefined
        };
        sdkRequest.method = 'client.invoices.addForm';
        sdkRequest.params = normalizedPayload;
        sdkResponse = await client.invoices.addForm(normalizedPayload);
        break;
      }
      case 'invoices.getApplicableShippingMethods':
        sdkRequest.method = 'client.invoices.getApplicableShippingMethods';
        sdkRequest.params = {};
        sdkResponse = await client.invoices.getApplicableShippingMethods();
        break;
      case 'invoices.addCredit':
        sdkRequest.method = 'client.invoices.addCredit';
        sdkRequest.params = {};
        sdkResponse = await client.invoices.addCredit();
        break;
      case 'invoices.removeCredit':
        sdkRequest.method = 'client.invoices.removeCredit';
        sdkRequest.params = {};
        sdkResponse = await client.invoices.removeCredit();
        break;
      case 'invoices.toggleCredit':
        sdkRequest.method = 'client.invoices.toggleCredit';
        sdkRequest.params = {};
        sdkResponse = await client.invoices.toggleCredit();
        break;
      case 'shipping.createAddress': {
        const address = input.address || {};
        sdkRequest.method = 'client.shipping.createAddress';
        sdkRequest.params = { address };
        sdkResponse = await client.shipping.createAddress(address);
        break;
      }
      case 'shipping.updateAddress': {
        const address = input.address || {};
        sdkRequest.method = 'client.shipping.updateAddress';
        sdkRequest.params = { address };
        sdkResponse = await client.shipping.updateAddress(address);
        break;
      }
      case 'shipping.getAddress':
        sdkRequest.method = 'client.shipping.getAddress';
        sdkRequest.params = {};
        sdkResponse = await client.shipping.getAddress();
        break;
      case 'shipping.getMethods':
        sdkRequest.method = 'client.shipping.getMethods';
        sdkRequest.params = {};
        sdkResponse = await client.shipping.getMethods();
        break;
      case 'payments.getMethods':
        sdkRequest.method = 'client.payments.getMethods';
        sdkRequest.params = {};
        sdkResponse = await client.payments.getMethods();
        break;
      case 'payments.create': {
        const paymentTypeId = Number(input.paymentTypeId);
        sdkRequest.method = 'client.payments.create';
        sdkRequest.params = { paymentTypeId };
        sdkResponse = await client.payments.create(paymentTypeId);
        break;
      }
      case 'payments.initialize':
        sdkRequest.method = 'client.payments.initialize';
        sdkRequest.params = {};
        sdkResponse = await client.payments.initialize();
        break;
      case 'payments.processStep': {
        const mode = String(input.mode || 'json').toLowerCase();

        if (mode === 'form') {
          const formFields = input.formFields && typeof input.formFields === 'object'
            ? input.formFields
            : {};
          const formData = toFormDataFromObject(formFields);
          sdkRequest.method = 'client.payments.processStepForm';
          sdkRequest.params = { mode, formFields };

          sdkResponse = formData
            ? await client.payments.processStepForm(formData)
            : {
              error: {
                type: 'validation',
                message: 'FormData is not available in this runtime.'
              }
            };
          break;
        }

        const payload = input.input || {};
        sdkRequest.method = 'client.payments.processStep';
        sdkRequest.params = { mode: 'json', input: payload };
        sdkResponse = await client.payments.processStep(payload);
        break;
      }
      case 'payments.pollUntilSettled': {
        const intervalMs = Number(input.intervalMs) || 15000;
        sdkRequest.method = 'client.payments.pollUntilSettled';
        sdkRequest.params = { intervalMs };
        sdkResponse = await client.payments.pollUntilSettled(undefined, intervalMs);
        break;
      }
      case 'users.login': {
        const payload = {
          email: String(input.email || '').trim(),
          password: String(input.password || '')
        };
        sdkRequest.method = 'client.users.login';
        sdkRequest.params = payload;
        sdkResponse = await client.users.login(payload);
        break;
      }
      case 'users.register': {
        const payload = {
          email: String(input.email || '').trim(),
          password: String(input.password || ''),
          passwordConfirmation: String(input.passwordConfirmation || ''),
          firstName: input.firstName ? String(input.firstName).trim() : undefined,
          lastName: input.lastName ? String(input.lastName).trim() : undefined,
          mobilePhone: input.mobilePhone ? String(input.mobilePhone).trim() : undefined
        };
        sdkRequest.method = 'client.users.register';
        sdkRequest.params = payload;
        sdkResponse = await client.users.register(payload);
        break;
      }
      case 'users.requestMobileOTP': {
        const payload = {
          mobilePhone: String(input.mobilePhone || '').trim()
        };
        sdkRequest.method = 'client.users.requestMobileOTP';
        sdkRequest.params = payload;
        sdkResponse = await client.users.requestMobileOTP(payload);
        break;
      }
      case 'users.verifyMobileOTP': {
        const payload = {
          mobilePhone: String(input.mobilePhone || '').trim(),
          token: String(input.token || '').trim()
        };
        sdkRequest.method = 'client.users.verifyMobileOTP';
        sdkRequest.params = payload;
        sdkResponse = await client.users.verifyMobileOTP(payload);
        break;
      }
      case 'users.requestEmailLogin': {
        const payload = {
          email: String(input.email || '').trim()
        };
        sdkRequest.method = 'client.users.requestEmailLogin';
        sdkRequest.params = payload;
        sdkResponse = await client.users.requestEmailLogin(payload);
        break;
      }
      case 'users.forgotPassword': {
        const payload = {
          email: String(input.email || '').trim()
        };
        sdkRequest.method = 'client.users.forgotPassword';
        sdkRequest.params = payload;
        sdkResponse = await client.users.forgotPassword(payload);
        break;
      }
      case 'users.revivePassword': {
        const payload = {
          forgotPasswordToken: String(input.forgotPasswordToken || '').trim(),
          password: String(input.password || ''),
          passwordConfirmation: String(input.passwordConfirmation || '')
        };
        sdkRequest.method = 'client.users.revivePassword';
        sdkRequest.params = payload;
        sdkResponse = await client.users.revivePassword(payload);
        break;
      }
      case 'users.getCurrentUser':
        sdkRequest.method = 'client.users.getCurrentUser';
        sdkRequest.params = {};
        sdkResponse = await client.users.getCurrentUser();
        break;
      case 'users.updateProfile': {
        const userId = Number(input.userId);
        const profile = input.profile || {};
        sdkRequest.method = 'client.users.updateProfile';
        sdkRequest.params = { userId, profile };
        sdkResponse = await client.users.updateProfile(userId, profile);
        break;
      }
      case 'users.requestMobilePhoneUpdate': {
        const payload = {
          mobilePhone: String(input.mobilePhone || '').trim()
        };
        sdkRequest.method = 'client.users.requestMobilePhoneUpdate';
        sdkRequest.params = payload;
        sdkResponse = await client.users.requestMobilePhoneUpdate(payload);
        break;
      }
      case 'users.verifyMobilePhoneUpdate': {
        const payload = {
          mobilePhone: String(input.mobilePhone || '').trim(),
          token: String(input.token || '').trim()
        };
        sdkRequest.method = 'client.users.verifyMobilePhoneUpdate';
        sdkRequest.params = payload;
        sdkResponse = await client.users.verifyMobilePhoneUpdate(payload);
        break;
      }
      case 'users.mergeUser':
        sdkRequest.method = 'client.users.mergeUser';
        sdkRequest.params = {};
        sdkResponse = await client.users.mergeUser();
        break;
      case 'wallet.getBalance':
        sdkRequest.method = 'client.wallet.getBalance';
        sdkRequest.params = {};
        sdkResponse = await client.wallet.getBalance();
        break;
      case 'wallet.applyCredit': {
        const invoiceId = Number(input.invoiceId);
        sdkRequest.method = 'client.wallet.applyCredit';
        sdkRequest.params = { invoiceId };
        sdkResponse = await client.wallet.applyCredit(invoiceId);
        break;
      }
      case 'wallet.removeCredit': {
        const invoiceId = Number(input.invoiceId);
        sdkRequest.method = 'client.wallet.removeCredit';
        sdkRequest.params = { invoiceId };
        sdkResponse = await client.wallet.removeCredit(invoiceId);
        break;
      }
      case 'wallet.listTransactions': {
        const filters = input.filters || {};
        sdkRequest.method = 'client.wallet.listTransactions';
        sdkRequest.params = { filters };
        sdkResponse = await client.wallet.listTransactions(filters);
        break;
      }
      case 'general.getInfo':
        sdkRequest.method = 'client.general.getInfo';
        sdkRequest.params = {};
        sdkResponse = await client.general.getInfo();
        break;
      case 'visits.track': {
        sdkRequest.method = 'client.visits.track';
        sdkRequest.params = {};
        sdkResponse = await client.visits.track();
        break;
      }
      default:
        return {
          statusCode: 400,
          body: {
            error: { message: `Unsupported operation: ${operation}` }
          }
        };
    }
  } catch (error) {
    sdkResponse = {
      error: {
        type: 'internal',
        message: error.message || 'Unexpected error while executing operation',
        details: serializeError(error)
      }
    };
  }

  const endedAt = new Date();

  let parsedUrl = null;
  if (capture.url) {
    try {
      parsedUrl = new URL(capture.url);
    } catch {
      parsedUrl = null;
    }
  }

  const request = {
    method: capture.method,
    baseUrl: API_BASE,
    fullUrl: capture.url,
    path: parsedUrl ? parsedUrl.pathname : null,
    query: parsedUrl ? Object.fromEntries(parsedUrl.searchParams.entries()) : {},
    headers: capture.headers || {},
    body: capture.body,
    sdk: sdkRequest
  };

  const response = summarizeResponse(sdkResponse);

  return {
    statusCode: 200,
    body: {
      meta: {
        operation,
        domain,
        jwtProvided: Boolean(jwt),
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMs: endedAt.getTime() - startedAt.getTime()
      },
      request,
      response,
      transport: {
        httpStatus: capture.status,
        responseHeaders: capture.responseHeaders,
        networkError: capture.networkError
      }
    }
  };
}

function resolvePublicPath(urlPathname) {
  const requested = urlPathname === '/' ? '/index.html' : urlPathname;
  const normalized = path.normalize(requested).replace(/^\.\.(\/|\\|$)/, '');
  const finalPath = path.join(PUBLIC_DIR, normalized);

  if (!finalPath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return finalPath;
}

function serveStatic(req, res, parsedUrl) {
  const filePath = resolvePublicPath(parsedUrl.pathname);
  if (!filePath) {
    writeText(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        writeText(res, 404, 'Not found');
        return;
      }

      writeText(res, 500, 'Failed to load file');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  });
}

async function handleApiExecute(req, res) {
  try {
    const payload = await parseJsonBody(req);
    const domain = sanitizeDomain(payload.domain) || PLAYGROUND_DEFAULT_DOMAIN;
    const sessionId = sanitizeSessionId(payload.sessionId) || 'global';
    const storageNamespace = `${domain}::${sessionId}`;
    const result = await storageContext.run(storageNamespace, () => executeOperation(payload));
    if (result?.body && typeof result.body === 'object' && !result.body.error) {
      result.body.storage = {
        namespace: storageNamespace,
        snapshot: getStorageSnapshot(storageNamespace)
      };
    }
    writeJson(res, result.statusCode, result.body);
  } catch (error) {
    writeJson(res, 400, {
      error: {
        message: error.message || 'Invalid request payload'
      }
    });
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);

  // Basic CORS for local tooling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    writeJson(res, 200, { ok: true, service: 'visual-api-playground' });
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/execute') {
    handleApiExecute(req, res);
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res, parsedUrl);
    return;
  }

  writeText(res, 405, 'Method not allowed');
});

server.listen(PORT, HOST, () => {
  console.log('Visual API Playground is running');
  console.log(`Local URL: http://${HOST}:${PORT}`);
  console.log('Run `pnpm build` if you changed SDK source and want fresh dist output.');
});
