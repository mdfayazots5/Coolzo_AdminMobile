/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { AdminCard } from "@/components/shared/Cards"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { AdminDropdown } from "@/components/shared/Pickers"
import { AdminButton } from "@/components/shared/AdminButton"
import { roleRepository, Role } from "@/core/network/role-repository"
import { CreateUserInput, UpdateUserInput, userRepository } from "@/core/network/user-repository"
import { branchRepository, Branch } from "@/core/network/branch-repository"
import { ArrowLeft, UserPlus, Mail, Shield, Save, Edit3, AtSign } from "lucide-react"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/core/network/api-error"
import { useRBAC } from "@/core/auth/RBACProvider"
import UnauthorizedScreen from "@/features/error/UnauthorizedScreen"

type FormErrors = Partial<Record<"fullName" | "userName" | "email" | "password" | "roleIds" | "branchId", string>>

type UserFormState = {
  fullName: string
  userName: string
  email: string
  password: string
  isActive: boolean
  roleIds: string[]
  branchId: string
}

const emptyForm: UserFormState = {
  fullName: "",
  userName: "",
  email: "",
  password: "",
  isActive: true,
  roleIds: [],
  branchId: "",
}

export default function CreateUserScreen() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const location = useLocation()
  const isTeamRoute = location.pathname.startsWith("/team")
  const navigate = useNavigate()
  const [formData, setFormData] = React.useState<UserFormState>(emptyForm)
  const [roles, setRoles] = React.useState<Role[]>([])
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(true)
  const { canCreate, canEdit } = useRBAC()

  const listPath = isTeamRoute ? "/team" : "/settings/users"
  const detailPath = (userId: string) => isTeamRoute ? `/team/${userId}` : `/settings/users/${userId}`
  const canMutate = isEditMode ? canEdit("settings") : canCreate("settings")

  React.useEffect(() => {
    const fetchDependencies = async () => {
      setIsFetching(true)

      try {
        const roleData = await roleRepository.getRoles()
        const branchData = await branchRepository.getBranches()
        setRoles(roleData)
        setBranches(branchData)

        if (isEditMode && id) {
          const user = await userRepository.getUserById(id)

          if (!user) {
            toast.error("User not found")
            navigate(listPath)
            return
          }

          setFormData({
            fullName: user.name,
            userName: user.userName,
            email: user.email,
            password: "",
            isActive: user.status === "active",
            roleIds: user.roleIds,
            branchId: user.branchId || branchData[0]?.id || "",
          })
          return
        }

        if (isTeamRoute && roleData.length > 0) {
          const technicianRole = roleData.find((role) => role.name.toLowerCase().includes("technician"))
          if (technicianRole) {
            setFormData((current) => ({
              ...current,
              roleIds: [technicianRole.id],
              branchId: current.branchId || branchData[0]?.id || "",
            }))
          }
        } else {
          setFormData((current) => ({
            ...current,
            branchId: current.branchId || branchData[0]?.id || "",
          }))
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load user setup dependencies"))
      } finally {
        setIsFetching(false)
      }
    }

    void fetchDependencies()
  }, [id, isEditMode, isTeamRoute, listPath, navigate])

  const updateField = <K extends keyof UserFormState>(field: K, value: UserFormState[K]) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const toggleRole = (roleId: string) => {
    updateField(
      "roleIds",
      formData.roleIds.includes(roleId)
        ? formData.roleIds.filter((value) => value !== roleId)
        : [...formData.roleIds, roleId]
    )
  }

  const validateForm = () => {
    const nextErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required"
    }

    if (!isEditMode && !formData.userName.trim()) {
      nextErrors.userName = "Username is required"
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid email address"
    }

    if (!isEditMode && !formData.password.trim()) {
      nextErrors.password = "Temporary password is required"
    } else if (!isEditMode && formData.password.trim().length < 8) {
      nextErrors.password = "Temporary password must be at least 8 characters"
    }

    if (formData.roleIds.length === 0) {
      nextErrors.roleIds = "Select at least one role"
    }

    if (!formData.branchId.trim()) {
      nextErrors.branchId = "Select a branch"
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
      if (isEditMode && id) {
        const payload: UpdateUserInput = {
          email: formData.email,
          fullName: formData.fullName,
          isActive: formData.isActive,
          roleIds: formData.roleIds,
          branchId: formData.branchId || undefined,
        }

        await userRepository.updateUser(id, payload)
        toast.success(`User ${formData.fullName} updated successfully`)
        navigate(detailPath(id))
      } else {
        const payload: CreateUserInput = {
          userName: formData.userName,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
          isActive: formData.isActive,
          roleIds: formData.roleIds,
          branchId: formData.branchId || undefined,
        }

        const newUser = await userRepository.createUser(payload)
        toast.success(`User ${newUser.name} onboarded successfully`)
        navigate(detailPath(newUser.id))
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, isEditMode ? "Failed to update user" : "Failed to create user"))
    } finally {
      setIsLoading(false)
    }
  }

  if (!canMutate) {
    return <UnauthorizedScreen />
  }

  if (isFetching) return <div className="p-20 text-center text-brand-muted">Loading profile data...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(isEditMode && id ? detailPath(id) : listPath)}
        className="flex items-center gap-2 text-brand-muted hover:text-brand-navy transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-wider">{isEditMode ? "Back to Profile" : "Back to Staff List"}</span>
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="size-12 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-navy shadow-lg shadow-brand-gold/20">
          {isEditMode ? <Edit3 size={24} /> : <UserPlus size={24} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{isEditMode ? "Edit User Profile" : "Onboard New User"}</h1>
          <p className="text-sm text-brand-muted">
            {isEditMode ? "Update access roles, branch scope, and account status" : "Create a live internal user account with role-based access"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AdminCard className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminTextField
              label="Full Name"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              prefixIcon={<UserPlus size={18} />}
              error={errors.fullName}
              required
            />
            <AdminTextField
              label="Email Address"
              placeholder="john@coolzo.com"
              type="email"
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
              prefixIcon={<Mail size={18} />}
              error={errors.email}
              required
            />
            <AdminTextField
              label="Username"
              placeholder="john.doe"
              value={formData.userName}
              onChange={(event) => updateField("userName", event.target.value)}
              prefixIcon={<AtSign size={18} />}
              error={errors.userName}
              required
              readOnly={isEditMode}
              helperText={isEditMode ? "Username is immutable after account creation." : undefined}
            />
            <div className="space-y-1.5">
              <AdminDropdown
                label="Branch Scope"
                options={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
                value={formData.branchId}
                onChange={(value) => updateField("branchId", value)}
                className="w-full"
              />
              {errors.branchId && <p className="text-xs font-medium text-destructive">{errors.branchId}</p>}
            </div>
            {!isEditMode && (
              <div className="md:col-span-2">
                <AdminTextField
                  label="Temporary Password"
                  placeholder="Minimum 8 characters"
                  type="password"
                  value={formData.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  prefixIcon={<Shield size={18} />}
                  error={errors.password}
                  helperText="This is stored immediately and should be changed by the user after first login."
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Role Assignments</p>
                <p className="text-xs text-brand-muted mt-1">Select one or more live roles from the backend permission model.</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={formData.isActive}
                  onChange={(event) => updateField("isActive", event.target.checked)}
                />
                Active account
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="group" aria-label="Role assignments">
              {roles.map((role) => {
                const checked = formData.roleIds.includes(role.id)

                return (
                  <label
                    key={role.id}
                    className={`rounded-2xl border p-4 cursor-pointer transition-colors ${
                      checked
                        ? "border-brand-gold bg-brand-gold/10"
                        : "border-border bg-brand-surface hover:border-brand-navy/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 size-4 rounded border-input"
                        checked={checked}
                        onChange={() => toggleRole(role.id)}
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-brand-navy">{role.name}</p>
                        <p className="text-xs text-brand-muted">{role.description || "Role permission set"}</p>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
            {errors.roleIds && <p className="text-[11px] font-medium text-destructive">{errors.roleIds}</p>}
          </div>

          <div className="pt-6 border-t border-border">
            {!isEditMode && (
              <div className="flex items-center gap-3 p-4 bg-brand-navy/5 rounded-xl mb-8">
                <Shield size={20} className="text-brand-gold" />
                <p className="text-xs text-brand-navy leading-relaxed">
                  User creation is live. The supplied credentials are sent directly to the backend and the selected roles are applied immediately.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <AdminButton
                variant="secondary"
                fullWidth
                type="button"
                onClick={() => navigate(isEditMode && id ? detailPath(id) : listPath)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                fullWidth
                type="submit"
                isLoading={isLoading}
                iconLeft={isEditMode ? <Save size={18} /> : <UserPlus size={18} />}
              >
                {isEditMode ? "Save Changes" : "Create User"}
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      </form>
    </div>
  )
}
