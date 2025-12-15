/**
 * Users API (Authentication and user management)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, User, RequestOptions } from '../types';
import { USERS_API, SESSIONS_API } from '../constants/endpoints';


export interface LoginInput {
  email: string;
  password: string;
  recaptchaToken?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
}

export interface MobileLoginInput {
  mobile: string;
}

export interface VerifyMobileInput {
  mobile: string;
  verificationCode: string;
}

export interface ForgotPasswordInput {
  email: string;
}

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
    mobile: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<any>> {
    return this.http.post(`${SESSIONS_API}/login_request`, { mobile }, options);
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
    data: Partial<User>,
    options?: RequestOptions
  ): Promise<SazitoResponse<User>> {
    return this.http.put<User>(`${USERS_API}/${userId}`, data, options);
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
   */
  async resetPassword(
    input: ResetPasswordInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<LoginResponse>> {
    return this.http.post<LoginResponse>(`${USERS_API}/revive_password`, input, options);
  }

  /**
   * Merge guest data with user account after login
   */
  async mergeData(options?: RequestOptions): Promise<SazitoResponse<any>> {
    return this.http.post(`${USERS_API}/merge_data`, {}, options);
  }
}
