/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDemoMode } from '../config/api-config';
import { apiClient } from './api-client';

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
  type: 'job_report' | 'part_request' | 'feedback';
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed' | 'success';
  data: any;
  retryCount: number;
  errorMessage?: string;
}

export interface SystemRepository {
  getSystemHealth(): Promise<SystemHealth>;
  getPermissions(): Promise<DevicePermission[]>;
  getOfflineQueue(): Promise<OfflineSubmission[]>;
  syncSubmission(id: string): Promise<void>;
  deleteOfflineSubmission(id: string): Promise<void>;
}

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
    return [
      { 
        id: 'sub1', 
        type: 'job_report', 
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), 
        status: 'failed', 
        retryCount: 3,
        errorMessage: 'Network timeout during photo upload',
        data: { srId: 'SR-99281', technicianId: 'tech-1' }
      },
      { 
        id: 'sub2', 
        type: 'part_request', 
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), 
        status: 'pending', 
        retryCount: 0,
        data: { partId: 'P-102', quantity: 2 }
      }
    ];
  }

  async syncSubmission(id: string): Promise<void> {
    console.log(`Syncing submission ${id}...`);
    return new Promise(resolve => setTimeout(resolve, 1500));
  }

  async deleteOfflineSubmission(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
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
    const response = await apiClient.get<OfflineSubmission[]>('/system/offline-queue');
    return response.data;
  }

  async syncSubmission(id: string): Promise<void> {
    await apiClient.post(`/system/sync/${id}`);
  }

  async deleteOfflineSubmission(id: string): Promise<void> {
    await apiClient.delete(`/system/sync/${id}`);
  }
}

export const systemRepository: SystemRepository = isDemoMode()
  ? new MockSystemRepository()
  : new LiveSystemRepository();
