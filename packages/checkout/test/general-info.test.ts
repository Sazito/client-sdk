import { describe, expect, it } from 'vitest';
import {
  transformGeneralInfoResponse,
  transformResponseKeys
} from '../../../src/utils/transformers';

describe('general info checkout settings', () => {
  it('preserves the email-optional flag through API key transformation', () => {
    const apiResult = {
      checkout: {
        email_optional: { enabled: true }
      }
    };

    const transformedKeys = transformResponseKeys(apiResult);
    const generalInfo = transformGeneralInfoResponse<{
      settings: { checkout: { emailOptional: boolean } };
    }>(transformedKeys as object);

    expect(generalInfo.settings.checkout.emailOptional).toBe(true);
  });

  it('still accepts an untransformed email_optional setting', () => {
    const generalInfo = transformGeneralInfoResponse<{
      settings: { checkout: { emailOptional: boolean } };
    }>({
      checkout: {
        email_optional: { enabled: true }
      }
    });

    expect(generalInfo.settings.checkout.emailOptional).toBe(true);
  });
});
