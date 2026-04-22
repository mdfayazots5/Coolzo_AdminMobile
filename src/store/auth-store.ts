/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { LocalStorage, StorageKey } from '../core/storage/local-storage';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  OPS_MANAGER = 'OPS_MANAGER',
  OPS_EXECUTIVE = 'OPS_EXECUTIVE',
  SUPPORT = 'SUPPORT',
  TECHNICIAN = 'TECHNICIAN',
  HELPER = 'HELPER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  BILLING_EXECUTIVE = 'BILLING_EXECUTIVE',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  MARKETING_MANAGER = 'MARKETING_MANAGER',
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  permissions?: string[];
  branchId?: number;
  avatar?: string;
  technicianId?: string;
  helperProfileId?: string;
}

export enum AuthStatus {
  UNAUTHENTICATED = 'unauthenticated',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  SESSION_EXPIRED = 'sessionExpired',
  REQUIRES_2FA = 'requires2FA',
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  isInitialized: boolean;
  
  setAuthenticating: () => void;
  setUnauthenticated: () => void;
  setRequires2FA: (user: UserProfile, token: string) => void;
  login: (user: UserProfile, token: string, refreshToken: string) => void;
  logout: () => void;
  setSessionExpired: () => void;
  initialize: () => Promise<void>;
}

const clearAuthStorage = () => {
  LocalStorage.remove(StorageKey.AUTH_TOKEN);
  LocalStorage.remove(StorageKey.REFRESH_TOKEN);
  LocalStorage.remove(StorageKey.USER_ROLE);
  LocalStorage.remove(StorageKey.USER_PROFILE);
  LocalStorage.remove(StorageKey.PERMISSION_SET);
  LocalStorage.remove(StorageKey.PERMISSION_SCOPE);
  LocalStorage.remove(StorageKey.PERMISSION_LOADED_AT);
  LocalStorage.remove(StorageKey.VIEW_AS_ROLE);
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  status: AuthStatus.UNAUTHENTICATED,
  isInitialized: false,

  setAuthenticating: () => set({ status: AuthStatus.AUTHENTICATING }),

  setUnauthenticated: () => set({
    user: null,
    token: null,
    refreshToken: null,
    status: AuthStatus.UNAUTHENTICATED,
  }),

  setRequires2FA: (user, token) => set({ 
    user, 
    token, 
    status: AuthStatus.REQUIRES_2FA 
  }),

  login: (user, token, refreshToken) => {
    LocalStorage.set(StorageKey.AUTH_TOKEN, token);
    LocalStorage.set(StorageKey.REFRESH_TOKEN, refreshToken);
    LocalStorage.set(StorageKey.USER_ROLE, user.role);
    LocalStorage.set(StorageKey.USER_PROFILE, user);
    set({ user, token, refreshToken, status: AuthStatus.AUTHENTICATED });
  },

  logout: () => {
    clearAuthStorage();
    set({ user: null, token: null, refreshToken: null, status: AuthStatus.UNAUTHENTICATED });
  },

  setSessionExpired: () => {
    clearAuthStorage();
    set({ user: null, token: null, refreshToken: null, status: AuthStatus.SESSION_EXPIRED, isInitialized: true });
  },

  initialize: async () => {
    const token = LocalStorage.get<string>(StorageKey.AUTH_TOKEN);
    const refreshToken = LocalStorage.get<string>(StorageKey.REFRESH_TOKEN);
    const user = LocalStorage.get<UserProfile>(StorageKey.USER_PROFILE);
    
    if (token && user) {
      set({ 
        user, 
        token, 
        refreshToken, 
        status: AuthStatus.AUTHENTICATED, 
        isInitialized: true 
      });
    } else {
      set({ isInitialized: true });
    }
  },
}));
