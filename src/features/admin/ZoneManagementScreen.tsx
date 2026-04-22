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
import { asOptionalNumber, getMetadataBoolean, getMetadataString, getMetadataStringList, toSlugCode } from "./configuration-utils"
import { MapPinned, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface ZoneFormState {
  id?: string
  code: string
  label: string
  description: string
  city: string
  pinCodes: string
  defaultBranchId: string
  timezone: string
  sortOrder: string
  isActive: boolean
  isPublished: boolean
  serviceAvailability: boolean
}

const createEmptyForm = (sortOrder = 1): ZoneFormState => ({
  code: "",
  label: "",
  description: "",
  city: "",
  pinCodes: "",
  defaultBranchId: "",
  timezone: "Asia/Kolkata",
  sortOrder: String(sortOrder),
  isActive: true,
  isPublished: true,
  serviceAvailability: true,
})

export default function ZoneManagementScreen() {
  const { masterData, loadMasterData, saveMasterData, removeMasterData } = useMasterData()
  const [form, setForm] = React.useState<ZoneFormState>(createEmptyForm())
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const zones = React.useMemo(
    () =>
      [...(masterData["zones"] || [])].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder
        }

        return left.label.localeCompare(right.label)
      }),
    [masterData]
  )

  const resetForm = React.useCallback(
    (record?: (typeof zones)[number]) => {
      if (!record) {
        setForm(createEmptyForm(zones.length + 1))
        return
      }

      setForm({
        id: record.id,
        code: record.code,
        label: record.label,
        description: record.description,
        city: getMetadataString(record.metadata, "city"),
        pinCodes: getMetadataStringList(record.metadata, "pinCodes").join(", "),
        defaultBranchId: getMetadataString(record.metadata, "defaultBranchId"),
        timezone: getMetadataString(record.metadata, "timezone", "Asia/Kolkata"),
        sortOrder: String(record.sortOrder),
        isActive: record.isActive,
        isPublished: record.isPublished,
        serviceAvailability: getMetadataBoolean(record.metadata, "serviceAvailability", true),
      })
    },
    [zones]
  )

  React.useEffect(() => {
    const loadZones = async () => {
      try {
        await loadMasterData("zones")
      } catch (error) {
        console.error(error)
        toast.error("Unable to load zones")
      } finally {
        setIsLoading(false)
      }
    }

    void loadZones()
  }, [loadMasterData])

  React.useEffect(() => {
    if (!isLoading) {
      resetForm()
    }
  }, [isLoading, resetForm])

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast.error("Zone name is required")
      return
    }

    setIsSaving(true)
    try {
      await saveMasterData("zones", {
        id: form.id,
        code: form.code.trim() || toSlugCode(form.label),
        label: form.label.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
        isPublished: form.isPublished,
        sortOrder: asOptionalNumber(form.sortOrder),
        metadata: {
          city: form.city.trim(),
          pinCodes: form.pinCodes
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          defaultBranchId: form.defaultBranchId.trim(),
          timezone: form.timezone.trim() || "Asia/Kolkata",
          serviceAvailability: form.serviceAvailability,
        },
      })
      toast.success("Zone configuration saved")
      resetForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save zone")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsSaving(true)
    try {
      await removeMasterData("zones", id)
      toast.success("Zone removed")
      resetForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete zone")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <InlineLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Zone Management</h1>
          <p className="text-sm text-brand-muted">
            Manage serviceable zones, PIN code mapping, branch ownership, and availability flags.
          </p>
        </div>
        <AdminButton variant="secondary" onClick={() => resetForm()} iconLeft={<Plus size={18} />}>
          New Zone
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.45fr] gap-6">
        <AdminCard className="p-6 space-y-5">
          <SectionHeader title="Zone Details" icon={<MapPinned size={18} />} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminTextField
              label="Zone Code"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            />
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Zone Name</label>
              <div className="flex gap-2">
                <AdminTextField
                  className="flex-1"
                  value={form.label}
                  onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                />
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => setForm((current) => ({ ...current, code: toSlugCode(current.label) }))}
                >
                  Sync
                </AdminButton>
              </div>
            </div>
            <AdminTextField
              label="City"
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
            />
            <AdminTextField
              label="Default Branch Id"
              value={form.defaultBranchId}
              onChange={(event) => setForm((current) => ({ ...current, defaultBranchId: event.target.value }))}
            />
            <AdminTextField
              label="Timezone"
              value={form.timezone}
              onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
            />
            <AdminTextField
              label="Sort Order"
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
            />
            <div className="md:col-span-2">
              <AdminTextField
                label="PIN Codes"
                value={form.pinCodes}
                onChange={(event) => setForm((current) => ({ ...current, pinCodes: event.target.value }))}
                helperText="Comma separated values"
              />
            </div>
            <div className="md:col-span-2">
              <AdminTextField
                label="Description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
              />
              Published
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input
                type="checkbox"
                checked={form.serviceAvailability}
                onChange={(event) => setForm((current) => ({ ...current, serviceAvailability: event.target.checked }))}
              />
              Service Available
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <AdminButton onClick={handleSave} isLoading={isSaving} iconLeft={<Save size={18} />}>
              {form.id ? "Update Zone" : "Create Zone"}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => resetForm()}>
              Clear Form
            </AdminButton>
          </div>
        </AdminCard>

        <div className="space-y-4">
          <SectionHeader title="Configured Zones" icon={<MapPinned size={18} />} />
          {zones.length === 0 ? (
            <AdminCard className="p-8 text-center">
              <p className="text-sm font-medium text-brand-muted">No zones configured yet.</p>
            </AdminCard>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {zones.map((zone) => (
                <AdminCard key={zone.id} className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-brand-navy">{zone.label}</h3>
                        <StatusBadge status={zone.isActive ? "completed" : "cancelled"}>
                          {zone.isActive ? "active" : "inactive"}
                        </StatusBadge>
                        {!getMetadataBoolean(zone.metadata, "serviceAvailability", true) && (
                          <StatusBadge status="urgent">paused</StatusBadge>
                        )}
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">{zone.code}</p>
                      <p className="text-sm text-brand-muted">
                        {getMetadataString(zone.metadata, "city", "Unknown city")} · {getMetadataString(zone.metadata, "timezone", "Asia/Kolkata")}
                      </p>
                      <p className="text-xs text-brand-navy">
                        Branch: {getMetadataString(zone.metadata, "defaultBranchId", "Not linked")}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {getMetadataStringList(zone.metadata, "pinCodes").map((pinCode) => (
                          <span
                            key={`${zone.id}-${pinCode}`}
                            className="rounded-full border border-brand-navy/10 bg-brand-navy/5 px-2.5 py-1 text-[11px] font-semibold text-brand-navy"
                          >
                            {pinCode}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminButton type="button" variant="secondary" size="sm" onClick={() => resetForm(zone)}>
                        Edit
                      </AdminButton>
                      <AdminButton
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDelete(zone.id)}
                        iconLeft={<Trash2 size={14} />}
                      >
                        Delete
                      </AdminButton>
                    </div>
                  </div>
                </AdminCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
