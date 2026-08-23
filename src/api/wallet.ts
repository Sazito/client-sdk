/**
 * Wallet API (User wallet and transactions)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  Invoice,
  RequestOptions
} from '../types';
import { INVOICES_API, WALLET_API, WALLET_TRANSACTIONS_API } from '../constants/endpoints';
import {
  transformInvoiceResponse,
  transformWalletTransactionsResponse
} from '../utils/transformers';

export type WalletTransactionReason =
  | 'redeem'
  | 'NthPurchase'
  | 'merge-user'
  | 'SimpleCashbackRule'
  | 'BirthdateGift'
  | 'TajrobehAppreciation'
  | 'edit_order'
  | 'cancel_order'
  | 'edit_shipping_cost'
  | 'edit_cashback'
  | 'gift'
  | 'others'
  | 'Refund'
  | 'Charge'
  | 'Expired'
  | `${string}:activity`;

export interface WalletTransaction {
  id: string | number;
  reason: WalletTransactionReason;
  amount: number;
  createdAt: string;
  metaData?: Record<string, unknown>;
}

export interface WalletBalance {
  balance: number;
  enabled: boolean;
}

export interface Wallet extends WalletBalance {
  currency?: string;
  transactions?: WalletTransaction[];
}

export interface TransactionFilters {
  pageNumber?: number;
  pageSize?: number;
  /** @deprecated Use `pageNumber`. */
  page_number?: number;
  /** @deprecated Use `pageSize`. */
  page_size?: number;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
}

export class WalletAPI {
  constructor(private http: HttpClient) {}

  private validateInvoiceId(invoiceId: number): SazitoResponse<never> | null {
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return {
        error: {
          message: 'Invalid invoice ID',
          type: 'validation'
        }
      };
    }

    return null;
  }

  /**
   * Get wallet balance (requires authentication)
   */
  async getBalance(options?: RequestOptions): Promise<SazitoResponse<Wallet>> {
    return this.http.get<Wallet>(WALLET_API, options);
  }

  /**
   * List wallet transactions (requires authentication)
   */
  async listTransactions(
    filters?: TransactionFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<WalletTransactionsResponse>> {
    const pageNumber = filters?.pageNumber ?? filters?.page_number ?? 1;
    const pageSize = filters?.pageSize ?? filters?.page_size ?? 20;

    const response = await this.http.get<WalletTransactionsResponse>(
      WALLET_TRANSACTIONS_API,
      {
        ...options,
        params: {
          pageNumber,
          pageSize
        }
      }
    );

    if (response.data) {
      return {
        data: transformWalletTransactionsResponse<WalletTransactionsResponse>(response.data)
      };
    }

    return response;
  }

  /**
   * Apply wallet credit on an invoice (requires authentication)
   */
  async applyCredit(
    invoiceId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Invoice>> {
    const validation = this.validateInvoiceId(invoiceId);
    if (validation) return validation;

    const response = await this.http.post<Invoice>(
      `${INVOICES_API}/${invoiceId}/add_credit`,
      {},
      options
    );

    return response.data
      ? { data: transformInvoiceResponse<Invoice>(response.data) }
      : response;
  }

  /**
   * Remove wallet credit from an invoice (requires authentication)
   */
  async removeCredit(
    invoiceId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Invoice>> {
    const validation = this.validateInvoiceId(invoiceId);
    if (validation) return validation;

    const response = await this.http.post<Invoice>(
      `${INVOICES_API}/${invoiceId}/remove_credit`,
      {},
      options
    );

    return response.data
      ? { data: transformInvoiceResponse<Invoice>(response.data) }
      : response;
  }
}
