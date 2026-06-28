'use client';

import { useCheckout } from '../react';
import { formatPercent, type SummaryLineKey } from '../core';

export function OrderSummary() {
  const { state, summary, money, price, t } = useCheckout();
  const percentSign = state.locale === 'fa' ? '٪' : '%';

  const lineLabels: Record<SummaryLineKey, string> = {
    subtotal: t.subtotal,
    discount: t.yourSavings,
    shipping: t.shipping,
    credit: t.credit,
    vat: t.vat
  };

  return (
    <aside className="szc-summary">
      <div className="szc-summary__total-head">
        <span className="szc-summary__total-label">{t.totalAmount}</span>
        <span className="szc-summary__total-value">{money(summary.total)}</span>
      </div>

      <dl className="szc-summary__lines">
        {summary.lines.map((line) => (
          <div
            key={line.key}
            className={`szc-summary__line${line.key === 'discount' ? ' szc-summary__line--discount' : ''}`}
          >
            <dt>
              {lineLabels[line.key]}
              {(line.percent ?? 0) > 0
                ? ` (${formatPercent(line.percent as number, state.locale)}${percentSign})`
                : ''}
            </dt>
            <dd className={line.negative ? 'szc-summary__line--neg' : undefined}>
              {line.free
                ? price(0)
                : `${line.negative ? '−' : ''}${money(line.amount)}`}
            </dd>
          </div>
        ))}
      </dl>

      <div className="szc-summary__grand">
        <span>{t.total}</span>
        <span>{money(summary.total)}</span>
      </div>
    </aside>
  );
}
