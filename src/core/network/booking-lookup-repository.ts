import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export interface BookingServiceLookup {
  id: string
  categoryId: string
  name: string
  summary: string
  basePrice: number
  pricingModelName: string
}

export interface BookingAcTypeLookup {
  id: string
  name: string
  description: string
}

export interface BookingTonnageLookup {
  id: string
  name: string
  description: string
}

export interface BookingBrandLookup {
  id: string
  name: string
  description: string
}

export interface BookingZoneLookup {
  id: string
  code?: string
  name: string
  cityName: string
  pincode?: string
}

export interface BookingSlotLookup {
  id: string
  zoneId: string
  slotDate: string
  slotLabel: string
  startTime: string
  endTime: string
  availableCapacity: number
  reservedCapacity: number
  isAvailable: boolean
}

export interface BookingLookupRepository {
  getServices(serviceCategoryId?: string, search?: string): Promise<BookingServiceLookup[]>
  getAcTypes(search?: string): Promise<BookingAcTypeLookup[]>
  getTonnages(search?: string): Promise<BookingTonnageLookup[]>
  getBrands(search?: string): Promise<BookingBrandLookup[]>
  getZones(search?: string): Promise<BookingZoneLookup[]>
  getZoneByPincode(pincode: string): Promise<BookingZoneLookup | null>
  getSlots(zoneId: string, slotDate: string): Promise<BookingSlotLookup[]>
}

interface BackendServiceLookup {
  serviceId: number
  serviceCategoryId: number
  serviceName: string
  summary: string
  basePrice: number
  pricingModelName: string
}

interface BackendAcTypeLookup {
  acTypeId: number
  acTypeName: string
  description: string
}

interface BackendTonnageLookup {
  tonnageId: number
  tonnageName: string
  description: string
}

interface BackendBrandLookup {
  brandId: number
  brandName: string
  description: string
}

interface BackendZoneLookup {
  zoneId: number
  zoneCode?: string
  zoneName: string
  cityName: string
  pincode?: string
}

interface BackendSlotLookup {
  slotAvailabilityId: number
  zoneId: number
  slotDate: string
  slotLabel: string
  startTime: string
  endTime: string
  availableCapacity: number
  reservedCapacity: number
  isAvailable: boolean
}

const mapService = (service: BackendServiceLookup): BookingServiceLookup => ({
  id: String(service.serviceId),
  categoryId: String(service.serviceCategoryId),
  name: service.serviceName,
  summary: service.summary,
  basePrice: service.basePrice,
  pricingModelName: service.pricingModelName,
})

const mapAcType = (acType: BackendAcTypeLookup): BookingAcTypeLookup => ({
  id: String(acType.acTypeId),
  name: acType.acTypeName,
  description: acType.description,
})

const mapTonnage = (tonnage: BackendTonnageLookup): BookingTonnageLookup => ({
  id: String(tonnage.tonnageId),
  name: tonnage.tonnageName,
  description: tonnage.description,
})

const mapBrand = (brand: BackendBrandLookup): BookingBrandLookup => ({
  id: String(brand.brandId),
  name: brand.brandName,
  description: brand.description,
})

const mapZone = (zone: BackendZoneLookup): BookingZoneLookup => ({
  id: String(zone.zoneId),
  code: zone.zoneCode,
  name: zone.zoneName,
  cityName: zone.cityName,
  pincode: zone.pincode,
})

const mapSlot = (slot: BackendSlotLookup): BookingSlotLookup => ({
  id: String(slot.slotAvailabilityId),
  zoneId: String(slot.zoneId),
  slotDate: slot.slotDate,
  slotLabel: slot.slotLabel,
  startTime: slot.startTime,
  endTime: slot.endTime,
  availableCapacity: slot.availableCapacity,
  reservedCapacity: slot.reservedCapacity,
  isAvailable: slot.isAvailable,
})

class MockBookingLookupRepository implements BookingLookupRepository {
  async getServices(): Promise<BookingServiceLookup[]> {
    return [
      { id: "1", categoryId: "1", name: "AC Deep Cleaning", summary: "Deep clean indoor and outdoor unit", basePrice: 1200, pricingModelName: "Flat" },
      { id: "2", categoryId: "1", name: "Gas Charging", summary: "Cooling restoration and gas top-up", basePrice: 2500, pricingModelName: "Flat" },
      { id: "3", categoryId: "2", name: "Installation", summary: "New AC installation", basePrice: 1800, pricingModelName: "Flat" },
    ]
  }

  async getAcTypes(): Promise<BookingAcTypeLookup[]> {
    return [
      { id: "1", name: "Split AC", description: "Wall-mounted split AC" },
      { id: "2", name: "Cassette AC", description: "Ceiling cassette AC" },
    ]
  }

  async getTonnages(): Promise<BookingTonnageLookup[]> {
    return [
      { id: "1", name: "1.0 Ton", description: "Small room" },
      { id: "2", name: "1.5 Ton", description: "Standard room" },
      { id: "3", name: "2.0 Ton", description: "Large room" },
    ]
  }

  async getBrands(): Promise<BookingBrandLookup[]> {
    return [
      { id: "1", name: "Daikin", description: "Japanese brand" },
      { id: "2", name: "LG", description: "Korean brand" },
      { id: "3", name: "Blue Star", description: "Indian brand" },
    ]
  }

  async getZoneByPincode(pincode: string): Promise<BookingZoneLookup | null> {
    if (!pincode.trim()) {
      return null
    }

    return {
      id: "1",
      name: "Hyderabad Central",
      cityName: "Hyderabad",
      pincode,
    }
  }

  async getZones(): Promise<BookingZoneLookup[]> {
    return [
      { id: "1", code: "mumbai-west", name: "Mumbai West", cityName: "Mumbai" },
      { id: "2", code: "mumbai-central", name: "Mumbai Central", cityName: "Mumbai" },
      { id: "3", code: "mumbai-east", name: "Mumbai East", cityName: "Mumbai" },
    ]
  }

  async getSlots(zoneId: string, slotDate: string): Promise<BookingSlotLookup[]> {
    return [
      { id: "1", zoneId, slotDate, slotLabel: "10:00-12:00", startTime: "10:00", endTime: "12:00", availableCapacity: 4, reservedCapacity: 1, isAvailable: true },
      { id: "2", zoneId, slotDate, slotLabel: "12:00-14:00", startTime: "12:00", endTime: "14:00", availableCapacity: 3, reservedCapacity: 2, isAvailable: true },
      { id: "3", zoneId, slotDate, slotLabel: "14:00-16:00", startTime: "14:00", endTime: "16:00", availableCapacity: 0, reservedCapacity: 4, isAvailable: false },
    ]
  }
}

class LiveBookingLookupRepository implements BookingLookupRepository {
  async getServices(serviceCategoryId?: string, search?: string): Promise<BookingServiceLookup[]> {
    const response = await apiClient.get<BackendServiceLookup[]>("/api/v1/booking-lookups/services", {
      params: {
        serviceCategoryId: serviceCategoryId ? Number(serviceCategoryId) : undefined,
        search: search || undefined,
      },
    })

    return response.data.map(mapService)
  }

  async getAcTypes(search?: string): Promise<BookingAcTypeLookup[]> {
    const response = await apiClient.get<BackendAcTypeLookup[]>("/api/v1/booking-lookups/ac-types", {
      params: { search: search || undefined },
    })

    return response.data.map(mapAcType)
  }

  async getTonnages(search?: string): Promise<BookingTonnageLookup[]> {
    const response = await apiClient.get<BackendTonnageLookup[]>("/api/v1/booking-lookups/tonnage", {
      params: { search: search || undefined },
    })

    return response.data.map(mapTonnage)
  }

  async getBrands(search?: string): Promise<BookingBrandLookup[]> {
    const response = await apiClient.get<BackendBrandLookup[]>("/api/v1/booking-lookups/brands", {
      params: { search: search || undefined },
    })

    return response.data.map(mapBrand)
  }

  async getZones(search?: string): Promise<BookingZoneLookup[]> {
    const response = await apiClient.get<BackendZoneLookup[]>("/api/v1/booking-lookups/zones", {
      params: { search: search || undefined },
    })

    return response.data.map(mapZone)
  }

  async getZoneByPincode(pincode: string): Promise<BookingZoneLookup | null> {
    if (!pincode.trim()) {
      return null
    }

    const response = await apiClient.get<BackendZoneLookup>(`/api/v1/booking-lookups/zones/by-pincode/${pincode.trim()}`)
    return response.data ? mapZone(response.data) : null
  }

  async getSlots(zoneId: string, slotDate: string): Promise<BookingSlotLookup[]> {
    const response = await apiClient.get<BackendSlotLookup[]>("/api/v1/booking-lookups/slots", {
      params: {
        zoneId: Number(zoneId),
        slotDate,
      },
    })

    return response.data.map(mapSlot)
  }
}

export const bookingLookupRepository: BookingLookupRepository = isDemoMode()
  ? new MockBookingLookupRepository()
  : new LiveBookingLookupRepository()
