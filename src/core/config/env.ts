/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

function normalizeApiOrigin(rawValue?: string) {
  const fallbackOrigin = 'https://localhost:44394';
  return (rawValue || fallbackOrigin).trim().replace(/\/+$/, '').replace(/\/api\/v1$/i, '');
}

export const EnvConfig = {
  API_BASE_URL: normalizeApiOrigin(import.meta.env.VITE_API_BASE_URL),
  APP_URL: import.meta.env.VITE_APP_URL || window.location.origin,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
  TIMEOUT: 30000,
};
