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

export const serviceCatalogRepository = {
  /** Lists active bookable services (reuses the public booking-lookup; now carries imageUrl). */
  async getServices(): Promise<AdminServiceItem[]> {
    const response = await apiClient.get<AdminServiceItem[]>("/api/booking-lookups/services")
    return response.data
  },

  /** Persists (or clears, when null) the per-service image on tblService. */
  async setServiceImage(serviceId: number, imageUrl: string | null): Promise<AdminServiceItem> {
    const response = await apiClient.put<AdminServiceItem>(`/api/admin/services/${serviceId}/image`, { imageUrl })
    return response.data
  },
}
