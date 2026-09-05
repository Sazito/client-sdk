'use client';

import { useCheckout } from '../../react';
import { formatNumber, toPersianDigits, type OrderInvoiceItem } from '../../core';
import { Button, ProductPlaceholder, Spinner } from '../primitives';

export function ResultStep({ continueShoppingUrl }: { continueShoppingUrl?: string }) {
  const { state, actions, money, price, t } = useCheckout();
  const result = state.result;
  const status = result?.status ?? 'pending';
  const order = result?.order;
  const invoice = order?.invoice;
  const showDetails = Boolean(order && (status === 'success' || status === 'pending'));

  const titleMap = {
    success: t.paymentSuccess,
    failed: t.paymentFailed,
    pending: t.paymentPending,
    stock_violated: t.paymentFailed
  } as const;

  return (
    <section className={`szc-result szc-result--${status}`}>
      <div className="szc-result__hero" role="status" aria-live="polite">
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
        {status === 'success' && order ? (
          <p className="szc-result__hint">{t.orderConfirmedHint}</p>
        ) : null}

        {order ? (
          <dl className="szc-result__reference">
            <div className="szc-result__reference-primary">
              <dt>{t.orderNumber}</dt>
              <dd>{formatPublicId(order.orderNumber, state.locale)}</dd>
            </div>
            <div>
              <dt>{t.orderId}</dt>
              <dd>{formatPublicId(order.id, state.locale)}</dd>
            </div>
          </dl>
        ) : null}

        <div className="szc-result__actions">
          {status === 'failed' || status === 'stock_violated' ? (
            <Button onClick={() => actions.goToStep('payment')}>{t.tryAgain}</Button>
          ) : null}
          {continueShoppingUrl ? (
            <Button variant={status === 'success' ? 'primary' : 'outline'} asChild>
              <a href={continueShoppingUrl}>{t.continueShopping}</a>
            </Button>
          ) : null}
        </div>
      </div>

      {showDetails && order && invoice ? (
        <div className="szc-result__details">
          <h3 className="szc-result__details-title">{t.orderDetails}</h3>

          {invoice.shippingItems.length > 0 ? (
            <section className="szc-result__section" aria-labelledby="szc-result-shipping-title">
              <h4 id="szc-result-shipping-title" className="szc-result__section-title">
                {t.shippingMethods}
              </h4>
              <div className="szc-result-shipping-list">
                {invoice.shippingItems.map((shipping) => (
                  <article className="szc-result-group" key={String(shipping.id)}>
                    <header className="szc-result-group__head">
                      <span className="szc-result-group__mark" aria-hidden="true">
                        {shipping.rate.icon ? <img src={shipping.rate.icon} alt="" /> : <DeliveryIcon />}
                      </span>
                      <span className="szc-result-group__title">{shipping.rate.name}</span>
                      <span className="szc-result-group__price">{price(shipping.rate.price)}</span>
                    </header>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {invoice.invoiceItems.length > 0 ? (
            <section className="szc-result-group" aria-labelledby="szc-result-items-title">
              <header className="szc-result-group__head">
                <span className="szc-result-group__mark" aria-hidden="true">
                  <OrderItemsIcon />
                </span>
                <h4 id="szc-result-items-title" className="szc-result-group__title">
                  {t.orderItems}
                </h4>
              </header>
              <div className="szc-result-items__head" aria-hidden="true">
                <span>{t.product}</span>
                <span>{t.quantity}</span>
                <span>{t.lineTotal}</span>
              </div>
              <ul className="szc-result-items">
                {invoice.invoiceItems.map((item, index) => (
                  <li className="szc-result-item" key={`${String(item.productVariantId)}-${index}`}>
                    <span className="szc-result-item__product">
                      {item.image?.url ? (
                        <img className="szc-result-item__thumb" src={item.image.url} alt="" />
                      ) : (
                        <ProductPlaceholder className="szc-result-item__thumb" />
                      )}
                      <span>
                        <strong>{item.name}</strong>
                        {item.attributes.length ? (
                          <small>{item.attributes.map(formatAttribute).join(' · ')}</small>
                        ) : null}
                      </span>
                    </span>
                    <span className="szc-result-item__quantity">
                      <span className="szc-result-item__mobile-label">{t.quantity}</span>
                      {formatNumber(item.quantity, state.locale)}
                    </span>
                    <span className="szc-result-item__total">
                      <span className="szc-result-item__mobile-label">{t.lineTotal}</span>
                      {money(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <dl className="szc-result-summary">
            <SummaryRow label={t.subtotal} value={money(invoice.netTotal)} />
            {invoice.shippingTotal != null ? (
              <SummaryRow label={t.shipping} value={money(invoice.shippingTotal)} />
            ) : null}
            {invoice.discountTotal != null && invoice.discountTotal > 0 ? (
              <SummaryRow label={t.discount} value={`−${money(invoice.discountTotal)}`} />
            ) : null}
            {invoice.creditTotal != null && invoice.creditTotal > 0 ? (
              <SummaryRow label={t.credit} value={`−${money(invoice.creditTotal)}`} />
            ) : null}
            {invoice.vat != null && invoice.vat > 0 ? (
              <SummaryRow label={t.vat} value={money(invoice.vat)} />
            ) : null}
            {invoice.customerProfit != null && invoice.customerProfit > 0 ? (
              <SummaryRow label={t.yourSavings} value={money(invoice.customerProfit)} savings />
            ) : null}
            <SummaryRow label={t.total} value={money(invoice.finalTotal)} total />
          </dl>
        </div>
      ) : null}
    </section>
  );
}

function formatPublicId(value: number | string, locale: 'fa' | 'en'): string {
  const text = String(value);
  return locale === 'fa' ? toPersianDigits(text) : text;
}

function formatAttribute(attribute: OrderInvoiceItem['attributes'][number]): string {
  const value = typeof attribute.value === 'object' ? attribute.value.value : attribute.value;
  return `${attribute.name}: ${value}`;
}

function SummaryRow({
  label,
  value,
  savings = false,
  total = false
}: {
  label: string;
  value: string;
  savings?: boolean;
  total?: boolean;
}) {
  return (
    <div className={`${total ? 'szc-result-summary__total' : ''} ${savings ? 'szc-result-summary__savings' : ''}`.trim()}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
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

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M3 6.5h11v10H3zM14 10h3.5l3 3v3.5H14z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.75" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="18" r="1.75" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function OrderItemsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M5 7.5h14v11H5zM8 7.5V5h8v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.5 12h7M8.5 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
