/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AdminCard } from "@/components/shared/Cards"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { AdminDropdown } from "@/components/shared/Pickers"
import { AdminButton } from "@/components/shared/AdminButton"
import { branchRepository } from "@/core/network/branch-repository"
import { Branch, userRepository, User } from "@/core/network/user-repository"
import { ArrowLeft, Building2, MapPin, Save, UserCheck, Phone, Globe } from "lucide-react"
import { toast } from "sonner"
import { UserRole } from "@/store/auth-store"

export default function CreateBranchScreen() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = !!id

  const [formData, setFormData] = React.useState<Partial<Branch>>({
    name: "",
    city: "",
    address: "",
    managerId: ""
  })
  const [managers, setManagers] = React.useState<{label: string, value: string}[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(isEditMode)
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await userRepository.getUsers({})
        const managerOptions = users
          .filter(u => u.role === UserRole.OPS_MANAGER || u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN)
          .map(m => ({ label: m.name, value: m.id }))
        setManagers(managerOptions)

        if (isEditMode) {
          const data = await branchRepository.getBranchById(id!)
          if (data) {
            setFormData(data)
          }
        }
      } catch (error) {
        toast.error("Error fetching dependencies")
      } finally {
        setIsFetching(false)
      }
    }
    fetchData()
  }, [id, isEditMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (isEditMode) {
        await branchRepository.updateBranch(id!, formData)
        toast.success(`Branch ${formData.name} updated successfully`)
        navigate(`/settings/branches/${id}`)
      } else {
        const newBranch = await branchRepository.createBranch(formData)
        toast.success(`Branch ${newBranch.name} created successfully`)
        navigate(`/settings/branches`)
      }
    } catch (error) {
      toast.error(isEditMode ? "Failed to update branch" : "Failed to create branch")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) return <div className="p-20 text-center text-brand-muted uppercase tracking-widest font-bold">Loading branch configuration...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(isEditMode ? `/settings/branches/${id}` : "/settings/branches")}
        className="flex items-center gap-2 text-brand-muted hover:text-brand-navy transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-wider">{isEditMode ? 'Back to Branch Details' : 'Back to Branches'}</span>
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="size-12 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-navy shadow-lg shadow-brand-gold/20">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{isEditMode ? 'Edit Branch' : 'Register New Branch'}</h1>
          <p className="text-sm text-brand-muted">Operational center setup and manager assignment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AdminCard className="p-8 space-y-6">
          <div className="space-y-6">
            <AdminTextField
              label="Branch Official Name"
              placeholder="e.g. Hyderabad Downtown Hub"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              prefixIcon={<Building2 size={18} />}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdminTextField
                label="City / Region"
                placeholder="e.g. Hyderabad"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                prefixIcon={<Globe size={18} />}
                required
              />
              <AdminDropdown
                label="Branch Manager"
                options={managers}
                value={formData.managerId}
                onChange={(val) => setFormData({ ...formData, managerId: val })}
                className="w-full"
              />
            </div>

            <AdminTextField
              label="Full Operational Address"
              placeholder="Plot No, Street, Landmark, PIN..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              prefixIcon={<MapPin size={18} />}
              required
            />
          </div>

          <div className="pt-6 border-t border-border mt-8">
            <div className="flex gap-4">
              <AdminButton 
                variant="secondary" 
                fullWidth 
                type="button"
                onClick={() => navigate(isEditMode ? `/settings/branches/${id}` : "/settings/branches")}
              >
                Cancel
              </AdminButton>
              <AdminButton 
                fullWidth 
                type="submit"
                isLoading={isLoading}
                iconLeft={<Save size={18} />}
              >
                {isEditMode ? 'Apply Updates' : 'Confirm Registration'}
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      </form>
    </div>
  )
}
