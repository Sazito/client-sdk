/**
 * Wallet API (User wallet and transactions)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  RequestOptions
} from '../types';
import { WALLET_API, WALLET_TRANSACTIONS_API } from '../constants/endpoints';

export interface WalletTransaction {
  id: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  balance_after: number;
  created_at: string;
}

export interface Wallet {
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
}

export interface TransactionFilters {
  page?: number;
  per_page?: number;
  type?: 'credit' | 'debit';
}

export class WalletAPI {
  constructor(private http: HttpClient) {}

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
  ): Promise<SazitoResponse<PaginatedResponse<WalletTransaction>>> {
    return this.http.get<PaginatedResponse<WalletTransaction>>(
      WALLET_TRANSACTIONS_API,
      {
        ...options,
        params: filters
      }
    );
  }
}
