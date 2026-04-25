import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";
import { bookingLookupRepository } from "./booking-lookup-repository";
import { masterDataRepository } from "./master-data-repository";
import type { SRPriority, SRStatus, ServiceRequest } from "./service-request-repository";
import { serviceRequestRepository } from "./service-request-repository";
import type { TechnicianStatus } from "./technician-repository";
import { technicianRepository } from "./technician-repository";

export interface SchedulingTimeSlot {
  key: string;
  label: string;
  startTime: string;
  endTime: string;
}

export interface SchedulingShiftDay {
  dayOfWeekNumber: number;
  dayName: string;
  isOffDuty: boolean;
  shiftStartTime?: string;
  shiftEndTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

export interface SchedulingTechnician {
  id: string;
  code: string;
  name: string;
  status: TechnicianStatus;
  baseZone?: string;
  zones: string[];
  skills: string[];
  rating: number;
  todayJobCount: number;
  nextFreeSlot?: string;
  weeklyShifts: SchedulingShiftDay[];
}

export interface SchedulingJob {
  id: string;
  srNumber: string;
  bookingId: string;
  zoneId: string;
  zoneName: string;
  customerName: string;
  phone: string;
  address: string;
  serviceName: string;
  acTypeName?: string;
  brandName?: string;
  priority: SRPriority;
  status: SRStatus;
  slotAvailabilityId: string;
  slotDate: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  technicianId?: string;
  technicianName?: string;
  estimatedPrice: number;
}

export interface SchedulingBoard {
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  timeSlots: SchedulingTimeSlot[];
  technicians: SchedulingTechnician[];
  jobs: SchedulingJob[];
  unassignedJobs: SchedulingJob[];
}

export interface SchedulingConflict {
  type: "overlap" | "travel" | "shift" | "skill" | "zone";
  severity: "error" | "warning";
  message: string;
  suggestedResolution?: string;
  relatedServiceRequestId?: string;
  relatedServiceRequestNumber?: string;
}

export interface SchedulingSlot {
  id: string;
  zoneId: string;
  zoneName: string;
  slotDate: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
  availableCapacity: number;
  reservedCapacity: number;
  isBlocked: boolean;
  isAvailable: boolean;
}

export interface SchedulingShift {
  technicianId: string;
  technicianCode: string;
  technicianName: string;
  days: SchedulingShiftDay[];
}

export interface SchedulingAmcAutoVisit {
  amcVisitScheduleId: string;
  customerAmcId: string;
  visitNumber: number;
  scheduledDate: string;
  currentStatus: string;
  customerId: string;
  customerName: string;
  mobileNumber: string;
  customerAddressId: string;
  zoneId: string;
  zoneName: string;
  address: string;
  serviceId: string;
  serviceName: string;
  acTypeName?: string;
  brandName?: string;
  jobCardNumber: string;
  originServiceRequestNumber?: string;
  amcPlanName: string;
  linkedServiceRequestId?: string;
  linkedServiceRequestNumber?: string;
}

export interface SchedulingDaySheetItem {
  serviceRequestId: string;
  serviceRequestNumber: string;
  customerName: string;
  mobileNumber: string;
  address: string;
  serviceName: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
  status: SRStatus;
  priority: SRPriority;
  zoneName: string;
}

export interface SchedulingDaySheetTechnician {
  technicianId: string;
  technicianCode: string;
  technicianName: string;
  baseZone?: string;
  itinerary: SchedulingDaySheetItem[];
}

export interface SchedulingDaySheet {
  scheduleDate: string;
  generatedAt: string;
  technicians: SchedulingDaySheetTechnician[];
}

export interface SchedulingBoardFilters {
  dateFrom: string;
  dateTo: string;
  technicianId?: string;
}

export interface SchedulingJobMutationInput {
  serviceRequestId: string;
  technicianId: string;
  slotAvailabilityId: string;
  remarks?: string;
}

export interface SchedulingBulkAmcAssignInput {
  technicianId: string;
  visits: Array<{
    amcVisitScheduleId: string;
    slotAvailabilityId: string;
  }>;
  remarks?: string;
}

export interface SchedulingShiftUpdateInput {
  technicianId: string;
  days: SchedulingShiftDay[];
}

export interface SchedulingRepository {
  getBoard(filters: SchedulingBoardFilters): Promise<SchedulingBoard>;
  assignJob(input: SchedulingJobMutationInput): Promise<SchedulingJob>;
  reassignJob(input: SchedulingJobMutationInput): Promise<SchedulingJob>;
  getAmcAuto(dateFrom?: string, dateTo?: string): Promise<SchedulingAmcAutoVisit[]>;
  bulkAssignAmc(input: SchedulingBulkAmcAssignInput): Promise<SchedulingJob[]>;
  getConflicts(serviceRequestId: string, technicianId: string, slotAvailabilityId: string): Promise<SchedulingConflict[]>;
  getSlots(zoneId: string, slotDate: string): Promise<SchedulingSlot[]>;
  updateSlot(slotAvailabilityId: string, input: { isBlocked: boolean; availableCapacity?: number }): Promise<SchedulingSlot>;
  getTechnicianShifts(technicianId?: string): Promise<SchedulingShift[]>;
  updateTechnicianShifts(input: SchedulingShiftUpdateInput): Promise<SchedulingShift>;
  getDaySheet(scheduleDate: string, technicianId?: string): Promise<SchedulingDaySheet>;
}

interface BackendSchedulingBoard {
  dateFrom: string;
  dateTo: string;
  generatedOnUtc: string;
  timeSlots: BackendSchedulingTimeSlot[];
  technicians: BackendSchedulingTechnician[];
  jobs: BackendSchedulingJob[];
  unassignedJobs: BackendSchedulingJob[];
}

interface BackendSchedulingTimeSlot {
  slotKey: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
}

interface BackendSchedulingTechnician {
  technicianId: number;
  technicianCode: string;
  technicianName: string;
  availabilityStatus: string;
  baseZoneName?: string | null;
  zones: string[];
  skills: string[];
  averageRating: number;
  todayJobCount: number;
  nextFreeSlot?: string | null;
  weeklyShifts: BackendSchedulingShiftDay[];
}

interface BackendSchedulingJob {
  serviceRequestId: number;
  serviceRequestNumber: string;
  bookingId: number;
  zoneId: number;
  zoneName: string;
  customerName: string;
  mobileNumber: string;
  addressSummary: string;
  serviceName: string;
  acTypeName?: string | null;
  brandName?: string | null;
  priority: string;
  currentStatus: string;
  slotAvailabilityId: number;
  slotDate: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  technicianId?: number | null;
  technicianName?: string | null;
  estimatedPrice: number;
}

interface BackendSchedulingConflict {
  conflictType: string;
  severity: string;
  message: string;
  suggestedResolution?: string | null;
  relatedServiceRequestId?: number | null;
  relatedServiceRequestNumber?: string | null;
}

interface BackendSchedulingSlot {
  slotAvailabilityId: number;
  zoneId: number;
  zoneName: string;
  slotDate: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
  availableCapacity: number;
  reservedCapacity: number;
  isBlocked: boolean;
  isAvailable: boolean;
}

interface BackendSchedulingShift {
  technicianId: number;
  technicianCode: string;
  technicianName: string;
  days: BackendSchedulingShiftDay[];
}

interface BackendSchedulingShiftDay {
  dayOfWeekNumber: number;
  dayName: string;
  isOffDuty: boolean;
  shiftStartTime?: string | null;
  shiftEndTime?: string | null;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
}

interface BackendSchedulingAmcAutoVisit {
  amcVisitScheduleId: number;
  customerAmcId: number;
  visitNumber: number;
  scheduledDate: string;
  currentStatus: string;
  customerId: number;
  customerName: string;
  mobileNumber: string;
  customerAddressId: number;
  zoneId: number;
  zoneName: string;
  addressSummary: string;
  serviceId: number;
  serviceName: string;
  acTypeName?: string | null;
  brandName?: string | null;
  jobCardNumber: string;
  originServiceRequestNumber?: string | null;
  amcPlanName: string;
  linkedServiceRequestId?: number | null;
  linkedServiceRequestNumber?: string | null;
}

interface BackendSchedulingDaySheet {
  scheduleDate: string;
  generatedOnUtc: string;
  technicians: BackendSchedulingDaySheetTechnician[];
}

interface BackendSchedulingDaySheetTechnician {
  technicianId: number;
  technicianCode: string;
  technicianName: string;
  baseZoneName?: string | null;
  itinerary: BackendSchedulingDaySheetItem[];
}

interface BackendSchedulingDaySheetItem {
  serviceRequestId: number;
  serviceRequestNumber: string;
  customerName: string;
  mobileNumber: string;
  addressSummary: string;
  serviceName: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
  currentStatus: string;
  priority: string;
  zoneName: string;
}

type MockJobState = Partial<SchedulingJob> & Pick<SchedulingJob, "id">;

const normalizePriority = (priority?: string | null): SRPriority => {
  const value = (priority || "").trim().toLowerCase();
  if (value === "emergency") return "emergency";
  if (value === "urgent") return "urgent";
  return "normal";
};

const normalizeStatus = (status?: string | null): SRStatus => {
  const value = (status || "").trim().toLowerCase();
  if (value === "assigned") return "assigned";
  if (value === "en-route" || value === "enroute") return "en-route";
  if (value === "arrived" || value === "reached") return "arrived";
  if (value === "in-progress" || value === "workstarted" || value === "workinprogress") return "in-progress";
  if (value === "completed" || value === "workcompletedpendingsubmission") return "completed";
  if (value === "closed" || value === "submittedforclosure") return "closed";
  if (value === "cancelled") return "cancelled";
  return "pending";
};

const normalizeTechnicianStatus = (status?: string | null): TechnicianStatus => {
  const value = (status || "").trim().toLowerCase();
  if (value === "on-job") return "on-job";
  if (value === "off-duty") return "off-duty";
  if (value === "on-leave") return "on-leave";
  return "available";
};

const mapShiftDay = (day: BackendSchedulingShiftDay): SchedulingShiftDay => ({
  dayOfWeekNumber: day.dayOfWeekNumber,
  dayName: day.dayName,
  isOffDuty: day.isOffDuty,
  shiftStartTime: day.shiftStartTime ?? undefined,
  shiftEndTime: day.shiftEndTime ?? undefined,
  breakStartTime: day.breakStartTime ?? undefined,
  breakEndTime: day.breakEndTime ?? undefined,
});

const mapJob = (job: BackendSchedulingJob): SchedulingJob => ({
  id: String(job.serviceRequestId),
  srNumber: job.serviceRequestNumber,
  bookingId: String(job.bookingId),
  zoneId: String(job.zoneId),
  zoneName: job.zoneName,
  customerName: job.customerName,
  phone: job.mobileNumber,
  address: job.addressSummary,
  serviceName: job.serviceName,
  acTypeName: job.acTypeName ?? undefined,
  brandName: job.brandName ?? undefined,
  priority: normalizePriority(job.priority),
  status: normalizeStatus(job.currentStatus),
  slotAvailabilityId: String(job.slotAvailabilityId),
  slotDate: job.slotDate,
  slotLabel: job.slotLabel,
  startTime: job.startTime,
  endTime: job.endTime,
  durationMinutes: job.durationMinutes,
  technicianId: job.technicianId ? String(job.technicianId) : undefined,
  technicianName: job.technicianName ?? undefined,
  estimatedPrice: job.estimatedPrice,
});

const mapSlot = (slot: BackendSchedulingSlot): SchedulingSlot => ({
  id: String(slot.slotAvailabilityId),
  zoneId: String(slot.zoneId),
  zoneName: slot.zoneName,
  slotDate: slot.slotDate,
  slotLabel: slot.slotLabel,
  startTime: slot.startTime,
  endTime: slot.endTime,
  availableCapacity: slot.availableCapacity,
  reservedCapacity: slot.reservedCapacity,
  isBlocked: slot.isBlocked,
  isAvailable: slot.isAvailable,
});

const mapConflict = (conflict: BackendSchedulingConflict): SchedulingConflict => ({
  type: conflict.conflictType as SchedulingConflict["type"],
  severity: conflict.severity === "error" ? "error" : "warning",
  message: conflict.message,
  suggestedResolution: conflict.suggestedResolution ?? undefined,
  relatedServiceRequestId: conflict.relatedServiceRequestId ? String(conflict.relatedServiceRequestId) : undefined,
  relatedServiceRequestNumber: conflict.relatedServiceRequestNumber ?? undefined,
});

const mapTimeSlot = (slot: BackendSchedulingTimeSlot): SchedulingTimeSlot => ({
  key: slot.slotKey,
  label: slot.slotLabel,
  startTime: slot.startTime,
  endTime: slot.endTime,
});

const mapTechnician = (technician: BackendSchedulingTechnician): SchedulingTechnician => ({
  id: String(technician.technicianId),
  code: technician.technicianCode,
  name: technician.technicianName,
  status: normalizeTechnicianStatus(technician.availabilityStatus),
  baseZone: technician.baseZoneName ?? undefined,
  zones: technician.zones,
  skills: technician.skills,
  rating: technician.averageRating,
  todayJobCount: technician.todayJobCount,
  nextFreeSlot: technician.nextFreeSlot ?? undefined,
  weeklyShifts: technician.weeklyShifts.map(mapShiftDay),
});

const mapShift = (shift: BackendSchedulingShift): SchedulingShift => ({
  technicianId: String(shift.technicianId),
  technicianCode: shift.technicianCode,
  technicianName: shift.technicianName,
  days: shift.days.map(mapShiftDay),
});

const mapAmcVisit = (visit: BackendSchedulingAmcAutoVisit): SchedulingAmcAutoVisit => ({
  amcVisitScheduleId: String(visit.amcVisitScheduleId),
  customerAmcId: String(visit.customerAmcId),
  visitNumber: visit.visitNumber,
  scheduledDate: visit.scheduledDate,
  currentStatus: visit.currentStatus,
  customerId: String(visit.customerId),
  customerName: visit.customerName,
  mobileNumber: visit.mobileNumber,
  customerAddressId: String(visit.customerAddressId),
  zoneId: String(visit.zoneId),
  zoneName: visit.zoneName,
  address: visit.addressSummary,
  serviceId: String(visit.serviceId),
  serviceName: visit.serviceName,
  acTypeName: visit.acTypeName ?? undefined,
  brandName: visit.brandName ?? undefined,
  jobCardNumber: visit.jobCardNumber,
  originServiceRequestNumber: visit.originServiceRequestNumber ?? undefined,
  amcPlanName: visit.amcPlanName,
  linkedServiceRequestId: visit.linkedServiceRequestId ? String(visit.linkedServiceRequestId) : undefined,
  linkedServiceRequestNumber: visit.linkedServiceRequestNumber ?? undefined,
});

const mapDaySheet = (sheet: BackendSchedulingDaySheet): SchedulingDaySheet => ({
  scheduleDate: sheet.scheduleDate,
  generatedAt: sheet.generatedOnUtc,
  technicians: sheet.technicians.map((technician) => ({
    technicianId: String(technician.technicianId),
    technicianCode: technician.technicianCode,
    technicianName: technician.technicianName,
    baseZone: technician.baseZoneName ?? undefined,
    itinerary: technician.itinerary.map((item) => ({
      serviceRequestId: String(item.serviceRequestId),
      serviceRequestNumber: item.serviceRequestNumber,
      customerName: item.customerName,
      mobileNumber: item.mobileNumber,
      address: item.addressSummary,
      serviceName: item.serviceName,
      slotLabel: item.slotLabel,
      startTime: item.startTime,
      endTime: item.endTime,
      status: normalizeStatus(item.currentStatus),
      priority: normalizePriority(item.priority),
      zoneName: item.zoneName,
    })),
  })),
});

const buildDefaultShiftDays = async (): Promise<SchedulingShiftDay[]> => {
  const businessHours = await masterDataRepository.getBusinessHours();
  const labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return labels.map((dayName, index) => {
    const businessHour = businessHours.find((record) => record.dayOfWeekNumber === index);
    return {
      dayOfWeekNumber: index,
      dayName,
      isOffDuty: businessHour?.isClosed ?? false,
      shiftStartTime: businessHour?.startTimeLocal || "09:00",
      shiftEndTime: businessHour?.endTimeLocal || "18:00",
      breakStartTime: index === 0 ? undefined : "13:00",
      breakEndTime: index === 0 ? undefined : "14:00",
    };
  });
};

const parseSlotWindow = (slotLabel?: string, fallbackDate?: string) => {
  const normalized = slotLabel || "";
  const match = normalized.match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*[-–]\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i);
  if (!match) {
    return {
      slotDate: fallbackDate || new Date().toISOString().slice(0, 10),
      startTime: "09:00",
      endTime: "11:00",
    };
  }

  return {
    slotDate: fallbackDate || new Date().toISOString().slice(0, 10),
    startTime: toTwentyFourHour(match[1], match[3] || "AM"),
    endTime: toTwentyFourHour(match[2], match[3] || "PM"),
  };
};

const toTwentyFourHour = (time: string, meridiem: string) => {
  const [rawHours, minutes] = time.split(":").map(Number);
  let hours = rawHours;
  const suffix = meridiem.toUpperCase();
  if (suffix === "PM" && hours < 12) hours += 12;
  if (suffix === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

class MockSchedulingRepository implements SchedulingRepository {
  private jobState = new Map<string, MockJobState>();
  private shiftState = new Map<string, SchedulingShiftDay[]>();
  private slotState = new Map<string, SchedulingSlot[]>();
  private amcVisits: SchedulingAmcAutoVisit[] | null = null;

  async getBoard(filters: SchedulingBoardFilters): Promise<SchedulingBoard> {
    const [technicians, serviceRequests] = await Promise.all([
      technicianRepository.getTechnicians({ activeOnly: true }),
      serviceRequestRepository.getSRs({ dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    ]);

    const defaultShiftDays = await buildDefaultShiftDays();
    const mappedTechnicians: SchedulingTechnician[] = technicians.map((technician, index) => ({
      id: technician.id,
      code: technician.employeeId,
      name: technician.name,
      status: technician.status,
      baseZone: technician.zoneAssignments.find((assignment) => assignment.isPrimary)?.name,
      zones: technician.zoneAssignments.map((assignment) => assignment.name),
      skills: technician.skills.map((skill) => skill.name),
      rating: technician.rating,
      todayJobCount: technician.todayJobCount,
      nextFreeSlot: technician.nextFreeSlot,
      weeklyShifts: this.shiftState.get(technician.id) || defaultShiftDays.map((day) => ({ ...day })),
    }));

    const jobs = serviceRequests.map((serviceRequest, index) => this.mapMockJob(serviceRequest, index));
    const filteredJobs = jobs.filter((job) => {
      if (filters.technicianId && job.technicianId !== filters.technicianId && job.technicianId) {
        return false;
      }

      return job.slotDate >= filters.dateFrom && job.slotDate <= filters.dateTo;
    });

    const timeSlots = Array.from(new Map(filteredJobs.map((job) => [job.startTime, {
      key: job.startTime,
      label: job.slotLabel,
      startTime: job.startTime,
      endTime: job.endTime,
    }])).values());

    const sortedTimeSlots = (timeSlots.length > 0 ? timeSlots : [
      { key: "09:00", label: "09:00-11:00", startTime: "09:00", endTime: "11:00" },
      { key: "11:00", label: "11:00-13:00", startTime: "11:00", endTime: "13:00" },
      { key: "13:00", label: "13:00-15:00", startTime: "13:00", endTime: "15:00" },
      { key: "15:00", label: "15:00-17:00", startTime: "15:00", endTime: "17:00" },
    ]).sort((left, right) => left.startTime.localeCompare(right.startTime));

    return {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      generatedAt: new Date().toISOString(),
      timeSlots: sortedTimeSlots,
      technicians: filters.technicianId ? mappedTechnicians.filter((item) => item.id === filters.technicianId) : mappedTechnicians,
      jobs: filteredJobs.filter((job) => Boolean(job.technicianId)),
      unassignedJobs: filteredJobs.filter((job) => !job.technicianId),
    };
  }

  async assignJob(input: SchedulingJobMutationInput): Promise<SchedulingJob> {
    return this.updateJobState(input);
  }

  async reassignJob(input: SchedulingJobMutationInput): Promise<SchedulingJob> {
    return this.updateJobState(input);
  }

  async getAmcAuto(dateFrom?: string): Promise<SchedulingAmcAutoVisit[]> {
    if (!this.amcVisits) {
      const jobs = await serviceRequestRepository.getSRs({});
      const fallbackDate = dateFrom || new Date().toISOString().slice(0, 10);
      this.amcVisits = jobs.slice(0, 8).map((job, index) => ({
        amcVisitScheduleId: String(index + 1),
        customerAmcId: `AMC-${index + 1}`,
        visitNumber: index + 1,
        scheduledDate: fallbackDate,
        currentStatus: "Scheduled",
        customerId: job.customer.id,
        customerName: job.customer.name,
        mobileNumber: job.customer.phone,
        customerAddressId: `ADDR-${index + 1}`,
        zoneId: job.location.zoneId,
        zoneName: `Zone ${job.location.zoneId}`,
        address: job.location.address,
        serviceId: String(index + 101),
        serviceName: "AMC Maintenance",
        acTypeName: job.equipment.type,
        brandName: job.equipment.brand,
        jobCardNumber: `JC-AMC-${index + 1}`,
        originServiceRequestNumber: job.srNumber,
        amcPlanName: "Quarterly Care",
      }));
    }

    return [...this.amcVisits];
  }

  async bulkAssignAmc(input: SchedulingBulkAmcAssignInput): Promise<SchedulingJob[]> {
    const visits = await this.getAmcAuto();
    const selectedVisits = visits.filter((visit) => input.visits.some((item) => item.amcVisitScheduleId === visit.amcVisitScheduleId));
    this.amcVisits = visits.filter((visit) => !selectedVisits.some((item) => item.amcVisitScheduleId === visit.amcVisitScheduleId));

    return selectedVisits.map((visit) => ({
      id: `amc-${visit.amcVisitScheduleId}`,
      srNumber: `AMC-${visit.amcVisitScheduleId}`,
      bookingId: `booking-${visit.amcVisitScheduleId}`,
      zoneId: visit.zoneId,
      zoneName: visit.zoneName,
      customerName: visit.customerName,
      phone: visit.mobileNumber,
      address: visit.address,
      serviceName: visit.serviceName,
      acTypeName: visit.acTypeName,
      brandName: visit.brandName,
      priority: "normal",
      status: "assigned",
      slotAvailabilityId: input.visits.find((item) => item.amcVisitScheduleId === visit.amcVisitScheduleId)?.slotAvailabilityId || "0",
      slotDate: visit.scheduledDate,
      slotLabel: "09:00-11:00",
      startTime: "09:00",
      endTime: "11:00",
      durationMinutes: 120,
      technicianId: input.technicianId,
      technicianName: undefined,
      estimatedPrice: 0,
    }));
  }

  async getConflicts(serviceRequestId: string, technicianId: string, slotAvailabilityId: string): Promise<SchedulingConflict[]> {
    const board = await this.getBoard({
      dateFrom: new Date().toISOString().slice(0, 10),
      dateTo: new Date().toISOString().slice(0, 10),
    });
    const job = [...board.jobs, ...board.unassignedJobs].find((item) => item.id === serviceRequestId);
    const technician = board.technicians.find((item) => item.id === technicianId);
    const slot = (await this.getSlots(job?.zoneId || "1", job?.slotDate || new Date().toISOString().slice(0, 10))).find((item) => item.id === slotAvailabilityId);

    if (!job || !technician || !slot) {
      return [];
    }

    const conflicts: SchedulingConflict[] = [];
    const shift = technician.weeklyShifts.find((day) => day.dayOfWeekNumber === new Date(job.slotDate).getDay());
    if (shift?.isOffDuty) {
      conflicts.push({ type: "shift", severity: "error", message: `${technician.name} is off-duty on this day.` });
    }

    if (technician.id !== job.technicianId) {
      const overlap = board.jobs.find((item) =>
        item.id !== job.id &&
        item.technicianId === technicianId &&
        item.slotDate === slot.slotDate &&
        item.startTime === slot.startTime);
      if (overlap) {
        conflicts.push({
          type: "overlap",
          severity: "error",
          message: `Overlaps with ${overlap.srNumber}.`,
          relatedServiceRequestId: overlap.id,
          relatedServiceRequestNumber: overlap.srNumber,
        });
      }
    }

    if (!slot.isAvailable) {
      conflicts.push({ type: "travel", severity: "warning", message: "Selected slot has limited remaining capacity." });
    }

    return conflicts;
  }

  async getSlots(zoneId: string, slotDate: string): Promise<SchedulingSlot[]> {
    const cacheKey = `${zoneId}:${slotDate}`;
    const existing = this.slotState.get(cacheKey);
    if (existing) {
      return [...existing];
    }

    const slots = await bookingLookupRepository.getSlots(zoneId, slotDate);
    const mapped = slots.map((slot) => ({
      id: slot.id,
      zoneId: slot.zoneId,
      zoneName: `Zone ${slot.zoneId}`,
      slotDate: slot.slotDate,
      slotLabel: slot.slotLabel,
      startTime: slot.startTime,
      endTime: slot.endTime,
      availableCapacity: slot.availableCapacity,
      reservedCapacity: slot.reservedCapacity,
      isBlocked: false,
      isAvailable: slot.isAvailable,
    }));
    this.slotState.set(cacheKey, mapped);
    return [...mapped];
  }

  async updateSlot(slotAvailabilityId: string, input: { isBlocked: boolean; availableCapacity?: number }): Promise<SchedulingSlot> {
    for (const [key, slots] of this.slotState.entries()) {
      const index = slots.findIndex((slot) => slot.id === slotAvailabilityId);
      if (index >= 0) {
        slots[index] = {
          ...slots[index],
          isBlocked: input.isBlocked,
          availableCapacity: input.availableCapacity ?? slots[index].availableCapacity,
          isAvailable: !input.isBlocked && slots[index].reservedCapacity < (input.availableCapacity ?? slots[index].availableCapacity),
        };
        this.slotState.set(key, slots);
        return slots[index];
      }
    }

    const fallback = {
      id: slotAvailabilityId,
      zoneId: "1",
      zoneName: "Zone 1",
      slotDate: new Date().toISOString().slice(0, 10),
      slotLabel: "09:00-11:00",
      startTime: "09:00",
      endTime: "11:00",
      availableCapacity: input.availableCapacity ?? 4,
      reservedCapacity: 0,
      isBlocked: input.isBlocked,
      isAvailable: !input.isBlocked,
    };
    this.slotState.set(`1:${fallback.slotDate}`, [fallback]);
    return fallback;
  }

  async getTechnicianShifts(technicianId?: string): Promise<SchedulingShift[]> {
    const technicians = await technicianRepository.getTechnicians({ activeOnly: true });
    const defaults = await buildDefaultShiftDays();
    return technicians
      .filter((technician) => !technicianId || technician.id === technicianId)
      .map((technician) => ({
        technicianId: technician.id,
        technicianCode: technician.employeeId,
        technicianName: technician.name,
        days: this.shiftState.get(technician.id) || defaults.map((day) => ({ ...day })),
      }));
  }

  async updateTechnicianShifts(input: SchedulingShiftUpdateInput): Promise<SchedulingShift> {
    this.shiftState.set(input.technicianId, input.days.map((day) => ({ ...day })));
    const [shift] = await this.getTechnicianShifts(input.technicianId);
    return shift;
  }

  async getDaySheet(scheduleDate: string, technicianId?: string): Promise<SchedulingDaySheet> {
    const board = await this.getBoard({ dateFrom: scheduleDate, dateTo: scheduleDate, technicianId });
    return {
      scheduleDate,
      generatedAt: new Date().toISOString(),
      technicians: board.technicians.map((technician) => ({
        technicianId: technician.id,
        technicianCode: technician.code,
        technicianName: technician.name,
        baseZone: technician.baseZone,
        itinerary: board.jobs
          .filter((job) => job.technicianId === technician.id)
          .sort((left, right) => left.startTime.localeCompare(right.startTime))
          .map((job) => ({
            serviceRequestId: job.id,
            serviceRequestNumber: job.srNumber,
            customerName: job.customerName,
            mobileNumber: job.phone,
            address: job.address,
            serviceName: job.serviceName,
            slotLabel: job.slotLabel,
            startTime: job.startTime,
            endTime: job.endTime,
            status: job.status,
            priority: job.priority,
            zoneName: job.zoneName,
          })),
      })),
    };
  }

  private mapMockJob(serviceRequest: ServiceRequest, index: number): SchedulingJob {
    const override = this.jobState.get(serviceRequest.id);
    const slotWindow = parseSlotWindow(serviceRequest.scheduling.confirmedSlot || serviceRequest.scheduling.requestedSlot, serviceRequest.scheduling.confirmedDate || serviceRequest.scheduling.requestedDate);
    const baseJob: SchedulingJob = {
      id: serviceRequest.id,
      srNumber: serviceRequest.srNumber,
      bookingId: `booking-${serviceRequest.id}`,
      zoneId: serviceRequest.location.zoneId,
      zoneName: `Zone ${serviceRequest.location.zoneId}`,
      customerName: serviceRequest.customer.name,
      phone: serviceRequest.customer.phone,
      address: serviceRequest.location.address,
      serviceName: serviceRequest.serviceType,
      acTypeName: serviceRequest.equipment.type,
      brandName: serviceRequest.equipment.brand,
      priority: serviceRequest.priority,
      status: serviceRequest.status,
      slotAvailabilityId: `${serviceRequest.location.zoneId}-${slotWindow.slotDate}-${slotWindow.startTime}`,
      slotDate: slotWindow.slotDate,
      slotLabel: serviceRequest.scheduling.confirmedSlot || serviceRequest.scheduling.requestedSlot || `${slotWindow.startTime}-${slotWindow.endTime}`,
      startTime: serviceRequest.scheduling.startTime?.slice(11, 16) || slotWindow.startTime,
      endTime: serviceRequest.scheduling.endTime?.slice(11, 16) || slotWindow.endTime,
      durationMinutes: serviceRequest.scheduling.estimatedDuration || 120,
      technicianId: serviceRequest.scheduling.assignedTechnicianId,
      technicianName: serviceRequest.scheduling.assignedTechnicianName,
      estimatedPrice: 0,
    };

    return {
      ...baseJob,
      ...override,
    };
  }

  private async updateJobState(input: SchedulingJobMutationInput): Promise<SchedulingJob> {
    const technicians = await technicianRepository.getTechnicians({ activeOnly: true });
    const technician = technicians.find((item) => item.id === input.technicianId);
    const slots = await this.getSlots("1", new Date().toISOString().slice(0, 10));
    const slot = slots.find((item) => item.id === input.slotAvailabilityId) || slots[0];

    this.jobState.set(input.serviceRequestId, {
      id: input.serviceRequestId,
      technicianId: input.technicianId,
      technicianName: technician?.name,
      slotAvailabilityId: input.slotAvailabilityId,
      slotDate: slot?.slotDate,
      slotLabel: slot?.slotLabel,
      startTime: slot?.startTime,
      endTime: slot?.endTime,
      status: "assigned",
    });

    const board = await this.getBoard({
      dateFrom: new Date().toISOString().slice(0, 10),
      dateTo: new Date().toISOString().slice(0, 10),
    });
    return [...board.jobs, ...board.unassignedJobs].find((item) => item.id === input.serviceRequestId)!;
  }
}

class LiveSchedulingRepository implements SchedulingRepository {
  async getBoard(filters: SchedulingBoardFilters): Promise<SchedulingBoard> {
    const response = await apiClient.get<BackendSchedulingBoard>("/api/scheduling/board", {
      params: {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        technicianId: filters.technicianId ? Number(filters.technicianId) : undefined,
      },
    });

    return {
      dateFrom: response.data.dateFrom,
      dateTo: response.data.dateTo,
      generatedAt: response.data.generatedOnUtc,
      timeSlots: response.data.timeSlots.map(mapTimeSlot),
      technicians: response.data.technicians.map(mapTechnician),
      jobs: response.data.jobs.map(mapJob),
      unassignedJobs: response.data.unassignedJobs.map(mapJob),
    };
  }

  async assignJob(input: SchedulingJobMutationInput): Promise<SchedulingJob> {
    const response = await apiClient.post<BackendSchedulingJob>("/api/scheduling/assign", {
      serviceRequestId: Number(input.serviceRequestId),
      technicianId: Number(input.technicianId),
      slotAvailabilityId: Number(input.slotAvailabilityId),
      remarks: input.remarks || undefined,
    });

    return mapJob(response.data);
  }

  async reassignJob(input: SchedulingJobMutationInput): Promise<SchedulingJob> {
    const response = await apiClient.put<BackendSchedulingJob>("/api/scheduling/reassign", {
      serviceRequestId: Number(input.serviceRequestId),
      technicianId: Number(input.technicianId),
      slotAvailabilityId: Number(input.slotAvailabilityId),
      remarks: input.remarks || undefined,
    });

    return mapJob(response.data);
  }

  async getAmcAuto(dateFrom?: string, dateTo?: string): Promise<SchedulingAmcAutoVisit[]> {
    const response = await apiClient.get<BackendSchedulingAmcAutoVisit[]>("/api/scheduling/amc-auto", {
      params: {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      },
    });

    return response.data.map(mapAmcVisit);
  }

  async bulkAssignAmc(input: SchedulingBulkAmcAssignInput): Promise<SchedulingJob[]> {
    const response = await apiClient.post<BackendSchedulingJob[]>("/api/scheduling/amc-bulk-assign", {
      technicianId: Number(input.technicianId),
      visits: input.visits.map((visit) => ({
        amcVisitScheduleId: Number(visit.amcVisitScheduleId),
        slotAvailabilityId: Number(visit.slotAvailabilityId),
      })),
      remarks: input.remarks || undefined,
    });

    return response.data.map(mapJob);
  }

  async getConflicts(serviceRequestId: string, technicianId: string, slotAvailabilityId: string): Promise<SchedulingConflict[]> {
    const response = await apiClient.get<BackendSchedulingConflict[]>("/api/scheduling/conflicts", {
      params: {
        serviceRequestId: Number(serviceRequestId),
        technicianId: Number(technicianId),
        slotAvailabilityId: Number(slotAvailabilityId),
      },
    });

    return response.data.map(mapConflict);
  }

  async getSlots(zoneId: string, slotDate: string): Promise<SchedulingSlot[]> {
    const response = await apiClient.get<BackendSchedulingSlot[]>("/api/scheduling/slots", {
      params: {
        zoneId: Number(zoneId),
        slotDate,
      },
    });

    return response.data.map(mapSlot);
  }

  async updateSlot(slotAvailabilityId: string, input: { isBlocked: boolean; availableCapacity?: number }): Promise<SchedulingSlot> {
    const response = await apiClient.put<BackendSchedulingSlot>(`/api/scheduling/slots/${Number(slotAvailabilityId)}`, {
      isBlocked: input.isBlocked,
      availableCapacity: input.availableCapacity,
    });

    return mapSlot(response.data);
  }

  async getTechnicianShifts(technicianId?: string): Promise<SchedulingShift[]> {
    const response = await apiClient.get<BackendSchedulingShift[]>("/api/scheduling/shifts", {
      params: { technicianId: technicianId ? Number(technicianId) : undefined },
    });

    return response.data.map(mapShift);
  }

  async updateTechnicianShifts(input: SchedulingShiftUpdateInput): Promise<SchedulingShift> {
    const response = await apiClient.put<BackendSchedulingShift>("/api/scheduling/shifts", {
      technicianId: Number(input.technicianId),
      days: input.days.map((day) => ({
        dayOfWeekNumber: day.dayOfWeekNumber,
        isOffDuty: day.isOffDuty,
        shiftStartTime: day.shiftStartTime || null,
        shiftEndTime: day.shiftEndTime || null,
        breakStartTime: day.breakStartTime || null,
        breakEndTime: day.breakEndTime || null,
      })),
    });

    return mapShift(response.data);
  }

  async getDaySheet(scheduleDate: string, technicianId?: string): Promise<SchedulingDaySheet> {
    const response = await apiClient.get<BackendSchedulingDaySheet>("/api/scheduling/day-sheet", {
      params: {
        scheduleDate,
        technicianId: technicianId ? Number(technicianId) : undefined,
      },
    });

    return mapDaySheet(response.data);
  }
}

export const schedulingRepository: SchedulingRepository = isDemoMode()
  ? new MockSchedulingRepository()
  : new LiveSchedulingRepository();
