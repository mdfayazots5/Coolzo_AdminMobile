/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'bad_debt';
export type PaymentMethod = 'cash' | 'cheque' | 'bank_transfer' | 'online';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'labor' | 'part' | 'surcharge' | 'discount';
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  srId: string;
  srNumber: string;
  woId?: string;
  customerId: string;
  customerName: string;
  customerType: 'individual' | 'corporate';
  technicianName: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  netPayable: number;
  amountPaid: number;
  balanceDue: number;
  paymentHistory: PaymentRecord[];
  notes?: string;
  version: number;
}

export interface ARAgingBucket {
  label: string;
  count: number;
  amount: number;
  color: string;
}

export interface InvoiceRepository {
  getInvoices(filters: any): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  createInvoice(invoice: Partial<Invoice>): Promise<Invoice>;
  updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice>;
  applyDiscount(id: string, discount: { code?: string, amount?: number, reason: string }): Promise<Invoice>;
  recordPayment(id: string, payment: Partial<PaymentRecord>): Promise<Invoice>;
  getARAging(): Promise<ARAgingBucket[]>;
  getOverdueInvoices(): Promise<Invoice[]>;
}

export class MockInvoiceRepository implements InvoiceRepository {
  private invoices: Invoice[] = [
    {
      id: 'inv1',
      invoiceNumber: 'INV-2024-001',
      srId: 'sr1',
      srNumber: 'SR-99281',
      customerId: 'c1',
      customerName: 'Aditi Sharma',
      customerType: 'individual',
      technicianName: 'Suresh Kumar',
      issueDate: '2024-04-01T10:00:00Z',
      dueDate: '2024-04-08T10:00:00Z',
      status: 'overdue',
      items: [
        { id: 'li1', description: 'AC Deep Cleaning Service', quantity: 1, unitPrice: 1500, total: 1500, type: 'labor' },
        { id: 'li2', description: 'Capacitor 45mfd', quantity: 1, unitPrice: 850, total: 850, type: 'part' }
      ],
      subtotal: 2350,
      discountTotal: 0,
      taxTotal: 423,
      netPayable: 2773,
      amountPaid: 0,
      balanceDue: 2773,
      paymentHistory: [],
      version: 1
    },
    {
      id: 'inv2',
      invoiceNumber: 'INV-2024-002',
      srId: 'sr2',
      srNumber: 'SR-99285',
      customerId: 'c2',
      customerName: 'Tech Park Solutions',
      customerType: 'corporate',
      technicianName: 'Amit Patel',
      issueDate: '2024-04-05T14:00:00Z',
      dueDate: '2024-04-12T14:00:00Z',
      status: 'unpaid',
      items: [
        { id: 'li3', description: 'Quarterly Maintenance Visit', quantity: 5, unitPrice: 1200, total: 6000, type: 'labor' }
      ],
      subtotal: 6000,
      discountTotal: 500,
      taxTotal: 990,
      netPayable: 6490,
      amountPaid: 2000,
      balanceDue: 4490,
      paymentHistory: [
        { id: 'p1', amount: 2000, method: 'bank_transfer', reference: 'TXN99281', date: '2024-04-06T11:00:00Z' }
      ],
      version: 1
    }
  ];

  async getInvoices(_filters: any) {
    await new Promise(r => setTimeout(r, 500));
    return this.invoices;
  }

  async getInvoiceById(id: string) {
    return this.invoices.find(i => i.id === id) || null;
  }

  async createInvoice(invoice: Partial<Invoice>) {
    const newInv = {
      ...invoice,
      id: 'inv' + (this.invoices.length + 1),
      invoiceNumber: `INV-2024-00${this.invoices.length + 1}`,
      issueDate: new Date().toISOString(),
      version: 1,
      paymentHistory: [],
      amountPaid: 0,
      balanceDue: invoice.netPayable || 0
    } as Invoice;
    this.invoices.push(newInv);
    return newInv;
  }

  async updateInvoice(id: string, data: Partial<Invoice>) {
    const idx = this.invoices.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.invoices[idx] = { ...this.invoices[idx], ...data, version: this.invoices[idx].version + 1 };
      return this.invoices[idx];
    }
    throw new Error('Invoice not found');
  }

  async applyDiscount(id: string, discount: { code?: string, amount?: number, reason: string }) {
    const inv = await this.getInvoiceById(id);
    if (inv) {
      const discountAmt = discount.amount || 0;
      inv.discountTotal = discountAmt;
      inv.netPayable = inv.subtotal - inv.discountTotal + inv.taxTotal;
      inv.balanceDue = inv.netPayable - inv.amountPaid;
      inv.version += 1;
      return inv;
    }
    throw new Error('Invoice not found');
  }

  async recordPayment(id: string, payment: Partial<PaymentRecord>) {
    const inv = await this.getInvoiceById(id);
    if (inv) {
      const newPayment = {
        ...payment,
        id: 'p' + (inv.paymentHistory.length + 1),
        date: new Date().toISOString()
      } as PaymentRecord;
      inv.paymentHistory.push(newPayment);
      inv.amountPaid += newPayment.amount;
      inv.balanceDue = inv.netPayable - inv.amountPaid;
      if (inv.balanceDue <= 0) inv.status = 'paid';
      else if (inv.amountPaid > 0) inv.status = 'partially_paid';
      return inv;
    }
    throw new Error('Invoice not found');
  }

  async getARAging() {
    return [
      { label: '0-30 Days', count: 12, amount: 45000, color: 'bg-status-completed' },
      { label: '31-60 Days', count: 5, amount: 22000, color: 'bg-brand-gold' },
      { label: '61-90 Days', count: 3, amount: 15000, color: 'bg-status-pending' },
      { label: '90+ Days', count: 2, amount: 8000, color: 'bg-status-emergency' }
    ];
  }

  async getOverdueInvoices() {
    return this.invoices.filter(i => i.status === 'overdue');
  }
}

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export class LiveInvoiceRepository implements InvoiceRepository {
  async getInvoices(filters: any) {
    const response = await apiClient.get<Invoice[]>('/api/v1/billing/invoices', { params: filters });
    return response.data;
  }

  async getInvoiceById(id: string) {
    const response = await apiClient.get<Invoice>(`/api/v1/billing/invoices/${id}`);
    return response.data;
  }

  async createInvoice(invoice: Partial<Invoice>) {
    const response = await apiClient.post<Invoice>('/api/v1/billing/invoices', invoice);
    return response.data;
  }

  async updateInvoice(id: string, data: Partial<Invoice>) {
    const response = await apiClient.patch<Invoice>(`/api/v1/billing/invoices/${id}`, data);
    return response.data;
  }

  async applyDiscount(id: string, discount: { code?: string, amount?: number, reason: string }) {
    const response = await apiClient.post<Invoice>(`/api/v1/billing/invoices/${id}/discount`, discount);
    return response.data;
  }

  async recordPayment(id: string, payment: Partial<PaymentRecord>) {
    const response = await apiClient.post<Invoice>(`/api/v1/billing/invoices/${id}/payments`, payment);
    return response.data;
  }

  async getARAging() {
    const response = await apiClient.get<ARAgingBucket[]>('/api/v1/billing/ar-aging');
    return response.data;
  }

  async getOverdueInvoices() {
    const response = await apiClient.get<Invoice[]>('/api/v1/billing/invoices/overdue');
    return response.data;
  }
}

export const invoiceRepository: InvoiceRepository = isDemoMode()
  ? new MockInvoiceRepository()
  : new LiveInvoiceRepository();
