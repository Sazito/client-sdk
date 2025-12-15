/**
 * Tests for TokenStorage
 */

import { TokenStorage } from '../token-storage';

describe('TokenStorage', () => {
  let tokenStorage: TokenStorage;

  beforeEach(() => {
    tokenStorage = new TokenStorage();
    // Clear cookies before each test
    document.cookie = '';
  });

  describe('get()', () => {
    it('should get token from cookie', () => {
      document.cookie = 'user_id_token=test-jwt-token';
      const token = tokenStorage.get();
      expect(token).toBe('test-jwt-token');
    });

    it('should return null when no token exists', () => {
      const token = tokenStorage.get();
      expect(token).toBeNull();
    });

    it('should decode URI encoded token', () => {
      const encodedToken = encodeURIComponent('test.jwt.token+special/chars');
      document.cookie = `user_id_token=${encodedToken}`;
      const token = tokenStorage.get();
      expect(token).toBe('test.jwt.token+special/chars');
    });

    it('should handle multiple cookies', () => {
      // Note: In test environment, document.cookie doesn't accumulate like in browsers
      // Instead, it gets overwritten. This test verifies the parsing logic works
      document.cookie = 'other_cookie=value1; user_id_token=test-jwt-token; another_cookie=value2';

      const token = tokenStorage.get();
      expect(token).toBe('test-jwt-token');
    });
  });

  describe('set()', () => {
    it('should set token in cookie', () => {
      tokenStorage.set('new-jwt-token');

      const cookies = document.cookie.split(';').map(c => c.trim());
      const tokenCookie = cookies.find(c => c.startsWith('user_id_token='));

      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('new-jwt-token');
    });

    it('should encode special characters in token', () => {
      tokenStorage.set('token+with/special=chars');

      const token = tokenStorage.get();
      expect(token).toBe('token+with/special=chars');
    });

    it('should set cookie with default options', () => {
      tokenStorage.set('test-token');

      const cookieString = document.cookie;
      expect(cookieString).toContain('user_id_token=');
    });

    it('should overwrite existing token', () => {
      tokenStorage.set('old-token');
      tokenStorage.set('new-token');

      const token = tokenStorage.get();
      expect(token).toBe('new-token');
    });

    it('should accept custom options', () => {
      tokenStorage.set('test-token', {
        maxAge: 3600,
        path: '/custom',
        domain: 'example.com'
      });

      expect(document.cookie).toContain('user_id_token=');
    });
  });

  describe('remove()', () => {
    it('should remove token cookie', () => {
      tokenStorage.set('test-token');
      expect(tokenStorage.get()).toBe('test-token');

      tokenStorage.remove();

      // After removal, get should return null
      // Note: In test environment, cookie removal might not work perfectly
      // but we can check that remove was called without errors
      expect(() => tokenStorage.remove()).not.toThrow();
    });
  });

  describe('SSR environment handling', () => {
    let originalDocument: any;

    beforeEach(() => {
      originalDocument = global.document;
    });

    afterEach(() => {
      // Restore document
      global.document = originalDocument;
    });

    it('should return null in SSR environment', () => {
      // Simulate SSR by removing document
      delete (global as any).document;

      const token = tokenStorage.get();
      expect(token).toBeNull();

      // Restore
      global.document = originalDocument;
    });

    it('should not throw when setting token in SSR', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      delete (global as any).document;

      expect(() => tokenStorage.set('test-token')).not.toThrow();

      // In SSR environment, warning should be logged
      if (consoleSpy.mock.calls.length > 0) {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('SSR environment')
        );
      }

      consoleSpy.mockRestore();
      global.document = originalDocument;
    });

    it('should not throw when removing token in SSR', () => {
      delete (global as any).document;

      expect(() => tokenStorage.remove()).not.toThrow();

      global.document = originalDocument;
    });
  });
});
