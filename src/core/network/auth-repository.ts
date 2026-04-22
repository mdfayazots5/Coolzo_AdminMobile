/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, UserProfile } from "../../store/auth-store";
import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";
import {
  BackendAuthTokenResponse,
  BackendCurrentUser,
  BackendPermissionSnapshot,
  BackendViewAsRoleResponse,
  ViewAsRoleSession,
  buildPermissionSet,
  buildPermissionSetFromSnapshot,
  mapBackendAuthResponse,
  mapBackendCurrentUser,
} from "../auth/auth-session";
import { PermissionSet } from "../auth/rbac-engine";

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
  requires2FA?: boolean;
}

export interface PermissionSnapshot {
  permissionSet: PermissionSet;
  rawPermissions: string[];
  dataScope: string;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthResponse>;
  loginWithOtp(loginId: string, otp: string): Promise<AuthResponse>;
  loginField(employeeId: string, pin: string): Promise<AuthResponse>;
  verifyOTP(email: string, otp: string): Promise<AuthResponse>;
  refreshToken(accessToken: string, refreshToken: string): Promise<AuthResponse>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
  logout(refreshToken: string): Promise<void>;
  forceLogout(userId: string): Promise<void>;
  getUserProfile(): Promise<UserProfile>;
  getPermissionSnapshot(user: UserProfile): Promise<PermissionSnapshot>;
  viewAsRole(roleId: string): Promise<ViewAsRoleSession>;
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

  async loginWithOtp(loginId: string, _otp: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      user: { id: '1', name: 'Admin User', email: loginId || 'admin@coolzo.com', role: UserRole.SUPER_ADMIN },
      token: 'mock_token_verified',
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

  async refreshToken(_accessToken: string, _refreshToken: string): Promise<AuthResponse> {
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

  async logout(_refreshToken: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async forceLogout(_userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async getUserProfile(): Promise<UserProfile> {
    return {
      id: '1',
      name: 'Admin User',
      email: 'admin@coolzo.com',
      role: UserRole.SUPER_ADMIN,
      permissions: ['dashboard.read', 'user.read', 'role.read', 'configuration.manage'],
    };
  }

  async getPermissionSnapshot(user: UserProfile): Promise<PermissionSnapshot> {
    return {
      permissionSet: buildPermissionSet(user.permissions || [], user.role),
      rawPermissions: user.permissions || [],
      dataScope: 'All',
    };
  }

  async viewAsRole(roleId: string): Promise<ViewAsRoleSession> {
    const permissionSet = buildPermissionSet([], UserRole.OPS_MANAGER);

    return {
      roleId,
      roleName: 'OperationsManager',
      displayName: 'Operations Manager',
      permissionSet,
      rawPermissions: [],
      dataScope: 'All',
      startedAt: Date.now(),
    };
  }
}

export class LiveAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<BackendAuthTokenResponse>('/api/v1/auth/login', {
      userNameOrEmail: email,
      password,
    });
    return mapBackendAuthResponse(response.data);
  }

  async loginField(employeeId: string, pin: string): Promise<AuthResponse> {
    const response = await apiClient.post<BackendAuthTokenResponse>('/api/v1/auth/login-field', { employeeId, pin });
    return mapBackendAuthResponse(response.data);
  }

  async loginWithOtp(loginId: string, otp: string): Promise<AuthResponse> {
    const response = await apiClient.post<BackendAuthTokenResponse>('/api/v1/auth/login-otp', { loginId, otp });
    return mapBackendAuthResponse(response.data);
  }

  async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
    const response = await apiClient.post<BackendAuthTokenResponse>('/api/v1/auth/verify-otp', { email, otp });
    return mapBackendAuthResponse(response.data);
  }

  async refreshToken(accessToken: string, refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<BackendAuthTokenResponse>('/api/v1/auth/refresh-token', {
      accessToken,
      refreshToken,
    });
    return mapBackendAuthResponse(response.data);
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/api/v1/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/api/v1/auth/reset-password', { token, password });
  }

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/api/v1/auth/logout', { refreshToken });
  }

  async forceLogout(userId: string): Promise<void> {
    await apiClient.post(`/api/v1/auth/force-logout/${userId}`);
  }

  async getUserProfile(): Promise<UserProfile> {
    const response = await apiClient.get<{ currentUser?: BackendAuthTokenResponse["currentUser"] } & BackendCurrentUser>('/api/v1/auth/me');
    return mapBackendCurrentUser((response.data as BackendCurrentUser));
  }

  async getPermissionSnapshot(user: UserProfile): Promise<PermissionSnapshot> {
    const response = await apiClient.get<BackendPermissionSnapshot>('/api/v1/auth/me/permissions');

    return {
      permissionSet: buildPermissionSetFromSnapshot(response.data, user.role),
      rawPermissions: response.data.permissions || [],
      dataScope: response.data.dataScope || 'All',
    };
  }

  async viewAsRole(roleId: string): Promise<ViewAsRoleSession> {
    const response = await apiClient.post<BackendViewAsRoleResponse>('/api/v1/admin/view-as-role', {
      roleId: Number(roleId),
    });

    return {
      roleId: String(response.data.roleId),
      roleName: response.data.roleName,
      displayName: response.data.displayName,
      permissionSet: buildPermissionSetFromSnapshot(response.data, undefined),
      rawPermissions: response.data.permissions || [],
      dataScope: response.data.dataScope || 'All',
      startedAt: Date.now(),
    };
  }
}

export const authRepository: AuthRepository = isDemoMode() 
  ? new MockAuthRepository() 
  : new LiveAuthRepository();
