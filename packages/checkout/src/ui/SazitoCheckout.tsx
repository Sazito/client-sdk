'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useCheckout } from '../react';
import type { CheckoutTheme } from '../core';
import { Button, ErrorBanner } from './primitives';
import { Stepper } from './Stepper';
import { OrderSummary } from './OrderSummary';
import { CartStep } from './steps/CartStep';
import { ShippingStep } from './steps/ShippingStep';
import { PaymentStep } from './steps/PaymentStep';
import { ResultStep } from './steps/ResultStep';

/** Props passed to renderNextButton / renderBackButton. */
export interface RenderButtonProps {
  /** Whether the action is in-flight (show a loading indicator). */
  loading: boolean;
  /** Whether the button should be inert (validation not met). */
  disabled: boolean;
  /** Trigger the checkout action for this button. */
  onClick: () => void;
  /** Localised label for the current step. */
  children: ReactNode;
}

export interface RenderEmptyCartProps {
  continueShoppingUrl?: string;
}

export interface SazitoCheckoutProps {
  theme?: CheckoutTheme;
  continueShoppingUrl?: string;
  className?: string;
  renderNextButton?: (props: RenderButtonProps) => ReactNode;
  renderBackButton?: (props: RenderButtonProps) => ReactNode;
  renderEmptyCart?: (props: RenderEmptyCartProps) => ReactNode;
}

function themeVars(theme?: CheckoutTheme): CSSProperties {
  const vars: Record<string, string> = {};
  if (theme?.accent) vars['--szc-accent'] = theme.accent;
  if (theme?.accentForeground) vars['--szc-accent-foreground'] = theme.accentForeground;
  if (theme?.accentSoft) vars['--szc-accent-soft'] = theme.accentSoft;
  if (theme?.background) vars['--szc-bg'] = theme.background;
  if (theme?.foreground) vars['--szc-fg'] = theme.foreground;
  if (theme?.muted) vars['--szc-muted'] = theme.muted;
  if (theme?.mutedForeground) vars['--szc-muted-fg'] = theme.mutedForeground;
  if (theme?.border) vars['--szc-border'] = theme.border;
  if (theme?.card) vars['--szc-card'] = theme.card;
  if (theme?.summaryBackground) vars['--szc-summary-bg'] = theme.summaryBackground;
  if (theme?.danger) vars['--szc-danger'] = theme.danger;
  if (theme?.success) vars['--szc-success'] = theme.success;
  if (theme?.radius != null) vars['--szc-radius'] = `${theme.radius}px`;
  if (theme?.fontFamily) vars['--szc-font'] = theme.fontFamily;
  return vars as CSSProperties;
}

function CheckoutSkeleton({ label }: { label: string }) {
  return (
    <div className="szc-layout szc-skeleton-layout" role="status" aria-label={label}>
      <main className="szc-main" aria-hidden="true">
        <div className="szc-skeleton-cart-row">
          <span className="szc-skeleton szc-skeleton--thumb" />
          <div className="szc-skeleton-copy">
            <span className="szc-skeleton szc-skeleton--title" />
            <span className="szc-skeleton szc-skeleton--text" />
            <span className="szc-skeleton szc-skeleton--price" />
          </div>
          <span className="szc-skeleton szc-skeleton--counter" />
        </div>
        <div className="szc-skeleton-cart-row">
          <span className="szc-skeleton szc-skeleton--thumb" />
          <div className="szc-skeleton-copy">
            <span className="szc-skeleton szc-skeleton--title" />
            <span className="szc-skeleton szc-skeleton--text" />
            <span className="szc-skeleton szc-skeleton--price" />
          </div>
          <span className="szc-skeleton szc-skeleton--counter" />
        </div>
        <div className="szc-skeleton-footer">
          <span className="szc-skeleton szc-skeleton--button" />
        </div>
      </main>

      <aside className="szc-summary szc-summary--skeleton" aria-hidden="true">
        <div className="szc-summary__total-head">
          <span className="szc-skeleton szc-skeleton--summary-label" />
          <span className="szc-skeleton szc-skeleton--summary-total" />
        </div>
        <div className="szc-skeleton-summary-lines">
          <div><span className="szc-skeleton" /><span className="szc-skeleton" /></div>
          <div><span className="szc-skeleton" /><span className="szc-skeleton" /></div>
        </div>
        <div className="szc-skeleton-summary-grand">
          <span className="szc-skeleton" />
          <span className="szc-skeleton" />
        </div>
      </aside>
    </div>
  );
}

export function SazitoCheckout({
  theme,
  continueShoppingUrl,
  className,
  renderNextButton,
  renderBackButton,
  renderEmptyCart,
}: SazitoCheckoutProps) {
  const { state, actions, t } = useCheckout();
  const { step, direction, flags, error } = state;

  const isResult = step === 'result';
  const bootstrapping =
    step === 'cart' && !error && (!state.cart || !state.invoice || flags.bootstrapping);
  const fatal = error && !state.cart && step === 'cart';

  const cartEmpty = !state.cart || state.cart.items.length === 0;
  const footerVisible =
    (step === 'cart' && !cartEmpty) || step === 'shipping' || step === 'payment';

  const nextBusy =
    state.status === 'working' ||
    flags.savingAddress ||
    flags.loadingShipping ||
    flags.loadingPayments ||
    flags.placingOrder;

  const needsShipping = state.invoice?.needsShipping !== false;
  const shippingSavePhase = state.addressDirty || !state.applicable;
  const shippingReady =
    !needsShipping ||
    (state.shippingGroups.length > 0 &&
      state.shippingGroups.every((g) => g.selectedRateId != null));
  const paymentReady =
    state.paymentMethods.length > 0 && state.selectedPaymentMethodId != null;
  const nextDisabled =
    step === 'cart'
      ? cartEmpty
      : step === 'shipping'
        ? !shippingSavePhase && !shippingReady
        : step === 'payment'
          ? !paymentReady
          : false;

  const nextLabel =
    step === 'cart'
      ? t.placeOrder
      : step === 'shipping'
        ? needsShipping && shippingSavePhase
          ? t.saveShippingDetails
          : t.continueToPayment
        : t.finishPurchase;

  const backOnClick =
    step === 'cart' && continueShoppingUrl
      ? () => { window.location.href = continueShoppingUrl; }
      : () => actions.back();

  const backVisible =
    step !== 'cart' || !!continueShoppingUrl;

  const nextButtonProps: RenderButtonProps = {
    loading: nextBusy,
    disabled: nextDisabled,
    onClick: () => actions.next(),
    children: nextLabel,
  };

  const backButtonProps: RenderButtonProps = {
    loading: false,
    disabled: false,
    onClick: backOnClick,
    children: t.back,
  };

  return (
    <div
      className={`szc-root${className ? ` ${className}` : ''}`}
      dir={direction}
      style={themeVars(theme)}
    >
      <Stepper />

      {bootstrapping ? (
        <CheckoutSkeleton label={t.loading} />
      ) : fatal ? (
        <ErrorBanner message={error.message} />
      ) : isResult ? (
        <div className="szc-result-wrap">
          <ResultStep continueShoppingUrl={continueShoppingUrl} />
        </div>
      ) : (
        <div className={`szc-layout${cartEmpty ? ' szc-layout--full' : ''}`}>
          <main className="szc-main">
            {error ? <ErrorBanner message={error.message} /> : null}

            {step === 'cart' ? <CartStep continueShoppingUrl={continueShoppingUrl} renderEmpty={renderEmptyCart} /> : null}
            {step === 'shipping' ? <ShippingStep /> : null}
            {step === 'payment' ? <PaymentStep /> : null}

            {footerVisible ? (
              <div className="szc-footer">
                {backVisible ? (
                  renderBackButton ? (
                    renderBackButton(backButtonProps)
                  ) : (
                    <Button variant="ghost" onClick={backOnClick}>
                      {t.back}
                    </Button>
                  )
                ) : null}

                {renderNextButton ? (
                  renderNextButton(nextButtonProps)
                ) : (
                  <Button
                    block
                    loading={nextBusy}
                    disabled={nextDisabled}
                    onClick={() => actions.next()}
                  >
                    {nextLabel}
                  </Button>
                )}
              </div>
            ) : null}
          </main>

          {!cartEmpty ? <OrderSummary /> : null}
        </div>
      )}
    </div>
  );
}
