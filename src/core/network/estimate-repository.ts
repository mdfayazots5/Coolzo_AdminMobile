/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EstimateStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type WorkOrderStatus = 'open' | 'in-progress' | 'completed' | 'cancelled';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'labor' | 'part';
}

export interface EstimateApprovalEvent {
  id: string;
  actorName: string;
  action: 'created' | 'sent' | 'approved' | 'rejected' | 'override_approved' | 'resent';
  timestamp: string;
  note?: string;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  srId: string;
  srNumber: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  technicianName: string;
  status: EstimateStatus;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  expiryAt?: string;
  respondedAt?: string;
  sentAt?: string;
  channel: 'WhatsApp' | 'App' | 'Email';
  notes?: string;
  workOrderId?: string;
  customerResponse?: 'approve' | 'reject' | 'pending';
  requiresCorporateApproval?: boolean;
  qualityFlag?: 'low_response' | 'high_value' | 'none';
  approvalHistory?: EstimateApprovalEvent[];
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  srId: string;
  srNumber: string;
  estimateId: string;
  estimateNumber: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  technicianName: string;
  status: WorkOrderStatus;
  lineItems: LineItem[];
  totalValue: number;
  createdAt: string;
  completedAt?: string;
  partsIssuedStatus: 'pending' | 'partially_issued' | 'fully_issued';
  invoiceId?: string;
  approvalTimeline?: EstimateApprovalEvent[];
}

export interface EstimateRepository {
  getEstimates(filters: any): Promise<Estimate[]>;
  getEstimateById(id: string): Promise<Estimate | null>;
  createEstimate(estimate: Partial<Estimate>): Promise<Estimate>;
  sendEstimate(id: string): Promise<void>;
  resendEstimate(id: string): Promise<void>;
  updateEstimateStatus(id: string, status: 'approved' | 'rejected', reason?: string): Promise<void>;
  overrideApproveEstimate(id: string, reason?: string): Promise<void>;
  getEstimateExpiryQueue(): Promise<Estimate[]>;
  getWorkOrders(filters: any): Promise<WorkOrder[]>;
  getWorkOrderById(id: string): Promise<WorkOrder | null>;
  createWorkOrderFromEstimate(estimateId: string): Promise<WorkOrder>;
}

export class MockEstimateRepository implements EstimateRepository {
  private estimates: Estimate[] = [
    {
      id: 'est1',
      estimateNumber: 'EST-9901',
      srId: 'sr1',
      srNumber: 'SR-99281',
      customerId: 'c1',
      customerName: 'Rajesh Kumar',
      technicianId: 't1',
      technicianName: 'Suresh Kumar',
      status: 'pending',
      lineItems: [
        { id: 'li1', description: 'Compressor Capacitor 45mfd', quantity: 1, unitPrice: 850, total: 850, type: 'part' },
        { id: 'li2', description: 'Labor Charges (Part Replacement)', quantity: 1, unitPrice: 450, total: 450, type: 'labor' }
      ],
      subtotal: 1300,
      tax: 234,
      total: 1534,
      createdAt: '2024-04-11T10:00:00Z',
      sentAt: '2024-04-11T10:10:00Z',
      expiryAt: '2024-04-14T10:00:00Z',
      channel: 'WhatsApp',
      customerResponse: 'pending',
      qualityFlag: 'low_response',
      approvalHistory: [
        { id: 'ea1', actorName: 'Suresh Kumar', action: 'created', timestamp: '2024-04-11T10:00:00Z' },
        { id: 'ea2', actorName: 'System', action: 'sent', timestamp: '2024-04-11T10:10:00Z', note: 'Sent through WhatsApp.' },
      ],
    },
    {
      id: 'est2',
      estimateNumber: 'EST-9902',
      srId: 'sr2',
      srNumber: 'SR-99282',
      customerId: 'c2',
      customerName: 'Hotel Marine Plaza',
      technicianId: 't2',
      technicianName: 'Amit Singh',
      status: 'approved',
      lineItems: [
        { id: 'li3', description: 'VRF Gas Charging (R410A)', quantity: 5, unitPrice: 1200, total: 6000, type: 'part' },
        { id: 'li4', description: 'System Leak Testing & Repair', quantity: 1, unitPrice: 2500, total: 2500, type: 'labor' }
      ],
      subtotal: 8500,
      tax: 1530,
      total: 10030,
      createdAt: '2024-04-10T14:00:00Z',
      sentAt: '2024-04-10T14:05:00Z',
      expiryAt: '2024-04-13T14:00:00Z',
      respondedAt: '2024-04-10T15:30:00Z',
      channel: 'App',
      workOrderId: 'wo1',
      customerResponse: 'approve',
      requiresCorporateApproval: true,
      approvalHistory: [
        { id: 'ea3', actorName: 'Amit Singh', action: 'created', timestamp: '2024-04-10T14:00:00Z' },
        { id: 'ea4', actorName: 'System', action: 'sent', timestamp: '2024-04-10T14:05:00Z', note: 'Sent through App.' },
        { id: 'ea5', actorName: 'Hotel Marine Plaza', action: 'approved', timestamp: '2024-04-10T15:30:00Z' },
      ],
    }
  ];

  private workOrders: WorkOrder[] = [
    {
      id: 'wo1',
      woNumber: 'WO-5501',
      srId: 'sr2',
      srNumber: 'SR-99282',
      estimateId: 'est2',
      estimateNumber: 'EST-9902',
      customerId: 'c2',
      customerName: 'Hotel Marine Plaza',
      technicianId: 't2',
      technicianName: 'Amit Singh',
      status: 'in-progress',
      lineItems: [
        { id: 'li3', description: 'VRF Gas Charging (R410A)', quantity: 5, unitPrice: 1200, total: 6000, type: 'part' },
        { id: 'li4', description: 'System Leak Testing & Repair', quantity: 1, unitPrice: 2500, total: 2500, type: 'labor' }
      ],
      totalValue: 10030,
      createdAt: '2024-04-10T15:35:00Z',
      partsIssuedStatus: 'fully_issued',
      approvalTimeline: [
        { id: 'ea3', actorName: 'Amit Singh', action: 'created', timestamp: '2024-04-10T14:00:00Z' },
        { id: 'ea4', actorName: 'System', action: 'sent', timestamp: '2024-04-10T14:05:00Z' },
        { id: 'ea5', actorName: 'Hotel Marine Plaza', action: 'approved', timestamp: '2024-04-10T15:30:00Z' },
      ],
    }
  ];

  async getEstimates(_filters: any) {
    await new Promise(r => setTimeout(r, 500));
    return this.estimates;
  }

  async getEstimateById(id: string) {
    return this.estimates.find(e => e.id === id) || null;
  }

  async createEstimate(estimate: Partial<Estimate>) {
    const newEst = {
      ...estimate,
      id: 'est' + (this.estimates.length + 1),
      estimateNumber: 'EST-' + (9900 + this.estimates.length + 1),
      status: 'pending',
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      expiryAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      customerResponse: 'pending',
      approvalHistory: [
        { id: `ea-${Date.now()}-create`, actorName: 'Technician', action: 'created', timestamp: new Date().toISOString() },
      ],
    } as Estimate;
    this.estimates.push(newEst);
    return newEst;
  }

  async sendEstimate(id: string) {
    const estimate = this.estimates.find((item) => item.id === id);
    if (!estimate) {
      throw new Error('Estimate not found');
    }

    estimate.sentAt = new Date().toISOString();
    estimate.approvalHistory = [
      ...(estimate.approvalHistory || []),
      { id: `ea-${Date.now()}-send`, actorName: 'System', action: 'sent', timestamp: estimate.sentAt },
    ];
  }

  async resendEstimate(id: string) {
    const estimate = this.estimates.find((item) => item.id === id);
    if (!estimate) {
      throw new Error('Estimate not found');
    }

    estimate.sentAt = new Date().toISOString();
    estimate.approvalHistory = [
      ...(estimate.approvalHistory || []),
      { id: `ea-${Date.now()}-resend`, actorName: 'Operations Team', action: 'resent', timestamp: estimate.sentAt },
    ];
  }

  async updateEstimateStatus(id: string, status: 'approved' | 'rejected', reason?: string) {
    const est = this.estimates.find(e => e.id === id);
    if (est) {
      est.status = status;
      est.respondedAt = new Date().toISOString();
      est.customerResponse = status === 'approved' ? 'approve' : 'reject';
      est.approvalHistory = [
        ...(est.approvalHistory || []),
        {
          id: `ea-${Date.now()}-${status}`,
          actorName: status === 'approved' ? est.customerName : 'Operations Team',
          action: status,
          timestamp: est.respondedAt,
          note: reason,
        },
      ];
      if (status === 'approved') {
        await this.createWorkOrderFromEstimate(id);
      }
    }
  }

  async overrideApproveEstimate(id: string, reason?: string) {
    const estimate = this.estimates.find((item) => item.id === id);
    if (!estimate) {
      throw new Error('Estimate not found');
    }

    estimate.status = 'approved';
    estimate.respondedAt = new Date().toISOString();
    estimate.approvalHistory = [
      ...(estimate.approvalHistory || []),
      {
        id: `ea-${Date.now()}-override`,
        actorName: 'Admin Override',
        action: 'override_approved',
        timestamp: estimate.respondedAt,
        note: reason,
      },
    ];

    if (!estimate.workOrderId) {
      await this.createWorkOrderFromEstimate(id);
    }
  }

  async getEstimateExpiryQueue() {
    return this.estimates.filter((estimate) => estimate.status === 'pending' || estimate.status === 'expired');
  }

  async getWorkOrders(_filters: any) {
    return this.workOrders;
  }

  async getWorkOrderById(id: string) {
    return this.workOrders.find(w => w.id === id) || null;
  }

  async createWorkOrderFromEstimate(estimateId: string) {
    const est = await this.getEstimateById(estimateId);
    if (!est) throw new Error('Estimate not found');
    
    const newWO = {
      id: 'wo' + (this.workOrders.length + 1),
      woNumber: 'WO-' + (5500 + this.workOrders.length + 1),
      srId: est.srId,
      srNumber: est.srNumber,
      estimateId: est.id,
      estimateNumber: est.estimateNumber,
      customerId: est.customerId,
      customerName: est.customerName,
      technicianId: est.technicianId,
      technicianName: est.technicianName,
      status: 'open',
      lineItems: est.lineItems,
      totalValue: est.total,
      createdAt: new Date().toISOString(),
      partsIssuedStatus: 'pending',
      approvalTimeline: est.approvalHistory || [],
    } as WorkOrder;
    
    this.workOrders.push(newWO);
    est.workOrderId = newWO.id;
    return newWO;
  }
}

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export class LiveEstimateRepository implements EstimateRepository {
  async getEstimates(filters: any) {
    const response = await apiClient.get<Estimate[]>('/api/v1/estimates', { params: filters });
    return response.data;
  }

  async getEstimateById(id: string) {
    const response = await apiClient.get<Estimate>(`/api/v1/estimates/${id}`);
    return response.data;
  }

  async createEstimate(estimate: Partial<Estimate>) {
    const response = await apiClient.post<Estimate>('/api/v1/estimates', estimate);
    return response.data;
  }

  async sendEstimate(id: string) {
    await apiClient.patch(`/api/v1/estimates/${id}/send`);
  }

  async resendEstimate(id: string) {
    await apiClient.patch(`/api/v1/estimates/${id}/resend`);
  }

  async updateEstimateStatus(id: string, status: 'approved' | 'rejected', reason?: string) {
    const endpoint = status === 'approved' ? 'approve' : 'reject';
    await apiClient.patch(`/api/v1/estimates/${id}/${endpoint}`, { reason });
  }

  async overrideApproveEstimate(id: string, reason?: string) {
    await apiClient.patch(`/api/v1/estimates/${id}/override-approve`, { reason });
  }

  async getEstimateExpiryQueue() {
    const response = await apiClient.get<Estimate[]>('/api/v1/estimates/expiry-queue');
    return response.data;
  }

  async getWorkOrders(filters: any) {
    const response = await apiClient.get<WorkOrder[]>('/api/v1/work-orders', { params: filters });
    return response.data;
  }

  async getWorkOrderById(id: string) {
    const response = await apiClient.get<WorkOrder>(`/api/v1/work-orders/${id}`);
    return response.data;
  }

  async createWorkOrderFromEstimate(estimateId: string) {
    const response = await apiClient.post<WorkOrder>(`/api/v1/work-orders/from-estimate/${estimateId}`);
    return response.data;
  }
}

export const estimateRepository: EstimateRepository = isDemoMode()
  ? new MockEstimateRepository()
  : new LiveEstimateRepository();
