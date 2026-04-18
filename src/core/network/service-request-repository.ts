import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export type SRStatus = 'pending' | 'assigned' | 'en-route' | 'arrived' | 'in-progress' | 'completed' | 'closed' | 'cancelled';
export type SRPriority = 'normal' | 'urgent' | 'emergency';

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'pending' | 'current' | 'completed';
  timestamp?: string;
}

export interface ServiceRequest {
  id: string;
  srNumber: string;
  status: SRStatus;
  priority: SRPriority;
  serviceType: string;
  subType?: string;
  
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    type: 'residential' | 'commercial' | 'enterprise';
    isAMC: boolean;
  };
  
  location: {
    address: string;
    zoneId: string;
    city: string;
    coordinates?: { lat: number; lng: number };
    accessNotes?: string;
  };
  
  equipment: {
    brand: string;
    model: string;
    type: string;
    tonnage: string;
    serialNumber?: string;
    conditionOnArrival?: 'good' | 'fair' | 'poor' | 'critical';
  };
  
  scheduling: {
    requestedDate: string;
    requestedSlot: string;
    confirmedDate?: string;
    confirmedSlot?: string;
    assignedTechnicianId?: string;
    assignedTechnicianName?: string;
    startTime?: string; // ISO string
    endTime?: string;   // ISO string
    estimatedDuration?: number; // minutes
  };

  fieldWorkflow?: {
    currentStep: string;
    steps: WorkflowStep[];
    checkInTime?: string;
    checkInCoordinates?: { lat: number; lng: number };
    startTime?: string;
    endTime?: string;
    checklist: { id: string; task: string; isCompleted: boolean; isMandatory: boolean }[];
    photos: { id: string; url: string; type: 'before' | 'after' | 'issue' | 'during'; timestamp: string }[];
    signature?: { customerName: string; signatureUrl: string; timestamp: string };
    payment?: { method: 'cash' | 'online'; amount: number; status: 'pending' | 'collected'; timestamp: string };
    issuesIdentified?: string[];
    actionTaken?: string;
    recommendations?: string;
  };
  
  timeline: {
    status: SRStatus;
    timestamp: string;
    actor: string;
    note?: string;
  }[];
  
  internalNotes: {
    id: string;
    author: string;
    timestamp: string;
    content: string;
    isEscalation?: boolean;
  }[];
  
  communicationLog: {
    id: string;
    channel: 'WhatsApp' | 'Email' | 'SMS' | 'Push';
    recipient: string;
    timestamp: string;
    status: 'delivered' | 'failed' | 'sent';
    subject: string;
  }[];
  
  createdAt: string;
  createdBy: string;
  isEscalated?: boolean;
  escalationReason?: string;
}

export interface ServiceRequestRepository {
  getSRs(filters: any): Promise<ServiceRequest[]>;
  getSRById(id: string): Promise<ServiceRequest | null>;
  createSR(sr: Partial<ServiceRequest>): Promise<ServiceRequest>;
  updateSR(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest>;
  assignTechnician(srId: string, technicianId: string, technicianName: string): Promise<void>;
  rescheduleSR(srId: string, date: string, slot: string, reason: string): Promise<void>;
  cancelSR(srId: string, reason: string): Promise<void>;
  escalateSR(srId: string, type: string, note: string): Promise<void>;
  addInternalNote(srId: string, content: string, isEscalation?: boolean): Promise<void>;
  getOperationsStats(): Promise<{
    total: number;
    assigned: number;
    inProgress: number;
    completed: number;
    pending: number;
    overdue: number;
    slaCompliance: number;
    activeTechs: number;
    avgResponseTime: string;
  }>;
  getSLAAlerts(): Promise<ServiceRequest[]>;
  getTechnicianJobs(technicianId: string): Promise<ServiceRequest[]>;
  updateJobStatus(id: string, status: SRStatus, location?: { lat: number; lng: number }): Promise<void>;
  submitServiceReport(id: string, reportData: any): Promise<void>;
  submitSignature(id: string, signatureData: { customerName: string; signatureUrl: string }): Promise<void>;
}

export class MockServiceRequestRepository implements ServiceRequestRepository {
  private srs: ServiceRequest[] = [
    {
      id: 'sr1',
      srNumber: 'SR-99281',
      status: 'pending',
      priority: 'urgent',
      serviceType: 'AC Deep Cleaning',
      customer: { id: 'c1', name: 'Rajesh Kumar', phone: '+91 98200 12345', email: 'rajesh@example.com', type: 'residential', isAMC: true },
      location: { address: 'Flat 402, Sea View Apartments, Bandra West', zoneId: 'z2', city: 'Mumbai' },
      equipment: { brand: 'Daikin', model: 'FTKF Series', type: 'Split AC', tonnage: '1.5 Ton' },
      scheduling: { requestedDate: '2024-04-12', requestedSlot: '10:00 AM - 12:00 PM' },
      timeline: [{ status: 'pending', timestamp: '2024-04-11T09:00:00Z', actor: 'CS Agent (Priya)' }],
      internalNotes: [],
      communicationLog: [{ id: 'l1', channel: 'WhatsApp', recipient: '+91 98200 12345', timestamp: '2024-04-11T09:05:00Z', status: 'delivered', subject: 'SR Confirmation' }],
      createdAt: '2024-04-11T09:00:00Z',
      createdBy: 'Priya Singh'
    },
    {
      id: 'sr2',
      srNumber: 'SR-99282',
      status: 'assigned',
      priority: 'emergency',
      serviceType: 'Gas Charging',
      customer: { id: 'c2', name: 'Hotel Marine Plaza', phone: '+91 22 6633 4455', email: 'maintenance@marineplaza.com', type: 'enterprise', isAMC: false },
      location: { address: 'Marine Drive, Churchgate', zoneId: 'z1', city: 'Mumbai' },
      equipment: { brand: 'Blue Star', model: 'VRF V Plus', type: 'VRF System', tonnage: '10 Ton' },
      scheduling: { requestedDate: '2024-04-11', requestedSlot: 'ASAP', assignedTechnicianId: 't1', assignedTechnicianName: 'Suresh Kumar' },
      timeline: [
        { status: 'pending', timestamp: '2024-04-11T08:30:00Z', actor: 'CS Agent (Priya)' },
        { status: 'assigned', timestamp: '2024-04-11T08:45:00Z', actor: 'Ops Exec (Rahul)' }
      ],
      internalNotes: [{ id: 'n1', author: 'Rahul Sharma', timestamp: '2024-04-11T08:45:00Z', content: 'Urgent requirement for hotel lobby. Suresh is nearby.' }],
      communicationLog: [],
      createdAt: '2024-04-11T08:30:00Z',
      createdBy: 'Priya Singh',
      isEscalated: true,
      escalationReason: 'SLA Breach Risk'
    },
    {
      id: 'sr3',
      srNumber: 'SR-99283',
      status: 'assigned',
      priority: 'normal',
      serviceType: 'AC Maintenance',
      customer: { id: 'c3', name: 'Anjali Sharma', phone: '+91 98111 22233', email: 'anjali@example.com', type: 'residential', isAMC: true },
      location: { address: 'Apt 1201, Lodha Bellissimo, Mahalaxmi', zoneId: 'z3', city: 'Mumbai', coordinates: { lat: 18.9827, lng: 72.8311 } },
      equipment: { brand: 'Mitsubishi', model: 'MSY-GN', type: 'Split AC', tonnage: '2.0 Ton' },
      scheduling: { 
        requestedDate: '2024-04-12', 
        requestedSlot: '09:00 AM - 11:00 AM', 
        assignedTechnicianId: 't1', 
        assignedTechnicianName: 'Suresh Kumar',
        startTime: '2024-04-12T09:00:00Z',
        estimatedDuration: 90
      },
      fieldWorkflow: {
        currentStep: 'en-route',
        steps: [
          { id: 'en-route', label: 'En Route', status: 'current' },
          { id: 'arrived', label: 'Arrived', status: 'pending' },
          { id: 'in-progress', label: 'In Progress', status: 'pending' },
          { id: 'report', label: 'Service Report', status: 'pending' },
          { id: 'payment', label: 'Payment', status: 'pending' }
        ],
        checklist: [
          { id: '1', task: 'Filter cleaning', isCompleted: false, isMandatory: true },
          { id: '2', task: 'Coil inspection', isCompleted: false, isMandatory: true },
          { id: '3', task: 'Gas pressure check', isCompleted: false, isMandatory: false }
        ],
        photos: []
      },
      timeline: [
        { status: 'pending', timestamp: '2024-04-11T15:00:00Z', actor: 'System' },
        { status: 'assigned', timestamp: '2024-04-11T16:00:00Z', actor: 'Ops Manager' }
      ],
      internalNotes: [],
      communicationLog: [],
      createdAt: '2024-04-11T15:00:00Z',
      createdBy: 'System'
    }
  ];

  async getSRs(_filters: any) {
    await new Promise(r => setTimeout(r, 600));
    return this.srs;
  }

  async getSRById(id: string) {
    return this.srs.find(s => s.id === id) || null;
  }

  async createSR(sr: Partial<ServiceRequest>) {
    const newSR = {
      ...sr,
      id: 'sr' + (this.srs.length + 1),
      srNumber: 'SR-' + (99280 + this.srs.length + 1),
      status: 'pending',
      createdAt: new Date().toISOString(),
      timeline: [{ status: 'pending', timestamp: new Date().toISOString(), actor: 'Current User' }],
      internalNotes: [],
      communicationLog: []
    } as ServiceRequest;
    this.srs.push(newSR);
    return newSR;
  }

  async updateSR(id: string, data: Partial<ServiceRequest>) {
    const i = this.srs.findIndex(s => s.id === id);
    this.srs[i] = { ...this.srs[i], ...data };
    return this.srs[i];
  }

  async assignTechnician(srId: string, technicianId: string, technicianName: string) {
    const sr = await this.getSRById(srId);
    if (sr) {
      sr.status = 'assigned';
      sr.scheduling.assignedTechnicianId = technicianId;
      sr.scheduling.assignedTechnicianName = technicianName;
      sr.timeline.push({ status: 'assigned', timestamp: new Date().toISOString(), actor: 'Ops Exec' });
    }
  }

  async rescheduleSR(srId: string, date: string, slot: string, reason: string) {
    const sr = await this.getSRById(srId);
    if (sr) {
      sr.scheduling.confirmedDate = date;
      sr.scheduling.confirmedSlot = slot;
      sr.timeline.push({ status: sr.status, timestamp: new Date().toISOString(), actor: 'Ops Exec', note: `Rescheduled: ${reason}` });
    }
  }

  async cancelSR(srId: string, reason: string) {
    const sr = await this.getSRById(srId);
    if (sr) {
      sr.status = 'cancelled';
      sr.timeline.push({ status: 'cancelled', timestamp: new Date().toISOString(), actor: 'Ops Exec', note: `Reason: ${reason}` });
    }
  }

  async escalateSR(srId: string, type: string, note: string) {
    const sr = await this.getSRById(srId);
    if (sr) {
      sr.isEscalated = true;
      sr.escalationReason = type;
      sr.internalNotes.push({ id: Date.now().toString(), author: 'System', timestamp: new Date().toISOString(), content: `Escalated: ${type}. ${note}`, isEscalation: true });
    }
  }

  async addInternalNote(srId: string, content: string, isEscalation?: boolean) {
    const sr = await this.getSRById(srId);
    if (sr) {
      sr.internalNotes.push({ id: Date.now().toString(), author: 'Current User', timestamp: new Date().toISOString(), content, isEscalation });
    }
  }

  async getOperationsStats() {
    await new Promise(r => setTimeout(r, 300));
    return {
      total: 45,
      assigned: 18,
      inProgress: 12,
      completed: 10,
      pending: 5,
      overdue: 2,
      slaCompliance: 94,
      activeTechs: 15,
      avgResponseTime: '42m'
    };
  }

  async getSLAAlerts() {
    return this.srs.filter(s => s.isEscalated || s.priority === 'emergency');
  }

  async getTechnicianJobs(technicianId: string) {
    await new Promise(r => setTimeout(r, 500));
    return this.srs.filter(s => s.scheduling.assignedTechnicianId === technicianId);
  }

  async updateJobStatus(id: string, status: SRStatus, location?: { lat: number; lng: number }) {
    const sr = await this.getSRById(id);
    if (sr) {
      sr.status = status;
      if (location && sr.fieldWorkflow) {
        sr.fieldWorkflow.checkInCoordinates = location;
      }
      sr.timeline.push({ status, timestamp: new Date().toISOString(), actor: 'Technician' });
    }
  }

  async submitServiceReport(id: string, reportData: any) {
    const sr = await this.getSRById(id);
    if (sr) {
      sr.fieldWorkflow = {
        ...sr.fieldWorkflow,
        ...reportData,
        currentStep: 'signature'
      } as any;
      sr.timeline.push({ status: sr.status, timestamp: new Date().toISOString(), actor: 'Technician', note: 'Service report submitted' });
    }
  }

  async submitSignature(id: string, signatureData: { customerName: string; signatureUrl: string }) {
    const sr = await this.getSRById(id);
    if (sr) {
      if (!sr.fieldWorkflow) sr.fieldWorkflow = {} as any;
      sr.fieldWorkflow!.signature = { ...signatureData, timestamp: new Date().toISOString() };
      sr.timeline.push({ status: sr.status, timestamp: new Date().toISOString(), actor: 'Technician', note: 'Customer signature captured' });
    }
  }
}

export class LiveServiceRequestRepository implements ServiceRequestRepository {
  async getSRs(filters: any) {
    const response = await apiClient.get<ServiceRequest[]>('/api/v1/service-requests', { params: filters });
    return response.data;
  }

  async getSRById(id: string) {
    const response = await apiClient.get<ServiceRequest>(`/api/v1/service-requests/${id}`);
    return response.data;
  }

  async createSR(sr: Partial<ServiceRequest>) {
    const response = await apiClient.post<ServiceRequest>('/api/v1/service-requests', sr);
    return response.data;
  }

  async updateSR(id: string, data: Partial<ServiceRequest>) {
    const response = await apiClient.patch<ServiceRequest>(`/api/v1/service-requests/${id}`, data);
    return response.data;
  }

  async assignTechnician(srId: string, technicianId: string, technicianName: string) {
    await apiClient.post(`/api/v1/service-requests/${srId}/assign`, { technicianId, technicianName });
  }

  async rescheduleSR(srId: string, date: string, slot: string, reason: string) {
    await apiClient.post(`/api/v1/service-requests/${srId}/reschedule`, { date, slot, reason });
  }

  async cancelSR(srId: string, reason: string) {
    await apiClient.post(`/api/v1/service-requests/${srId}/cancel`, { reason });
  }

  async escalateSR(srId: string, type: string, note: string) {
    await apiClient.post(`/api/v1/service-requests/${srId}/escalate`, { type, note });
  }

  async addInternalNote(srId: string, content: string, isEscalation?: boolean) {
    await apiClient.post(`/api/v1/service-requests/${srId}/notes`, { content, isEscalation });
  }

  async getOperationsStats() {
    const response = await apiClient.get('/api/v1/ops/stats');
    return response.data;
  }

  async getSLAAlerts() {
    const response = await apiClient.get<ServiceRequest[]>('/api/v1/ops/sla-alerts');
    return response.data;
  }

  async getTechnicianJobs(technicianId: string) {
    const response = await apiClient.get<ServiceRequest[]>('/api/v1/tech/jobs', { params: { technicianId } });
    return response.data;
  }

  async updateJobStatus(id: string, status: SRStatus, location?: { lat: number; lng: number }) {
    await apiClient.patch(`/api/v1/tech/jobs/${id}/status`, { status, location });
  }

  async submitServiceReport(id: string, reportData: any) {
    await apiClient.post(`/api/v1/tech/jobs/${id}/report`, reportData);
  }

  async submitSignature(id: string, signatureData: { customerName: string; signatureUrl: string }) {
    await apiClient.post(`/api/v1/tech/jobs/${id}/sign`, signatureData);
  }
}

export const serviceRequestRepository: ServiceRequestRepository = isDemoMode()
  ? new MockServiceRequestRepository()
  : new LiveServiceRequestRepository();
