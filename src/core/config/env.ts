/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const EnvConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.coolzo.com/v1',
  APP_URL: import.meta.env.VITE_APP_URL || window.location.origin,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true' || import.meta.env.DEV,
  TIMEOUT: 30000,
};
