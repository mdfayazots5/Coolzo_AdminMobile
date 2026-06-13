/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from "./api-client"

/** A bookable service (tblService) as surfaced to the admin image manager. */
export interface AdminServiceItem {
  serviceId: number
  serviceCategoryId: number
  serviceName: string
  summary: string
  basePrice: number
  pricingModelName: string
  imageUrl: string
}

/** A service category (tblServiceCategory) — used to label services in the catalog view. */
export interface AdminServiceCategory {
  serviceCategoryId: number
  categoryName: string
}

export const serviceCatalogRepository = {
  /** Lists active bookable services (reuses the public booking-lookup; now carries imageUrl). */
  async getServices(): Promise<AdminServiceItem[]> {
    const response = await apiClient.get<AdminServiceItem[]>("/api/booking-lookups/services")
    return response.data
  },

  /** Lists service categories — used to show each service's category name. */
  async getServiceCategories(): Promise<AdminServiceCategory[]> {
    const response = await apiClient.get<AdminServiceCategory[]>("/api/booking-lookups/service-categories")
    return response.data
  },

  /** Persists (or clears, when null) the per-service image on tblService. */
  async setServiceImage(serviceId: number, imageUrl: string | null): Promise<AdminServiceItem> {
    const response = await apiClient.put<AdminServiceItem>(`/api/admin/services/${serviceId}/image`, { imageUrl })
    return response.data
  },
}
