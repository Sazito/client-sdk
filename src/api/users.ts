/**
 * Users API (Authentication and user management)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, User, RequestOptions } from '../types';
import { USERS_API, SESSIONS_API } from '../constants/endpoints';
import { transformRequestKeys } from '../utils/transformers';

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
  mobile?: string;
}

/**
 * Mobile login input
 */
export interface MobileLoginInput {
  mobile: string;
}

/**
 * Verify mobile OTP input (SDK uses camelCase)
 */
export interface VerifyMobileInput {
  mobile: string;
  verificationCode: string;
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

export interface LoginResponse {
  jwt: string;
  user?: User;
}

export class UsersAPI {
  constructor(private http: HttpClient) {}

  /**
   * Login with email and password
   * Automatically transforms camelCase input to snake_case for API
   */
  async login(
    input: LoginInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<LoginResponse>> {
    const transformedInput = transformRequestKeys(input);
    return this.http.post<LoginResponse>(`${SESSIONS_API}/login`, transformedInput, options);
  }

  /**
   * Request mobile OTP
   */
  async requestMobileOTP(
    mobile: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<any>> {
    return this.http.post(`${SESSIONS_API}/login_request`, { mobile }, options);
  }

  /**
   * Verify mobile OTP
   * Automatically transforms camelCase input to snake_case for API
   */
  async verifyMobileOTP(
    input: VerifyMobileInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<LoginResponse>> {
    const transformedInput = transformRequestKeys(input);
    return this.http.post<LoginResponse>(
      `${SESSIONS_API}/login_request_verification`,
      transformedInput,
      options
    );
  }

  /**
   * Register new user
   * Automatically transforms camelCase input to snake_case for API
   */
  async register(
    input: RegisterInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<User>> {
    const transformedInput = transformRequestKeys(input);
    return this.http.post<User>(`${USERS_API}/register`, transformedInput, options);
  }

  /**
   * Get current user (requires authentication)
   */
  async getCurrentUser(options?: RequestOptions): Promise<SazitoResponse<User>> {
    return this.http.get<User>(`${USERS_API}/current`, options);
  }

  /**
   * Update user profile (requires authentication)
   * Automatically transforms camelCase input to snake_case for API
   */
  async updateProfile(
    userId: number,
    data: Partial<User>,
    options?: RequestOptions
  ): Promise<SazitoResponse<User>> {
    const transformedData = transformRequestKeys(data);
    return this.http.put<User>(`${USERS_API}/${userId}`, transformedData, options);
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(
    email: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<any>> {
    return this.http.post(`${USERS_API}/forgot_password`, { email }, options);
  }

  /**
   * Reset password with token
   * Automatically transforms camelCase input to snake_case for API
   */
  async resetPassword(
    input: ResetPasswordInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<LoginResponse>> {
    const transformedInput = transformRequestKeys(input);
    return this.http.post<LoginResponse>(`${USERS_API}/revive_password`, transformedInput, options);
  }

  /**
   * Merge guest data with user account after login
   */
  async mergeData(options?: RequestOptions): Promise<SazitoResponse<any>> {
    return this.http.post(`${USERS_API}/merge_data`, {}, options);
  }
}
