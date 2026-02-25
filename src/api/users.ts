/**
 * Users API (Authentication and user management)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, User, RequestOptions } from '../types';
import { USERS_API, SESSIONS_API } from '../constants/endpoints';
import { transformUserResponse } from '../utils/transformers';

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

  private normalizeUserResponse(response: SazitoResponse<User>): SazitoResponse<User> {
    if (!response.data) {
      return response;
    }

    const normalized = transformUserResponse(response.data) as User | undefined;
    return normalized ? { data: normalized } : response;
  }

  private normalizeLoginResponse(response: SazitoResponse<LoginResponse>): SazitoResponse<LoginResponse> {
    if (!response.data || !response.data.user) {
      return response;
    }

    const normalizedUser = transformUserResponse(response.data.user) as User | undefined;
    if (!normalizedUser) {
      return response;
    }

    return {
      data: {
        ...response.data,
        user: normalizedUser
      }
    };
  }

  /**
   * Login with email and password
   */
  async login(
    input: LoginInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<LoginResponse>> {
    const response = await this.http.post<LoginResponse>(`${SESSIONS_API}/login`, input, options);
    return this.normalizeLoginResponse(response);
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
    const response = await this.http.post<LoginResponse>(
      `${SESSIONS_API}/login_request_verification`,
      input,
      options
    );

    return this.normalizeLoginResponse(response);
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
    const response = await this.http.post<User>(`${USERS_API}/register`, input, options);
    return this.normalizeUserResponse(response);
  }

  /**
   * Get current user (requires authentication)
   */
  async getCurrentUser(options?: RequestOptions): Promise<SazitoResponse<User>> {
    const response = await this.http.get<User>(`${USERS_API}/current`, options);
    return this.normalizeUserResponse(response);
  }

  /**
   * Update user profile (requires authentication)
   */
  async updateProfile(
    userId: number,
    data: UpdateProfileInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<User>> {
    const response = await this.http.put<User>(`${USERS_API}/${userId}`, data, options);
    return this.normalizeUserResponse(response);
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
    const response = await this.http.post<User>(`${USERS_API}/update_mobile_phone_verification`, input, options);
    return this.normalizeUserResponse(response);
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
    const response = await this.http.post<LoginResponse>(`${USERS_API}/revive_password`, input, options);
    return this.normalizeLoginResponse(response);
  }

  /**
   * Merge guest and current user accounts after login
   */
  async mergeUser(options?: RequestOptions): Promise<SazitoResponse<any>> {
    return this.http.post(`${USERS_API}/merge_user`, {}, options);
  }
}
