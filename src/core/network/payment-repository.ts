/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PaymentStatus = 'confirmed' | 'pending_verification' | 'failed' | 'refunded' | 'disputed';
export type PaymentMethod = 'online' | 'cod' | 'bank_transfer' | 'cheque' | 'corporate_credit';

export interface Payment {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  gatewayTransactionId?: string;
  gatewayName?: string;
  technicianId?: string;
  technicianName?: string;
  verifiedBy?: string;
  verificationDate?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface FinancialKPIs {
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueYTD: number;
  collectionRate: number; // percentage
  outstandingReceivables: number;
  avgDaysToCollect: number;
  newInvoicesToday: number;
}

export interface RevenueDataPoint {
  period: string;
  amount: number;
  target?: number;
}

export interface PaymentRepository {
  getPayments(filters: any): Promise<Payment[]>;
  getPaymentById(id: string): Promise<Payment | null>;
  verifyPayment(id: string, verifierId: string): Promise<Payment>;
  getFinancialKPIs(): Promise<FinancialKPIs>;
  getRevenueTrend(period: 'daily' | 'weekly' | 'monthly'): Promise<RevenueDataPoint[]>;
  getRevenueByServiceType(): Promise<{ type: string, amount: number }[]>;
  getTaxSummary(period: string): Promise<any>;
}

export class MockPaymentRepository implements PaymentRepository {
  private payments: Payment[] = [
    {
      id: 'p1',
      paymentId: 'PAY-99281',
      invoiceId: 'inv1',
      invoiceNumber: 'INV-2024-001',
      customerId: 'c1',
      customerName: 'Aditi Sharma',
      amount: 2773,
      method: 'online',
      status: 'confirmed',
      date: '2024-04-08T11:30:00Z',
      gatewayTransactionId: 'TXN_882711',
      gatewayName: 'Razorpay'
    },
    {
      id: 'p2',
      paymentId: 'PAY-99282',
      invoiceId: 'inv2',
      invoiceNumber: 'INV-2024-002',
      customerId: 'c2',
      customerName: 'Tech Park Solutions',
      amount: 2000,
      method: 'bank_transfer',
      status: 'confirmed',
      date: '2024-04-06T11:00:00Z',
      referenceNumber: 'BANK_REF_9918'
    },
    {
      id: 'p3',
      paymentId: 'PAY-99283',
      invoiceId: 'inv3',
      invoiceNumber: 'INV-2024-003',
      customerId: 'c3',
      customerName: 'Rajesh Khanna',
      amount: 1500,
      method: 'cod',
      status: 'pending_verification',
      date: '2024-04-10T16:45:00Z',
      technicianId: 't1',
      technicianName: 'Suresh Kumar'
    }
  ];

  async getPayments(_filters: any) {
    await new Promise(r => setTimeout(r, 500));
    return this.payments;
  }

  async getPaymentById(id: string) {
    return this.payments.find(p => p.id === id) || null;
  }

  async verifyPayment(id: string, verifierId: string) {
    const idx = this.payments.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.payments[idx] = {
        ...this.payments[idx],
        status: 'confirmed',
        verifiedBy: verifierId,
        verificationDate: new Date().toISOString()
      };
      return this.payments[idx];
    }
    throw new Error('Payment not found');
  }

  async getFinancialKPIs() {
    return {
      revenueToday: 12500,
      revenueThisWeek: 85400,
      revenueThisMonth: 482000,
      revenueYTD: 5200000,
      collectionRate: 88,
      outstandingReceivables: 120000,
      avgDaysToCollect: 12,
      newInvoicesToday: 15
    };
  }

  async getRevenueTrend(period: 'daily' | 'weekly' | 'monthly') {
    if (period === 'monthly') {
      return [
        { period: 'Jan', amount: 420000, target: 400000 },
        { period: 'Feb', amount: 380000, target: 400000 },
        { period: 'Mar', amount: 450000, target: 420000 },
        { period: 'Apr', amount: 482000, target: 450000 }
      ];
    }
    return [];
  }

  async getRevenueByServiceType() {
    return [
      { type: 'AMC Contracts', amount: 250000 },
      { type: 'Repair Services', amount: 150000 },
      { type: 'Installations', amount: 82000 }
    ];
  }

  async getTaxSummary(_period: string) {
    return {
      totalGst: 86760,
      laborGst: 54000,
      partsGst: 32760,
      hsnBreakdown: [
        { code: '998713', description: 'AC Repair Services', amount: 300000, tax: 54000 },
        { code: '8415', description: 'AC Parts', amount: 182000, tax: 32760 }
      ]
    };
  }
}

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export class LivePaymentRepository implements PaymentRepository {
  async getPayments(filters: any) {
    const response = await apiClient.get<Payment[]>('/api/v1/finance/payments', { params: filters });
    return response.data;
  }

  async getPaymentById(id: string) {
    const response = await apiClient.get<Payment>(`/api/v1/finance/payments/${id}`);
    return response.data;
  }

  async verifyPayment(id: string, verifierId: string) {
    const response = await apiClient.post<Payment>(`/api/v1/finance/payments/${id}/verify`, { verifierId });
    return response.data;
  }

  async getFinancialKPIs() {
    const response = await apiClient.get<FinancialKPIs>('/api/v1/finance/stats/kpis');
    return response.data;
  }

  async getRevenueTrend(period: 'daily' | 'weekly' | 'monthly') {
    const response = await apiClient.get<RevenueDataPoint[]>('/api/v1/finance/stats/revenue-trend', { params: { period } });
    return response.data;
  }

  async getRevenueByServiceType() {
    const response = await apiClient.get<{ type: string, amount: number }[]>('/api/v1/finance/stats/revenue-by-service');
    return response.data;
  }

  async getTaxSummary(period: string) {
    const response = await apiClient.get<any>('/api/v1/finance/stats/tax-summary', { params: { period } });
    return response.data;
  }
}

export const paymentRepository: PaymentRepository = isDemoMode()
  ? new MockPaymentRepository()
  : new LivePaymentRepository();
