'use client';

import { useState, useCallback, useRef, useEffect, type CSSProperties } from 'react';
import { useCheckout } from '../../react';
import {
  toPersianDigits,
  normalizeIranianPhone,
  isValidIranianMobile,
  isDigitalServiceGroup
} from '../../core';
import { Field, FieldLabel, ProductPlaceholder } from '../primitives';
import type { ShippingGroup, ShippingRate, AddressFormValues } from '../../core';

type TouchedFields = Partial<Record<keyof AddressFormValues, true>>;
type FormErrors = Partial<Record<keyof AddressFormValues, string>>;

function validate(
  form: AddressFormValues,
  needsShipping: boolean,
  postalCodeMandatory: boolean,
  emailMandatory: boolean,
  t: { errorRequired: string; errorMobilePhone: string; errorEmail: string }
): FormErrors {
  const e: FormErrors = {};
  if (!form.firstName.trim()) e.firstName = t.errorRequired;
  if (!form.lastName.trim()) e.lastName = t.errorRequired;
  if (!form.mobilePhone.trim()) {
    e.mobilePhone = t.errorRequired;
  } else if (!isValidIranianMobile(form.mobilePhone)) {
    e.mobilePhone = t.errorMobilePhone;
  }
  if (emailMandatory && !form.email.trim()) {
    e.email = t.errorRequired;
  } else if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    e.email = t.errorEmail;
  }
  if (needsShipping) {
    if (!form.regionId) e.regionId = t.errorRequired;
    if (!form.cityId) e.cityId = t.errorRequired;
    if (postalCodeMandatory && !form.postalCode.trim()) e.postalCode = t.errorRequired;
    if (!form.address.trim()) e.address = t.errorRequired;
  }
  return e;
}

export function ShippingStep() {
  const { state, actions, t, digitalItems } = useCheckout();
  const { addressForm, regions, shippingGroups } = state;
  const [touched, setTouched] = useState<TouchedFields>({});
  const needsShipping = state.invoice?.needsShipping ?? true;
  const physicalShippingGroups = shippingGroups.filter((group) => !isDigitalServiceGroup(group));
  const physicalItemCount = Math.max(0, (state.invoice?.items.length ?? 0) - digitalItems.length);

  const touch = useCallback((key: keyof AddressFormValues) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const allErrors = validate(addressForm, needsShipping, state.postalCodeMandatory, state.emailMandatory, t as never);
  const errors: FormErrors = Object.fromEntries(
    Object.entries(allErrors).filter(([k]) => touched[k as keyof AddressFormValues])
  );

  const selectedRegion = regions.find((r) => r.id === addressForm.regionId);

  const handleBlurPhone = (key: 'mobilePhone' | 'phoneNumber') => {
    const raw = addressForm[key];
    if (raw) {
      const normalized = normalizeIranianPhone(raw);
      if (normalized !== raw) actions.setAddressField(key, normalized);
    }
    touch(key);
  };

  const busy = state.flags.savingAddress || state.flags.loadingShipping;

  return (
    <section className={`szc-step-panel${busy ? ' szc-step-panel--loading' : ''}`}>
      <div className="szc-shipping-form-card">
        <section className="szc-shipping-section" aria-labelledby="szc-contact-title">
          <ShippingSectionHeader id="szc-contact-title" title={t.contactInfo} icon="contact" />
          <div className="szc-form-grid">
            <Field
              id="szc-first-name"
              label={t.firstName}
              required
              optionalLabel={t.optional}
              value={addressForm.firstName}
              error={errors.firstName}
              onChange={(e) => actions.setAddressField('firstName', e.target.value)}
              onBlur={() => touch('firstName')}
            />
            <Field
              id="szc-last-name"
              label={t.lastName}
              required
              optionalLabel={t.optional}
              value={addressForm.lastName}
              error={errors.lastName}
              onChange={(e) => actions.setAddressField('lastName', e.target.value)}
              onBlur={() => touch('lastName')}
            />
            <Field
              id="szc-mobile"
              label={t.mobilePhone}
              required
              optionalLabel={t.optional}
              className="szc-input--ltr"
              dir="ltr"
              inputMode="tel"
              value={addressForm.mobilePhone}
              error={errors.mobilePhone}
              onChange={(e) => actions.setAddressField('mobilePhone', e.target.value)}
              onBlur={() => handleBlurPhone('mobilePhone')}
            />
            <Field
              id="szc-email"
              label={t.email}
              required={state.emailMandatory}
              optionalLabel={t.optional}
              className="szc-input--ltr"
              dir="ltr"
              inputMode="email"
              value={addressForm.email}
              error={errors.email}
              onChange={(e) => actions.setAddressField('email', e.target.value)}
              onBlur={() => touch('email')}
            />
          </div>
        </section>

        {needsShipping ? (
          <section className="szc-shipping-section" aria-labelledby="szc-address-title">
            <ShippingSectionHeader id="szc-address-title" title={t.reviewAddress} icon="address" />
            <div className="szc-form-grid">
              <EnhancedSelect
                id="szc-region"
                label={t.region}
                required
                optionalLabel={t.optional}
                value={addressForm.regionId ?? ''}
                error={errors.regionId}
                onChange={(v) => {
                  actions.setAddressField('regionId', v ? Number(v) : null);
                  touch('regionId');
                }}
                placeholder={t.selectRegion}
                options={regions.map((r) => ({ value: r.id, label: r.name }))}
              />
              <EnhancedSelect
                id="szc-city"
                label={t.city}
                required
                optionalLabel={t.optional}
                value={addressForm.cityId ?? ''}
                disabled={!selectedRegion}
                error={errors.cityId}
                onChange={(v) => {
                  actions.setAddressField('cityId', v ? Number(v) : null);
                  touch('cityId');
                }}
                placeholder={t.selectCity}
                options={selectedRegion?.cities.map((c) => ({ value: c.id, label: c.name })) ?? []}
              />
              <Field
                id="szc-postal"
                label={t.postalCode}
                required={state.postalCodeMandatory}
                optionalLabel={t.optional}
                className="szc-input--ltr"
                dir="ltr"
                inputMode="numeric"
                value={addressForm.postalCode}
                error={errors.postalCode}
                onChange={(e) => actions.setAddressField('postalCode', e.target.value)}
                onBlur={() => touch('postalCode')}
              />
              <Field
                id="szc-phone"
                label={t.phoneNumber}
                optionalLabel={t.optional}
                className="szc-input--ltr"
                dir="ltr"
                inputMode="tel"
                value={addressForm.phoneNumber}
                onChange={(e) => actions.setAddressField('phoneNumber', e.target.value)}
                onBlur={() => handleBlurPhone('phoneNumber')}
              />
            </div>
            <Field
              id="szc-address"
              label={t.addressLine}
              required
              optionalLabel={t.optional}
              value={addressForm.address}
              error={errors.address}
              onChange={(e) => actions.setAddressField('address', e.target.value)}
              onBlur={() => touch('address')}
            />
            <Field
              id="szc-description"
              label={t.description}
              optionalLabel={t.optional}
              value={addressForm.description}
              onChange={(e) => actions.setAddressField('description', e.target.value)}
              onBlur={() => touch('description')}
            />
          </section>
        ) : null}
      </div>

      {digitalItems.length > 0 ? (
        <section className="szc-digital-products" aria-labelledby="szc-digital-title">
          <header className="szc-digital-products__head">
            <span className="szc-digital-products__icon" aria-hidden="true"><DigitalIcon /></span>
            <div className="szc-digital-products__heading">
              <div className="szc-digital-products__title-row">
                <h2 id="szc-digital-title" className="szc-digital-products__title">
                  {t.digitalNoShipping}
                </h2>
                <span className="szc-digital-products__count">
                  {t.productCount(toPersianDigits(String(digitalItems.length)))}
                </span>
              </div>
              <p>{t.digitalNoShippingHint}</p>
            </div>
          </header>
          <div className="szc-digital-products__list">
            {digitalItems.map((item) => (
              <article key={item.id} className="szc-digital-product">
                <div className="szc-digital-product__media">
                  {item.image?.url ? (
                    <img src={item.image.url} alt={item.image.alt || item.name} />
                  ) : (
                    <ProductPlaceholder />
                  )}
                  <span className="szc-ship-product__quantity">
                    {toPersianDigits(String(item.quantity))}
                  </span>
                </div>
                <strong className="szc-digital-product__name">{item.name}</strong>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {physicalShippingGroups.length > 0 ? (
        <section className="szc-shipping-methods" aria-labelledby="szc-methods-title">
          <ShippingSectionHeader id="szc-methods-title" title={t.shippingMethods} icon="shipping" />
          <div className="szc-ship-groups">
            {physicalShippingGroups.map((group) => (
              <ShippingGroupCard key={group.key} group={group} />
            ))}
          </div>
        </section>
      ) : needsShipping && physicalItemCount > 0 ? (
        <div className="szc-shipping-pending" role="note">
          <span className="szc-shipping-pending__icon" aria-hidden="true"><TruckIcon /></span>
          <div className="szc-shipping-pending__copy">
            <strong>{t.shippingMethods}</strong>
            <span>{t.shippingMethodsHint}</span>
          </div>
        </div>
      ) : null}

    </section>
  );
}

function ShippingSectionHeader({
  id,
  title,
  icon
}: {
  id: string;
  title: string;
  icon: 'contact' | 'address' | 'shipping';
}) {
  return (
    <header className="szc-shipping-section__head">
      <span className="szc-shipping-section__icon" aria-hidden="true">
        {icon === 'contact' ? <ContactIcon /> : icon === 'address' ? <AddressIcon /> : <TruckIcon />}
      </span>
      <h2 id={id} className="szc-shipping-section__title">{title}</h2>
    </header>
  );
}

function ContactIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.5 19c.65-3.35 3-5.25 6.5-5.25s5.85 1.9 6.5 5.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M19 10c0 4.7-7 10-7 10S5 14.7 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function DigitalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16.5v1.75A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

interface EnhancedSelectProps {
  id: string;
  label: string;
  value: string | number;
  placeholder: string;
  options: { value: string | number; label: string }[];
  required?: boolean;
  optionalLabel?: string;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

function EnhancedSelect({ id, label, value, placeholder, options, required, optionalLabel, disabled, error, onChange }: EnhancedSelectProps) {
  return (
    <label className="szc-field" htmlFor={id}>
      <FieldLabel label={label} required={required} optionalLabel={optionalLabel} />
      <div className="szc-select-wrap">
        <select
          id={id}
          className={`szc-input szc-select-enhanced${error ? ' szc-input--error' : ''}`}
          value={value}
          required={required}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="szc-select-chevron" aria-hidden="true">
          <ChevronIcon />
        </span>
      </div>
      {error ? <span className="szc-field__error">{error}</span> : null}
    </label>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Click-and-drag horizontal scrolling for a container with a hidden scrollbar.
 * Also maps vertical mouse-wheel deltas to horizontal scroll so a plain mouse
 * (no horizontal wheel) can still pan the list.
 */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startLeft: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return; // nothing to pan
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // already horizontal
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
    el.classList.add('szc-dragging');
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !drag.current.down) return;
    el.scrollLeft = drag.current.startLeft - (e.clientX - drag.current.startX);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !drag.current.down) return;
    drag.current.down = false;
    el.classList.remove('szc-dragging');
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  return { ref, onPointerDown, onPointerMove, onPointerUp };
}

function ShippingGroupCard({ group }: { group: ShippingGroup }) {
  const { actions, price, state, t } = useCheckout();
  const busy = state.flags.selectingRate;
  const selectedRate = group.rates.find((rate) => rate.id === group.selectedRateId);
  const showRateSelector = group.items.length !== 1 || group.rates.length !== 1;
  const itemsScroll = useDragScroll();

  return (
    <div className="szc-ship-group">
      <header className="szc-ship-group__head">
        <span
          className="szc-ship-group__mark"
          style={shippingRateIconStyle(selectedRate?.color)}
          aria-hidden="true"
        >
          {selectedRate ? <ShippingRateIcon rate={selectedRate} /> : <TruckIcon />}
        </span>
        <div className="szc-ship-group__heading">
          <div className="szc-ship-group__title-row">
            <strong className="szc-ship-group__title">
              {group.title || selectedRate?.name || t.shippingMethod}
            </strong>
            <span className="szc-ship-group__count">
              {t.productCount(toPersianDigits(String(group.items.length)))}
            </span>
          </div>
          {selectedRate ? (
            <span className="szc-ship-group__hint">
              {selectedRate.description ? (
                <span className="szc-ship-group__desc">{selectedRate.description}</span>
              ) : null}
              <span className="szc-ship-group__rate-price">
                {selectedRate.price > 0 ? price(selectedRate.price) : t.free}
              </span>
            </span>
          ) : (
            <span className="szc-ship-group__hint">{t.shippingMethods}</span>
          )}
        </div>
      </header>

      <div
        className="szc-ship-group__items"
        ref={itemsScroll.ref}
        onPointerDown={itemsScroll.onPointerDown}
        onPointerMove={itemsScroll.onPointerMove}
        onPointerUp={itemsScroll.onPointerUp}
        onPointerCancel={itemsScroll.onPointerUp}
      >
        {group.items.map((item) => (
          <article key={item.id} className="szc-ship-product">
            <div className="szc-ship-product__media">
              {item.image?.url ? (
                <img src={item.image.url} alt={item.image.alt || item.name} />
              ) : (
                <ProductPlaceholder />
              )}
              <span className="szc-ship-product__quantity">
                {toPersianDigits(String(item.quantity))}
              </span>
            </div>
            <div className="szc-ship-product__copy">
              <strong className="szc-ship-product__name">{item.name}</strong>
              {item.attributes.length > 0 ? (
                <span className="szc-ship-product__attrs">
                  {item.attributes.map((attribute) => `${attribute.name}: ${attribute.value}`).join(' · ')}
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!showRateSelector && selectedRate?.description?.trim() ? (
        <div className="szc-ship-group__description">
          {selectedRate.description.trim()}
        </div>
      ) : null}

      {showRateSelector ? (
        <div className="szc-rate-list" role="radiogroup">
          {group.rates.map((rate: ShippingRate) => {
            const selected = group.selectedRateId === rate.id;
            const description = rate.description?.trim();
            return (
              <button
                key={rate.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={description ? `${rate.name} — ${description}` : rate.name}
                disabled={busy}
                className={`szc-rate${selected ? ' szc-rate--selected' : ''}`}
                onClick={() => actions.selectShippingRate(group.key, rate.id)}
              >
                <span
                  className="szc-rate__icon"
                  style={shippingRateIconStyle(rate.color)}
                  aria-hidden="true"
                >
                  <ShippingRateIcon rate={rate} />
                </span>
                <span className="szc-rate__copy">
                  <span className="szc-rate__name">{rate.name}</span>
                  {rate.price > 0 ? (
                    <span className="szc-rate__price">{price(rate.price)}</span>
                  ) : null}
                </span>
                <span className="szc-rate__radio" aria-hidden="true">
                  {selected ? <CheckIcon /> : null}
                </span>
                {description ? (
                  <span className="szc-rate__description">{description}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  width: 26,
  height: 26,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function TruckIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14 17V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1" />
      <path d="M9 18h5" />
      <path d="M18 18h1a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.21-.62l-2.7-3.39A1 1 0 0 0 16.3 9H14" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="16" cy="18" r="2" />
    </svg>
  );
}

function ShippingRateIcon({ rate }: { rate: ShippingRate }) {
  const iconKey = shippingRateIconKey(rate);

  switch (iconKey) {
    case 'post':
      return <PostIcon />;
    case 'free-delivery':
      return <FreeDeliveryIcon />;
    case 'courier':
      return <CourierIcon />;
    case 'delivery-man':
      return <DeliveryManIcon />;
    default:
      return rate.icon && isImageUrl(rate.icon) ? <img src={rate.icon} alt="" /> : <TruckIcon />;
  }
}

function shippingRateIconKey(rate: ShippingRate): string {
  const explicit = (rate.icon || rate.type || '').trim().toLowerCase().replace(/_/g, '-');
  if (explicit) return explicit;

  const name = rate.name.trim().toLowerCase();
  if (name.includes('پست') || name.includes('post')) return 'post';
  if (name.includes('رایگان') || name.includes('free')) return 'free-delivery';
  if (name.includes('پیک') || name.includes('courier')) return 'courier';
  if (name.includes('حضوری') || name.includes('delivery man')) return 'delivery-man';
  return '';
}

/**
 * The API returns `color` as a palette *token* (e.g. `mainColor`, `green`) — not
 * always a CSS color. Map the known tokens to concrete CSS colors so each rate
 * renders its own chip color instead of every icon falling back to the accent.
 */
const SHIPPING_COLOR_TOKENS: Record<string, string> = {
  green: '#16a34a',
  red: '#dc2626',
  blue: '#2563eb',
  orange: '#ea580c',
  yellow: '#eab308',
  purple: '#7c3aed',
  pink: '#db2777',
  teal: '#0d9488',
  cyan: '#0891b2',
  indigo: '#4f46e5',
  gray: '#6b7280',
  grey: '#6b7280',
  black: '#0f172a',
  brown: '#92400e'
};

function resolveShippingColor(raw: string): string | undefined {
  const token = raw.trim().toLowerCase();
  if (!token) return undefined;
  // The shop's "main color" is the theme accent → let the CSS fallback handle it.
  if (token === 'maincolor' || token === 'main') return undefined;
  if (token === 'transparent' || token === 'white') return '#ffffff';
  if (SHIPPING_COLOR_TOKENS[token]) return SHIPPING_COLOR_TOKENS[token];
  // Already a concrete CSS color value (hex / rgb()).
  if (parseColorChannels(token)) return token;
  return undefined;
}

function shippingRateIconStyle(color?: string): CSSProperties | undefined {
  if (!color) return undefined;

  const resolved = resolveShippingColor(color);

  // Unknown token / unparseable → let CSS use the theme's soft accent treatment.
  if (!resolved) return undefined;

  const rgb = parseColorChannels(resolved);
  if (!rgb) return undefined;

  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;

  // A white / near-white brand color (common for "post") would vanish against
  // the card. Render a neutral chip with a slate glyph instead.
  if (luminance > 0.9) {
    return {
      '--szc-rate-color': '#eef0f5',
      '--szc-rate-foreground': '#475569'
    } as CSSProperties;
  }

  const foreground = luminance > 0.62
    ? `rgb(${rgb.map((channel) => Math.round(channel * 0.58)).join(', ')})`
    : resolved;

  return {
    '--szc-rate-color': `color-mix(in srgb, ${resolved} 13%, var(--szc-card))`,
    '--szc-rate-foreground': foreground
  } as CSSProperties;
}

function parseColorChannels(value: string): [number, number, number] | null {
  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i)?.[1];
  if (hex?.length === 3) {
    return [0, 1, 2].map((index) => parseInt(hex[index] + hex[index], 16)) as [number, number, number];
  }
  if (hex && hex.length >= 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16)
    ];
  }
  const channels = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (channels) return [Number(channels[1]), Number(channels[2]), Number(channels[3])];
  return null;
}

function isImageUrl(value: string): boolean {
  return /^(https?:)?\/\//i.test(value) || value.startsWith('/') || value.startsWith('data:');
}

function PostIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.3 7 12 12l8.7-5" />
      <path d="M12 22V12" />
      <path d="m7.5 4.6 9 5.2" />
    </svg>
  );
}

function FreeDeliveryIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M21 11V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l1.5-.86" />
      <path d="M3.3 7 12 12l8.7-5" />
      <path d="M12 22V12" />
      <path d="m15.5 17 2 2 4-4" />
    </svg>
  );
}

function CourierIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  );
}

function DeliveryManIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="9" cy="4.5" r="2.5" />
      <path d="M5.5 21v-6.5a3.5 3.5 0 0 1 7 0V21" />
      <rect x="14" y="11.5" width="6.5" height="7" rx="1.2" />
      <path d="M14 15h6.5" />
      <path d="M17.2 11.5v3.5" />
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
