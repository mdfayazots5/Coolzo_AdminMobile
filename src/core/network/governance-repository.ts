/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export type NotificationChannel = "whatsapp" | "email" | "sms" | "push";

export interface NotificationTemplateVersion {
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface NotificationTemplate {
  id: string;
  triggerEvent: string;
  channel: NotificationChannel;
  recipientType: "customer" | "technician" | "ops_team";
  subject?: string;
  body: string;
  isEnabled: boolean;
  version: number;
  lastUpdated: string;
  mergeTags: string[];
  channelToggles: Record<NotificationChannel, boolean>;
  versionHistory: NotificationTemplateVersion[];
}

export interface NotificationSendLog {
  id: string;
  triggerEvent: string;
  channel: NotificationChannel;
  recipient: string;
  status: "delivered" | "queued" | "failed";
  sentAt: string;
  errorMessage?: string;
}

export interface PushCampaign {
  id: string;
  audience: string;
  title: string;
  message: string;
  scheduledAt: string;
  status: "draft" | "scheduled" | "sent";
}

export interface CMSContent {
  id: string;
  type: "banner" | "faq" | "article" | "testimonial" | "service_description" | "footer";
  title: string;
  content: any;
  status: "published" | "draft" | "archived";
  lastUpdated: string;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  reportType: string;
  category: "operations" | "finance" | "customer_inventory";
}

export interface ScheduledReport {
  id: string;
  reportType: string;
  title: string;
  frequency: "daily" | "weekly" | "monthly";
  nextRunAt: string;
  recipients: string[];
}

export interface ReportResult {
  title: string;
  generatedAt: string;
  rows: Array<Record<string, unknown>>;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: "create" | "update" | "delete" | "login" | "export";
  entityType: string;
  entityId: string;
  details: string;
  diff?: { before: any; after: any };
  ipAddress: string;
}

export interface DataAccessLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  entityType: string;
  entityId: string;
  piiField: string;
  ipAddress: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "flat";
  value: number;
  expiryDate: string;
  usageLimit: number;
  currentUsage: number;
  status: "active" | "expired" | "disabled";
  minOrderValue?: number;
  newCustomerOnly?: boolean;
}

export interface CouponAnalytics {
  totalDiscountValue: number;
  associatedRevenue: number;
  abuseSignals: string[];
}

export interface GovernanceRepository {
  getNotificationTemplates(): Promise<NotificationTemplate[]>;
  updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate>;
  getNotificationSendLogs(): Promise<NotificationSendLog[]>;
  createPushCampaign(payload: Omit<PushCampaign, "id" | "status">): Promise<PushCampaign>;
  getCMSContent(type?: string): Promise<CMSContent[]>;
  updateCMSContent(id: string, data: Partial<CMSContent>): Promise<CMSContent>;
  createCMSContent(payload: Partial<CMSContent>): Promise<CMSContent>;
  getCoupons(): Promise<Coupon[]>;
  createCoupon(coupon: Partial<Coupon>): Promise<Coupon>;
  updateCoupon(id: string, coupon: Partial<Coupon>): Promise<Coupon>;
  disableCoupon(id: string): Promise<Coupon>;
  getCouponAnalytics(): Promise<CouponAnalytics>;
  getReportDefinitions(): Promise<ReportDefinition[]>;
  runReport(reportType: string, params?: Record<string, unknown>): Promise<ReportResult>;
  exportReport(reportType: string, params?: Record<string, unknown>): Promise<{ downloadUrl: string }>;
  getScheduledReports(): Promise<ScheduledReport[]>;
  createScheduledReport(payload: Omit<ScheduledReport, "id">): Promise<ScheduledReport>;
  deleteScheduledReport(id: string): Promise<void>;
  getAuditLogs(filters: any): Promise<AuditLog[]>;
  getDataAccessLogs(): Promise<DataAccessLog[]>;
}

const cloneTemplate = (template: NotificationTemplate): NotificationTemplate => ({
  ...template,
  channelToggles: { ...template.channelToggles },
  mergeTags: [...template.mergeTags],
  versionHistory: template.versionHistory.map((item) => ({ ...item })),
});

export class MockGovernanceRepository implements GovernanceRepository {
  private templates: NotificationTemplate[] = [
    {
      id: "nt1",
      triggerEvent: "Booking Confirmed",
      channel: "whatsapp",
      recipientType: "customer",
      subject: "Booking Confirmed",
      body: "Hi {CustomerName}, your booking {JobNo} is confirmed for {ETATime}.",
      isEnabled: true,
      version: 3,
      lastUpdated: "2026-04-10T10:00:00Z",
      mergeTags: ["CustomerName", "JobNo", "ETATime", "TechnicianName"],
      channelToggles: { whatsapp: true, email: true, sms: false, push: false },
      versionHistory: [
        { version: 3, updatedAt: "2026-04-10T10:00:00Z", updatedBy: "Marketing Manager" },
        { version: 2, updatedAt: "2026-04-02T09:15:00Z", updatedBy: "Super Admin" },
      ],
    },
    {
      id: "nt2",
      triggerEvent: "Technician Assigned",
      channel: "push",
      recipientType: "technician",
      subject: "New Assignment",
      body: "New job assigned: {JobNo} at {CustomerName}.",
      isEnabled: true,
      version: 1,
      lastUpdated: "2026-04-09T15:30:00Z",
      mergeTags: ["JobNo", "CustomerName", "TechnicianName"],
      channelToggles: { whatsapp: false, email: false, sms: false, push: true },
      versionHistory: [{ version: 1, updatedAt: "2026-04-09T15:30:00Z", updatedBy: "Ops Admin" }],
    },
  ];

  private sendLogs: NotificationSendLog[] = [
    { id: "nl1", triggerEvent: "Booking Confirmed", channel: "whatsapp", recipient: "Aditi Sharma", status: "delivered", sentAt: "2026-04-11T10:45:00Z" },
    { id: "nl2", triggerEvent: "Invoice Due Reminder", channel: "email", recipient: "billing@techpark.com", status: "failed", sentAt: "2026-04-11T09:15:00Z", errorMessage: "SMTP timeout" },
  ];

  private campaigns: PushCampaign[] = [
    { id: "pc1", audience: "AMC Customers", title: "Summer AMC Renewal", message: "Renew now and get priority support.", scheduledAt: "2026-04-25T09:00:00Z", status: "scheduled" },
  ];

  private cms: CMSContent[] = [
    { id: "cms1", type: "banner", title: "Homepage Banner", content: { image: "https://picsum.photos/seed/banner/1200/400", headline: "Monsoon AC Care", cta: "Book Now" }, status: "published", lastUpdated: "2026-04-11T09:00:00Z" },
    { id: "cms2", type: "faq", title: "What is included in deep cleaning?", content: { answer: "Filter cleaning, coil wash, drain line flush.", category: "Service" }, status: "published", lastUpdated: "2026-04-08T13:00:00Z" },
    { id: "cms3", type: "article", title: "How to reduce AC power usage", content: { summary: "Practical cooling tips", seoTitle: "Reduce AC Power Usage" }, status: "draft", lastUpdated: "2026-04-07T16:00:00Z" },
    { id: "cms4", type: "footer", title: "Footer Content", content: { phone: "+91 90000 00000", email: "support@coolzo.com" }, status: "published", lastUpdated: "2026-04-05T10:30:00Z" },
  ];

  private coupons: Coupon[] = [
    { id: "cp1", code: "COOL20", discountType: "percentage", value: 20, expiryDate: "2026-12-31", usageLimit: 1000, currentUsage: 145, status: "active", minOrderValue: 999, newCustomerOnly: false },
    { id: "cp2", code: "NEW500", discountType: "flat", value: 500, expiryDate: "2026-08-31", usageLimit: 250, currentUsage: 42, status: "active", minOrderValue: 2999, newCustomerOnly: true },
  ];

  private scheduledReports: ScheduledReport[] = [
    { id: "sr1", reportType: "daily-job-sheet", title: "Daily Job Sheet", frequency: "daily", nextRunAt: "2026-04-23T03:00:00Z", recipients: ["ops@coolzo.com"] },
  ];

  private auditLogs: AuditLog[] = [
    {
      id: "log1",
      timestamp: "2026-04-11T10:45:00Z",
      userId: "u1",
      userName: "Fayaz Ahmed",
      userRole: "Super Admin",
      action: "update",
      entityType: "Invoice",
      entityId: "INV-2026-001",
      details: "Updated discount from 0 to 500",
      diff: { before: { discount: 0 }, after: { discount: 500 } },
      ipAddress: "192.168.1.1",
    },
  ];

  private dataAccessLogs: DataAccessLog[] = [
    {
      id: "dal1",
      timestamp: "2026-04-11T11:05:00Z",
      userName: "Rahul Verma",
      userRole: "Support",
      entityType: "Customer",
      entityId: "CUST-1001",
      piiField: "PhoneNumber",
      ipAddress: "192.168.1.14",
    },
  ];

  async getNotificationTemplates() {
    return this.templates.map(cloneTemplate);
  }

  async updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>) {
    const index = this.templates.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("Template not found");
    }
    const current = this.templates[index];
    const nextVersion = current.version + 1;
    const updated: NotificationTemplate = {
      ...current,
      ...data,
      version: nextVersion,
      lastUpdated: new Date().toISOString(),
      versionHistory: [
        { version: nextVersion, updatedAt: new Date().toISOString(), updatedBy: "Admin Mobile" },
        ...current.versionHistory,
      ],
    };
    this.templates[index] = updated;
    return cloneTemplate(updated);
  }

  async getNotificationSendLogs() {
    return this.sendLogs.map((item) => ({ ...item }));
  }

  async createPushCampaign(payload: Omit<PushCampaign, "id" | "status">) {
    const created: PushCampaign = { ...payload, id: `pc-${Date.now()}`, status: "scheduled" };
    this.campaigns.unshift(created);
    return { ...created };
  }

  async getCMSContent(type?: string) {
    const items = type ? this.cms.filter((item) => item.type === type) : this.cms;
    return items.map((item) => ({ ...item, content: { ...item.content } }));
  }

  async updateCMSContent(id: string, data: Partial<CMSContent>) {
    const index = this.cms.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("CMS content not found");
    this.cms[index] = { ...this.cms[index], ...data, lastUpdated: new Date().toISOString() };
    return { ...this.cms[index], content: { ...this.cms[index].content } };
  }

  async createCMSContent(payload: Partial<CMSContent>) {
    const created: CMSContent = {
      id: `cms-${Date.now()}`,
      type: payload.type ?? "banner",
      title: payload.title ?? "Untitled Content",
      content: payload.content ?? {},
      status: payload.status ?? "draft",
      lastUpdated: new Date().toISOString(),
    };
    this.cms.unshift(created);
    return { ...created, content: { ...created.content } };
  }

  async getCoupons() {
    return this.coupons.map((item) => ({ ...item }));
  }

  async createCoupon(coupon: Partial<Coupon>) {
    const created: Coupon = {
      id: `cp-${Date.now()}`,
      code: coupon.code ?? "NEWCODE",
      discountType: coupon.discountType ?? "percentage",
      value: coupon.value ?? 0,
      expiryDate: coupon.expiryDate ?? new Date().toISOString(),
      usageLimit: coupon.usageLimit ?? 0,
      currentUsage: 0,
      status: "active",
      minOrderValue: coupon.minOrderValue,
      newCustomerOnly: coupon.newCustomerOnly ?? false,
    };
    this.coupons.unshift(created);
    return { ...created };
  }

  async updateCoupon(id: string, coupon: Partial<Coupon>) {
    const index = this.coupons.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Coupon not found");
    this.coupons[index] = { ...this.coupons[index], ...coupon };
    return { ...this.coupons[index] };
  }

  async disableCoupon(id: string) {
    return this.updateCoupon(id, { status: "disabled" });
  }

  async getCouponAnalytics() {
    return {
      totalDiscountValue: 52000,
      associatedRevenue: 285000,
      abuseSignals: ["Repeated one-time-code attempts from same device", "High-value coupon stacked with manual discounts"],
    };
  }

  async getReportDefinitions(): Promise<ReportDefinition[]> {
    return [
      { id: "r1", name: "Daily Job Sheet", description: "Technician-wise job schedule for the day", reportType: "daily-job-sheet", category: "operations" },
      { id: "r2", name: "SLA Compliance", description: "Response and resolution time analysis", reportType: "sla-compliance", category: "operations" },
      { id: "r3", name: "Financial Summary", description: "Revenue, collections, and outstanding balance", reportType: "financial-summary", category: "finance" },
      { id: "r4", name: "AMC Performance", description: "Contract renewal and visit trends", reportType: "amc-performance", category: "customer_inventory" },
    ] satisfies ReportDefinition[];
  }

  async runReport(reportType: string) {
    return {
      title: reportType,
      generatedAt: new Date().toISOString(),
      rows: [
        { name: "Sample Row 1", value: 12, reportType },
        { name: "Sample Row 2", value: 24, reportType },
      ],
    };
  }

  async exportReport(reportType: string) {
    return { downloadUrl: `/exports/${reportType}.pdf` };
  }

  async getScheduledReports() {
    return this.scheduledReports.map((item) => ({ ...item, recipients: [...item.recipients] }));
  }

  async createScheduledReport(payload: Omit<ScheduledReport, "id">) {
    const created = { ...payload, id: `sched-${Date.now()}` };
    this.scheduledReports.unshift(created);
    return { ...created, recipients: [...created.recipients] };
  }

  async deleteScheduledReport(id: string) {
    this.scheduledReports = this.scheduledReports.filter((item) => item.id !== id);
  }

  async getAuditLogs(_filters: any) {
    return this.auditLogs.map((item) => ({ ...item, diff: item.diff ? { before: item.diff.before, after: item.diff.after } : undefined }));
  }

  async getDataAccessLogs() {
    return this.dataAccessLogs.map((item) => ({ ...item }));
  }
}

export class LiveGovernanceRepository implements GovernanceRepository {
  async getNotificationTemplates() {
    const response = await apiClient.get<NotificationTemplate[]>("/api/notifications/templates");
    return response.data;
  }

  async updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>) {
    const response = await apiClient.put<NotificationTemplate>(`/api/notifications/templates/${id}`, data);
    return response.data;
  }

  async getNotificationSendLogs() {
    const response = await apiClient.get<NotificationSendLog[]>("/api/notifications/log");
    return response.data;
  }

  async createPushCampaign(payload: Omit<PushCampaign, "id" | "status">) {
    const response = await apiClient.post<PushCampaign>("/api/notifications/push-campaign", payload);
    return response.data;
  }

  async getCMSContent(type?: string) {
    const response = await apiClient.get<CMSContent[]>("/api/cms/blocks", { params: { type } });
    return response.data;
  }

  async updateCMSContent(id: string, data: Partial<CMSContent>) {
    const response = await apiClient.put<CMSContent>(`/api/cms/blocks/${id}`, data);
    return response.data;
  }

  async createCMSContent(payload: Partial<CMSContent>) {
    const response = await apiClient.post<CMSContent>("/api/cms/blocks", payload);
    return response.data;
  }

  async getCoupons() {
    const response = await apiClient.get<Coupon[]>("/api/coupons");
    return response.data;
  }

  async createCoupon(coupon: Partial<Coupon>) {
    const response = await apiClient.post<Coupon>("/api/coupons", coupon);
    return response.data;
  }

  async updateCoupon(id: string, coupon: Partial<Coupon>) {
    const response = await apiClient.put<Coupon>(`/api/coupons/${id}`, coupon);
    return response.data;
  }

  async disableCoupon(id: string) {
    const response = await apiClient.patch<Coupon>(`/api/coupons/${id}/disable`);
    return response.data;
  }

  async getCouponAnalytics() {
    const response = await apiClient.get<CouponAnalytics>("/api/reports/discount-coupon-usage");
    return response.data;
  }

  async getReportDefinitions(): Promise<ReportDefinition[]> {
    return [
      { id: "daily-job-sheet", name: "Daily Job Sheet", description: "Operational day sheet", reportType: "daily-job-sheet", category: "operations" },
      { id: "technician-performance", name: "Technician Performance", description: "Technician performance report", reportType: "technician-performance", category: "operations" },
      { id: "sla-compliance", name: "SLA Compliance", description: "SLA compliance report", reportType: "sla-compliance", category: "operations" },
      { id: "customer-retention", name: "Customer Retention", description: "Retention report", reportType: "customer-retention", category: "customer_inventory" },
      { id: "amc-performance", name: "AMC Performance", description: "AMC report", reportType: "amc-performance", category: "customer_inventory" },
      { id: "parts-consumption", name: "Parts Consumption", description: "Inventory report", reportType: "parts-consumption", category: "customer_inventory" },
      { id: "financial-summary", name: "Financial Summary", description: "Financial summary report", reportType: "financial-summary", category: "finance" },
      { id: "warranty-revisit", name: "Warranty Revisit", description: "Warranty revisit report", reportType: "warranty-revisit", category: "customer_inventory" },
    ] satisfies ReportDefinition[];
  }

  async runReport(reportType: string, params?: Record<string, unknown>) {
    const response = await apiClient.get<ReportResult>(`/api/reports/${reportType}`, { params });
    return response.data;
  }

  async exportReport(reportType: string, params?: Record<string, unknown>) {
    const response = await apiClient.get<{ downloadUrl: string }>(`/api/reports/${reportType}`, {
      params: { ...params, export: "pdf" },
    });
    return response.data;
  }

  async getScheduledReports() {
    const response = await apiClient.get<ScheduledReport[]>("/api/reports/scheduled");
    return response.data;
  }

  async createScheduledReport(payload: Omit<ScheduledReport, "id">) {
    const response = await apiClient.post<ScheduledReport>("/api/reports/scheduled", payload);
    return response.data;
  }

  async deleteScheduledReport(id: string) {
    await apiClient.delete(`/api/reports/scheduled/${id}`);
  }

  async getAuditLogs(filters: any) {
    const response = await apiClient.get<AuditLog[]>("/api/audit-logs", { params: filters });
    return response.data;
  }

  async getDataAccessLogs() {
    const response = await apiClient.get<DataAccessLog[]>("/api/audit-logs/data-access");
    return response.data;
  }
}

export const governanceRepository: GovernanceRepository = isDemoMode()
  ? new MockGovernanceRepository()
  : new LiveGovernanceRepository();
