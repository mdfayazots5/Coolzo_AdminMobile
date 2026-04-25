import { UserRole, useAuthStore } from "@/store/auth-store";
import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export type SRStatus =
  | "pending"
  | "assigned"
  | "en-route"
  | "arrived"
  | "in-progress"
  | "completed"
  | "closed"
  | "cancelled";

export type SRPriority = "normal" | "urgent" | "emergency";

export interface WorkflowStep {
  id: string;
  label: string;
  status: "pending" | "current" | "completed";
  timestamp?: string;
}

export interface FieldWorkflowChecklistItem {
  id: string;
  task: string;
  isCompleted: boolean;
  isMandatory: boolean;
}

export interface FieldWorkflowPhoto {
  id: string;
  url: string;
  type: "before" | "after" | "issue" | "during";
  timestamp: string;
}

export interface ServiceRequestTimelineEvent {
  status: SRStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface ServiceRequestInternalNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
  isEscalation?: boolean;
}

export interface ServiceRequestCommunicationLog {
  id: string;
  channel: "WhatsApp" | "Email" | "SMS" | "Push";
  recipient: string;
  timestamp: string;
  status: "delivered" | "failed" | "sent";
  subject: string;
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
    type: "residential" | "commercial" | "enterprise";
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
    conditionOnArrival?: "good" | "fair" | "poor" | "critical";
  };

  scheduling: {
    requestedDate: string;
    requestedSlot: string;
    confirmedDate?: string;
    confirmedSlot?: string;
    assignedTechnicianId?: string;
    assignedTechnicianName?: string;
    startTime?: string;
    endTime?: string;
    estimatedDuration?: number;
  };

  fieldWorkflow?: {
    currentStep: string;
    steps: WorkflowStep[];
    checkInTime?: string;
    checkInCoordinates?: { lat: number; lng: number };
    startTime?: string;
    endTime?: string;
    checklist: FieldWorkflowChecklistItem[];
    photos: FieldWorkflowPhoto[];
    signature?: { customerName: string; signatureUrl: string; timestamp: string };
    payment?: { method: "cash" | "online"; amount: number; status: "pending" | "collected"; timestamp: string };
    issuesIdentified?: string[];
    actionTaken?: string;
    recommendations?: string;
  };

  timeline: ServiceRequestTimelineEvent[];
  internalNotes: ServiceRequestInternalNote[];
  communicationLog: ServiceRequestCommunicationLog[];
  createdAt: string;
  createdBy: string;
  isEscalated?: boolean;
  escalationReason?: string;
}

export interface ServiceRequestFilters {
  bookingId?: string;
  serviceId?: string;
  status?: string | string[];
  priority?: SRPriority;
  serviceType?: string;
  zone?: string;
  technicianId?: string;
  unassignedOnly?: boolean;
  slotDate?: string;
  dateFrom?: string;
  dateTo?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateServiceRequestInput {
  customerName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  cityName: string;
  pincode: string;
  addressLabel?: string;
  serviceId: string;
  acTypeId: string;
  tonnageId: string;
  brandId: string;
  slotAvailabilityId: string;
  modelName?: string;
  issueNotes?: string;
  priority: SRPriority;
  internalNote?: string;
  assignedTechnicianId?: string;
}

export interface ServiceRequestRepository {
  getSRs(filters: ServiceRequestFilters): Promise<ServiceRequest[]>;
  getSRById(id: string): Promise<ServiceRequest | null>;
  createSR(input: CreateServiceRequestInput): Promise<ServiceRequest>;
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

interface BackendJobCardSummary {
  jobCardId?: number | null;
  jobCardNumber?: string | null;
  workStartedDateUtc?: string | null;
  workInProgressDateUtc?: string | null;
  workCompletedDateUtc?: string | null;
  submittedForClosureDateUtc?: string | null;
  completionSummary?: string | null;
  noteCount: number;
  attachmentCount: number;
}

interface BackendJobDiagnosisSummary {
  jobDiagnosisId?: number | null;
  complaintIssueMasterId?: number | null;
  complaintIssueName?: string | null;
  diagnosisResultMasterId?: number | null;
  diagnosisResultName?: string | null;
  diagnosisRemarks?: string | null;
  diagnosisDateUtc?: string | null;
}

interface BackendJobChecklistSummary {
  totalItems: number;
  respondedItems: number;
  mandatoryItems: number;
  mandatoryRespondedItems: number;
}

interface BackendJobExecutionNote {
  jobExecutionNoteId: number;
  noteText: string;
  isCustomerVisible: boolean;
  createdBy: string;
  noteDateUtc: string;
}

interface BackendJobAttachment {
  jobAttachmentId: number;
  attachmentType: string;
  fileName: string;
  contentType: string;
  fileSizeInBytes: number;
  fileUrl: string;
  attachmentRemarks: string;
  uploadedDateUtc: string;
}

interface BackendJobExecutionTimelineItem {
  eventType: string;
  eventTitle: string;
  status: string;
  remarks: string;
  eventDateUtc: string;
}

interface BackendServiceRequestStatusHistoryItem {
  status: string;
  remarks: string;
  statusDateUtc: string;
}

interface BackendAssignmentHistoryItem {
  actionName: string;
  previousTechnicianName?: string | null;
  currentTechnicianName: string;
  remarks: string;
  actionDateUtc: string;
}

interface BackendServiceRequestListItem {
  serviceRequestId: number;
  serviceRequestNumber: string;
  bookingId: number;
  bookingReference: string;
  customerName: string;
  serviceName: string;
  currentStatus: string;
  technicianName?: string | null;
  slotDate: string;
  slotLabel: string;
  serviceRequestDateUtc: string;
}

interface BackendServiceRequestDetail {
  serviceRequestId: number;
  serviceRequestNumber: string;
  bookingId: number;
  bookingReference: string;
  bookingStatus: string;
  currentStatus: string;
  serviceRequestDateUtc: string;
  sourceChannel: string;
  customerName: string;
  mobileNumber: string;
  emailAddress: string;
  addressSummary: string;
  zoneName: string;
  slotDate: string;
  slotLabel: string;
  serviceName: string;
  acTypeName: string;
  tonnageName: string;
  brandName: string;
  modelName: string;
  issueNotes: string;
  estimatedPrice: number;
  technicianId?: number | null;
  technicianCode?: string | null;
  technicianName?: string | null;
  technicianMobileNumber?: string | null;
  assignmentRemarks?: string | null;
  jobCard: BackendJobCardSummary;
  quotationId?: number | null;
  quotationNumber?: string | null;
  quotationStatus?: string | null;
  invoiceId?: number | null;
  invoiceNumber?: string | null;
  invoiceStatus?: string | null;
  invoiceGrandTotalAmount?: number | null;
  invoiceBalanceAmount?: number | null;
  diagnosisSummary: BackendJobDiagnosisSummary;
  checklistSummary: BackendJobChecklistSummary;
  executionNotes: BackendJobExecutionNote[];
  attachments: BackendJobAttachment[];
  executionTimeline: BackendJobExecutionTimelineItem[];
  statusTimeline: BackendServiceRequestStatusHistoryItem[];
  assignmentHistory: BackendAssignmentHistoryItem[];
}

interface BackendTechnicianJobListItem {
  serviceRequestId: number;
  jobCardId?: number | null;
  serviceRequestNumber: string;
  jobCardNumber?: string | null;
  lifecycleType: string;
  lifecycleLabel: string;
  bookingReference: string;
  customerName: string;
  mobileNumber: string;
  addressSummary: string;
  serviceName: string;
  currentStatus: string;
  slotDate: string;
  slotLabel: string;
}

interface BackendChecklistItem {
  serviceChecklistMasterId: number;
  checklistTitle: string;
  checklistDescription: string;
  isMandatory: boolean;
  isChecked?: boolean | null;
  responseRemarks: string;
  responseDateUtc?: string | null;
}

interface BackendSupportTicketJobAlert {
  hasLinkedTickets: boolean;
  totalLinkedTickets: number;
  openLinkedTickets: number;
  latestTicketNumber?: string | null;
  latestStatus?: string | null;
  latestSubject?: string | null;
}

interface BackendTechnicianJobDetail {
  serviceRequestId: number;
  serviceRequestNumber: string;
  lifecycleType: string;
  lifecycleLabel: string;
  bookingId: number;
  bookingReference: string;
  currentStatus: string;
  customerName: string;
  mobileNumber: string;
  addressSummary: string;
  zoneName: string;
  serviceName: string;
  acTypeName: string;
  tonnageName: string;
  brandName: string;
  modelName: string;
  issueNotes: string;
  slotDate: string;
  slotLabel: string;
  assignmentRemarks?: string | null;
  jobCard: BackendJobCardSummary;
  quotationId?: number | null;
  quotationNumber?: string | null;
  quotationStatus?: string | null;
  diagnosis: BackendJobDiagnosisSummary;
  checklistSummary: BackendJobChecklistSummary;
  checklistItems: BackendChecklistItem[];
  notes: BackendJobExecutionNote[];
  attachments: BackendJobAttachment[];
  timeline: BackendJobExecutionTimelineItem[];
  supportAlert: BackendSupportTicketJobAlert;
  allowedActions: string[];
}

interface BackendOperationsDashboardSummary {
  totalBookings: number;
  totalServiceRequests: number;
  assignedServiceRequests: number;
  unassignedServiceRequests: number;
  enRouteCount: number;
  reachedCount: number;
  workStartedCount: number;
  workInProgressCount: number;
  submittedForClosureCount: number;
  activeTechnicianCount: number;
  technicianMonitoring: Array<{
    technicianId: number;
    technicianCode: string;
    technicianName: string;
    todayAssignedJobsCount: number;
    activeJobsCount: number;
    currentActiveJobNumber?: string | null;
    currentActiveStatus?: string | null;
  }>;
}

interface BackendGuestBookingSummary {
  bookingId: number;
  bookingReference: string;
  status: string;
  serviceName: string;
  customerName: string;
  mobileNumber: string;
  slotDate: string;
  slotLabel: string;
  addressSummary: string;
  estimatedPrice: number;
  isEmergency: boolean;
  emergencySurchargeAmount: number;
}

const FIELD_ROLES = new Set<UserRole>([UserRole.TECHNICIAN, UserRole.HELPER]);
const DEFAULT_ESTIMATED_DURATION = 90;
const PRIORITY_TAG_REGEX = /^\s*\[Priority:\s*(normal|urgent|emergency)\]\s*/i;
const ESCALATION_TAG_REGEX = /^\s*\[Escalation:\s*([^\]]+)\]\s*/i;

const getCurrentRole = () => useAuthStore.getState().user?.role;
const getCurrentUserName = () => useAuthStore.getState().user?.name ?? "Current User";

const isFieldRole = (role = getCurrentRole()) => Boolean(role && FIELD_ROLES.has(role));

const titleCase = (value: string) =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const normalizeStatusKey = (status?: string | null) =>
  (status ?? "").replace(/[\s_-]/g, "").toLowerCase();

const normalizeStatus = (status?: string | null): SRStatus => {
  switch (normalizeStatusKey(status)) {
    case "assigned":
      return "assigned";
    case "enroute":
      return "en-route";
    case "reached":
      return "arrived";
    case "workstarted":
    case "workinprogress":
      return "in-progress";
    case "workcompletedpendingsubmission":
    case "submittedforclosure":
      return "completed";
    case "cancelled":
    case "noshow":
    case "customerabsent":
      return "cancelled";
    case "new":
    case "rescheduled":
    default:
      return "pending";
  }
};

const toBackendListStatus = (status?: string | string[]) => {
  if (!status || Array.isArray(status)) {
    return undefined;
  }

  switch (status) {
    case "pending":
      return "New";
    case "assigned":
      return "Assigned";
    case "en-route":
      return "EnRoute";
    case "arrived":
      return "Reached";
    case "cancelled":
      return "Cancelled";
    default:
      return undefined;
  }
};

const toBackendUpdateStatus = (status: SRStatus) => {
  switch (status) {
    case "pending":
      return "New";
    case "assigned":
      return "Assigned";
    case "en-route":
      return "EnRoute";
    case "arrived":
      return "Reached";
    case "in-progress":
      return "WorkInProgress";
    case "completed":
    case "closed":
      return "SubmittedForClosure";
    case "cancelled":
      return "Cancelled";
    default:
      return undefined;
  }
};

const parsePriorityText = (text?: string | null) => {
  const source = text?.trim() ?? "";
  const match = source.match(PRIORITY_TAG_REGEX);
  const priority = (match?.[1]?.toLowerCase() as SRPriority | undefined) ?? "normal";

  return {
    priority,
    cleanedText: source.replace(PRIORITY_TAG_REGEX, "").trim(),
  };
};

const buildPriorityIssueNotes = (priority: SRPriority, issueNotes?: string) => {
  const cleanedNotes = issueNotes?.trim() ?? "";
  if (priority === "normal") {
    return cleanedNotes;
  }

  return [`[Priority: ${titleCase(priority)}]`, cleanedNotes].filter(Boolean).join(" ");
};

const buildEscalationNote = (type: string, note: string) => {
  const trimmedType = type.trim() || "Operations";
  const trimmedNote = note.trim() || "Escalation raised from AdminMobile.";
  return `[Escalation: ${trimmedType}] ${trimmedNote}`;
};

const extractEscalationReason = (text: string) => text.match(ESCALATION_TAG_REGEX)?.[1]?.trim();

const stripEscalationTag = (text: string) => text.replace(ESCALATION_TAG_REGEX, "").trim();

const estimateDuration = (startTime?: string | null, endTime?: string | null) => {
  if (!startTime || !endTime) {
    return DEFAULT_ESTIMATED_DURATION;
  }

  const duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
  return duration > 0 ? duration : DEFAULT_ESTIMATED_DURATION;
};

const extractCity = (addressSummary: string, fallback: string) => {
  const parts = addressSummary
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }

  return fallback;
};

const createWorkflowSteps = (status: SRStatus): WorkflowStep[] => {
  const steps = [
    { id: "en-route", label: "En Route" },
    { id: "arrived", label: "Arrived" },
    { id: "in-progress", label: "In Progress" },
    { id: "report", label: "Service Report" },
    { id: "payment", label: "Payment" },
  ];

  const currentIndex =
    status === "en-route"
      ? 0
      : status === "arrived"
        ? 1
        : status === "in-progress"
          ? 2
          : status === "completed" || status === "closed"
            ? 4
            : -1;

  return steps.map((step, index) => ({
    ...step,
    status:
      currentIndex < 0
        ? "pending"
        : index < currentIndex
          ? "completed"
          : index === currentIndex
            ? "current"
            : "pending",
  }));
};

const determineWorkflowStep = (status: SRStatus) => {
  switch (status) {
    case "en-route":
      return "en-route";
    case "arrived":
      return "arrived";
    case "in-progress":
      return "in-progress";
    case "completed":
      return "payment";
    case "closed":
      return "complete";
    default:
      return "info";
  }
};

const mapAttachmentType = (attachmentType: string): FieldWorkflowPhoto["type"] => {
  const key = attachmentType.toLowerCase();
  if (key.includes("before")) {
    return "before";
  }
  if (key.includes("after")) {
    return "after";
  }
  if (key.includes("issue")) {
    return "issue";
  }
  return "during";
};

const buildFieldWorkflow = (
  status: SRStatus,
  checklist: BackendChecklistItem[],
  attachments: BackendJobAttachment[],
  jobCard: BackendJobCardSummary,
) => ({
  currentStep: determineWorkflowStep(status),
  steps: createWorkflowSteps(status),
  checkInTime: status === "arrived" ? jobCard.workStartedDateUtc ?? undefined : undefined,
  startTime: jobCard.workStartedDateUtc ?? undefined,
  endTime: jobCard.workCompletedDateUtc ?? jobCard.submittedForClosureDateUtc ?? undefined,
  checklist: checklist.map((item) => ({
    id: String(item.serviceChecklistMasterId),
    task: item.checklistTitle,
    isCompleted: Boolean(item.isChecked),
    isMandatory: item.isMandatory,
  })),
  photos: attachments.map((attachment) => ({
    id: String(attachment.jobAttachmentId),
    url: attachment.fileUrl,
    type: mapAttachmentType(attachment.attachmentType),
    timestamp: attachment.uploadedDateUtc,
  })),
});

const buildAssignmentNote = (history: BackendAssignmentHistoryItem) => {
  const summary = history.previousTechnicianName
    ? `${history.previousTechnicianName} -> ${history.currentTechnicianName}`
    : `Assigned to ${history.currentTechnicianName}`;

  return history.remarks?.trim() ? `${summary}. ${history.remarks.trim()}` : summary;
};

const compareTimeline = (left: ServiceRequestTimelineEvent, right: ServiceRequestTimelineEvent) =>
  new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();

const mapInternalNotes = (notes: BackendJobExecutionNote[]): ServiceRequestInternalNote[] =>
  notes.map((note) => ({
    id: String(note.jobExecutionNoteId),
    author: note.createdBy,
    timestamp: note.noteDateUtc,
    content: stripEscalationTag(note.noteText),
    isEscalation: Boolean(extractEscalationReason(note.noteText)),
  }));

const buildBaseServiceRequest = (params: {
  id: string;
  srNumber: string;
  status: SRStatus;
  priority: SRPriority;
  serviceType: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  zone: string;
  city: string;
  brand: string;
  model: string;
  equipmentType: string;
  tonnage: string;
  requestedDate: string;
  requestedSlot: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  createdAt: string;
  createdBy: string;
  fieldWorkflow?: ServiceRequest["fieldWorkflow"];
  timeline?: ServiceRequestTimelineEvent[];
  internalNotes?: ServiceRequestInternalNote[];
  isEscalated?: boolean;
  escalationReason?: string;
  startTime?: string;
  endTime?: string;
}) => ({
  id: params.id,
  srNumber: params.srNumber,
  status: params.status,
  priority: params.priority,
  serviceType: params.serviceType,
  customer: {
    id: "",
    name: params.customerName,
    phone: params.phone,
    email: params.email,
    type: "residential" as const,
    isAMC: false,
  },
  location: {
    address: params.address,
    zoneId: params.zone,
    city: params.city,
  },
  equipment: {
    brand: params.brand,
    model: params.model,
    type: params.equipmentType,
    tonnage: params.tonnage,
  },
  scheduling: {
    requestedDate: params.requestedDate,
    requestedSlot: params.requestedSlot,
    confirmedDate: params.requestedDate,
    confirmedSlot: params.requestedSlot,
    assignedTechnicianId: params.assignedTechnicianId,
    assignedTechnicianName: params.assignedTechnicianName,
    startTime: params.startTime,
    endTime: params.endTime,
    estimatedDuration: estimateDuration(params.startTime, params.endTime),
  },
  fieldWorkflow: params.fieldWorkflow,
  timeline:
    params.timeline ??
    [
      {
        status: params.status,
        timestamp: params.createdAt,
        actor: params.createdBy,
      },
    ],
  internalNotes: params.internalNotes ?? [],
  communicationLog: [],
  createdAt: params.createdAt,
  createdBy: params.createdBy,
  isEscalated: params.isEscalated,
  escalationReason: params.escalationReason,
} satisfies ServiceRequest);

const mapAdminListItemToServiceRequest = (item: BackendServiceRequestListItem): ServiceRequest =>
  buildBaseServiceRequest({
    id: String(item.serviceRequestId),
    srNumber: item.serviceRequestNumber,
    status: normalizeStatus(item.currentStatus),
    priority: "normal",
    serviceType: item.serviceName,
    customerName: item.customerName,
    phone: "",
    email: "",
    address: item.bookingReference,
    zone: "Unassigned",
    city: "Unassigned",
    brand: "",
    model: "",
    equipmentType: "",
    tonnage: "",
    requestedDate: item.slotDate,
    requestedSlot: item.slotLabel,
    assignedTechnicianName: item.technicianName ?? undefined,
    createdAt: item.serviceRequestDateUtc,
    createdBy: "Operations",
  });

const mapAdminDetailToServiceRequest = (detail: BackendServiceRequestDetail): ServiceRequest => {
  const priorityInfo = parsePriorityText(detail.issueNotes);
  const status = normalizeStatus(detail.currentStatus);
  const internalNotes = mapInternalNotes(detail.executionNotes);
  const escalationReason =
    detail.executionNotes
      .map((note) => extractEscalationReason(note.noteText))
      .find((value): value is string => Boolean(value)) ||
    internalNotes.find((note) => note.isEscalation)?.content ||
    extractEscalationReason(detail.issueNotes ?? "");

  const timeline: ServiceRequestTimelineEvent[] = [
    ...detail.statusTimeline.map((entry) => ({
      status: normalizeStatus(entry.status),
      timestamp: entry.statusDateUtc,
      actor: "Operations",
      note: entry.remarks || undefined,
    })),
    ...detail.assignmentHistory.map((entry) => ({
      status: "assigned" as const,
      timestamp: entry.actionDateUtc,
      actor: "Dispatch",
      note: buildAssignmentNote(entry),
    })),
    ...detail.executionTimeline.map((entry) => ({
      status: normalizeStatus(entry.status),
      timestamp: entry.eventDateUtc,
      actor: "Field Team",
      note: [entry.eventTitle, entry.remarks].filter(Boolean).join(" - ") || undefined,
    })),
  ].sort(compareTimeline);

  return buildBaseServiceRequest({
    id: String(detail.serviceRequestId),
    srNumber: detail.serviceRequestNumber,
    status,
    priority: priorityInfo.priority,
    serviceType: detail.serviceName,
    customerName: detail.customerName,
    phone: detail.mobileNumber,
    email: detail.emailAddress ?? "",
    address: detail.addressSummary,
    zone: detail.zoneName || "Unassigned",
    city: extractCity(detail.addressSummary, detail.zoneName || "Unassigned"),
    brand: detail.brandName,
    model: detail.modelName,
    equipmentType: detail.acTypeName,
    tonnage: detail.tonnageName,
    requestedDate: detail.slotDate,
    requestedSlot: detail.slotLabel,
    assignedTechnicianId: detail.technicianId ? String(detail.technicianId) : undefined,
    assignedTechnicianName: detail.technicianName ?? undefined,
    createdAt: detail.serviceRequestDateUtc,
    createdBy: detail.sourceChannel ? `${detail.sourceChannel} Channel` : "Operations",
    fieldWorkflow: buildFieldWorkflow(status, [], detail.attachments, detail.jobCard),
    timeline,
    internalNotes,
    isEscalated: Boolean(escalationReason),
    escalationReason: typeof escalationReason === "string" ? escalationReason : undefined,
    startTime: detail.jobCard.workStartedDateUtc ?? undefined,
    endTime: detail.jobCard.workCompletedDateUtc ?? detail.jobCard.submittedForClosureDateUtc ?? undefined,
  });
};

const mapTechnicianJobListItemToServiceRequest = (item: BackendTechnicianJobListItem): ServiceRequest =>
  buildBaseServiceRequest({
    id: String(item.serviceRequestId),
    srNumber: item.serviceRequestNumber,
    status: normalizeStatus(item.currentStatus),
    priority: "normal",
    serviceType: item.serviceName,
    customerName: item.customerName,
    phone: item.mobileNumber,
    email: "",
    address: item.addressSummary,
    zone: "Assigned Zone",
    city: extractCity(item.addressSummary, "Assigned Zone"),
    brand: "",
    model: "",
    equipmentType: "",
    tonnage: "",
    requestedDate: item.slotDate,
    requestedSlot: item.slotLabel,
    assignedTechnicianId: useAuthStore.getState().user?.id,
    assignedTechnicianName: useAuthStore.getState().user?.name,
    createdAt: `${item.slotDate}T00:00:00Z`,
    createdBy: "Operations",
  });

const mapTechnicianJobDetailToServiceRequest = (detail: BackendTechnicianJobDetail): ServiceRequest => {
  const priorityInfo = parsePriorityText(detail.issueNotes);
  const status = normalizeStatus(detail.currentStatus);
  const internalNotes = mapInternalNotes(detail.notes);
  const timeline = detail.timeline
    .map((entry) => ({
      status: normalizeStatus(entry.status),
      timestamp: entry.eventDateUtc,
      actor: "Field Team",
      note: [entry.eventTitle, entry.remarks].filter(Boolean).join(" - ") || undefined,
    }))
    .sort(compareTimeline);
  const createdAt = timeline[0]?.timestamp ?? `${detail.slotDate}T00:00:00Z`;

  return buildBaseServiceRequest({
    id: String(detail.serviceRequestId),
    srNumber: detail.serviceRequestNumber,
    status,
    priority: priorityInfo.priority,
    serviceType: detail.serviceName,
    customerName: detail.customerName,
    phone: detail.mobileNumber,
    email: "",
    address: detail.addressSummary,
    zone: detail.zoneName || "Assigned Zone",
    city: extractCity(detail.addressSummary, detail.zoneName || "Assigned Zone"),
    brand: detail.brandName,
    model: detail.modelName,
    equipmentType: detail.acTypeName,
    tonnage: detail.tonnageName,
    requestedDate: detail.slotDate,
    requestedSlot: detail.slotLabel,
    assignedTechnicianId: useAuthStore.getState().user?.id,
    assignedTechnicianName: useAuthStore.getState().user?.name,
    createdAt,
    createdBy: "Operations",
    fieldWorkflow: {
      ...buildFieldWorkflow(status, detail.checklistItems, detail.attachments, detail.jobCard),
      issuesIdentified: detail.diagnosis.complaintIssueName ? [detail.diagnosis.complaintIssueName] : undefined,
      recommendations: detail.diagnosis.diagnosisRemarks ?? undefined,
    },
    timeline,
    internalNotes,
    isEscalated: detail.supportAlert?.openLinkedTickets > 0 || internalNotes.some((note) => note.isEscalation),
    escalationReason: detail.supportAlert?.latestSubject ?? undefined,
    startTime: detail.jobCard.workStartedDateUtc ?? undefined,
    endTime: detail.jobCard.workCompletedDateUtc ?? detail.jobCard.submittedForClosureDateUtc ?? undefined,
  });
};

const toDateValue = (value?: string) => {
  if (!value) {
    return null;
  }

  return new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
};

const matchesFilters = (serviceRequest: ServiceRequest, filters: ServiceRequestFilters) => {
  const statusFilters = filters.status
    ? Array.isArray(filters.status)
      ? filters.status
      : [filters.status]
    : [];

  if (statusFilters.length > 0 && !statusFilters.includes(serviceRequest.status)) {
    return false;
  }

  if (filters.priority && serviceRequest.priority !== filters.priority) {
    return false;
  }

  if (filters.serviceType && serviceRequest.serviceType !== filters.serviceType) {
    return false;
  }

  if (filters.zone && serviceRequest.location.zoneId !== filters.zone) {
    return false;
  }

  if (filters.technicianId && serviceRequest.scheduling.assignedTechnicianId !== filters.technicianId) {
    return false;
  }

  if (filters.unassignedOnly && serviceRequest.scheduling.assignedTechnicianId) {
    return false;
  }

  const requestedDate = toDateValue(serviceRequest.scheduling.requestedDate);
  const fromDate = toDateValue(filters.dateFrom);
  const toDate = toDateValue(filters.dateTo);

  if (requestedDate && fromDate && requestedDate < fromDate) {
    return false;
  }

  if (requestedDate && toDate && requestedDate > toDate) {
    return false;
  }

  return true;
};

const buildTechnicianStatusPayload = (remarks?: string) => ({
  remarks: remarks?.trim() || null,
  workSummary: remarks?.trim() || null,
});

const buildReportNote = (reportData: any) => {
  const parts = [
    reportData?.actionTaken ? `Action: ${String(reportData.actionTaken).trim()}` : null,
    reportData?.recommendations ? `Recommendation: ${String(reportData.recommendations).trim()}` : null,
    Array.isArray(reportData?.issuesIdentified) && reportData.issuesIdentified.length > 0
      ? `Issues: ${reportData.issuesIdentified.join(", ")}`
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "Service report captured.";
};

export class MockServiceRequestRepository implements ServiceRequestRepository {
  private srs: ServiceRequest[] = [
    {
      id: "sr1",
      srNumber: "SR-99281",
      status: "pending",
      priority: "urgent",
      serviceType: "AC Deep Cleaning",
      customer: {
        id: "c1",
        name: "Rajesh Kumar",
        phone: "+91 98200 12345",
        email: "rajesh@example.com",
        type: "residential",
        isAMC: true,
      },
      location: { address: "Flat 402, Sea View Apartments, Bandra West", zoneId: "z2", city: "Mumbai" },
      equipment: { brand: "Daikin", model: "FTKF Series", type: "Split AC", tonnage: "1.5 Ton" },
      scheduling: { requestedDate: "2024-04-12", requestedSlot: "10:00 AM - 12:00 PM" },
      timeline: [{ status: "pending", timestamp: "2024-04-11T09:00:00Z", actor: "CS Agent (Priya)" }],
      internalNotes: [],
      communicationLog: [
        {
          id: "l1",
          channel: "WhatsApp",
          recipient: "+91 98200 12345",
          timestamp: "2024-04-11T09:05:00Z",
          status: "delivered",
          subject: "SR Confirmation",
        },
      ],
      createdAt: "2024-04-11T09:00:00Z",
      createdBy: "Priya Singh",
    },
    {
      id: "sr2",
      srNumber: "SR-99282",
      status: "assigned",
      priority: "emergency",
      serviceType: "Gas Charging",
      customer: {
        id: "c2",
        name: "Hotel Marine Plaza",
        phone: "+91 22 6633 4455",
        email: "maintenance@marineplaza.com",
        type: "enterprise",
        isAMC: false,
      },
      location: { address: "Marine Drive, Churchgate", zoneId: "z1", city: "Mumbai" },
      equipment: { brand: "Blue Star", model: "VRF V Plus", type: "VRF System", tonnage: "10 Ton" },
      scheduling: {
        requestedDate: "2024-04-11",
        requestedSlot: "ASAP",
        assignedTechnicianId: "t1",
        assignedTechnicianName: "Suresh Kumar",
      },
      timeline: [
        { status: "pending", timestamp: "2024-04-11T08:30:00Z", actor: "CS Agent (Priya)" },
        { status: "assigned", timestamp: "2024-04-11T08:45:00Z", actor: "Ops Exec (Rahul)" },
      ],
      internalNotes: [
        {
          id: "n1",
          author: "Rahul Sharma",
          timestamp: "2024-04-11T08:45:00Z",
          content: "Urgent requirement for hotel lobby. Suresh is nearby.",
          isEscalation: true,
        },
      ],
      communicationLog: [],
      createdAt: "2024-04-11T08:30:00Z",
      createdBy: "Priya Singh",
      isEscalated: true,
      escalationReason: "SLA Breach Risk",
    },
    {
      id: "sr3",
      srNumber: "SR-99283",
      status: "assigned",
      priority: "normal",
      serviceType: "AC Maintenance",
      customer: {
        id: "c3",
        name: "Anjali Sharma",
        phone: "+91 98111 22233",
        email: "anjali@example.com",
        type: "residential",
        isAMC: true,
      },
      location: {
        address: "Apt 1201, Lodha Bellissimo, Mahalaxmi",
        zoneId: "z3",
        city: "Mumbai",
        coordinates: { lat: 18.9827, lng: 72.8311 },
      },
      equipment: { brand: "Mitsubishi", model: "MSY-GN", type: "Split AC", tonnage: "2.0 Ton" },
      scheduling: {
        requestedDate: "2024-04-12",
        requestedSlot: "09:00 AM - 11:00 AM",
        assignedTechnicianId: "t1",
        assignedTechnicianName: "Suresh Kumar",
        startTime: "2024-04-12T09:00:00Z",
        estimatedDuration: 90,
      },
      fieldWorkflow: {
        currentStep: "en-route",
        steps: createWorkflowSteps("en-route"),
        checklist: [
          { id: "1", task: "Filter cleaning", isCompleted: false, isMandatory: true },
          { id: "2", task: "Coil inspection", isCompleted: false, isMandatory: true },
          { id: "3", task: "Gas pressure check", isCompleted: false, isMandatory: false },
        ],
        photos: [],
      },
      timeline: [
        { status: "pending", timestamp: "2024-04-11T15:00:00Z", actor: "System" },
        { status: "assigned", timestamp: "2024-04-11T16:00:00Z", actor: "Ops Manager" },
      ],
      internalNotes: [],
      communicationLog: [],
      createdAt: "2024-04-11T15:00:00Z",
      createdBy: "System",
    },
  ];

  async getSRs(filters: ServiceRequestFilters) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return this.srs.filter((item) => matchesFilters(item, filters));
  }

  async getSRById(id: string) {
    return this.srs.find((item) => item.id === id) || null;
  }

  async createSR(input: CreateServiceRequestInput) {
    const newSR: ServiceRequest = {
      id: `sr${this.srs.length + 1}`,
      srNumber: `SR-${99280 + this.srs.length + 1}`,
      status: input.assignedTechnicianId ? "assigned" : "pending",
      priority: input.priority,
      serviceType: "Manual Service Request",
      customer: {
        id: "guest",
        name: input.customerName,
        phone: input.phone,
        email: input.email ?? "",
        type: "residential",
        isAMC: false,
      },
      location: {
        address: input.addressLine1,
        zoneId: input.pincode,
        city: input.cityName,
      },
      equipment: {
        brand: input.brandId,
        model: input.modelName ?? "",
        type: input.acTypeId,
        tonnage: input.tonnageId,
      },
      scheduling: {
        requestedDate: new Date().toISOString().slice(0, 10),
        requestedSlot: input.slotAvailabilityId,
        assignedTechnicianId: input.assignedTechnicianId,
      },
      timeline: [
        {
          status: input.assignedTechnicianId ? "assigned" : "pending",
          timestamp: new Date().toISOString(),
          actor: getCurrentUserName(),
        },
      ],
      internalNotes: input.internalNote
        ? [
            {
              id: String(Date.now()),
              author: getCurrentUserName(),
              timestamp: new Date().toISOString(),
              content: input.internalNote,
            },
          ]
        : [],
      communicationLog: [],
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUserName(),
    };

    this.srs.push(newSR);
    return newSR;
  }

  async updateSR(id: string, data: Partial<ServiceRequest>) {
    const index = this.srs.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("Service request not found");
    }

    this.srs[index] = {
      ...this.srs[index],
      ...data,
      scheduling: {
        ...this.srs[index].scheduling,
        ...data.scheduling,
      },
      location: data.location ? { ...this.srs[index].location, ...data.location } : this.srs[index].location,
      equipment: data.equipment ? { ...this.srs[index].equipment, ...data.equipment } : this.srs[index].equipment,
    };

    return this.srs[index];
  }

  async assignTechnician(srId: string, technicianId: string, technicianName: string) {
    const sr = await this.getSRById(srId);
    if (!sr) {
      return;
    }

    sr.status = "assigned";
    sr.scheduling.assignedTechnicianId = technicianId;
    sr.scheduling.assignedTechnicianName = technicianName;
    sr.timeline.push({
      status: "assigned",
      timestamp: new Date().toISOString(),
      actor: "Dispatch",
      note: technicianName ? `Assigned to ${technicianName}` : undefined,
    });
  }

  async rescheduleSR(srId: string, date: string, slot: string, reason: string) {
    const sr = await this.getSRById(srId);
    if (!sr) {
      return;
    }

    sr.scheduling.confirmedDate = date;
    sr.scheduling.confirmedSlot = slot;
    sr.timeline.push({
      status: sr.status,
      timestamp: new Date().toISOString(),
      actor: "Operations",
      note: `Rescheduled: ${reason}`,
    });
  }

  async cancelSR(srId: string, reason: string) {
    const sr = await this.getSRById(srId);
    if (!sr) {
      return;
    }

    sr.status = "cancelled";
    sr.timeline.push({
      status: "cancelled",
      timestamp: new Date().toISOString(),
      actor: "Operations",
      note: reason,
    });
  }

  async escalateSR(srId: string, type: string, note: string) {
    const sr = await this.getSRById(srId);
    if (!sr) {
      return;
    }

    sr.isEscalated = true;
    sr.escalationReason = type;
    sr.internalNotes.push({
      id: String(Date.now()),
      author: "Operations",
      timestamp: new Date().toISOString(),
      content: note,
      isEscalation: true,
    });
  }

  async addInternalNote(srId: string, content: string, isEscalation?: boolean) {
    const sr = await this.getSRById(srId);
    if (!sr) {
      return;
    }

    sr.internalNotes.push({
      id: String(Date.now()),
      author: getCurrentUserName(),
      timestamp: new Date().toISOString(),
      content,
      isEscalation,
    });
  }

  async getOperationsStats() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      total: 45,
      assigned: 18,
      inProgress: 12,
      completed: 10,
      pending: 5,
      overdue: 2,
      slaCompliance: 94,
      activeTechs: 15,
      avgResponseTime: "42m",
    };
  }

  async getSLAAlerts() {
    return this.srs.filter((item) => item.isEscalated || item.priority === "emergency");
  }

  async getTechnicianJobs(technicianId: string) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return this.srs.filter((item) => item.scheduling.assignedTechnicianId === technicianId);
  }

  async updateJobStatus(id: string, status: SRStatus, location?: { lat: number; lng: number }) {
    const sr = await this.getSRById(id);
    if (!sr) {
      return;
    }

    sr.status = status;
    if (location && sr.fieldWorkflow) {
      sr.fieldWorkflow.checkInCoordinates = location;
    }
    sr.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      actor: "Technician",
    });
  }

  async submitServiceReport(id: string, reportData: any) {
    const sr = await this.getSRById(id);
    if (!sr) {
      return;
    }

    sr.fieldWorkflow = {
      ...sr.fieldWorkflow,
      ...reportData,
      currentStep: "signature",
    } as ServiceRequest["fieldWorkflow"];
  }

  async submitSignature(id: string, signatureData: { customerName: string; signatureUrl: string }) {
    const sr = await this.getSRById(id);
    if (!sr) {
      return;
    }

    sr.fieldWorkflow = {
      ...sr.fieldWorkflow,
      signature: {
        ...signatureData,
        timestamp: new Date().toISOString(),
      },
    } as ServiceRequest["fieldWorkflow"];
  }
}

export class LiveServiceRequestRepository implements ServiceRequestRepository {
  private async fetchAdminDetail(id: number) {
    const response = await apiClient.get<BackendServiceRequestDetail>(`/api/service-requests/${id}`);
    return response.data;
  }

  private async fetchTechnicianDetail(id: number) {
    const response = await apiClient.get<BackendTechnicianJobDetail>(`/api/technician-jobs/${id}`);
    return response.data;
  }

  private async saveTechnicianNote(id: string, noteText: string, isCustomerVisible = false) {
    await apiClient.post(`/api/technician-jobs/${id}/notes`, {
      noteText,
      isCustomerVisible,
    });
  }

  private async postTechnicianAction(id: string, action: string, remarks?: string) {
    await apiClient.post(`/api/technician-jobs/${id}/${action}`, buildTechnicianStatusPayload(remarks));
  }

  async getSRs(filters: ServiceRequestFilters) {
    const response = await apiClient.get<BackendServiceRequestListItem[]>("/api/service-requests", {
      params: {
        bookingId: filters.bookingId ? Number(filters.bookingId) : undefined,
        serviceId: filters.serviceId ? Number(filters.serviceId) : undefined,
        status: toBackendListStatus(filters.status),
        slotDate: filters.slotDate || undefined,
        pageNumber: filters.pageNumber,
        pageSize: filters.pageSize,
      },
    });

    const listItems = response.data;
    const detailResults = await Promise.allSettled(
      listItems.map((item) => this.fetchAdminDetail(item.serviceRequestId)),
    );

    return listItems
      .map((item, index) =>
        detailResults[index].status === "fulfilled"
          ? mapAdminDetailToServiceRequest(detailResults[index].value)
          : mapAdminListItemToServiceRequest(item),
      )
      .filter((item) => matchesFilters(item, filters));
  }

  async getSRById(id: string) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return null;
    }

    if (isFieldRole()) {
      const detail = await this.fetchTechnicianDetail(numericId);
      return mapTechnicianJobDetailToServiceRequest(detail);
    }

    const detail = await this.fetchAdminDetail(numericId);
    return mapAdminDetailToServiceRequest(detail);
  }

  async createSR(input: CreateServiceRequestInput) {
    const bookingResponse = await apiClient.post<BackendGuestBookingSummary>("/api/bookings/guest", {
      serviceId: Number(input.serviceId),
      acTypeId: Number(input.acTypeId),
      tonnageId: Number(input.tonnageId),
      brandId: Number(input.brandId),
      slotAvailabilityId: Number(input.slotAvailabilityId),
      customerName: input.customerName.trim(),
      mobileNumber: input.phone.trim(),
      emailAddress: input.email?.trim() || null,
      addressLine1: input.addressLine1.trim(),
      addressLine2: input.addressLine2?.trim() || null,
      landmark: input.landmark?.trim() || null,
      cityName: input.cityName.trim(),
      pincode: input.pincode.trim(),
      addressLabel: input.addressLabel?.trim() || null,
      modelName: input.modelName?.trim() || null,
      issueNotes: buildPriorityIssueNotes(input.priority, input.issueNotes),
      sourceChannel: "Admin",
    });

    const createdResponse = await apiClient.post<BackendServiceRequestDetail>(
      `/api/service-requests/from-booking/${bookingResponse.data.bookingId}`,
    );

    let current = mapAdminDetailToServiceRequest(createdResponse.data);

    if (input.internalNote?.trim()) {
      await this.addInternalNote(current.id, input.internalNote.trim());
    }

    if (input.assignedTechnicianId) {
      await this.assignTechnician(current.id, input.assignedTechnicianId, "");
    }

    if (input.internalNote?.trim() || input.assignedTechnicianId) {
      const refreshed = await this.getSRById(current.id);
      if (refreshed) {
        current = refreshed;
      }
    }

    return current;
  }

  async updateSR(_id: string, _data: Partial<ServiceRequest>): Promise<ServiceRequest> {
    throw new Error("Direct service-request editing is not supported by the current backend API.");
  }

  async assignTechnician(srId: string, technicianId: string, technicianName: string) {
    const current = await this.getSRById(srId);
    const isReassignment = Boolean(current?.scheduling.assignedTechnicianId);

    await apiClient.post(
      `/api/service-requests/${srId}/${isReassignment ? "reassign" : "assign"}`,
      {
        technicianId: Number(technicianId),
        remarks: technicianName || "Assigned from AdminMobile dispatch.",
      },
    );
  }

  async rescheduleSR(_srId: string, _date: string, _slot: string, _reason: string) {
    throw new Error("Reschedule requires a slot-availability selection and is not exposed by the current Phase 5 API.");
  }

  async cancelSR(srId: string, reason: string) {
    await apiClient.post(`/api/cancellations/service-requests/${srId}`, {
      reasonCode: "ADMIN_CANCEL",
      reasonDescription: reason.trim() || "Cancelled from AdminMobile.",
      requiresApproval: false,
    });
  }

  async escalateSR(srId: string, type: string, note: string) {
    await apiClient.post("/api/escalations", {
      alertType: type.trim() || "ServiceRequestEscalation",
      relatedEntityName: "ServiceRequest",
      relatedEntityId: srId,
      severity: "High",
      escalationLevel: 1,
      slaMinutes: 30,
      notificationChain: null,
      message: note.trim() || `Escalation raised for service request ${srId}.`,
    });

    await this.addInternalNote(srId, buildEscalationNote(type, note), true);
  }

  async addInternalNote(srId: string, content: string, isEscalation?: boolean) {
    await apiClient.post(`/api/service-requests/${srId}/notes`, {
      noteText:
        isEscalation && !ESCALATION_TAG_REGEX.test(content)
          ? buildEscalationNote("Operations", content)
          : content.trim(),
      isCustomerVisible: false,
    });
  }

  async getOperationsStats() {
    const response = await apiClient.get<BackendOperationsDashboardSummary>("/api/service-requests/dashboard-summary");
    const summary = response.data;
    const inProgress =
      summary.enRouteCount +
      summary.reachedCount +
      summary.workStartedCount +
      summary.workInProgressCount;
    const overdue = summary.unassignedServiceRequests;
    const slaCompliance =
      summary.totalServiceRequests > 0
        ? Math.max(0, Math.min(100, Math.round(((summary.totalServiceRequests - overdue) / summary.totalServiceRequests) * 100)))
        : 100;

    return {
      total: summary.totalServiceRequests,
      assigned: summary.assignedServiceRequests,
      inProgress,
      completed: summary.submittedForClosureCount,
      pending: summary.unassignedServiceRequests,
      overdue,
      slaCompliance,
      activeTechs: summary.activeTechnicianCount,
      avgResponseTime: "Live",
    };
  }

  async getSLAAlerts() {
    const requests = await this.getSRs({});
    return requests.filter(
      (item) =>
        item.isEscalated ||
        item.priority === "emergency" ||
        (item.status === "pending" && !item.scheduling.assignedTechnicianId),
    );
  }

  async getTechnicianJobs(technicianId: string) {
    if (!isFieldRole()) {
      return this.getSRs({
        technicianId,
        status: ["assigned", "en-route", "arrived", "in-progress", "completed"],
      });
    }

    const response = await apiClient.get<BackendTechnicianJobListItem[]>("/api/technician-jobs/my-jobs", {
      params: {
        pageNumber: 1,
        pageSize: 50,
      },
    });

    const listItems = response.data;
    const detailResults = await Promise.allSettled(
      listItems.map((item) => this.fetchTechnicianDetail(item.serviceRequestId)),
    );

    return listItems.map((item, index) =>
      detailResults[index].status === "fulfilled"
        ? mapTechnicianJobDetailToServiceRequest(detailResults[index].value)
        : mapTechnicianJobListItemToServiceRequest(item),
    );
  }

  async updateJobStatus(id: string, status: SRStatus, location?: { lat: number; lng: number }) {
    if (!isFieldRole()) {
      const backendStatus = toBackendUpdateStatus(status);
      if (!backendStatus) {
        return;
      }

      const remarks = location ? `Location captured: ${location.lat}, ${location.lng}` : undefined;
      await apiClient.post(`/api/service-requests/${id}/status`, {
        status: backendStatus,
        remarks,
      });
      return;
    }

    const current = await this.fetchTechnicianDetail(Number(id));
    const currentStatus = normalizeStatusKey(current.currentStatus);
    const locationRemarks = location ? `GPS recorded at ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : undefined;

    if (status === "en-route" && currentStatus === "assigned") {
      await this.postTechnicianAction(id, "mark-enroute", locationRemarks);
      return;
    }

    if (status === "arrived" && currentStatus === "enroute") {
      await this.postTechnicianAction(id, "mark-reached", locationRemarks);
      return;
    }

    if (status === "in-progress") {
      if (currentStatus === "reached") {
        await this.postTechnicianAction(id, "start-work", locationRemarks);
      } else if (currentStatus === "workstarted") {
        await this.postTechnicianAction(id, "mark-in-progress", locationRemarks);
      }
      return;
    }

    if (status === "completed") {
      if (currentStatus === "workstarted") {
        await this.postTechnicianAction(id, "mark-in-progress", "Work progressed from AdminMobile.");
        await this.postTechnicianAction(id, "mark-work-completed", "Work completed from AdminMobile.");
        await this.postTechnicianAction(id, "submit-for-closure", "Submitted for closure from AdminMobile.");
      } else if (currentStatus === "workinprogress") {
        await this.postTechnicianAction(id, "mark-work-completed", "Work completed from AdminMobile.");
        await this.postTechnicianAction(id, "submit-for-closure", "Submitted for closure from AdminMobile.");
      } else if (currentStatus === "workcompletedpendingsubmission") {
        await this.postTechnicianAction(id, "submit-for-closure", "Submitted for closure from AdminMobile.");
      }
      return;
    }
  }

  async submitServiceReport(id: string, reportData: any) {
    const note = buildReportNote(reportData);

    if (!isFieldRole()) {
      await this.addInternalNote(id, note);
      return;
    }

    await this.saveTechnicianNote(id, note);

    const current = await this.fetchTechnicianDetail(Number(id));
    if (normalizeStatusKey(current.currentStatus) === "workstarted") {
      await this.postTechnicianAction(id, "mark-in-progress", note);
    }
  }

  async submitSignature(id: string, signatureData: { customerName: string; signatureUrl: string }) {
    const noteText = signatureData.customerName
      ? `Customer signature captured from ${signatureData.customerName}.`
      : "Customer signature captured.";

    if (!isFieldRole()) {
      await this.addInternalNote(id, noteText);
      return;
    }

    await this.saveTechnicianNote(id, noteText);

    const current = await this.fetchTechnicianDetail(Number(id));
    const currentStatus = normalizeStatusKey(current.currentStatus);

    if (currentStatus === "workstarted") {
      await this.postTechnicianAction(id, "mark-in-progress", noteText);
      await this.postTechnicianAction(id, "mark-work-completed", noteText);
    } else if (currentStatus === "workinprogress") {
      await this.postTechnicianAction(id, "mark-work-completed", noteText);
    }
  }
}

export const serviceRequestRepository: ServiceRequestRepository = isDemoMode()
  ? new MockServiceRequestRepository()
  : new LiveServiceRequestRepository();
