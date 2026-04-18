/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export type AMCStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled' | 'pending_payment';
export type AMCPlanType = 'basic' | 'standard' | 'premium' | 'enterprise';

export interface AMCVisit {
  id: string;
  visitNumber: number;
  totalVisits: number;
  scheduledDate: string;
  scheduledSlot: string;
  status: 'scheduled' | 'completed' | 'missed' | 'rescheduled';
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  linkedSRId?: string;
  completedAt?: string;
  notes?: string;
}

export interface AMCContract {
  id: string;
  contractNumber: string;
  status: AMCStatus;
  planType: AMCPlanType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  enrollmentDate: string;
  enrolledBy: string;
  totalVisits: number;
  completedVisits: number;
  equipmentIds: string[];
  fee: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  paymentMethod?: string;
  visits: AMCVisit[];
  renewalNotes?: string;
  lastReminderSent?: string;
}

export interface AMCRepository {
  getContracts(filters: any): Promise<AMCContract[]>;
  getContractById(id: string): Promise<AMCContract | null>;
  createContract(contract: Partial<AMCContract>): Promise<AMCContract>;
  updateContract(id: string, data: Partial<AMCContract>): Promise<AMCContract>;
  getVisits(filters: any): Promise<AMCVisit[]>;
  getRenewalQueue(): Promise<AMCContract[]>;
  getAMCDashboardStats(): Promise<any>;
}

export class MockAMCRepository implements AMCRepository {
  private contracts: AMCContract[] = [
    {
      id: 'amc1',
      contractNumber: 'AMC-2024-001',
      status: 'active',
      planType: 'premium',
      customerId: 'c1',
      customerName: 'Rajesh Kumar',
      customerPhone: '+91 98200 12345',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      enrollmentDate: '2023-12-25',
      enrolledBy: 'Priya Singh',
      totalVisits: 6,
      completedVisits: 2,
      equipmentIds: ['eq1', 'eq2'],
      fee: 12500,
      paymentStatus: 'paid',
      paymentMethod: 'Online',
      visits: [
        { id: 'v1', visitNumber: 1, totalVisits: 6, scheduledDate: '2024-02-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'completed', assignedTechnicianId: 't1', assignedTechnicianName: 'Suresh Kumar', completedAt: '2024-02-15T11:30:00Z' },
        { id: 'v2', visitNumber: 2, totalVisits: 6, scheduledDate: '2024-04-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'completed', assignedTechnicianId: 't1', assignedTechnicianName: 'Suresh Kumar', completedAt: '2024-04-15T10:45:00Z' },
        { id: 'v3', visitNumber: 3, totalVisits: 6, scheduledDate: '2024-06-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'scheduled', assignedTechnicianId: 't1', assignedTechnicianName: 'Suresh Kumar' },
        { id: 'v4', visitNumber: 4, totalVisits: 6, scheduledDate: '2024-08-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'scheduled' },
        { id: 'v5', visitNumber: 5, totalVisits: 6, scheduledDate: '2024-10-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'scheduled' },
        { id: 'v6', visitNumber: 6, totalVisits: 6, scheduledDate: '2024-12-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'scheduled' },
      ]
    },
    {
      id: 'amc2',
      contractNumber: 'AMC-2024-002',
      status: 'expiring_soon',
      planType: 'standard',
      customerId: 'c3',
      customerName: 'Anjali Sharma',
      customerPhone: '+91 98111 22233',
      startDate: '2023-05-15',
      endDate: '2024-05-14',
      enrollmentDate: '2023-05-10',
      enrolledBy: 'Rahul Sharma',
      totalVisits: 4,
      completedVisits: 3,
      equipmentIds: ['eq3'],
      fee: 4500,
      paymentStatus: 'paid',
      visits: [
        { id: 'v7', visitNumber: 1, totalVisits: 4, scheduledDate: '2023-08-15', scheduledSlot: '02:00 PM - 04:00 PM', status: 'completed' },
        { id: 'v8', visitNumber: 2, totalVisits: 4, scheduledDate: '2023-11-15', scheduledSlot: '02:00 PM - 04:00 PM', status: 'completed' },
        { id: 'v9', visitNumber: 3, totalVisits: 4, scheduledDate: '2024-02-15', scheduledSlot: '02:00 PM - 04:00 PM', status: 'completed' },
        { id: 'v10', visitNumber: 4, totalVisits: 4, scheduledDate: '2024-05-10', scheduledSlot: '02:00 PM - 04:00 PM', status: 'scheduled' },
      ]
    }
  ];

  async getContracts(_filters: any) {
    await new Promise(r => setTimeout(r, 500));
    return this.contracts;
  }

  async getContractById(id: string) {
    return this.contracts.find(c => c.id === id) || null;
  }

  async createContract(contract: Partial<AMCContract>) {
    const newContract = {
      ...contract,
      id: 'amc' + (this.contracts.length + 1),
      contractNumber: `AMC-2024-00${this.contracts.length + 1}`,
      enrollmentDate: new Date().toISOString().split('T')[0],
      completedVisits: 0,
      visits: [] // In real app, auto-generate based on plan
    } as AMCContract;
    this.contracts.push(newContract);
    return newContract;
  }

  async updateContract(id: string, data: Partial<AMCContract>) {
    const i = this.contracts.findIndex(c => c.id === id);
    if (i !== -1) {
      this.contracts[i] = { ...this.contracts[i], ...data };
      return this.contracts[i];
    }
    throw new Error('Contract not found');
  }

  async getVisits(_filters: any) {
    return this.contracts.flatMap(c => c.visits);
  }

  async getRenewalQueue() {
    return this.contracts.filter(c => c.status === 'expiring_soon');
  }

  async getAMCDashboardStats() {
    return {
      activeContracts: 124,
      expiringSoon: 12,
      newEnrollments: 18,
      renewalRate: 85,
      revenue: 450000,
      visitCompletionRate: 92
    };
  }
}

export class LiveAMCRepository implements AMCRepository {
  async getContracts(filters: any) {
    const response = await apiClient.get<AMCContract[]>('/api/v1/amc/contracts', { params: filters });
    return response.data;
  }

  async getContractById(id: string) {
    const response = await apiClient.get<AMCContract>(`/api/v1/amc/contracts/${id}`);
    return response.data;
  }

  async createContract(contract: Partial<AMCContract>) {
    const response = await apiClient.post<AMCContract>('/api/v1/amc/contracts', contract);
    return response.data;
  }

  async updateContract(id: string, data: Partial<AMCContract>) {
    const response = await apiClient.patch<AMCContract>(`/api/v1/amc/contracts/${id}`, data);
    return response.data;
  }

  async getVisits(filters: any) {
    const response = await apiClient.get<AMCVisit[]>('/api/v1/amc/visits', { params: filters });
    return response.data;
  }

  async getRenewalQueue() {
    const response = await apiClient.get<AMCContract[]>('/api/v1/amc/renewal-queue');
    return response.data;
  }

  async getAMCDashboardStats() {
    const response = await apiClient.get('/api/v1/amc/stats');
    return response.data;
  }
}

export const amcRepository: AMCRepository = isDemoMode()
  ? new MockAMCRepository()
  : new LiveAMCRepository();
