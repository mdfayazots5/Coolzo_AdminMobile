/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import {
  BusinessHourRecord,
  ConfigurationGroupSlug,
  ConfigurationRecord,
  ConfigurationRecordInput,
  HolidayRecord,
  HolidayRecordInput,
  MasterDataRecord,
  MasterDataRecordInput,
  MasterDataSlug,
  masterDataRepository,
} from "@/core/network/master-data-repository"

interface MasterDataContextValue {
  masterData: Partial<Record<MasterDataSlug, MasterDataRecord[]>>
  configurations: Partial<Record<ConfigurationGroupSlug, ConfigurationRecord[]>>
  businessHours: BusinessHourRecord[]
  holidays: HolidayRecord[]
  loadMasterData: (slug: MasterDataSlug, forceRefresh?: boolean) => Promise<MasterDataRecord[]>
  saveMasterData: (slug: MasterDataSlug, input: MasterDataRecordInput) => Promise<MasterDataRecord>
  removeMasterData: (slug: MasterDataSlug, id: string) => Promise<void>
  loadConfiguration: (slug: ConfigurationGroupSlug, forceRefresh?: boolean) => Promise<ConfigurationRecord[]>
  saveConfiguration: (slug: ConfigurationGroupSlug, input: ConfigurationRecordInput) => Promise<ConfigurationRecord>
  loadBusinessHours: (forceRefresh?: boolean) => Promise<BusinessHourRecord[]>
  saveBusinessHours: (records: BusinessHourRecord[]) => Promise<BusinessHourRecord[]>
  loadHolidays: (forceRefresh?: boolean) => Promise<HolidayRecord[]>
  saveHoliday: (input: HolidayRecordInput) => Promise<HolidayRecord>
}

const MasterDataContext = React.createContext<MasterDataContextValue | null>(null)

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
  const [masterData, setMasterData] = React.useState<Partial<Record<MasterDataSlug, MasterDataRecord[]>>>({})
  const [configurations, setConfigurations] = React.useState<Partial<Record<ConfigurationGroupSlug, ConfigurationRecord[]>>>({})
  const [businessHours, setBusinessHours] = React.useState<BusinessHourRecord[]>([])
  const [holidays, setHolidays] = React.useState<HolidayRecord[]>([])

  const loadMasterData = React.useCallback(async (slug: MasterDataSlug, forceRefresh = false) => {
    const records = await masterDataRepository.getMasterRecords(slug, { forceRefresh })
    setMasterData((current) => ({ ...current, [slug]: records }))
    return records
  }, [])

  const saveMasterData = React.useCallback(async (slug: MasterDataSlug, input: MasterDataRecordInput) => {
    const record = input.id
      ? await masterDataRepository.updateMasterRecord(slug, input)
      : await masterDataRepository.createMasterRecord(slug, input)
    const records = await masterDataRepository.getMasterRecords(slug, { forceRefresh: true })
    setMasterData((current) => ({ ...current, [slug]: records }))
    return record
  }, [])

  const removeMasterData = React.useCallback(async (slug: MasterDataSlug, id: string) => {
    await masterDataRepository.deleteMasterRecord(slug, id)
    const records = await masterDataRepository.getMasterRecords(slug, { forceRefresh: true })
    setMasterData((current) => ({ ...current, [slug]: records }))
  }, [])

  const loadConfiguration = React.useCallback(async (slug: ConfigurationGroupSlug, forceRefresh = false) => {
    const records = await masterDataRepository.getConfigurationRecords(slug, { forceRefresh })
    setConfigurations((current) => ({ ...current, [slug]: records }))
    return records
  }, [])

  const saveConfiguration = React.useCallback(async (slug: ConfigurationGroupSlug, input: ConfigurationRecordInput) => {
    const record = input.id
      ? await masterDataRepository.updateConfigurationRecord(slug, input)
      : await masterDataRepository.createConfigurationRecord(slug, input)
    const records = await masterDataRepository.getConfigurationRecords(slug, { forceRefresh: true })
    setConfigurations((current) => ({ ...current, [slug]: records }))
    return record
  }, [])

  const loadBusinessHours = React.useCallback(async (forceRefresh = false) => {
    const records = await masterDataRepository.getBusinessHours({ forceRefresh })
    setBusinessHours(records)
    return records
  }, [])

  const saveBusinessHours = React.useCallback(async (records: BusinessHourRecord[]) => {
    const updated = await masterDataRepository.saveBusinessHours(records)
    setBusinessHours(updated)
    return updated
  }, [])

  const loadHolidays = React.useCallback(async (forceRefresh = false) => {
    const records = await masterDataRepository.getHolidays({ forceRefresh })
    setHolidays(records)
    return records
  }, [])

  const saveHoliday = React.useCallback(async (input: HolidayRecordInput) => {
    const record = await masterDataRepository.createHoliday(input)
    const records = await masterDataRepository.getHolidays({ forceRefresh: true })
    setHolidays(records)
    return record
  }, [])

  const value = React.useMemo<MasterDataContextValue>(() => ({
    masterData,
    configurations,
    businessHours,
    holidays,
    loadMasterData,
    saveMasterData,
    removeMasterData,
    loadConfiguration,
    saveConfiguration,
    loadBusinessHours,
    saveBusinessHours,
    loadHolidays,
    saveHoliday,
  }), [
    businessHours,
    configurations,
    holidays,
    loadBusinessHours,
    loadConfiguration,
    loadHolidays,
    loadMasterData,
    removeMasterData,
    saveBusinessHours,
    saveConfiguration,
    saveHoliday,
    saveMasterData,
    masterData,
  ])

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  )
}

export function useMasterData() {
  const context = React.useContext(MasterDataContext)
  if (!context) {
    throw new Error("useMasterData must be used within a MasterDataProvider")
  }

  return context
}
