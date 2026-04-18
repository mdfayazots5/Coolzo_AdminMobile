/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NotificationChannel = 'whatsapp' | 'email' | 'sms' | 'push';

export interface NotificationTemplate {
  id: string;
  triggerEvent: string;
  channel: NotificationChannel;
  recipientType: 'customer' | 'technician' | 'ops_team';
  subject?: string;
  body: string;
  isEnabled: boolean;
  version: number;
  lastUpdated: string;
}

export interface CMSContent {
  id: string;
  type: 'banner' | 'faq' | 'article' | 'testimonial' | 'service_description';
  title: string;
  content: any;
  status: 'published' | 'draft' | 'archived';
  lastUpdated: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'export';
  entityType: string;
  entityId: string;
  details: string;
  diff?: { before: any; after: any };
  ipAddress: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  value: number;
  expiryDate: string;
  usageLimit: number;
  currentUsage: number;
  status: 'active' | 'expired' | 'disabled';
  minOrderValue?: number;
}

export interface GovernanceRepository {
  getNotificationTemplates(): Promise<NotificationTemplate[]>;
  updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>): Promise<void>;
  getCMSContent(type?: string): Promise<CMSContent[]>;
  updateCMSContent(id: string, data: Partial<CMSContent>): Promise<void>;
  deleteCMSContent(id: string): Promise<void>;
  getAuditLogs(filters: any): Promise<AuditLog[]>;
  getCoupons(): Promise<Coupon[]>;
  createCoupon(coupon: Partial<Coupon>): Promise<Coupon>;
}

export class MockGovernanceRepository implements GovernanceRepository {
  private templates: NotificationTemplate[] = [
    {
      id: 'nt1',
      triggerEvent: 'Booking Confirmed',
      channel: 'whatsapp',
      recipientType: 'customer',
      body: 'Hi {CustomerName}, your booking {JobNo} is confirmed for {ETATime}.',
      isEnabled: true,
      version: 3,
      lastUpdated: '2024-04-10T10:00:00Z'
    },
    {
      id: 'nt2',
      triggerEvent: 'Technician Assigned',
      channel: 'push',
      recipientType: 'technician',
      body: 'New job assigned: {JobNo} at {CustomerAddress}.',
      isEnabled: true,
      version: 1,
      lastUpdated: '2024-04-09T15:30:00Z'
    }
  ];

  private cms: CMSContent[] = [
    {
      id: 'cms1',
      type: 'banner',
      title: 'Monsoon Special Offer',
      content: { image: 'https://picsum.photos/seed/monsoon/1200/400', headline: 'Stay Cool This Monsoon', cta: 'Book Now' },
      status: 'published',
      lastUpdated: '2024-04-11T09:00:00Z'
    }
  ];

  private logs: AuditLog[] = [
    {
      id: 'log1',
      timestamp: '2024-04-11T10:45:00Z',
      userId: 'u1',
      userName: 'Fayaz Ahmed',
      userRole: 'Super Admin',
      action: 'update',
      entityType: 'Invoice',
      entityId: 'INV-2024-001',
      details: 'Updated discount from 0 to 500',
      diff: { before: { discount: 0 }, after: { discount: 500 } },
      ipAddress: '192.168.1.1'
    }
  ];

  private coupons: Coupon[] = [
    {
      id: 'cp1',
      code: 'COOL20',
      discountType: 'percentage',
      value: 20,
      expiryDate: '2024-12-31',
      usageLimit: 1000,
      currentUsage: 145,
      status: 'active'
    }
  ];

  async getNotificationTemplates() {
    return this.templates;
  }

  async updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>) {
    const idx = this.templates.findIndex(t => t.id === id);
    if (idx !== -1) this.templates[idx] = { ...this.templates[idx], ...data, lastUpdated: new Date().toISOString() };
  }

  async getCMSContent(type?: string) {
    return type ? this.cms.filter(c => c.type === type) : this.cms;
  }

  async updateCMSContent(id: string, data: Partial<CMSContent>) {
    const idx = this.cms.findIndex(c => c.id === id);
    if (idx !== -1) this.cms[idx] = { ...this.cms[idx], ...data, lastUpdated: new Date().toISOString() };
  }

  async deleteCMSContent(id: string) {
    this.cms = this.cms.filter(c => c.id !== id);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async getAuditLogs(_filters: any) {
    return this.logs;
  }

  async getCoupons() {
    return this.coupons;
  }

  async createCoupon(coupon: Partial<Coupon>) {
    const newCoupon = { ...coupon, id: 'cp' + Date.now(), currentUsage: 0, status: 'active' } as Coupon;
    this.coupons.push(newCoupon);
    return newCoupon;
  }
}

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export class LiveGovernanceRepository implements GovernanceRepository {
  async getNotificationTemplates() {
    const response = await apiClient.get<NotificationTemplate[]>('/api/v1/governance/notifications/templates');
    return response.data;
  }

  async updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>) {
    await apiClient.patch(`/api/v1/governance/notifications/templates/${id}`, data);
  }

  async getCMSContent(type?: string) {
    const response = await apiClient.get<CMSContent[]>('/api/v1/governance/cms/content', { params: { type } });
    return response.data;
  }

  async updateCMSContent(id: string, data: Partial<CMSContent>) {
    await apiClient.patch(`/api/v1/governance/cms/content/${id}`, data);
  }

  async deleteCMSContent(id: string) {
    await apiClient.delete(`/api/v1/governance/cms/content/${id}`);
  }

  async getAuditLogs(filters: any) {
    const response = await apiClient.get<AuditLog[]>('/api/v1/governance/audit-logs', { params: filters });
    return response.data;
  }

  async getCoupons() {
    const response = await apiClient.get<Coupon[]>('/api/v1/governance/coupons');
    return response.data;
  }

  async createCoupon(coupon: Partial<Coupon>) {
    const response = await apiClient.post<Coupon>('/api/v1/governance/coupons', coupon);
    return response.data;
  }
}

export const governanceRepository: GovernanceRepository = isDemoMode()
  ? new MockGovernanceRepository()
  : new LiveGovernanceRepository();
