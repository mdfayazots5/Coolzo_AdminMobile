/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDemoMode } from '../config/api-config';
import { apiClient } from './api-client';
import { LocalStorage, StorageKey } from '../storage/local-storage';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: string;
  version: string;
  minSupportedVersion: string;
  lastSync: string;
  activeUsers: number;
  apiLatency: number;
  errorRate: number;
}

export interface DevicePermission {
  id: string;
  name: string;
  description: string;
  status: 'granted' | 'denied' | 'prompt';
  isRequired: boolean;
}

export interface OfflineSubmission {
  id: string;
  type: 'job_report' | 'part_request' | 'feedback' | 'estimate' | 'job_photo' | 'job_signature' | 'job_payment' | 'field_arrive' | 'field_depart' | 'field_progress' | 'attendance_check_in' | 'attendance_check_out';
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed' | 'success';
  body: Record<string, unknown>;
  data: any;
  localFilePaths: string[];
  retryCount: number;
  nextRetryAt?: string;
  errorMessage?: string;
  idempotencyKey: string;
  requiresConflictResolution?: boolean;
}

export interface SystemRepository {
  getSystemHealth(): Promise<SystemHealth>;
  getPermissions(): Promise<DevicePermission[]>;
  getOfflineQueue(): Promise<OfflineSubmission[]>;
  syncSubmission(id: string): Promise<OfflineSubmission | null>;
  deleteOfflineSubmission(id: string): Promise<void>;
  getPendingSyncCount(): Promise<number>;
}

const buildInitialQueue = (): OfflineSubmission[] => [
  {
    id: 'sub1',
    type: 'job_report',
    endpoint: '/api/job-reports',
    method: 'POST',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'failed',
    retryCount: 3,
    nextRetryAt: new Date(Date.now() + 1000 * 60 * 2).toISOString(),
    errorMessage: 'Network timeout during photo upload',
    body: { srId: 'SR-99281', technicianId: 'tech-1' },
    data: { srId: 'SR-99281', technicianId: 'tech-1' },
    localFilePaths: ['/offline/jobs/SR-99281/photo-1.jpg'],
    idempotencyKey: 'sync-job-report-sub1',
  },
  {
    id: 'sub2',
    type: 'part_request',
    endpoint: '/api/inventory/parts-requests',
    method: 'POST',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'pending',
    retryCount: 0,
    body: { partId: 'P-102', quantity: 2 },
    data: { partId: 'P-102', quantity: 2 },
    localFilePaths: [],
    idempotencyKey: 'sync-part-request-sub2',
    requiresConflictResolution: true,
  },
];

const readQueue = (): OfflineSubmission[] => {
  const stored = LocalStorage.get<OfflineSubmission[]>(StorageKey.SYSTEM_OFFLINE_QUEUE);
  if (stored && stored.length > 0) {
    return stored;
  }

  const seed = buildInitialQueue();
  LocalStorage.set(StorageKey.SYSTEM_OFFLINE_QUEUE, seed);
  return seed;
};

const writeQueue = (queue: OfflineSubmission[]) => {
  LocalStorage.set(StorageKey.SYSTEM_OFFLINE_QUEUE, queue);
};

export class MockSystemRepository implements SystemRepository {
  async getSystemHealth(): Promise<SystemHealth> {
    return {
      status: 'healthy',
      uptime: '99.98%',
      version: '1.2.0',
      minSupportedVersion: '1.0.0',
      lastSync: new Date().toISOString(),
      activeUsers: 142,
      apiLatency: 124, // ms
      errorRate: 0.02 // %
    };
  }

  async getPermissions(): Promise<DevicePermission[]> {
    return [
      { id: 'loc', name: 'Location', description: 'Required for GPS check-in and route optimization', status: 'granted', isRequired: true },
      { id: 'cam', name: 'Camera', description: 'Used for capturing job photos and scanning parts', status: 'granted', isRequired: true },
      { id: 'notif', name: 'Push Notifications', description: 'Real-time alerts for new jobs and SLA breaches', status: 'prompt', isRequired: true },
      { id: 'storage', name: 'Storage', description: 'Required for downloading reports and caching data', status: 'denied', isRequired: false }
    ];
  }

  async getOfflineQueue(): Promise<OfflineSubmission[]> {
    return readQueue();
  }

  async syncSubmission(id: string): Promise<OfflineSubmission | null> {
    const queue = readQueue();
    const current = queue.find((item) => item.id === id);
    if (!current) {
      return null;
    }

    if (current.requiresConflictResolution) {
      const failed = {
        ...current,
        status: 'failed' as const,
        retryCount: Math.min(current.retryCount + 1, 5),
        errorMessage: 'Conflict detected: SR status changed while offline',
        nextRetryAt: new Date(Date.now() + 1000 * 60 * Math.max(1, current.retryCount + 1)).toISOString(),
      };
      writeQueue(queue.map((item) => (item.id === id ? failed : item)));
      return failed;
    }

    const remaining = queue.filter((item) => item.id !== id);
    writeQueue(remaining);
    LocalStorage.set(StorageKey.SYSTEM_LAST_SYNC_AT, new Date().toISOString());
    return { ...current, status: 'success' };
  }

  async deleteOfflineSubmission(id: string): Promise<void> {
    writeQueue(readQueue().filter((item) => item.id !== id));
  }

  async getPendingSyncCount(): Promise<number> {
    return readQueue().filter((item) => item.status !== 'success').length;
  }
}

export class LiveSystemRepository implements SystemRepository {
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get<SystemHealth>('/system/health');
    return response.data;
  }

  async getPermissions(): Promise<DevicePermission[]> {
    const response = await apiClient.get<DevicePermission[]>('/system/permissions');
    return response.data;
  }

  async getOfflineQueue(): Promise<OfflineSubmission[]> {
    return readQueue();
  }

  async syncSubmission(id: string): Promise<OfflineSubmission | null> {
    const queue = readQueue();
    const current = queue.find((item) => item.id === id);
    if (!current) {
      return null;
    }

    if (!navigator.onLine) {
      const failed = {
        ...current,
        status: 'failed' as const,
        retryCount: Math.min(current.retryCount + 1, 5),
        errorMessage: 'Device is offline. Retry when connectivity is restored.',
        nextRetryAt: new Date(Date.now() + 1000 * 60 * Math.max(1, current.retryCount + 1)).toISOString(),
      };
      writeQueue(queue.map((item) => (item.id === id ? failed : item)));
      return failed;
    }

    const remaining = queue.filter((item) => item.id !== id);
    writeQueue(remaining);
    LocalStorage.set(StorageKey.SYSTEM_LAST_SYNC_AT, new Date().toISOString());
    return { ...current, status: 'success' };
  }

  async deleteOfflineSubmission(id: string): Promise<void> {
    writeQueue(readQueue().filter((item) => item.id !== id));
  }

  async getPendingSyncCount(): Promise<number> {
    return readQueue().filter((item) => item.status !== 'success').length;
  }
}

export const systemRepository: SystemRepository = isDemoMode()
  ? new MockSystemRepository()
  : new LiveSystemRepository();
