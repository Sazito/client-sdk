'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useCheckout } from '../react';
import { formatNumber, type CheckoutTheme } from '../core';
import { Button, ErrorBanner, Spinner } from './primitives';
import { Stepper, CartIcon, TruckIcon, CardIcon, ClipboardIcon } from './Stepper';
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
  if (theme?.successForeground) vars['--szc-success-foreground'] = theme.successForeground;
  if (theme?.logoBackground) vars['--szc-logo-bg'] = theme.logoBackground;
  if (theme?.shippingNeutral) vars['--szc-shipping-neutral'] = theme.shippingNeutral;
  if (theme?.shippingNeutralForeground) vars['--szc-shipping-neutral-foreground'] = theme.shippingNeutralForeground;
  if (theme?.radius != null) vars['--szc-radius'] = `${theme.radius}px`;
  if (theme?.fontFamily) vars['--szc-font'] = theme.fontFamily;
  return vars as CSSProperties;
}

function CheckoutLoading({ label }: { label: string }) {
  return (
    <div className="szc-checkout-loading" role="status" aria-live="polite">
      <Spinner className="szc-checkout-loading__spinner" />
      <span>{label}</span>
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
  const { state, actions, t, summary, money } = useCheckout();
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

  /* Rendered twice: under the order summary (desktop) and in the sticky
     bottom bar (mobile). CSS shows exactly one of the two. */
  const nextButtonNode = renderNextButton ? (
    renderNextButton(nextButtonProps)
  ) : (
    <Button
      className="szc-footer__next"
      loading={nextBusy}
      disabled={nextDisabled}
      onClick={() => actions.next()}
    >
      {nextLabel}
    </Button>
  );

  const backButtonNode = backVisible ? (
    renderBackButton ? (
      renderBackButton(backButtonProps)
    ) : (
      <Button variant="ghost" className="szc-back-btn" onClick={backOnClick}>
        <svg
          className="szc-back-arrow"
          viewBox="0 0 16 16"
          width="15"
          height="15"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9.5 3.5 5 8l4.5 4.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t.back}
      </Button>
    )
  ) : null;

  const actionsVisible = !bootstrapping && !fatal && !isResult && footerVisible;

  /* Mobile header (replaces the stepper on small screens): back chevron at the
     inline start, current step title centered, "step n of m" at the end. */
  const flowSteps = ['cart', 'shipping', 'payment'] as const;
  const flowIndex = flowSteps.indexOf(step as (typeof flowSteps)[number]);
  const headTitle =
    step === 'cart'
      ? t.stepCart
      : step === 'shipping'
        ? t.stepShippingInfo
        : step === 'payment'
          ? t.stepPayment
          : t.stepResult;
  const HeadIcon =
    step === 'cart'
      ? CartIcon
      : step === 'shipping'
        ? TruckIcon
        : step === 'payment'
          ? CardIcon
          : ClipboardIcon;
  const mobileHead = (
    <div className="szc-mobile-head">
      {footerVisible && backVisible ? (
        <button
          type="button"
          className="szc-mobile-head__back"
          aria-label={t.back}
          onClick={backOnClick}
        >
          <svg
            className="szc-back-arrow"
            viewBox="0 0 16 16"
            width="18"
            height="18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9.5 3.5 5 8l4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <span />
      )}
      <span className="szc-mobile-head__title">
        <span className="szc-mobile-head__dot">
          <HeadIcon />
        </span>
        {headTitle}
      </span>
      {flowIndex >= 0 ? (
        <span className="szc-mobile-head__count">
          {t.stepOf(
            formatNumber(flowIndex + 1, state.locale),
            formatNumber(flowSteps.length, state.locale)
          )}
        </span>
      ) : (
        <span />
      )}
    </div>
  );

  return (
    <div
      className={`szc-root${className ? ` ${className}` : ''}`}
      dir={direction}
      style={themeVars(theme)}
    >
      {mobileHead}
      <Stepper />

      {bootstrapping ? (
        <CheckoutLoading label={t.loading} />
      ) : fatal ? (
        <ErrorBanner message={error.message} />
      ) : isResult ? (
        <div className="szc-result-wrap">
          <ResultStep continueShoppingUrl={continueShoppingUrl} />
        </div>
      ) : (
        <>
          <div className={`szc-layout${cartEmpty ? ' szc-layout--full' : ''}`}>
            <main className="szc-main">
              {error ? <ErrorBanner message={error.message} /> : null}

              {step === 'cart' ? <CartStep continueShoppingUrl={continueShoppingUrl} renderEmpty={renderEmptyCart} /> : null}
              {step === 'shipping' ? <ShippingStep /> : null}
              {step === 'payment' ? <PaymentStep /> : null}

              {actionsVisible && backButtonNode ? (
                <div className="szc-back-row">{backButtonNode}</div>
              ) : null}
            </main>

            {!cartEmpty ? (
              <div className="szc-side">
                <OrderSummary />
                {actionsVisible ? <div className="szc-side__cta">{nextButtonNode}</div> : null}
              </div>
            ) : null}
          </div>
        </>
      )}

      {actionsVisible ? (
        <div className="szc-footer-bar">
          <div className="szc-footer">
            <div className="szc-footer__total">
              <span className="szc-footer__total-label">{t.total}</span>
              <span className="szc-footer__total-value">{money(summary.total)}</span>
            </div>
            <div className="szc-footer__actions">{nextButtonNode}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
