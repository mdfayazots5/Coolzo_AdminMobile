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
  description?: string
}

// ── Full admin catalog management (categories + services CRUD) ──────────────────────────────────
export interface AdminCatalogCategory {
  serviceCategoryId: number
  categoryCode: string
  categoryName: string
  description: string
  isActive: boolean
  sortOrder: number
  serviceCount: number
}

export interface AdminCatalogService {
  serviceId: number
  serviceCategoryId: number
  pricingModelId: number
  pricingModelName: string
  serviceCode: string
  serviceName: string
  summary: string
  basePrice: number
  estimatedDurationInMinutes: number
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
}

export interface PricingModelOption {
  pricingModelId: number
  pricingModelName: string
  basePrice: number
}

export interface ServiceCatalog {
  categories: AdminCatalogCategory[]
  services: AdminCatalogService[]
  pricingModels: PricingModelOption[]
}

export interface CategoryUpsertInput {
  categoryName: string
  categoryCode?: string | null
  description?: string | null
  isActive: boolean
  sortOrder: number
}

export interface ServiceUpsertInput {
  serviceCategoryId: number
  pricingModelId: number
  serviceName: string
  serviceCode?: string | null
  summary?: string | null
  basePrice: number
  estimatedDurationInMinutes: number
  imageUrl?: string | null
  isActive: boolean
  sortOrder: number
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

  /** Full admin catalog: categories + services (incl. inactive) + pricing-model options. */
  async getCatalog(): Promise<ServiceCatalog> {
    const response = await apiClient.get<ServiceCatalog>("/api/admin/services/catalog")
    return response.data
  },

  async createCategory(input: CategoryUpsertInput): Promise<AdminCatalogCategory> {
    const response = await apiClient.post<AdminCatalogCategory>("/api/admin/services/categories", input)
    return response.data
  },

  async updateCategory(serviceCategoryId: number, input: CategoryUpsertInput): Promise<AdminCatalogCategory> {
    const response = await apiClient.put<AdminCatalogCategory>(`/api/admin/services/categories/${serviceCategoryId}`, input)
    return response.data
  },

  async deleteCategory(serviceCategoryId: number): Promise<void> {
    await apiClient.delete(`/api/admin/services/categories/${serviceCategoryId}`)
  },

  async createService(input: ServiceUpsertInput): Promise<AdminCatalogService> {
    const response = await apiClient.post<AdminCatalogService>("/api/admin/services", input)
    return response.data
  },

  async updateService(serviceId: number, input: ServiceUpsertInput): Promise<AdminCatalogService> {
    const response = await apiClient.put<AdminCatalogService>(`/api/admin/services/${serviceId}`, input)
    return response.data
  },

  async deleteService(serviceId: number): Promise<void> {
    await apiClient.delete(`/api/admin/services/${serviceId}`)
  },
}
