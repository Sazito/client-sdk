/**
 * Main Sazito SDK Client
 */

import { SazitoConfig, mergeConfig } from './config';
import { HttpClient } from './http-client';
import { TokenStorage } from '../utils/token-storage';
import { CredentialsManager } from '../utils/credentials-manager';

// API modules
import { ProductsAPI } from '../api/products';
import { CategoriesAPI } from '../api/categories';
import { CartAPI } from '../api/cart';
import { OrdersAPI } from '../api/orders';
import { InvoicesAPI } from '../api/invoices';
import { ShippingAPI } from '../api/shipping';
import { PaymentsAPI } from '../api/payments';
import { UsersAPI } from '../api/users';
import { SearchAPI } from '../api/search';
import { FeedbacksAPI } from '../api/feedbacks';
import { WalletAPI } from '../api/wallet';
import { CMSAPI } from '../api/cms';
import { ImagesAPI } from '../api/images';
import { VisitsAPI } from '../api/visits';
import { BookingAPI } from '../api/booking';
import { EntityRoutesAPI } from '../api/entity-routes';
import { MenuAPI } from '../api/menu';
import { GeneralAPI } from '../api/general';

export class SazitoClient {
  private http: HttpClient;
  private tokenStorage: TokenStorage;
  private credentialsManager: CredentialsManager;

  // API modules (lazy-loaded)
  public readonly products: ProductsAPI;
  public readonly categories: CategoriesAPI;
  public readonly cart: CartAPI;
  public readonly orders: OrdersAPI;
  public readonly invoices: InvoicesAPI;
  public readonly shipping: ShippingAPI;
  public readonly payments: PaymentsAPI;
  public readonly users: UsersAPI;
  public readonly search: SearchAPI;
  public readonly feedbacks: FeedbacksAPI;
  public readonly wallet: WalletAPI;
  public readonly cms: CMSAPI;
  public readonly images: ImagesAPI;
  public readonly visits: VisitsAPI;
  public readonly booking: BookingAPI;
  public readonly entityRoutes: EntityRoutesAPI;
  public readonly menu: MenuAPI;
  public readonly general: GeneralAPI;

  constructor(config: SazitoConfig) {
    const mergedConfig = mergeConfig(config);

    // Initialize core components
    this.http = new HttpClient(mergedConfig);
    this.tokenStorage = this.http.getTokenStorage();
    this.credentialsManager = new CredentialsManager();

    // Initialize API modules
    this.products = new ProductsAPI(this.http);
    this.categories = new CategoriesAPI(this.http);
    this.cart = new CartAPI(this.http, this.credentialsManager);
    this.orders = new OrdersAPI(this.http);
    this.invoices = new InvoicesAPI(this.http, this.credentialsManager);
    this.shipping = new ShippingAPI(this.http, this.credentialsManager);
    this.payments = new PaymentsAPI(this.http, this.credentialsManager);
    this.users = new UsersAPI(this.http);
    this.search = new SearchAPI(this.http);
    this.feedbacks = new FeedbacksAPI(this.http);
    this.wallet = new WalletAPI(this.http);
    this.cms = new CMSAPI(this.http);
    this.images = new ImagesAPI(this.http);
    this.visits = new VisitsAPI(this.http);
    this.booking = new BookingAPI(this.http);
    this.entityRoutes = new EntityRoutesAPI(this.http);
    this.menu = new MenuAPI(this.http);
    this.general = new GeneralAPI(this.http);
  }

  /**
   * Set authentication token (stores in HTTP-only cookie)
   */
  setAuthToken(token: string): void {
    this.tokenStorage.set(token);
  }

  /**
   * Get authentication token from cookie
   */
  getAuthToken(): string | null {
    return this.tokenStorage.get();
  }

  /**
   * Clear authentication (remove token cookie)
   */
  clearAuth(): void {
    this.tokenStorage.remove();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.tokenStorage.get() !== null;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.http.clearCache();
  }

  /**
   * Clear all guest credentials
   */
  clearCredentials(): void {
    this.credentialsManager.clearAll();
  }

  /**
   * Clear everything (auth + cache + credentials)
   */
  clearAll(): void {
    this.clearAuth();
    this.clearCache();
    this.clearCredentials();
  }
}

/**
 * Create a new Sazito SDK client instance
 */
export function createSazitoClient(config: SazitoConfig): SazitoClient {
  return new SazitoClient(config);
}
