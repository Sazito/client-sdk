/**
 * The checkout engine: a framework-agnostic port of the legacy `operateCart`
 * state machine on top of @sazito/client-sdk. Owns the store, serializes
 * mutations, and emits typed side-effects for the host to perform.
 */
import type { CheckoutOrder, PaymentAction, PaymentStepInput, ShippingAddress, ShippingAddressInput, Invoice } from '@sazito/client-sdk';
import { createStore, type Store } from './store';
import { createSdkBinding, type CheckoutSdkBinding } from './sdk-binding';
import { fromSdkError, makeError } from './errors';
import { makeEvent } from './events';
import { noopEffectExecutor } from './effects';
import {
  addressFormFromInvoice,
  addressFormFromSavedAddress,
  buildShippingAssignments,
  classifyAppliedDiscount,
  deriveShippingGroups,
  emptyAddressForm,
  isAddressComplete,
  isAddressDirty,
  isShippingComplete,
  reconcileAddressWithRegions,
  savedAddressCityName
} from './selectors';
import type {
  AddressFormValues,
  CheckoutActions,
  CheckoutConfig,
  CheckoutEffect,
  CheckoutEffectExecutor,
  CheckoutEngineOptions,
  CheckoutError,
  CheckoutFlags,
  CheckoutRegion,
  CheckoutState,
  CheckoutStep,
  ShippingGroup
} from './types';

export interface CheckoutEngine {
  getState(): CheckoutState;
  subscribe(listener: () => void): () => void;
  actions: CheckoutActions;
  setEffectExecutor(executor: CheckoutEffectExecutor): void;
  destroy(): void;
}

const STEP_ORDER: CheckoutStep[] = ['cart', 'shipping', 'payment', 'result'];
const ADDRESS_AUTOSUBMIT_DEBOUNCE_MS = 350;

function initialFlags(): CheckoutFlags {
  return {
    bootstrapping: false,
    updatingCart: false,
    savingAddress: false,
    loadingShipping: false,
    selectingRate: false,
    applyingDiscount: false,
    loadingPayments: false,
    placingOrder: false
  };
}

function initialState(config: CheckoutConfig): CheckoutState {
  const locale = config.locale ?? 'fa';
  return {
    step: 'cart',
    status: 'idle',
    locale,
    direction: config.direction ?? (locale === 'fa' ? 'rtl' : 'ltr'),
    cart: null,
    invoice: null,
    regions: [],
    addressForm: emptyAddressForm(),
    postalCodeMandatory: false,
    emailMandatory: false,
    addressDirty: true,
    applicable: null,
    shippingGroups: [],
    paymentMethods: [],
    selectedPaymentMethodId: null,
    discountCode: '',
    appliedDiscountCode: null,
    appliedDiscount: null,
    discountError: null,
    result: null,
    error: null,
    flags: initialFlags()
  };
}

export function createCheckoutEngine(options: CheckoutEngineOptions): CheckoutEngine {
  const config: CheckoutConfig = options.config ?? {};
  const binding: CheckoutSdkBinding = createSdkBinding(options);
  const store: Store<CheckoutState> = createStore(initialState(config));
  let paymentVerificationTraceSequence = 0;
  let paymentReturnResolution: { key: string; promise: Promise<void> } | null = null;

  let effectExecutor: CheckoutEffectExecutor = noopEffectExecutor;
  let lock: Promise<unknown> = Promise.resolve();
  let startPromise: Promise<void> | null = null;
  let addressRevision = 0;
  let addressAutoSubmitTimer: ReturnType<typeof setTimeout> | null = null;

  // ---- internal helpers -------------------------------------------------

  const get = () => store.getState();
  const set = store.setState;

  function runEffect(effect: CheckoutEffect): void {
    effectExecutor(effect);
  }

  function emit(...args: Parameters<typeof makeEvent>): void {
    runEffect({ type: 'emit', event: makeEvent(...args) });
  }

  function setFlag(flag: keyof CheckoutFlags, value: boolean): void {
    set((prev) => ({ flags: { ...prev.flags, [flag]: value } }));
  }

  function setError(error: CheckoutState['error']): void {
    set({ error, status: error ? 'error' : 'idle' });
  }

  function withLock<T>(fn: () => Promise<T>): Promise<T> {
    const next = lock.then(fn, fn);
    lock = next.then(
      () => undefined,
      () => undefined
    );
    return next as Promise<T>;
  }

  function clearAddressAutoSubmit(): void {
    if (addressAutoSubmitTimer) {
      clearTimeout(addressAutoSubmitTimer);
      addressAutoSubmitTimer = null;
    }
  }

  function scheduleAddressAutoSubmit(delay = ADDRESS_AUTOSUBMIT_DEBOUNCE_MS): void {
    clearAddressAutoSubmit();
    addressAutoSubmitTimer = setTimeout(() => {
      addressAutoSubmitTimer = null;
      void withLock(submitAddressInternal);
    }, delay);
  }

  function recomputeGroups(): ShippingGroup[] {
    const { invoice, applicable } = get();
    const groups = deriveShippingGroups(invoice, applicable);
    set({ shippingGroups: groups });
    return groups;
  }

  // ---- SDK steps --------------------------------------------------------

  /** Fetch cart; returns false (and sets error) when unavailable. */
  async function loadCart(): Promise<boolean> {
    if (!binding.hasCart()) {
      setError(makeError('no_cart', get().locale, 'cart'));
      return false;
    }
    const res = await binding.client.cart.get();
    if (res.error || !res.data) {
      setError(fromSdkError(res.error ?? { message: '', type: 'api' }, get().locale, 'cart'));
      return false;
    }
    set({ cart: res.data });
    return true;
  }

  /** Create invoice when missing (checked via state), otherwise refresh it. */
  async function ensureInvoice(): Promise<boolean> {
    const res = get().invoice != null
      ? await binding.client.invoices.refresh()
      : await binding.client.invoices.create();
    if (res.error || !res.data) {
      setError(fromSdkError(res.error ?? { message: '', type: 'api' }, get().locale, 'shipping'));
      return false;
    }
    set({ invoice: res.data });
    return true;
  }

  async function loadRegions(): Promise<void> {
    const res = await binding.client.regions.list();
    if (res.data) {
      set({ regions: res.data as unknown as CheckoutRegion[] });
    }
  }

  async function loadGeneralInfo(): Promise<void> {
    const getInfo = binding.client.general?.getInfo;
    if (!getInfo) {
      return;
    }
    const res = await getInfo.call(binding.client.general);
    if (res.data) {
      const postalCodeMandatory = readPostalCodeMandatory(res.data);
      if (postalCodeMandatory !== undefined) {
        set({ postalCodeMandatory });
      }
      const emailMandatory = readEmailMandatory(res.data);
      if (emailMandatory !== undefined) {
        set({ emailMandatory });
      }
    }
  }

  async function refreshInvoice(): Promise<void> {
    const res = await binding.client.invoices.refresh();
    if (res.data) {
      set({ invoice: res.data });
      recomputeGroups();
    }
  }

  async function loadApplicableShipping(expectedAddressRevision: number): Promise<boolean> {
    setFlag('loadingShipping', true);
    const res = await binding.client.invoices.getApplicableShippingMethods();
    setFlag('loadingShipping', false);
    if (addressRevision !== expectedAddressRevision) {
      return false;
    }
    if (res.error || !res.data) {
      setError(fromSdkError(res.error ?? { message: '', type: 'api' }, get().locale, 'shipping'));
      return false;
    }
    set({ applicable: res.data });
    recomputeGroups();
    return true;
  }

  async function assignCurrentShipping(): Promise<void> {
    const groups = get().shippingGroups;
    const assignments = buildShippingAssignments(groups);
    if (assignments.length === 0) {
      return;
    }
    const res = await binding.client.invoices.assignShippingMethod(assignments);
    if (res.error || !res.data) {
      setError(fromSdkError(res.error ?? { message: '', type: 'api' }, get().locale, 'shipping'));
      return;
    }
    set({ invoice: res.data });
    recomputeGroups();
  }

  async function loadPaymentMethods(): Promise<void> {
    setFlag('loadingPayments', true);
    const res = await binding.client.payments.getMethods();
    setFlag('loadingPayments', false);
    if (res.error || !res.data) {
      setError(fromSdkError(res.error ?? { message: '', type: 'api' }, get().locale, 'payment'));
      return;
    }
    const methods = res.data;
    const current = get().selectedPaymentMethodId;
    const preferred =
      current ?? methods.find((m) => m.isDefault)?.id ?? methods[0]?.id ?? null;
    set({ paymentMethods: methods, selectedPaymentMethodId: preferred });
  }

  // ---- payment resolution ----------------------------------------------

  // Push a terminal failure onto the result step (step 4) with a visible message.
  function failResult(message: string, err?: CheckoutError): void {
    // A gateway callback may be replayed by React effects or the host router.
    // Once the backend has returned a confirmed order, a later replay must not
    // replace that terminal success with payment_fail_error.
    if (get().result?.status === 'success') return;
    set({
      step: 'result',
      status: 'idle',
      result: { status: 'failed', message },
      error: err ?? null
    });
    emit('payment_failed', { step: 'result' });
  }

  function handlePaymentAction(action: PaymentAction, traceId?: string): void {
    logPaymentVerification(traceId, 'action_received', summarizePaymentAction(action));
    switch (action.action) {
      case 'REDIRECT':
        if (!action.address) {
          console.error('[Sazito Checkout] REDIRECT action has no address:', action);
          failResult(makeError('payment_failed', get().locale, 'result').message);
          return;
        }
        set({ status: 'redirecting' });
        runEffect({ type: 'redirect', url: action.address });
        return;
      case 'POST':
        if (!action.address) {
          console.error('[Sazito Checkout] POST action has no address:', action);
          failResult(makeError('payment_failed', get().locale, 'result').message);
          return;
        }
        set({ status: 'redirecting' });
        runEffect({
          type: 'post-form',
          url: action.address,
          fields: stringifyFields(action.payload)
        });
        return;
      case 'show_order':
        set({
          step: 'result',
          status: 'idle',
          result: { status: 'success', order: normalizeResultOrder(action.order) },
          error: null
        });
        logPaymentVerification(traceId, 'state_changed', summarizePaymentState());
        emit('payment_succeeded', { step: 'result' });
        return;
      case 'FAIL':
      case 'payment_fail_error':
      case 'show_error':
        set({
          step: 'result',
          status: 'idle',
          result: { status: 'failed', message: action.message }
        });
        logPaymentVerification(traceId, 'state_changed', summarizePaymentState());
        emit('payment_failed', { step: 'result' });
        return;
      case 'StockViolated':
        set({
          step: 'result',
          status: 'idle',
          result: { status: 'stock_violated', message: action.message }
        });
        setError(makeError('stock_violated', get().locale, 'result'));
        logPaymentVerification(traceId, 'state_changed', summarizePaymentState());
        return;
      case 'pending':
        set({
          step: 'result',
          status: 'polling',
          result: {
            status: 'pending',
            order: normalizeResultOrder(action.order),
            message: action.message
          },
          error: null
        });
        logPaymentVerification(traceId, 'state_changed', summarizePaymentState());
        emit('payment_pending', { step: 'result' });
        void pollPending();
        return;
      case 'UPLOAD':
      case 'show_otp_modal':
        // Card-to-card upload is out of scope for v1; surface a clear failure.
        set({
          step: 'result',
          status: 'idle',
          result: { status: 'failed', message: action.message }
        });
        return;
      case 'unknown':
        failResult(action.message ?? makeError('payment_failed', get().locale, 'result').message);
        return;
    }
  }

  async function pollPending(): Promise<void> {
    const interval = config.pollIntervalMs ?? 15000;
    const traceId = nextPaymentVerificationTraceId('poll');
    logPaymentVerification(traceId, 'started', { intervalMs: interval });
    const res = await binding.client.payments.pollUntilSettled(undefined, interval);
    logPaymentVerification(traceId, 'sdk_response', res);
    if (res.error || !res.data) {
      const err = fromSdkError(res.error ?? { message: '', type: 'api' }, get().locale, 'result');
      logPaymentVerification(traceId, 'failed', { sdkError: res.error, checkoutError: err });
      failResult(err.message, err);
      return;
    }
    handlePaymentAction(res.data, traceId);
  }

  // ---- public actions ---------------------------------------------------

  function goToStep(step: CheckoutStep): void {
    if (step !== 'shipping') {
      clearAddressAutoSubmit();
    }
    set({ step, error: null });
    emit('step_viewed', { step });
    // When landing on shipping with a complete address but no methods fetched yet,
    // auto-submit so methods appear without requiring a manual Continue press.
    if (step === 'shipping') {
      const { addressForm, addressDirty, invoice, applicable, shippingGroups } = get();
      const methodsUnresolved = Boolean(invoice?.needsShipping) && shippingGroups.length === 0;
      if ((addressDirty || !applicable || methodsUnresolved) && isAddressComplete(
        addressForm,
        invoice?.needsShipping ?? true,
        get().postalCodeMandatory,
        get().emailMandatory
      )) {
        void withLock(submitAddressInternal);
      }
    }
  }

  function isUsableSavedAddress(
    addr: Invoice['shippingAddress'] | ShippingAddress | null | undefined
  ): boolean {
    return Boolean(addr && (addr.firstName || addr.lastName || addr.address));
  }

  /* Authenticated users load their latest account address. Stored credentials
     are also a safe fallback because createAddress refreshes them every time. */
  async function loadSavedAddress(): Promise<ShippingAddress | null> {
    try {
      if (binding.client.isAuthenticated()) {
        const res = await binding.client.shipping.listAddresses();
        const latest = res.data?.find(isUsableSavedAddress);
        if (latest) {
          return latest;
        }
        if (res.error) {
          console.warn('[Sazito Checkout] account-address prefill failed:', res.error.message);
        }
      }

      if (!binding.credentials.getShippingCredentials()) {
        return null;
      }

      const guestRes = await binding.client.shipping.getAddress();
      if (guestRes.data && isUsableSavedAddress(guestRes.data)) {
        return guestRes.data;
      }
      console.warn(
        '[Sazito Checkout] guest-address prefill skipped:',
        guestRes.error?.message ?? 'address response missing usable fields',
        guestRes.data ?? null
      );
    } catch (e) {
      console.warn('[Sazito Checkout] saved-address prefill failed:', e);
    }
    return null;
  }

  const actions: CheckoutActions = {
    async start() {
      if (!startPromise) {
        startPromise = store.batch(() => withLock(async () => {
          setFlag('bootstrapping', true);
          set({ status: 'bootstrapping', error: null });

          // Regions and shop settings are independent. Invoice creation is not:
          // it must only run after the cart identifier has resolved to a real cart,
          // otherwise its secondary "no cart" error can overwrite the useful
          // empty-cart state from loadCart().
          const cartPromise = loadCart();
          const supportingDataPromise = Promise.all([loadRegions(), loadGeneralInfo()]);
          const cartOk = await cartPromise;
          const invoiceOk = cartOk ? await ensureInvoice() : false;
          await supportingDataPromise;
          if (!cartOk || !invoiceOk) {
            setFlag('bootstrapping', false);
            return;
          }

          const invoice = get().invoice;
          const hasInvoiceAddress = isUsableSavedAddress(invoice?.shippingAddress);
          let rawForm = addressFormFromInvoice(invoice);
          let savedCityName = invoice?.shippingAddress?.region?.city?.name;
          // Fresh invoices carry no address. Authenticated users get their latest
          // account address; guests get the address persisted by SDK credentials.
          if (!hasInvoiceAddress) {
            const saved = await loadSavedAddress();
            if (saved) {
              rawForm = addressFormFromSavedAddress(saved);
              savedCityName = savedAddressCityName(saved);
            }
          }
          // A code applied in an earlier session survives on the invoice — reflect
          // it as applied (no before-invoice, so the type falls back to totals).
          const savedCode = invoice?.discountCode?.toUpperCase();
          setFlag('bootstrapping', false);
          set({
            status: 'idle',
            addressForm: reconcileAddressWithRegions(rawForm, get().regions, savedCityName),
            addressDirty: !hasInvoiceAddress,
            ...(savedCode && invoice
              ? {
                  appliedDiscountCode: savedCode,
                  appliedDiscount: classifyAppliedDiscount(null, invoice, savedCode)
                }
              : {})
          });
          if (get().step === 'cart') {
            emit('checkout_viewed', { step: 'cart' });
            emit('step_viewed', { step: 'cart' });
          }
        }));
      }

      await startPromise;
      if (get().error) {
        startPromise = null;
      }
    },

    goToStep,

    back() {
      const idx = STEP_ORDER.indexOf(get().step);
      if (idx > 0) {
        goToStep(STEP_ORDER[idx - 1]);
      }
    },

    async next() {
      await withLock(async () => {
        const state = get();
        setError(null);

        if (state.step === 'cart') {
          set({ status: 'working' });
          const ok = await ensureInvoice();
          set({ status: 'idle' });
          if (ok) {
            // A fresh invoice has no address yet. Keep the form hydrated from
            // the base SDK's saved address instead of clearing it just before
            // the Shipping step becomes visible.
            const invoice = get().invoice;
            if (isUsableSavedAddress(invoice?.shippingAddress)) {
              const addressForm = reconcileAddressWithRegions(
                addressFormFromInvoice(invoice),
                get().regions,
                savedAddressCityName(invoice?.shippingAddress)
              );
              set({
                addressForm,
                addressDirty: isAddressDirty(addressForm, invoice)
              });
            }
            goToStep('shipping');
          }
          return;
        }

        if (state.step === 'shipping') {
          clearAddressAutoSubmit();
          // Phase 1: address not saved yet (or changed) → save it and reveal the
          // shipping methods, staying on the shipping step.
          const needsSave = state.addressDirty || !state.applicable;
          if (needsSave) {
            const saved = await submitAddressInternal();
            if (!saved) return;
            // Stay on the step so the customer can pick / switch a method.
            if (state.invoice?.needsShipping) {
              return;
            }
          }
          // Phase 2: methods resolved → validate and proceed to payment.
          const invoice = get().invoice;
          if (!isShippingComplete(invoice, get().shippingGroups)) {
            setError(makeError('shipping_required', state.locale, 'shipping'));
            return;
          }
          set({ status: 'working' });
          await loadPaymentMethods();
          set({ status: 'idle' });
          if (!get().error) goToStep('payment');
          return;
        }

        if (state.step === 'payment') {
          if (state.selectedPaymentMethodId == null) {
            setError(makeError('validation', state.locale, 'payment'));
            return;
          }
          // No review step — finalize directly from payment.
          await placeOrderInternal();
          return;
        }
      });
    },

    async updateItemQuantity(cartProductId, variantId, quantity) {
      await withLock(async () => {
        if (quantity < 1) return;
        setFlag('updatingCart', true);
        const res = await binding.client.cart.updateItem(cartProductId, variantId, quantity);
        if (res.data) {
          set({ cart: res.data });
          await refreshInvoice();
        } else if (res.error) {
          setError(fromSdkError(res.error, get().locale, 'cart'));
        }
        setFlag('updatingCart', false);
      });
    },

    async removeItem(cartProductId, variantId) {
      await withLock(async () => {
        setFlag('updatingCart', true);
        const res = await binding.client.cart.removeItem(cartProductId, variantId);
        if (res.data) {
          set({ cart: res.data });
          await refreshInvoice();
        } else if (res.error) {
          setError(fromSdkError(res.error, get().locale, 'cart'));
        }
        setFlag('updatingCart', false);
      });
    },

    setAddressField(key, value) {
      const before = get().addressForm;
      const changed = before[key] !== value || (key === 'regionId' && before.cityId !== null);
      const destinationChanged = changed && (key === 'regionId' || key === 'cityId');
      if (changed) {
        addressRevision += 1;
      }
      set((prev) => {
        const addressForm: AddressFormValues = { ...prev.addressForm, [key]: value };
        // Reset city when region changes.
        if (key === 'regionId') {
          addressForm.cityId = null;
        }
        const addressDirty = isAddressDirty(addressForm, prev.invoice);
        return {
          addressForm,
          addressDirty,
          // Shipping rates depend on region/city. Contact and street edits must
          // not discard valid methods for the same destination.
          ...(destinationChanged ? { applicable: null, shippingGroups: [] } : {})
        };
      });

      // Browser autofill often populates the selects before the final required
      // text field. Once the form becomes complete, debounce text changes and
      // submit automatically; a discrete city selection can submit immediately.
      if (changed && get().step === 'shipping') {
        const state = get();
        const methodsUnresolved = !state.applicable
          || (Boolean(state.invoice?.needsShipping) && state.shippingGroups.length === 0);
        if (isAddressComplete(
          state.addressForm,
          state.invoice?.needsShipping ?? true,
          state.postalCodeMandatory,
          state.emailMandatory
        ) && (destinationChanged || methodsUnresolved)) {
          scheduleAddressAutoSubmit(key === 'cityId' ? 0 : undefined);
        } else if (!isAddressComplete(
          state.addressForm,
          state.invoice?.needsShipping ?? true,
          state.postalCodeMandatory,
          state.emailMandatory
        )) {
          clearAddressAutoSubmit();
        }
      }
    },

    async submitAddress() {
      clearAddressAutoSubmit();
      return withLock(submitAddressInternal);
    },

    async selectShippingRate(groupKey, rateId) {
      await withLock(async () => {
        setFlag('selectingRate', true);
        set((prev) => ({
          shippingGroups: prev.shippingGroups.map((group) =>
            group.key === groupKey ? { ...group, selectedRateId: rateId } : group
          )
        }));
        await assignCurrentShipping();
        await refreshInvoice();
        setFlag('selectingRate', false);
        emit('shipping_rate_selected', { step: 'shipping', metadata: { groupKey, rateId } });
      });
    },

    setDiscountCode(code) {
      set({ discountCode: code, discountError: null });
    },

    async applyDiscount() {
      await withLock(async () => {
        const code = get().discountCode.trim();
        if (!code) return;
        setFlag('applyingDiscount', true);
        set({ discountError: null });
        const before = get().invoice;
        const res = await binding.client.invoices.addDiscountCode(code);
        setFlag('applyingDiscount', false);
        if (res.error || !res.data) {
          // Inline error on the discount field instead of the global banner.
          const err = fromSdkError(res.error ?? { message: '', type: 'api' }, get().locale, 'payment');
          set({ discountError: err.message });
          return;
        }
        const applied = classifyAppliedDiscount(before, res.data, code.toUpperCase());
        set({
          invoice: res.data,
          appliedDiscountCode: applied.code,
          appliedDiscount: applied,
          discountError: null
        });
        recomputeGroups();
        emit('discount_applied', { step: 'payment', metadata: { code, kind: applied.kind } });
      });
    },

    async removeDiscount() {
      await withLock(async () => {
        // No dedicated remove endpoint; clear the saved code and re-sync.
        setFlag('applyingDiscount', true);
        binding.credentials.clearDiscountCode();
        set({ appliedDiscountCode: null, appliedDiscount: null, discountCode: '', discountError: null });
        await refreshInvoice();
        setFlag('applyingDiscount', false);
        emit('discount_removed', { step: 'payment' });
      });
    },

    selectPaymentMethod(id) {
      set({ selectedPaymentMethodId: id });
      emit('payment_method_selected', { step: 'payment', metadata: { id } });
    },

    async placeOrder() {
      await withLock(placeOrderInternal);
    },

    async retryPayment() {
      // Payment-return pages verify immediately and intentionally skip the
      // normal cart bootstrap. Rehydrate that state before reopening payment,
      // otherwise the step has no invoice summary or payment methods.
      set((prev) => ({
        step: 'payment',
        status: 'working',
        result: null,
        error: null,
        flags: { ...prev.flags, loadingPayments: true }
      }));
      emit('step_viewed', { step: 'payment' });
      try {
        // A failed gateway attempt must not remain the active payment when the
        // customer starts a new one for the same invoice.
        binding.credentials.clearPaymentCredentials();
        await actions.start();
        if (get().error) return;

        await withLock(async () => {
          if (get().paymentMethods.length === 0) {
            await loadPaymentMethods();
          }
          if (get().error) return;
          if (get().paymentMethods.length === 0) {
            setError(makeError('payment_failed', get().locale, 'payment'));
            return;
          }

          set({ status: 'idle' });
        });
      } finally {
        setFlag('loadingPayments', false);
      }
    },

    async resolvePaymentReturn(params) {
      const resolutionKey = serializePaymentReturnParams(params);
      if (get().result?.status === 'success') {
        logPaymentVerification(undefined, 'callback_after_success_skipped', {
          callbackParameterNames: Object.keys(params),
          paymentId: params.id,
          paymentIdentifier: params.paymentIdentifier
        });
        return;
      }
      if (paymentReturnResolution?.key === resolutionKey) {
        logPaymentVerification(undefined, 'duplicate_callback_skipped', {
          callbackParameterNames: Object.keys(params),
          paymentId: params.id,
          paymentIdentifier: params.paymentIdentifier
        });
        await paymentReturnResolution.promise;
        return;
      }

      const resolutionPromise = withLock(async () => {
        // Another callback may have completed while this one waited for the
        // engine lock. A confirmed order is terminal for this engine instance.
        if (get().result?.status === 'success') {
          logPaymentVerification(undefined, 'queued_callback_after_success_skipped', {
            callbackParameterNames: Object.keys(params),
            paymentId: params.id,
            paymentIdentifier: params.paymentIdentifier
          });
          return;
        }
        const traceId = nextPaymentVerificationTraceId('callback');
        logPaymentVerification(traceId, 'started', {
          callbackParameterNames: Object.keys(params),
          paymentId: params.id,
          paymentIdentifier: params.paymentIdentifier
        });
        set({ step: 'result', status: 'polling', result: { status: 'pending' }, error: null });
        const input = paymentReturnInput(params);
        logPaymentVerification(traceId, 'input_parsed', {
          paymentId: input?.id,
          paymentIdentifier: input?.paymentIdentifier,
          payloadFieldNames: input?.payload ? Object.keys(input.payload) : []
        });
        if (
          input?.id != null &&
          Number.isInteger(input.id) &&
          input.id > 0 &&
          input.paymentIdentifier?.trim()
        ) {
          binding.credentials.setPaymentCredentials({
            id: input.id,
            identifier: input.paymentIdentifier.trim()
          });
          logPaymentVerification(traceId, 'credentials_restored', {
            paymentId: input.id,
            paymentIdentifier: input.paymentIdentifier
          });
        }
        logPaymentVerification(traceId, 'sdk_verify_started', {
          hasInput: Boolean(input)
        });
        const action = await binding.client.payments.verify(input);
        logPaymentVerification(traceId, 'sdk_verify_finished', action);
        if (action.error || !action.data) {
          const err = fromSdkError(action.error ?? { message: '', type: 'api' }, get().locale, 'result');
          logPaymentVerification(traceId, 'failed', {
            sdkError: action.error,
            checkoutError: err
          });
          failResult(err.message, err);
          return;
        }
        handlePaymentAction(action.data, traceId);
      });
      paymentReturnResolution = { key: resolutionKey, promise: resolutionPromise };
      await resolutionPromise;
    },

    reset() {
      addressRevision += 1;
      paymentReturnResolution = null;
      set(initialState(config));
    }
  };

  // Older compatible SDK releases may pass the backend's nullable collection
  // fields through unchanged. Keep the checkout result UI safe even when it is
  // paired with one of those versions.
  function normalizeResultOrder(order: CheckoutOrder | undefined): CheckoutOrder | undefined {
    if (!order) return undefined;
    const invoice = order.invoice;
    return {
      ...order,
      invoice: {
        ...invoice,
        invoiceItems: Array.isArray(invoice?.invoiceItems) ? invoice.invoiceItems : [],
        shippingItems: Array.isArray(invoice?.shippingItems) ? invoice.shippingItems : []
      }
    };
  }

  function nextPaymentVerificationTraceId(operation: 'callback' | 'poll'): string {
    paymentVerificationTraceSequence += 1;
    return `${operation}-${Date.now()}-${paymentVerificationTraceSequence}`;
  }

  function logPaymentVerification(
    traceId: string | undefined,
    stage: string,
    details: unknown
  ): void {
    if (!config.debug) return;
    console.debug(
      `[Sazito Checkout][Payment Verification][${traceId ?? 'untracked'}] ${stage}`,
      redactPaymentLogValue(details)
    );
  }

  function redactPaymentLogValue(value: unknown, key = ''): unknown {
    const sensitiveKey = /authorization|cookie|password|secret|token|identifier|tracking|mobile|phone|email|postal|address|first.?name|last.?name|receipt.?ref|ref.?id/i;
    if (sensitiveKey.test(key)) {
      if (value === undefined || value === null || value === '') return value;
      const text = String(value);
      return text.length <= 4 ? '[REDACTED]' : `[REDACTED:${text.slice(-4)}]`;
    }
    if (Array.isArray(value)) return value.map((entry) => redactPaymentLogValue(entry));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([entryKey, entryValue]) => [
          entryKey,
          redactPaymentLogValue(entryValue, entryKey)
        ])
      );
    }
    return value;
  }

  function summarizePaymentAction(action: PaymentAction): Record<string, unknown> {
    return {
      action: action.action,
      message: action.message,
      backendAction: action.action === 'unknown' ? action.backendAction : undefined,
      order: 'order' in action && action.order ? {
        id: action.order.id,
        orderNumber: action.order.orderNumber,
        orderIdentifier: action.order.orderIdentifier,
        invoiceItemCount: action.order.invoice?.invoiceItems?.length ?? 0,
        shippingItemCount: action.order.invoice?.shippingItems?.length ?? 0
      } : undefined,
      raw: action.raw
    };
  }

  function summarizePaymentState(): Record<string, unknown> {
    const state = get();
    return {
      step: state.step,
      status: state.status,
      resultStatus: state.result?.status,
      resultMessage: state.result?.message,
      orderId: state.result?.order?.id,
      error: state.error
    };
  }

  // Internal (lock-free) order placement shared by `placeOrder` & `next` (payment step).
  async function placeOrderInternal(): Promise<void> {
    const { selectedPaymentMethodId, locale } = get();
    if (selectedPaymentMethodId == null) {
      setError(makeError('validation', locale, 'payment'));
      return;
    }

    setFlag('placingOrder', true);
    setError(null);
    try {
      const created = await binding.client.payments.create(selectedPaymentMethodId);
      if (created.error || !created.data) {
        console.error('[Sazito Checkout] payments.create failed:', created.error);
        const err = fromSdkError(created.error ?? { message: '', type: 'api' }, locale, 'result');
        failResult(err.message, err);
        return;
      }

      emit('payment_initiated', { step: 'payment', value: get().invoice?.finalTotal });
      const action = await binding.client.payments.initialize();
      if (action.error || !action.data) {
        console.error('[Sazito Checkout] payments.initialize failed:', action.error);
        const err = fromSdkError(action.error ?? { message: '', type: 'api' }, locale, 'result');
        failResult(err.message, err);
        return;
      }
      handlePaymentAction(action.data);
    } catch (e) {
      // Network/unexpected throw — never leave the button spinning silently.
      console.error('[Sazito Checkout] place order threw:', e);
      const err = fromSdkError({ message: (e as Error)?.message || '', type: 'network' }, locale, 'result');
      failResult(err.message, err);
    } finally {
      setFlag('placingOrder', false);
    }
  }

  // Internal (lock-free) address submission shared by `submitAddress` & `next`.
  async function submitAddressInternal(): Promise<boolean> {
    const state = get();
    const submittedAddressRevision = addressRevision;
    const needsShipping = state.invoice?.needsShipping ?? true;
    const shouldReloadShipping = needsShipping
      && (!state.applicable || state.shippingGroups.length === 0);

    const abandonStaleSubmission = (invoice?: Invoice): false => {
      set({
        ...(invoice ? { invoice } : {}),
        addressDirty: true,
        applicable: null,
        shippingGroups: []
      });
      setFlag('savingAddress', false);
      return false;
    };

    if (!isAddressComplete(state.addressForm, needsShipping, state.postalCodeMandatory, state.emailMandatory)) {
      setError(makeError('address_required', state.locale, 'shipping'));
      return false;
    }

    // Skip the round-trip if nothing changed and shipping is already resolved.
    if (!state.addressDirty && state.applicable && isShippingComplete(state.invoice, state.shippingGroups)) {
      return true;
    }

    setFlag('savingAddress', true);
    const input = toAddressInput(state.addressForm);
    // Addresses attached to invoices are immutable order snapshots. Updating
    // the previous address would also rewrite historical orders, so checkout
    // always creates a new address and persists its new guest credentials.
    const addrRes = await binding.client.shipping.createAddress(input);
    if (addrRes.error || !addrRes.data) {
      setFlag('savingAddress', false);
      setError(fromSdkError(addrRes.error ?? { message: '', type: 'api' }, state.locale, 'shipping'));
      return false;
    }
    if (addressRevision !== submittedAddressRevision) {
      return abandonStaleSubmission();
    }

    const address = addrRes.data;
    const linkRes = await binding.client.invoices.addShippingAddress(address.id, address.identifier);
    if (linkRes.error || !linkRes.data) {
      setFlag('savingAddress', false);
      setError(fromSdkError(linkRes.error ?? { message: '', type: 'api' }, state.locale, 'shipping'));
      return false;
    }
    if (addressRevision !== submittedAddressRevision) {
      return abandonStaleSubmission(linkRes.data);
    }
    set({ invoice: linkRes.data, addressDirty: false });

    if (needsShipping) {
      let ok = true;
      if (shouldReloadShipping) {
        ok = await loadApplicableShipping(submittedAddressRevision);
      } else if (recomputeGroups().length === 0) {
        // Invoice item IDs can change when the new address snapshot is linked.
        // Reload only if the existing applicable data can no longer form groups.
        ok = await loadApplicableShipping(submittedAddressRevision);
      }
      if (ok) {
        await assignCurrentShipping();
        if (addressRevision !== submittedAddressRevision) {
          return abandonStaleSubmission();
        }
        await refreshInvoice();
        if (addressRevision !== submittedAddressRevision) {
          return abandonStaleSubmission();
        }
      } else if (addressRevision !== submittedAddressRevision) {
        return abandonStaleSubmission();
      }
    }

    setFlag('savingAddress', false);
    emit('address_submitted', { step: 'shipping' });
    return !get().error;
  }

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions,
    setEffectExecutor(executor) {
      effectExecutor = executor;
    },
    destroy() {
      clearAddressAutoSubmit();
      effectExecutor = noopEffectExecutor;
    }
  };
}

function readEmailMandatory(data: unknown): boolean | undefined {
  const root = asRecord(data);
  const general = asRecord(root.general);
  const generalInfo = asRecord(
    general.generalInfo ?? general.general_info ?? root.generalInfo ?? root.general_info
  );
  const normalizedSettings = asRecord(root.settings);
  const checkout = asRecord(
    generalInfo.checkout ?? root.checkout ?? normalizedSettings.checkout
  );

  const optional = readCheckoutSettingBoolean(
    checkout.emailOptional ?? checkout.email_optional
  );
  if (optional !== undefined) return !optional;
  return readCheckoutSettingBoolean(
    checkout.emailMandatory ?? checkout.email_mandatory
  );
}

function readPostalCodeMandatory(data: unknown): boolean | undefined {
  const root = asRecord(data);
  const general = asRecord(root.general);
  const generalInfo = asRecord(
    general.generalInfo ?? general.general_info ?? root.generalInfo ?? root.general_info
  );
  const normalizedSettings = asRecord(root.settings);
  const checkout = asRecord(
    generalInfo.checkout ?? root.checkout ?? normalizedSettings.checkout
  );

  return readCheckoutSettingBoolean(
    checkout.postalCodeMandatory ?? checkout.postal_code_mandatory
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};
}

function readCheckoutSettingBoolean(value: unknown): boolean | undefined {
  if (value && typeof value === 'object' && 'enabled' in value) {
    return readCheckoutSettingBoolean((value as { enabled: unknown }).enabled);
  }
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}

function toAddressInput(form: AddressFormValues): ShippingAddressInput {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    mobilePhone: form.mobilePhone.trim(),
    email: form.email.trim() || undefined,
    phoneNumber: form.phoneNumber.trim() || undefined,
    regionId: form.regionId ?? undefined,
    cityId: form.cityId ?? undefined,
    address: form.address.trim(),
    postalCode: form.postalCode.trim() || undefined,
    description: form.description.trim() || undefined
  };
}

// Preserve every gateway-return field and its original casing. The SDK sends
// these values as direct fields in the form-encoded verification call.
function paymentReturnInput(params: Record<string, string>): PaymentStepInput | undefined {
  if (!params || Object.keys(params).length === 0) {
    return undefined;
  }

  const input: PaymentStepInput = {};
  if (params.id != null && Number.isFinite(Number(params.id))) input.id = Number(params.id);
  if (params.paymentIdentifier != null) input.paymentIdentifier = params.paymentIdentifier;

  const payload: Record<string, string> = {};
  for (const [name, value] of Object.entries(params)) {
    if (name !== 'id' && name !== 'paymentIdentifier') payload[name] = value;
  }
  if (Object.keys(payload).length > 0) input.payload = payload;

  return Object.keys(input).length > 0 ? input : undefined;
}

function serializePaymentReturnParams(params: Record<string, string>): string {
  return JSON.stringify(
    Object.entries(params).sort(([left], [right]) => left.localeCompare(right))
  );
}

function stringifyFields(payload: Record<string, string | number> | undefined): Record<string, string> {
  const fields: Record<string, string> = {};
  if (payload && typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload)) {
      fields[key] = value == null ? '' : String(value);
    }
  }
  return fields;
}
