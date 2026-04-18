/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, UserProfile } from "../../store/auth-store";
import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
  requires2FA?: boolean;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthResponse>;
  loginField(employeeId: string, pin: string): Promise<AuthResponse>;
  verifyOTP(email: string, otp: string): Promise<AuthResponse>;
  refreshToken(token: string): Promise<AuthResponse>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
  getUserProfile(): Promise<UserProfile>;
}

export class MockAuthRepository implements AuthRepository {
  async login(email: string, _password: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock logic: Super Admin and Finance require 2FA
    if (email.includes('admin') || email.includes('finance')) {
      return {
        user: { id: '1', name: 'Admin User', email, role: UserRole.SUPER_ADMIN },
        token: 'mock_token',
        refreshToken: 'mock_refresh',
        requires2FA: true
      };
    }

    return {
      user: { id: '2', name: 'Ops User', email, role: UserRole.OPS_MANAGER },
      token: 'mock_token',
      refreshToken: 'mock_refresh'
    };
  }

  async loginField(employeeId: string, _pin: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      user: { id: '3', name: 'Tech User', email: `${employeeId}@coolzo.com`, role: UserRole.TECHNICIAN },
      token: 'mock_token',
      refreshToken: 'mock_refresh'
    };
  }

  async verifyOTP(email: string, _otp: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      user: { id: '1', name: 'Admin User', email: email || 'admin@coolzo.com', role: UserRole.SUPER_ADMIN },
      token: 'mock_token_verified',
      refreshToken: 'mock_refresh'
    };
  }

  async refreshToken(_token: string): Promise<AuthResponse> {
    return {
      user: { id: '1', name: 'Admin User', email: 'admin@coolzo.com', role: UserRole.SUPER_ADMIN },
      token: 'mock_token_refreshed',
      refreshToken: 'mock_refresh_new'
    };
  }

  async forgotPassword(_email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  async resetPassword(_token: string, _password: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  async getUserProfile(): Promise<UserProfile> {
    return {
      id: '1',
      name: 'Admin User',
      email: 'admin@coolzo.com',
      role: UserRole.SUPER_ADMIN,
    };
  }
}

export class LiveAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  }

  async loginField(employeeId: string, pin: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login-field', { employeeId, pin });
    return response.data;
  }

  async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', { email, otp });
    return response.data;
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh-token', { token });
    return response.data;
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  }

  async getUserProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/users/me');
    return response.data;
  }
}

export const authRepository: AuthRepository = isDemoMode() 
  ? new MockAuthRepository() 
  : new LiveAuthRepository();
