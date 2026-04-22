/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum StorageKey {
  AUTH_TOKEN = 'auth_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_ROLE = 'user_role',
  USER_PROFILE = 'user_profile',
  PERMISSION_SET = 'permission_set',
  PERMISSION_SCOPE = 'permission_scope',
  PERMISSION_LOADED_AT = 'permission_loaded_at',
  VIEW_AS_ROLE = 'view_as_role',
  MASTER_DATA_CACHE = 'master_data_cache',
  MASTER_DATA_LOADED_AT = 'master_data_loaded_at',
  CONFIGURATION_CACHE = 'configuration_cache',
  CONFIGURATION_LOADED_AT = 'configuration_loaded_at',
  FIELD_JOB_CACHE = 'field_job_cache',
  FIELD_JOB_LIST_CACHE = 'field_job_list_cache',
  FIELD_TECHNICIAN_ATTENDANCE = 'field_technician_attendance',
  FIELD_HELPER_ASSIGNMENT = 'field_helper_assignment',
  FIELD_HELPER_ATTENDANCE = 'field_helper_attendance',
  FIELD_OFFLINE_QUEUE = 'field_offline_queue',
  SYSTEM_OFFLINE_QUEUE = 'system_offline_queue',
  SYSTEM_LAST_SYNC_AT = 'system_last_sync_at',
  SYSTEM_PENDING_ROUTE = 'system_pending_route',
  SYSTEM_PENDING_PUSH = 'system_pending_push',
  SYSTEM_LAST_BACKGROUND_AT = 'system_last_background_at',
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
