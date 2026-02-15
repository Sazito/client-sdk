/**
 * Users API (Authentication and user management)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, User, RequestOptions } from '../types';
import { USERS_API, SESSIONS_API } from '../constants/endpoints';

/**
 * Login input (SDK uses camelCase)
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Register input (SDK uses camelCase)
 */
export interface RegisterInput {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
}

/**
 * Mobile login input
 */
export interface MobileLoginInput {
  mobilePhone: string;
}

/**
 * Verify mobile OTP input (SDK uses camelCase)
 */
export interface VerifyMobileInput {
  mobilePhone: string;
  token: string;
}

/**
 * Passwordless email login input
 */
export interface EmailLoginRequestInput {
  email: string;
}

/**
 * Forgot password input
 */
export interface ForgotPasswordInput {
  email: string;
}

/**
 * Reset password input (SDK uses camelCase)
 */
export interface ResetPasswordInput {
  forgotPasswordToken: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * Update user profile input
 */
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  birthDate?: string;
}

/**
 * Update user phone request input
 */
export interface UpdateMobilePhoneRequestInput {
  mobilePhone: string;
}

/**
 * Verify user phone update input
 */
export interface UpdateMobilePhoneVerificationInput {
  mobilePhone: string;
  token: string;
}

export interface LoginResponse {
  jwt: string;
  user?: User;
}

export class UsersAPI {
  constructor(private http: HttpClient) {}

  /**
   * Login with email and password
   */
  async login(
    input: LoginInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<LoginResponse>> {
    return this.http.post<LoginResponse>(`${SESSIONS_API}/login`, input, options);
  }

  /**
   * Request mobile OTP
   */
  async requestMobileOTP(
    input: MobileLoginInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<any>> {
    return this.http.post(`${SESSIONS_API}/login_request`, input, options);
  }

  /**
   * Verify mobile OTP
   */
  async verifyMobileOTP(
    input: VerifyMobileInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<LoginResponse>> {
    return this.http.post<LoginResponse>(
      `${SESSIONS_API}/login_request_verification`,
      input,
      options
    );
  }

  /**
   * Passwordless login request via email
   */
  async requestEmailLogin(
    input: EmailLoginRequestInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<any>> {
    return this.http.post(`${USERS_API}/email_login_request`, input, options);
  }

  /**
   * Register new user
   */
  async register(
    input: RegisterInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<User>> {
    return this.http.post<User>(`${USERS_API}/register`, input, options);
  }

  /**
   * Get current user (requires authentication)
   */
  async getCurrentUser(options?: RequestOptions): Promise<SazitoResponse<User>> {
    return this.http.get<User>(`${USERS_API}/current`, options);
  }

  /**
   * Update user profile (requires authentication)
   */
  async updateProfile(
    userId: number,
    data: UpdateProfileInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<User>> {
    return this.http.put<User>(`${USERS_API}/${userId}`, data, options);
  }

  /**
   * Request mobile phone update (requires authentication)
   */
  async requestMobilePhoneUpdate(
    input: UpdateMobilePhoneRequestInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<any>> {
    return this.http.post(`${USERS_API}/update_mobile_phone_request`, input, options);
  }

  /**
   * Verify mobile phone update (requires authentication)
   */
  async verifyMobilePhoneUpdate(
    input: UpdateMobilePhoneVerificationInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<User>> {
    return this.http.post<User>(`${USERS_API}/update_mobile_phone_verification`, input, options);
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(
    input: ForgotPasswordInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<any>> {
    return this.http.post(`${USERS_API}/forgot_password`, input, options);
  }

  /**
   * Revive/Reset password with token
   */
  async revivePassword(
    input: ResetPasswordInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<LoginResponse>> {
    return this.http.post<LoginResponse>(`${USERS_API}/revive_password`, input, options);
  }

  /**
   * Merge guest and current user accounts after login
   */
  async mergeUser(options?: RequestOptions): Promise<SazitoResponse<any>> {
    return this.http.post(`${USERS_API}/merge_user`, {}, options);
  }
}
