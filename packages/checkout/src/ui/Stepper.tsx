'use client';

import { useCheckout } from '../react';
import type { CheckoutStep } from '../core';

const STEPS: CheckoutStep[] = ['cart', 'shipping', 'payment', 'result'];

const STEP_ICONS: Record<CheckoutStep, () => JSX.Element> = {
  cart: CartIcon,
  shipping: TruckIcon,
  payment: CardIcon,
  result: ClipboardIcon
};

export function Stepper() {
  const { state, t } = useCheckout();
  const labels: Record<CheckoutStep, string> = {
    cart: t.stepCart,
    shipping: t.stepShipping,
    payment: t.stepPayment,
    result: t.stepResult
  };

  const currentIndex = STEPS.indexOf(state.step);

  return (
    <ol className="szc-stepper">
      {STEPS.map((step, index) => {
        const status =
          index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'todo';
        const Icon = STEP_ICONS[step];
        return (
          <li key={step} className={`szc-step szc-step--${status}`}>
            <span className="szc-step__dot">
              {status === 'done' ? <CheckIcon /> : <Icon />}
            </span>
            <span className="szc-step__label">{labels[step]}</span>
            {index < STEPS.length - 1 ? <span className="szc-step__line" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CartIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M1.5 2h1.8l1.9 7.5h6.3l1.5-5H4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="13" r="1" fill="currentColor" />
      <circle cx="11" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

export function TruckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6.5h2.5l2 2.5V11h-4.5V6.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="4" cy="12.5" r="1.2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12.5" r="1.2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function CardIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="8.5" width="3" height="1.5" rx=".5" fill="currentColor" />
    </svg>
  );
}

export function ClipboardIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
