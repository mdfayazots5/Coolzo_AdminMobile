import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";
import type { ServiceRequest, SRPriority, SRStatus } from "./service-request-repository";
import { serviceRequestRepository } from "./service-request-repository";
import type { Technician, TechnicianStatus } from "./technician-repository";
import { technicianRepository } from "./technician-repository";

export interface OperationsDashboardSummary {
  totalJobs: number;
  pendingQueueCount: number;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  activeTechnicianCount: number;
  atRiskAlertCount: number;
  breachedAlertCount: number;
  slaCompliancePercent: number;
  lastUpdatedAt: string;
}

export interface OperationsPendingQueueItem {
  id: string;
  srNumber: string;
  customerName: string;
  phone: string;
  zoneName: string;
  serviceName: string;
  address: string;
  slotDate: string;
  slotLabel: string;
  priority: SRPriority;
  status: SRStatus;
  estimatedPrice: number;
  createdAt: string;
}

export interface OperationsTechnicianStatus {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  status: TechnicianStatus;
  currentJobId?: string;
  baseZone?: string;
  zones: string[];
  skills: string[];
  rating: number;
  todayJobCount: number;
  nextFreeSlot?: string;
}

export interface OperationsSlaAlert {
  id: string;
  serviceRequestId?: string;
  srNumber?: string;
  customerName: string;
  zoneName: string;
  serviceName: string;
  priority: SRPriority;
  alertType: string;
  alertState: "at-risk" | "breached";
  severity: string;
  slaDueDate?: string;
  minutesFromDue?: number;
  escalationLevel: number;
  message: string;
  assignedTechnicianName?: string;
}

export interface OperationsZoneWorkload {
  zoneName: string;
  totalCount: number;
  pendingCount: number;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  emergencyCount: number;
  breachedAlertCount: number;
  activeTechnicianCount: number;
}

export interface OperationsDaySummary {
  summaryDate: string;
  totalJobs: number;
  pendingQueueCount: number;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  submittedForClosureCount: number;
  carryForwardCount: number;
  emergencyCount: number;
  escalatedCount: number;
  atRiskAlertCount: number;
  breachedAlertCount: number;
  activeTechnicianCount: number;
  slaCompliancePercent: number;
  zoneWorkload: OperationsZoneWorkload[];
  generatedAt: string;
}

export interface OperationsMapCoordinate {
  lat: number;
  lng: number;
  trackedOn: string;
}

export interface OperationsTechnicianMapPin {
  id: string;
  code: string;
  name: string;
  status: TechnicianStatus;
  currentJobId?: string;
  baseZone?: string;
  lat: number;
  lng: number;
  trackedOn: string;
  breadcrumbs: OperationsMapCoordinate[];
}

export interface OperationsServiceRequestMapPin {
  id: string;
  srNumber: string;
  customerName: string;
  serviceName: string;
  status: SRStatus;
  priority: SRPriority;
  zoneName: string;
  address: string;
  assignedTechnicianName?: string;
  lat: number;
  lng: number;
}

export interface OperationsLiveMap {
  generatedAt: string;
  technicianPins: OperationsTechnicianMapPin[];
  serviceRequestPins: OperationsServiceRequestMapPin[];
}

export interface OperationsDashboardRepository {
  getDashboardSummary(): Promise<OperationsDashboardSummary>;
  getPendingQueue(): Promise<OperationsPendingQueueItem[]>;
  getTechnicianStatus(): Promise<OperationsTechnicianStatus[]>;
  getSlaAlerts(): Promise<OperationsSlaAlert[]>;
  getZoneWorkload(): Promise<OperationsZoneWorkload[]>;
  getDaySummary(): Promise<OperationsDaySummary>;
  getLiveMap(): Promise<OperationsLiveMap>;
}

interface BackendOperationsDashboardSummary {
  totalJobs: number;
  pendingQueueCount: number;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  activeTechnicianCount: number;
  atRiskAlertCount: number;
  breachedAlertCount: number;
  slaCompliancePercent: number;
  lastUpdatedUtc: string;
}

interface BackendOperationsPendingQueueItem {
  serviceRequestId: number;
  serviceRequestNumber: string;
  customerName: string;
  mobileNumber: string;
  zoneName: string;
  serviceName: string;
  addressSummary: string;
  slotDate: string;
  slotLabel: string;
  priority: string;
  currentStatus: string;
  estimatedPrice: number;
  createdOnUtc: string;
}

interface BackendOperationsTechnicianStatusItem {
  technicianId: number;
  technicianCode: string;
  technicianName: string;
  mobileNumber: string;
  emailAddress: string;
  availabilityStatus: string;
  currentServiceRequestNumber?: string | null;
  baseZoneName?: string | null;
  zones: string[];
  skills: string[];
  averageRating: number;
  todayJobCount: number;
  nextFreeSlot?: string | null;
}

interface BackendOperationsSlaAlertItem {
  systemAlertId: number;
  serviceRequestId?: number | null;
  serviceRequestNumber?: string | null;
  customerName: string;
  zoneName: string;
  serviceName: string;
  priority: string;
  alertType: string;
  alertState: "at-risk" | "breached";
  severity: string;
  slaDueDateUtc?: string | null;
  minutesFromDue?: number | null;
  escalationLevel: number;
  alertMessage: string;
  assignedTechnicianName?: string | null;
}

interface BackendOperationsZoneWorkloadItem {
  zoneName: string;
  totalCount: number;
  pendingCount: number;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  emergencyCount: number;
  breachedAlertCount: number;
  activeTechnicianCount: number;
}

interface BackendOperationsDaySummary {
  summaryDate: string;
  totalJobs: number;
  pendingQueueCount: number;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  submittedForClosureCount: number;
  carryForwardCount: number;
  emergencyCount: number;
  escalatedCount: number;
  atRiskAlertCount: number;
  breachedAlertCount: number;
  activeTechnicianCount: number;
  slaCompliancePercent: number;
  zoneWorkload: BackendOperationsZoneWorkloadItem[];
  generatedOnUtc: string;
}

interface BackendOperationsMapCoordinate {
  latitude: number;
  longitude: number;
  trackedOnUtc: string;
}

interface BackendOperationsTechnicianMapPin {
  technicianId: number;
  technicianCode: string;
  technicianName: string;
  availabilityStatus: string;
  currentServiceRequestNumber?: string | null;
  baseZoneName?: string | null;
  latitude: number;
  longitude: number;
  trackedOnUtc: string;
  breadcrumbs: BackendOperationsMapCoordinate[];
}

interface BackendOperationsServiceRequestMapPin {
  serviceRequestId: number;
  serviceRequestNumber: string;
  customerName: string;
  serviceName: string;
  currentStatus: string;
  priority: string;
  zoneName: string;
  addressSummary: string;
  assignedTechnicianName?: string | null;
  latitude: number;
  longitude: number;
}

interface BackendOperationsLiveMap {
  generatedOnUtc: string;
  technicianPins: BackendOperationsTechnicianMapPin[];
  serviceRequestPins: BackendOperationsServiceRequestMapPin[];
}

const normalizePriority = (priority?: string | null): SRPriority => {
  const normalized = (priority || "").trim().toLowerCase();
  if (normalized === "emergency") return "emergency";
  if (normalized === "urgent") return "urgent";
  return "normal";
};

const normalizeStatus = (status?: string | null): SRStatus => {
  const normalized = (status || "").trim().toLowerCase();
  if (normalized === "assigned") return "assigned";
  if (normalized === "enroute" || normalized === "en-route") return "en-route";
  if (normalized === "reached" || normalized === "arrived") return "arrived";
  if (normalized === "workstarted" || normalized === "workinprogress" || normalized === "workstartedpendingsubmission" || normalized === "in-progress") {
    return "in-progress";
  }
  if (normalized === "workcompletedpendingsubmission" || normalized === "submittedforclosure" || normalized === "completed" || normalized === "closed") {
    return "completed";
  }
  if (normalized === "cancelled") return "cancelled";
  return "pending";
};

const normalizeTechnicianStatus = (status?: string | null): TechnicianStatus => {
  const normalized = (status || "").trim().toLowerCase();
  if (normalized === "on-job") return "on-job";
  if (normalized === "off-duty") return "off-duty";
  if (normalized === "on-leave") return "on-leave";
  return "available";
};

const mapPendingQueueItem = (item: BackendOperationsPendingQueueItem): OperationsPendingQueueItem => ({
  id: String(item.serviceRequestId),
  srNumber: item.serviceRequestNumber,
  customerName: item.customerName,
  phone: item.mobileNumber,
  zoneName: item.zoneName || "Unassigned",
  serviceName: item.serviceName,
  address: item.addressSummary,
  slotDate: item.slotDate,
  slotLabel: item.slotLabel,
  priority: normalizePriority(item.priority),
  status: normalizeStatus(item.currentStatus),
  estimatedPrice: item.estimatedPrice,
  createdAt: item.createdOnUtc,
});

const mapTechnicianStatus = (item: BackendOperationsTechnicianStatusItem): OperationsTechnicianStatus => ({
  id: String(item.technicianId),
  code: item.technicianCode,
  name: item.technicianName,
  phone: item.mobileNumber,
  email: item.emailAddress,
  status: normalizeTechnicianStatus(item.availabilityStatus),
  currentJobId: item.currentServiceRequestNumber || undefined,
  baseZone: item.baseZoneName || undefined,
  zones: item.zones.length > 0 ? item.zones : [item.baseZoneName || "Unassigned"],
  skills: item.skills,
  rating: item.averageRating,
  todayJobCount: item.todayJobCount,
  nextFreeSlot: item.nextFreeSlot || undefined,
});

const mapSlaAlert = (item: BackendOperationsSlaAlertItem): OperationsSlaAlert => ({
  id: String(item.systemAlertId),
  serviceRequestId: item.serviceRequestId ? String(item.serviceRequestId) : undefined,
  srNumber: item.serviceRequestNumber || undefined,
  customerName: item.customerName,
  zoneName: item.zoneName || "Unassigned",
  serviceName: item.serviceName,
  priority: normalizePriority(item.priority),
  alertType: item.alertType,
  alertState: item.alertState,
  severity: item.severity,
  slaDueDate: item.slaDueDateUtc || undefined,
  minutesFromDue: typeof item.minutesFromDue === "number" ? item.minutesFromDue : undefined,
  escalationLevel: item.escalationLevel,
  message: item.alertMessage,
  assignedTechnicianName: item.assignedTechnicianName || undefined,
});

const mapZoneWorkload = (item: BackendOperationsZoneWorkloadItem): OperationsZoneWorkload => ({
  zoneName: item.zoneName,
  totalCount: item.totalCount,
  pendingCount: item.pendingCount,
  assignedCount: item.assignedCount,
  inProgressCount: item.inProgressCount,
  completedCount: item.completedCount,
  emergencyCount: item.emergencyCount,
  breachedAlertCount: item.breachedAlertCount,
  activeTechnicianCount: item.activeTechnicianCount,
});

const buildMockZoneWorkload = (
  queue: OperationsPendingQueueItem[],
  technicianStatuses: OperationsTechnicianStatus[],
  alerts: OperationsSlaAlert[],
): OperationsZoneWorkload[] => {
  const zoneNames = Array.from(
    new Set([
      ...queue.map((item) => item.zoneName || "Unassigned"),
      ...technicianStatuses.flatMap((item) => item.zones),
      ...alerts.map((item) => item.zoneName || "Unassigned"),
    ]),
  ).filter(Boolean);

  return zoneNames
    .map((zoneName) => {
      const zoneQueue = queue.filter((item) => item.zoneName === zoneName);
      const zoneTechnicians = technicianStatuses.filter((item) => item.zones.includes(zoneName));
      const zoneAlerts = alerts.filter((item) => item.zoneName === zoneName && item.alertState === "breached");

      return {
        zoneName,
        totalCount: zoneQueue.length,
        pendingCount: zoneQueue.length,
        assignedCount: 0,
        inProgressCount: 0,
        completedCount: 0,
        emergencyCount: zoneQueue.filter((item) => item.priority === "emergency").length,
        breachedAlertCount: zoneAlerts.length,
        activeTechnicianCount: zoneTechnicians.length,
      };
    })
    .sort((left, right) => right.totalCount - left.totalCount || left.zoneName.localeCompare(right.zoneName));
};

const buildMockTechnicianStatus = (technicians: Technician[]): OperationsTechnicianStatus[] =>
  technicians.map((technician) => ({
    id: technician.id,
    code: technician.employeeId,
    name: technician.name,
    phone: technician.phone,
    email: technician.email,
    status: technician.status,
    currentJobId: technician.currentJobId,
    baseZone: technician.branch,
    zones: technician.zones,
    skills: technician.skills.map((skill) => skill.name),
    rating: technician.rating,
    todayJobCount: technician.todayJobCount,
    nextFreeSlot: technician.nextFreeSlot,
  }));

const buildMockPendingQueue = (requests: ServiceRequest[]): OperationsPendingQueueItem[] =>
  requests.map((request) => ({
    id: request.id,
    srNumber: request.srNumber,
    customerName: request.customer.name,
    phone: request.customer.phone,
    zoneName: request.location.zoneId,
    serviceName: request.serviceType,
    address: request.location.address,
    slotDate: request.scheduling.requestedDate,
    slotLabel: request.scheduling.requestedSlot,
    priority: request.priority,
    status: request.status,
    estimatedPrice: 0,
    createdAt: request.createdAt,
  }));

export class MockOperationsDashboardRepository implements OperationsDashboardRepository {
  async getDashboardSummary(): Promise<OperationsDashboardSummary> {
    const stats = await serviceRequestRepository.getOperationsStats();

    return {
      totalJobs: stats.total,
      pendingQueueCount: stats.pending,
      assignedCount: stats.assigned,
      inProgressCount: stats.inProgress,
      completedCount: stats.completed,
      activeTechnicianCount: stats.activeTechs,
      atRiskAlertCount: 0,
      breachedAlertCount: stats.overdue,
      slaCompliancePercent: stats.slaCompliance,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  async getPendingQueue(): Promise<OperationsPendingQueueItem[]> {
    const requests = await serviceRequestRepository.getSRs({ status: "pending" });
    return buildMockPendingQueue(requests.filter((request) => request.status === "pending"));
  }

  async getTechnicianStatus(): Promise<OperationsTechnicianStatus[]> {
    const technicians = await technicianRepository.getAvailabilityBoard();
    return buildMockTechnicianStatus(technicians);
  }

  async getSlaAlerts(): Promise<OperationsSlaAlert[]> {
    const alerts = await serviceRequestRepository.getSLAAlerts();

    return alerts.map((alert, index) => ({
      id: `${index + 1}`,
      serviceRequestId: alert.id,
      srNumber: alert.srNumber,
      customerName: alert.customer.name,
      zoneName: alert.location.zoneId,
      serviceName: alert.serviceType,
      priority: alert.priority,
      alertType: "ServiceRequestSla",
      alertState: alert.priority === "emergency" ? "breached" : "at-risk",
      severity: alert.priority === "emergency" ? "critical" : "warning",
      slaDueDate: alert.scheduling.requestedDate,
      minutesFromDue: alert.priority === "emergency" ? 15 : -30,
      escalationLevel: alert.isEscalated ? 1 : 0,
      message: alert.escalationReason || `SLA attention required for ${alert.srNumber}.`,
      assignedTechnicianName: alert.scheduling.assignedTechnicianName,
    }));
  }

  async getZoneWorkload(): Promise<OperationsZoneWorkload[]> {
    const [queue, technicians, alerts] = await Promise.all([
      this.getPendingQueue(),
      this.getTechnicianStatus(),
      this.getSlaAlerts(),
    ]);

    return buildMockZoneWorkload(queue, technicians, alerts);
  }

  async getDaySummary(): Promise<OperationsDaySummary> {
    const [summary, zoneWorkload] = await Promise.all([
      this.getDashboardSummary(),
      this.getZoneWorkload(),
    ]);

    return {
      summaryDate: new Date().toISOString().slice(0, 10),
      totalJobs: summary.totalJobs,
      pendingQueueCount: summary.pendingQueueCount,
      assignedCount: summary.assignedCount,
      inProgressCount: summary.inProgressCount,
      completedCount: summary.completedCount,
      submittedForClosureCount: summary.completedCount,
      carryForwardCount: Math.max(summary.totalJobs - summary.completedCount, 0),
      emergencyCount: zoneWorkload.reduce((sum, item) => sum + item.emergencyCount, 0),
      escalatedCount: summary.atRiskAlertCount + summary.breachedAlertCount,
      atRiskAlertCount: summary.atRiskAlertCount,
      breachedAlertCount: summary.breachedAlertCount,
      activeTechnicianCount: summary.activeTechnicianCount,
      slaCompliancePercent: summary.slaCompliancePercent,
      zoneWorkload,
      generatedAt: new Date().toISOString(),
    };
  }

  async getLiveMap(): Promise<OperationsLiveMap> {
    const [requests, technicians] = await Promise.all([
      serviceRequestRepository.getSRs({}),
      technicianRepository.getAvailabilityBoard(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      technicianPins: technicians.map((technician, index) => ({
        id: technician.id,
        code: technician.employeeId,
        name: technician.name,
        status: technician.status,
        currentJobId: technician.currentJobId,
        baseZone: technician.branch,
        lat: 17.385 + index * 0.006,
        lng: 78.4867 - index * 0.008,
        trackedOn: new Date().toISOString(),
        breadcrumbs: [
          {
            lat: 17.382 + index * 0.006,
            lng: 78.4827 - index * 0.008,
            trackedOn: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          },
          {
            lat: 17.385 + index * 0.006,
            lng: 78.4867 - index * 0.008,
            trackedOn: new Date().toISOString(),
          },
        ],
      })),
      serviceRequestPins: requests.slice(0, 12).map((request, index) => ({
        id: request.id,
        srNumber: request.srNumber,
        customerName: request.customer.name,
        serviceName: request.serviceType,
        status: request.status,
        priority: request.priority,
        zoneName: request.location.zoneId,
        address: request.location.address,
        assignedTechnicianName: request.scheduling.assignedTechnicianName,
        lat: 17.39 + index * 0.003,
        lng: 78.47 + index * 0.005,
      })),
    };
  }
}

export class LiveOperationsDashboardRepository implements OperationsDashboardRepository {
  async getDashboardSummary(): Promise<OperationsDashboardSummary> {
    const response = await apiClient.get<BackendOperationsDashboardSummary>("/api/dashboard/operations");

    return {
      totalJobs: response.data.totalJobs,
      pendingQueueCount: response.data.pendingQueueCount,
      assignedCount: response.data.assignedCount,
      inProgressCount: response.data.inProgressCount,
      completedCount: response.data.completedCount,
      activeTechnicianCount: response.data.activeTechnicianCount,
      atRiskAlertCount: response.data.atRiskAlertCount,
      breachedAlertCount: response.data.breachedAlertCount,
      slaCompliancePercent: response.data.slaCompliancePercent,
      lastUpdatedAt: response.data.lastUpdatedUtc,
    };
  }

  async getPendingQueue(): Promise<OperationsPendingQueueItem[]> {
    const response = await apiClient.get<BackendOperationsPendingQueueItem[]>("/api/dashboard/operations/pending-queue");
    return response.data.map(mapPendingQueueItem);
  }

  async getTechnicianStatus(): Promise<OperationsTechnicianStatus[]> {
    const response = await apiClient.get<BackendOperationsTechnicianStatusItem[]>("/api/dashboard/operations/technician-status");
    return response.data.map(mapTechnicianStatus);
  }

  async getSlaAlerts(): Promise<OperationsSlaAlert[]> {
    const response = await apiClient.get<BackendOperationsSlaAlertItem[]>("/api/dashboard/operations/sla-alerts");
    return response.data.map(mapSlaAlert);
  }

  async getZoneWorkload(): Promise<OperationsZoneWorkload[]> {
    const response = await apiClient.get<BackendOperationsZoneWorkloadItem[]>("/api/dashboard/operations/zone-workload");
    return response.data.map(mapZoneWorkload);
  }

  async getDaySummary(): Promise<OperationsDaySummary> {
    const response = await apiClient.get<BackendOperationsDaySummary>("/api/dashboard/operations/day-summary");

    return {
      summaryDate: response.data.summaryDate,
      totalJobs: response.data.totalJobs,
      pendingQueueCount: response.data.pendingQueueCount,
      assignedCount: response.data.assignedCount,
      inProgressCount: response.data.inProgressCount,
      completedCount: response.data.completedCount,
      submittedForClosureCount: response.data.submittedForClosureCount,
      carryForwardCount: response.data.carryForwardCount,
      emergencyCount: response.data.emergencyCount,
      escalatedCount: response.data.escalatedCount,
      atRiskAlertCount: response.data.atRiskAlertCount,
      breachedAlertCount: response.data.breachedAlertCount,
      activeTechnicianCount: response.data.activeTechnicianCount,
      slaCompliancePercent: response.data.slaCompliancePercent,
      zoneWorkload: response.data.zoneWorkload.map(mapZoneWorkload),
      generatedAt: response.data.generatedOnUtc,
    };
  }

  async getLiveMap(): Promise<OperationsLiveMap> {
    const response = await apiClient.get<BackendOperationsLiveMap>("/api/dashboard/live-map");

    return {
      generatedAt: response.data.generatedOnUtc,
      technicianPins: response.data.technicianPins.map((pin) => ({
        id: String(pin.technicianId),
        code: pin.technicianCode,
        name: pin.technicianName,
        status: normalizeTechnicianStatus(pin.availabilityStatus),
        currentJobId: pin.currentServiceRequestNumber || undefined,
        baseZone: pin.baseZoneName || undefined,
        lat: pin.latitude,
        lng: pin.longitude,
        trackedOn: pin.trackedOnUtc,
        breadcrumbs: pin.breadcrumbs.map((point) => ({
          lat: point.latitude,
          lng: point.longitude,
          trackedOn: point.trackedOnUtc,
        })),
      })),
      serviceRequestPins: response.data.serviceRequestPins.map((pin) => ({
        id: String(pin.serviceRequestId),
        srNumber: pin.serviceRequestNumber,
        customerName: pin.customerName,
        serviceName: pin.serviceName,
        status: normalizeStatus(pin.currentStatus),
        priority: normalizePriority(pin.priority),
        zoneName: pin.zoneName || "Unassigned",
        address: pin.addressSummary,
        assignedTechnicianName: pin.assignedTechnicianName || undefined,
        lat: pin.latitude,
        lng: pin.longitude,
      })),
    };
  }
}

export const operationsDashboardRepository: OperationsDashboardRepository = isDemoMode()
  ? new MockOperationsDashboardRepository()
  : new LiveOperationsDashboardRepository();
