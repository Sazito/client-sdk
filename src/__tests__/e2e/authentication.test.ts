/**
 * E2E Test: Authentication Flow
 * Tests user registration, login, and authenticated operations
 */

import { createSazitoClient } from '../../core/client';
import { mockFetch } from '../../test-helpers/mock-fetch';
import { mockOrder, mockApiResponse, mockPaginatedResponse } from '../../test-helpers/fixtures';

describe('E2E: Authentication Flow', () => {
  let mockFetchFn: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
  });

  it('should complete registration and login flow', async () => {
    // Step 1: Register new user
    mockFetchFn = mockFetch(mockApiResponse({
      user: {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      }
    }));

    const client = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const registerResponse = await client.users.register({
      email: 'test@example.com',
      password: 'SecurePass123!',
      passwordConfirmation: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe'
    });

    expect(registerResponse.data).toBeDefined();
    expect(registerResponse.data?.email).toBe('test@example.com');

    // Step 2: Login to get JWT token
    mockFetchFn = mockFetch(mockApiResponse({
      jwt: 'jwt-token-123',
      user: {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      }
    }));

    const loginClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const loginResponse = await loginClient.users.login({
      email: 'test@example.com',
      password: 'SecurePass123!'
    });

    expect(loginResponse.data).toBeDefined();
    expect(loginResponse.data?.jwt).toBe('jwt-token-123');

    // Step 3: Set token and get current user profile
    if (loginResponse.data?.jwt) {
      loginClient.setAuthToken(loginResponse.data.jwt);
    }

    mockFetchFn = mockFetch(mockApiResponse({
      user: {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      }
    }));

    const profileClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });
    profileClient.setAuthToken('jwt-token-123');

    const profileResponse = await profileClient.users.getCurrentUser();
    expect(profileResponse.data).toBeDefined();
    expect(profileResponse.data?.email).toBe('test@example.com');
  });

  it('should login and access protected resources', async () => {
    // Step 1: Login
    mockFetchFn = mockFetch(mockApiResponse({
      jwt: 'jwt-token-456',
      user: {
        id: 1,
        email: 'test@example.com'
      }
    }));

    const client = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const loginResponse = await client.users.login({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(loginResponse.data).toBeDefined();
    expect(loginResponse.data?.jwt).toBeDefined();

    // Step 2: Set token and access orders
    if (loginResponse.data?.jwt) {
      client.setAuthToken(loginResponse.data.jwt);
    }

    mockFetchFn = mockFetch(mockApiResponse(mockPaginatedResponse([mockOrder])));
    const ordersClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });
    ordersClient.setAuthToken('jwt-token-456');

    const ordersResponse = await ordersClient.orders.list();
    expect(ordersResponse.data).toBeDefined();
    expect(ordersResponse.data?.items).toBeDefined();
  });

  it('should handle mobile OTP authentication', async () => {
    // Step 1: Request OTP
    mockFetchFn = mockFetch(mockApiResponse({
      message: 'OTP sent successfully',
      requestId: 'otp-req-123'
    }));

    const otpClient1 = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const otpRequestResponse = await otpClient1.users.requestMobileOTP('09123456789');
    expect(otpRequestResponse.data).toBeDefined();

    // Step 2: Verify OTP
    mockFetchFn = mockFetch(mockApiResponse({
      jwt: 'jwt-token-otp',
      user: {
        id: 1,
        mobile: '09123456789'
      }
    }));

    const otpClient2 = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const verifyResponse = await otpClient2.users.verifyMobileOTP({
      mobile: '09123456789',
      verificationCode: '123456'
    });
    expect(verifyResponse.data).toBeDefined();
    expect(verifyResponse.data?.jwt).toBeDefined();
  });

  it('should logout and clear authentication', async () => {
    const client = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetch({})
    });

    // Set token
    client.setAuthToken('jwt-token-123');
    expect(client.isAuthenticated()).toBe(true);

    // Logout
    client.clearAuth();
    expect(client.isAuthenticated()).toBe(false);
    expect(client.getAuthToken()).toBeNull();
  });

  it('should merge guest data after login', async () => {
    const client = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    // Guest creates cart
    client.cart.clearCart();
    // Store cart identifier
    localStorage.setItem('CART_CREDENTIALS', JSON.stringify({
      cartId: 'cart-guest-123',
      cartIdentifier: 'guest-abc'
    }));

    // User logs in
    mockFetchFn = mockFetch(mockApiResponse({
      jwt: 'jwt-token-merge',
      user: { id: 1 }
    }));

    const loginClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    const loginResponse = await loginClient.users.login({
      email: 'test@example.com',
      password: 'password'
    });

    // Merge cart data
    mockFetchFn = mockFetch(mockApiResponse({ success: true }));
    const mergeClient = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });

    if (loginResponse.data?.jwt) {
      mergeClient.setAuthToken(loginResponse.data.jwt);
    }

    const mergeResponse = await mergeClient.users.mergeData();

    expect(mergeResponse.data).toBeDefined();
  });
});
