/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Plus, Save, Trash2, UserCog } from "lucide-react"
import { toast } from "sonner"
import { AdminCard } from "@/components/shared/Cards"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { AdminDropdown } from "@/components/shared/Pickers"
import { AdminButton } from "@/components/shared/AdminButton"
import { InlineLoader } from "@/components/shared/Layout"
import { bookingLookupRepository, BookingZoneLookup } from "@/core/network/booking-lookup-repository"
import {
  CreateTechnicianInput,
  TechnicianSkillCategory,
  technicianRepository,
  TechnicianSkillInput,
  UpdateTechnicianInput,
} from "@/core/network/technician-repository"
import { getApiErrorMessage } from "@/core/network/api-error"

type FormErrors = Partial<Record<"name" | "phone" | "email" | "baseZoneId" | "maxDailyAssignments", string>>

type FormState = {
  name: string
  phone: string
  email: string
  baseZoneId: string
  maxDailyAssignments: string
  isActive: boolean
}

const emptyForm: FormState = {
  name: "",
  phone: "",
  email: "",
  baseZoneId: "",
  maxDailyAssignments: "4",
  isActive: false,
}

const skillCategoryOptions: { label: string; value: TechnicianSkillCategory }[] = [
  { label: "Brand", value: "brand" },
  { label: "Equipment", value: "equipment" },
  { label: "Special", value: "special" },
]

export default function TechnicianEditorScreen() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [zones, setZones] = React.useState<BookingZoneLookup[]>([])
  const [selectedZoneIds, setSelectedZoneIds] = React.useState<string[]>([])
  const [skills, setSkills] = React.useState<TechnicianSkillInput[]>([])
  const [newSkillName, setNewSkillName] = React.useState("")
  const [newSkillCode, setNewSkillCode] = React.useState("")
  const [newSkillCategory, setNewSkillCategory] = React.useState<TechnicianSkillCategory>("brand")
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isFetching, setIsFetching] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    const load = async () => {
      setIsFetching(true)
      try {
        const zoneData = await bookingLookupRepository.getZones()
        setZones(zoneData)

        if (!isEditMode || !id) {
          setIsFetching(false)
          return
        }

        const technician = await technicianRepository.getTechnicianById(id)
        if (!technician) {
          toast.error("Technician not found")
          navigate("/team")
          return
        }

        setForm({
          name: technician.name,
          phone: technician.phone,
          email: technician.email,
          baseZoneId: technician.zoneAssignments.find((zone) => zone.isPrimary)?.zoneId || technician.zoneAssignments[0]?.zoneId || "",
          maxDailyAssignments: String(technician.maxDailyAssignments),
          isActive: technician.isActive,
        })
        setSelectedZoneIds(technician.zoneAssignments.map((zone) => zone.zoneId))
        setSkills(
          technician.skills.map((skill) => ({
            code: skill.code,
            name: skill.name,
            category: skill.category,
            certifiedDate: skill.certifiedDate,
          }))
        )
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load technician setup"))
      } finally {
        setIsFetching(false)
      }
    }

    void load()
  }, [id, isEditMode, navigate])

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const toggleZone = (zoneId: string) => {
    setSelectedZoneIds((current) => {
      const nextZoneIds = current.includes(zoneId)
        ? current.filter((item) => item !== zoneId)
        : [...current, zoneId]

      if (nextZoneIds.length === 0) {
        updateField("baseZoneId", "")
      } else if (!nextZoneIds.includes(form.baseZoneId)) {
        updateField("baseZoneId", nextZoneIds[0])
      } else if (!form.baseZoneId) {
        updateField("baseZoneId", nextZoneIds[0])
      }

      return nextZoneIds
    })
  }

  const addSkill = () => {
    if (!newSkillName.trim()) {
      return
    }

    setSkills((current) => [
      ...current,
      {
        code: newSkillCode.trim(),
        name: newSkillName.trim(),
        category: newSkillCategory,
      },
    ])
    setNewSkillName("")
    setNewSkillCode("")
    setNewSkillCategory("brand")
  }

  const removeSkill = (index: number) => {
    setSkills((current) => current.filter((_, skillIndex) => skillIndex !== index))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = "Technician name is required"
    }

    const normalizedPhone = form.phone.replace(/\D/g, "")
    if (normalizedPhone.length < 8 || normalizedPhone.length > 16) {
      nextErrors.phone = "Enter a valid mobile number"
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address"
    }

    if (!form.baseZoneId) {
      nextErrors.baseZoneId = "Select a primary zone"
    }

    if (selectedZoneIds.length === 0) {
      nextErrors.baseZoneId = "Assign at least one service zone"
    }

    const maxAssignments = Number(form.maxDailyAssignments)
    if (!Number.isInteger(maxAssignments) || maxAssignments < 1 || maxAssignments > 16) {
      nextErrors.maxDailyAssignments = "Assignments must be between 1 and 16"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validate()) {
      toast.error("Please correct the highlighted fields")
      return
    }

    setIsSaving(true)
    try {
      if (isEditMode && id) {
        const payload: UpdateTechnicianInput = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          baseZoneId: form.baseZoneId || undefined,
          maxDailyAssignments: Number(form.maxDailyAssignments),
          isActive: form.isActive,
        }

        await technicianRepository.updateTechnician(id, payload)
        await technicianRepository.updateZones(id, selectedZoneIds, form.baseZoneId)
        await technicianRepository.updateSkills(id, skills)
        toast.success("Technician profile updated")
        navigate(`/team/${id}`)
      } else {
        const payload: CreateTechnicianInput = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          baseZoneId: form.baseZoneId || undefined,
          maxDailyAssignments: Number(form.maxDailyAssignments),
          skills,
          zoneIds: selectedZoneIds,
        }

        const created = await technicianRepository.createTechnician(payload)
        toast.success("Technician profile created")
        navigate(`/team/${created.id}`)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, isEditMode ? "Unable to update technician" : "Unable to create technician"))
    } finally {
      setIsSaving(false)
    }
  }

  if (isFetching) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <button
        onClick={() => navigate(isEditMode && id ? `/team/${id}` : "/team")}
        className="flex items-center gap-2 text-brand-muted hover:text-brand-navy transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-wider">{isEditMode ? "Back to Technician" : "Back to Team"}</span>
      </button>

      <div className="flex items-center gap-4">
        <div className="size-12 rounded-2xl bg-brand-gold text-brand-navy flex items-center justify-center shadow-lg shadow-brand-gold/20">
          <UserCog size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{isEditMode ? "Edit Technician Profile" : "Create Technician Profile"}</h1>
          <p className="text-sm text-brand-muted">
            {isEditMode
              ? "Update technician identity, zone coverage, activation state, and skill tags."
              : "Create a technician profile with initial zone assignments and skill tags."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminCard className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminTextField
              label="Technician Name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              error={errors.name}
              required
            />
            <AdminTextField
              label="Mobile Number"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              error={errors.phone}
              required
            />
            <AdminTextField
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              error={errors.email}
            />
            <AdminTextField
              label="Max Daily Assignments"
              type="number"
              min={1}
              max={16}
              value={form.maxDailyAssignments}
              onChange={(event) => updateField("maxDailyAssignments", event.target.value)}
              error={errors.maxDailyAssignments}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminDropdown
              label="Primary Zone"
              options={zones.map((zone) => ({
                label: `${zone.name}${zone.cityName ? ` • ${zone.cityName}` : ""}`,
                value: zone.id,
              }))}
              value={form.baseZoneId}
              onChange={(value) => {
                updateField("baseZoneId", value)
                setSelectedZoneIds((current) => current.includes(value) ? current : [...current, value])
              }}
              placeholder="Select primary zone"
            />

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Active Technician</label>
              <label className="flex h-10 items-center gap-3 rounded-[8px] border border-input bg-brand-surface px-4 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateField("isActive", event.target.checked)}
                  className="size-4 rounded border-border"
                />
                <span className="text-brand-navy font-medium">Allow dispatching this technician</span>
              </label>
            </div>
          </div>
          {errors.baseZoneId && <p className="text-[11px] font-medium text-destructive">{errors.baseZoneId}</p>}
        </AdminCard>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AdminCard className="p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-brand-navy">Zone Assignment Manager</h2>
              <p className="text-sm text-brand-muted">Technicians can cover more than one service zone, with one primary dispatch base.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {zones.map((zone) => {
                const isChecked = selectedZoneIds.includes(zone.id)
                const isPrimary = form.baseZoneId === zone.id

                return (
                  <label
                    key={zone.id}
                    className="rounded-2xl border border-border p-4 flex items-start gap-3 cursor-pointer hover:border-brand-gold transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleZone(zone.id)}
                      className="mt-1 size-4"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-navy">{zone.name}</p>
                      <p className="text-[11px] text-brand-muted uppercase tracking-widest">{zone.cityName || zone.code || "Zone"}</p>
                      {isPrimary && <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest mt-2">Primary Dispatch Zone</p>}
                    </div>
                  </label>
                )
              })}
            </div>
          </AdminCard>

          <AdminCard className="p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-brand-navy">Skill Tag Manager</h2>
              <p className="text-sm text-brand-muted">Capture brand, equipment, and special-service skills used in availability and dispatch views.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.2fr,1fr,auto] gap-3 items-end">
              <AdminTextField
                label="Skill Name"
                value={newSkillName}
                onChange={(event) => setNewSkillName(event.target.value)}
                placeholder="Daikin Certified"
              />
              <AdminDropdown
                label="Category"
                options={skillCategoryOptions}
                value={newSkillCategory}
                onChange={(value) => setNewSkillCategory(value as TechnicianSkillCategory)}
              />
              <AdminButton type="button" onClick={addSkill} iconLeft={<Plus size={16} />}>
                Add Skill
              </AdminButton>
            </div>

            <AdminTextField
              label="Skill Code"
              value={newSkillCode}
              onChange={(event) => setNewSkillCode(event.target.value)}
              placeholder="Optional short code"
            />

            <div className="space-y-3">
              {skills.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-brand-muted">
                  No skill tags added yet.
                </div>
              ) : (
                skills.map((skill, index) => (
                  <div key={`${skill.name}-${index}`} className="rounded-2xl border border-border p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">{skill.name}</p>
                      <p className="text-[10px] text-brand-muted uppercase tracking-widest">{skill.category}{skill.code ? ` • ${skill.code}` : ""}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="p-2 rounded-full text-brand-muted hover:text-status-emergency hover:bg-status-emergency/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </AdminCard>
        </div>

        <div className="flex justify-end gap-3">
          <AdminButton type="button" variant="outline" onClick={() => navigate(isEditMode && id ? `/team/${id}` : "/team")}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" disabled={isSaving} iconLeft={<Save size={16} />}>
            {isSaving ? "Saving..." : isEditMode ? "Save Technician" : "Create Technician"}
          </AdminButton>
        </div>
      </form>
    </div>
  )
}
