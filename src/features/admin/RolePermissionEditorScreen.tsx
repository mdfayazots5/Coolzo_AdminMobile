/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { roleRepository, Role } from "@/core/network/role-repository"
import { FullPageLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { PermissionMatrixWidget } from "@/components/shared/PermissionMatrixWidget"
import { ArrowLeft, Save, Shield, Info, Lock, Plus } from "lucide-react"
import { toast } from "sonner"
import { PermissionSet } from "@/core/auth/rbac-engine"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { getApiErrorMessage } from "@/core/network/api-error"
import { useRBAC } from "@/core/auth/RBACProvider"
import UnauthorizedScreen from "@/features/error/UnauthorizedScreen"

export default function RolePermissionEditorScreen() {
  const { id } = useParams<{ id: string }>()
  const isCreateMode = !id
  const [role, setRole] = React.useState<Role | null>(null)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [permissions, setPermissions] = React.useState<PermissionSet>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [nameError, setNameError] = React.useState("")
  const [permissionError, setPermissionError] = React.useState("")
  const navigate = useNavigate()
  const { canCreate, canEdit } = useRBAC()

  const canMutate = isCreateMode ? canCreate("settings") : canEdit("settings")

  React.useEffect(() => {
    const fetchRole = async () => {
      if (isCreateMode) {
        setRole(null)
        setName("")
        setDescription("")
        setPermissions({})
        setIsLoading(false)
        return
      }

      try {
        const data = await roleRepository.getRoleById(id!)
        if (!data) {
          throw new Error("Role not found")
        }

        setRole(data)
        setName(data.name)
        setDescription(data.description)
        setPermissions(data.permissions)
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Role not found"))
        navigate("/settings/roles")
      } finally {
        setIsLoading(false)
      }
    }

    void fetchRole()
  }, [id, isCreateMode, navigate])

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Role name is required")
      return
    }

    const hasAtLeastOnePermission = Object.values(permissions).some(
      (actions) => Array.isArray(actions) && actions.length > 0
    )
    if (!hasAtLeastOnePermission) {
      setPermissionError("Select at least one permission before saving")
      return
    }

    setNameError("")
    setPermissionError("")
    setIsSaving(true)

    try {
      if (isCreateMode) {
        const createdRole = await roleRepository.createRole({
          name: name.trim(),
          description: description.trim(),
          permissions,
          isSystem: false,
        })
        toast.success("Custom role created successfully")
        navigate(`/settings/roles/${createdRole.id}`)
      } else if (role) {
        const updatedRole = await roleRepository.updateRole(role.id, {
          name: role.isSystem ? role.name : name.trim(),
          description: role.isSystem ? role.description : description.trim(),
          permissions,
        })
        toast.success("Role permissions updated successfully")
        setRole(updatedRole)
        setName(updatedRole.name)
        setDescription(updatedRole.description)
        navigate("/settings/roles")
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save role configuration"))
    } finally {
      setIsSaving(false)
    }
  }

  if (!canMutate) {
    return <UnauthorizedScreen />
  }

  if (isLoading) return <FullPageLoader label={isCreateMode ? "Preparing role builder..." : "Loading role configuration..."} />

  const isRoleReadOnly = role?.name === "Super Admin" || role?.name === "Super Administrator"
  const lockFields = Boolean(role?.isSystem && !isCreateMode)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/settings/roles")}
          className="flex items-center gap-2 text-brand-muted hover:text-brand-navy transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Roles</span>
        </button>
        <AdminButton
          onClick={handleSave}
          isLoading={isSaving}
          iconLeft={isCreateMode ? <Plus size={18} /> : <Save size={18} />}
        >
          {isCreateMode ? "Create Role" : "Save Permissions"}
        </AdminButton>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="size-12 bg-brand-navy rounded-2xl flex items-center justify-center text-brand-gold shadow-lg">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{isCreateMode ? "Create Custom Role" : name}</h1>
          <p className="text-sm text-brand-muted">
            {isCreateMode ? "Define a live role and publish its permission matrix." : description}
          </p>
        </div>
      </div>

      {role?.isSystem && (
        <div className="flex items-center gap-3 p-4 bg-status-urgent/10 rounded-xl border border-status-urgent/20 mb-6">
          <Lock size={20} className="text-status-urgent" />
          <p className="text-xs text-brand-navy font-bold uppercase tracking-wider">
            System Role: Name and description are protected. Permission edits are limited to the live backend policy.
          </p>
        </div>
      )}

      <AdminCard className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminTextField
            label="Role Name"
            placeholder="Operations QA"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setNameError("")
            }}
            error={nameError}
            readOnly={lockFields}
          />
          <AdminTextField
            label="Description"
            placeholder="What this role is for"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            readOnly={lockFields}
          />
        </div>
      </AdminCard>

      <AdminCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border bg-brand-navy/[0.02] flex items-center justify-between">
          <SectionHeader title="Permission Matrix" className="mb-0 border-t-0 pt-0" />
          <div className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            <Info size={14} />
            Changes take effect on next login
          </div>
        </div>
        <div className="p-6 space-y-3">
          <PermissionMatrixWidget
            permissions={permissions}
            onChange={(nextPermissions) => {
              setPermissions(nextPermissions)
              setPermissionError("")
            }}
            isReadOnly={isRoleReadOnly}
          />
          {permissionError && <p className="text-[11px] font-medium text-destructive">{permissionError}</p>}
        </div>
      </AdminCard>

      <div className="flex justify-end gap-4">
        <AdminButton
          variant="secondary"
          onClick={() => navigate("/settings/roles")}
        >
          Cancel
        </AdminButton>
        <AdminButton
          onClick={handleSave}
          isLoading={isSaving}
        >
          {isCreateMode ? "Create Role" : "Apply Changes"}
        </AdminButton>
      </div>
    </div>
  )
}
