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
import { userRepository, User } from "@/core/network/user-repository"
import { UserRole } from "@/store/auth-store"
import { ArrowLeft, UserPlus, Mail, Phone, Shield, MapPin, Hash, Save, Edit3 } from "lucide-react"
import { toast } from "sonner"

export default function CreateUserScreen() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = !!id

  const [formData, setFormData] = React.useState<Partial<User>>({
    name: "",
    email: "",
    phone: "",
    role: UserRole.TECHNICIAN,
    branchId: "B1",
    employeeId: ""
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(isEditMode)
  const navigate = useNavigate()

  React.useEffect(() => {
    if (isEditMode) {
      const fetchUser = async () => {
        try {
          const data = await userRepository.getUserById(id!)
          if (data) {
            setFormData(data)
          }
        } catch (error) {
          toast.error("User not found")
        } finally {
          setIsFetching(false)
        }
      }
      fetchUser()
    }
  }, [id, isEditMode])

  const roles = Object.values(UserRole).map(role => ({
    label: role.replace(/_/g, ' '),
    value: role
  }))

  const branches = [
    { label: "Hyderabad Central", value: "B1" },
    { label: "Delhi South", value: "B2" },
    { label: "Bangalore East", value: "B3" }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (isEditMode) {
        await userRepository.updateUser(id!, formData)
        toast.success(`User ${formData.name} updated successfully`)
      } else {
        const newUser = await userRepository.createUser(formData)
        toast.success(`User ${newUser.name} onboarded successfully`)
      }
      navigate(`/settings/users/${isEditMode ? id : 'list'}`) // Just go back to detail or list
      if (!isEditMode) {
        // Find the new ID if we were creating, but for simplicity let's go to list
        navigate('/settings/users')
      } else {
        navigate(`/settings/users/${id}`)
      }
    } catch (error) {
      toast.error(isEditMode ? "Failed to update user" : "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  const isFieldRole = formData.role === UserRole.TECHNICIAN || formData.role === UserRole.HELPER

  if (isFetching) return <div className="p-20 text-center text-brand-muted">Loading profile data...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(isEditMode ? `/settings/users/${id}` : "/settings/users")}
        className="flex items-center gap-2 text-brand-muted hover:text-brand-navy transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-wider">{isEditMode ? 'Back to Profile' : 'Back to Staff List'}</span>
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="size-12 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-navy shadow-lg shadow-brand-gold/20">
          {isEditMode ? <Edit3 size={24} /> : <UserPlus size={24} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{isEditMode ? 'Edit User Profile' : 'Onboard New User'}</h1>
          <p className="text-sm text-brand-muted">{isEditMode ? 'Update staff information and system access' : 'Configure profile and access permissions'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AdminCard className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminTextField
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              prefixIcon={<UserPlus size={18} />}
              required
            />
            <AdminTextField
              label="Email Address"
              placeholder="john@coolzo.com"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              prefixIcon={<Mail size={18} />}
              required
              disabled={isEditMode}
            />
            <AdminTextField
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              prefixIcon={<Phone size={18} />}
              required
            />
            <AdminDropdown
              label="System Role"
              options={roles}
              value={formData.role}
              onChange={(val) => setFormData({ ...formData, role: val as UserRole })}
              className="w-full"
            />
            <AdminDropdown
              label="Branch Assignment"
              options={branches}
              value={formData.branchId}
              onChange={(val) => setFormData({ ...formData, branchId: val })}
              className="w-full"
            />
            {isFieldRole && (
              <AdminTextField
                label="Employee ID"
                placeholder="CZ-1000"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                prefixIcon={<Hash size={18} />}
                required
              />
            )}
          </div>

          <div className="pt-6 border-t border-border">
            {!isEditMode && (
              <div className="flex items-center gap-3 p-4 bg-brand-navy/5 rounded-xl mb-8">
                <Shield size={20} className="text-brand-gold" />
                <p className="text-xs text-brand-navy leading-relaxed">
                  A welcome email will be sent to the user with their temporary credentials and a link to set their permanent password/PIN.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <AdminButton 
                variant="secondary" 
                fullWidth 
                type="button"
                onClick={() => navigate(isEditMode ? `/settings/users/${id}` : "/settings/users")}
              >
                Cancel
              </AdminButton>
              <AdminButton 
                fullWidth 
                type="submit"
                isLoading={isLoading}
                iconLeft={isEditMode ? <Save size={18} /> : <UserPlus size={18} />}
              >
                {isEditMode ? 'Save Changes' : 'Create User'}
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      </form>
    </div>
  )
}
