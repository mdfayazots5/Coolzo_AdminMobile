/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { Search, Plus, Building2, MapPin, Users, Wrench, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { AdminDropdown } from "@/components/shared/Pickers"
import { StatusBadge } from "@/components/shared/Badges"
import { branchRepository, Branch } from "@/core/network/branch-repository"
import { getApiErrorMessage } from "@/core/network/api-error"

export default function BranchManagementListScreen() {
  const navigate = useNavigate()
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const deferredSearchQuery = React.useDeferredValue(searchQuery)

  const loadBranches = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const data = await branchRepository.getBranches({
        searchTerm: deferredSearchQuery.trim() || undefined,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      })
      setBranches(data)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load branches right now"))
    } finally {
      setIsLoading(false)
    }
  }, [deferredSearchQuery, statusFilter])

  React.useEffect(() => {
    void loadBranches()
  }, [loadBranches])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Branch Management</h1>
          <p className="text-sm text-brand-muted">Manage service centers, manager assignment, and zone coverage.</p>
        </div>
        <AdminButton onClick={() => navigate("/settings/branches/create")} iconLeft={<Plus size={18} />}>
          Add New Branch
        </AdminButton>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <AdminTextField
          label="Search Branches"
          placeholder="Search by branch name, city, or address..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          prefixIcon={<Search size={18} />}
        />
        <AdminDropdown
          label="Status"
          options={[
            { label: "All branches", value: "all" },
            { label: "Active only", value: "active" },
            { label: "Inactive only", value: "inactive" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <SectionHeader title="Operational Branches" />

      {isLoading ? (
        <InlineLoader />
      ) : errorMessage ? (
        <div className="space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div>
            <h3 className="text-lg font-bold text-brand-navy">Could not load branches</h3>
            <p className="text-sm text-brand-muted">{errorMessage}</p>
          </div>
          <AdminButton onClick={() => void loadBranches()}>Retry</AdminButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <AdminCard
                onClick={() => navigate(`/settings/branches/${branch.id}`)}
                className="cursor-pointer p-6 transition-all hover:border-brand-gold"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="rounded-lg bg-brand-navy/5 p-3 text-brand-navy">
                    <Building2 size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Branch ID</p>
                    <p className="text-sm font-bold text-brand-navy">{branch.id}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-brand-navy">{branch.name}</h3>
                  <StatusBadge status={branch.isActive ? "completed" : "closed"}>
                    {branch.isActive ? "active" : "inactive"}
                  </StatusBadge>
                </div>

                <div className="mb-6 flex items-center gap-1 text-xs text-brand-muted">
                  <MapPin size={12} />
                  <span>{branch.city}</span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-brand-navy/10 bg-brand-navy/5 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Users size={14} className="text-brand-muted" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Team</span>
                    </div>
                    <p className="text-lg font-bold text-brand-navy">{branch.technicianCount}</p>
                  </div>
                  <div className="rounded-lg border border-brand-navy/10 bg-brand-navy/5 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Wrench size={14} className="text-brand-muted" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Open SR</span>
                    </div>
                    <p className="text-lg font-bold text-brand-navy">{branch.srCount}</p>
                  </div>
                </div>

                <div className="mb-6 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Manager</p>
                  <p className="text-sm font-semibold text-brand-navy">{branch.managerName || "Unassigned"}</p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Zones</p>
                  <div className="flex flex-wrap gap-2">
                    {branch.zones.length > 0 ? branch.zones.map((zone) => (
                      <span
                        key={zone}
                        className="rounded bg-brand-navy/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-navy"
                      >
                        {zone}
                      </span>
                    )) : (
                      <span className="text-xs text-brand-muted">No zones assigned</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">View Details</span>
                  <ChevronRight size={20} className="text-brand-muted" />
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
