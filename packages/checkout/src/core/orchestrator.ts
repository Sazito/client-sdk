/**
 * The checkout engine: a framework-agnostic port of the legacy `operateCart`
 * state machine on top of @sazito/client-sdk. Owns the store, serializes
 * mutations, and emits typed side-effects for the host to perform.
 */
import type { PaymentAction, PaymentStepInput, ShippingAddress, ShippingAddressInput, Invoice } from '@sazito/client-sdk';
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
    set({
      step: 'result',
      status: 'idle',
      result: { status: 'failed', message },
      error: err ?? null
    });
    emit('payment_failed', { step: 'result' });
  }

  function handlePaymentAction(action: PaymentAction): void {
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
      case 'showOrder':
        set({
          step: 'result',
          status: 'idle',
          result: { status: 'success', order: action.order }
        });
        emit('payment_succeeded', { step: 'result' });
        return;
      case 'FAIL':
        set({
          step: 'result',
          status: 'idle',
          result: { status: 'failed', message: action.message }
        });
        emit('payment_failed', { step: 'result' });
        return;
      case 'StockViolated':
        set({
          step: 'result',
          status: 'idle',
          result: { status: 'stock_violated', message: action.message }
        });
        setError(makeError('stock_violated', get().locale, 'result'));
        return;
      case 'pending':
        set({ step: 'result', status: 'polling', result: { status: 'pending' } });
        emit('payment_pending', { step: 'result' });
        void pollPending();
        return;
      case 'UPLOAD':
        // Card-to-card upload is out of scope for v1; surface a clear failure.
        set({
          step: 'result',
          status: 'idle',
          result: { status: 'failed', message: action.message }
        });
        return;
      default:
        // Unknown/unhandled action from the gateway — never stall silently.
        console.error('[Sazito Checkout] Unhandled payment action:', action);
        failResult(action.message || makeError('payment_failed', get().locale, 'result').message);
        return;
    }
  }

  async function pollPending(): Promise<void> {
    const interval = config.pollIntervalMs ?? 15000;
    const res = await binding.client.payments.pollUntilSettled(undefined, interval);
    if (res.error || !res.data) {
      setError(fromSdkError(res.error ?? { message: '', type: 'api' }, get().locale, 'result'));
      return;
    }
    handlePaymentAction(res.data);
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
          emit('checkout_viewed', { step: 'cart' });
          emit('step_viewed', { step: 'cart' });
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

    async resolvePaymentReturn(params) {
      await withLock(async () => {
        set({ step: 'result', status: 'polling', result: { status: 'pending' } });
        const action = await binding.client.payments.verify(paymentReturnInput(params));
        if (action.error || !action.data) {
          setError(fromSdkError(action.error ?? { message: '', type: 'api' }, get().locale, 'result'));
          return;
        }
        handlePaymentAction(action.data);
      });
    },

    reset() {
      addressRevision += 1;
      set(initialState(config));
    }
  };

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
      console.debug('[Sazito Checkout] payment init action:', action.data);
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

// Map raw gateway-return query params into the typed payment-step input.
// Only the string-valued callback fields are forwarded; `trackingData` /
// `payload` are parsed from JSON when the gateway sends them encoded.
function paymentReturnInput(params: Record<string, string>): PaymentStepInput | undefined {
  if (!params || Object.keys(params).length === 0) {
    return undefined;
  }

  const input: PaymentStepInput = {};
  if (params.tatoken != null) input.tatoken = params.tatoken;
  if (params.isFailed != null) input.isFailed = params.isFailed;
  if (params.code != null) input.code = params.code;
  if (params.imageUrl != null) input.imageUrl = params.imageUrl;
  if (params.id != null && Number.isFinite(Number(params.id))) input.id = Number(params.id);
  if (params.paymentIdentifier != null) input.paymentIdentifier = params.paymentIdentifier;

  const trackingData = parseJsonObject(params.trackingData);
  if (trackingData) input.trackingData = trackingData as PaymentStepInput['trackingData'];
  const payload = parseJsonObject(params.payload);
  if (payload) input.payload = payload as PaymentStepInput['payload'];

  return Object.keys(input).length > 0 ? input : undefined;
}

function parseJsonObject(value: string | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function stringifyFields(payload: PaymentAction['payload']): Record<string, string> {
  const fields: Record<string, string> = {};
  if (payload && typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload)) {
      fields[key] = value == null ? '' : String(value);
    }
  }
  return fields;
}
