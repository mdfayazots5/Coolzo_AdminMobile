/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export type PaymentStatus =
  | "initiated"
  | "confirmed"
  | "pending_verification"
  | "failed"
  | "refunded"
  | "unmatched";

export type PaymentMethod = "online" | "cod" | "bank_transfer" | "cheque" | "corporate_credit";

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
  refundStatus?: "none" | "requested" | "completed";
  notes?: string;
}

export interface Receipt {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  receiptNumber: string;
  amount: number;
  generatedAt: string;
  pdfUrl: string;
  customerName: string;
}

export interface FinancialKPIs {
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueYTD: number;
  collectionRate: number;
  outstandingReceivables: number;
  avgDaysToCollect: number;
  newInvoicesToday: number;
}

export interface RevenueDataPoint {
  period: string;
  amount: number;
  target?: number;
}

export interface CollectionEfficiencyPoint {
  label: string;
  value: number;
}

export interface TaxSummary {
  totalGst: number;
  laborGst: number;
  partsGst: number;
  hsnBreakdown: Array<{ code: string; description: string; amount: number; tax: number }>;
}

export interface FinancialSummary {
  revenue: number;
  collections: number;
  refunds: number;
  discounts: number;
  outstanding: number;
}

export interface DiscountUsagePoint {
  channel: string;
  amount: number;
}

export interface PaymentRepository {
  getPayments(filters: Record<string, unknown>): Promise<Payment[]>;
  getPaymentById(id: string): Promise<Payment | null>;
  verifyCodCollection(id: string, verifierId: string): Promise<Payment>;
  refundPayment(id: string): Promise<Payment>;
  getUnmatchedPayments(): Promise<Payment[]>;
  matchGatewayPayment(gatewayTransactionId: string, invoiceId: string): Promise<Payment>;
  getCodPending(): Promise<Payment[]>;
  getReceipts(): Promise<Receipt[]>;
  resendReceipt(id: string): Promise<void>;
  getFinancialKPIs(): Promise<FinancialKPIs>;
  getRevenueTrend(period: "daily" | "weekly" | "monthly"): Promise<RevenueDataPoint[]>;
  getRevenueByServiceType(): Promise<{ type: string; amount: number }[]>;
  getCollectionEfficiency(): Promise<CollectionEfficiencyPoint[]>;
  getTaxSummary(period: string): Promise<TaxSummary>;
  getFinancialSummary(): Promise<FinancialSummary>;
  getDiscountUsage(): Promise<DiscountUsagePoint[]>;
}

const clonePayment = (payment: Payment): Payment => ({ ...payment });
const cloneReceipt = (receipt: Receipt): Receipt => ({ ...receipt });

export class MockPaymentRepository implements PaymentRepository {
  private payments: Payment[] = [
    {
      id: "p1",
      paymentId: "PAY-2026-001",
      invoiceId: "inv1",
      invoiceNumber: "INV-2026-001",
      customerId: "c1",
      customerName: "Aditi Sharma",
      amount: 2773,
      method: "online",
      status: "confirmed",
      date: "2026-04-08T11:30:00Z",
      gatewayTransactionId: "TXN_882711",
      gatewayName: "Razorpay",
      refundStatus: "none",
    },
    {
      id: "p2",
      paymentId: "PAY-2026-002",
      invoiceId: "inv2",
      invoiceNumber: "INV-2026-002",
      customerId: "c2",
      customerName: "Tech Park Solutions",
      amount: 2000,
      method: "bank_transfer",
      status: "confirmed",
      date: "2026-04-06T11:00:00Z",
      referenceNumber: "BANK_REF_9918",
      refundStatus: "none",
    },
    {
      id: "p3",
      paymentId: "PAY-2026-003",
      invoiceId: "inv3",
      invoiceNumber: "INV-2026-003",
      customerId: "c3",
      customerName: "Rajesh Khanna",
      amount: 1500,
      method: "cod",
      status: "pending_verification",
      date: "2026-04-10T16:45:00Z",
      technicianId: "t1",
      technicianName: "Suresh Kumar",
      refundStatus: "none",
    },
    {
      id: "p4",
      paymentId: "PAY-2026-004",
      invoiceId: "",
      invoiceNumber: "UNMATCHED",
      customerId: "",
      customerName: "Unknown",
      amount: 4200,
      method: "online",
      status: "unmatched",
      date: "2026-04-11T09:15:00Z",
      gatewayTransactionId: "TXN_UNMATCHED_1001",
      gatewayName: "Razorpay",
      refundStatus: "none",
    },
  ];

  private receipts: Receipt[] = [
    {
      id: "r1",
      paymentId: "p1",
      invoiceId: "inv1",
      invoiceNumber: "INV-2026-001",
      receiptNumber: "RCT-2026-001",
      amount: 2773,
      generatedAt: "2026-04-08T11:35:00Z",
      pdfUrl: "/receipts/RCT-2026-001.pdf",
      customerName: "Aditi Sharma",
    },
    {
      id: "r2",
      paymentId: "p2",
      invoiceId: "inv2",
      invoiceNumber: "INV-2026-002",
      receiptNumber: "RCT-2026-002",
      amount: 2000,
      generatedAt: "2026-04-06T11:15:00Z",
      pdfUrl: "/receipts/RCT-2026-002.pdf",
      customerName: "Tech Park Solutions",
    },
  ];

  private async wait() {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  async getPayments(filters: Record<string, unknown>) {
    await this.wait();
    const status = String(filters.status ?? "");
    const method = String(filters.method ?? "");

    return this.payments
      .filter((payment) => (!status || status === "all" || payment.status === status) && (!method || method === "all" || payment.method === method))
      .map(clonePayment);
  }

  async getPaymentById(id: string) {
    await this.wait();
    const payment = this.payments.find((item) => item.id === id);
    return payment ? clonePayment(payment) : null;
  }

  async verifyCodCollection(id: string, verifierId: string) {
    await this.wait();
    const payment = this.payments.find((item) => item.id === id);
    if (!payment) {
      throw new Error("Payment not found");
    }

    payment.status = "confirmed";
    payment.verifiedBy = verifierId;
    payment.verificationDate = new Date().toISOString();
    return clonePayment(payment);
  }

  async refundPayment(id: string) {
    await this.wait();
    const payment = this.payments.find((item) => item.id === id);
    if (!payment) {
      throw new Error("Payment not found");
    }

    payment.status = "refunded";
    payment.refundStatus = "completed";
    return clonePayment(payment);
  }

  async getUnmatchedPayments() {
    await this.wait();
    return this.payments.filter((item) => item.status === "unmatched").map(clonePayment);
  }

  async matchGatewayPayment(gatewayTransactionId: string, invoiceId: string) {
    await this.wait();
    const payment = this.payments.find((item) => item.gatewayTransactionId === gatewayTransactionId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    payment.invoiceId = invoiceId;
    payment.invoiceNumber = `INV-${invoiceId}`;
    payment.status = "confirmed";
    return clonePayment(payment);
  }

  async getCodPending() {
    await this.wait();
    return this.payments.filter((item) => item.method === "cod" && item.status === "pending_verification").map(clonePayment);
  }

  async getReceipts() {
    await this.wait();
    return this.receipts.map(cloneReceipt);
  }

  async resendReceipt(_id: string) {
    await this.wait();
  }

  async getFinancialKPIs() {
    await this.wait();
    return {
      revenueToday: 12500,
      revenueThisWeek: 85400,
      revenueThisMonth: 482000,
      revenueYTD: 5200000,
      collectionRate: 88,
      outstandingReceivables: 120000,
      avgDaysToCollect: 12,
      newInvoicesToday: 15,
    };
  }

  async getRevenueTrend(period: "daily" | "weekly" | "monthly") {
    await this.wait();
    if (period === "monthly") {
      return [
        { period: "Jan", amount: 420000, target: 400000 },
        { period: "Feb", amount: 380000, target: 400000 },
        { period: "Mar", amount: 450000, target: 420000 },
        { period: "Apr", amount: 482000, target: 450000 },
      ];
    }

    return [
      { period: "Week 1", amount: 110000, target: 100000 },
      { period: "Week 2", amount: 98000, target: 100000 },
      { period: "Week 3", amount: 126000, target: 110000 },
      { period: "Week 4", amount: 148000, target: 120000 },
    ];
  }

  async getRevenueByServiceType() {
    await this.wait();
    return [
      { type: "AMC Contracts", amount: 250000 },
      { type: "Repair Services", amount: 150000 },
      { type: "Installations", amount: 82000 },
    ];
  }

  async getCollectionEfficiency() {
    await this.wait();
    return [
      { label: "On-time", value: 62 },
      { label: "31-60 Days", value: 21 },
      { label: "61-90 Days", value: 11 },
      { label: "90+ Days", value: 6 },
    ];
  }

  async getTaxSummary(_period: string) {
    await this.wait();
    return {
      totalGst: 86760,
      laborGst: 54000,
      partsGst: 32760,
      hsnBreakdown: [
        { code: "998713", description: "AC Repair Services", amount: 300000, tax: 54000 },
        { code: "8415", description: "AC Parts", amount: 182000, tax: 32760 },
      ],
    };
  }

  async getFinancialSummary() {
    await this.wait();
    return {
      revenue: 482000,
      collections: 438500,
      refunds: 12000,
      discounts: 18500,
      outstanding: 120000,
    };
  }

  async getDiscountUsage() {
    await this.wait();
    return [
      { channel: "Coupons", amount: 9200 },
      { channel: "Manual Discounts", amount: 9300 },
    ];
  }
}

export class LivePaymentRepository implements PaymentRepository {
  async getPayments(filters: Record<string, unknown>) {
    const response = await apiClient.get<Payment[]>("/api/v1/payments", { params: filters });
    return response.data;
  }

  async getPaymentById(id: string) {
    const response = await apiClient.get<Payment>(`/api/v1/payments/${id}`);
    return response.data;
  }

  async verifyCodCollection(id: string, verifierId: string) {
    const response = await apiClient.post<Payment>("/api/v1/payments/cod-verify", {
      paymentId: id,
      verifierId,
    });
    return response.data;
  }

  async refundPayment(id: string) {
    const response = await apiClient.post<Payment>("/api/v1/payments/refund", { paymentId: id });
    return response.data;
  }

  async getUnmatchedPayments() {
    const response = await apiClient.get<Payment[]>("/api/v1/payments/unmatched");
    return response.data;
  }

  async matchGatewayPayment(gatewayTransactionId: string, invoiceId: string) {
    const response = await apiClient.patch<Payment>(`/api/v1/payments/match/${gatewayTransactionId}`, { invoiceId });
    return response.data;
  }

  async getCodPending() {
    const response = await apiClient.get<Payment[]>("/api/v1/payments/cod-pending");
    return response.data;
  }

  async getReceipts() {
    const response = await apiClient.get<Receipt[]>("/api/v1/receipts");
    return response.data;
  }

  async resendReceipt(id: string) {
    await apiClient.post(`/api/v1/receipts/${id}/resend`);
  }

  async getFinancialKPIs() {
    const response = await apiClient.get<FinancialKPIs>("/api/v1/reports/finance-dashboard");
    return response.data;
  }

  async getRevenueTrend(period: "daily" | "weekly" | "monthly") {
    const response = await apiClient.get<RevenueDataPoint[]>("/api/v1/reports/revenue", {
      params: { period },
    });
    return response.data;
  }

  async getRevenueByServiceType() {
    const response = await apiClient.get<{ type: string; amount: number }[]>("/api/v1/reports/revenue", {
      params: { breakdown: "serviceType" },
    });
    return response.data;
  }

  async getCollectionEfficiency() {
    const response = await apiClient.get<CollectionEfficiencyPoint[]>("/api/v1/reports/collection-efficiency");
    return response.data;
  }

  async getTaxSummary(period: string) {
    const response = await apiClient.get<TaxSummary>("/api/v1/reports/tax-liability", {
      params: { period },
    });
    return response.data;
  }

  async getFinancialSummary() {
    const response = await apiClient.get<FinancialSummary>("/api/v1/reports/financial-summary");
    return response.data;
  }

  async getDiscountUsage() {
    const response = await apiClient.get<DiscountUsagePoint[]>("/api/v1/reports/discount-coupon-usage");
    return response.data;
  }
}

export const paymentRepository: PaymentRepository = isDemoMode()
  ? new MockPaymentRepository()
  : new LivePaymentRepository();
