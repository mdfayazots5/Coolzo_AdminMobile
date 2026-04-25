/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export type AMCStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled' | 'pending_payment';
export type AMCPlanType = 'basic' | 'standard' | 'premium' | 'enterprise';
export type AMCRenewalDisposition = 'renewed' | 'declined' | 'negotiating' | 'pending';

export interface AMCVisit {
  id: string;
  visitNumber: number;
  totalVisits: number;
  scheduledDate: string;
  scheduledSlot: string;
  status: 'pending' | 'scheduled' | 'completed' | 'missed' | 'rescheduled' | 'cancelled';
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  linkedSRId?: string;
  completedAt?: string;
  notes?: string;
  contractId?: string;
  contractNumber?: string;
  customerName?: string;
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
  remainingVisits?: number;
  equipmentIds: string[];
  fee: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  paymentMethod?: string;
  visits: AMCVisit[];
  renewalNotes?: string;
  lastReminderSent?: string;
  contractPdfUrl?: string;
  digitalSignatureUrl?: string;
  renewalDisposition?: AMCRenewalDisposition;
}

export interface AMCDashboardStats {
  activeContracts: number;
  expiringSoon: number;
  cancelledContracts: number;
  newEnrollments: number;
  renewalRate: number;
  revenue: number;
  visitCompletionRate: number;
}

export interface AMCRepository {
  getContracts(filters: any): Promise<AMCContract[]>;
  getContractById(id: string): Promise<AMCContract | null>;
  enrollContract(contract: Partial<AMCContract>): Promise<AMCContract>;
  updateContract(id: string, data: Partial<AMCContract>): Promise<AMCContract>;
  cancelContract(id: string): Promise<void>;
  getVisits(filters: any): Promise<AMCVisit[]>;
  getContractVisits(id: string): Promise<AMCVisit[]>;
  assignVisit(visitId: string, assignedTechnicianId: string, assignedTechnicianName?: string): Promise<AMCVisit>;
  rescheduleVisit(visitId: string, scheduledDate: string, scheduledSlot: string): Promise<AMCVisit>;
  completeVisit(visitId: string, linkedSRId?: string): Promise<AMCVisit>;
  getContractPdfUrl(id: string): Promise<string>;
  getRenewalQueue(): Promise<AMCContract[]>;
  bulkSendRenewalReminders(contractIds: string[]): Promise<void>;
  updateRenewalDisposition(id: string, disposition: AMCRenewalDisposition, renewalNotes?: string): Promise<AMCContract>;
  getAMCDashboardStats(): Promise<AMCDashboardStats>;
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
      renewalDisposition: 'pending',
      contractPdfUrl: '/contracts/amc1.pdf',
      visits: [
        { id: 'v1', visitNumber: 1, totalVisits: 6, scheduledDate: '2024-02-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'completed', assignedTechnicianId: 't1', assignedTechnicianName: 'Suresh Kumar', completedAt: '2024-02-15T11:30:00Z' },
        { id: 'v2', visitNumber: 2, totalVisits: 6, scheduledDate: '2024-04-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'completed', assignedTechnicianId: 't1', assignedTechnicianName: 'Suresh Kumar', completedAt: '2024-04-15T10:45:00Z' },
        { id: 'v3', visitNumber: 3, totalVisits: 6, scheduledDate: '2024-06-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'scheduled', assignedTechnicianId: 't1', assignedTechnicianName: 'Suresh Kumar' },
        { id: 'v4', visitNumber: 4, totalVisits: 6, scheduledDate: '2024-08-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'pending' },
        { id: 'v5', visitNumber: 5, totalVisits: 6, scheduledDate: '2024-10-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'pending' },
        { id: 'v6', visitNumber: 6, totalVisits: 6, scheduledDate: '2024-12-15', scheduledSlot: '10:00 AM - 12:00 PM', status: 'pending' },
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
      renewalDisposition: 'pending',
      contractPdfUrl: '/contracts/amc2.pdf',
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
    return this.contracts.map((contract) => ({
      ...contract,
      remainingVisits: Math.max(contract.totalVisits - contract.completedVisits, 0),
    }));
  }

  async getContractById(id: string) {
    const contract = this.contracts.find(c => c.id === id) || null;
    if (!contract) {
      return null;
    }

    return {
      ...contract,
      remainingVisits: Math.max(contract.totalVisits - contract.completedVisits, 0),
    };
  }

  async enrollContract(contract: Partial<AMCContract>) {
    const totalVisits = contract.totalVisits || 0;
    const startDate = contract.startDate || new Date().toISOString().split('T')[0];
    const newContract = {
      ...contract,
      id: 'amc' + (this.contracts.length + 1),
      contractNumber: `AMC-2026-00${this.contracts.length + 1}`,
      enrollmentDate: new Date().toISOString().split('T')[0],
      completedVisits: 0,
      remainingVisits: totalVisits,
      renewalDisposition: 'pending',
      status: 'active',
      contractPdfUrl: `/contracts/amc${this.contracts.length + 1}.pdf`,
      visits: Array.from({ length: totalVisits }, (_, index) => ({
        id: `v${this.contracts.length + index + 20}`,
        visitNumber: index + 1,
        totalVisits,
        status: 'pending' as const,
        scheduledDate: startDate,
        scheduledSlot: 'Pending assignment',
      })),
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

  async cancelContract(id: string) {
    const contract = this.contracts.find((item) => item.id === id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    contract.status = 'cancelled';
    contract.visits = contract.visits.map((visit) =>
      visit.status === 'completed' ? visit : { ...visit, status: 'cancelled' }
    );
  }

  async getVisits(_filters: any) {
    return this.contracts.flatMap((contract) =>
      contract.visits.map((visit) => ({
        ...visit,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        customerName: contract.customerName,
      }))
    );
  }

  async getContractVisits(id: string) {
    return (await this.getVisits({})).filter((visit) => visit.contractId === id);
  }

  async assignVisit(visitId: string, assignedTechnicianId: string, assignedTechnicianName?: string) {
    for (const contract of this.contracts) {
      const visit = contract.visits.find((item) => item.id === visitId);
      if (visit) {
        visit.assignedTechnicianId = assignedTechnicianId;
        visit.assignedTechnicianName = assignedTechnicianName || 'Assigned Technician';
        visit.status = 'scheduled';
        return visit;
      }
    }

    throw new Error('Visit not found');
  }

  async rescheduleVisit(visitId: string, scheduledDate: string, scheduledSlot: string) {
    for (const contract of this.contracts) {
      const visit = contract.visits.find((item) => item.id === visitId);
      if (visit) {
        visit.scheduledDate = scheduledDate;
        visit.scheduledSlot = scheduledSlot;
        visit.status = 'rescheduled';
        return visit;
      }
    }

    throw new Error('Visit not found');
  }

  async completeVisit(visitId: string, linkedSRId?: string) {
    for (const contract of this.contracts) {
      const visit = contract.visits.find((item) => item.id === visitId);
      if (visit) {
        visit.status = 'completed';
        visit.completedAt = new Date().toISOString();
        visit.linkedSRId = linkedSRId;
        contract.completedVisits = contract.visits.filter((item) => item.status === 'completed').length;
        contract.remainingVisits = Math.max(contract.totalVisits - contract.completedVisits, 0);
        return visit;
      }
    }

    throw new Error('Visit not found');
  }

  async getContractPdfUrl(id: string) {
    const contract = await this.getContractById(id);
    if (!contract?.contractPdfUrl) {
      throw new Error('Contract PDF not found');
    }

    return contract.contractPdfUrl;
  }

  async getRenewalQueue() {
    return this.contracts.filter(c => c.status === 'expiring_soon');
  }

  async bulkSendRenewalReminders(contractIds: string[]) {
    const now = new Date().toISOString();
    this.contracts = this.contracts.map((contract) =>
      contractIds.includes(contract.id) ? { ...contract, lastReminderSent: now } : contract
    );
  }

  async updateRenewalDisposition(id: string, disposition: AMCRenewalDisposition, renewalNotes?: string) {
    const contract = this.contracts.find((item) => item.id === id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    contract.renewalDisposition = disposition;
    contract.renewalNotes = renewalNotes;
    if (disposition === 'renewed') {
      contract.status = 'active';
    }

    return contract;
  }

  async getAMCDashboardStats() {
    return {
      activeContracts: 124,
      cancelledContracts: 3,
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
    const response = await apiClient.get<AMCContract[]>('/api/amc/contracts', { params: filters });
    return response.data;
  }

  async getContractById(id: string) {
    const response = await apiClient.get<AMCContract>(`/api/amc/contracts/${id}`);
    return response.data;
  }

  async enrollContract(contract: Partial<AMCContract>) {
    const response = await apiClient.post<AMCContract>('/api/amc/contracts/enroll', contract);
    return response.data;
  }

  async updateContract(id: string, data: Partial<AMCContract>) {
    const response = await apiClient.put<AMCContract>(`/api/amc/contracts/${id}`, data);
    return response.data;
  }

  async cancelContract(id: string) {
    await apiClient.patch(`/api/amc/contracts/${id}/cancel`);
  }

  async getVisits(filters: any) {
    const response = await apiClient.get<AMCVisit[]>('/api/amc/contracts', { params: filters });
    return response.data;
  }

  async getContractVisits(id: string) {
    const response = await apiClient.get<AMCVisit[]>(`/api/amc/contracts/${id}/visits`);
    return response.data;
  }

  async assignVisit(visitId: string, assignedTechnicianId: string, assignedTechnicianName?: string) {
    const response = await apiClient.patch<AMCVisit>(`/api/amc/visits/${visitId}/assign`, {
      assignedTechnicianId,
      assignedTechnicianName,
    });
    return response.data;
  }

  async rescheduleVisit(visitId: string, scheduledDate: string, scheduledSlot: string) {
    const response = await apiClient.patch<AMCVisit>(`/api/amc/visits/${visitId}/reschedule`, {
      scheduledDate,
      scheduledSlot,
    });
    return response.data;
  }

  async completeVisit(visitId: string, linkedSRId?: string) {
    const response = await apiClient.patch<AMCVisit>(`/api/amc/visits/${visitId}/complete`, {
      linkedSRId,
    });
    return response.data;
  }

  async getContractPdfUrl(id: string) {
    const response = await apiClient.get<{ url: string } | string>(`/api/amc/contracts/${id}/pdf`);
    return typeof response.data === 'string' ? response.data : response.data.url;
  }

  async getRenewalQueue() {
    const response = await apiClient.get<AMCContract[]>('/api/amc/renewals');
    return response.data;
  }

  async bulkSendRenewalReminders(contractIds: string[]) {
    await apiClient.post('/api/amc/renewals/bulk-remind', { contractIds });
  }

  async updateRenewalDisposition(id: string, disposition: AMCRenewalDisposition, renewalNotes?: string) {
    const response = await apiClient.put<AMCContract>(`/api/amc/contracts/${id}`, {
      renewalDisposition: disposition,
      renewalNotes,
    });
    return response.data;
  }

  async getAMCDashboardStats() {
    const response = await apiClient.get<AMCDashboardStats>('/api/amc/performance-dashboard');
    return response.data;
  }
}

export const amcRepository: AMCRepository = isDemoMode()
  ? new MockAMCRepository()
  : new LiveAMCRepository();
