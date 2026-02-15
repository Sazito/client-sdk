/**
 * Token storage for auth token persistence
 * Primary storage: localStorage (user_id_token), with cookie fallback.
 */

import { CookieOptions } from '../types';

export class TokenStorage {
  private readonly tokenKey = 'user_id_token';

  /**
   * Get token from localStorage (fallback to cookie)
   */
  get(): string | null {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // SSR environment - no access to browser storage
      return null;
    }

    const storageToken = this.getFromLocalStorage();
    if (storageToken) return storageToken;

    const cookies = this.parseCookies();
    return cookies[this.tokenKey] || null;
  }

  /**
   * Set token in localStorage and cookie fallback
   */
  set(token: string, options?: CookieOptions): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // SSR environment - cannot set browser storage
      console.warn('[Sazito SDK] Cannot set token in SSR environment');
      return;
    }

    this.setInLocalStorage(token);

    const defaultOptions: CookieOptions = {
      secure: true,
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      ...options
    };
    this.setCookie(this.tokenKey, token, defaultOptions);
  }

  /**
   * Remove token from both localStorage and cookie
   */
  remove(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.removeFromLocalStorage();
    this.setCookie(this.tokenKey, '', { maxAge: -1, path: '/' });
  }

  private getFromLocalStorage(): string | null {
    try {
      return window.localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  private setInLocalStorage(token: string): void {
    try {
      window.localStorage.setItem(this.tokenKey, token);
    } catch {
      // Ignore storage exceptions (private mode/quota/security)
    }
  }

  private removeFromLocalStorage(): void {
    try {
      window.localStorage.removeItem(this.tokenKey);
    } catch {
      // Ignore storage exceptions (private mode/quota/security)
    }
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
