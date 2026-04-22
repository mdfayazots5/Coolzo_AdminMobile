/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Building2, Globe, MapPin, Save } from "lucide-react"
import { toast } from "sonner"
import { AdminCard } from "@/components/shared/Cards"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { AdminDropdown } from "@/components/shared/Pickers"
import { AdminButton } from "@/components/shared/AdminButton"
import { branchRepository, Branch, CreateBranchInput, UpdateBranchInput } from "@/core/network/branch-repository"
import { userRepository } from "@/core/network/user-repository"
import { UserRole } from "@/store/auth-store"
import { getApiErrorMessage } from "@/core/network/api-error"

type BranchFormState = {
  name: string
  city: string
  address: string
  managerId: string
  zones: string
  isActive: boolean
}

type FormErrors = Partial<Record<keyof BranchFormState, string>>

const emptyForm: BranchFormState = {
  name: "",
  city: "",
  address: "",
  managerId: "",
  zones: "",
  isActive: true,
}

export default function CreateBranchScreen() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()
  const [formData, setFormData] = React.useState<BranchFormState>(emptyForm)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [managers, setManagers] = React.useState<Array<{ label: string; value: string }>>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(isEditMode)

  React.useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true)

      try {
        const users = await userRepository.getUsers({ pageNumber: 1, pageSize: 200, sortBy: "name", sortOrder: "asc" })
        const managerOptions = users
          .filter((user) =>
            user.role === UserRole.OPS_MANAGER ||
            user.role === UserRole.ADMIN ||
            user.role === UserRole.SUPER_ADMIN
          )
          .map((manager) => ({ label: manager.name, value: manager.id }))

        setManagers(managerOptions)

        if (isEditMode && id) {
          const branch = await branchRepository.getBranchById(id)
          if (!branch) {
            toast.error("Branch not found")
            navigate("/settings/branches")
            return
          }

          setFormData(mapBranchToForm(branch))
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load branch setup dependencies"))
      } finally {
        setIsFetching(false)
      }
    }

    void fetchData()
  }, [id, isEditMode, navigate])

  const updateField = <K extends keyof BranchFormState>(field: K, value: BranchFormState[K]) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validateForm = () => {
    const nextErrors: FormErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = "Branch name is required"
    }

    if (!formData.city.trim()) {
      nextErrors.city = "City is required"
    }

    if (!formData.address.trim()) {
      nextErrors.address = "Address is required"
    }

    if (!formData.managerId.trim()) {
      nextErrors.managerId = "Select a branch manager"
    }

    if (!parseZones(formData.zones).length) {
      nextErrors.zones = "Add at least one service zone or pin code"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      toast.error("Please correct the highlighted fields")
      return
    }

    setIsLoading(true)

    try {
      const payload: CreateBranchInput | UpdateBranchInput = {
        name: formData.name.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        managerId: formData.managerId,
        zones: parseZones(formData.zones),
        isActive: formData.isActive,
      }

      if (isEditMode && id) {
        await branchRepository.updateBranch(id, payload)
        toast.success(`Branch ${formData.name} updated successfully`)
        navigate(`/settings/branches/${id}`)
      } else {
        const newBranch = await branchRepository.createBranch(payload)
        toast.success(`Branch ${newBranch.name} created successfully`)
        navigate(`/settings/branches/${newBranch.id}`)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, isEditMode ? "Failed to update branch" : "Failed to create branch"))
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <div className="p-20 text-center font-bold uppercase tracking-widest text-brand-muted">Loading branch configuration...</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        onClick={() => navigate(isEditMode && id ? `/settings/branches/${id}` : "/settings/branches")}
        className="group flex items-center gap-2 text-brand-muted transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
        <span className="text-xs font-bold uppercase tracking-wider">
          {isEditMode ? "Back to Branch Details" : "Back to Branches"}
        </span>
      </button>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-lg bg-brand-gold text-brand-navy shadow-lg shadow-brand-gold/20">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{isEditMode ? "Edit Branch" : "Register New Branch"}</h1>
          <p className="text-sm text-brand-muted">Operational center setup, service zones, and manager assignment.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AdminCard className="space-y-6 p-8">
          <AdminTextField
            label="Branch Official Name"
            placeholder="e.g. Hyderabad Downtown Hub"
            value={formData.name}
            onChange={(event) => updateField("name", event.target.value)}
            prefixIcon={<Building2 size={18} />}
            error={errors.name}
            required
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <AdminTextField
              label="City / Region"
              placeholder="e.g. Hyderabad"
              value={formData.city}
              onChange={(event) => updateField("city", event.target.value)}
              prefixIcon={<Globe size={18} />}
              error={errors.city}
              required
            />
            <div className="space-y-1.5">
              <AdminDropdown
                label="Branch Manager"
                options={managers}
                value={formData.managerId}
                onChange={(value) => updateField("managerId", value)}
                className="w-full"
              />
              {errors.managerId && <p className="text-xs font-medium text-destructive">{errors.managerId}</p>}
            </div>
          </div>

          <AdminTextField
            label="Full Operational Address"
            placeholder="Plot No, Street, Landmark, PIN..."
            value={formData.address}
            onChange={(event) => updateField("address", event.target.value)}
            prefixIcon={<MapPin size={18} />}
            error={errors.address}
            required
          />

          <AdminTextField
            label="Service Zones / PIN Codes"
            placeholder="500034, 500081, Jubilee Hills"
            value={formData.zones}
            onChange={(event) => updateField("zones", event.target.value)}
            helperText="Separate each zone or pin code with a comma."
            error={errors.zones}
            required
          />

          <label className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              checked={formData.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
            />
            Branch is active for service assignment
          </label>

          <div className="mt-8 border-t border-border pt-6">
            <div className="flex gap-4">
              <AdminButton
                variant="secondary"
                fullWidth
                type="button"
                onClick={() => navigate(isEditMode && id ? `/settings/branches/${id}` : "/settings/branches")}
              >
                Cancel
              </AdminButton>
              <AdminButton fullWidth type="submit" isLoading={isLoading} iconLeft={<Save size={18} />}>
                {isEditMode ? "Apply Updates" : "Confirm Registration"}
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      </form>
    </div>
  )
}

const parseZones = (rawZones: string) =>
  rawZones
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

const mapBranchToForm = (branch: Branch): BranchFormState => ({
  name: branch.name,
  city: branch.city,
  address: branch.address,
  managerId: branch.managerId || "",
  zones: branch.zones.join(", "),
  isActive: branch.isActive,
})
