/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const EnvConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5217',
  APP_URL: import.meta.env.VITE_APP_URL || window.location.origin,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
  TIMEOUT: 30000,
};
