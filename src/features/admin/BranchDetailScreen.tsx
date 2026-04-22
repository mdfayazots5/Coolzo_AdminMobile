/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Building2, Edit2, MapPin, Search, Users, Wrench, Map as MapIcon } from "lucide-react"
import { toast } from "sonner"
import { branchRepository, Branch } from "@/core/network/branch-repository"
import { userRepository, User } from "@/core/network/user-repository"
import { FullPageLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { UserCard } from "@/components/shared/UserCard"
import { StatusBadge } from "@/components/shared/Badges"
import { getApiErrorMessage } from "@/core/network/api-error"

export default function BranchDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [branch, setBranch] = React.useState<Branch | null>(null)
  const [staff, setStaff] = React.useState<User[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        return
      }

      setIsLoading(true)

      try {
        const [branchData, allUsers] = await Promise.all([
          branchRepository.getBranchById(id),
          userRepository.getUsers({ pageNumber: 1, pageSize: 200, branchIds: [id], sortBy: "name", sortOrder: "asc" }),
        ])

        if (!branchData) {
          toast.error("Branch not found")
          navigate("/settings/branches")
          return
        }

        setBranch(branchData)
        setStaff(allUsers.filter((user) => user.branchId === branchData.id))
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load branch operational data"))
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [id, navigate])

  const filteredStaff = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return staff
    }

    return staff.filter((member) =>
      [member.name, member.email, member.userName, member.roleLabel]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    )
  }, [searchQuery, staff])

  if (isLoading) {
    return <FullPageLoader label="Fetching branch operational data..." />
  }

  if (!branch) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/settings/branches")}
          className="group flex items-center gap-2 text-brand-muted transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-bold uppercase tracking-wider">All Branches</span>
        </button>
        <AdminButton
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/settings/branches/${branch.id}/edit`)}
          iconLeft={<Edit2 size={16} />}
        >
          Edit Configuration
        </AdminButton>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex size-20 items-center justify-center rounded-lg bg-brand-navy text-brand-gold shadow-xl">
              <Building2 size={40} />
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-brand-navy">{branch.name}</h1>
                <StatusBadge status={branch.isActive ? "completed" : "closed"}>
                  {branch.isActive ? "active" : "inactive"}
                </StatusBadge>
                <div className="rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-navy">
                  Branch ID: {branch.id}
                </div>
              </div>
              <p className="flex items-center gap-2 text-brand-muted">
                <MapPin size={16} />
                {branch.address}, {branch.city}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-brand-navy/10 bg-brand-navy/5 px-4 py-2">
                  <Users size={16} className="text-brand-gold" />
                  <span className="text-sm font-bold text-brand-navy">{branch.technicianCount} Field Staff</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-brand-navy/10 bg-brand-navy/5 px-4 py-2">
                  <Wrench size={16} className="text-brand-gold" />
                  <span className="text-sm font-bold text-brand-navy">{branch.srCount} Active SRs</span>
                </div>
              </div>
            </div>
          </div>

          <AdminCard className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Branch Manager</p>
                <p className="mt-1 text-sm font-bold text-brand-navy">{branch.managerName || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Coverage Status</p>
                <p className="mt-1 text-sm font-bold text-brand-navy">{branch.isActive ? "Open for assignment" : "Inactive"}</p>
              </div>
            </div>
          </AdminCard>

          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <SectionHeader title="Staff Assigned" className="mb-0 border-0 pt-0" />
              <div className="flex items-center gap-2 rounded-lg border border-brand-navy/10 bg-brand-navy/5 px-3 py-1">
                <Search size={14} className="text-brand-muted" />
                <input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-40 border-none bg-transparent text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredStaff.map((member) => (
                <UserCard
                  key={member.id}
                  user={member}
                  onClick={() => navigate(`/settings/users/${member.id}`)}
                />
              ))}
              {filteredStaff.length === 0 && (
                <div className="col-span-full rounded-lg border-2 border-dashed border-border p-8 text-center text-brand-muted">
                  No staff members match this branch filter.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full space-y-6 lg:w-96">
          <AdminCard className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon size={20} className="text-brand-navy" />
                <h3 className="font-bold text-brand-navy">Service Zones</h3>
              </div>
            </div>

            <div className="space-y-3">
              {branch.zones.length > 0 ? branch.zones.map((zone) => (
                <div
                  key={zone}
                  className="flex items-center justify-between rounded-lg border border-brand-navy/10 bg-brand-navy/5 p-4"
                >
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{zone}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Coverage zone</p>
                  </div>
                  <div className="rounded border border-border bg-white px-2 py-1 text-[10px] font-bold text-brand-muted">
                    Active
                  </div>
                </div>
              )) : (
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-brand-muted">
                  No service zones are mapped to this branch yet.
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <p className="mb-4 text-center text-xs text-brand-muted">
                Zone mapping controls assignment reach, search filters, and branch-level service visibility.
              </p>
              <AdminButton variant="outline" fullWidth size="sm" className="border-brand-navy/10">
                Manage All Zones
              </AdminButton>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
