import type { ApiContractEntry } from "../app/infrastructure/api/contracts";
import { IS_MOCK } from "../app/infrastructure/api/contracts";

export const API_MASTER_META = {
  generatedAt: "2026-04-22",
  app: "Coolzo Admin Mobile",
  mode: IS_MOCK ? "mock" : "live",
};

export const API_MASTER: Record<string, ApiContractEntry[]> = {
  auth: [
    { endpoint: "/api/v1/auth/login", method: "POST", request: "{ userNameOrEmail, password }", response: "{ accessToken, refreshToken, currentUser }", status: "live" },
    { endpoint: "/api/v1/auth/login-field", method: "POST", request: "{ employeeId, pin }", response: "{ accessToken, refreshToken, currentUser }", status: "live" },
    { endpoint: "/api/v1/auth/login-otp", method: "POST", request: "{ loginId, otp }", response: "{ accessToken, refreshToken, currentUser }", status: "live" },
    { endpoint: "/api/v1/auth/verify-otp", method: "POST", request: "{ email, otp }", response: "{ accessToken, refreshToken, currentUser }", status: "live" },
    { endpoint: "/api/v1/auth/refresh-token", method: "POST", request: "{ accessToken, refreshToken }", response: "{ accessToken, refreshToken, currentUser }", status: "live" },
    { endpoint: "/api/v1/auth/logout", method: "POST", request: "{ refreshToken }", response: "204 No Content", status: "live" },
    { endpoint: "/api/v1/auth/forgot-password", method: "POST", request: "{ email }", response: "204 No Content", status: "live" },
    { endpoint: "/api/v1/auth/reset-password", method: "POST", request: "{ token, password }", response: "204 No Content", status: "live" },
    { endpoint: "/api/v1/auth/me", method: "GET", request: "none", response: "{ currentUser }", status: "live" },
    { endpoint: "/api/v1/auth/me/permissions", method: "GET", request: "none", response: "{ permissions[], dataScope }", status: "live" },
    { endpoint: "mock://auth", method: "POST", request: "{ email|employeeId, password|pin|otp }", response: "{ user, token, refreshToken, requires2FA? }", status: "mock" },
  ],
  dashboard: [
    { endpoint: "/api/v1/dashboard/stats", method: "GET", request: "none", response: "{ totalRevenue, activeJobs, customerSatisfaction, slaCompliance, revenueTrend[], jobStatusDistribution[], topTechnicians[] }", status: "mixed" },
    { endpoint: "/api/v1/dashboard/operations", method: "GET", request: "none", response: "{ KPI cards, operational summaries }", status: "live" },
    { endpoint: "/api/v1/dashboard/operations/pending-queue", method: "GET", request: "none", response: "{ queue[] }", status: "live" },
    { endpoint: "/api/v1/dashboard/operations/technician-status", method: "GET", request: "none", response: "{ technicianStatus[] }", status: "live" },
    { endpoint: "/api/v1/dashboard/operations/sla-alerts", method: "GET", request: "none", response: "{ alerts[] }", status: "live" },
    { endpoint: "/api/v1/dashboard/operations/zone-workload", method: "GET", request: "none", response: "{ zones[] }", status: "live" },
    { endpoint: "/api/v1/dashboard/operations/day-summary", method: "GET", request: "none", response: "{ totals, summaries }", status: "live" },
    { endpoint: "/api/v1/dashboard/live-map", method: "GET", request: "none", response: "{ technicians[], serviceRequests[] }", status: "live" },
  ],
  serviceRequests: [
    { endpoint: "/api/v1/service-requests", method: "GET", request: "{ bookingId?, status?, zone?, technicianId?, slotDate?, dateFrom?, dateTo?, pageNumber?, pageSize? }", response: "{ items[] }", status: "mixed" },
    { endpoint: "/api/v1/service-requests/{id}", method: "GET", request: "none", response: "{ serviceRequest }", status: "mixed" },
    { endpoint: "/api/v1/service-requests", method: "POST", request: "{ customerName, phone, addressLine1, cityName, pincode, serviceId, acTypeId, tonnageId, brandId, slotAvailabilityId, priority, issueNotes? }", response: "{ serviceRequest }", status: "mixed" },
    { endpoint: "/api/v1/service-requests/{id}/assign", method: "POST", request: "{ technicianId }", response: "204 No Content", status: "live" },
    { endpoint: "/api/v1/service-requests/{id}/reassign", method: "POST", request: "{ technicianId, reason? }", response: "204 No Content", status: "live" },
    { endpoint: "/api/v1/service-requests/{id}/notes", method: "POST", request: "{ content, isEscalation? }", response: "204 No Content", status: "live" },
    { endpoint: "/api/v1/service-requests/from-booking/{bookingId}", method: "POST", request: "{ priority, internalNote?, assignedTechnicianId? }", response: "{ serviceRequest }", status: "live" },
  ],
  bookings: [
    { endpoint: "/api/v1/booking-lookups/services", method: "GET", request: "{ serviceCategoryId?, search? }", response: "{ services[] }", status: "mixed" },
    { endpoint: "/api/v1/booking-lookups/ac-types", method: "GET", request: "{ search? }", response: "{ acTypes[] }", status: "mixed" },
    { endpoint: "/api/v1/booking-lookups/tonnage", method: "GET", request: "{ search? }", response: "{ tonnages[] }", status: "mixed" },
    { endpoint: "/api/v1/booking-lookups/brands", method: "GET", request: "{ search? }", response: "{ brands[] }", status: "mixed" },
    { endpoint: "/api/v1/booking-lookups/zones", method: "GET", request: "{ search? }", response: "{ zones[] }", status: "mixed" },
    { endpoint: "/api/v1/booking-lookups/zones/by-pincode/{pincode}", method: "GET", request: "none", response: "{ zone }", status: "mixed" },
    { endpoint: "/api/v1/booking-lookups/slots", method: "GET", request: "{ zoneId, slotDate }", response: "{ slots[] }", status: "mixed" },
    { endpoint: "/api/v1/bookings/guest", method: "POST", request: "{ customer, address, service, slot }", response: "{ bookingId, bookingReference }", status: "live" },
    { endpoint: "app://bookings", method: "GET", request: "{ status?, search? }", response: "{ bookingRecords[] mapped from service requests }", status: "mock" },
  ],
  customers: [
    { endpoint: "/api/v1/customers", method: "GET", request: "{ page?, pageSize?, search?, risk?, amc? }", response: "{ customers[] }", status: "live" },
    { endpoint: "/api/v1/customers/{customerId}", method: "GET", request: "none", response: "{ customer, addresses[], equipment[], notes[] }", status: "live" },
    { endpoint: "/api/v1/customers/{customerId}", method: "PUT", request: "{ customer fields }", response: "{ customer }", status: "live" },
    { endpoint: "/api/v1/customers/{customerId}/addresses", method: "GET", request: "none", response: "{ addresses[] }", status: "live" },
    { endpoint: "/api/v1/customers/{customerId}/addresses", method: "POST", request: "{ address fields }", response: "{ address }", status: "live" },
    { endpoint: "/api/v1/customers/{customerId}/equipment", method: "GET", request: "none", response: "{ equipment[] }", status: "live" },
    { endpoint: "/api/v1/customers/{customerId}/equipment", method: "POST", request: "{ equipment fields }", response: "{ equipment }", status: "live" },
    { endpoint: "/api/v1/customers/{customerId}/notes", method: "POST", request: "{ content, isPrivate? }", response: "204 No Content", status: "live" },
  ],
  technicians: [
    { endpoint: "/api/v1/technicians", method: "GET", request: "{ search?, zone?, status? }", response: "{ technicians[] }", status: "live" },
    { endpoint: "/api/v1/technicians/{technicianId}", method: "GET", request: "none", response: "{ technician }", status: "live" },
    { endpoint: "/api/v1/technicians", method: "POST", request: "{ technician fields }", response: "{ technician }", status: "live" },
    { endpoint: "/api/v1/technicians/{technicianId}", method: "PUT", request: "{ technician fields }", response: "{ technician }", status: "live" },
    { endpoint: "/api/v1/technicians/{technicianId}/skills", method: "PATCH", request: "{ skillIds[] }", response: "204 No Content", status: "live" },
    { endpoint: "/api/v1/technicians/{technicianId}/zones", method: "PATCH", request: "{ zoneIds[] }", response: "204 No Content", status: "live" },
    { endpoint: "/api/v1/technicians/availability-board", method: "GET", request: "{ serviceRequestId? }", response: "{ availability[] }", status: "live" },
    { endpoint: "/api/v1/helpers", method: "GET", request: "none", response: "{ helpers[] }", status: "live" },
  ],
  operations: [
    { endpoint: "/api/v1/scheduling/board", method: "GET", request: "{ date?, zone?, technicianId? }", response: "{ jobs[], visits[] }", status: "live" },
    { endpoint: "/api/v1/scheduling/reschedule", method: "POST", request: "{ serviceRequestId, slotId, reason }", response: "204 No Content", status: "live" },
    { endpoint: "/api/v1/escalations", method: "POST", request: "{ serviceRequestId, escalationType, note }", response: "{ escalation }", status: "live" },
  ],
  notifications: [
    { endpoint: "/api/v1/notifications/templates", method: "GET", request: "none", response: "{ templates[] }", status: "mixed" },
    { endpoint: "/api/v1/notifications/templates/{id}", method: "PUT", request: "{ template fields }", response: "{ template }", status: "mixed" },
    { endpoint: "/api/v1/notifications/log", method: "GET", request: "none", response: "{ logs[] }", status: "mixed" },
    { endpoint: "/api/v1/notifications/push-campaign", method: "POST", request: "{ title, body, audience, schedule? }", response: "{ campaign }", status: "live" },
  ],
  settings: [
    { endpoint: "/api/v1/master/*", method: "GET", request: "{ module-specific query }", response: "{ configuration rows[] }", status: "live" },
    { endpoint: "/api/v1/config/*", method: "GET", request: "{ module-specific query }", response: "{ configuration rows[] }", status: "live" },
    { endpoint: "/api/v1/admin/view-as-role", method: "POST", request: "{ roleId }", response: "{ roleId, roleName, displayName, permissions[], dataScope }", status: "live" },
  ],
};

