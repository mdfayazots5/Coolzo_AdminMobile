import axios from "axios";
import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";
import { LocalStorage, StorageKey } from "../storage/local-storage";
import { UserRole, useAuthStore } from "@/store/auth-store";

export type FieldJobStatus =
  | "assigned"
  | "en-route"
  | "arrived"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface FieldJobListItem {
  id: string;
  serviceRequestNumber: string;
  jobCardNumber?: string;
  lifecycleType: string;
  lifecycleLabel: string;
  bookingReference: string;
  customerName: string;
  mobileNumber: string;
  addressSummary: string;
  serviceName: string;
  currentStatus: string;
  status: FieldJobStatus;
  slotDate: string;
  slotLabel: string;
}

export interface FieldChecklistItem {
  id: string;
  title: string;
  description: string;
  isMandatory: boolean;
  isChecked: boolean;
  responseRemarks: string;
  responseDateUtc?: string;
}

export interface FieldTimelineItem {
  eventType: string;
  eventTitle: string;
  status: string;
  remarks: string;
  eventDateUtc: string;
}

export interface FieldJobPhoto {
  id: string;
  photoType: string;
  fileName: string;
  contentType: string;
  storageUrl: string;
  uploadedBy: string;
  uploadedAtUtc: string;
  photoRemarks: string;
}

export interface FieldJobReport {
  id: string;
  issuesIdentified: string[];
  equipmentCondition: string;
  actionTaken: string;
  recommendation: string;
  observations: string;
  submittedAtUtc: string;
}

export interface FieldCustomerSignature {
  id: string;
  customerName: string;
  signatureDataUrl: string;
  signedAtUtc: string;
  capturedBy: string;
  remarks: string;
}

export interface FieldPartsRequestItem {
  id: string;
  partCode: string;
  partName: string;
  quantityRequested: number;
  quantityApproved: number;
  currentStatus: string;
  remarks: string;
}

export interface FieldPartsRequest {
  id: string;
  urgency: string;
  currentStatus: string;
  notes: string;
  submittedAtUtc: string;
  processedAtUtc?: string;
  items: FieldPartsRequestItem[];
}

export interface FieldQuotationLine {
  id: string;
  lineType: string;
  lineDescription: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}

export interface FieldQuotation {
  id: string;
  quotationNumber: string;
  currentStatus: string;
  quotationDateUtc: string;
  subTotalAmount: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotalAmount: number;
  customerDecisionRemarks: string;
  lines: FieldQuotationLine[];
}

export interface FieldInvoiceLine {
  id: string;
  lineType: string;
  lineDescription: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}

export interface FieldPayment {
  id: string;
  paymentMethod: string;
  referenceNumber: string;
  paidAmount: number;
  paymentDateUtc: string;
  transactionRemarks: string;
  receiptNumber?: string;
}

export interface FieldInvoice {
  id: string;
  invoiceNumber: string;
  currentStatus: string;
  invoiceDateUtc: string;
  subTotalAmount: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  lastPaymentDateUtc?: string;
  lines: FieldInvoiceLine[];
}

export interface FieldJobDetail {
  id: string;
  serviceRequestNumber: string;
  jobCardId?: string;
  jobCardNumber?: string;
  lifecycleType: string;
  lifecycleLabel: string;
  bookingReference: string;
  currentStatus: string;
  status: FieldJobStatus;
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
  assignmentRemarks?: string;
  customerLatitude?: number;
  customerLongitude?: number;
  allowedActions: string[];
  checklist: FieldChecklistItem[];
  timeline: FieldTimelineItem[];
  latestReport?: FieldJobReport;
  photos: FieldJobPhoto[];
  signature?: FieldCustomerSignature;
  partsRequests: FieldPartsRequest[];
  quotation?: FieldQuotation;
  invoice?: FieldInvoice;
  payments: FieldPayment[];
}

export interface FieldArrivalResponse {
  overrideRequired: boolean;
  distanceMeters: number;
  message: string;
  job?: FieldJobDetail | null;
  queued?: boolean;
}

export interface FieldAttendanceRecord {
  id: string;
  attendanceDate: string;
  attendanceStatus: string;
  checkInOnUtc?: string;
  checkOutOnUtc?: string;
  locationText: string;
}

export interface FieldProgressPayload {
  items: Array<{
    serviceChecklistMasterId: number;
    isChecked?: boolean;
    responseRemarks?: string;
  }>;
  remarks?: string;
}

export interface FieldPartsRequestPayload {
  urgency: "Normal" | "Emergency";
  notes?: string;
  items: Array<{
    partCode: string;
    partName: string;
    quantityRequested: number;
    remarks?: string;
  }>;
}

export interface FieldEstimatePayload {
  discountAmount: number;
  taxPercentage: number;
  remarks?: string;
  lines: Array<{
    lineType: "Service" | "Labour" | "Part" | "VisitFee";
    lineDescription: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface FieldReportPayload {
  equipmentCondition: string;
  issuesIdentified: string[];
  actionTaken: string;
  recommendation?: string;
  observations?: string;
}

export interface FieldPhotoPayload {
  photoType: "Before" | "During" | "After" | "IssueEvidence";
  fileName: string;
  contentType: string;
  base64Content: string;
  remarks?: string;
}

export interface FieldSignaturePayload {
  customerName: string;
  signatureBase64: string;
  remarks?: string;
}

export interface FieldPaymentPayload {
  paidAmount: number;
  paymentMethod: "Cash" | "Upi" | "Card";
  referenceNumber?: string;
  remarks?: string;
  gatewayTransactionId?: string;
  signature?: string;
  expectedInvoiceAmount?: number;
}

export type OfflineSubmissionType =
  | "field_depart"
  | "field_arrive"
  | "field_start_work"
  | "field_progress"
  | "part_request"
  | "estimate"
  | "job_report"
  | "job_photo"
  | "job_signature"
  | "job_payment"
  | "job_complete"
  | "attendance_check_in"
  | "attendance_check_out"
  | "helper_check_in"
  | "helper_check_out"
  | "helper_task"
  | "helper_photo";

export interface OfflineSubmission {
  id: string;
  type: OfflineSubmissionType;
  timestamp: string;
  status: "pending" | "syncing" | "failed" | "success";
  data: unknown;
  retryCount: number;
  errorMessage?: string;
}

export interface HelperTask {
  id: string;
  taskName: string;
  taskDescription: string;
  mandatoryFlag: boolean;
  sortOrder: number;
  responseStatus: string;
  responseRemarks: string;
  responsePhotoUrl: string;
  respondedOnUtc?: string;
}

export interface HelperJobView {
  helperProfileId: string;
  assignmentStatus: string;
  technicianId?: string;
  technicianName?: string;
  serviceRequestId?: string;
  serviceRequestNumber?: string;
  jobCardId?: string;
  jobCardNumber?: string;
  customerName?: string;
  serviceName?: string;
  addressSummary?: string;
  assignmentRemarks: string;
  assignedOnUtc?: string;
  releasedOnUtc?: string;
  attendance: FieldAttendanceRecord[];
  tasks: HelperTask[];
}

interface FieldJobListCache {
  myJobs: FieldJobListItem[];
  jobHistory: FieldJobListItem[];
}

interface StoredOfflineSubmission extends OfflineSubmission {
  method: "post" | "patch";
  endpoint: string;
  body: unknown;
  serviceRequestId?: string;
}

interface BackendFieldJobListItem {
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

interface BackendExecutionTimelineItem {
  eventType: string;
  eventTitle: string;
  status: string;
  remarks: string;
  eventDateUtc: string;
}

interface BackendJobCardSummary {
  jobCardId: number;
  jobCardNumber: string;
}

interface BackendTechnicianJobDetail {
  serviceRequestId: number;
  serviceRequestNumber: string;
  lifecycleType: string;
  lifecycleLabel: string;
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
  checklistItems: BackendChecklistItem[];
  timeline: BackendExecutionTimelineItem[];
  allowedActions: string[];
}

interface BackendFieldJobReportResponse {
  jobReportId: number;
  issuesIdentified: string[];
  equipmentCondition: string;
  actionTaken: string;
  recommendation: string;
  observations: string;
  submittedAtUtc: string;
}

interface BackendFieldJobPhotoResponse {
  jobPhotoId: number;
  photoType: string;
  fileName: string;
  contentType: string;
  storageUrl: string;
  uploadedBy: string;
  uploadedAtUtc: string;
  photoRemarks: string;
}

interface BackendFieldCustomerSignatureResponse {
  customerSignatureId: number;
  customerName: string;
  signatureDataUrl: string;
  signedAtUtc: string;
  capturedBy: string;
  signatureRemarks: string;
}

interface BackendFieldPartsRequestItemResponse {
  partsRequestItemId: number;
  partCode: string;
  partName: string;
  quantityRequested: number;
  quantityApproved: number;
  currentStatus: string;
  itemRemarks: string;
}

interface BackendFieldPartsRequestResponse {
  partsRequestId: number;
  urgency: string;
  currentStatus: string;
  notes: string;
  submittedAtUtc: string;
  processedAtUtc?: string | null;
  items: BackendFieldPartsRequestItemResponse[];
}

interface BackendQuotationLineResponse {
  quotationLineId: number;
  lineType: string;
  lineDescription: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}

interface BackendQuotationDetailResponse {
  quotationId: number;
  quotationNumber: string;
  currentStatus: string;
  quotationDateUtc: string;
  subTotalAmount: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotalAmount: number;
  customerDecisionRemarks: string;
  lines: BackendQuotationLineResponse[];
}

interface BackendInvoiceLineResponse {
  invoiceLineId: number;
  lineType: string;
  lineDescription: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}

interface BackendPaymentReceiptResponse {
  receiptNumber: string;
}

interface BackendPaymentTransactionResponse {
  paymentTransactionId: number;
  paymentMethod: string;
  referenceNumber: string;
  paidAmount: number;
  paymentDateUtc: string;
  transactionRemarks: string;
  receipt?: BackendPaymentReceiptResponse | null;
}

interface BackendInvoiceDetailResponse {
  invoiceId: number;
  invoiceNumber: string;
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
  lines: BackendInvoiceLineResponse[];
}

interface BackendFieldJobDetailResponse {
  job: BackendTechnicianJobDetail;
  customerLatitude?: number | null;
  customerLongitude?: number | null;
  latestReport?: BackendFieldJobReportResponse | null;
  photos: BackendFieldJobPhotoResponse[];
  signature?: BackendFieldCustomerSignatureResponse | null;
  partsRequests: BackendFieldPartsRequestResponse[];
  quotation?: BackendQuotationDetailResponse | null;
  invoice?: BackendInvoiceDetailResponse | null;
  payments: BackendPaymentTransactionResponse[];
}

interface BackendFieldArrivalValidationResponse {
  overrideRequired: boolean;
  distanceMeters: number;
  message: string;
  job?: BackendFieldJobDetailResponse | null;
}

interface BackendAttendanceResponse {
  technicianAttendanceId?: number;
  helperAttendanceId?: number;
  attendanceDate: string;
  attendanceStatus: string;
  checkInOnUtc?: string | null;
  checkOutOnUtc?: string | null;
  locationText: string;
}

interface BackendHelperAssignmentResponse {
  assignmentStatus: string;
  technicianId?: number | null;
  technicianName?: string | null;
  serviceRequestId?: number | null;
  serviceRequestNumber?: string | null;
  jobCardId?: number | null;
  jobCardNumber?: string | null;
  customerName?: string | null;
  serviceName?: string | null;
  addressSummary?: string | null;
  assignmentRemarks: string;
  assignedOnUtc?: string | null;
  releasedOnUtc?: string | null;
}

interface BackendHelperTaskResponse {
  helperTaskChecklistId: number;
  taskName: string;
  taskDescription: string;
  mandatoryFlag: boolean;
  sortOrder: number;
  responseStatus: string;
  responseRemarks: string;
  responsePhotoUrl: string;
  respondedOnUtc?: string | null;
}

const EMPTY_JOB_LIST_CACHE: FieldJobListCache = {
  myJobs: [],
  jobHistory: [],
};

const FIELD_ROLES = new Set<UserRole>([UserRole.TECHNICIAN, UserRole.HELPER]);

const isOnline = () => typeof navigator === "undefined" || navigator.onLine;

const normalizeStatusKey = (status?: string | null) => (status ?? "").replace(/[\s_-]/g, "").toLowerCase();

const toFieldStatus = (status?: string | null): FieldJobStatus => {
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
    default:
      return "cancelled";
  }
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `field-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const readEnvelopeData = <T>(payload: unknown): T | undefined => {
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    return undefined;
  }

  return (payload as { data?: T }).data;
};

const readJobCache = () =>
  LocalStorage.get<Record<string, FieldJobDetail>>(StorageKey.FIELD_JOB_CACHE) ?? {};

const writeJobCache = (cache: Record<string, FieldJobDetail>) => {
  LocalStorage.set(StorageKey.FIELD_JOB_CACHE, cache);
};

const saveJobCacheEntry = (detail: FieldJobDetail) => {
  const cache = readJobCache();
  cache[detail.id] = detail;
  writeJobCache(cache);
};

const getCachedJobDetail = (serviceRequestId: string) => readJobCache()[serviceRequestId] ?? null;

const mutateCachedJobDetail = (
  serviceRequestId: string,
  updater: (detail: FieldJobDetail) => FieldJobDetail,
) => {
  const existing = getCachedJobDetail(serviceRequestId);
  if (!existing) {
    return null;
  }

  const updated = updater(existing);
  saveJobCacheEntry(updated);
  updateJobListStatus(updated.id, updated.status, updated.currentStatus);
  return updated;
};

const readJobListCache = () =>
  LocalStorage.get<FieldJobListCache>(StorageKey.FIELD_JOB_LIST_CACHE) ?? EMPTY_JOB_LIST_CACHE;

const writeJobListCache = (cache: FieldJobListCache) => {
  LocalStorage.set(StorageKey.FIELD_JOB_LIST_CACHE, cache);
};

const saveMyJobsCache = (jobs: FieldJobListItem[]) => {
  const cache = readJobListCache();
  writeJobListCache({ ...cache, myJobs: jobs });
};

const saveJobHistoryCache = (jobs: FieldJobListItem[]) => {
  const cache = readJobListCache();
  writeJobListCache({ ...cache, jobHistory: jobs });
};

const updateJobListStatus = (serviceRequestId: string, status: FieldJobStatus, currentStatus: string) => {
  const cache = readJobListCache();
  const updateItem = (item: FieldJobListItem) =>
    item.id === serviceRequestId
      ? {
          ...item,
          status,
          currentStatus,
        }
      : item;

  writeJobListCache({
    myJobs: cache.myJobs.map(updateItem),
    jobHistory: cache.jobHistory.map(updateItem),
  });
};

const readOfflineQueue = () =>
  LocalStorage.get<StoredOfflineSubmission[]>(StorageKey.FIELD_OFFLINE_QUEUE) ?? [];

const writeOfflineQueue = (queue: StoredOfflineSubmission[]) => {
  LocalStorage.set(StorageKey.FIELD_OFFLINE_QUEUE, queue);
};

const addOfflineSubmission = (submission: StoredOfflineSubmission) => {
  const queue = readOfflineQueue();
  writeOfflineQueue([submission, ...queue]);
  return submission;
};

const saveTechnicianAttendance = (attendance: FieldAttendanceRecord) => {
  LocalStorage.set(StorageKey.FIELD_TECHNICIAN_ATTENDANCE, attendance);
};

const readTechnicianAttendance = () =>
  LocalStorage.get<FieldAttendanceRecord>(StorageKey.FIELD_TECHNICIAN_ATTENDANCE);

const saveHelperAttendance = (attendance: FieldAttendanceRecord[]) => {
  LocalStorage.set(StorageKey.FIELD_HELPER_ATTENDANCE, attendance);
};

const readHelperAttendance = () =>
  LocalStorage.get<FieldAttendanceRecord[]>(StorageKey.FIELD_HELPER_ATTENDANCE) ?? [];

const saveHelperAssignment = (helperJob: HelperJobView) => {
  LocalStorage.set(StorageKey.FIELD_HELPER_ASSIGNMENT, helperJob);
};

const readHelperAssignment = () =>
  LocalStorage.get<HelperJobView>(StorageKey.FIELD_HELPER_ASSIGNMENT);

const sortJobs = (jobs: FieldJobListItem[]) =>
  [...jobs].sort((left, right) => {
    const leftTime = new Date(`${left.slotDate}T00:00:00Z`).getTime();
    const rightTime = new Date(`${right.slotDate}T00:00:00Z`).getTime();
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.slotLabel.localeCompare(right.slotLabel);
  });

const mapJobListItem = (item: BackendFieldJobListItem): FieldJobListItem => ({
  id: String(item.serviceRequestId),
  serviceRequestNumber: item.serviceRequestNumber,
  jobCardNumber: item.jobCardNumber ?? undefined,
  lifecycleType: item.lifecycleType,
  lifecycleLabel: item.lifecycleLabel,
  bookingReference: item.bookingReference,
  customerName: item.customerName,
  mobileNumber: item.mobileNumber,
  addressSummary: item.addressSummary,
  serviceName: item.serviceName,
  currentStatus: item.currentStatus,
  status: toFieldStatus(item.currentStatus),
  slotDate: item.slotDate,
  slotLabel: item.slotLabel,
});

const mapJobReport = (report?: BackendFieldJobReportResponse | null): FieldJobReport | undefined =>
  report
    ? {
        id: String(report.jobReportId),
        issuesIdentified: report.issuesIdentified,
        equipmentCondition: report.equipmentCondition,
        actionTaken: report.actionTaken,
        recommendation: report.recommendation,
        observations: report.observations,
        submittedAtUtc: report.submittedAtUtc,
      }
    : undefined;

const mapJobPhoto = (photo: BackendFieldJobPhotoResponse): FieldJobPhoto => ({
  id: String(photo.jobPhotoId),
  photoType: photo.photoType,
  fileName: photo.fileName,
  contentType: photo.contentType,
  storageUrl: photo.storageUrl,
  uploadedBy: photo.uploadedBy,
  uploadedAtUtc: photo.uploadedAtUtc,
  photoRemarks: photo.photoRemarks,
});

const mapSignature = (
  signature?: BackendFieldCustomerSignatureResponse | null,
): FieldCustomerSignature | undefined =>
  signature
    ? {
        id: String(signature.customerSignatureId),
        customerName: signature.customerName,
        signatureDataUrl: signature.signatureDataUrl,
        signedAtUtc: signature.signedAtUtc,
        capturedBy: signature.capturedBy,
        remarks: signature.signatureRemarks,
      }
    : undefined;

const mapPartsRequest = (request: BackendFieldPartsRequestResponse): FieldPartsRequest => ({
  id: String(request.partsRequestId),
  urgency: request.urgency,
  currentStatus: request.currentStatus,
  notes: request.notes,
  submittedAtUtc: request.submittedAtUtc,
  processedAtUtc: request.processedAtUtc ?? undefined,
  items: request.items.map((item) => ({
    id: String(item.partsRequestItemId),
    partCode: item.partCode,
    partName: item.partName,
    quantityRequested: item.quantityRequested,
    quantityApproved: item.quantityApproved,
    currentStatus: item.currentStatus,
    remarks: item.itemRemarks,
  })),
});

const mapQuotation = (quotation?: BackendQuotationDetailResponse | null): FieldQuotation | undefined =>
  quotation
    ? {
        id: String(quotation.quotationId),
        quotationNumber: quotation.quotationNumber,
        currentStatus: quotation.currentStatus,
        quotationDateUtc: quotation.quotationDateUtc,
        subTotalAmount: quotation.subTotalAmount,
        discountAmount: quotation.discountAmount,
        taxPercentage: quotation.taxPercentage,
        taxAmount: quotation.taxAmount,
        grandTotalAmount: quotation.grandTotalAmount,
        customerDecisionRemarks: quotation.customerDecisionRemarks,
        lines: quotation.lines.map((line) => ({
          id: String(line.quotationLineId),
          lineType: line.lineType,
          lineDescription: line.lineDescription,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineAmount: line.lineAmount,
        })),
      }
    : undefined;

const mapInvoice = (invoice?: BackendInvoiceDetailResponse | null): FieldInvoice | undefined =>
  invoice
    ? {
        id: String(invoice.invoiceId),
        invoiceNumber: invoice.invoiceNumber,
        currentStatus: invoice.currentStatus,
        invoiceDateUtc: invoice.invoiceDateUtc,
        subTotalAmount: invoice.subTotalAmount,
        discountAmount: invoice.discountAmount,
        taxPercentage: invoice.taxPercentage,
        taxAmount: invoice.taxAmount,
        grandTotalAmount: invoice.grandTotalAmount,
        paidAmount: invoice.paidAmount,
        balanceAmount: invoice.balanceAmount,
        lastPaymentDateUtc: invoice.lastPaymentDateUtc ?? undefined,
        lines: invoice.lines.map((line) => ({
          id: String(line.invoiceLineId),
          lineType: line.lineType,
          lineDescription: line.lineDescription,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineAmount: line.lineAmount,
        })),
      }
    : undefined;

const mapPayment = (payment: BackendPaymentTransactionResponse): FieldPayment => ({
  id: String(payment.paymentTransactionId),
  paymentMethod: payment.paymentMethod,
  referenceNumber: payment.referenceNumber,
  paidAmount: payment.paidAmount,
  paymentDateUtc: payment.paymentDateUtc,
  transactionRemarks: payment.transactionRemarks,
  receiptNumber: payment.receipt?.receiptNumber ?? undefined,
});

const mapFieldJobDetail = (response: BackendFieldJobDetailResponse): FieldJobDetail => {
  const detail = {
    id: String(response.job.serviceRequestId),
    serviceRequestNumber: response.job.serviceRequestNumber,
    jobCardId: response.job.jobCard?.jobCardId ? String(response.job.jobCard.jobCardId) : undefined,
    jobCardNumber: response.job.jobCard?.jobCardNumber ?? undefined,
    lifecycleType: response.job.lifecycleType,
    lifecycleLabel: response.job.lifecycleLabel,
    bookingReference: response.job.bookingReference,
    currentStatus: response.job.currentStatus,
    status: toFieldStatus(response.job.currentStatus),
    customerName: response.job.customerName,
    mobileNumber: response.job.mobileNumber,
    addressSummary: response.job.addressSummary,
    zoneName: response.job.zoneName,
    serviceName: response.job.serviceName,
    acTypeName: response.job.acTypeName,
    tonnageName: response.job.tonnageName,
    brandName: response.job.brandName,
    modelName: response.job.modelName,
    issueNotes: response.job.issueNotes,
    slotDate: response.job.slotDate,
    slotLabel: response.job.slotLabel,
    assignmentRemarks: response.job.assignmentRemarks ?? undefined,
    customerLatitude: response.customerLatitude ?? undefined,
    customerLongitude: response.customerLongitude ?? undefined,
    allowedActions: response.job.allowedActions,
    checklist: response.job.checklistItems.map((item) => ({
      id: String(item.serviceChecklistMasterId),
      title: item.checklistTitle,
      description: item.checklistDescription,
      isMandatory: item.isMandatory,
      isChecked: Boolean(item.isChecked),
      responseRemarks: item.responseRemarks,
      responseDateUtc: item.responseDateUtc ?? undefined,
    })),
    timeline: response.job.timeline.map((item) => ({
      eventType: item.eventType,
      eventTitle: item.eventTitle,
      status: item.status,
      remarks: item.remarks,
      eventDateUtc: item.eventDateUtc,
    })),
    latestReport: mapJobReport(response.latestReport),
    photos: response.photos.map(mapJobPhoto),
    signature: mapSignature(response.signature),
    partsRequests: response.partsRequests.map(mapPartsRequest),
    quotation: mapQuotation(response.quotation),
    invoice: mapInvoice(response.invoice),
    payments: response.payments.map(mapPayment),
  } satisfies FieldJobDetail;

  saveJobCacheEntry(detail);
  return detail;
};

const mapArrivalResponse = (response: BackendFieldArrivalValidationResponse): FieldArrivalResponse => ({
  overrideRequired: response.overrideRequired,
  distanceMeters: response.distanceMeters,
  message: response.message,
  job: response.job ? mapFieldJobDetail(response.job) : undefined,
});

const mapAttendanceRecord = (response: BackendAttendanceResponse): FieldAttendanceRecord => ({
  id: String(response.technicianAttendanceId ?? response.helperAttendanceId ?? generateId()),
  attendanceDate: response.attendanceDate,
  attendanceStatus: response.attendanceStatus,
  checkInOnUtc: response.checkInOnUtc ?? undefined,
  checkOutOnUtc: response.checkOutOnUtc ?? undefined,
  locationText: response.locationText,
});

const mapHelperTask = (task: BackendHelperTaskResponse): HelperTask => ({
  id: String(task.helperTaskChecklistId),
  taskName: task.taskName,
  taskDescription: task.taskDescription,
  mandatoryFlag: task.mandatoryFlag,
  sortOrder: task.sortOrder,
  responseStatus: task.responseStatus,
  responseRemarks: task.responseRemarks,
  responsePhotoUrl: task.responsePhotoUrl,
  respondedOnUtc: task.respondedOnUtc ?? undefined,
});

const createOptimisticAttendance = (locationText?: string): FieldAttendanceRecord => ({
  id: generateId(),
  attendanceDate: new Date().toISOString().slice(0, 10),
  attendanceStatus: "Present",
  checkInOnUtc: new Date().toISOString(),
  locationText: locationText?.trim() || "Queued while offline",
});

const createOptimisticPhoto = (payload: FieldPhotoPayload): FieldJobPhoto => ({
  id: generateId(),
  photoType: payload.photoType,
  fileName: payload.fileName,
  contentType: payload.contentType,
  storageUrl: payload.base64Content,
  uploadedBy: useAuthStore.getState().user?.name ?? "Offline Queue",
  uploadedAtUtc: new Date().toISOString(),
  photoRemarks: payload.remarks?.trim() ?? "",
});

const getCurrentRole = () => useAuthStore.getState().user?.role;

const isFieldRole = () => {
  const role = getCurrentRole();
  return Boolean(role && FIELD_ROLES.has(role));
};

const ensureHelperProfileId = () => {
  const helperProfileId = useAuthStore.getState().user?.helperProfileId;
  if (!helperProfileId) {
    throw new Error("Helper profile is not available for the current session.");
  }

  return helperProfileId;
};

const buildOfflineSubmission = (params: {
  type: OfflineSubmissionType;
  method: "post" | "patch";
  endpoint: string;
  body: unknown;
  serviceRequestId?: string;
  data: unknown;
}): StoredOfflineSubmission => ({
  id: generateId(),
  type: params.type,
  method: params.method,
  endpoint: params.endpoint,
  body: params.body,
  serviceRequestId: params.serviceRequestId,
  timestamp: new Date().toISOString(),
  status: "pending",
  data: params.data,
  retryCount: 0,
});

export interface FieldWorkflowRepository {
  getMyJobs(): Promise<FieldJobListItem[]>;
  getJobHistory(): Promise<FieldJobListItem[]>;
  getJobDetail(serviceRequestId: string): Promise<FieldJobDetail | null>;
  depart(serviceRequestId: string, payload: { remarks?: string; latitude?: number; longitude?: number }): Promise<FieldJobDetail | null>;
  arrive(
    serviceRequestId: string,
    payload: { remarks?: string; latitude: number; longitude: number; overrideReason?: string },
  ): Promise<FieldArrivalResponse>;
  startWork(serviceRequestId: string, remarks?: string): Promise<FieldJobDetail | null>;
  saveProgress(serviceRequestId: string, payload: FieldProgressPayload): Promise<FieldJobDetail | null>;
  createPartsRequest(serviceRequestId: string, payload: FieldPartsRequestPayload): Promise<FieldPartsRequest | null>;
  createEstimate(serviceRequestId: string, payload: FieldEstimatePayload): Promise<FieldQuotation | null>;
  submitReport(serviceRequestId: string, payload: FieldReportPayload): Promise<FieldJobReport | null>;
  uploadPhoto(serviceRequestId: string, payload: FieldPhotoPayload): Promise<FieldJobPhoto | null>;
  saveSignature(serviceRequestId: string, payload: FieldSignaturePayload): Promise<FieldCustomerSignature | null>;
  collectPayment(serviceRequestId: string, payload: FieldPaymentPayload): Promise<FieldPayment | null>;
  complete(serviceRequestId: string, remarks?: string): Promise<FieldJobDetail | null>;
  checkIn(locationText?: string, latitude?: number, longitude?: number): Promise<FieldAttendanceRecord>;
  checkOut(locationText?: string, latitude?: number, longitude?: number): Promise<FieldAttendanceRecord>;
  getCachedAttendance(): FieldAttendanceRecord | null;
  getOfflineQueue(): Promise<OfflineSubmission[]>;
  syncSubmission(id: string): Promise<void>;
  getHelperJobView(serviceRequestId?: string): Promise<HelperJobView | null>;
  checkInHelper(locationText?: string): Promise<FieldAttendanceRecord>;
  checkOutHelper(locationText?: string): Promise<FieldAttendanceRecord>;
  saveHelperTaskResponse(taskId: string, responseStatus: string, responseRemarks?: string): Promise<HelperTask[]>;
  uploadHelperTaskPhoto(
    taskId: string,
    payload: { fileName: string; contentType: string; base64Content: string; responseRemarks?: string },
  ): Promise<HelperTask[]>;
}

class LiveFieldWorkflowRepository implements FieldWorkflowRepository {
  private async executeMutation<T>(params: {
    type: OfflineSubmissionType;
    method: "post" | "patch";
    endpoint: string;
    body: unknown;
    serviceRequestId?: string;
    data: unknown;
    optimistic?: () => T | null;
    onSuccess?: (payload: unknown) => T | null;
  }): Promise<T | null> {
    if (!isOnline()) {
      addOfflineSubmission(buildOfflineSubmission(params));
      return params.optimistic ? params.optimistic() : null;
    }

    try {
      const response = await apiClient.request({
        method: params.method,
        url: params.endpoint,
        data: params.body,
      });

      return params.onSuccess ? params.onSuccess(response.data) : null;
    } catch (error) {
      if (axios.isAxiosError(error) && !error.response && !isOnline()) {
        addOfflineSubmission(buildOfflineSubmission(params));
        return params.optimistic ? params.optimistic() : null;
      }

      throw error;
    }
  }

  async getMyJobs() {
    try {
      const response = await apiClient.get<BackendFieldJobListItem[]>("/api/field/my-jobs");
      const jobs = sortJobs(response.data.map(mapJobListItem));
      saveMyJobsCache(jobs);
      return jobs;
    } catch (error) {
      if (axios.isAxiosError(error) && !isOnline()) {
        return readJobListCache().myJobs;
      }

      throw error;
    }
  }

  async getJobHistory() {
    try {
      const response = await apiClient.get<BackendFieldJobListItem[]>("/api/field/job-history");
      const jobs = sortJobs(response.data.map(mapJobListItem));
      saveJobHistoryCache(jobs);
      return jobs;
    } catch (error) {
      if (axios.isAxiosError(error) && !isOnline()) {
        return readJobListCache().jobHistory;
      }

      throw error;
    }
  }

  async getJobDetail(serviceRequestId: string) {
    try {
      const response = await apiClient.get<BackendFieldJobDetailResponse>(`/api/field/jobs/${serviceRequestId}`);
      return mapFieldJobDetail(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && !isOnline()) {
        return getCachedJobDetail(serviceRequestId);
      }

      throw error;
    }
  }

  async depart(serviceRequestId: string, payload: { remarks?: string; latitude?: number; longitude?: number }) {
    return this.executeMutation<FieldJobDetail>({
      type: "field_depart",
      method: "patch",
      endpoint: `/api/field/jobs/${serviceRequestId}/depart`,
      body: {
        latitude: payload.latitude,
        longitude: payload.longitude,
        remarks: payload.remarks,
      },
      serviceRequestId,
      data: {
        serviceRequestId,
        remarks: payload.remarks ?? "",
      },
      optimistic: () =>
        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          currentStatus: "EnRoute",
          status: "en-route",
        })),
      onSuccess: (body) => mapFieldJobDetail(body as BackendFieldJobDetailResponse),
    });
  }

  async arrive(
    serviceRequestId: string,
    payload: { remarks?: string; latitude: number; longitude: number; overrideReason?: string },
  ) {
    if (!isOnline()) {
      const optimisticJob = mutateCachedJobDetail(serviceRequestId, (detail) => ({
        ...detail,
        currentStatus: "Reached",
        status: "arrived",
      }));
      addOfflineSubmission(
        buildOfflineSubmission({
          type: "field_arrive",
          method: "patch",
          endpoint: `/api/field/jobs/${serviceRequestId}/arrive`,
          body: {
            latitude: payload.latitude,
            longitude: payload.longitude,
            remarks: payload.remarks,
            overrideReason: payload.overrideReason,
          },
          serviceRequestId,
          data: {
            serviceRequestId,
            remarks: payload.remarks ?? "",
          },
        }),
      );

      return {
        overrideRequired: false,
        distanceMeters: 0,
        message: "Arrival queued for sync.",
        job: optimisticJob,
        queued: true,
      } satisfies FieldArrivalResponse;
    }

    try {
      const response = await apiClient.patch<BackendFieldArrivalValidationResponse>(
        `/api/field/jobs/${serviceRequestId}/arrive`,
        {
          latitude: payload.latitude,
          longitude: payload.longitude,
          remarks: payload.remarks,
          overrideReason: payload.overrideReason,
        },
      );

      return mapArrivalResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const payloadData = readEnvelopeData<BackendFieldArrivalValidationResponse>(error.response.data);
        if (payloadData) {
          return mapArrivalResponse(payloadData);
        }
      }

      throw error;
    }
  }

  async startWork(serviceRequestId: string, remarks?: string) {
    return this.executeMutation<FieldJobDetail>({
      type: "field_start_work",
      method: "patch",
      endpoint: `/api/field/jobs/${serviceRequestId}/start-work`,
      body: {
        remarks,
      },
      serviceRequestId,
      data: {
        serviceRequestId,
        remarks: remarks ?? "",
      },
      optimistic: () =>
        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          currentStatus: "WorkStarted",
          status: "in-progress",
        })),
      onSuccess: (body) => mapFieldJobDetail(body as BackendFieldJobDetailResponse),
    });
  }

  async saveProgress(serviceRequestId: string, payload: FieldProgressPayload) {
    return this.executeMutation<FieldJobDetail>({
      type: "field_progress",
      method: "patch",
      endpoint: `/api/field/jobs/${serviceRequestId}/progress`,
      body: payload,
      serviceRequestId,
      data: {
        serviceRequestId,
        items: payload.items.length,
      },
      optimistic: () =>
        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          checklist: detail.checklist.map((item) => {
            const updated = payload.items.find(
              (entry) => String(entry.serviceChecklistMasterId) === item.id,
            );
            if (!updated) {
              return item;
            }

            return {
              ...item,
              isChecked: Boolean(updated.isChecked),
              responseRemarks: updated.responseRemarks ?? item.responseRemarks,
              responseDateUtc: new Date().toISOString(),
            };
          }),
        })),
      onSuccess: (body) => mapFieldJobDetail(body as BackendFieldJobDetailResponse),
    });
  }

  async createPartsRequest(serviceRequestId: string, payload: FieldPartsRequestPayload) {
    return this.executeMutation<FieldPartsRequest>({
      type: "part_request",
      method: "post",
      endpoint: `/api/field/jobs/${serviceRequestId}/parts-request`,
      body: payload,
      serviceRequestId,
      data: {
        serviceRequestId,
        items: payload.items.length,
        urgency: payload.urgency,
      },
      optimistic: () => {
        const optimistic = {
          id: generateId(),
          urgency: payload.urgency,
          currentStatus: "Pending",
          notes: payload.notes?.trim() ?? "",
          submittedAtUtc: new Date().toISOString(),
          items: payload.items.map((item) => ({
            id: generateId(),
            partCode: item.partCode,
            partName: item.partName,
            quantityRequested: item.quantityRequested,
            quantityApproved: 0,
            currentStatus: "Pending",
            remarks: item.remarks?.trim() ?? "",
          })),
        } satisfies FieldPartsRequest;

        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          partsRequests: [optimistic, ...detail.partsRequests],
        }));

        return optimistic;
      },
      onSuccess: (body) => {
        const mapped = mapPartsRequest(body as BackendFieldPartsRequestResponse);
        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          partsRequests: [mapped, ...detail.partsRequests.filter((item) => item.id !== mapped.id)],
        }));
        return mapped;
      },
    });
  }

  async createEstimate(serviceRequestId: string, payload: FieldEstimatePayload) {
    return this.executeMutation<FieldQuotation>({
      type: "estimate",
      method: "post",
      endpoint: `/api/field/jobs/${serviceRequestId}/estimate`,
      body: payload,
      serviceRequestId,
      data: {
        serviceRequestId,
        lines: payload.lines.length,
      },
      optimistic: () => {
        const subTotalAmount = payload.lines.reduce(
          (total, line) => total + line.quantity * line.unitPrice,
          0,
        );
        const taxAmount = ((subTotalAmount - payload.discountAmount) * payload.taxPercentage) / 100;
        const optimistic = {
          id: generateId(),
          quotationNumber: "Queued",
          currentStatus: "PendingCustomerApproval",
          quotationDateUtc: new Date().toISOString(),
          subTotalAmount,
          discountAmount: payload.discountAmount,
          taxPercentage: payload.taxPercentage,
          taxAmount,
          grandTotalAmount: subTotalAmount - payload.discountAmount + taxAmount,
          customerDecisionRemarks: payload.remarks?.trim() ?? "",
          lines: payload.lines.map((line) => ({
            id: generateId(),
            lineType: line.lineType,
            lineDescription: line.lineDescription,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineAmount: line.quantity * line.unitPrice,
          })),
        } satisfies FieldQuotation;

        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          quotation: optimistic,
        }));

        return optimistic;
      },
      onSuccess: (body) => {
        const mapped = mapQuotation(body as BackendQuotationDetailResponse);
        if (!mapped) {
          return null;
        }

        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          quotation: mapped,
        }));
        return mapped;
      },
    });
  }

  async submitReport(serviceRequestId: string, payload: FieldReportPayload) {
    const idempotencyKey = generateId();
    return this.executeMutation<FieldJobReport>({
      type: "job_report",
      method: "post",
      endpoint: `/api/field/jobs/${serviceRequestId}/report`,
      body: {
        ...payload,
        idempotencyKey,
      },
      serviceRequestId,
      data: {
        serviceRequestId,
        actionTaken: payload.actionTaken,
      },
      optimistic: () => {
        const optimistic = {
          id: generateId(),
          issuesIdentified: payload.issuesIdentified,
          equipmentCondition: payload.equipmentCondition,
          actionTaken: payload.actionTaken,
          recommendation: payload.recommendation?.trim() ?? "",
          observations: payload.observations?.trim() ?? "",
          submittedAtUtc: new Date().toISOString(),
        } satisfies FieldJobReport;

        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          latestReport: optimistic,
        }));

        return optimistic;
      },
      onSuccess: (body) => {
        const mapped = mapJobReport(body as BackendFieldJobReportResponse);
        if (!mapped) {
          return null;
        }

        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          latestReport: mapped,
        }));
        return mapped;
      },
    });
  }

  async uploadPhoto(serviceRequestId: string, payload: FieldPhotoPayload) {
    return this.executeMutation<FieldJobPhoto>({
      type: "job_photo",
      method: "post",
      endpoint: `/api/field/jobs/${serviceRequestId}/photos`,
      body: payload,
      serviceRequestId,
      data: {
        serviceRequestId,
        fileName: payload.fileName,
      },
      optimistic: () => {
        const optimistic = createOptimisticPhoto(payload);
        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          photos: [optimistic, ...detail.photos],
        }));
        return optimistic;
      },
      onSuccess: (body) => {
        const mapped = mapJobPhoto(body as BackendFieldJobPhotoResponse);
        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          photos: [mapped, ...detail.photos.filter((photo) => photo.id !== mapped.id)],
        }));
        return mapped;
      },
    });
  }

  async saveSignature(serviceRequestId: string, payload: FieldSignaturePayload) {
    return this.executeMutation<FieldCustomerSignature>({
      type: "job_signature",
      method: "post",
      endpoint: `/api/field/jobs/${serviceRequestId}/signature`,
      body: payload,
      serviceRequestId,
      data: {
        serviceRequestId,
        customerName: payload.customerName,
      },
      optimistic: () => {
        const optimistic = {
          id: generateId(),
          customerName: payload.customerName,
          signatureDataUrl: payload.signatureBase64,
          signedAtUtc: new Date().toISOString(),
          capturedBy: useAuthStore.getState().user?.name ?? "Offline Queue",
          remarks: payload.remarks?.trim() ?? "",
        } satisfies FieldCustomerSignature;

        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          signature: optimistic,
        }));

        return optimistic;
      },
      onSuccess: (body) => {
        const mapped = mapSignature(body as BackendFieldCustomerSignatureResponse);
        if (!mapped) {
          return null;
        }

        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          signature: mapped,
        }));
        return mapped;
      },
    });
  }

  async collectPayment(serviceRequestId: string, payload: FieldPaymentPayload) {
    const idempotencyKey = generateId();
    return this.executeMutation<FieldPayment>({
      type: "job_payment",
      method: "patch",
      endpoint: `/api/field/jobs/${serviceRequestId}/payment`,
      body: {
        ...payload,
        idempotencyKey,
      },
      serviceRequestId,
      data: {
        serviceRequestId,
        amount: payload.paidAmount,
      },
      optimistic: () => {
        const optimistic = {
          id: generateId(),
          paymentMethod: payload.paymentMethod,
          referenceNumber: payload.referenceNumber?.trim() ?? "",
          paidAmount: payload.paidAmount,
          paymentDateUtc: new Date().toISOString(),
          transactionRemarks: payload.remarks?.trim() ?? "",
          receiptNumber: "Queued",
        } satisfies FieldPayment;

        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          payments: [optimistic, ...detail.payments],
          invoice: detail.invoice
            ? {
                ...detail.invoice,
                paidAmount: detail.invoice.paidAmount + payload.paidAmount,
                balanceAmount: Math.max(0, detail.invoice.balanceAmount - payload.paidAmount),
              }
            : detail.invoice,
        }));

        return optimistic;
      },
      onSuccess: (body) => {
        const mapped = mapPayment(body as BackendPaymentTransactionResponse);
        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          payments: [mapped, ...detail.payments.filter((payment) => payment.id !== mapped.id)],
        }));
        return mapped;
      },
    });
  }

  async complete(serviceRequestId: string, remarks?: string) {
    return this.executeMutation<FieldJobDetail>({
      type: "job_complete",
      method: "patch",
      endpoint: `/api/field/jobs/${serviceRequestId}/complete`,
      body: {
        remarks,
      },
      serviceRequestId,
      data: {
        serviceRequestId,
      },
      optimistic: () =>
        mutateCachedJobDetail(serviceRequestId, (detail) => ({
          ...detail,
          currentStatus: "SubmittedForClosure",
          status: "completed",
        })),
      onSuccess: (body) => mapFieldJobDetail(body as BackendFieldJobDetailResponse),
    });
  }

  async checkIn(locationText?: string, latitude?: number, longitude?: number) {
    const optimistic = createOptimisticAttendance(locationText);
    const result = await this.executeMutation<FieldAttendanceRecord>({
      type: "attendance_check_in",
      method: "post",
      endpoint: "/api/field/attendance/check-in",
      body: {
        locationText,
        latitude,
        longitude,
      },
      data: {
        locationText: locationText ?? "",
      },
      optimistic: () => {
        saveTechnicianAttendance(optimistic);
        return optimistic;
      },
      onSuccess: (body) => {
        const mapped = mapAttendanceRecord(body as BackendAttendanceResponse);
        saveTechnicianAttendance(mapped);
        return mapped;
      },
    });

    return result ?? optimistic;
  }

  async checkOut(locationText?: string, latitude?: number, longitude?: number) {
    const cached = readTechnicianAttendance() ?? createOptimisticAttendance(locationText);
    const optimistic = {
      ...cached,
      checkOutOnUtc: new Date().toISOString(),
      locationText: locationText?.trim() || cached.locationText,
    } satisfies FieldAttendanceRecord;

    const result = await this.executeMutation<FieldAttendanceRecord>({
      type: "attendance_check_out",
      method: "post",
      endpoint: "/api/field/attendance/check-out",
      body: {
        locationText,
        latitude,
        longitude,
      },
      data: {
        locationText: locationText ?? "",
      },
      optimistic: () => {
        saveTechnicianAttendance(optimistic);
        return optimistic;
      },
      onSuccess: (body) => {
        const mapped = mapAttendanceRecord(body as BackendAttendanceResponse);
        saveTechnicianAttendance(mapped);
        return mapped;
      },
    });

    return result ?? optimistic;
  }

  getCachedAttendance() {
    return readTechnicianAttendance() ?? null;
  }

  async getOfflineQueue() {
    return readOfflineQueue();
  }

  async syncSubmission(id: string) {
    const queue = readOfflineQueue();
    const current = queue.find((item) => item.id === id);
    if (!current) {
      return;
    }

    writeOfflineQueue(
      queue.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "syncing",
            }
          : item,
      ),
    );

    try {
      await apiClient.request({
        method: current.method,
        url: current.endpoint,
        data: current.body,
      });

      if (current.serviceRequestId) {
        await this.getJobDetail(current.serviceRequestId);
      }

      writeOfflineQueue(readOfflineQueue().filter((item) => item.id !== id));
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && (error.response?.status === 409 || error.response?.status === 422)
          ? "Conflict detected. Open the job again to resolve the latest field status."
          : axios.isAxiosError(error) && typeof error.response?.data?.message === "string"
            ? error.response.data.message
            : "Sync failed. Retry once the field job is back in a valid state.";

      writeOfflineQueue(
        readOfflineQueue().map((item) =>
          item.id === id
            ? {
                ...item,
                status: "failed",
                retryCount: item.retryCount + 1,
                errorMessage,
              }
            : item,
        ),
      );

      throw error;
    }
  }

  async getHelperJobView(serviceRequestId?: string) {
    const helperProfileId = ensureHelperProfileId();
    try {
      const [assignmentResponse, tasksResponse, attendanceResponse] = await Promise.all([
        apiClient.get<BackendHelperAssignmentResponse>(`/api/helpers/${helperProfileId}/assignment`),
        apiClient.get<BackendHelperTaskResponse[]>(`/api/helpers/${helperProfileId}/tasks`),
        apiClient.get<BackendAttendanceResponse[]>(`/api/helpers/${helperProfileId}/attendance`),
      ]);

      const helperView = {
        helperProfileId,
        assignmentStatus: assignmentResponse.data.assignmentStatus,
        technicianId: assignmentResponse.data.technicianId ? String(assignmentResponse.data.technicianId) : undefined,
        technicianName: assignmentResponse.data.technicianName ?? undefined,
        serviceRequestId: assignmentResponse.data.serviceRequestId
          ? String(assignmentResponse.data.serviceRequestId)
          : undefined,
        serviceRequestNumber: assignmentResponse.data.serviceRequestNumber ?? undefined,
        jobCardId: assignmentResponse.data.jobCardId ? String(assignmentResponse.data.jobCardId) : undefined,
        jobCardNumber: assignmentResponse.data.jobCardNumber ?? undefined,
        customerName: assignmentResponse.data.customerName ?? undefined,
        serviceName: assignmentResponse.data.serviceName ?? undefined,
        addressSummary: assignmentResponse.data.addressSummary ?? undefined,
        assignmentRemarks: assignmentResponse.data.assignmentRemarks ?? "",
        assignedOnUtc: assignmentResponse.data.assignedOnUtc ?? undefined,
        releasedOnUtc: assignmentResponse.data.releasedOnUtc ?? undefined,
        attendance: attendanceResponse.data.map(mapAttendanceRecord),
        tasks: tasksResponse.data.map(mapHelperTask).sort((left, right) => left.sortOrder - right.sortOrder),
      } satisfies HelperJobView;

      if (serviceRequestId && helperView.serviceRequestId && helperView.serviceRequestId !== serviceRequestId) {
        return helperView;
      }

      saveHelperAttendance(helperView.attendance);
      saveHelperAssignment(helperView);
      return helperView;
    } catch (error) {
      if (axios.isAxiosError(error) && !isOnline()) {
        return readHelperAssignment() ?? null;
      }

      throw error;
    }
  }

  async checkInHelper(locationText?: string) {
    const helperProfileId = ensureHelperProfileId();
    const optimistic = createOptimisticAttendance(locationText);
    const result = await this.executeMutation<FieldAttendanceRecord>({
      type: "helper_check_in",
      method: "post",
      endpoint: `/api/helpers/${helperProfileId}/attendance/check-in`,
      body: {
        locationText,
      },
      data: {
        helperProfileId,
      },
      optimistic: () => {
        saveHelperAttendance([optimistic, ...readHelperAttendance()]);
        return optimistic;
      },
      onSuccess: (body) => {
        const list = (body as BackendAttendanceResponse[]).map(mapAttendanceRecord);
        saveHelperAttendance(list);
        return list[0] ?? optimistic;
      },
    });

    return result ?? optimistic;
  }

  async checkOutHelper(locationText?: string) {
    const helperProfileId = ensureHelperProfileId();
    const existing = readHelperAttendance()[0] ?? createOptimisticAttendance(locationText);
    const optimistic = {
      ...existing,
      checkOutOnUtc: new Date().toISOString(),
      locationText: locationText?.trim() || existing.locationText,
    } satisfies FieldAttendanceRecord;

    const result = await this.executeMutation<FieldAttendanceRecord>({
      type: "helper_check_out",
      method: "post",
      endpoint: `/api/helpers/${helperProfileId}/attendance/check-out`,
      body: {
        locationText,
      },
      data: {
        helperProfileId,
      },
      optimistic: () => {
        const list = readHelperAttendance();
        saveHelperAttendance(list.length > 0 ? [optimistic, ...list.slice(1)] : [optimistic]);
        return optimistic;
      },
      onSuccess: (body) => {
        const list = (body as BackendAttendanceResponse[]).map(mapAttendanceRecord);
        saveHelperAttendance(list);
        return list[0] ?? optimistic;
      },
    });

    return result ?? optimistic;
  }

  async saveHelperTaskResponse(taskId: string, responseStatus: string, responseRemarks?: string) {
    const helperProfileId = ensureHelperProfileId();
    const result = await this.executeMutation<HelperTask[]>({
      type: "helper_task",
      method: "post",
      endpoint: `/api/helpers/${helperProfileId}/tasks/${taskId}/respond`,
      body: {
        responseStatus,
        responseRemarks,
      },
      data: {
        taskId,
      },
      optimistic: () => {
        const current = readHelperAssignment();
        if (!current) {
          return [];
        }

        const tasks = current.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                responseStatus,
                responseRemarks: responseRemarks?.trim() ?? "",
                respondedOnUtc: new Date().toISOString(),
              }
            : task,
        );
        saveHelperAssignment({ ...current, tasks });
        return tasks;
      },
      onSuccess: (body) => {
        const tasks = (body as BackendHelperTaskResponse[])
          .map(mapHelperTask)
          .sort((left, right) => left.sortOrder - right.sortOrder);
        const current = readHelperAssignment();
        if (current) {
          saveHelperAssignment({ ...current, tasks });
        }
        return tasks;
      },
    });

    return result ?? [];
  }

  async uploadHelperTaskPhoto(
    taskId: string,
    payload: { fileName: string; contentType: string; base64Content: string; responseRemarks?: string },
  ) {
    const helperProfileId = ensureHelperProfileId();
    const result = await this.executeMutation<HelperTask[]>({
      type: "helper_photo",
      method: "post",
      endpoint: `/api/helpers/${helperProfileId}/tasks/${taskId}/upload-photo`,
      body: payload,
      data: {
        taskId,
      },
      optimistic: () => {
        const current = readHelperAssignment();
        if (!current) {
          return [];
        }

        const tasks = current.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                responseStatus: task.responseStatus || "Completed",
                responseRemarks: payload.responseRemarks?.trim() ?? task.responseRemarks,
                responsePhotoUrl: payload.base64Content,
                respondedOnUtc: new Date().toISOString(),
              }
            : task,
        );
        saveHelperAssignment({ ...current, tasks });
        return tasks;
      },
      onSuccess: (body) => {
        const tasks = (body as BackendHelperTaskResponse[])
          .map(mapHelperTask)
          .sort((left, right) => left.sortOrder - right.sortOrder);
        const current = readHelperAssignment();
        if (current) {
          saveHelperAssignment({ ...current, tasks });
        }
        return tasks;
      },
    });

    return result ?? [];
  }
}

class MockFieldWorkflowRepository implements FieldWorkflowRepository {
  private readonly liveFallback = new LiveFieldWorkflowRepository();

  private myJobs: FieldJobListItem[] = [
    {
      id: "101",
      serviceRequestNumber: "SR-101",
      jobCardNumber: "JC-101",
      lifecycleType: "Today",
      lifecycleLabel: "Ready for visit",
      bookingReference: "BK-101",
      customerName: "Aarav Menon",
      mobileNumber: "9876543210",
      addressSummary: "18 Green Park, Anna Nagar, Chennai",
      serviceName: "Split AC Service",
      currentStatus: "Assigned",
      status: "assigned",
      slotDate: new Date().toISOString().slice(0, 10),
      slotLabel: "09:00 - 11:00",
    },
  ];

  private jobHistory: FieldJobListItem[] = [
    {
      id: "82",
      serviceRequestNumber: "SR-082",
      jobCardNumber: "JC-082",
      lifecycleType: "Completed",
      lifecycleLabel: "Submitted for closure",
      bookingReference: "BK-082",
      customerName: "Karan Shah",
      mobileNumber: "9123456789",
      addressSummary: "9 Lake View Road, Adyar, Chennai",
      serviceName: "AC Repair",
      currentStatus: "SubmittedForClosure",
      status: "completed",
      slotDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      slotLabel: "13:00 - 15:00",
    },
  ];

  private helperJob: HelperJobView = {
    helperProfileId: "18",
    assignmentStatus: "Assigned",
    technicianId: "6",
    technicianName: "Lead Technician Ravi",
    serviceRequestId: "101",
    serviceRequestNumber: "SR-101",
    jobCardId: "101",
    jobCardNumber: "JC-101",
    customerName: "Aarav Menon",
    serviceName: "Split AC Service",
    addressSummary: "18 Green Park, Anna Nagar, Chennai",
    assignmentRemarks: "Support condenser cleaning and photos.",
    assignedOnUtc: new Date().toISOString(),
    attendance: [],
    tasks: [
      {
        id: "1",
        taskName: "Carry outdoor tools",
        taskDescription: "Move condenser cleaning kit to the terrace.",
        mandatoryFlag: true,
        sortOrder: 1,
        responseStatus: "Pending",
        responseRemarks: "",
        responsePhotoUrl: "",
      },
      {
        id: "2",
        taskName: "Upload cleanup photo",
        taskDescription: "Capture the post-service work area.",
        mandatoryFlag: false,
        sortOrder: 2,
        responseStatus: "Pending",
        responseRemarks: "",
        responsePhotoUrl: "",
      },
    ],
  };

  private jobDetail: FieldJobDetail = {
    id: "101",
    serviceRequestNumber: "SR-101",
    jobCardId: "101",
    jobCardNumber: "JC-101",
    lifecycleType: "Today",
    lifecycleLabel: "Ready for visit",
    bookingReference: "BK-101",
    currentStatus: "Assigned",
    status: "assigned",
    customerName: "Aarav Menon",
    mobileNumber: "9876543210",
    addressSummary: "18 Green Park, Anna Nagar, Chennai",
    zoneName: "Anna Nagar",
    serviceName: "Split AC Service",
    acTypeName: "Split AC",
    tonnageName: "1.5 Ton",
    brandName: "Daikin",
    modelName: "DX-18",
    issueNotes: "Cooling issue with outdoor unit noise.",
    slotDate: new Date().toISOString().slice(0, 10),
    slotLabel: "09:00 - 11:00",
    assignmentRemarks: "Customer requested early arrival.",
    customerLatitude: 13.085,
    customerLongitude: 80.209,
    allowedActions: ["Depart", "Arrive", "StartWork", "Progress", "Report", "Photos", "Signature", "Payment", "Complete"],
    checklist: [
      {
        id: "11",
        title: "Inspect indoor unit",
        description: "Verify airflow and drain condition.",
        isMandatory: true,
        isChecked: false,
        responseRemarks: "",
      },
      {
        id: "12",
        title: "Inspect outdoor fan",
        description: "Check fan motor and condenser fins.",
        isMandatory: true,
        isChecked: false,
        responseRemarks: "",
      },
    ],
    timeline: [],
    photos: [],
    partsRequests: [],
    payments: [],
  };

  async getMyJobs() {
    return this.myJobs;
  }

  async getJobHistory() {
    return this.jobHistory;
  }

  async getJobDetail(_serviceRequestId: string) {
    return this.jobDetail;
  }

  async depart(_serviceRequestId: string, _payload: { remarks?: string; latitude?: number; longitude?: number }) {
    this.jobDetail = {
      ...this.jobDetail,
      currentStatus: "EnRoute",
      status: "en-route",
    };
    return this.jobDetail;
  }

  async arrive(
    _serviceRequestId: string,
    _payload: { remarks?: string; latitude: number; longitude: number; overrideReason?: string },
  ) {
    this.jobDetail = {
      ...this.jobDetail,
      currentStatus: "Reached",
      status: "arrived",
    };
    return {
      overrideRequired: false,
      distanceMeters: 24,
      message: "Arrival recorded.",
      job: this.jobDetail,
    };
  }

  async startWork(_serviceRequestId: string, _remarks?: string) {
    this.jobDetail = {
      ...this.jobDetail,
      currentStatus: "WorkStarted",
      status: "in-progress",
    };
    return this.jobDetail;
  }

  async saveProgress(serviceRequestId: string, payload: FieldProgressPayload) {
    this.jobDetail = {
      ...this.jobDetail,
      checklist: this.jobDetail.checklist.map((item) => {
        const update = payload.items.find((entry) => String(entry.serviceChecklistMasterId) === item.id);
        return update
          ? {
              ...item,
              isChecked: Boolean(update.isChecked),
              responseRemarks: update.responseRemarks ?? item.responseRemarks,
            }
          : item;
      }),
    };
    return this.jobDetail;
  }

  async createPartsRequest(serviceRequestId: string, payload: FieldPartsRequestPayload) {
    const request = {
      id: generateId(),
      urgency: payload.urgency,
      currentStatus: "Pending",
      notes: payload.notes?.trim() ?? "",
      submittedAtUtc: new Date().toISOString(),
      items: payload.items.map((item) => ({
        id: generateId(),
        partCode: item.partCode,
        partName: item.partName,
        quantityRequested: item.quantityRequested,
        quantityApproved: 0,
        currentStatus: "Pending",
        remarks: item.remarks?.trim() ?? "",
      })),
    } satisfies FieldPartsRequest;
    this.jobDetail = {
      ...this.jobDetail,
      partsRequests: [request, ...this.jobDetail.partsRequests],
    };
    return request;
  }

  async createEstimate(serviceRequestId: string, payload: FieldEstimatePayload) {
    const subTotalAmount = payload.lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
    const estimate = {
      id: generateId(),
      quotationNumber: "QT-MOCK",
      currentStatus: "PendingCustomerApproval",
      quotationDateUtc: new Date().toISOString(),
      subTotalAmount,
      discountAmount: payload.discountAmount,
      taxPercentage: payload.taxPercentage,
      taxAmount: 0,
      grandTotalAmount: subTotalAmount - payload.discountAmount,
      customerDecisionRemarks: payload.remarks?.trim() ?? "",
      lines: payload.lines.map((line) => ({
        id: generateId(),
        lineType: line.lineType,
        lineDescription: line.lineDescription,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineAmount: line.quantity * line.unitPrice,
      })),
    } satisfies FieldQuotation;
    this.jobDetail = {
      ...this.jobDetail,
      quotation: estimate,
    };
    return estimate;
  }

  async submitReport(serviceRequestId: string, payload: FieldReportPayload) {
    const report = {
      id: generateId(),
      issuesIdentified: payload.issuesIdentified,
      equipmentCondition: payload.equipmentCondition,
      actionTaken: payload.actionTaken,
      recommendation: payload.recommendation?.trim() ?? "",
      observations: payload.observations?.trim() ?? "",
      submittedAtUtc: new Date().toISOString(),
    } satisfies FieldJobReport;
    this.jobDetail = {
      ...this.jobDetail,
      latestReport: report,
    };
    return report;
  }

  async uploadPhoto(serviceRequestId: string, payload: FieldPhotoPayload) {
    const photo = createOptimisticPhoto(payload);
    this.jobDetail = {
      ...this.jobDetail,
      photos: [photo, ...this.jobDetail.photos],
    };
    return photo;
  }

  async saveSignature(serviceRequestId: string, payload: FieldSignaturePayload) {
    const signature = {
      id: generateId(),
      customerName: payload.customerName,
      signatureDataUrl: payload.signatureBase64,
      signedAtUtc: new Date().toISOString(),
      capturedBy: "Mock Technician",
      remarks: payload.remarks?.trim() ?? "",
    } satisfies FieldCustomerSignature;
    this.jobDetail = {
      ...this.jobDetail,
      signature,
    };
    return signature;
  }

  async collectPayment(serviceRequestId: string, payload: FieldPaymentPayload) {
    const payment = {
      id: generateId(),
      paymentMethod: payload.paymentMethod,
      referenceNumber: payload.referenceNumber?.trim() ?? "",
      paidAmount: payload.paidAmount,
      paymentDateUtc: new Date().toISOString(),
      transactionRemarks: payload.remarks?.trim() ?? "",
      receiptNumber: "RCPT-MOCK",
    } satisfies FieldPayment;
    this.jobDetail = {
      ...this.jobDetail,
      payments: [payment, ...this.jobDetail.payments],
    };
    return payment;
  }

  async complete(_serviceRequestId: string, _remarks?: string) {
    this.jobDetail = {
      ...this.jobDetail,
      currentStatus: "SubmittedForClosure",
      status: "completed",
    };
    return this.jobDetail;
  }

  async checkIn(locationText?: string, _latitude?: number, _longitude?: number) {
    const attendance = createOptimisticAttendance(locationText);
    saveTechnicianAttendance(attendance);
    return attendance;
  }

  async checkOut(locationText?: string, _latitude?: number, _longitude?: number) {
    const current = readTechnicianAttendance() ?? createOptimisticAttendance(locationText);
    const updated = {
      ...current,
      checkOutOnUtc: new Date().toISOString(),
      locationText: locationText?.trim() || current.locationText,
    };
    saveTechnicianAttendance(updated);
    return updated;
  }

  getCachedAttendance() {
    return readTechnicianAttendance() ?? null;
  }

  async getOfflineQueue() {
    return this.liveFallback.getOfflineQueue();
  }

  async syncSubmission(id: string) {
    return this.liveFallback.syncSubmission(id);
  }

  async getHelperJobView(_serviceRequestId?: string) {
    return this.helperJob;
  }

  async checkInHelper(locationText?: string) {
    const attendance = createOptimisticAttendance(locationText);
    this.helperJob = {
      ...this.helperJob,
      attendance: [attendance, ...this.helperJob.attendance],
    };
    return attendance;
  }

  async checkOutHelper(locationText?: string) {
    const existing = this.helperJob.attendance[0] ?? createOptimisticAttendance(locationText);
    const updated = {
      ...existing,
      checkOutOnUtc: new Date().toISOString(),
      locationText: locationText?.trim() || existing.locationText,
    };
    this.helperJob = {
      ...this.helperJob,
      attendance: [updated, ...this.helperJob.attendance.slice(1)],
    };
    return updated;
  }

  async saveHelperTaskResponse(taskId: string, responseStatus: string, responseRemarks?: string) {
    this.helperJob = {
      ...this.helperJob,
      tasks: this.helperJob.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              responseStatus,
              responseRemarks: responseRemarks?.trim() ?? "",
              respondedOnUtc: new Date().toISOString(),
            }
          : task,
      ),
    };
    return this.helperJob.tasks;
  }

  async uploadHelperTaskPhoto(
    taskId: string,
    payload: { fileName: string; contentType: string; base64Content: string; responseRemarks?: string },
  ) {
    this.helperJob = {
      ...this.helperJob,
      tasks: this.helperJob.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              responseStatus: task.responseStatus || "Completed",
              responseRemarks: payload.responseRemarks?.trim() ?? task.responseRemarks,
              responsePhotoUrl: payload.base64Content,
              respondedOnUtc: new Date().toISOString(),
            }
          : task,
      ),
    };
    return this.helperJob.tasks;
  }
}

export const fieldWorkflowRepository: FieldWorkflowRepository = isDemoMode()
  ? new MockFieldWorkflowRepository()
  : new LiveFieldWorkflowRepository();

export const fieldWorkflowHelpers = {
  isFieldRole,
  getCurrentRole,
  getCachedJobDetail,
  readJobListCache,
  readHelperAssignment,
  readHelperAttendance,
};
