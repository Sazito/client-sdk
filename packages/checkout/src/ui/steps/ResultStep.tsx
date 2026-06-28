'use client';

import { useCheckout } from '../../react';
import { Button, Spinner } from '../primitives';

export function ResultStep({ continueShoppingUrl }: { continueShoppingUrl?: string }) {
  const { state, actions, t } = useCheckout();
  const result = state.result;
  const status = result?.status ?? 'pending';

  const titleMap = {
    success: t.paymentSuccess,
    failed: t.paymentFailed,
    pending: t.paymentPending,
    stock_violated: t.paymentFailed
  } as const;

  return (
    <section className={`szc-result szc-result--${status}`}>
      <div className="szc-result__icon">
        {status === 'success' ? (
          <CheckCircle />
        ) : status === 'pending' ? (
          <Spinner />
        ) : (
          <CrossCircle />
        )}
      </div>

      <h2 className="szc-result__title">{titleMap[status]}</h2>

      {status === 'pending' ? <p className="szc-muted">{t.paymentPendingHint}</p> : null}
      {result?.message ? <p className="szc-muted">{result.message}</p> : null}

      {result?.order ? (
        <p className="szc-result__order">
          {t.orderNumber}: <strong>{result.order.orderNumber}</strong>
        </p>
      ) : null}

      <div className="szc-result__actions">
        {status === 'failed' || status === 'stock_violated' ? (
          <Button onClick={() => actions.goToStep('payment')}>{t.tryAgain}</Button>
        ) : null}
        {continueShoppingUrl ? (
          <Button variant="outline" onClick={() => (window.location.href = continueShoppingUrl)}>
            {t.continueShopping}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function CheckCircle() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M15 24.5l6 6 12-13"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossCircle() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2.5" />
      <path d="M17 17l14 14M31 17L17 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
