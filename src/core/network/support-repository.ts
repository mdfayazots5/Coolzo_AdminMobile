/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export type TicketStatus = "open" | "in_progress" | "escalated" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory = "booking_issue" | "technician_concern" | "invoice_query" | "technical_fault" | "other";

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "customer" | "agent" | "system";
  text: string;
  timestamp: string;
  attachments?: { url: string; name: string; type: string }[];
  isInternal?: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  customerId: string;
  customerName: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  linkedSrId?: string;
  linkedSrNumber?: string;
  createdAt: string;
  lastReplyAt: string;
  unreadCount: number;
  messages: TicketMessage[];
  slaDeadline: string;
}

export interface Feedback {
  id: string;
  srId: string;
  srNumber: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  technicianName: string;
  rating: number;
  subRatings: {
    punctuality: number;
    professionalism: number;
    workQuality: number;
  };
  reviewText: string;
  adminResponse?: string;
  status: "published" | "unpublished" | "flagged";
  date: string;
  isNegative: boolean;
}

export interface SupportStats {
  openTickets: number;
  avgFirstResponseTime: string;
  avgResolutionTime: string;
  slaComplianceRate: number;
  escalatedCount: number;
  volumeTrend: Array<{ day: string; count: number }>;
  agentPerformance: Array<{ name: string; tickets: number; response: string; rating: number }>;
}

export interface SupportLookupItem {
  value: number;
  label: string;
}

export interface FeedbackAnalytics {
  averageRating: number;
  npsLabel: string;
  technicianRanking: Array<{ technicianName: string; rating: number; reviewCount: number }>;
}

export interface ComplaintHeatmapCell {
  category: string;
  month: string;
  count: number;
}

export interface SupportRepository {
  getTickets(filters: any): Promise<SupportTicket[]>;
  getTicketById(id: string): Promise<SupportTicket | null>;
  createTicket(ticket: Partial<SupportTicket> & { categoryId?: number; priorityId?: number; description?: string; linkedSrId?: string }): Promise<SupportTicket>;
  addMessage(ticketId: string, message: Partial<TicketMessage>): Promise<SupportTicket>;
  assignTicket(id: string, agentId: string): Promise<SupportTicket>;
  escalateTicket(id: string, targetRole: string, reason: string): Promise<SupportTicket>;
  updateTicketStatus(id: string, status: TicketStatus): Promise<SupportTicket>;
  closeTicket(id: string, remarks?: string): Promise<SupportTicket>;
  getSupportStats(): Promise<SupportStats>;
  getTicketCategories(): Promise<SupportLookupItem[]>;
  getTicketPriorities(): Promise<SupportLookupItem[]>;
  getTicketStatuses(): Promise<SupportLookupItem[]>;
  getFeedback(filters: any): Promise<Feedback[]>;
  getFeedbackById(id: string): Promise<Feedback | null>;
  respondToFeedback(id: string, response: string): Promise<Feedback>;
  publishFeedback(id: string, publish: boolean): Promise<Feedback>;
  flagFeedback(id: string, reason: string): Promise<Feedback>;
  getNegativeFeedbackQueue(): Promise<Feedback[]>;
  getFeedbackAnalytics(): Promise<FeedbackAnalytics>;
  getComplaintHeatmap(): Promise<ComplaintHeatmapCell[]>;
}

export class MockSupportRepository implements SupportRepository {
  private tickets: SupportTicket[] = [
    {
      id: "t1",
      ticketNumber: "TCK-1001",
      subject: "AC not cooling after service",
      category: "technical_fault",
      priority: "high",
      status: "open",
      customerId: "c1",
      customerName: "Aditi Sharma",
      linkedSrId: "sr1",
      linkedSrNumber: "SR-99281",
      createdAt: "2026-04-11T08:00:00Z",
      lastReplyAt: "2026-04-11T08:00:00Z",
      unreadCount: 1,
      messages: [
        {
          id: "m1",
          senderId: "c1",
          senderName: "Aditi Sharma",
          senderRole: "customer",
          text: "The AC was serviced yesterday but it is still not cooling properly. Please check.",
          timestamp: "2026-04-11T08:00:00Z",
        },
      ],
      slaDeadline: "2026-04-11T12:00:00Z",
    },
    {
      id: "t2",
      ticketNumber: "TCK-1002",
      subject: "Incorrect amount on invoice",
      category: "invoice_query",
      priority: "medium",
      status: "escalated",
      customerId: "c2",
      customerName: "Tech Park Solutions",
      assignedAgentId: "a1",
      assignedAgentName: "Rahul Verma",
      linkedSrId: "sr2",
      linkedSrNumber: "SR-99285",
      createdAt: "2026-04-10T14:30:00Z",
      lastReplyAt: "2026-04-10T16:00:00Z",
      unreadCount: 0,
      messages: [
        {
          id: "m2",
          senderId: "c2",
          senderName: "Tech Park Solutions",
          senderRole: "customer",
          text: "The invoice shows 5 units serviced but only 4 were done.",
          timestamp: "2026-04-10T14:30:00Z",
        },
        {
          id: "m3",
          senderId: "a1",
          senderName: "Rahul Verma",
          senderRole: "agent",
          text: "I am checking this with the technician. Please wait.",
          timestamp: "2026-04-10T16:00:00Z",
        },
      ],
      slaDeadline: "2026-04-11T10:00:00Z",
    },
  ];

  private feedbacks: Feedback[] = [
    {
      id: "f1",
      srId: "sr1",
      srNumber: "SR-99281",
      customerId: "c1",
      customerName: "Aditi Sharma",
      technicianId: "t1",
      technicianName: "Suresh Kumar",
      rating: 5,
      subRatings: { punctuality: 5, professionalism: 5, workQuality: 5 },
      reviewText: "Excellent service! The technician was very professional.",
      status: "published",
      date: "2026-04-10T18:00:00Z",
      isNegative: false,
    },
    {
      id: "f2",
      srId: "sr2",
      srNumber: "SR-99285",
      customerId: "c2",
      customerName: "Tech Park Solutions",
      technicianId: "t2",
      technicianName: "Amit Patel",
      rating: 2,
      subRatings: { punctuality: 3, professionalism: 2, workQuality: 1 },
      reviewText: "Technician arrived late and the issue is still not resolved.",
      status: "flagged",
      date: "2026-04-09T11:00:00Z",
      isNegative: true,
    },
  ];

  private async wait() {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  async getTickets(_filters: any) {
    await this.wait();
    return this.tickets.map((ticket) => ({ ...ticket, messages: ticket.messages.map((message) => ({ ...message })) }));
  }

  async getTicketById(id: string) {
    await this.wait();
    const ticket = this.tickets.find((item) => item.id === id);
    return ticket ? { ...ticket, messages: ticket.messages.map((message) => ({ ...message })) } : null;
  }

  async createTicket(ticket: Partial<SupportTicket> & { categoryId?: number; priorityId?: number; description?: string; linkedSrId?: string }) {
    await this.wait();
    const created: SupportTicket = {
      id: `t${this.tickets.length + 1}`,
      ticketNumber: `TCK-${1000 + this.tickets.length + 1}`,
      subject: ticket.subject ?? "New support request",
      category: ticket.category ?? "other",
      priority: ticket.priority ?? "medium",
      status: "open",
      customerId: ticket.customerId ?? "",
      customerName: ticket.customerName ?? `Customer ${ticket.customerId ?? ""}`.trim(),
      assignedAgentId: undefined,
      assignedAgentName: undefined,
      linkedSrId: ticket.linkedSrId,
      linkedSrNumber: ticket.linkedSrId ? `SR-${ticket.linkedSrId}` : undefined,
      createdAt: new Date().toISOString(),
      lastReplyAt: new Date().toISOString(),
      unreadCount: 0,
      messages: ticket.description ? [{
        id: `m${Date.now()}`,
        senderId: ticket.customerId ?? "0",
        senderName: ticket.customerName ?? "Customer",
        senderRole: "customer",
        text: ticket.description,
        timestamp: new Date().toISOString(),
      }] : [],
      slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    };
    this.tickets.unshift(created);
    return created;
  }

  async addMessage(ticketId: string, message: Partial<TicketMessage>) {
    await this.wait();
    const ticket = this.tickets.find((item) => item.id === ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    ticket.messages.push({
      id: `m${Date.now()}`,
      senderId: message.senderId ?? "agent",
      senderName: message.senderName ?? "Agent",
      senderRole: message.senderRole ?? "agent",
      text: message.text ?? "",
      timestamp: new Date().toISOString(),
      isInternal: message.isInternal,
      attachments: message.attachments,
    });
    ticket.lastReplyAt = new Date().toISOString();
    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }
    return { ...ticket, messages: ticket.messages.map((item) => ({ ...item })) };
  }

  async assignTicket(id: string, agentId: string) {
    await this.wait();
    const ticket = this.tickets.find((item) => item.id === id);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    ticket.assignedAgentId = agentId;
    ticket.assignedAgentName = "Assigned Agent";
    return { ...ticket, messages: ticket.messages.map((item) => ({ ...item })) };
  }

  async escalateTicket(id: string, targetRole: string, reason: string) {
    await this.wait();
    const ticket = this.tickets.find((item) => item.id === id);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    ticket.status = "escalated";
    ticket.messages.push({
      id: `m${Date.now()}`,
      senderId: "system",
      senderName: "System",
      senderRole: "system",
      text: `Escalated to ${targetRole}: ${reason}`,
      timestamp: new Date().toISOString(),
      isInternal: true,
    });
    return { ...ticket, messages: ticket.messages.map((item) => ({ ...item })) };
  }

  async updateTicketStatus(id: string, status: TicketStatus) {
    await this.wait();
    const ticket = this.tickets.find((item) => item.id === id);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    ticket.status = status;
    return { ...ticket, messages: ticket.messages.map((item) => ({ ...item })) };
  }

  async closeTicket(id: string, remarks?: string) {
    await this.wait();
    const ticket = this.tickets.find((item) => item.id === id);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    ticket.status = "closed";
    if (remarks) {
      ticket.messages.push({
        id: `m${Date.now()}`,
        senderId: "system",
        senderName: "System",
        senderRole: "system",
        text: remarks,
        timestamp: new Date().toISOString(),
        isInternal: true,
      });
    }
    return { ...ticket, messages: ticket.messages.map((item) => ({ ...item })) };
  }

  async getSupportStats() {
    await this.wait();
    return {
      openTickets: this.tickets.filter((item) => item.status === "open" || item.status === "in_progress").length,
      avgFirstResponseTime: "18 mins",
      avgResolutionTime: "4.2 hours",
      slaComplianceRate: 94,
      escalatedCount: this.tickets.filter((item) => item.status === "escalated").length,
      volumeTrend: [
        { day: "Mon", count: 12 },
        { day: "Tue", count: 18 },
        { day: "Wed", count: 15 },
        { day: "Thu", count: 22 },
        { day: "Fri", count: 28 },
        { day: "Sat", count: 14 },
        { day: "Sun", count: 8 },
      ],
      agentPerformance: [
        { name: "Rahul Verma", tickets: 42, response: "12m", rating: 4.8 },
        { name: "Priya Singh", tickets: 38, response: "15m", rating: 4.9 },
        { name: "Amit Kumar", tickets: 35, response: "22m", rating: 4.5 },
      ],
    };
  }

  async getTicketCategories() {
    await this.wait();
    return [
      { value: 1, label: "Booking Issue" },
      { value: 2, label: "Technician Concern" },
      { value: 3, label: "Invoice Query" },
      { value: 4, label: "Technical Fault" },
      { value: 5, label: "Other" },
    ];
  }

  async getTicketPriorities() {
    await this.wait();
    return [
      { value: 1, label: "Low" },
      { value: 2, label: "Medium" },
      { value: 3, label: "High" },
      { value: 4, label: "Urgent" },
    ];
  }

  async getTicketStatuses() {
    await this.wait();
    return [
      { value: 1, label: "Open" },
      { value: 2, label: "InProgress" },
      { value: 3, label: "Escalated" },
      { value: 4, label: "Resolved" },
      { value: 5, label: "Closed" },
    ];
  }

  async getFeedback(_filters: any) {
    await this.wait();
    return this.feedbacks.map((feedback) => ({ ...feedback }));
  }

  async getFeedbackById(id: string) {
    await this.wait();
    const feedback = this.feedbacks.find((item) => item.id === id);
    return feedback ? { ...feedback } : null;
  }

  async respondToFeedback(id: string, response: string) {
    await this.wait();
    const feedback = this.feedbacks.find((item) => item.id === id);
    if (!feedback) {
      throw new Error("Feedback not found");
    }
    feedback.adminResponse = response;
    return { ...feedback };
  }

  async publishFeedback(id: string, publish: boolean) {
    await this.wait();
    const feedback = this.feedbacks.find((item) => item.id === id);
    if (!feedback) {
      throw new Error("Feedback not found");
    }
    feedback.status = publish ? "published" : "unpublished";
    return { ...feedback };
  }

  async flagFeedback(id: string, _reason: string) {
    await this.wait();
    const feedback = this.feedbacks.find((item) => item.id === id);
    if (!feedback) {
      throw new Error("Feedback not found");
    }
    feedback.status = "flagged";
    feedback.isNegative = true;
    return { ...feedback };
  }

  async getNegativeFeedbackQueue() {
    await this.wait();
    return this.feedbacks.filter((item) => item.rating <= 2).map((item) => ({ ...item }));
  }

  async getFeedbackAnalytics() {
    await this.wait();
    return {
      averageRating: 3.5,
      npsLabel: "Needs Attention",
      technicianRanking: [
        { technicianName: "Suresh Kumar", rating: 4.9, reviewCount: 22 },
        { technicianName: "Amit Patel", rating: 3.1, reviewCount: 11 },
      ],
    };
  }

  async getComplaintHeatmap() {
    await this.wait();
    return [
      { category: "Billing", month: "Jan", count: 3 },
      { category: "Billing", month: "Feb", count: 5 },
      { category: "Technical", month: "Jan", count: 8 },
      { category: "Technical", month: "Feb", count: 6 },
    ];
  }
}

interface BackendSupportTicketListItem {
  supportTicketId: number;
  ticketNumber: string;
  subject: string;
  customerName: string;
  customerMobile: string;
  linkedEntityType?: string | null;
  linkedEntitySummary: string;
  categoryName: string;
  priorityName: string;
  status: string;
  assignedUserId?: number | null;
  assignedOwnerName?: string | null;
  dateCreated: string;
  lastUpdated?: string | null;
}

interface BackendSupportTicketDetail extends BackendSupportTicketListItem {
  description: string;
  customerId: number;
  customerEmail: string;
  supportTicketCategoryId: number;
  supportTicketPriorityId: number;
  canCustomerClose: boolean;
  canManage: boolean;
  links: {
    supportTicketLinkId: number;
    linkedEntityType: string;
    linkedEntityId: number;
    linkReference: string;
    linkSummary: string;
  }[];
  replies: BackendSupportTicketReply[];
}

interface BackendSupportTicketReply {
  supportTicketReplyId: number;
  replyText: string;
  isInternalOnly: boolean;
  isFromCustomer: boolean;
  createdBy: string;
  replyDateUtc: string;
}

interface BackendSupportAnalytics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  escalationCount: number;
  averageResolutionHours: number;
}

interface BackendCustomerReview {
  customerReviewId: number;
  customerId: number;
  userName: string;
  rating: number;
  comment: string;
  bookingId?: number | null;
  serviceId?: number | null;
  createdAt: string;
}

export class LiveSupportRepository implements SupportRepository {
  async getTickets(filters: any) {
    const response = await apiClient.get<BackendSupportTicketListItem[]>("/api/v1/support-tickets", {
      params: toSupportTicketSearchParams(filters),
    });
    return response.data.map(mapTicketListItem);
  }

  async getTicketById(id: string) {
    const response = await apiClient.get<BackendSupportTicketDetail>(`/api/v1/support-tickets/${id}`);
    return mapTicketDetail(response.data);
  }

  async createTicket(ticket: Partial<SupportTicket> & { categoryId?: number; priorityId?: number; description?: string; linkedSrId?: string }) {
    const response = await apiClient.post<BackendSupportTicketDetail>("/api/v1/support-tickets", {
      customerId: Number(ticket.customerId || 0) || null,
      subject: ticket.subject,
      categoryId: ticket.categoryId || Number(ticket.category) || 1,
      priorityId: ticket.priorityId || Number(ticket.priority) || 1,
      description: ticket.description || ticket.messages?.[0]?.text || ticket.subject || "Created from admin mobile.",
      links: ticket.linkedSrId ? [{
        linkedEntityType: "ServiceRequest",
        linkedEntityId: Number(ticket.linkedSrId),
      }] : [],
    });

    return mapTicketDetail(response.data);
  }

  async addMessage(ticketId: string, message: Partial<TicketMessage>) {
    await apiClient.post(`/api/v1/support-tickets/${ticketId}/replies`, {
      replyText: message.text,
      isInternalOnly: Boolean(message.isInternal),
    });

    const refreshed = await this.getTicketById(ticketId);
    if (!refreshed) {
      throw new Error("Ticket not found after reply");
    }
    return refreshed;
  }

  async assignTicket(id: string, agentId: string) {
    await apiClient.post(`/api/v1/support-tickets/${id}/assign`, {
      assignedUserId: Number(agentId),
      remarks: "Assigned from admin mobile.",
    });
    const refreshed = await this.getTicketById(id);
    if (!refreshed) {
      throw new Error("Ticket not found after assignment");
    }
    return refreshed;
  }

  async escalateTicket(id: string, targetRole: string, reason: string) {
    await apiClient.post(`/api/v1/support-tickets/${id}/escalate`, {
      escalationTarget: targetRole,
      escalationRemarks: reason,
    });
    const refreshed = await this.getTicketById(id);
    if (!refreshed) {
      throw new Error("Ticket not found after escalation");
    }
    return refreshed;
  }

  async updateTicketStatus(id: string, status: TicketStatus) {
    await apiClient.post(`/api/v1/support-tickets/${id}/change-status`, {
      status: toBackendStatus(status),
      remarks: "Status updated from admin mobile.",
    });
    const refreshed = await this.getTicketById(id);
    if (!refreshed) {
      throw new Error("Ticket not found after status update");
    }
    return refreshed;
  }

  async closeTicket(id: string, remarks?: string) {
    await apiClient.post(`/api/v1/support-tickets/${id}/close`, {
      remarks: remarks || "Closed from admin mobile.",
    });
    const refreshed = await this.getTicketById(id);
    if (!refreshed) {
      throw new Error("Ticket not found after close");
    }
    return refreshed;
  }

  async getSupportStats() {
    const analyticsResponse = await apiClient.get<BackendSupportAnalytics>("/api/v1/analytics/support");
    const tickets = await this.getTickets({});
    const analytics = analyticsResponse.data;
    const totalTickets = Number(analytics.totalTickets || 0);
    const resolvedTickets = Number(analytics.resolvedTickets || 0);

    return {
      openTickets: analytics.openTickets,
      avgFirstResponseTime: "N/A",
      avgResolutionTime: `${Number(analytics.averageResolutionHours || 0).toFixed(1)} hours`,
      slaComplianceRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
      escalatedCount: analytics.escalationCount,
      volumeTrend: buildVolumeTrend(tickets),
      agentPerformance: buildAgentPerformance(tickets),
    };
  }

  async getTicketCategories() {
    const response = await apiClient.get<SupportLookupItem[]>("/api/v1/support-ticket-lookups/categories");
    return response.data;
  }

  async getTicketPriorities() {
    const response = await apiClient.get<SupportLookupItem[]>("/api/v1/support-ticket-lookups/priorities");
    return response.data;
  }

  async getTicketStatuses() {
    const response = await apiClient.get<SupportLookupItem[]>("/api/v1/support-ticket-lookups/statuses");
    return response.data;
  }

  async getFeedback(filters: any) {
    const response = await apiClient.get<BackendCustomerReview[]>("/api/v1/customer-reviews", {
      params: { serviceId: filters?.serviceId },
    });
    const mapped = response.data.map(mapCustomerReview);
    return mapped.filter((item) => (filters?.negativeOnly ? item.rating <= 2 : true));
  }

  async getFeedbackById(id: string) {
    const all = await this.getFeedback({});
    return all.find((item) => item.id === id) || null;
  }

  async respondToFeedback(id: string, response: string) {
    const backendResponse = await apiClient.patch<Feedback>(`/api/v1/feedback/${id}/respond`, { response });
    return backendResponse.data;
  }

  async publishFeedback(id: string, publish: boolean) {
    const backendResponse = await apiClient.patch<Feedback>(`/api/v1/feedback/${id}/publish`, { publish });
    return backendResponse.data;
  }

  async flagFeedback(id: string, reason: string) {
    const backendResponse = await apiClient.patch<Feedback>(`/api/v1/feedback/${id}/flag`, { reason });
    return backendResponse.data;
  }

  async getNegativeFeedbackQueue() {
    const response = await apiClient.get<Feedback[]>("/api/v1/feedback/negative-queue");
    return response.data;
  }

  async getFeedbackAnalytics() {
    const response = await apiClient.get<FeedbackAnalytics>("/api/v1/feedback/analytics");
    return response.data;
  }

  async getComplaintHeatmap() {
    const response = await apiClient.get<ComplaintHeatmapCell[]>("/api/v1/feedback/complaint-heatmap");
    return response.data;
  }
}

const toSupportTicketSearchParams = (filters: any) => ({
  ticketNumber: filters?.ticketNumber || filters?.search || undefined,
  customerMobile: filters?.customerMobile || undefined,
  categoryId: filters?.categoryId || undefined,
  priorityId: filters?.priorityId || undefined,
  status: filters?.status ? toBackendStatus(filters.status) : undefined,
  dateFrom: filters?.dateFrom || undefined,
  dateTo: filters?.dateTo || undefined,
  linkedEntityType: filters?.linkedEntityType || undefined,
  pageNumber: filters?.pageNumber || 1,
  pageSize: filters?.pageSize || 20,
});

const mapTicketListItem = (ticket: BackendSupportTicketListItem): SupportTicket => ({
  id: String(ticket.supportTicketId),
  ticketNumber: ticket.ticketNumber,
  subject: ticket.subject,
  category: toTicketCategory(ticket.categoryName),
  priority: toTicketPriority(ticket.priorityName),
  status: toTicketStatus(ticket.status),
  customerId: String((ticket as BackendSupportTicketDetail).customerId || ""),
  customerName: ticket.customerName,
  assignedAgentId: ticket.assignedUserId ? String(ticket.assignedUserId) : undefined,
  assignedAgentName: ticket.assignedOwnerName || undefined,
  linkedSrId: ticket.linkedEntityType === "ServiceRequest" ? ticket.linkedEntitySummary : undefined,
  linkedSrNumber: ticket.linkedEntitySummary === "No linked entity" ? undefined : ticket.linkedEntitySummary,
  createdAt: ticket.dateCreated,
  lastReplyAt: ticket.lastUpdated || ticket.dateCreated,
  unreadCount: 0,
  messages: [],
  slaDeadline: buildSlaDeadline(ticket.dateCreated, ticket.priorityName),
});

const mapTicketDetail = (ticket: BackendSupportTicketDetail): SupportTicket => {
  const serviceRequestLink = ticket.links?.find((link) => link.linkedEntityType === "ServiceRequest");
  const messages: TicketMessage[] = [
    {
      id: `description-${ticket.supportTicketId}`,
      senderId: String(ticket.customerId),
      senderName: ticket.customerName,
      senderRole: "customer",
      text: ticket.description,
      timestamp: ticket.dateCreated,
      isInternal: false,
    },
    ...(ticket.replies || []).map(mapReply),
  ];

  return {
    ...mapTicketListItem(ticket),
    customerId: String(ticket.customerId),
    linkedSrId: serviceRequestLink ? String(serviceRequestLink.linkedEntityId) : undefined,
    linkedSrNumber: serviceRequestLink?.linkReference,
    messages,
    lastReplyAt: messages[messages.length - 1]?.timestamp || ticket.lastUpdated || ticket.dateCreated,
  };
};

const mapReply = (reply: BackendSupportTicketReply): TicketMessage => ({
  id: String(reply.supportTicketReplyId),
  senderId: reply.createdBy,
  senderName: reply.isFromCustomer ? "Customer" : reply.createdBy,
  senderRole: reply.isFromCustomer ? "customer" : "agent",
  text: reply.replyText,
  timestamp: reply.replyDateUtc,
  isInternal: reply.isInternalOnly,
});

const mapCustomerReview = (review: BackendCustomerReview): Feedback => ({
  id: String(review.customerReviewId),
  srId: review.serviceId ? String(review.serviceId) : "",
  srNumber: review.serviceId ? `SR-${review.serviceId}` : review.bookingId ? `BK-${review.bookingId}` : "Unlinked",
  customerId: String(review.customerId),
  customerName: review.userName,
  technicianId: "",
  technicianName: "Unassigned",
  rating: review.rating,
  subRatings: {
    punctuality: review.rating,
    professionalism: review.rating,
    workQuality: review.rating,
  },
  reviewText: review.comment,
  status: review.rating <= 2 ? "flagged" : "published",
  date: review.createdAt,
  isNegative: review.rating <= 2,
});

const toTicketCategory = (categoryName: string): TicketCategory => {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes("booking")) return "booking_issue";
  if (normalized.includes("technician")) return "technician_concern";
  if (normalized.includes("invoice") || normalized.includes("billing")) return "invoice_query";
  if (normalized.includes("technical") || normalized.includes("fault")) return "technical_fault";
  return "other";
};

const toTicketPriority = (priorityName: string): TicketPriority => {
  const normalized = priorityName.toLowerCase();
  if (normalized.includes("urgent") || normalized.includes("critical")) return "urgent";
  if (normalized.includes("high")) return "high";
  if (normalized.includes("low")) return "low";
  return "medium";
};

const toTicketStatus = (status: string): TicketStatus => {
  const normalized = status.replace(/\s+/g, "").toLowerCase();
  if (normalized === "inprogress" || normalized === "waitingforcustomer" || normalized === "customerresponded") return "in_progress";
  if (normalized === "escalated") return "escalated";
  if (normalized === "resolved") return "resolved";
  if (normalized === "closed") return "closed";
  return "open";
};

const toBackendStatus = (status: string) => {
  if (status === "in_progress") return "InProgress";
  if (status === "escalated") return "Escalated";
  if (status === "resolved") return "Resolved";
  if (status === "closed") return "Closed";
  return "Open";
};

const buildSlaDeadline = (createdAt: string, priorityName: string) => {
  const createdDate = new Date(createdAt);
  const hoursByPriority: Record<TicketPriority, number> = {
    urgent: 2,
    high: 4,
    medium: 8,
    low: 24,
  };
  createdDate.setHours(createdDate.getHours() + hoursByPriority[toTicketPriority(priorityName)]);
  return createdDate.toISOString();
};

const buildVolumeTrend = (tickets: SupportTicket[]) => {
  const buckets = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({ day, count: 0 }));
  tickets.forEach((ticket) => {
    const dayIndex = new Date(ticket.createdAt).getDay();
    buckets[dayIndex].count += 1;
  });
  return buckets;
};

const buildAgentPerformance = (tickets: SupportTicket[]) => {
  const grouped = new Map<string, { name: string; tickets: number }>();
  tickets.forEach((ticket) => {
    const name = ticket.assignedAgentName || "Unassigned";
    const current = grouped.get(name) ?? { name, tickets: 0 };
    current.tickets += 1;
    grouped.set(name, current);
  });
  return Array.from(grouped.values()).map((item) => ({
    ...item,
    response: item.name === "Unassigned" ? "N/A" : "18m",
    rating: item.name === "Unassigned" ? 0 : 4.6,
  }));
};

export const supportRepository: SupportRepository = isDemoMode()
  ? new MockSupportRepository()
  : new LiveSupportRepository();
