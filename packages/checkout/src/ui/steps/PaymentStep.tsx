'use client';

import { useCheckout } from '../../react';
import { paymentMethodInfo, formatPercent, type PaymentMethodKind } from '../../core';
import { Button, SectionTitle, Spinner } from '../primitives';

export function PaymentStep() {
  const { state, actions, t } = useCheckout();
  const {
    paymentMethods,
    selectedPaymentMethodId,
    appliedDiscountCode,
    discountCode,
    discountError,
    flags,
    locale,
    invoice
  } = state;

  // Effective coupon percentage off the subtotal, for the applied badge.
  const subtotal = invoice?.itemsTotalRawPrice || invoice?.netTotal || 0;
  const couponAmount = (invoice?.couponTotal || 0) + (invoice?.discountTotal || 0);
  const couponPercent =
    subtotal > 0 && couponAmount > 0 ? (couponAmount / subtotal) * 100 : 0;
  const percentSign = locale === 'fa' ? '٪' : '%';

  return (
    <section className="szc-step-panel">
      <SectionTitle>{t.paymentMethod}</SectionTitle>

      {flags.loadingPayments ? (
        <p className="szc-inline-loading">
          <Spinner /> {t.loading}
        </p>
      ) : (
        <div className="szc-pay-list" role="radiogroup" aria-label={t.paymentMethod}>
          {paymentMethods.map((method) => {
            const selected = selectedPaymentMethodId === method.id;
            const info = paymentMethodInfo(method.code, locale);
            // Prefer backend-provided title/description; fall back to derived labels.
            const backendTitle = locale === 'fa' ? method.titleFa : method.title;
            const title = backendTitle?.trim() || info.title;
            const description = method.description?.trim() || info.description;
            return (
              <button
                key={method.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`szc-pay${selected ? ' szc-pay--selected' : ''}`}
                onClick={() => actions.selectPaymentMethod(method.id)}
              >
                <span className="szc-pay__icon" aria-hidden="true">
                  <PaymentIcon kind={info.kind} />
                </span>
                <span className="szc-pay__body">
                  <span className="szc-pay__name">{title}</span>
                  <span className="szc-pay__desc">{description}</span>
                </span>
                <span className="szc-pay__radio" aria-hidden="true">
                  {selected ? <CheckIcon /> : null}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <SectionTitle>{t.discountCode}</SectionTitle>
      {appliedDiscountCode ? (
        <div className="szc-discount szc-discount--applied">
          <span className="szc-discount__badge">{t.applied}</span>
          <code className="szc-discount__code">{appliedDiscountCode}</code>
          {couponPercent > 0 ? (
            <span className="szc-discount__percent">
              {formatPercent(couponPercent, locale)}
              {percentSign}
            </span>
          ) : null}
          <Button variant="ghost" onClick={() => actions.removeDiscount()} loading={flags.applyingDiscount}>
            {t.remove}
          </Button>
        </div>
      ) : (
        <div className="szc-discount-field">
          <div className="szc-discount">
            <input
              className={`szc-input${discountError ? ' szc-input--error' : ''}`}
              placeholder={t.discountPlaceholder}
              value={discountCode}
              aria-invalid={discountError ? true : undefined}
              onChange={(e) => actions.setDiscountCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') actions.applyDiscount();
              }}
            />
            <Button
              variant="outline"
              onClick={() => actions.applyDiscount()}
              loading={flags.applyingDiscount}
              disabled={!discountCode.trim()}
            >
              {t.apply}
            </Button>
          </div>
          {discountError ? (
            <p className="szc-discount__error" role="alert">
              <AlertIcon />
              {discountError}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

const ICON_PROPS = {
  viewBox: '0 0 20 20',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
};

function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.8v3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.85" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
      <path d="m3.2 8.2 3 3 6.6-6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaymentIcon({ kind }: { kind: PaymentMethodKind }) {
  switch (kind) {
    case 'card':
      // two cards / transfer
      return (
        <svg {...ICON_PROPS}>
          <rect x="2" y="5" width="13" height="9" rx="2" />
          <path d="M2 8h13M5.5 11.5h3" />
          <path d="M15.5 6.5h2.5v9h-9v-1.5" />
        </svg>
      );
    case 'cod':
      // package / hand
      return (
        <svg {...ICON_PROPS}>
          <path d="M10 2.5 17 6v8l-7 3.5L3 14V6z" />
          <path d="M3 6l7 3.5L17 6M10 9.5v8" />
        </svg>
      );
    case 'bnpl':
      // calendar / installments
      return (
        <svg {...ICON_PROPS}>
          <rect x="3" y="4" width="14" height="13" rx="2" />
          <path d="M3 8h14M7 2.5v3M13 2.5v3M6.5 12h3" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...ICON_PROPS}>
          <rect x="2.5" y="5" width="15" height="11" rx="2.5" />
          <path d="M2.5 9h15" />
          <circle cx="14" cy="12.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'free':
      // tag
      return (
        <svg {...ICON_PROPS}>
          <path d="M10.5 2.5H16v5.5l-7.5 7.5a1.8 1.8 0 0 1-2.5 0L3 13a1.8 1.8 0 0 1 0-2.5z" />
          <circle cx="12.8" cy="5.7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'gateway':
    default:
      // single card / bank
      return (
        <svg {...ICON_PROPS}>
          <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
          <path d="M2.5 8.5h15M5.5 12.5h4" />
        </svg>
      );
  }
}
