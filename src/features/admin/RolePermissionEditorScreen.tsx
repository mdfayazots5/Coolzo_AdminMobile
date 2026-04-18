/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { roleRepository, Role } from "@/core/network/role-repository"
import { FullPageLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { PermissionMatrixWidget } from "@/components/shared/PermissionMatrixWidget"
import { ArrowLeft, Save, Shield, Info, Lock } from "lucide-react"
import { toast } from "sonner"
import { PermissionSet } from "@/core/auth/rbac-engine"

export default function RolePermissionEditorScreen() {
  const { id } = useParams<{ id: string }>()
  const [role, setRole] = React.useState<Role | null>(null)
  const [permissions, setPermissions] = React.useState<PermissionSet>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchRole = async () => {
      if (!id) return
      try {
        const data = await roleRepository.getRoleById(id)
        if (data) {
          setRole(data)
          setPermissions(data.permissions)
        }
      } catch (error) {
        toast.error("Role not found")
        navigate("/settings/roles")
      } finally {
        setIsLoading(false)
      }
    }
    fetchRole()
  }, [id, navigate])

  const handleSave = async () => {
    if (!role) return
    setIsSaving(true)
    try {
      await roleRepository.updateRole(role.id, { permissions })
      toast.success("Role permissions updated successfully")
      navigate("/settings/roles")
    } catch (error) {
      toast.error("Failed to update permissions")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <FullPageLoader label="Loading role configuration..." />
  if (!role) return null

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
          iconLeft={<Save size={18} />}
        >
          Save Permissions
        </AdminButton>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="size-12 bg-brand-navy rounded-2xl flex items-center justify-center text-brand-gold shadow-lg">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{role.name}</h1>
          <p className="text-sm text-brand-muted">{role.description}</p>
        </div>
      </div>

      {role.isSystem && (
        <div className="flex items-center gap-3 p-4 bg-status-urgent/10 rounded-xl border border-status-urgent/20 mb-6">
          <Lock size={20} className="text-status-urgent" />
          <p className="text-xs text-brand-navy font-bold uppercase tracking-wider">
            System Role: Core permissions are protected and cannot be fully modified.
          </p>
        </div>
      )}

      <AdminCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border bg-brand-navy/[0.02] flex items-center justify-between">
          <SectionHeader title="Permission Matrix" className="mb-0 border-t-0 pt-0" />
          <div className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            <Info size={14} />
            Changes take effect on next login
          </div>
        </div>
        <div className="p-6">
          <PermissionMatrixWidget 
            permissions={permissions} 
            onChange={setPermissions}
            isReadOnly={role.name === 'Super Admin'}
          />
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
          Apply Changes
        </AdminButton>
      </div>
    </div>
  )
}
