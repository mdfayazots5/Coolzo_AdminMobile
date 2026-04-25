import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export type TechnicianStatus = "available" | "on-job" | "off-duty" | "on-leave";
export type TechnicianSkillCategory = "brand" | "equipment" | "special";

export interface TechnicianSkill {
  id: string;
  code: string;
  name: string;
  category: TechnicianSkillCategory;
  certifiedDate?: string;
}

export interface TechnicianZoneAssignment {
  id: string;
  zoneId: string;
  name: string;
  isPrimary: boolean;
}

export interface TechnicianPerformanceTrendPoint {
  label: string;
  jobsAssigned: number;
  jobsCompleted: number;
  slaCompliance: number;
}

export interface TechnicianPerformance {
  avgRating: number;
  totalJobs: number;
  completedJobs: number;
  slaCompliance: number;
  revisitRate: number;
  revenueGenerated: number;
  teamAverageSlaCompliance: number;
  trends: TechnicianPerformanceTrendPoint[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "leave" | "holiday";
  workflowStatus: string;
  checkIn?: string;
  checkOut?: string;
  locationText?: string;
  leaveReason?: string;
  reviewedByUserId?: string;
  reviewedOn?: string;
}

export interface TechnicianGpsLog {
  id: string;
  trackedOn: string;
  latitude: number;
  longitude: number;
  trackingSource: string;
  locationText: string;
  serviceRequestId?: string;
}

export interface Technician {
  id: string;
  employeeId: string;
  name: string;
  photo?: string;
  phone: string;
  email: string;
  designation: "Senior Technician" | "Junior Technician" | "Helper";
  branch: string;
  zones: string[];
  zoneAssignments: TechnicianZoneAssignment[];
  skills: TechnicianSkill[];
  status: TechnicianStatus;
  rating: number;
  todayJobCount: number;
  performance: TechnicianPerformance;
  attendance: AttendanceRecord[];
  gpsLog: TechnicianGpsLog[];
  currentJobId?: string;
  nextFreeSlot?: string;
  isActive: boolean;
  maxDailyAssignments: number;
  onboardingStatus: string;
  pendingEligibilityItems: string[];
  uploadedDocumentCount: number;
  verifiedDocumentCount: number;
  latestAssessmentResult: string;
  completedTrainingCount: number;
}

export interface TechnicianFilters {
  searchTerm?: string;
  search?: string;
  zone?: string;
  skill?: string;
  availability?: TechnicianStatus | "";
  minimumRating?: number;
  activeOnly?: boolean;
}

export interface TechnicianSkillInput {
  code?: string;
  name: string;
  category: TechnicianSkillCategory;
  certifiedDate?: string;
}

export interface CreateTechnicianInput {
  name: string;
  phone: string;
  email?: string;
  baseZoneId?: string;
  maxDailyAssignments: number;
  skills?: TechnicianSkillInput[];
  zoneIds?: string[];
}

export interface UpdateTechnicianInput {
  name: string;
  phone: string;
  email?: string;
  baseZoneId?: string;
  maxDailyAssignments: number;
  isActive: boolean;
}

export interface LeaveRequestInput {
  leaveDate: string;
  leaveReason?: string;
}

export interface LeaveReviewInput {
  decision: "approve" | "reject";
  remarks?: string;
}

export interface HelperProfile {
  id: string;
  code: string;
  name: string;
  mobileNo: string;
  activeFlag: boolean;
  currentAssignmentStatus?: string;
  pairedTechnicianName?: string;
  serviceRequestNumber?: string;
}

export interface HelperUpdateInput {
  code: string;
  name: string;
  mobileNo: string;
  activeFlag: boolean;
}

export interface TechnicianRepository {
  getTechnicians(filters?: TechnicianFilters): Promise<Technician[]>;
  getTechnicianById(id: string): Promise<Technician | null>;
  createTechnician(input: CreateTechnicianInput): Promise<Technician>;
  updateTechnician(id: string, input: UpdateTechnicianInput): Promise<Technician>;
  updateSkills(id: string, skills: TechnicianSkillInput[]): Promise<TechnicianSkill[]>;
  updateZones(id: string, zoneIds: string[], primaryZoneId?: string): Promise<TechnicianZoneAssignment[]>;
  getTechnicianPerformance(id: string, fromDate?: string, toDate?: string): Promise<TechnicianPerformance>;
  getTechnicianAttendance(id: string, year?: number, month?: number): Promise<AttendanceRecord[]>;
  requestLeave(id: string, input: LeaveRequestInput): Promise<AttendanceRecord>;
  reviewLeave(id: string, leaveRequestId: string, input: LeaveReviewInput): Promise<AttendanceRecord>;
  getAvailabilityBoard(serviceRequestId?: string): Promise<Technician[]>;
  getGpsLog(id: string, trackingDate: string): Promise<TechnicianGpsLog[]>;
  getHelpers(searchTerm?: string): Promise<HelperProfile[]>;
  updateHelper(id: string, input: HelperUpdateInput): Promise<HelperProfile>;
}

interface BackendTechnicianSkill {
  technicianSkillId: number;
  skillCode: string;
  skillName: string;
  skillCategory: string;
  certifiedOnUtc?: string | null;
}

interface BackendTechnicianListItem {
  technicianId: number;
  technicianCode: string;
  technicianName: string;
  mobileNumber: string;
  emailAddress: string;
  isActive: boolean;
  availabilityStatus: string;
  currentServiceRequestNumber?: string | null;
  baseZoneName?: string | null;
  zones: string[];
  skills: BackendTechnicianSkill[];
  averageRating: number;
  todayJobCount: number;
  slaCompliancePercent: number;
  nextFreeSlot?: string | null;
}

interface BackendTechnicianZone {
  technicianZoneId: number;
  zoneId: number;
  zoneName: string;
  isPrimaryZone: boolean;
}

interface BackendTechnicianDetail {
  technicianId: number;
  technicianCode: string;
  technicianName: string;
  mobileNumber: string;
  emailAddress: string;
  baseZoneId?: number | null;
  baseZoneName?: string | null;
  isActive: boolean;
  maxDailyAssignments: number;
  availabilityStatus: string;
  currentServiceRequestNumber?: string | null;
  zones: BackendTechnicianZone[];
  skills: BackendTechnicianSkill[];
  onboardingStatus: string;
  pendingEligibilityItems: string[];
  uploadedDocumentCount: number;
  verifiedDocumentCount: number;
  latestAssessmentResult: string;
  completedTrainingCount: number;
}

interface BackendTechnicianPerformanceTrend {
  label: string;
  jobsAssigned: number;
  jobsCompleted: number;
  slaCompliancePercent: number;
}

interface BackendTechnicianPerformance {
  averageRating: number;
  totalJobs: number;
  completedJobs: number;
  slaCompliancePercent: number;
  revisitRatePercent: number;
  revenueGenerated: number;
  teamAverageSlaCompliancePercent: number;
  trends: BackendTechnicianPerformanceTrend[];
}

interface BackendTechnicianAttendance {
  technicianAttendanceId: number;
  attendanceDate: string;
  attendanceStatus: string;
  checkInOnUtc?: string | null;
  checkOutOnUtc?: string | null;
  locationText: string;
  leaveReason: string;
  reviewedByUserId?: number | null;
  reviewedOnUtc?: string | null;
}

interface BackendTechnicianGpsLog {
  technicianGpsLogId: number;
  trackedOnUtc: string;
  latitude: number;
  longitude: number;
  trackingSource: string;
  locationText: string;
  serviceRequestId?: number | null;
}

interface BackendHelperProfile {
  helperProfileId: number;
  helperCode: string;
  helperName: string;
  mobileNo: string;
  activeFlag: boolean;
  currentAssignmentStatus?: string | null;
  pairedTechnicianName?: string | null;
  serviceRequestNumber?: string | null;
}

const defaultPerformance: TechnicianPerformance = {
  avgRating: 0,
  totalJobs: 0,
  completedJobs: 0,
  slaCompliance: 0,
  revisitRate: 0,
  revenueGenerated: 0,
  teamAverageSlaCompliance: 0,
  trends: [],
};

const normalizeStatus = (status?: string | null): TechnicianStatus => {
  const normalized = (status || "").trim().toLowerCase();
  if (normalized === "on-job") return "on-job";
  if (normalized === "off-duty") return "off-duty";
  if (normalized === "on-leave") return "on-leave";
  return "available";
};

const resolveDesignation = (skills: TechnicianSkill[], maxDailyAssignments: number, todayJobCount: number): Technician["designation"] => {
  if (maxDailyAssignments >= 5 || skills.length >= 3 || todayJobCount >= 3) {
    return "Senior Technician";
  }

  return "Junior Technician";
};

const mapSkillCategory = (category?: string | null): TechnicianSkillCategory => {
  const normalized = (category || "").trim().toLowerCase();
  if (normalized === "brand" || normalized === "equipment" || normalized === "special") {
    return normalized;
  }

  return "special";
};

const mapSkill = (skill: BackendTechnicianSkill): TechnicianSkill => ({
  id: String(skill.technicianSkillId),
  code: skill.skillCode || "",
  name: skill.skillName,
  category: mapSkillCategory(skill.skillCategory),
  certifiedDate: skill.certifiedOnUtc || undefined,
});

const mapPerformance = (performance?: BackendTechnicianPerformance): TechnicianPerformance => ({
  avgRating: performance?.averageRating ?? 0,
  totalJobs: performance?.totalJobs ?? 0,
  completedJobs: performance?.completedJobs ?? 0,
  slaCompliance: performance?.slaCompliancePercent ?? 0,
  revisitRate: performance?.revisitRatePercent ?? 0,
  revenueGenerated: performance?.revenueGenerated ?? 0,
  teamAverageSlaCompliance: performance?.teamAverageSlaCompliancePercent ?? 0,
  trends: (performance?.trends || []).map((item) => ({
    label: item.label,
    jobsAssigned: item.jobsAssigned,
    jobsCompleted: item.jobsCompleted,
    slaCompliance: item.slaCompliancePercent,
  })),
});

const mapAttendanceStatus = (status?: string | null): AttendanceRecord["status"] => {
  const normalized = (status || "").trim().toLowerCase();
  if (normalized.includes("leave")) return "leave";
  if (normalized === "holiday") return "holiday";
  if (normalized === "checkedin" || normalized === "checkedout" || normalized === "present") return "present";
  return "absent";
};

const mapAttendance = (attendance: BackendTechnicianAttendance): AttendanceRecord => ({
  id: String(attendance.technicianAttendanceId),
  date: attendance.attendanceDate,
  status: mapAttendanceStatus(attendance.attendanceStatus),
  workflowStatus: attendance.attendanceStatus,
  checkIn: attendance.checkInOnUtc || undefined,
  checkOut: attendance.checkOutOnUtc || undefined,
  locationText: attendance.locationText || undefined,
  leaveReason: attendance.leaveReason || undefined,
  reviewedByUserId: attendance.reviewedByUserId ? String(attendance.reviewedByUserId) : undefined,
  reviewedOn: attendance.reviewedOnUtc || undefined,
});

const mapGpsLog = (gpsLog: BackendTechnicianGpsLog): TechnicianGpsLog => ({
  id: String(gpsLog.technicianGpsLogId),
  trackedOn: gpsLog.trackedOnUtc,
  latitude: gpsLog.latitude,
  longitude: gpsLog.longitude,
  trackingSource: gpsLog.trackingSource,
  locationText: gpsLog.locationText,
  serviceRequestId: gpsLog.serviceRequestId ? String(gpsLog.serviceRequestId) : undefined,
});

const buildZoneAssignments = (detail: Pick<BackendTechnicianDetail, "zones" | "baseZoneId" | "baseZoneName">): TechnicianZoneAssignment[] => {
  const zoneAssignments = detail.zones.map((zone) => ({
    id: String(zone.technicianZoneId),
    zoneId: String(zone.zoneId),
    name: zone.zoneName,
    isPrimary: zone.isPrimaryZone,
  }));

  if (zoneAssignments.length > 0) {
    return zoneAssignments;
  }

  if (!detail.baseZoneId || !detail.baseZoneName) {
    return [];
  }

  return [{ id: `base-${detail.baseZoneId}`, zoneId: String(detail.baseZoneId), name: detail.baseZoneName, isPrimary: true }];
};

const buildBaseTechnician = (
  source: BackendTechnicianListItem | BackendTechnicianDetail,
  performance?: BackendTechnicianPerformance,
  attendance: AttendanceRecord[] = [],
  gpsLog: TechnicianGpsLog[] = []
): Technician => {
  const skillList = source.skills.map(mapSkill);
  const zoneAssignments = "zones" in source && Array.isArray(source.zones) && source.zones.length > 0 && typeof source.zones[0] === "object"
    ? buildZoneAssignments(source as BackendTechnicianDetail)
    : (source as BackendTechnicianListItem).zones.map((zoneName) => ({ id: zoneName, zoneId: zoneName, name: zoneName, isPrimary: false }));
  const zoneNames = zoneAssignments.length > 0
    ? zoneAssignments.map((zone) => zone.name)
    : ("zones" in source && Array.isArray((source as BackendTechnicianListItem).zones)
      ? (source as BackendTechnicianListItem).zones
      : []);
  const maxDailyAssignments = "maxDailyAssignments" in source ? source.maxDailyAssignments : 4;

  return {
    id: String(source.technicianId),
    employeeId: source.technicianCode,
    name: source.technicianName,
    phone: source.mobileNumber,
    email: source.emailAddress,
    designation: resolveDesignation(skillList, maxDailyAssignments, "todayJobCount" in source ? source.todayJobCount : 0),
    branch: source.baseZoneName?.trim() || zoneNames[0] || "Unassigned",
    zones: zoneNames.length > 0 ? zoneNames : ["Unassigned"],
    zoneAssignments,
    skills: skillList,
    status: normalizeStatus(source.availabilityStatus),
    rating: performance?.averageRating ?? ("averageRating" in source ? source.averageRating : 0),
    todayJobCount: "todayJobCount" in source ? source.todayJobCount : 0,
    performance: mapPerformance(performance),
    attendance,
    gpsLog,
    currentJobId: source.currentServiceRequestNumber || undefined,
    nextFreeSlot: "nextFreeSlot" in source ? source.nextFreeSlot || undefined : undefined,
    isActive: source.isActive,
    maxDailyAssignments,
    onboardingStatus: "onboardingStatus" in source ? source.onboardingStatus : "Draft",
    pendingEligibilityItems: "pendingEligibilityItems" in source ? source.pendingEligibilityItems : [],
    uploadedDocumentCount: "uploadedDocumentCount" in source ? source.uploadedDocumentCount : 0,
    verifiedDocumentCount: "verifiedDocumentCount" in source ? source.verifiedDocumentCount : 0,
    latestAssessmentResult: "latestAssessmentResult" in source ? source.latestAssessmentResult : "Pending",
    completedTrainingCount: "completedTrainingCount" in source ? source.completedTrainingCount : 0,
  };
};

const mapHelper = (helper: BackendHelperProfile): HelperProfile => ({
  id: String(helper.helperProfileId),
  code: helper.helperCode,
  name: helper.helperName,
  mobileNo: helper.mobileNo,
  activeFlag: helper.activeFlag,
  currentAssignmentStatus: helper.currentAssignmentStatus || undefined,
  pairedTechnicianName: helper.pairedTechnicianName || undefined,
  serviceRequestNumber: helper.serviceRequestNumber || undefined,
});

const toBackendSkill = (skill: TechnicianSkillInput) => ({
  skillCode: (skill.code || "").trim(),
  skillName: skill.name.trim(),
  skillCategory: skill.category,
  certifiedOnUtc: skill.certifiedDate || null,
});

const createMockTechnician = (source: Partial<Technician> & Pick<Technician, "id" | "employeeId" | "name" | "phone">): Technician => ({
  id: source.id,
  employeeId: source.employeeId,
  name: source.name,
  photo: source.photo,
  phone: source.phone,
  email: source.email || "",
  designation: source.designation || "Junior Technician",
  branch: source.branch || "Unassigned",
  zones: source.zones || ["Unassigned"],
  zoneAssignments: source.zoneAssignments || [],
  skills: source.skills || [],
  status: source.status || "available",
  rating: source.rating || 0,
  todayJobCount: source.todayJobCount || 0,
  performance: source.performance || defaultPerformance,
  attendance: source.attendance || [],
  gpsLog: source.gpsLog || [],
  currentJobId: source.currentJobId,
  nextFreeSlot: source.nextFreeSlot,
  isActive: source.isActive ?? true,
  maxDailyAssignments: source.maxDailyAssignments || 4,
  onboardingStatus: source.onboardingStatus || "ReadyForActivation",
  pendingEligibilityItems: source.pendingEligibilityItems || [],
  uploadedDocumentCount: source.uploadedDocumentCount || 0,
  verifiedDocumentCount: source.verifiedDocumentCount || 0,
  latestAssessmentResult: source.latestAssessmentResult || "Pending",
  completedTrainingCount: source.completedTrainingCount || 0,
});

class MockTechnicianRepository implements TechnicianRepository {
  private technicians: Technician[] = [
    createMockTechnician({
      id: "101",
      employeeId: "TECH-001",
      name: "Rajesh Kumar",
      phone: "+91 9820011223",
      email: "rajesh@coolzo.com",
      designation: "Senior Technician",
      branch: "Mumbai West",
      zones: ["Mumbai West", "Mumbai Central"],
      zoneAssignments: [
        { id: "1", zoneId: "1", name: "Mumbai West", isPrimary: true },
        { id: "2", zoneId: "2", name: "Mumbai Central", isPrimary: false },
      ],
      skills: [
        { id: "1", code: "daikin", name: "Daikin Certified", category: "brand" },
        { id: "2", code: "split", name: "Split AC Expert", category: "equipment" },
      ],
      status: "available",
      rating: 4.8,
      todayJobCount: 2,
      performance: {
        avgRating: 4.8,
        totalJobs: 145,
        completedJobs: 138,
        slaCompliance: 96,
        revisitRate: 2,
        revenueGenerated: 245000,
        teamAverageSlaCompliance: 88,
        trends: [
          { label: "15 Apr", jobsAssigned: 3, jobsCompleted: 3, slaCompliance: 100 },
          { label: "16 Apr", jobsAssigned: 2, jobsCompleted: 2, slaCompliance: 100 },
          { label: "17 Apr", jobsAssigned: 4, jobsCompleted: 3, slaCompliance: 75 },
        ],
      },
      attendance: [
        { id: "a1", date: "2026-04-15", status: "present", workflowStatus: "CheckedOut", checkIn: "2026-04-15T09:00:00Z", checkOut: "2026-04-15T18:15:00Z" },
        { id: "a2", date: "2026-04-16", status: "leave", workflowStatus: "LeaveApproved", leaveReason: "Personal leave" },
      ],
      gpsLog: [
        { id: "g1", trackedOn: "2026-04-20T09:20:00Z", latitude: 19.076, longitude: 72.8777, trackingSource: "mobile", locationText: "Andheri West", serviceRequestId: "SR-1001" },
        { id: "g2", trackedOn: "2026-04-20T10:05:00Z", latitude: 19.081, longitude: 72.882, trackingSource: "mobile", locationText: "Jogeshwari", serviceRequestId: "SR-1001" },
      ],
      currentJobId: "SR-1001",
      nextFreeSlot: "2 slots free",
      onboardingStatus: "Active",
      uploadedDocumentCount: 3,
      verifiedDocumentCount: 3,
      latestAssessmentResult: "Passed",
      completedTrainingCount: 2,
    }),
    createMockTechnician({
      id: "102",
      employeeId: "TECH-002",
      name: "Vikram Singh",
      phone: "+91 9820044556",
      email: "vikram@coolzo.com",
      branch: "Mumbai East",
      zones: ["Mumbai East"],
      zoneAssignments: [{ id: "3", zoneId: "3", name: "Mumbai East", isPrimary: true }],
      skills: [{ id: "3", code: "lg", name: "LG Certified", category: "brand" }],
      status: "on-job",
      rating: 4.4,
      todayJobCount: 3,
      currentJobId: "SR-1009",
      nextFreeSlot: "Capacity full",
      onboardingStatus: "VerificationPending",
      pendingEligibilityItems: ["TechnicalCertificate must be verified."],
      uploadedDocumentCount: 2,
      verifiedDocumentCount: 1,
      latestAssessmentResult: "Passed",
      completedTrainingCount: 1,
    }),
  ];

  private helpers: HelperProfile[] = [
    { id: "501", code: "HELP-001", name: "Arun Das", mobileNo: "+91 9898989898", activeFlag: true, currentAssignmentStatus: "Assigned", pairedTechnicianName: "Rajesh Kumar", serviceRequestNumber: "SR-1001" },
    { id: "502", code: "HELP-002", name: "Kiran Shah", mobileNo: "+91 9876501234", activeFlag: false },
  ];

  async getTechnicians(filters: TechnicianFilters = {}) {
    let data = [...this.technicians];

    if (filters.activeOnly) {
      data = data.filter((item) => item.isActive);
    }

    const query = (filters.searchTerm || filters.search || "").trim().toLowerCase();
    if (query) {
      data = data.filter((item) =>
        item.name.toLowerCase().includes(query) ||
        item.employeeId.toLowerCase().includes(query) ||
        item.skills.some((skill) => skill.name.toLowerCase().includes(query))
      );
    }

    if (filters.zone) {
      data = data.filter((item) => item.zones.includes(filters.zone!));
    }

    if (filters.skill) {
      data = data.filter((item) => item.skills.some((skill) => skill.name.toLowerCase().includes(filters.skill!.toLowerCase())));
    }

    if (filters.availability) {
      data = data.filter((item) => item.status === filters.availability);
    }

    if (typeof filters.minimumRating === "number") {
      data = data.filter((item) => item.rating >= filters.minimumRating!);
    }

    return data;
  }

  async getTechnicianById(id: string) {
    return this.technicians.find((item) => item.id === id) || null;
  }

  async createTechnician(input: CreateTechnicianInput) {
    const newTech = createMockTechnician({
      id: String(Date.now()),
      employeeId: `TECH-${this.technicians.length + 1}`.padStart(8, "0"),
      name: input.name,
      phone: input.phone,
      email: input.email || "",
      branch: "Draft",
      zones: [],
      zoneAssignments: (input.zoneIds || []).map((zoneId, index) => ({ id: `${Date.now()}-${zoneId}`, zoneId, name: zoneId, isPrimary: index === 0 })),
      skills: (input.skills || []).map((skill, index) => ({ id: `${Date.now()}-${index}`, code: skill.code || "", name: skill.name, category: skill.category, certifiedDate: skill.certifiedDate })),
      isActive: false,
      maxDailyAssignments: input.maxDailyAssignments,
      onboardingStatus: "Draft",
      pendingEligibilityItems: ["At least one completed and passed skill assessment is required."],
    });

    this.technicians.unshift(newTech);
    return newTech;
  }

  async updateTechnician(id: string, input: UpdateTechnicianInput) {
    const current = this.technicians.find((item) => item.id === id);
    if (!current) throw new Error("Technician not found");

    Object.assign(current, {
      name: input.name,
      phone: input.phone,
      email: input.email || "",
      isActive: input.isActive,
      maxDailyAssignments: input.maxDailyAssignments,
    });

    return current;
  }

  async updateSkills(id: string, skills: TechnicianSkillInput[]) {
    const current = this.technicians.find((item) => item.id === id);
    if (!current) throw new Error("Technician not found");

    current.skills = skills.map((skill, index) => ({
      id: `${id}-skill-${index}`,
      code: skill.code || "",
      name: skill.name,
      category: skill.category,
      certifiedDate: skill.certifiedDate,
    }));

    return current.skills;
  }

  async updateZones(id: string, zoneIds: string[], primaryZoneId?: string) {
    const current = this.technicians.find((item) => item.id === id);
    if (!current) throw new Error("Technician not found");

    current.zoneAssignments = zoneIds.map((zoneId, index) => ({
      id: `${id}-zone-${zoneId}`,
      zoneId,
      name: zoneId,
      isPrimary: primaryZoneId ? primaryZoneId === zoneId : index === 0,
    }));
    current.zones = current.zoneAssignments.map((zone) => zone.name);

    return current.zoneAssignments;
  }

  async getTechnicianPerformance(id: string) {
    return (await this.getTechnicianById(id))?.performance || defaultPerformance;
  }

  async getTechnicianAttendance(id: string) {
    return (await this.getTechnicianById(id))?.attendance || [];
  }

  async requestLeave(id: string, input: LeaveRequestInput) {
    const current = this.technicians.find((item) => item.id === id);
    if (!current) throw new Error("Technician not found");

    const attendance: AttendanceRecord = {
      id: `${id}-leave-${Date.now()}`,
      date: input.leaveDate,
      status: "leave",
      workflowStatus: "LeaveRequested",
      leaveReason: input.leaveReason,
    };

    current.attendance = [...current.attendance, attendance];
    return attendance;
  }

  async reviewLeave(id: string, leaveRequestId: string, input: LeaveReviewInput) {
    const current = this.technicians.find((item) => item.id === id);
    if (!current) throw new Error("Technician not found");

    const attendance = current.attendance.find((item) => item.id === leaveRequestId);
    if (!attendance) throw new Error("Leave request not found");

    attendance.workflowStatus = input.decision === "approve" ? "LeaveApproved" : "LeaveRejected";
    attendance.status = input.decision === "approve" ? "leave" : "absent";
    attendance.leaveReason = input.remarks || attendance.leaveReason;

    return attendance;
  }

  async getAvailabilityBoard() {
    return this.technicians;
  }

  async getGpsLog(id: string) {
    return (await this.getTechnicianById(id))?.gpsLog || [];
  }

  async getHelpers() {
    return this.helpers;
  }

  async updateHelper(id: string, input: HelperUpdateInput) {
    const helper = this.helpers.find((item) => item.id === id);
    if (!helper) throw new Error("Helper not found");

    Object.assign(helper, {
      code: input.code,
      name: input.name,
      mobileNo: input.mobileNo,
      activeFlag: input.activeFlag,
    });

    return helper;
  }
}

class LiveTechnicianRepository implements TechnicianRepository {
  async getTechnicians(filters: TechnicianFilters = {}) {
    const response = await apiClient.get<BackendTechnicianListItem[]>("/api/technicians", {
      params: {
        searchTerm: filters.searchTerm || filters.search || undefined,
        activeOnly: typeof filters.activeOnly === "boolean" ? filters.activeOnly : false,
        zone: filters.zone || undefined,
        skill: filters.skill || undefined,
        availability: filters.availability || undefined,
        minimumRating: typeof filters.minimumRating === "number" ? filters.minimumRating : undefined,
      },
    });

    return response.data.map((item) => buildBaseTechnician(item));
  }

  async getTechnicianById(id: string) {
    const response = await apiClient.get<BackendTechnicianDetail>(`/api/technicians/${Number(id)}`);
    const [performance, attendance, gpsLog] = await Promise.all([
      this.getTechnicianPerformance(id),
      this.getTechnicianAttendance(id),
      this.getGpsLog(id, new Date().toISOString().slice(0, 10)),
    ]);

    return buildBaseTechnician(response.data, {
      averageRating: performance.avgRating,
      totalJobs: performance.totalJobs,
      completedJobs: performance.completedJobs,
      slaCompliancePercent: performance.slaCompliance,
      revisitRatePercent: performance.revisitRate,
      revenueGenerated: performance.revenueGenerated,
      teamAverageSlaCompliancePercent: performance.teamAverageSlaCompliance,
      trends: performance.trends.map((item) => ({
        label: item.label,
        jobsAssigned: item.jobsAssigned,
        jobsCompleted: item.jobsCompleted,
        slaCompliancePercent: item.slaCompliance,
      })),
    }, attendance, gpsLog);
  }

  async createTechnician(input: CreateTechnicianInput) {
    const response = await apiClient.post<BackendTechnicianDetail>("/api/technicians", {
      technicianName: input.name.trim(),
      mobileNumber: input.phone.trim(),
      emailAddress: input.email?.trim() || null,
      baseZoneId: input.baseZoneId ? Number(input.baseZoneId) : null,
      maxDailyAssignments: input.maxDailyAssignments,
      skills: (input.skills || []).map(toBackendSkill),
      zoneIds: (input.zoneIds || []).map((zoneId) => Number(zoneId)),
    });

    return buildBaseTechnician(response.data);
  }

  async updateTechnician(id: string, input: UpdateTechnicianInput) {
    const response = await apiClient.put<BackendTechnicianDetail>(`/api/technicians/${Number(id)}`, {
      technicianName: input.name.trim(),
      mobileNumber: input.phone.trim(),
      emailAddress: input.email?.trim() || null,
      baseZoneId: input.baseZoneId ? Number(input.baseZoneId) : null,
      maxDailyAssignments: input.maxDailyAssignments,
      isActive: input.isActive,
    });

    return buildBaseTechnician(response.data);
  }

  async updateSkills(id: string, skills: TechnicianSkillInput[]) {
    const response = await apiClient.patch<BackendTechnicianSkill[]>(`/api/technicians/${Number(id)}/skills`, {
      skills: skills.map(toBackendSkill),
    });

    return response.data.map(mapSkill);
  }

  async updateZones(id: string, zoneIds: string[], primaryZoneId?: string) {
    const response = await apiClient.patch<BackendTechnicianZone[]>(`/api/technicians/${Number(id)}/zones`, {
      zoneIds: zoneIds.map((zoneId) => Number(zoneId)),
      primaryZoneId: primaryZoneId ? Number(primaryZoneId) : null,
    });

    return response.data.map((zone) => ({
      id: String(zone.technicianZoneId),
      zoneId: String(zone.zoneId),
      name: zone.zoneName,
      isPrimary: zone.isPrimaryZone,
    }));
  }

  async getTechnicianPerformance(id: string, fromDate?: string, toDate?: string) {
    const response = await apiClient.get<BackendTechnicianPerformance>(`/api/technicians/${Number(id)}/performance`, {
      params: {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      },
    });

    return mapPerformance(response.data);
  }

  async getTechnicianAttendance(id: string, year?: number, month?: number) {
    const response = await apiClient.get<BackendTechnicianAttendance[]>(`/api/technicians/${Number(id)}/attendance`, {
      params: {
        year: year || undefined,
        month: month || undefined,
      },
    });

    return response.data.map(mapAttendance);
  }

  async requestLeave(id: string, input: LeaveRequestInput) {
    const response = await apiClient.post<BackendTechnicianAttendance>(`/api/technicians/${Number(id)}/attendance/leave`, {
      leaveDate: input.leaveDate,
      leaveReason: input.leaveReason || null,
    });

    return mapAttendance(response.data);
  }

  async reviewLeave(id: string, leaveRequestId: string, input: LeaveReviewInput) {
    const response = await apiClient.patch<BackendTechnicianAttendance>(`/api/technicians/${Number(id)}/attendance/leave/${Number(leaveRequestId)}`, {
      decision: input.decision,
      remarks: input.remarks || null,
    });

    return mapAttendance(response.data);
  }

  async getAvailabilityBoard(serviceRequestId?: string) {
    const response = await apiClient.get<BackendTechnicianListItem[]>("/api/technicians/availability-board", {
      params: {
        serviceRequestId: serviceRequestId ? Number(serviceRequestId) : undefined,
      },
    });

    return response.data.map((item) => buildBaseTechnician(item));
  }

  async getGpsLog(id: string, trackingDate: string) {
    const response = await apiClient.get<BackendTechnicianGpsLog[]>(`/api/technicians/${Number(id)}/gps-log`, {
      params: { trackingDate },
    });

    return response.data.map(mapGpsLog);
  }

  async getHelpers(searchTerm?: string) {
    const response = await apiClient.get<BackendHelperProfile[]>("/api/helpers", {
      params: { searchTerm: searchTerm || undefined },
    });

    return response.data.map(mapHelper);
  }

  async updateHelper(id: string, input: HelperUpdateInput) {
    const response = await apiClient.put<BackendHelperProfile>(`/api/helpers/${Number(id)}`, {
      helperCode: input.code.trim(),
      helperName: input.name.trim(),
      mobileNo: input.mobileNo.trim(),
      activeFlag: input.activeFlag,
    });

    return mapHelper(response.data);
  }
}

export const technicianRepository: TechnicianRepository = isDemoMode()
  ? new MockTechnicianRepository()
  : new LiveTechnicianRepository();
