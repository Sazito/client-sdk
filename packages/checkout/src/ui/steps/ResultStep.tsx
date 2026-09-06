'use client';

import { useCheckout } from '../../react';
import {
  formatNumber,
  type CheckoutInvoiceItem,
  type CheckoutShippingItem
} from '../../core';
import { Button, ProductPlaceholder, Spinner } from '../primitives';

interface ResultShipmentGroup {
  shipping: CheckoutShippingItem;
  items: CheckoutInvoiceItem[];
}

export function groupResultItemsByShipping(
  invoiceItems: CheckoutInvoiceItem[],
  shippingItems: CheckoutShippingItem[]
): { shipmentGroups: ResultShipmentGroup[]; unassignedItems: CheckoutInvoiceItem[] } {
  const itemById = new Map<string, CheckoutInvoiceItem>();
  const assignedItems = new Set<CheckoutInvoiceItem>();

  invoiceItems.forEach((item) => {
    if (item.id !== undefined) itemById.set(String(item.id), item);
  });

  const shipmentGroups = shippingItems.map((shipping) => {
    const items = shipping.invoiceItemIds.flatMap((itemId) => {
      const item = itemById.get(String(itemId));
      if (!item || assignedItems.has(item)) return [];
      assignedItems.add(item);
      return [item];
    });

    return { shipping, items };
  });

  // Older payment responses did not expose invoice-line IDs. A single shipping
  // method is still unambiguous, so keep those orders grouped correctly.
  if (shipmentGroups.length === 1 && shipmentGroups[0].items.length === 0) {
    shipmentGroups[0].items = [...invoiceItems];
    invoiceItems.forEach((item) => assignedItems.add(item));
  }

  return {
    shipmentGroups: shipmentGroups.filter((group) => group.items.length > 0),
    unassignedItems: invoiceItems.filter((item) => !assignedItems.has(item))
  };
}

export function ResultStep({ continueShoppingUrl }: { continueShoppingUrl?: string }) {
  const { state, actions, money, t } = useCheckout();
  const result = state.result;
  const status = result?.status ?? 'pending';
  const order = result?.order;
  const invoice = order?.invoice;
  const showDetails = Boolean(order && (status === 'success' || status === 'pending'));
  const showSummary = invoice?.netTotal != null || invoice?.finalTotal != null;
  const isFailure = status === 'failed' || status === 'stock_violated';
  const orderDetailsUrl = order
    ? buildOrderDetailsUrl(order.id, order.orderIdentifier, continueShoppingUrl)
    : null;
  const groupedItems = invoice
    ? groupResultItemsByShipping(invoice.invoiceItems, invoice.shippingItems)
    : { shipmentGroups: [], unassignedItems: [] };

  const renderItems = (items: CheckoutInvoiceItem[]) => (
    <ul className="szc-result-items">
      {items.map((item, index) => (
        <li className="szc-result-item" key={`${String(item.id ?? item.productVariantId)}-${index}`}>
          <span className="szc-result-item__product">
            {item.image?.url ? (
              <img className="szc-result-item__thumb" src={item.image.url} alt="" />
            ) : (
              <ProductPlaceholder className="szc-result-item__thumb" />
            )}
            <span>
              <strong>{item.name}</strong>
              {item.variantAttributes.length ? (
                <small>{item.variantAttributes.map(formatAttribute).join(' · ')}</small>
              ) : null}
            </span>
          </span>
          <span className="szc-result-item__quantity">
            <span className="szc-result-item__mobile-label">{t.quantity}</span>
            <strong>{formatNumber(item.noOfItems, state.locale)}</strong>
          </span>
          <span className="szc-result-item__total">
            <span className="szc-result-item__mobile-label">{t.lineTotal}</span>
            <strong>{money(item.totalItemsPrice)}</strong>
          </span>
        </li>
      ))}
    </ul>
  );

  const titleMap = {
    success: t.paymentSuccess,
    failed: t.paymentFailed,
    pending: t.paymentPending,
    stock_violated: t.paymentFailed
  } as const;

  return (
    <section
      className={`szc-result szc-result--${status}${showDetails ? '' : ' szc-result--compact'}`}
    >
      <div
        className="szc-result__hero"
        role={isFailure ? 'alert' : 'status'}
        aria-live={isFailure ? 'assertive' : 'polite'}
      >
        <div className="szc-result__icon">
          <span className="szc-result__icon-mark">
            {status === 'success' ? (
              <CheckCircle />
            ) : status === 'pending' ? (
              <Spinner />
            ) : (
              <CrossCircle />
            )}
          </span>
        </div>

        <div className="szc-result__copy">
          <h2 className="szc-result__title">{titleMap[status]}</h2>

          {status === 'pending' ? <p className="szc-result__hint">{t.paymentPendingHint}</p> : null}
          {!isFailure && result?.message ? (
            <p className="szc-result__message" dir="auto">{result.message}</p>
          ) : null}
          {status === 'success' && order ? (
            <p className="szc-result__hint">{t.orderConfirmedHint}</p>
          ) : null}
        </div>

        {order ? (
          <dl className="szc-result__reference">
            <div className="szc-result__reference-primary">
              <dt>{t.orderNumber}</dt>
              <dd dir="ltr">{String(order.orderNumber)}</dd>
            </div>
          </dl>
        ) : null}

        <div className="szc-result__actions">
          {status === 'failed' || status === 'stock_violated' ? (
            <Button
              onClick={() => void actions.retryPayment()}
              loading={state.flags.loadingPayments}
            >
              {t.tryAgain}
            </Button>
          ) : null}
          {orderDetailsUrl ? (
            <Button asChild>
              <a href={orderDetailsUrl}>{t.orderDetails}</a>
            </Button>
          ) : null}
          {continueShoppingUrl ? (
            <Button variant="outline" asChild>
              <a href={continueShoppingUrl}>{t.backToShop}</a>
            </Button>
          ) : null}
        </div>
      </div>

      {showDetails && order && invoice ? (
        <div className="szc-result__details">
          {groupedItems.shipmentGroups.map(({ shipping, items }, index) => {
            const description = shipping.rate.description?.trim();

            return (
              <section
                className="szc-result__details-card szc-result-shipment"
                aria-label={`${t.shippingMethod}: ${shipping.rate.name}`}
                key={`${String(shipping.id)}-${index}`}
              >
                <header className="szc-result-shipment__head">
                  <span className="szc-result-shipment__mark" aria-hidden="true">
                    {isImageUrl(shipping.rate.icon) ? (
                      <img src={shipping.rate.icon} alt="" />
                    ) : (
                      <DeliveryIcon />
                    )}
                  </span>
                  <span className="szc-result-shipment__name">
                    <small className="szc-result-shipment__eyebrow">{t.shippingMethod}</small>
                    <strong>{shipping.rate.name}</strong>
                    {description ? (
                      <span className="szc-result-shipment__description">{description}</span>
                    ) : null}
                  </span>
                  {shipping.rate.type !== 'free' ? (
                    <span className="szc-result-shipment__price">{money(shipping.rate.price)}</span>
                  ) : null}
                </header>
                {renderItems(items)}
              </section>
            );
          })}

          {groupedItems.unassignedItems.length > 0 ? (
            <section
              className="szc-result__details-card szc-result-unassigned-items"
              aria-label={t.orderItems}
            >
              {renderItems(groupedItems.unassignedItems)}
            </section>
          ) : null}

          {showSummary ? (
            <dl className="szc-result-summary">
              {invoice.netTotal != null ? (
                <SummaryRow label={t.subtotal} value={money(invoice.netTotal)} />
              ) : null}
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
              {invoice.finalTotal != null ? (
                <SummaryRow label={t.total} value={money(invoice.finalTotal)} total />
              ) : null}
            </dl>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function buildOrderDetailsUrl(
  orderId: number | string,
  orderIdentifier: string,
  continueShoppingUrl?: string
): string {
  const path = `/orderinfo/${encodeURIComponent(String(orderId))}/${encodeURIComponent(orderIdentifier)}`;
  if (!continueShoppingUrl) return path;

  try {
    const storefrontUrl = new URL(continueShoppingUrl);
    return new URL(path, storefrontUrl.origin).toString();
  } catch {
    return path;
  }
}

function formatAttribute(attribute: CheckoutInvoiceItem['variantAttributes'][number]): string {
  return `${attribute.name}: ${attribute.value}`;
}

function isImageUrl(value: string | undefined): value is string {
  return Boolean(value && (/^https?:\/\//i.test(value) || value.startsWith('/') || value.startsWith('data:image/')));
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
