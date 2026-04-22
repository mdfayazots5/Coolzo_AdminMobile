/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { userRepository, User, UserPasswordResetResult } from "@/core/network/user-repository"
import { branchRepository, Branch } from "@/core/network/branch-repository"
import { UserRole } from "@/store/auth-store"
import { FullPageLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { RoleBadge, StatusBadge } from "@/components/shared/Badges"
import { AdminButton } from "@/components/shared/AdminButton"
import {
  ArrowLeft,
  Mail,
  AtSign,
  Calendar,
  History,
  ShieldAlert,
  KeyRound,
  UserMinus,
  UserCheck,
  Edit2,
  Shield,
  Copy,
  Clock3,
  Building2,
} from "lucide-react"
import { TimelineItem } from "@/components/shared/Timeline"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog"
import { formatDate } from "@/lib/utils"
import { getApiErrorMessage } from "@/core/network/api-error"
import { useRBAC } from "@/core/auth/RBACProvider"

export default function UserDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = React.useState<User | null>(null)
  const [branch, setBranch] = React.useState<Branch | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState("")
  const [isDeactivateOpen, setIsDeactivateOpen] = React.useState(false)
  const [isResetOpen, setIsResetOpen] = React.useState(false)
  const [actionKind, setActionKind] = React.useState<"deactivate" | "reactivate" | "reset" | "resetPin" | null>(null)
  const [credentialKind, setCredentialKind] = React.useState<"password" | "pin">("password")
  const [resetResult, setResetResult] = React.useState<UserPasswordResetResult | null>(null)
  const navigate = useNavigate()
  const { canEdit } = useRBAC()

  const loadUser = React.useCallback(async () => {
    if (!id) {
      setErrorMessage("Missing user identifier")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      const data = await userRepository.getUserById(id)
      if (!data) {
        setErrorMessage("The requested user could not be found.")
        setUser(null)
        setBranch(null)
      } else {
        setUser(data)
        try {
          const branchData = await branchRepository.getBranchById(data.branchId)
          setBranch(branchData)
        } catch {
          setBranch(null)
        }
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load the user profile"))
      setUser(null)
      setBranch(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    void loadUser()
  }, [loadUser])

  const handleDeactivate = async () => {
    if (!user) return

    setActionKind("deactivate")
    try {
      await userRepository.deactivateUser(user.id, "Administrative action")
      toast.success("User deactivated successfully")
      await loadUser()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to deactivate user"))
    } finally {
      setActionKind(null)
      setIsDeactivateOpen(false)
    }
  }

  const handleReactivate = async () => {
    if (!user) return

    setActionKind("reactivate")
    try {
      await userRepository.reactivateUser(user.id)
      toast.success("User reactivated successfully")
      await loadUser()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reactivate user"))
    } finally {
      setActionKind(null)
    }
  }

  const handleResetPassword = async () => {
    if (!user) return

    setActionKind("reset")
    try {
      const result = await userRepository.resetPassword(user.id, "Administrative reset")
      setCredentialKind("password")
      setResetResult(result)
      toast.success("Temporary password generated successfully")
      await loadUser()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reset password"))
    } finally {
      setActionKind(null)
      setIsResetOpen(false)
    }
  }

  const handleResetPin = async () => {
    if (!user) return

    setActionKind("resetPin")
    try {
      const result = await userRepository.resetPin(user.id, "Administrative field credential reset")
      setCredentialKind("pin")
      setResetResult(result)
      toast.success("Temporary PIN generated successfully")
      await loadUser()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reset PIN"))
    } finally {
      setActionKind(null)
    }
  }

  const handleCopyPassword = async () => {
    if (!resetResult?.temporaryPassword) {
      return
    }

    try {
      await navigator.clipboard.writeText(resetResult.temporaryPassword)
      toast.success(credentialKind === "pin" ? "Temporary PIN copied" : "Temporary password copied")
    } catch (error) {
      toast.error("Clipboard access is unavailable")
    }
  }

  if (isLoading) return <FullPageLoader label="Fetching user profile..." />

  if (!user) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/settings/users")}
          className="flex items-center gap-2 text-brand-muted hover:text-brand-navy transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Staff List</span>
        </button>

        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-4">
          <div>
            <h3 className="text-lg font-bold text-brand-navy">User unavailable</h3>
            <p className="text-sm text-brand-muted">{errorMessage || "The user profile could not be loaded."}</p>
          </div>
          <div className="flex justify-center gap-3">
            <AdminButton variant="secondary" onClick={() => navigate("/settings/users")}>
              Back to list
            </AdminButton>
            <AdminButton onClick={() => void loadUser()}>Retry</AdminButton>
          </div>
        </div>
      </div>
    )
  }

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
        {canEdit("settings") && (
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
        )}
      </div>

      {resetResult?.temporaryPassword && (
        <AdminCard className="p-6 border-brand-gold/30 bg-brand-gold/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                {credentialKind === "pin" ? "Temporary PIN" : "Temporary Password"}
              </p>
              <h2 className="text-xl font-bold text-brand-navy">{resetResult.temporaryPassword}</h2>
              <p className="text-sm text-brand-muted">
                {credentialKind === "pin"
                  ? "Share this securely with the field user. They will use it as their temporary access PIN."
                  : "Share this securely with the user. They will be asked to change it on the next login."}
              </p>
            </div>
            <AdminButton variant="secondary" onClick={handleCopyPassword} iconLeft={<Copy size={16} />}>
              {credentialKind === "pin" ? "Copy PIN" : "Copy Password"}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-8 text-center">
            <div className="size-24 bg-brand-navy/5 rounded-3xl flex items-center justify-center text-brand-navy font-bold text-3xl mx-auto mb-6 border-2 border-brand-navy/10">
              {user.name.split(" ").map((segment) => segment[0]).join("")}
            </div>
            <h2 className="text-xl font-bold text-brand-navy mb-1">{user.name}</h2>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {user.roles.map((roleName) => (
                <RoleBadge key={roleName} role={roleName} label={roleName} />
              ))}
              <StatusBadge status={user.status === "active" ? "completed" : "closed"}>
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
                <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy"><AtSign size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Username</p>
                  <p className="text-sm font-bold text-brand-navy">{user.userName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy"><Building2 size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Branch Scope</p>
                  <p className="text-sm font-bold text-brand-navy">
                    {branch?.name || `Branch ${user.branchId}`}
                  </p>
                  {branch?.city && (
                    <p className="text-xs text-brand-muted">{branch.city}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy"><Calendar size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Joined On</p>
                  <p className="text-sm font-bold text-brand-navy">{formatDate(user.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy"><Clock3 size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Last Login</p>
                  <p className="text-sm font-bold text-brand-navy">
                    {user.lastLogin ? formatDate(user.lastLogin) : "No login recorded"}
                  </p>
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6 border-status-urgent/20 bg-status-urgent/[0.02]">
            <h3 className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert size={16} className="text-status-urgent" />
              Security Actions
            </h3>

            <div className="space-y-3 mb-4">
              <div className="rounded-xl border border-brand-navy/10 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Credential State</p>
                <p className="text-sm font-bold text-brand-navy">
                  {user.mustChangePassword ? "Password change required on next login" : "Credentials currently valid"}
                </p>
                {user.passwordExpiryOnUtc && (
                  <p className="text-xs text-brand-muted mt-1">Expires {formatDate(user.passwordExpiryOnUtc)}</p>
                )}
              </div>
            </div>

            {canEdit("settings") && (
              <div className="space-y-3">
                <AdminButton
                  variant="secondary"
                  fullWidth
                  size="sm"
                  onClick={() => setIsResetOpen(true)}
                  iconLeft={<KeyRound size={16} />}
                >
                  Reset Password
                </AdminButton>
                {(user.role === UserRole.TECHNICIAN || user.role === UserRole.HELPER) && (
                  <AdminButton
                    variant="secondary"
                    fullWidth
                    size="sm"
                    onClick={() => void handleResetPin()}
                    isLoading={actionKind === "resetPin"}
                    iconLeft={<Shield size={16} />}
                  >
                    Reset Field PIN
                  </AdminButton>
                )}
                {user.status === "active" ? (
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
                    onClick={() => void handleReactivate()}
                    isLoading={actionKind === "reactivate"}
                    iconLeft={<UserCheck size={16} />}
                  >
                    Reactivate User
                  </AdminButton>
                )}
              </div>
            )}
          </AdminCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Activity Timeline" icon={<History size={18} />} />
            <div className="mt-8">
              {user.recentActivity && user.recentActivity.length > 0 ? (
                user.recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <TimelineItem
                      title={activity.action.replace(/([a-z])([A-Z])/g, "$1 $2")}
                      timestamp={formatDate(activity.timestamp)}
                      description={activity.details}
                      actor={activity.performedBy}
                      isLast={index === user.recentActivity!.length - 1}
                    />
                  </React.Fragment>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-brand-navy/10 p-6 text-center text-sm text-brand-muted">
                  No recent activity has been recorded for this user.
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Access Permissions" icon={<Shield size={18} />} />
            <div className="mt-4">
              {user.permissions && user.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded-full border border-brand-navy/10 bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                  <p className="text-sm text-brand-navy leading-relaxed">
                    No explicit permissions are assigned through the current roles.
                  </p>
                </div>
              )}
            </div>
          </AdminCard>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={handleDeactivate}
        title="Deactivate User?"
        description={`Are you sure you want to deactivate ${user.name}? Their active sessions will be terminated immediately.`}
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={actionKind === "deactivate"}
      />

      <ConfirmationDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleResetPassword}
        title="Reset Password?"
        description={`This will generate a new temporary password for ${user.email} and revoke current sessions.`}
        confirmLabel="Generate Password"
        isLoading={actionKind === "reset"}
      />
    </div>
  )
}
