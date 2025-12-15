/**
 * Test Client Factory
 */

import { createSazitoClient } from '../index';
import type { SazitoConfig } from '../core/config';

/**
 * Creates a test client with default test configuration
 */
export const createTestClient = (config: Partial<SazitoConfig> = {}) => {
  return createSazitoClient({
    domain: 'noel-accessories.ir',
    debug: false,
    timeout: 5000,
    ...config
  });
};

/**
 * Creates a test client with a custom fetch implementation
 */
export const createTestClientWithFetch = (
  fetchFn: typeof fetch,
  config: Partial<SazitoConfig> = {}
) => {
  return createSazitoClient({
    domain: 'noel-accessories.ir',
    customFetchApi: fetchFn,
    debug: false,
    ...config
  });
};
