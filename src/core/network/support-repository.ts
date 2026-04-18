/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TicketStatus = 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'booking_issue' | 'technician_concern' | 'invoice_query' | 'technical_fault' | 'other';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'agent' | 'system';
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
  status: 'published' | 'unpublished' | 'flagged';
  date: string;
  isNegative: boolean;
}

export interface SupportStats {
  openTickets: number;
  avgFirstResponseTime: string;
  avgResolutionTime: string;
  slaComplianceRate: number;
  escalatedCount: number;
}

export interface SupportRepository {
  getTickets(filters: any): Promise<SupportTicket[]>;
  getTicketById(id: string): Promise<SupportTicket | null>;
  createTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket>;
  addMessage(ticketId: string, message: Partial<TicketMessage>): Promise<SupportTicket>;
  updateTicketStatus(id: string, status: TicketStatus, agentId?: string): Promise<void>;
  getSupportStats(): Promise<SupportStats>;
  getFeedback(filters: any): Promise<Feedback[]>;
  getFeedbackById(id: string): Promise<Feedback | null>;
  respondToFeedback(id: string, response: string): Promise<void>;
}

export class MockSupportRepository implements SupportRepository {
  private tickets: SupportTicket[] = [
    {
      id: 't1',
      ticketNumber: 'TCK-1001',
      subject: 'AC not cooling after service',
      category: 'technical_fault',
      priority: 'high',
      status: 'open',
      customerId: 'c1',
      customerName: 'Aditi Sharma',
      linkedSrId: 'sr1',
      linkedSrNumber: 'SR-99281',
      createdAt: '2024-04-11T08:00:00Z',
      lastReplyAt: '2024-04-11T08:00:00Z',
      unreadCount: 1,
      messages: [
        { id: 'm1', senderId: 'c1', senderName: 'Aditi Sharma', senderRole: 'customer', text: 'The AC was serviced yesterday but it is still not cooling properly. Please check.', timestamp: '2024-04-11T08:00:00Z' }
      ],
      slaDeadline: '2024-04-11T12:00:00Z'
    },
    {
      id: 't2',
      ticketNumber: 'TCK-1002',
      subject: 'Incorrect amount on invoice',
      category: 'invoice_query',
      priority: 'medium',
      status: 'escalated',
      customerId: 'c2',
      customerName: 'Tech Park Solutions',
      assignedAgentId: 'a1',
      assignedAgentName: 'Rahul Verma',
      createdAt: '2024-04-10T14:30:00Z',
      lastReplyAt: '2024-04-10T16:00:00Z',
      unreadCount: 0,
      messages: [
        { id: 'm2', senderId: 'c2', senderName: 'Tech Park Solutions', senderRole: 'customer', text: 'The invoice shows 5 units serviced but only 4 were done.', timestamp: '2024-04-10T14:30:00Z' },
        { id: 'm3', senderId: 'a1', senderName: 'Rahul Verma', senderRole: 'agent', text: 'I am checking this with the technician. Please wait.', timestamp: '2024-04-10T16:00:00Z' }
      ],
      slaDeadline: '2024-04-11T10:00:00Z'
    }
  ];

  private feedbacks: Feedback[] = [
    {
      id: 'f1',
      srId: 'sr1',
      srNumber: 'SR-99281',
      customerId: 'c1',
      customerName: 'Aditi Sharma',
      technicianId: 't1',
      technicianName: 'Suresh Kumar',
      rating: 5,
      subRatings: { punctuality: 5, professionalism: 5, workQuality: 5 },
      reviewText: 'Excellent service! The technician was very professional.',
      status: 'published',
      date: '2024-04-10T18:00:00Z',
      isNegative: false
    },
    {
      id: 'f2',
      srId: 'sr2',
      srNumber: 'SR-99285',
      customerId: 'c2',
      customerName: 'Tech Park Solutions',
      technicianId: 't2',
      technicianName: 'Amit Patel',
      rating: 2,
      subRatings: { punctuality: 3, professionalism: 2, workQuality: 1 },
      reviewText: 'Technician arrived late and the issue is still not resolved.',
      status: 'flagged',
      date: '2024-04-09T11:00:00Z',
      isNegative: true
    }
  ];

  async getTickets(_filters: any) {
    await new Promise(r => setTimeout(r, 500));
    return this.tickets;
  }

  async getTicketById(id: string) {
    return this.tickets.find(t => t.id === id) || null;
  }

  async createTicket(ticket: Partial<SupportTicket>) {
    const newTicket = {
      ...ticket,
      id: 't' + (this.tickets.length + 1),
      ticketNumber: 'TCK-' + (1000 + this.tickets.length + 1),
      createdAt: new Date().toISOString(),
      lastReplyAt: new Date().toISOString(),
      unreadCount: 0,
      messages: ticket.messages || [],
      status: 'open'
    } as SupportTicket;
    this.tickets.push(newTicket);
    return newTicket;
  }

  async addMessage(ticketId: string, message: Partial<TicketMessage>) {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (ticket) {
      const newMessage = {
        ...message,
        id: 'm' + (ticket.messages.length + 1),
        timestamp: new Date().toISOString()
      } as TicketMessage;
      ticket.messages.push(newMessage);
      ticket.lastReplyAt = newMessage.timestamp;
      return ticket;
    }
    throw new Error('Ticket not found');
  }

  async updateTicketStatus(id: string, status: TicketStatus, agentId?: string) {
    const ticket = this.tickets.find(t => t.id === id);
    if (ticket) {
      ticket.status = status;
      if (agentId) ticket.assignedAgentId = agentId;
    }
  }

  async getSupportStats() {
    return {
      openTickets: this.tickets.filter(t => t.status === 'open').length,
      avgFirstResponseTime: '18 mins',
      avgResolutionTime: '4.2 hours',
      slaComplianceRate: 94,
      escalatedCount: this.tickets.filter(t => t.status === 'escalated').length
    };
  }

  async getFeedback(_filters: any) {
    return this.feedbacks;
  }

  async getFeedbackById(id: string) {
    return this.feedbacks.find(f => f.id === id) || null;
  }

  async respondToFeedback(id: string, response: string) {
    const f = this.feedbacks.find(fb => fb.id === id);
    if (f) f.adminResponse = response;
  }
}

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export class LiveSupportRepository implements SupportRepository {
  async getTickets(filters: any) {
    const response = await apiClient.get<SupportTicket[]>('/api/v1/support/tickets', { params: filters });
    return response.data;
  }

  async getTicketById(id: string) {
    const response = await apiClient.get<SupportTicket>(`/api/v1/support/tickets/${id}`);
    return response.data;
  }

  async createTicket(ticket: Partial<SupportTicket>) {
    const response = await apiClient.post<SupportTicket>('/api/v1/support/tickets', ticket);
    return response.data;
  }

  async addMessage(ticketId: string, message: Partial<TicketMessage>) {
    const response = await apiClient.post<SupportTicket>(`/api/v1/support/tickets/${ticketId}/messages`, message);
    return response.data;
  }

  async updateTicketStatus(id: string, status: TicketStatus, agentId?: string) {
    await apiClient.patch(`/api/v1/support/tickets/${id}/status`, { status, agentId });
  }

  async getSupportStats() {
    const response = await apiClient.get<SupportStats>('/api/v1/support/stats');
    return response.data;
  }

  async getFeedback(filters: any) {
    const response = await apiClient.get<Feedback[]>('/api/v1/support/feedback', { params: filters });
    return response.data;
  }

  async getFeedbackById(id: string) {
    const response = await apiClient.get<Feedback>(`/api/v1/support/feedback/${id}`);
    return response.data;
  }

  async respondToFeedback(id: string, response: string) {
    await apiClient.post(`/api/v1/support/feedback/${id}/respond`, { response });
  }
}

export const supportRepository: SupportRepository = isDemoMode()
  ? new MockSupportRepository()
  : new LiveSupportRepository();
