/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';
import { API_CONFIG } from '../config/api-config';
import { LocalStorage, StorageKey } from '../storage/local-storage';
import { useAuthStore } from '@/store/auth-store';
import { BackendAuthTokenResponse, mapBackendCurrentUser } from '../auth/auth-session';

interface ApiEnvelope<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  data: T;
  errors?: unknown[];
}

interface PagedPayload<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

type RefreshableRequest = {
  _retryCount?: number;
  _skipAuthRefresh?: boolean;
};

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<BackendAuthTokenResponse | null> | null = null;

const handleSessionExpiry = () => {
  useAuthStore.getState().setSessionExpired();
  if (window.location.pathname !== '/session-expired') {
    window.location.assign('/session-expired');
  }
};

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = LocalStorage.get<string>(StorageKey.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const viewAsRole = LocalStorage.get<{ roleName?: string; displayName?: string }>(StorageKey.VIEW_AS_ROLE);
    if (viewAsRole?.roleName) {
      config.headers['X-Coolzo-View-As-Role'] = viewAsRole.roleName;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const isApiEnvelope = <T>(payload: unknown): payload is ApiEnvelope<T> => {
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    'isSuccess' in payload &&
    'data' in payload
  );
};

const isPagedPayload = <T>(payload: unknown): payload is PagedPayload<T> => {
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    'items' in payload &&
    'totalCount' in payload &&
    'pageNumber' in payload &&
    'pageSize' in payload
  );
};

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (isApiEnvelope(response.data)) {
      if (!response.data.isSuccess) {
        return Promise.reject(response.data);
      }

      response.data = isPagedPayload(response.data.data)
        ? response.data.data.items
        : response.data.data;
    }

    return response;
  },
  async (error) => {
    const request = error.config as typeof error.config & RefreshableRequest;

    if (
      error.response?.status !== 401 ||
      !request ||
      request._skipAuthRefresh ||
      request.url?.includes('/api/auth/login') ||
      request.url?.includes('/api/auth/refresh') ||
      request.url?.includes('/api/auth/refresh-token')
    ) {
      return Promise.reject(error);
    }

    request._retryCount = (request._retryCount || 0) + 1;

    if (request._retryCount > 3) {
      handleSessionExpiry();
      return Promise.reject(error);
    }

    const accessToken = LocalStorage.get<string>(StorageKey.AUTH_TOKEN);
    const refreshToken = LocalStorage.get<string>(StorageKey.REFRESH_TOKEN);

    if (!accessToken || !refreshToken) {
      handleSessionExpiry();
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = axios.post(
        `${API_CONFIG.BASE_URL}/api/auth/refresh-token`,
        { accessToken, refreshToken },
        {
          timeout: API_CONFIG.TIMEOUT,
          headers: { 'Content-Type': 'application/json' },
        }
      )
        .then((response) => {
          const payload = isApiEnvelope<BackendAuthTokenResponse>(response.data)
            ? response.data.data
            : response.data;

          if (!payload) {
            return null;
          }

          const user = mapBackendCurrentUser(payload.currentUser);
          LocalStorage.set(StorageKey.AUTH_TOKEN, payload.accessToken);
          LocalStorage.set(StorageKey.REFRESH_TOKEN, payload.refreshToken);
          LocalStorage.set(StorageKey.USER_PROFILE, user);
          useAuthStore.getState().login(user, payload.accessToken, payload.refreshToken);

          return payload;
        })
        .catch(() => {
          handleSessionExpiry();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const refreshed = await refreshPromise;
    if (!refreshed) {
      return Promise.reject(error);
    }

    request.headers = request.headers || {};
    request.headers.Authorization = `Bearer ${refreshed.accessToken}`;

    return apiClient(request);
  }
);
