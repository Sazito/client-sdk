/**
 * Checkout API
 * Headless orchestration for cart -> invoice -> shipping -> payment.
 */

import { CartAPI } from './cart';
import { InvoicesAPI } from './invoices';
import { PaymentsAPI } from './payments';
import { ShippingAPI } from './shipping';
import type {
  CheckoutCallbacks,
  CheckoutInitializeInput,
  CheckoutInitializeResult,
  CheckoutPaymentStepFormInput,
  CheckoutPaymentStepInput,
  CheckoutPaymentResult,
  Invoice,
  Payment,
  PaymentAction,
  PaymentMethod,
  RequestOptions,
  SazitoResponse,
  ShippingAddress,
  ShippingAssignment
} from '../types';

type CheckoutStep =
  | 'cart.addItemWithAttributes'
  | 'invoices.get'
  | 'invoices.create'
  | 'invoices.refresh'
  | 'invoices.addDiscountCode'
  | 'invoices.addDetails'
  | 'invoices.addForm'
  | 'invoices.addCredit'
  | 'invoices.removeCredit'
  | 'shipping.createAddress'
  | 'invoices.addShippingAddress'
  | 'invoices.getApplicableShippingMethods'
  | 'invoices.assignShippingMethod'
  | 'payments.getMethods'
  | 'payments.create'
  | 'payments.initialize'
  | 'payments.processStep'
  | 'payments.pollUntilSettled'
  | 'checkout.callback'
  | 'checkout.paymentSelection';

interface PreparedPaymentResult {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod;
  payment: Payment;
  paymentAction: PaymentAction;
}

interface AutoShippingResult {
  invoice: Invoice;
  shippingAssignments: ShippingAssignment[];
}

interface CheckoutState {
  cart?: CheckoutInitializeResult['cart'];
  invoice?: Invoice;
  shippingAddress?: ShippingAddress;
  shippingAssignments?: ShippingAssignment[];
  paymentMethods?: PaymentMethod[];
  selectedPaymentMethod?: PaymentMethod;
  payment?: Payment;
  paymentAction?: PaymentAction;
}

export class CheckoutAPI {
  constructor(
    private cartApi: CartAPI,
    private invoicesApi: InvoicesAPI,
    private shippingApi: ShippingAPI,
    private paymentsApi: PaymentsAPI
  ) {}

  /**
   * Full checkout bootstrap:
   * add item -> ensure invoice -> optional shipping/discount/form/credit ->
   * auto shipping assignment -> default payment -> initialize payment action.
   */
  async initialize(
    input: CheckoutInitializeInput,
    callbacks?: CheckoutCallbacks,
    options?: RequestOptions
  ): Promise<SazitoResponse<CheckoutInitializeResult>> {
    const state: CheckoutState = {
      shippingAssignments: []
    };

    const cartResponse = await this.cartApi.addItemWithAttributes(
      input.variantId,
      input.count,
      input.attributes,
      options
    );
    if (!cartResponse.data) {
      return this.withStepError<CheckoutInitializeResult>('cart.addItemWithAttributes', cartResponse, state);
    }
    state.cart = cartResponse.data;

    const syncInvoiceResponse = await this.syncInvoiceWithCart(options);
    if (!syncInvoiceResponse.data) {
      return this.withStepError<CheckoutInitializeResult>('invoices.create', syncInvoiceResponse, state);
    }
    state.invoice = syncInvoiceResponse.data;

    if (input.discountCode) {
      const discountResponse = await this.invoicesApi.addDiscountCode(input.discountCode, options);
      if (!discountResponse.data) {
        return this.withStepError<CheckoutInitializeResult>('invoices.addDiscountCode', discountResponse, state);
      }
      state.invoice = discountResponse.data;
    }

    if (input.comment) {
      const commentResponse = await this.invoicesApi.addDetails(input.comment, options);
      if (!commentResponse.data) {
        return this.withStepError<CheckoutInitializeResult>('invoices.addDetails', commentResponse, state);
      }
      state.invoice = commentResponse.data;
    }

    if (input.invoiceFormAttributes) {
      const formResponse = await this.invoicesApi.addForm({ formAttributes: input.invoiceFormAttributes }, options);
      if (!formResponse.data) {
        return this.withStepError<CheckoutInitializeResult>('invoices.addForm', formResponse, state);
      }
      state.invoice = formResponse.data;
    }

    if (input.useWalletCredit === true) {
      const creditResponse = await this.invoicesApi.addCredit(options);
      if (!creditResponse.data) {
        return this.withStepError<CheckoutInitializeResult>('invoices.addCredit', creditResponse, state);
      }
      state.invoice = creditResponse.data;
    }

    if (input.useWalletCredit === false) {
      const creditResponse = await this.invoicesApi.removeCredit(options);
      if (!creditResponse.data) {
        return this.withStepError<CheckoutInitializeResult>('invoices.removeCredit', creditResponse, state);
      }
      state.invoice = creditResponse.data;
    }

    if (input.shippingAddress) {
      const shippingAddressResponse = await this.shippingApi.createAddress(input.shippingAddress, options);
      if (!shippingAddressResponse.data) {
        return this.withStepError<CheckoutInitializeResult>('shipping.createAddress', shippingAddressResponse, state);
      }
      state.shippingAddress = shippingAddressResponse.data;

      const addShippingAddressResponse = await this.invoicesApi.addShippingAddress(
        shippingAddressResponse.data.id,
        shippingAddressResponse.data.identifier,
        options
      );
      if (!addShippingAddressResponse.data) {
        return this.withStepError<CheckoutInitializeResult>('invoices.addShippingAddress', addShippingAddressResponse, state);
      }
      state.invoice = addShippingAddressResponse.data;
    }

    if (state.invoice?.needsShipping) {
      const autoShippingResponse = await this.autoAssignShipping(options);
      if (!autoShippingResponse.data) {
        return this.withStepError<CheckoutInitializeResult>('invoices.assignShippingMethod', autoShippingResponse, state);
      }

      state.invoice = autoShippingResponse.data.invoice;
      state.shippingAssignments = autoShippingResponse.data.shippingAssignments;
    }

    const preparedPayment = await this.preparePayment(input.paymentTypeId, options);
    if (!preparedPayment.data) {
      return this.withStepError<CheckoutInitializeResult>('payments.initialize', preparedPayment, state);
    }

    state.paymentMethods = preparedPayment.data.paymentMethods;
    state.selectedPaymentMethod = preparedPayment.data.selectedPaymentMethod;
    state.payment = preparedPayment.data.payment;
    state.paymentAction = preparedPayment.data.paymentAction;

    const callbackResponse = await this.runSuccessCallback(preparedPayment.data.paymentAction, callbacks);
    if (callbackResponse.error) {
      return this.withStepError<CheckoutInitializeResult>('checkout.callback', callbackResponse, state);
    }

    return {
      data: {
        cart: state.cart,
        invoice: state.invoice,
        shippingAddress: state.shippingAddress,
        shippingAssignments: state.shippingAssignments || [],
        paymentMethods: state.paymentMethods,
        selectedPaymentMethod: state.selectedPaymentMethod,
        payment: state.payment,
        paymentAction: state.paymentAction
      }
    };
  }

  /**
   * Continue payment for step-based gateways (for example card-to-card).
   */
  async processPaymentStep(
    input: CheckoutPaymentStepInput,
    callbacks?: CheckoutCallbacks,
    options?: RequestOptions
  ): Promise<SazitoResponse<CheckoutPaymentResult>> {
    const response = await this.paymentsApi.processStep(input, options);
    if (!response.data) {
      return this.withStepError<CheckoutPaymentResult>('payments.processStep', response);
    }

    const callbackResponse = await this.runSuccessCallback(response.data, callbacks);
    if (callbackResponse.error) {
      return this.withStepError<CheckoutPaymentResult>('checkout.callback', callbackResponse);
    }

    return {
      data: {
        paymentAction: response.data,
        order: response.data.order
      }
    };
  }

  /**
   * Continue payment for form-mode gateways (non-JSON payment step payloads).
   */
  async processPaymentStepForm(
    input: CheckoutPaymentStepFormInput,
    callbacks?: CheckoutCallbacks,
    options?: RequestOptions
  ): Promise<SazitoResponse<CheckoutPaymentResult>> {
    const response = await this.paymentsApi.processStepForm(input, options);
    if (!response.data) {
      return this.withStepError<CheckoutPaymentResult>('payments.processStep', response);
    }

    const callbackResponse = await this.runSuccessCallback(response.data, callbacks);
    if (callbackResponse.error) {
      return this.withStepError<CheckoutPaymentResult>('checkout.callback', callbackResponse);
    }

    return {
      data: {
        paymentAction: response.data,
        order: response.data.order
      }
    };
  }

  /**
   * Poll payment action until it settles (`action !== 'pending'`).
   */
  async pollPaymentUntilSettled(
    callbacks?: CheckoutCallbacks,
    options?: RequestOptions,
    intervalMs: number = 15000
  ): Promise<SazitoResponse<CheckoutPaymentResult>> {
    const response = await this.paymentsApi.pollUntilSettled(options, intervalMs);
    if (!response.data) {
      return this.withStepError<CheckoutPaymentResult>('payments.pollUntilSettled', response);
    }

    const callbackResponse = await this.runSuccessCallback(response.data, callbacks);
    if (callbackResponse.error) {
      return this.withStepError<CheckoutPaymentResult>('checkout.callback', callbackResponse);
    }

    return {
      data: {
        paymentAction: response.data,
        order: response.data.order
      }
    };
  }

  /**
   * Clear checkout-related credentials (cart, invoice, shipping, payment).
   */
  clear(): void {
    this.cartApi.clearCart();
    this.invoicesApi.clearInvoice();
    this.shippingApi.clearAddress();
    this.paymentsApi.clearPayment();
  }

  private async syncInvoiceWithCart(options?: RequestOptions): Promise<SazitoResponse<Invoice>> {
    const invoiceResponse = await this.invoicesApi.get(options);

    if (invoiceResponse.data) {
      const refreshResponse = await this.invoicesApi.refresh(options);
      if (refreshResponse.data) {
        return refreshResponse;
      }

      if (refreshResponse.error?.type === 'validation') {
        return this.invoicesApi.create(options);
      }

      return refreshResponse;
    }

    if (invoiceResponse.error?.type === 'validation') {
      return this.invoicesApi.create(options);
    }

    return invoiceResponse;
  }

  private async autoAssignShipping(options?: RequestOptions): Promise<SazitoResponse<AutoShippingResult>> {
    const methodsResponse = await this.invoicesApi.getApplicableShippingMethods(options);
    if (!methodsResponse.data) {
      return this.withStepError<AutoShippingResult>('invoices.getApplicableShippingMethods', methodsResponse);
    }

    const shippingAssignments: ShippingAssignment[] = methodsResponse.data.itemsShippingRate.map((entry) => ({
      rateId: entry.shippingRate.id,
      invoiceItemIds: [entry.invoiceItemId]
    }));

    if (shippingAssignments.length === 0) {
      const invoiceResponse = await this.invoicesApi.get(options);
      if (!invoiceResponse.data) {
        return this.withStepError<AutoShippingResult>('invoices.get', invoiceResponse);
      }

      return {
        data: {
          invoice: invoiceResponse.data,
          shippingAssignments
        }
      };
    }

    const assignResponse = await this.invoicesApi.assignShippingMethod(shippingAssignments, options);
    if (!assignResponse.data) {
      return this.withStepError<AutoShippingResult>('invoices.assignShippingMethod', assignResponse);
    }

    return {
      data: {
        invoice: assignResponse.data,
        shippingAssignments
      }
    };
  }

  private async preparePayment(
    paymentTypeId?: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<PreparedPaymentResult>> {
    const methodsResponse = await this.paymentsApi.getMethods(options);
    if (!methodsResponse.data) {
      return this.withStepError<PreparedPaymentResult>('payments.getMethods', methodsResponse);
    }

    if (methodsResponse.data.length === 0) {
      return {
        error: {
          type: 'validation',
          message: 'No payment methods available for current invoice.',
          details: {
            step: 'checkout.paymentSelection'
          }
        }
      };
    }

    const selectedPaymentMethod = this.selectPaymentMethod(methodsResponse.data, paymentTypeId);
    if (!selectedPaymentMethod) {
      return {
        error: {
          type: 'validation',
          message: `Requested payment type is not available: ${paymentTypeId}`,
          details: {
            step: 'checkout.paymentSelection',
            availablePaymentTypeIds: methodsResponse.data.map((method) => method.id)
          }
        }
      };
    }

    const paymentResponse = await this.paymentsApi.create(selectedPaymentMethod.id, options);
    if (!paymentResponse.data) {
      return this.withStepError<PreparedPaymentResult>('payments.create', paymentResponse);
    }

    const initializeResponse = await this.paymentsApi.initialize(options);
    if (!initializeResponse.data) {
      return this.withStepError<PreparedPaymentResult>('payments.initialize', initializeResponse);
    }

    return {
      data: {
        paymentMethods: methodsResponse.data,
        selectedPaymentMethod,
        payment: paymentResponse.data,
        paymentAction: initializeResponse.data
      }
    };
  }

  private selectPaymentMethod(methods: PaymentMethod[], requestedPaymentTypeId?: number): PaymentMethod | null {
    if (requestedPaymentTypeId !== undefined) {
      return methods.find((method) => method.id === requestedPaymentTypeId) || null;
    }

    return methods.find((method) => method.isDefault) || methods[0] || null;
  }

  private async runSuccessCallback(
    action: PaymentAction,
    callbacks?: CheckoutCallbacks
  ): Promise<SazitoResponse<null>> {
    if (!callbacks?.onSuccess || action.action !== 'showOrder' || !action.order) {
      return { data: null };
    }

    try {
      await callbacks.onSuccess({ order: action.order, action });
      return { data: null };
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Checkout success callback failed';

      return {
        error: {
          type: 'api',
          message,
          details: {
            step: 'checkout.callback'
          }
        }
      };
    }
  }

  private withStepError<T>(
    step: CheckoutStep,
    response: SazitoResponse<any>,
    state?: CheckoutState
  ): SazitoResponse<T> {
    const errorType = response.error?.type || 'api';
    const errorMessage = response.error?.message || `Checkout step failed: ${step}`;

    return {
      error: {
        status: response.error?.status,
        type: errorType,
        message: errorMessage,
        details: {
          ...(response.error?.details || {}),
          step,
          state
        }
      }
    };
  }
}
