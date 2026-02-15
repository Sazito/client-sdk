import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { FeedbacksAPI } from '../api/feedbacks';

export * from '../api/feedbacks';

export function createFeedbacksAPI(configOrContext: SazitoConfig | ModuleContext): FeedbacksAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new FeedbacksAPI(http);
}
