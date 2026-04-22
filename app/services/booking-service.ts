import { serviceRequestRepository, type ServiceRequestFilters } from "../../src/core/network/service-request-repository";
import type { BookingRecord } from "../domain/models/admin";

function mapBookingFromServiceRequest(serviceRequest: Awaited<ReturnType<typeof serviceRequestRepository.getSRById>> extends infer T ? Exclude<T, null> : never): BookingRecord {
  return {
    id: serviceRequest.id,
    reference: serviceRequest.srNumber,
    linkedServiceRequestId: serviceRequest.id,
    customerName: serviceRequest.customer.name,
    phone: serviceRequest.customer.phone,
    serviceType: serviceRequest.serviceType,
    status: serviceRequest.status,
    priority: serviceRequest.priority,
    requestedDate: serviceRequest.scheduling.requestedDate,
    requestedSlot: serviceRequest.scheduling.requestedSlot,
    city: serviceRequest.location.city,
    zoneId: serviceRequest.location.zoneId,
    address: serviceRequest.location.address,
    assignedTechnicianName: serviceRequest.scheduling.assignedTechnicianName,
  };
}

export const bookingService = {
  async list(filters: ServiceRequestFilters = {}): Promise<BookingRecord[]> {
    const records = await serviceRequestRepository.getSRs(filters);
    return records.map((item) => mapBookingFromServiceRequest(item));
  },

  async getById(id: string): Promise<BookingRecord | null> {
    const record = await serviceRequestRepository.getSRById(id);
    return record ? mapBookingFromServiceRequest(record) : null;
  },
};

