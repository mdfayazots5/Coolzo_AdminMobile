/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { StatusBadge } from "@/components/shared/Badges"
import { useMasterData } from "@/core/master-data/MasterDataProvider"
import { asOptionalNumber, getMetadataNumber, getMetadataString } from "./configuration-utils"
import { CalendarClock, Clock3, Plus, Save } from "lucide-react"
import { toast } from "sonner"

interface SlotRuleFormState {
  id?: string
  key: string
  label: string
  slotDurationMinutes: string
  bufferMinutes: string
  maxConcurrentPerTech: string
  advanceBookingWindowDays: string
  isActive: boolean
}

const WEEK_DAYS = [
  { dayOfWeekNumber: 1, dayName: "Monday" },
  { dayOfWeekNumber: 2, dayName: "Tuesday" },
  { dayOfWeekNumber: 3, dayName: "Wednesday" },
  { dayOfWeekNumber: 4, dayName: "Thursday" },
  { dayOfWeekNumber: 5, dayName: "Friday" },
  { dayOfWeekNumber: 6, dayName: "Saturday" },
  { dayOfWeekNumber: 0, dayName: "Sunday" },
]

const createDefaultHours = () =>
  WEEK_DAYS.map((day) => ({
    id: `${day.dayOfWeekNumber}`,
    dayOfWeekNumber: day.dayOfWeekNumber,
    dayName: day.dayName,
    startTimeLocal: day.dayOfWeekNumber === 0 ? null : "09:00",
    endTimeLocal: day.dayOfWeekNumber === 0 ? null : "18:00",
    isClosed: day.dayOfWeekNumber === 0,
  }))

const mergeBusinessHours = (
  records: {
    id: string
    dayOfWeekNumber: number
    dayName: string
    startTimeLocal?: string | null
    endTimeLocal?: string | null
    isClosed: boolean
  }[]
) =>
  WEEK_DAYS.map((day) => {
    const existing = records.find((record) => record.dayOfWeekNumber === day.dayOfWeekNumber)
    return existing || {
      id: `${day.dayOfWeekNumber}`,
      dayOfWeekNumber: day.dayOfWeekNumber,
      dayName: day.dayName,
      startTimeLocal: day.dayOfWeekNumber === 0 ? null : "09:00",
      endTimeLocal: day.dayOfWeekNumber === 0 ? null : "18:00",
      isClosed: day.dayOfWeekNumber === 0,
    }
  })

const createEmptySlotForm = (): SlotRuleFormState => ({
  key: "weekday-default",
  label: "Default Working Slots",
  slotDurationMinutes: "120",
  bufferMinutes: "15",
  maxConcurrentPerTech: "3",
  advanceBookingWindowDays: "14",
  isActive: true,
})

export default function BusinessHoursScreen() {
  const {
    businessHours,
    holidays,
    configurations,
    loadBusinessHours,
    saveBusinessHours,
    loadHolidays,
    saveHoliday,
    loadConfiguration,
    saveConfiguration,
  } = useMasterData()
  const [hoursForm, setHoursForm] = React.useState(createDefaultHours())
  const [slotForm, setSlotForm] = React.useState<SlotRuleFormState>(createEmptySlotForm())
  const [holidayDate, setHolidayDate] = React.useState("")
  const [holidayName, setHolidayName] = React.useState("")
  const [isRecurringAnnually, setIsRecurringAnnually] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const slotRules = React.useMemo(
    () =>
      [...(configurations["slot-availability"] || [])].sort((left, right) =>
        left.key.localeCompare(right.key)
      ),
    [configurations]
  )

  const resetSlotForm = React.useCallback((record?: (typeof slotRules)[number]) => {
    if (!record) {
      setSlotForm(createEmptySlotForm())
      return
    }

    setSlotForm({
      id: record.id,
      key: record.key,
      label: getMetadataString(record.metadata, "label", record.key),
      slotDurationMinutes: String(getMetadataNumber(record.metadata, "slotDurationMinutes", 120)),
      bufferMinutes: String(getMetadataNumber(record.metadata, "bufferMinutes", 15)),
      maxConcurrentPerTech: String(getMetadataNumber(record.metadata, "maxConcurrentPerTech", 3)),
      advanceBookingWindowDays: String(getMetadataNumber(record.metadata, "advanceBookingWindowDays", 14)),
      isActive: record.isActive,
    })
  }, [slotRules])

  React.useEffect(() => {
    const loadConfigurationData = async () => {
      try {
        const [loadedHours, , loadedSlots] = await Promise.all([
          loadBusinessHours(),
          loadHolidays(),
          loadConfiguration("slot-availability"),
        ])

        setHoursForm(mergeBusinessHours(loadedHours))
        resetSlotForm(loadedSlots[0])
      } catch (error) {
        console.error(error)
        toast.error("Unable to load working-hours configuration")
      } finally {
        setIsLoading(false)
      }
    }

    void loadConfigurationData()
  }, [loadBusinessHours, loadConfiguration, loadHolidays, resetSlotForm])

  React.useEffect(() => {
    if (!isLoading) {
      setHoursForm(mergeBusinessHours(businessHours))
    }
  }, [businessHours, isLoading])

  const handleHourChange = (
    dayOfWeekNumber: number,
    field: "startTimeLocal" | "endTimeLocal" | "isClosed",
    value: string | boolean
  ) => {
    setHoursForm((current) =>
      current.map((item) => {
        if (item.dayOfWeekNumber !== dayOfWeekNumber) {
          return item
        }

        if (field === "isClosed") {
          return {
            ...item,
            isClosed: Boolean(value),
            startTimeLocal: value ? null : item.startTimeLocal || "09:00",
            endTimeLocal: value ? null : item.endTimeLocal || "18:00",
          }
        }

        return {
          ...item,
          [field]: String(value),
        }
      })
    )
  }

  const handleSaveHours = async () => {
    setIsSaving(true)
    try {
      await saveBusinessHours(hoursForm)
      toast.success("Business hours updated")
    } catch (error) {
      console.error(error)
      toast.error("Failed to save business hours")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSlotRules = async () => {
    if (!slotForm.key.trim()) {
      toast.error("Slot rule key is required")
      return
    }

    setIsSaving(true)
    try {
      await saveConfiguration("slot-availability", {
        id: slotForm.id,
        key: slotForm.key.trim(),
        valueType: "json",
        isActive: slotForm.isActive,
        metadata: {
          label: slotForm.label.trim(),
          slotDurationMinutes: asOptionalNumber(slotForm.slotDurationMinutes),
          bufferMinutes: asOptionalNumber(slotForm.bufferMinutes),
          maxConcurrentPerTech: asOptionalNumber(slotForm.maxConcurrentPerTech),
          advanceBookingWindowDays: asOptionalNumber(slotForm.advanceBookingWindowDays),
        },
      })
      toast.success("Slot rule saved")
      resetSlotForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save slot rule")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateHoliday = async () => {
    if (!holidayDate || !holidayName.trim()) {
      toast.error("Holiday date and name are required")
      return
    }

    setIsSaving(true)
    try {
      await saveHoliday({
        holidayDate,
        holidayName: holidayName.trim(),
        isRecurringAnnually,
        isActive: true,
      })
      setHolidayDate("")
      setHolidayName("")
      setIsRecurringAnnually(true)
      toast.success("Holiday created")
    } catch (error) {
      console.error(error)
      toast.error("Failed to create holiday")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <InlineLoader />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Business Hours & Slot Rules</h1>
        <p className="text-sm text-brand-muted">
          Configure operating days, holiday exceptions, and slot-generation rules for dispatch and booking.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.9fr] gap-6">
        <div className="space-y-6">
          <AdminCard className="p-6 space-y-5">
            <SectionHeader title="Business Hours" icon={<Clock3 size={18} />} />
            <div className="space-y-3">
              {hoursForm.map((day) => (
                <div
                  key={day.dayOfWeekNumber}
                  className="grid grid-cols-1 md:grid-cols-[160px_1fr_1fr_120px] gap-3 items-center rounded-2xl border border-border p-4"
                >
                  <p className="text-sm font-bold text-brand-navy">{day.dayName}</p>
                  <AdminTextField
                    label="Start"
                    type="time"
                    value={day.startTimeLocal || ""}
                    readOnly={day.isClosed}
                    onChange={(event) => handleHourChange(day.dayOfWeekNumber, "startTimeLocal", event.target.value)}
                  />
                  <AdminTextField
                    label="End"
                    type="time"
                    value={day.endTimeLocal || ""}
                    readOnly={day.isClosed}
                    onChange={(event) => handleHourChange(day.dayOfWeekNumber, "endTimeLocal", event.target.value)}
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-brand-navy pt-4 md:pt-0">
                    <input
                      type="checkbox"
                      checked={day.isClosed}
                      onChange={(event) => handleHourChange(day.dayOfWeekNumber, "isClosed", event.target.checked)}
                    />
                    Closed
                  </label>
                </div>
              ))}
            </div>
            <AdminButton onClick={handleSaveHours} isLoading={isSaving} iconLeft={<Save size={18} />}>
              Save Business Hours
            </AdminButton>
          </AdminCard>

          <AdminCard className="p-6 space-y-5">
            <SectionHeader title="Slot Availability Rules" icon={<CalendarClock size={18} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminTextField
                label="Rule Key"
                value={slotForm.key}
                onChange={(event) => setSlotForm((current) => ({ ...current, key: event.target.value }))}
              />
              <AdminTextField
                label="Rule Label"
                value={slotForm.label}
                onChange={(event) => setSlotForm((current) => ({ ...current, label: event.target.value }))}
              />
              <AdminTextField
                label="Slot Duration (Minutes)"
                type="number"
                value={slotForm.slotDurationMinutes}
                onChange={(event) => setSlotForm((current) => ({ ...current, slotDurationMinutes: event.target.value }))}
              />
              <AdminTextField
                label="Buffer Minutes"
                type="number"
                value={slotForm.bufferMinutes}
                onChange={(event) => setSlotForm((current) => ({ ...current, bufferMinutes: event.target.value }))}
              />
              <AdminTextField
                label="Max Concurrent Per Tech"
                type="number"
                value={slotForm.maxConcurrentPerTech}
                onChange={(event) => setSlotForm((current) => ({ ...current, maxConcurrentPerTech: event.target.value }))}
              />
              <AdminTextField
                label="Advance Booking Window (Days)"
                type="number"
                value={slotForm.advanceBookingWindowDays}
                onChange={(event) => setSlotForm((current) => ({ ...current, advanceBookingWindowDays: event.target.value }))}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input
                type="checkbox"
                checked={slotForm.isActive}
                onChange={(event) => setSlotForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active rule
            </label>
            <div className="flex flex-wrap gap-3">
              <AdminButton onClick={handleSaveSlotRules} isLoading={isSaving} iconLeft={<Save size={18} />}>
                {slotForm.id ? "Update Slot Rule" : "Create Slot Rule"}
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={() => resetSlotForm()}>
                Clear Form
              </AdminButton>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <SectionHeader title="Holiday Calendar" icon={<CalendarClock size={18} />} className="mb-0 border-t-0 pt-0" />
              <AdminButton size="sm" variant="secondary" onClick={() => {
                setHolidayDate("")
                setHolidayName("")
                setIsRecurringAnnually(true)
              }} iconLeft={<Plus size={14} />}>
                New Holiday
              </AdminButton>
            </div>
            <AdminTextField
              label="Holiday Date"
              type="date"
              value={holidayDate}
              onChange={(event) => setHolidayDate(event.target.value)}
            />
            <AdminTextField
              label="Holiday Name"
              value={holidayName}
              onChange={(event) => setHolidayName(event.target.value)}
            />
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input
                type="checkbox"
                checked={isRecurringAnnually}
                onChange={(event) => setIsRecurringAnnually(event.target.checked)}
              />
              Recurs annually
            </label>
            <AdminButton onClick={handleCreateHoliday} isLoading={isSaving}>
              Save Holiday
            </AdminButton>

            <div className="space-y-3 pt-2">
              {holidays.length === 0 ? (
                <p className="text-sm text-brand-muted">No holidays configured yet.</p>
              ) : (
                [...holidays]
                  .sort((left, right) => left.holidayDate.localeCompare(right.holidayDate))
                  .map((holiday) => (
                    <div key={holiday.id} className="rounded-2xl border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-brand-navy">{holiday.holidayName}</p>
                          <p className="text-xs text-brand-muted">{holiday.holidayDate}</p>
                        </div>
                        <StatusBadge status={holiday.isActive ? "completed" : "cancelled"}>
                          {holiday.isRecurringAnnually ? "recurring" : "one-off"}
                        </StatusBadge>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-6 space-y-4">
            <SectionHeader title="Existing Slot Rules" icon={<Clock3 size={18} />} />
            {slotRules.length === 0 ? (
              <p className="text-sm text-brand-muted">No slot rules configured yet.</p>
            ) : (
              slotRules.map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => resetSlotForm(rule)}
                  className="w-full rounded-2xl border border-border p-4 text-left transition-all hover:border-brand-gold"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        {getMetadataString(rule.metadata, "label", rule.key)}
                      </p>
                      <p className="text-xs text-brand-muted">{rule.key}</p>
                    </div>
                    <StatusBadge status={rule.isActive ? "completed" : "cancelled"}>
                      {rule.isActive ? "active" : "inactive"}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-navy">
                    <span>{getMetadataNumber(rule.metadata, "slotDurationMinutes", 0)} min slots</span>
                    <span>{getMetadataNumber(rule.metadata, "bufferMinutes", 0)} min buffer</span>
                    <span>{getMetadataNumber(rule.metadata, "maxConcurrentPerTech", 0)} max per tech</span>
                    <span>{getMetadataNumber(rule.metadata, "advanceBookingWindowDays", 0)} day window</span>
                  </div>
                </button>
              ))
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
