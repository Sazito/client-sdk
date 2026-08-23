'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { useCheckout } from '../../react';
import { sortCartItemsNewestFirst, toPersianDigits } from '../../core';
import { Button, ProductPlaceholder } from '../primitives';
import { CartIcon } from '../Stepper';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const QUANTITY_DEBOUNCE_MS = 500;

function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

const HEX_COLOR_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function attrValueToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    const v = (value as Record<string, unknown>).value;
    return v == null ? '' : String(v);
  }
  return String(value);
}

function toHexColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return HEX_COLOR_RE.test(trimmed) ? (trimmed.startsWith('#') ? trimmed : `#${trimmed}`) : null;
}

// Hex can arrive as the raw value, or nested in `extra`/`value` of an object attribute.
function attrHexColor(value: unknown): string | null {
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return toHexColor(obj.extra) ?? toHexColor(obj.value);
  }
  return toHexColor(value);
}

export function CartStep({
  continueShoppingUrl,
  renderEmpty,
}: {
  continueShoppingUrl?: string;
  renderEmpty?: (props: { continueShoppingUrl?: string }) => React.ReactNode;
}) {
  const { state, actions, money, t } = useCheckout();
  const cart = state.cart;
  const busy = state.flags.updatingCart;
  const newestCartItems = useMemo(
    () => sortCartItemsNewestFirst(cart?.items ?? []),
    [cart?.items]
  );
  const invoiceItemsByVariant = new Map(
    (state.invoice?.items ?? []).map((item) => [item.productVariantId, item])
  );

  if (!cart || cart.items.length === 0) {
    if (renderEmpty) {
      return renderEmpty({ continueShoppingUrl });
    }

    return (
      <section className="szc-empty" role="status" aria-live="polite">
        <div className="szc-empty__card">
          <span className="szc-empty__badge">
            <CartIcon />
          </span>
          <div className="szc-empty__copy">
            <h3 className="szc-empty__title">{t.cartEmpty}</h3>
            <p className="szc-empty__hint">{t.cartEmptyHint}</p>
          </div>
          {continueShoppingUrl ? (
            <Button
              className="szc-empty__cta"
              variant="primary"
              onClick={() => { window.location.href = continueShoppingUrl; }}
            >
              {t.continueShopping}
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="szc-step-panel">
      <ul className="szc-cart-list">
        {newestCartItems.map((item) => {
          const max = item.product.maxOrderQuantity;
          const min = item.product.minOrderQuantity ?? 1;
          const invoiceItem = invoiceItemsByVariant.get(item.product.variantId);
          const rawLineTotal = (invoiceItem?.rawPrice ?? item.unitPrice) * item.quantity;
          const itemDiscount = invoiceItem?.customerProfit
            || Math.max(0, rawLineTotal - item.lineTotal);
          return (
            <li key={item.id} className="szc-cart-row">
              {item.product.image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="szc-cart-row__thumb" src={item.product.image.url} alt="" />
              ) : (
                <ProductPlaceholder />
              )}

              <div className="szc-cart-row__main">
                <span className="szc-cart-row__name">{item.product.name}</span>
                {item.product.attributes?.length ? (
                  <span className="szc-cart-row__attrs">
                    {item.product.attributes.map((a, i) => {
                      const value = attrValueToString(a.value);
                      const hex = attrHexColor(a.value);
                      return (
                        <span key={`${a.name}-${i}`} className="szc-cart-row__attr">
                          {i > 0 ? <span className="szc-cart-row__attr-sep">·</span> : null}
                          <span>{a.name}:</span>
                          {hex ? (
                            <span
                              className="szc-cart-row__swatch"
                              style={{ backgroundColor: hex }}
                              title={hex}
                              aria-hidden="true"
                            />
                          ) : null}
                          {value ? <span>{value}</span> : null}
                        </span>
                      );
                    })}
                  </span>
                ) : null}
                <span className="szc-cart-row__price">{money(item.unitPrice)}</span>
              </div>

              <div className="szc-cart-row__side">
                <QuantityControl
                  value={item.quantity}
                  min={min}
                  max={max}
                  label={t.quantity}
                  onChange={(quantity) =>
                    actions.updateItemQuantity(item.id, item.product.variantId, quantity)
                  }
                />
                {itemDiscount > 0 ? (
                  <span className="szc-cart-row__discount">
                    {t.itemDiscount(money(itemDiscount))}
                  </span>
                ) : null}
                <span className="szc-cart-row__line-total">{money(item.lineTotal)}</span>
                <button
                  type="button"
                  className="szc-cart-row__remove"
                  aria-label={t.remove}
                  disabled={busy}
                  onClick={() => actions.removeItem(item.id, item.product.variantId)}
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface QuantityControlProps {
  value: number;
  min: number;
  max?: number;
  label: string;
  onChange: (value: number) => Promise<void>;
}

function QuantityControl({ value, min, max, label, onChange }: QuantityControlProps) {
  const [draft, setDraft] = useState(() => toPersianDigits(String(value)));
  const [pending, setPending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const draftRef = useRef(draft);
  const pendingValueRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const serverValueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  serverValueRef.current = value;
  onChangeRef.current = onChange;

  const updateDraft = (next: string) => {
    draftRef.current = next;
    setDraft(next);
  };

  useEffect(() => {
    if (!pending || pendingValueRef.current === value) {
      updateDraft(toPersianDigits(String(value)));
    }
  }, [value, pending]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const normalize = (next: number): number =>
    Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, Math.trunc(next)));

  async function flushPendingUpdate() {
    if (inFlightRef.current) return;

    const target = pendingValueRef.current;
    if (target == null) return;

    if (target === serverValueRef.current) {
      pendingValueRef.current = null;
      setPending(false);
      return;
    }

    inFlightRef.current = true;
    setUpdating(true);
    try {
      await onChangeRef.current(target);
    } finally {
      inFlightRef.current = false;
      setUpdating(false);

      if (pendingValueRef.current === target) {
        pendingValueRef.current = null;
        setPending(false);
      } else if (timerRef.current == null) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          void flushPendingUpdate();
        }, QUANTITY_DEBOUNCE_MS);
      }
    }
  }

  const scheduleUpdate = (rawValue: string | number) => {
    const parsed = typeof rawValue === 'number' ? rawValue : Number(toLatinDigits(rawValue));
    const next = normalize(Number.isFinite(parsed) ? parsed : value);

    updateDraft(toPersianDigits(String(next)));
    if (next === serverValueRef.current && !pending && !inFlightRef.current) return;

    pendingValueRef.current = next;
    setPending(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void flushPendingUpdate();
    }, QUANTITY_DEBOUNCE_MS);
  };

  const step = (amount: number) => {
    const parsedDraft = Number(toLatinDigits(draftRef.current));
    const base = Number.isFinite(parsedDraft) ? parsedDraft : value;
    scheduleUpdate(base + amount);
  };

  const parsedDraft = Number(toLatinDigits(draft));
  const displayedValue = Number.isFinite(parsedDraft) ? normalize(parsedDraft) : value;

  return (
    <div
      className={`szc-qty${pending ? ' szc-qty--pending' : ''}`}
      aria-busy={updating}
    >
      <button
        type="button"
        className="szc-qty__btn"
        aria-label={`${label} −`}
        disabled={updating || displayedValue <= min}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => step(-1)}
      >
        <MinusIcon />
      </button>
      <input
        className="szc-qty__input"
        type="text"
        inputMode="numeric"
        pattern="[۰-۹٠-٩0-9]*"
        role="spinbutton"
        value={draft}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={displayedValue}
        disabled={updating}
        onChange={(event) => {
          const digits = toLatinDigits(event.target.value).replace(/\D/g, '');
          if (!digits) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = null;
            updateDraft('');
            return;
          }
          scheduleUpdate(Number(digits));
        }}
        onBlur={() => scheduleUpdate(draftRef.current)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = null;
            pendingValueRef.current = null;
            setPending(false);
            updateDraft(toPersianDigits(String(value)));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            step(1);
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            step(-1);
          }
        }}
      />
      <button
        type="button"
        className="szc-qty__btn"
        aria-label={`${label} +`}
        disabled={updating || (max != null && displayedValue >= max)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => step(1)}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M3.5 8h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
