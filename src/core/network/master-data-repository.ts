/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDemoMode } from "../config/api-config"
import { LocalStorage, StorageKey } from "../storage/local-storage"
import { apiClient } from "./api-client"

export type MasterDataSlug =
  | "service-types"
  | "service-subtypes"
  | "equipment-brands"
  | "equipment-models"
  | "zones"
  | "job-statuses"
  | "urgency-levels"
  | "skill-tags"

export type ConfigurationGroupSlug =
  | "sla-targets"
  | "slot-availability"
  | "tax"
  | "pricing-matrix"
  | "amc-plans"
  | "payment-terms"
  | "invoice-numbering"
  | "warranty-periods"
  | "auto-escalation-rules"

export interface MasterDataRecord {
  id: string
  slug: MasterDataSlug
  code: string
  label: string
  rawValue: string
  description: string
  isActive: boolean
  isPublished: boolean
  sortOrder: number
  metadata: Record<string, unknown>
}

export interface MasterDataRecordInput {
  id?: string
  code: string
  label: string
  description?: string
  isActive: boolean
  isPublished?: boolean
  sortOrder: number
  metadata?: Record<string, unknown>
}

export interface ConfigurationRecord {
  id: string
  slug: ConfigurationGroupSlug
  key: string
  rawValue: string
  valueType: string
  description: string
  isSensitive: boolean
  isActive: boolean
  metadata: Record<string, unknown>
}

export interface ConfigurationRecordInput {
  id?: string
  key: string
  valueType: string
  description?: string
  isSensitive?: boolean
  isActive: boolean
  metadata?: Record<string, unknown>
}

export interface BusinessHourRecord {
  id: string
  dayOfWeekNumber: number
  dayName: string
  startTimeLocal?: string | null
  endTimeLocal?: string | null
  isClosed: boolean
}

export interface HolidayRecord {
  id: string
  holidayDate: string
  holidayName: string
  isRecurringAnnually: boolean
  isActive: boolean
}

export interface HolidayRecordInput {
  holidayDate: string
  holidayName: string
  isRecurringAnnually: boolean
  isActive: boolean
}

interface MasterDataQueryOptions {
  search?: string
  isActive?: boolean
  forceRefresh?: boolean
}

interface ConfigurationQueryOptions {
  forceRefresh?: boolean
}

export interface MasterDataRepository {
  getMasterRecords(slug: MasterDataSlug, options?: MasterDataQueryOptions): Promise<MasterDataRecord[]>
  createMasterRecord(slug: MasterDataSlug, input: MasterDataRecordInput): Promise<MasterDataRecord>
  updateMasterRecord(slug: MasterDataSlug, input: MasterDataRecordInput): Promise<MasterDataRecord>
  deleteMasterRecord(slug: MasterDataSlug, id: string): Promise<void>
  getConfigurationRecords(slug: ConfigurationGroupSlug, options?: ConfigurationQueryOptions): Promise<ConfigurationRecord[]>
  createConfigurationRecord(slug: ConfigurationGroupSlug, input: ConfigurationRecordInput): Promise<ConfigurationRecord>
  updateConfigurationRecord(slug: ConfigurationGroupSlug, input: ConfigurationRecordInput): Promise<ConfigurationRecord>
  getBusinessHours(options?: ConfigurationQueryOptions): Promise<BusinessHourRecord[]>
  saveBusinessHours(records: BusinessHourRecord[]): Promise<BusinessHourRecord[]>
  getHolidays(options?: ConfigurationQueryOptions): Promise<HolidayRecord[]>
  createHoliday(input: HolidayRecordInput): Promise<HolidayRecord>
  invalidateMasterData(slug?: MasterDataSlug): void
  invalidateConfiguration(slug?: ConfigurationGroupSlug | "business-hours" | "holidays"): void
}

interface BackendDynamicMasterRecord {
  dynamicMasterRecordId: number
  masterType: string
  masterCode: string
  masterLabel: string
  masterValue: string
  description: string
  isActive: boolean
  isPublished: boolean
  sortOrder: number
}

interface BackendSystemConfigurationRecord {
  systemConfigurationId: number
  configurationGroup: string
  configurationKey: string
  configurationValue: string
  valueType: string
  description: string
  isSensitive: boolean
  isActive: boolean
}

interface BackendBusinessHourRecord {
  businessHourConfigurationId: number
  dayOfWeekNumber: number
  dayName: string
  startTimeLocal?: string | null
  endTimeLocal?: string | null
  isClosed: boolean
}

interface BackendHolidayRecord {
  holidayConfigurationId: number
  holidayDate: string
  holidayName: string
  isRecurringAnnually: boolean
  isActive: boolean
}

type MasterDataCacheState = Partial<Record<MasterDataSlug, MasterDataRecord[]>>
type ConfigurationCacheState = Partial<Record<ConfigurationGroupSlug | "business-hours" | "holidays", unknown[]>>

const parseJsonValue = (rawValue: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(rawValue)
    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : { value: rawValue }
  } catch {
    return { value: rawValue }
  }
}

const toRawValue = (metadata?: Record<string, unknown>) =>
  JSON.stringify(metadata || {})

const mapMasterRecord = (slug: MasterDataSlug, record: BackendDynamicMasterRecord): MasterDataRecord => ({
  id: String(record.dynamicMasterRecordId),
  slug,
  code: record.masterCode,
  label: record.masterLabel,
  rawValue: record.masterValue,
  description: record.description || "",
  isActive: record.isActive,
  isPublished: record.isPublished,
  sortOrder: record.sortOrder,
  metadata: parseJsonValue(record.masterValue),
})

const mapConfigurationRecord = (slug: ConfigurationGroupSlug, record: BackendSystemConfigurationRecord): ConfigurationRecord => ({
  id: String(record.systemConfigurationId),
  slug,
  key: record.configurationKey,
  rawValue: record.configurationValue,
  valueType: record.valueType,
  description: record.description || "",
  isSensitive: record.isSensitive,
  isActive: record.isActive,
  metadata: parseJsonValue(record.configurationValue),
})

const mapBusinessHourRecord = (record: BackendBusinessHourRecord): BusinessHourRecord => ({
  id: String(record.businessHourConfigurationId),
  dayOfWeekNumber: record.dayOfWeekNumber,
  dayName: record.dayName,
  startTimeLocal: record.startTimeLocal,
  endTimeLocal: record.endTimeLocal,
  isClosed: record.isClosed,
})

const mapHolidayRecord = (record: BackendHolidayRecord): HolidayRecord => ({
  id: String(record.holidayConfigurationId),
  holidayDate: record.holidayDate,
  holidayName: record.holidayName,
  isRecurringAnnually: record.isRecurringAnnually,
  isActive: record.isActive,
})

const readMasterCache = (): MasterDataCacheState =>
  LocalStorage.get<MasterDataCacheState>(StorageKey.MASTER_DATA_CACHE) || {}

const writeMasterCache = (cache: MasterDataCacheState) => {
  LocalStorage.set(StorageKey.MASTER_DATA_CACHE, cache)
  LocalStorage.set(StorageKey.MASTER_DATA_LOADED_AT, new Date().toISOString())
}

const readConfigurationCache = (): ConfigurationCacheState =>
  LocalStorage.get<ConfigurationCacheState>(StorageKey.CONFIGURATION_CACHE) || {}

const writeConfigurationCache = (cache: ConfigurationCacheState) => {
  LocalStorage.set(StorageKey.CONFIGURATION_CACHE, cache)
  LocalStorage.set(StorageKey.CONFIGURATION_LOADED_AT, new Date().toISOString())
}

class MockMasterDataRepository implements MasterDataRepository {
  private masterRecords: Record<MasterDataSlug, MasterDataRecord[]> = {
    "service-types": [
      buildMockMasterRecord("service-types", "deep-cleaning", "AC Deep Cleaning", 1, { category: "Maintenance", basePrice: 1200, duration: 90 }),
      buildMockMasterRecord("service-types", "gas-charging", "Gas Charging", 2, { category: "Repair", basePrice: 2500, duration: 60 }),
      buildMockMasterRecord("service-types", "installation", "Installation", 3, { category: "Installation", basePrice: 1500, duration: 120 }),
    ],
    "service-subtypes": [
      buildMockMasterRecord("service-subtypes", "coil-cleaning", "Coil Cleaning", 1, { parentCode: "deep-cleaning" }),
      buildMockMasterRecord("service-subtypes", "leak-check", "Leak Check", 2, { parentCode: "gas-charging" }),
    ],
    "equipment-brands": [
      buildMockMasterRecord("equipment-brands", "daikin", "Daikin", 1, { origin: "Japan" }),
      buildMockMasterRecord("equipment-brands", "lg", "LG", 2, { origin: "Korea" }),
    ],
    "equipment-models": [
      buildMockMasterRecord("equipment-models", "daikin-ftkf", "FTKF Series", 1, { brandCode: "daikin", equipmentType: "Split AC", tonnage: "1.5 Ton" }),
      buildMockMasterRecord("equipment-models", "lg-dual-inverter", "Dual Inverter", 2, { brandCode: "lg", equipmentType: "Split AC", tonnage: "1.5 Ton" }),
    ],
    "zones": [
      buildMockMasterRecord("zones", "hyderabad-central", "Hyderabad Central", 1, { city: "Hyderabad", pinCodes: ["500034", "500081", "500033"] }),
      buildMockMasterRecord("zones", "delhi-south", "Delhi South", 2, { city: "Delhi", pinCodes: ["110017", "110019"] }),
    ],
    "job-statuses": [
      buildMockMasterRecord("job-statuses", "pending", "Pending Assignment", 1, { color: "urgent", nextStatuses: ["assigned", "cancelled"] }),
      buildMockMasterRecord("job-statuses", "assigned", "Assigned", 2, { color: "processing", nextStatuses: ["en-route", "cancelled"] }),
      buildMockMasterRecord("job-statuses", "completed", "Completed", 3, { color: "completed", nextStatuses: ["closed"] }),
    ],
    "urgency-levels": [
      buildMockMasterRecord("urgency-levels", "emergency", "Emergency", 1, { responseHours: 2, resolutionHours: 4 }),
      buildMockMasterRecord("urgency-levels", "urgent", "Urgent", 2, { responseHours: 6, resolutionHours: 12 }),
      buildMockMasterRecord("urgency-levels", "standard", "Standard", 3, { responseHours: 24, resolutionHours: 48 }),
    ],
    "skill-tags": [
      buildMockMasterRecord("skill-tags", "vrf", "VRF Specialist", 1, { category: "System Type" }),
      buildMockMasterRecord("skill-tags", "installation", "Installation Expert", 2, { category: "Certification" }),
    ],
  }

  private configurationRecords: Record<ConfigurationGroupSlug, ConfigurationRecord[]> = {
    "sla-targets": [
      buildMockConfigurationRecord("sla-targets", "emergency", 1, "json", { label: "Emergency", responseHours: 2, resolutionHours: 4 }),
      buildMockConfigurationRecord("sla-targets", "urgent", 2, "json", { label: "Urgent", responseHours: 6, resolutionHours: 12 }),
      buildMockConfigurationRecord("sla-targets", "standard", 3, "json", { label: "Standard", responseHours: 24, resolutionHours: 48 }),
    ],
    "slot-availability": [
      buildMockConfigurationRecord("slot-availability", "weekday-default", 1, "json", { slotDurationMinutes: 120, slots: ["10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00"] }),
    ],
    "tax": [
      buildMockConfigurationRecord("tax", "labor", 1, "json", { category: "Labor", rate: 18, code: "9987", codeLabel: "SAC" }),
      buildMockConfigurationRecord("tax", "materials", 2, "json", { category: "Materials", rate: 28, code: "8415", codeLabel: "HSN" }),
    ],
    "pricing-matrix": [
      buildMockConfigurationRecord("pricing-matrix", "deep-cleaning-split-1_5-hyderabad-central", 1, "json", { serviceTypeCode: "deep-cleaning", equipmentType: "Split AC", tonnage: "1.5 Ton", zoneCode: "hyderabad-central", price: 1500 }),
      buildMockConfigurationRecord("pricing-matrix", "gas-charging-split-1_5-hyderabad-central", 2, "json", { serviceTypeCode: "gas-charging", equipmentType: "Split AC", tonnage: "1.5 Ton", zoneCode: "hyderabad-central", price: 3000 }),
    ],
    "amc-plans": [
      buildMockConfigurationRecord("amc-plans", "basic", 1, "json", { planName: "Coolzo Basic", visitsPerYear: 2, price: 1999, featureMatrix: ["Filter cleaning", "Gas pressure check"] }),
      buildMockConfigurationRecord("amc-plans", "premium", 2, "json", { planName: "Coolzo Premium", visitsPerYear: 4, price: 3499, featureMatrix: ["Priority support", "Unlimited breakdown calls"] }),
    ],
    "payment-terms": [
      buildMockConfigurationRecord("payment-terms", "default", 1, "json", { label: "Default Terms", dueDays: 7, lateFeePercent: 2 }),
    ],
    "invoice-numbering": [
      buildMockConfigurationRecord("invoice-numbering", "primary", 1, "json", { prefix: "CZ", fiscalYearFormat: "YYYY", nextNumber: 10001, resetPolicy: "yearly" }),
    ],
    "warranty-periods": [
      buildMockConfigurationRecord("warranty-periods", "installation", 1, "json", { serviceTypeCode: "installation", durationMonths: 12 }),
      buildMockConfigurationRecord("warranty-periods", "repair", 2, "json", { serviceTypeCode: "gas-charging", durationMonths: 3 }),
    ],
    "auto-escalation-rules": [
      buildMockConfigurationRecord("auto-escalation-rules", "emergency-unassigned", 1, "json", { ruleName: "Emergency Unassigned", thresholdMinutes: 30, targetRole: "Operations Manager" }),
      buildMockConfigurationRecord("auto-escalation-rules", "standard-overdue", 2, "json", { ruleName: "Standard Overdue", thresholdMinutes: 240, targetRole: "Branch Manager" }),
    ],
  }

  private businessHours: BusinessHourRecord[] = [
    buildBusinessHour("1", 1, "Monday", "09:00", "19:00", false),
    buildBusinessHour("2", 2, "Tuesday", "09:00", "19:00", false),
    buildBusinessHour("3", 3, "Wednesday", "09:00", "19:00", false),
    buildBusinessHour("4", 4, "Thursday", "09:00", "19:00", false),
    buildBusinessHour("5", 5, "Friday", "09:00", "19:00", false),
    buildBusinessHour("6", 6, "Saturday", "10:00", "17:00", false),
    buildBusinessHour("7", 0, "Sunday", null, null, true),
  ]

  private holidays: HolidayRecord[] = [
    { id: "1", holidayDate: "2026-05-01", holidayName: "Labour Day", isRecurringAnnually: true, isActive: true },
    { id: "2", holidayDate: "2026-08-15", holidayName: "Independence Day", isRecurringAnnually: true, isActive: true },
  ]

  async getMasterRecords(slug: MasterDataSlug, options?: MasterDataQueryOptions): Promise<MasterDataRecord[]> {
    return applyMasterFilters(this.masterRecords[slug], options)
  }

  async createMasterRecord(slug: MasterDataSlug, input: MasterDataRecordInput): Promise<MasterDataRecord> {
    const created = buildMockMasterRecord(slug, input.code, input.label, input.sortOrder, input.metadata || {}, {
      id: String(Date.now()),
      description: input.description || "",
      isActive: input.isActive,
      isPublished: input.isPublished ?? true,
    })
    this.masterRecords[slug] = [...this.masterRecords[slug], created]
    return created
  }

  async updateMasterRecord(slug: MasterDataSlug, input: MasterDataRecordInput): Promise<MasterDataRecord> {
    const existing = this.masterRecords[slug].find((record) => record.id === input.id)
    if (!existing) {
      throw new Error("Master data record not found")
    }

    const updated: MasterDataRecord = {
      ...existing,
      code: input.code,
      label: input.label,
      description: input.description || "",
      isActive: input.isActive,
      isPublished: input.isPublished ?? existing.isPublished,
      sortOrder: input.sortOrder,
      metadata: input.metadata || {},
      rawValue: toRawValue(input.metadata),
    }
    this.masterRecords[slug] = this.masterRecords[slug].map((record) => record.id === updated.id ? updated : record)
    return updated
  }

  async deleteMasterRecord(slug: MasterDataSlug, id: string): Promise<void> {
    this.masterRecords[slug] = this.masterRecords[slug].filter((record) => record.id !== id)
  }

  async getConfigurationRecords(slug: ConfigurationGroupSlug): Promise<ConfigurationRecord[]> {
    return [...this.configurationRecords[slug]]
  }

  async createConfigurationRecord(slug: ConfigurationGroupSlug, input: ConfigurationRecordInput): Promise<ConfigurationRecord> {
    const created = buildMockConfigurationRecord(slug, input.key, Date.now(), input.valueType, input.metadata || {}, {
      description: input.description || "",
      isSensitive: input.isSensitive ?? false,
      isActive: input.isActive,
    })
    this.configurationRecords[slug] = [...this.configurationRecords[slug], created]
    return created
  }

  async updateConfigurationRecord(slug: ConfigurationGroupSlug, input: ConfigurationRecordInput): Promise<ConfigurationRecord> {
    const existing = this.configurationRecords[slug].find((record) => record.id === input.id)
    if (!existing) {
      throw new Error("Configuration record not found")
    }

    const updated: ConfigurationRecord = {
      ...existing,
      key: input.key,
      valueType: input.valueType,
      description: input.description || "",
      isSensitive: input.isSensitive ?? existing.isSensitive,
      isActive: input.isActive,
      metadata: input.metadata || {},
      rawValue: toRawValue(input.metadata),
    }
    this.configurationRecords[slug] = this.configurationRecords[slug].map((record) => record.id === updated.id ? updated : record)
    return updated
  }

  async getBusinessHours(): Promise<BusinessHourRecord[]> {
    return [...this.businessHours]
  }

  async saveBusinessHours(records: BusinessHourRecord[]): Promise<BusinessHourRecord[]> {
    this.businessHours = [...records]
    return [...this.businessHours]
  }

  async getHolidays(): Promise<HolidayRecord[]> {
    return [...this.holidays]
  }

  async createHoliday(input: HolidayRecordInput): Promise<HolidayRecord> {
    const created: HolidayRecord = { id: String(Date.now()), ...input }
    this.holidays = [...this.holidays, created]
    return created
  }

  invalidateMasterData(): void {}
  invalidateConfiguration(): void {}
}

class LiveMasterDataRepository implements MasterDataRepository {
  async getMasterRecords(slug: MasterDataSlug, options?: MasterDataQueryOptions): Promise<MasterDataRecord[]> {
    if (!options?.forceRefresh) {
      const cached = readMasterCache()[slug]
      if (cached) {
        return applyMasterFilters(cached, options)
      }
    }

    const response = await apiClient.get<BackendDynamicMasterRecord[]>(`/api/master/${slug}`, {
      params: {
        search: options?.search || undefined,
        isActive: options?.isActive,
      },
    })

    const records = response.data.map((record) => mapMasterRecord(slug, record))
    const cache = readMasterCache()
    cache[slug] = records
    writeMasterCache(cache)

    return records
  }

  async createMasterRecord(slug: MasterDataSlug, input: MasterDataRecordInput): Promise<MasterDataRecord> {
    const response = await apiClient.post<BackendDynamicMasterRecord>(`/api/master/${slug}`, {
      dynamicMasterRecordId: input.id ? Number(input.id) : null,
      masterCode: input.code.trim(),
      masterLabel: input.label.trim(),
      masterValue: toRawValue(input.metadata),
      description: input.description || "",
      isActive: input.isActive,
      isPublished: input.isPublished ?? true,
      sortOrder: input.sortOrder,
    })
    this.invalidateMasterData(slug)
    return mapMasterRecord(slug, response.data)
  }

  async updateMasterRecord(slug: MasterDataSlug, input: MasterDataRecordInput): Promise<MasterDataRecord> {
    const response = await apiClient.put<BackendDynamicMasterRecord>(`/api/master/${slug}`, {
      dynamicMasterRecordId: input.id ? Number(input.id) : null,
      masterCode: input.code.trim(),
      masterLabel: input.label.trim(),
      masterValue: toRawValue(input.metadata),
      description: input.description || "",
      isActive: input.isActive,
      isPublished: input.isPublished ?? true,
      sortOrder: input.sortOrder,
    })
    this.invalidateMasterData(slug)
    return mapMasterRecord(slug, response.data)
  }

  async deleteMasterRecord(slug: MasterDataSlug, id: string): Promise<void> {
    await apiClient.delete(`/api/master/${slug}`, {
      params: { dynamicMasterRecordId: Number(id) },
    })
    this.invalidateMasterData(slug)
  }

  async getConfigurationRecords(slug: ConfigurationGroupSlug, options?: ConfigurationQueryOptions): Promise<ConfigurationRecord[]> {
    if (!options?.forceRefresh) {
      const cached = readConfigurationCache()[slug]
      if (cached) {
        return cached as ConfigurationRecord[]
      }
    }

    const response = await apiClient.get<BackendSystemConfigurationRecord[]>(`/api/config/${slug}`)
    const records = response.data.map((record) => mapConfigurationRecord(slug, record))
    const cache = readConfigurationCache()
    cache[slug] = records
    writeConfigurationCache(cache)

    return records
  }

  async createConfigurationRecord(slug: ConfigurationGroupSlug, input: ConfigurationRecordInput): Promise<ConfigurationRecord> {
    const response = await apiClient.post<BackendSystemConfigurationRecord>(`/api/config/${slug}`, {
      systemConfigurationId: input.id ? Number(input.id) : null,
      configurationKey: input.key.trim(),
      configurationValue: toRawValue(input.metadata),
      valueType: input.valueType,
      description: input.description || "",
      isSensitive: input.isSensitive ?? false,
      isActive: input.isActive,
    })
    this.invalidateConfiguration(slug)
    return mapConfigurationRecord(slug, response.data)
  }

  async updateConfigurationRecord(slug: ConfigurationGroupSlug, input: ConfigurationRecordInput): Promise<ConfigurationRecord> {
    const response = await apiClient.put<BackendSystemConfigurationRecord>(`/api/config/${slug}`, {
      systemConfigurationId: input.id ? Number(input.id) : null,
      configurationKey: input.key.trim(),
      configurationValue: toRawValue(input.metadata),
      valueType: input.valueType,
      description: input.description || "",
      isSensitive: input.isSensitive ?? false,
      isActive: input.isActive,
    })
    this.invalidateConfiguration(slug)
    return mapConfigurationRecord(slug, response.data)
  }

  async getBusinessHours(options?: ConfigurationQueryOptions): Promise<BusinessHourRecord[]> {
    if (!options?.forceRefresh) {
      const cached = readConfigurationCache()["business-hours"]
      if (cached) {
        return cached as BusinessHourRecord[]
      }
    }

    const response = await apiClient.get<BackendBusinessHourRecord[]>("/api/config/business-hours")
    const records = response.data.map(mapBusinessHourRecord)
    const cache = readConfigurationCache()
    cache["business-hours"] = records
    writeConfigurationCache(cache)

    return records
  }

  async saveBusinessHours(records: BusinessHourRecord[]): Promise<BusinessHourRecord[]> {
    const response = await apiClient.put<BackendBusinessHourRecord[]>("/api/config/business-hours", {
      businessHours: records.map((record) => ({
        dayOfWeekNumber: record.dayOfWeekNumber,
        startTimeLocal: record.startTimeLocal || null,
        endTimeLocal: record.endTimeLocal || null,
        isClosed: record.isClosed,
      })),
    })
    const updated = response.data.map(mapBusinessHourRecord)
    const cache = readConfigurationCache()
    cache["business-hours"] = updated
    writeConfigurationCache(cache)
    return updated
  }

  async getHolidays(options?: ConfigurationQueryOptions): Promise<HolidayRecord[]> {
    if (!options?.forceRefresh) {
      const cached = readConfigurationCache()["holidays"]
      if (cached) {
        return cached as HolidayRecord[]
      }
    }

    const response = await apiClient.get<BackendHolidayRecord[]>("/api/holidays")
    const records = response.data.map(mapHolidayRecord)
    const cache = readConfigurationCache()
    cache["holidays"] = records
    writeConfigurationCache(cache)
    return records
  }

  async createHoliday(input: HolidayRecordInput): Promise<HolidayRecord> {
    const response = await apiClient.post<BackendHolidayRecord>("/api/holidays", {
      holidayDate: input.holidayDate,
      holidayName: input.holidayName,
      isRecurringAnnually: input.isRecurringAnnually,
      isActive: input.isActive,
    })
    this.invalidateConfiguration("holidays")
    return mapHolidayRecord(response.data)
  }

  invalidateMasterData(slug?: MasterDataSlug): void {
    if (!slug) {
      LocalStorage.remove(StorageKey.MASTER_DATA_CACHE)
      LocalStorage.remove(StorageKey.MASTER_DATA_LOADED_AT)
      return
    }

    const cache = readMasterCache()
    delete cache[slug]
    writeMasterCache(cache)
  }

  invalidateConfiguration(slug?: ConfigurationGroupSlug | "business-hours" | "holidays"): void {
    if (!slug) {
      LocalStorage.remove(StorageKey.CONFIGURATION_CACHE)
      LocalStorage.remove(StorageKey.CONFIGURATION_LOADED_AT)
      return
    }

    const cache = readConfigurationCache()
    delete cache[slug]
    writeConfigurationCache(cache)
  }
}

const buildMockMasterRecord = (
  slug: MasterDataSlug,
  code: string,
  label: string,
  sortOrder: number,
  metadata: Record<string, unknown>,
  overrides?: Partial<Omit<MasterDataRecord, "slug" | "code" | "label" | "sortOrder" | "metadata" | "rawValue">>
): MasterDataRecord => ({
  id: overrides?.id || `${slug}-${code}`,
  slug,
  code,
  label,
  rawValue: toRawValue(metadata),
  description: overrides?.description || `${label} configuration`,
  isActive: overrides?.isActive ?? true,
  isPublished: overrides?.isPublished ?? true,
  sortOrder,
  metadata,
})

const buildMockConfigurationRecord = (
  slug: ConfigurationGroupSlug,
  key: string,
  sortOrder: number,
  valueType: string,
  metadata: Record<string, unknown>,
  overrides?: Partial<Omit<ConfigurationRecord, "slug" | "key" | "valueType" | "metadata" | "rawValue">>
): ConfigurationRecord => ({
  id: overrides?.id || `${slug}-${key}-${sortOrder}`,
  slug,
  key,
  rawValue: toRawValue(metadata),
  valueType,
  description: overrides?.description || `${key} configuration`,
  isSensitive: overrides?.isSensitive ?? false,
  isActive: overrides?.isActive ?? true,
  metadata,
})

const buildBusinessHour = (
  id: string,
  dayOfWeekNumber: number,
  dayName: string,
  startTimeLocal: string | null,
  endTimeLocal: string | null,
  isClosed: boolean
): BusinessHourRecord => ({
  id,
  dayOfWeekNumber,
  dayName,
  startTimeLocal,
  endTimeLocal,
  isClosed,
})

const applyMasterFilters = (records: MasterDataRecord[], options?: MasterDataQueryOptions) => {
  const search = options?.search?.trim().toLowerCase()
  return records.filter((record) => {
    const matchesSearch = !search ||
      [record.code, record.label, record.description].some((value) => value.toLowerCase().includes(search))
    const matchesStatus = typeof options?.isActive !== "boolean" || record.isActive === options.isActive

    return matchesSearch && matchesStatus
  })
}

export const masterDataRepository: MasterDataRepository = isDemoMode()
  ? new MockMasterDataRepository()
  : new LiveMasterDataRepository()
