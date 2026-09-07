# Pay-on-delivery return regression

The demo uses the fixed local checkout tarball. Its checkout components and API
routes are unchanged. Start it with mock responses so these checks do not create
a real order:

```sh
SAZITO_USE_MOCKS=true NEXT_PUBLIC_SAZITO_USE_MOCKS=true \
  pnpm --dir /Users/rezamahmoudi/Desktop/sazito-sdk-demo dev --port 3107
```

Check the empty pay-on-delivery callback handoff:

```sh
curl --silent --show-error --include --max-time 20 \
  --request POST \
  'http://localhost:3107/checkout/paymentinplaceresult/payment/304/identifier/test-payment' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data ''
```

Expected: HTTP 303, with a Location containing `sazito_payment_return=callback`.
This endpoint delegates finalization to the browser; curl alone cannot test the
React lifecycle.

Open this URL in a browser:

[Mock payment return](http://localhost:3107/checkout?sazito_payment_return=callback&sazito_payment_id=304&sazito_payment_identifier=test-payment)

Expected: the callback query is removed, the success result remains visible,
and opening/closing the cart does not reset checkout. Browser debug logs should
show exactly one `process_payment_step` request. A missing mock for `pinch/order`
can log a 501; that ancillary request must not change the confirmed success.

Run the automated lifecycle regressions (success and failure, both integrations,
both callback modes, React Strict Mode, and host rerenders):

```sh
pnpm --dir /Users/rezamahmoudi/sazito-sdk/packages/checkout exec vitest run test/provider.test.ts
```

The production storefront has not been deployed. The demo dependency currently
points at a local tarball; replace that reference with the new registry version
when this checkout fix is released.
