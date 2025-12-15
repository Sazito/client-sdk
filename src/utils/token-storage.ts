/**
 * Token Storage using HTTP-only cookies
 * Provides secure token storage with XSS protection
 */

import { CookieOptions } from '../types';

export class TokenStorage {
  private cookieName = 'user_id_token';

  /**
   * Get token from cookie
   */
  get(): string | null {
    if (typeof document === 'undefined') {
      // SSR environment - no access to cookies
      return null;
    }

    const cookies = this.parseCookies();
    return cookies[this.cookieName] || null;
  }

  /**
   * Set token in HTTP-only cookie
   */
  set(token: string, options?: CookieOptions): void {
    if (typeof document === 'undefined') {
      // SSR environment - cannot set cookies
      console.warn('[Sazito SDK] Cannot set cookie in SSR environment');
      return;
    }

    const defaultOptions: CookieOptions = {
      httpOnly: true,           // Prevents XSS attacks
      secure: true,             // HTTPS only in production
      sameSite: 'Lax',          // CSRF protection
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      path: '/',
      ...options
    };

    this.setCookie(this.cookieName, token, defaultOptions);
  }

  /**
   * Remove token cookie
   */
  remove(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.setCookie(this.cookieName, '', { maxAge: -1, path: '/' });
  }

  /**
   * Parse document.cookie into key-value pairs
   */
  private parseCookies(): Record<string, string> {
    if (typeof document === 'undefined') {
      return {};
    }

    return document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Set a cookie with options
   */
  private setCookie(name: string, value: string, options: CookieOptions): void {
    let cookie = `${name}=${encodeURIComponent(value)}`;

    if (options.maxAge !== undefined) {
      cookie += `; Max-Age=${options.maxAge}`;
    }
    if (options.path) {
      cookie += `; Path=${options.path}`;
    }
    if (options.domain) {
      cookie += `; Domain=${options.domain}`;
    }
    if (options.secure) {
      cookie += `; Secure`;
    }
    if (options.httpOnly) {
      cookie += `; HttpOnly`;
    }
    if (options.sameSite) {
      cookie += `; SameSite=${options.sameSite}`;
    }

    document.cookie = cookie;
  }
}
