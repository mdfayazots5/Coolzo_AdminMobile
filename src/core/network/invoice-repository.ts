/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "bad_debt";

export type PaymentMethod = "cash" | "cheque" | "bank_transfer" | "online";

export type InvoiceLineItemType =
  | "service"
  | "part"
  | "visit_charge"
  | "discount"
  | "tax";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: InvoiceLineItemType;
  hsnSacCode?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: string;
  notes?: string;
}

export interface CreditNoteRecord {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  status: "pending_approval" | "issued";
}

export interface InvoiceVersionEntry {
  id: string;
  version: number;
  changeReason: string;
  changedBy: string;
  changedAt: string;
  summary: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  srId: string;
  srNumber: string;
  woId?: string;
  customerId: string;
  customerName: string;
  customerType: "individual" | "corporate";
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
  creditNotes: CreditNoteRecord[];
  versionHistory: InvoiceVersionEntry[];
  notes?: string;
  version: number;
  isBadDebt?: boolean;
}

export interface ARAgingBucket {
  label: string;
  count: number;
  amount: number;
  color: string;
}

export interface OutstandingCustomer {
  customerId: string;
  customerName: string;
  customerType: "individual" | "corporate";
  outstandingAmount: number;
  overdueInvoices: number;
}

export interface AccountsReceivableDashboard {
  aging: ARAgingBucket[];
  overdueInvoices: Invoice[];
  topOutstandingCustomers: OutstandingCustomer[];
  totalOutstanding: number;
}

export interface InvoiceListFilters {
  status?: InvoiceStatus | "all";
  search?: string;
  pageNumber?: number;
  pageSize?: number;
  customerId?: string;
}

export interface ManualDiscountRequest {
  code?: string;
  amount?: number;
  reason: string;
}

export interface MarkInvoicePaidRequest {
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes?: string;
}

export interface ExportInvoicesRequest {
  dateFrom?: string;
  dateTo?: string;
  format: "csv" | "pdf";
}

export interface InvoiceRepository {
  getInvoices(filters: InvoiceListFilters): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  createInvoice(invoice: Partial<Invoice>): Promise<Invoice>;
  updateInvoice(id: string, data: Partial<Invoice>, changeReason: string): Promise<Invoice>;
  sendInvoice(id: string): Promise<Invoice>;
  applyDiscount(id: string, discount: ManualDiscountRequest): Promise<Invoice>;
  issueCreditNote(id: string, payload: { amount: number; reason: string }): Promise<Invoice>;
  markAsPaid(id: string, payment: MarkInvoicePaidRequest): Promise<Invoice>;
  getVersionHistory(id: string): Promise<InvoiceVersionEntry[]>;
  getAccountsReceivableDashboard(): Promise<AccountsReceivableDashboard>;
  sendPaymentReminder(id: string): Promise<void>;
  bulkExportInvoices(request: ExportInvoicesRequest): Promise<{ downloadUrl: string }>;
  createCorporateInvoice(accountId: string): Promise<Invoice>;
  createProformaInvoice(customerId: string): Promise<Invoice>;
  markBadDebt(id: string): Promise<Invoice>;
}

interface BackendInvoiceListItem {
  invoiceId: number;
  invoiceNumber: string;
  quotationId: number;
  quotationNumber: string;
  customerName: string;
  currentStatus: string;
  grandTotalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  invoiceDateUtc: string;
}

interface BackendInvoiceLineItem {
  invoiceLineId: number;
  quotationLineId?: number | null;
  lineType: string;
  lineDescription: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}

interface BackendPaymentReceipt {
  receiptNumber: string;
}

interface BackendPaymentRecord {
  paymentTransactionId: number;
  invoiceId: number;
  paymentMethod: string;
  referenceNumber: string;
  paidAmount: number;
  paymentDateUtc: string;
  transactionRemarks: string;
  receipt?: BackendPaymentReceipt | null;
}

interface BackendInvoiceVersionEntry {
  billingStatusHistoryId: number;
  entityType: string;
  statusName: string;
  remarks: string;
  statusDateUtc: string;
  changedBy: string;
}

interface BackendInvoiceDetail {
  invoiceId: number;
  invoiceNumber: string;
  quotationId: number;
  quotationNumber: string;
  customerId: number;
  customerName: string;
  mobileNumber: string;
  addressSummary: string;
  serviceName: string;
  currentStatus: string;
  invoiceDateUtc: string;
  subTotalAmount: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  lastPaymentDateUtc?: string | null;
  lines: BackendInvoiceLineItem[];
  payments: BackendPaymentRecord[];
  billingHistory: BackendInvoiceVersionEntry[];
}

const normalizeInvoiceStatus = (status?: string | null): InvoiceStatus => {
  switch ((status ?? "").replace(/[\s-]/g, "_").toLowerCase()) {
    case "draft":
      return "draft";
    case "sent":
      return "sent";
    case "partially_paid":
    case "partialpaid":
      return "partially_paid";
    case "paid":
      return "paid";
    case "overdue":
      return "overdue";
    case "cancelled":
      return "cancelled";
    case "bad_debt":
    case "baddebt":
      return "bad_debt";
    default:
      return "unpaid";
  }
};

const normalizePaymentMethod = (method?: string | null): PaymentMethod => {
  switch ((method ?? "").replace(/[\s-]/g, "_").toLowerCase()) {
    case "cheque":
      return "cheque";
    case "bank_transfer":
    case "banktransfer":
      return "bank_transfer";
    case "online":
    case "upi":
    case "card":
      return "online";
    default:
      return "cash";
  }
};

const normalizeInvoiceLineType = (lineType?: string | null): InvoiceLineItemType => {
  switch ((lineType ?? "").replace(/[\s-]/g, "_").toLowerCase()) {
    case "part":
      return "part";
    case "visit_charge":
    case "visitcharge":
      return "visit_charge";
    case "discount":
      return "discount";
    case "tax":
      return "tax";
    default:
      return "service";
  }
};

const mapInvoiceLineItem = (line: BackendInvoiceLineItem): InvoiceLineItem => ({
  id: String(line.invoiceLineId),
  description: line.lineDescription,
  quantity: Number(line.quantity),
  unitPrice: Number(line.unitPrice),
  total: Number(line.lineAmount),
  type: normalizeInvoiceLineType(line.lineType),
});

const mapPaymentRecord = (payment: BackendPaymentRecord): PaymentRecord => ({
  id: String(payment.paymentTransactionId),
  amount: Number(payment.paidAmount),
  method: normalizePaymentMethod(payment.paymentMethod),
  reference: payment.receipt?.receiptNumber || payment.referenceNumber || "N/A",
  date: payment.paymentDateUtc,
  notes: payment.transactionRemarks || undefined,
});

const mapInvoiceVersionEntry = (entry: BackendInvoiceVersionEntry, index: number): InvoiceVersionEntry => ({
  id: String(entry.billingStatusHistoryId),
  version: index + 1,
  changeReason: entry.remarks || entry.statusName,
  changedBy: entry.changedBy || "System",
  changedAt: entry.statusDateUtc,
  summary: `${entry.entityType}: ${entry.statusName}`,
});

const mapBackendInvoiceListItem = (invoice: BackendInvoiceListItem): Invoice => ({
  id: String(invoice.invoiceId),
  invoiceNumber: invoice.invoiceNumber,
  srId: String(invoice.quotationId || ""),
  srNumber: invoice.quotationNumber || "",
  customerId: "",
  customerName: invoice.customerName,
  customerType: "individual",
  technicianName: "",
  issueDate: invoice.invoiceDateUtc,
  dueDate: invoice.invoiceDateUtc,
  status: normalizeInvoiceStatus(invoice.currentStatus),
  items: [],
  subtotal: Number(invoice.grandTotalAmount),
  discountTotal: 0,
  taxTotal: 0,
  netPayable: Number(invoice.grandTotalAmount),
  amountPaid: Number(invoice.paidAmount),
  balanceDue: Number(invoice.balanceAmount),
  paymentHistory: [],
  creditNotes: [],
  versionHistory: [],
  version: 1,
  isBadDebt: normalizeInvoiceStatus(invoice.currentStatus) === "bad_debt",
});

const mapBackendInvoiceDetail = (invoice: BackendInvoiceDetail): Invoice => {
  const status = normalizeInvoiceStatus(invoice.currentStatus);
  const paymentHistory = (invoice.payments ?? []).map(mapPaymentRecord);
  const versionHistory = (invoice.billingHistory ?? []).map(mapInvoiceVersionEntry);

  return {
    id: String(invoice.invoiceId),
    invoiceNumber: invoice.invoiceNumber,
    srId: String(invoice.quotationId || ""),
    srNumber: invoice.quotationNumber || "",
    customerId: String(invoice.customerId),
    customerName: invoice.customerName,
    customerType: "individual",
    technicianName: invoice.serviceName || "",
    issueDate: invoice.invoiceDateUtc,
    dueDate: invoice.lastPaymentDateUtc || invoice.invoiceDateUtc,
    status,
    items: (invoice.lines ?? []).map(mapInvoiceLineItem),
    subtotal: Number(invoice.subTotalAmount),
    discountTotal: Number(invoice.discountAmount),
    taxTotal: Number(invoice.taxAmount),
    netPayable: Number(invoice.grandTotalAmount),
    amountPaid: Number(invoice.paidAmount),
    balanceDue: Number(invoice.balanceAmount),
    paymentHistory,
    creditNotes: [],
    versionHistory,
    version: Math.max(versionHistory.length, 1),
    isBadDebt: status === "bad_debt",
  };
};

const cloneInvoice = (invoice: Invoice): Invoice => ({
  ...invoice,
  items: invoice.items.map((item) => ({ ...item })),
  paymentHistory: invoice.paymentHistory.map((payment) => ({ ...payment })),
  creditNotes: invoice.creditNotes.map((creditNote) => ({ ...creditNote })),
  versionHistory: invoice.versionHistory.map((version) => ({ ...version })),
});

const withDerivedAmounts = (invoice: Invoice): Invoice => {
  const amountPaid = invoice.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  const creditNotes = invoice.creditNotes.reduce((sum, credit) => sum + credit.amount, 0);
  const balanceDue = Math.max(invoice.netPayable - amountPaid - creditNotes, 0);

  let status = invoice.status;
  if (invoice.isBadDebt) {
    status = "bad_debt";
  } else if (balanceDue <= 0 && invoice.netPayable > 0) {
    status = "paid";
  } else if (amountPaid > 0) {
    status = "partially_paid";
  } else if (status !== "draft" && status !== "sent") {
    status = balanceDue > 0 && new Date(invoice.dueDate) < new Date() ? "overdue" : "unpaid";
  }

  return {
    ...invoice,
    amountPaid,
    balanceDue,
    status,
  };
};

export class MockInvoiceRepository implements InvoiceRepository {
  private invoices: Invoice[] = [
    withDerivedAmounts({
      id: "inv1",
      invoiceNumber: "INV-2026-001",
      srId: "sr1",
      srNumber: "SR-99281",
      customerId: "c1",
      customerName: "Aditi Sharma",
      customerType: "individual",
      technicianName: "Suresh Kumar",
      issueDate: "2026-04-01T10:00:00Z",
      dueDate: "2026-04-08T10:00:00Z",
      status: "overdue",
      items: [
        { id: "li1", description: "AC Deep Cleaning Service", quantity: 1, unitPrice: 1500, total: 1500, type: "service", hsnSacCode: "9987" },
        { id: "li2", description: "Capacitor 45mfd", quantity: 1, unitPrice: 850, total: 850, type: "part", hsnSacCode: "8415" },
      ],
      subtotal: 2350,
      discountTotal: 0,
      taxTotal: 423,
      netPayable: 2773,
      amountPaid: 0,
      balanceDue: 2773,
      paymentHistory: [],
      creditNotes: [],
      versionHistory: [
        {
          id: "ver-1",
          version: 1,
          changeReason: "Initial generation from completed service request.",
          changedBy: "System",
          changedAt: "2026-04-01T10:00:00Z",
          summary: "Invoice generated automatically after job completion.",
        },
      ],
      notes: "Reminder eligible via WhatsApp.",
      version: 1,
      isBadDebt: false,
    }),
    withDerivedAmounts({
      id: "inv2",
      invoiceNumber: "INV-2026-002",
      srId: "sr2",
      srNumber: "SR-99285",
      customerId: "c2",
      customerName: "Tech Park Solutions",
      customerType: "corporate",
      technicianName: "Amit Patel",
      issueDate: "2026-04-05T14:00:00Z",
      dueDate: "2026-04-20T14:00:00Z",
      status: "partially_paid",
      items: [
        { id: "li3", description: "Quarterly Maintenance Visit", quantity: 5, unitPrice: 1200, total: 6000, type: "service", hsnSacCode: "9987" },
      ],
      subtotal: 6000,
      discountTotal: 500,
      taxTotal: 990,
      netPayable: 6490,
      amountPaid: 2000,
      balanceDue: 4490,
      paymentHistory: [
        { id: "p1", amount: 2000, method: "bank_transfer", reference: "TXN99281", date: "2026-04-06T11:00:00Z" },
      ],
      creditNotes: [],
      versionHistory: [
        {
          id: "ver-2",
          version: 1,
          changeReason: "Manual invoice created for AMC contract.",
          changedBy: "Finance Manager",
          changedAt: "2026-04-05T14:00:00Z",
          summary: "Corporate AMC invoice created and sent to customer.",
        },
      ],
      notes: "Follow up before month end.",
      version: 1,
      isBadDebt: false,
    }),
  ];

  private async wait() {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  private getNextInvoiceNumber() {
    return `INV-2026-${String(this.invoices.length + 1).padStart(3, "0")}`;
  }

  private requireInvoice(id: string) {
    const invoice = this.invoices.find((item) => item.id === id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return invoice;
  }

  async getInvoices(filters: InvoiceListFilters) {
    await this.wait();
    const normalizedSearch = filters.search?.trim().toLowerCase() ?? "";

    return this.invoices
      .map(cloneInvoice)
      .filter((invoice) => {
        const statusMatches = !filters.status || filters.status === "all" || invoice.status === filters.status;
        const customerMatches = !filters.customerId || invoice.customerId === filters.customerId;
        const searchMatches =
          !normalizedSearch ||
          invoice.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
          invoice.customerName.toLowerCase().includes(normalizedSearch) ||
          invoice.srNumber.toLowerCase().includes(normalizedSearch);

        return statusMatches && customerMatches && searchMatches;
      });
  }

  async getInvoiceById(id: string) {
    await this.wait();
    const invoice = this.invoices.find((item) => item.id === id);
    return invoice ? cloneInvoice(invoice) : null;
  }

  async createInvoice(invoice: Partial<Invoice>) {
    await this.wait();

    const nextInvoice: Invoice = withDerivedAmounts({
      id: `inv${this.invoices.length + 1}`,
      invoiceNumber: this.getNextInvoiceNumber(),
      srId: invoice.srId ?? "",
      srNumber: invoice.srNumber ?? `MANUAL-${Date.now().toString().slice(-5)}`,
      woId: invoice.woId,
      customerId: invoice.customerId ?? "",
      customerName: invoice.customerName ?? "Unknown Customer",
      customerType: invoice.customerType ?? "individual",
      technicianName: invoice.technicianName ?? "Admin (Manual)",
      issueDate: new Date().toISOString(),
      dueDate: invoice.dueDate ?? new Date().toISOString(),
      status: invoice.status ?? "draft",
      items: (invoice.items ?? []).map((item) => ({ ...item })),
      subtotal: invoice.subtotal ?? 0,
      discountTotal: invoice.discountTotal ?? 0,
      taxTotal: invoice.taxTotal ?? 0,
      netPayable: invoice.netPayable ?? 0,
      amountPaid: 0,
      balanceDue: invoice.netPayable ?? 0,
      paymentHistory: [],
      creditNotes: [],
      versionHistory: [
        {
          id: `ver-${Date.now()}`,
          version: 1,
          changeReason: "Manual invoice draft created.",
          changedBy: "Admin",
          changedAt: new Date().toISOString(),
          summary: "Invoice created from admin mobile billing workflow.",
        },
      ],
      notes: invoice.notes,
      version: 1,
      isBadDebt: false,
    });

    this.invoices.unshift(nextInvoice);
    return cloneInvoice(nextInvoice);
  }

  async updateInvoice(id: string, data: Partial<Invoice>, changeReason: string) {
    await this.wait();
    const current = this.requireInvoice(id);

    const nextVersion = current.version + 1;
    const updated = withDerivedAmounts({
      ...current,
      ...data,
      items: data.items ? data.items.map((item) => ({ ...item })) : current.items,
      version: nextVersion,
      versionHistory: [
        {
          id: `ver-${Date.now()}`,
          version: nextVersion,
          changeReason,
          changedBy: "Admin",
          changedAt: new Date().toISOString(),
          summary: "Invoice values updated before settlement.",
        },
        ...current.versionHistory,
      ],
    });

    Object.assign(current, updated);
    return cloneInvoice(updated);
  }

  async sendInvoice(id: string) {
    await this.wait();
    const current = this.requireInvoice(id);
    current.status = current.amountPaid > 0 ? "partially_paid" : "sent";
    return cloneInvoice(withDerivedAmounts(current));
  }

  async applyDiscount(id: string, discount: ManualDiscountRequest) {
    await this.wait();
    const current = this.requireInvoice(id);
    const discountAmount = discount.amount ?? 0;
    current.discountTotal = discountAmount;
    current.netPayable = current.subtotal - discountAmount + current.taxTotal;
    current.version += 1;
    current.versionHistory.unshift({
      id: `ver-${Date.now()}`,
      version: current.version,
      changeReason: discount.reason,
      changedBy: discount.amount && discount.amount > 1000 ? "Finance Manager" : "Billing Executive",
      changedAt: new Date().toISOString(),
      summary: discount.code ? `Discount ${discount.code} applied.` : "Manual discount applied.",
    });
    return cloneInvoice(withDerivedAmounts(current));
  }

  async issueCreditNote(id: string, payload: { amount: number; reason: string }) {
    await this.wait();
    const current = this.requireInvoice(id);
    current.creditNotes.unshift({
      id: `cn-${Date.now()}`,
      amount: payload.amount,
      reason: payload.reason,
      createdAt: new Date().toISOString(),
      status: "issued",
    });
    return cloneInvoice(withDerivedAmounts(current));
  }

  async markAsPaid(id: string, payment: MarkInvoicePaidRequest) {
    await this.wait();
    const current = this.requireInvoice(id);
    current.paymentHistory.unshift({
      id: `pay-${Date.now()}`,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      date: new Date().toISOString(),
      notes: payment.notes,
    });
    return cloneInvoice(withDerivedAmounts(current));
  }

  async getVersionHistory(id: string) {
    await this.wait();
    return this.requireInvoice(id).versionHistory.map((version) => ({ ...version }));
  }

  async getAccountsReceivableDashboard(): Promise<AccountsReceivableDashboard> {
    await this.wait();
    const overdueInvoices = this.invoices
      .map((invoice) => withDerivedAmounts(invoice))
      .filter((invoice) => invoice.status === "overdue" || invoice.status === "partially_paid");

    const aging: ARAgingBucket[] = [
      { label: "0-30 Days", count: 12, amount: 45000, color: "bg-status-completed" },
      { label: "31-60 Days", count: 5, amount: 22000, color: "bg-brand-gold" },
      { label: "61-90 Days", count: 3, amount: 15000, color: "bg-status-pending" },
      { label: "90+ Days", count: 2, amount: 8000, color: "bg-status-emergency" },
    ];

    return {
      aging,
      overdueInvoices: overdueInvoices.map(cloneInvoice),
      topOutstandingCustomers: [
        { customerId: "c2", customerName: "Tech Park Solutions", customerType: "corporate", outstandingAmount: 4490, overdueInvoices: 1 },
        { customerId: "c1", customerName: "Aditi Sharma", customerType: "individual", outstandingAmount: 2773, overdueInvoices: 1 },
      ],
      totalOutstanding: aging.reduce((sum, bucket) => sum + bucket.amount, 0),
    } satisfies AccountsReceivableDashboard;
  }

  async sendPaymentReminder(_id: string) {
    await this.wait();
  }

  async bulkExportInvoices(request: ExportInvoicesRequest) {
    await this.wait();
    return { downloadUrl: `/exports/invoices.${request.format}` };
  }

  async createCorporateInvoice(accountId: string) {
    return this.createInvoice({
      customerId: accountId,
      customerName: "Corporate Consolidated Account",
      customerType: "corporate",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: "draft",
      items: [{ id: "corp-1", description: "Consolidated service invoice", quantity: 1, unitPrice: 18000, total: 18000, type: "service" }],
      subtotal: 18000,
      discountTotal: 0,
      taxTotal: 3240,
      netPayable: 21240,
      notes: "Generated as consolidated corporate invoice.",
    });
  }

  async createProformaInvoice(customerId: string) {
    return this.createInvoice({
      customerId,
      customerName: "Proforma Customer",
      customerType: "individual",
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      status: "draft",
      items: [{ id: "pro-1", description: "Proforma estimate", quantity: 1, unitPrice: 2500, total: 2500, type: "service" }],
      subtotal: 2500,
      discountTotal: 0,
      taxTotal: 450,
      netPayable: 2950,
      notes: "Generated as proforma invoice.",
    });
  }

  async markBadDebt(id: string) {
    await this.wait();
    const current = this.requireInvoice(id);
    current.isBadDebt = true;
    current.status = "bad_debt";
    return cloneInvoice(withDerivedAmounts(current));
  }
}

export class LiveInvoiceRepository implements InvoiceRepository {
  async getInvoices(filters: InvoiceListFilters) {
    const response = await apiClient.get<BackendInvoiceListItem[]>("/api/invoices", { params: filters });
    return response.data.map(mapBackendInvoiceListItem);
  }

  async getInvoiceById(id: string) {
    const response = await apiClient.get<BackendInvoiceDetail>(`/api/invoices/${id}`);
    return mapBackendInvoiceDetail(response.data);
  }

  async createInvoice(invoice: Partial<Invoice>) {
    const response = await apiClient.post<Invoice>("/api/invoices", invoice);
    return response.data;
  }

  async updateInvoice(id: string, data: Partial<Invoice>, changeReason: string) {
    const response = await apiClient.put<Invoice>(`/api/invoices/${id}`, {
      ...data,
      changeReason,
    });
    return response.data;
  }

  async sendInvoice(id: string) {
    const response = await apiClient.patch<Invoice>(`/api/invoices/${id}/send`);
    return response.data;
  }

  async applyDiscount(id: string, discount: ManualDiscountRequest) {
    const response = await apiClient.patch<Invoice>(`/api/invoices/${id}/apply-discount`, discount);
    return response.data;
  }

  async issueCreditNote(id: string, payload: { amount: number; reason: string }) {
    const response = await apiClient.post<Invoice>(`/api/invoices/${id}/credit-note`, payload);
    return response.data;
  }

  async markAsPaid(id: string, payment: MarkInvoicePaidRequest) {
    const response = await apiClient.patch<Invoice>(`/api/invoices/${id}/mark-paid`, payment);
    return response.data;
  }

  async getVersionHistory(id: string) {
    const response = await apiClient.get<InvoiceVersionEntry[]>(`/api/invoices/${id}/version-history`);
    return response.data;
  }

  async getAccountsReceivableDashboard() {
    const response = await apiClient.get<AccountsReceivableDashboard>("/api/billing/accounts-receivable");
    return response.data;
  }

  async sendPaymentReminder(id: string) {
    await apiClient.post("/api/billing/payment-reminders/send", { invoiceId: id });
  }

  async bulkExportInvoices(request: ExportInvoicesRequest) {
    const response = await apiClient.post<{ downloadUrl: string }>("/api/billing/invoices/bulk-export", request);
    return response.data;
  }

  async createCorporateInvoice(accountId: string) {
    const response = await apiClient.post<Invoice>(`/api/billing/corporate-invoice/${accountId}`);
    return response.data;
  }

  async createProformaInvoice(customerId: string) {
    const response = await apiClient.post<Invoice>(`/api/billing/proforma/${customerId}`);
    return response.data;
  }

  async markBadDebt(id: string) {
    const response = await apiClient.patch<Invoice>(`/api/billing/invoices/${id}/bad-debt`);
    return response.data;
  }
}

export const invoiceRepository: InvoiceRepository = isDemoMode()
  ? new MockInvoiceRepository()
  : new LiveInvoiceRepository();
