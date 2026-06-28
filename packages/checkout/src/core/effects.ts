/**
 * Side-effect types + the default browser executor.
 *
 * The engine never touches the DOM directly; it emits effects and a host-
 * provided executor performs them. This keeps the engine SSR-safe and testable.
 */
import type { CheckoutConfig, CheckoutEffect, CheckoutEffectExecutor } from './types';

/**
 * Performs a gateway POST by building and submitting a hidden HTML form,
 * matching the legacy `action: 'POST'` payment behavior.
 */
function submitPostForm(url: string, fields: Record<string, string>): void {
  if (typeof document === 'undefined') {
    return;
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  form.style.display = 'none';

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value == null ? '' : String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

/**
 * Build the default browser executor. `onEvent` (from config) receives `emit`
 * effects so analytics adapters can subscribe.
 */
export function createBrowserEffectExecutor(config?: CheckoutConfig): CheckoutEffectExecutor {
  return (effect: CheckoutEffect) => {
    switch (effect.type) {
      case 'redirect':
        if (typeof window !== 'undefined') {
          window.location.href = effect.url;
        }
        return;
      case 'post-form':
        submitPostForm(effect.url, effect.fields);
        return;
      case 'emit':
        config?.onEvent?.(effect.event);
        return;
    }
  };
}

/** A no-op executor for SSR / tests. */
export const noopEffectExecutor: CheckoutEffectExecutor = () => {};
