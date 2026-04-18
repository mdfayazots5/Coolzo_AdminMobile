/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum StorageKey {
  AUTH_TOKEN = 'auth_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_PROFILE = 'user_profile',
  APP_THEME = 'app_theme',
  ONBOARDING_COMPLETE = 'onboarding_complete',
}

export const LocalStorage = {
  get: <T>(key: StorageKey): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error reading from localStorage: ${key}`, e);
      return null;
    }
  },

  set: <T>(key: StorageKey, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing to localStorage: ${key}`, e);
    }
  },

  remove: (key: StorageKey): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  },
};
