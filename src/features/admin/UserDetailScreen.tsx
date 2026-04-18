/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { userRepository, User } from "@/core/network/user-repository"
import { FullPageLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { RoleBadge, StatusBadge } from "@/components/shared/Badges"
import { AdminButton } from "@/components/shared/AdminButton"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  History, 
  ShieldAlert, 
  KeyRound,
  UserMinus,
  UserCheck,
  Edit2
} from "lucide-react"
import { TimelineItem } from "@/components/shared/Timeline"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog"

export default function UserDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDeactivateOpen, setIsDeactivateOpen] = React.useState(false)
  const [isResetOpen, setIsResetOpen] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchUser = async () => {
      if (!id) return
      try {
        const data = await userRepository.getUserById(id)
        setUser(data)
      } catch (error) {
        toast.error("User not found")
        navigate("/settings/users")
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [id, navigate])

  const handleDeactivate = async () => {
    if (!user) return
    try {
      await userRepository.deactivateUser(user.id, "Administrative action")
      setUser({ ...user, status: 'inactive' })
      toast.success("User deactivated successfully")
    } catch (error) {
      toast.error("Failed to deactivate user")
    } finally {
      setIsDeactivateOpen(false)
    }
  }

  const handleReactivate = async () => {
    if (!user) return
    try {
      await userRepository.reactivateUser(user.id)
      setUser({ ...user, status: 'active' })
      toast.success("User reactivated successfully")
    } catch (error) {
      toast.error("Failed to reactivate user")
    }
  }

  const handleResetPassword = async () => {
    if (!user) return
    try {
      await userRepository.resetPassword(user.id)
      toast.success("Password reset link sent to user")
    } catch (error) {
      toast.error("Failed to reset password")
    } finally {
      setIsResetOpen(false)
    }
  }

  if (isLoading) return <FullPageLoader label="Fetching user profile..." />
  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate("/settings/users")}
          className="flex items-center gap-2 text-brand-muted hover:text-brand-navy transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Staff List</span>
        </button>
        <div className="flex items-center gap-2">
          <AdminButton 
            variant="secondary" 
            size="sm"
            onClick={() => navigate(`/settings/users/${user.id}/edit`)}
            iconLeft={<Edit2 size={16} />}
          >
            Edit Profile
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-8 text-center">
            <div className="size-24 bg-brand-navy/5 rounded-3xl flex items-center justify-center text-brand-navy font-bold text-3xl mx-auto mb-6 border-2 border-brand-navy/10">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h2 className="text-xl font-bold text-brand-navy mb-1">{user.name}</h2>
            <div className="flex flex-col items-center gap-2 mb-6">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status === 'active' ? 'completed' : 'closed'}>
                {user.status}
              </StatusBadge>
            </div>
            
            <div className="space-y-4 text-left border-t border-border pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy"><Mail size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Email</p>
                  <p className="text-sm font-bold text-brand-navy">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy"><Phone size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Phone</p>
                  <p className="text-sm font-bold text-brand-navy">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy"><MapPin size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Branch</p>
                  <p className="text-sm font-bold text-brand-navy">{user.branchId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy"><Calendar size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Joined On</p>
                  <p className="text-sm font-bold text-brand-navy">{user.createdAt}</p>
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6 border-status-urgent/20 bg-status-urgent/[0.02]">
            <h3 className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert size={16} className="text-status-urgent" />
              Security Actions
            </h3>
            <div className="space-y-3">
              <AdminButton 
                variant="outline" 
                fullWidth 
                size="sm"
                onClick={() => setIsResetOpen(true)}
                iconLeft={<KeyRound size={16} />}
              >
                Reset Password / PIN
              </AdminButton>
              {user.status === 'active' ? (
                <AdminButton 
                  variant="destructive" 
                  fullWidth 
                  size="sm"
                  onClick={() => setIsDeactivateOpen(true)}
                  iconLeft={<UserMinus size={16} />}
                >
                  Deactivate User
                </AdminButton>
              ) : (
                <AdminButton 
                  variant="secondary" 
                  fullWidth 
                  size="sm"
                  onClick={handleReactivate}
                  iconLeft={<UserCheck size={16} />}
                >
                  Reactivate User
                </AdminButton>
              )}
            </div>
          </AdminCard>
        </div>

        {/* Activity & History */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Activity Timeline" icon={<History size={18} />} />
            <div className="mt-8">
              <TimelineItem 
                title="System Login"
                timestamp="Today, 09:45 AM"
                description="Successful login from Chrome on Windows"
                actor="System"
              />
              <TimelineItem 
                title="Profile Updated"
                timestamp="Yesterday, 02:15 PM"
                description="Phone number updated from +91 98765 00000 to +91 98765 43210"
                actor="Admin"
              />
              <TimelineItem 
                title="Account Created"
                timestamp="Jan 01, 2024"
                description="User onboarded as Super Admin"
                actor="System"
                isLast
              />
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Access Permissions" />
            <div className="mt-4 p-4 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
              <p className="text-sm text-brand-navy leading-relaxed">
                This user has <span className="font-bold">Full System Access</span>. As a Super Admin, they can manage all modules, users, branches, and configurations across the entire platform.
              </p>
            </div>
          </AdminCard>
        </div>
      </div>

      <ConfirmationDialog 
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={handleDeactivate}
        title="Deactivate User?"
        description={`Are you sure you want to deactivate ${user.name}? They will lose all access to the platform immediately.`}
        confirmLabel="Deactivate"
        variant="destructive"
      />

      <ConfirmationDialog 
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleResetPassword}
        title="Reset Password?"
        description={`This will send a password reset link to ${user.email}. Their current password will remain valid until they set a new one.`}
        confirmLabel="Send Reset Link"
      />
    </div>
  )
}
