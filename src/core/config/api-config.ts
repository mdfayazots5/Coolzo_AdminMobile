/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Global API Configuration
 * 
 * DEMO_FLAG:
 * true  -> Use mock/demo data repositories (no network calls)
 * false -> Use live API repositories (production-ready)
 */
export const API_CONFIG = {
  DEMO_FLAG: true, // Set to false for live API integration
  BASE_URL: 'https://api.coolzo.com/v1',
  TIMEOUT: 30000, // 30 seconds
};

export const isDemoMode = () => API_CONFIG.DEMO_FLAG;
