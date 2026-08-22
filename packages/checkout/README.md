# @sazito/checkout

Headless checkout engine + React/Next UI for the Sazito platform, powered by
`@sazito/client-sdk`. RTL-first (fa) with en support.

## Installation

```bash
pnpm add @sazito/client-sdk @sazito/checkout react@18 react-dom@18
```

## Architecture

```
@sazito/checkout/core   framework-agnostic engine (store, operateCart port, effects, selectors)
@sazito/checkout/react  CheckoutProvider + useCheckout() hook
@sazito/checkout/next   <SazitoCheckoutPage /> — the drop-in checkout component
@sazito/checkout/styles.css  self-contained, themeable, RTL/LTR styles
```

The React package **uses the SDK client you provide**. Create the Sazito SDK in
your app, pass it through `<SazitoProvider client={sazito}>` or the
`client` prop on `<CheckoutProvider>`, and checkout restores any seeded
credentials on that same SDK instance. This avoids duplicate SDK clients and
keeps cart/invoice/payment credentials in one place.

## Usage (Next.js)

```tsx
'use client';
import '@sazito/checkout/styles.css';
import { createSazitoClient } from '@sazito/client-sdk';
import { SazitoProvider, SazitoCheckoutPage } from '@sazito/checkout/next';

const sazito = createSazitoClient({ domain: 'shop.example.com' });

export default function Checkout() {
  return (
    <SazitoProvider client={sazito}>
      <SazitoCheckoutPage
        credentials={{ cart: { identifier: 'cart-identifier' } }}
        config={{
          locale: 'fa',
          continueShoppingUrl: '/',
          theme: {
            accent: '#4f46e5',
            accentForeground: '#ffffff',
            background: '#ffffff',
            foreground: '#0f172a',
            card: '#ffffff',
            border: '#e6e7eb',
            summaryBackground: '#f6f6fb',
            radius: 16
          }
        }}
      />
    </SazitoProvider>
  );
}
```

### Theme variables

`config.theme` (or the `theme` prop on `SazitoCheckout`) accepts:

| Property | CSS variable | Purpose |
| --- | --- | --- |
| `accent` | `--szc-accent` | Buttons and active states |
| `accentForeground` | `--szc-accent-foreground` | Text/icons on the accent |
| `accentSoft` | `--szc-accent-soft` | Selected and soft-accent surfaces |
| `background` | `--szc-bg` | Checkout background |
| `foreground` | `--szc-fg` | Primary text |
| `muted` | `--szc-muted` | Muted surfaces |
| `mutedForeground` | `--szc-muted-fg` | Secondary text |
| `border` | `--szc-border` | Borders and dividers |
| `card` | `--szc-card` | Card and input surfaces |
| `summaryBackground` | `--szc-summary-bg` | Summary sidebar |
| `danger` | `--szc-danger` | Errors and destructive states |
| `success` | `--szc-success` | Completed and success states |

`radius` and `fontFamily` remain available for shape and typography. Shipping-rate icon colors continue to come from the shipping API.

The component **inherits the host font** (`--szc-font: inherit`). The demo app
loads Vazirmatn on `<body>`; that's all it takes for a Persian/RTL checkout.

## Flow (v1 scope)

4 states — `cart → shipping → payment → result`:

- **Cart** — editable line items (quantity ±, remove).
- **Shipping** — guest contact + address form; per-package **shipping-method
  switching** for physical items; digital items skip shipping.
- **Payment** — payment-method selection + discount code; the **Finish purchase**
  (پایان خرید) CTA places the order directly (redirect / POST / pending-poll).
- **Result** — success / failed / pending, with order reference.

Deferred (post-v1): card-to-card upload, invoice dynamic forms, wallet credit
UI (engine keeps `toggleCredit`), multi-rate item reallocation, the legacy
`addDetails` user comment.

## Notes / deviations

- **Styling.** We originally planned Tailwind-authored components. Because the
  package exposes `styles.css` and must work in any React/Next app without
  forcing a Tailwind setup on consumers, the UI ships **self-contained CSS**
  (CSS-variable theme tokens, logical properties for RTL). The demo's Tailwind
  setup is untouched. Switching to Tailwind authoring later is possible without
  changing the engine.
- **Local dev.** `exports` point at TypeScript source; the example consumes it
  via Next `transpilePackages`. `rollup.config.js` exists for producing a
  publishable `dist/` (point `exports` at `dist` before publishing).
- The engine is pure and emits typed effects; the React provider installs a
  default browser executor (redirect / gateway POST / polling). SSR-safe.

## Scripts

```
pnpm test        # vitest (store, selectors, format, engine contract)
pnpm typecheck   # tsc --noEmit
pnpm build       # rollup → dist (for publishing)
```
