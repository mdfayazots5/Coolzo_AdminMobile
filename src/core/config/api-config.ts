/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnvConfig } from './env';

/**
 * Global API Configuration
 *
 * DEMO_FLAG:
 * true  -> Use mock/demo data repositories (no network calls)
 * false -> Use live API repositories (production-ready)
 */
export const API_CONFIG = {
  DEMO_FLAG: EnvConfig.MOCK_API,
  BASE_URL: EnvConfig.API_BASE_URL,
  TIMEOUT: EnvConfig.TIMEOUT,
};

export const isDemoMode = () => API_CONFIG.DEMO_FLAG;
