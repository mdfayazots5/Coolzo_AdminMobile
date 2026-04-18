/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnvConfig } from '../config/env';
import { apiClient } from './api-client';

export abstract class RepositoryBase {
  protected get isMock(): boolean {
    return EnvConfig.MOCK_API;
  }

  protected async request<T>(
    call: () => Promise<T>,
    mockData: T
  ): Promise<T> {
    if (this.isMock) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockData;
    }
    return call();
  }
}
