/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Users } from "lucide-react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { FilterBar } from "@/components/shared/Filters"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminCard } from "@/components/shared/Cards"
import { AdminDataTable } from "@/components/shared/AdminDataTable"
import { AdminDropdown } from "@/components/shared/Pickers"
import { StatusBadge, RoleBadge } from "@/components/shared/Badges"
import { branchRepository, Branch } from "@/core/network/branch-repository"
import { userRepository, User } from "@/core/network/user-repository"
import { roleRepository, Role } from "@/core/network/role-repository"
import { getApiErrorMessage } from "@/core/network/api-error"
import { formatDate } from "@/lib/utils"
import { useRBAC } from "@/core/auth/RBACProvider"

const PAGE_SIZE = 12

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
] as const

const sortOptions = [
  { label: "Name A-Z", value: "name:asc" },
  { label: "Name Z-A", value: "name:desc" },
  { label: "Newest joined", value: "createdAt:desc" },
  { label: "Recent login", value: "lastLogin:desc" },
]

type SortValue = typeof sortOptions[number]["value"]

export default function UserManagementListScreen() {
  const navigate = useNavigate()
  const { canCreate } = useRBAC()
  const [users, setUsers] = React.useState<User[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<string[]>([])
  const [selectedBranchId, setSelectedBranchId] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all")
  const [pageNumber, setPageNumber] = React.useState(1)
  const [sortValue, setSortValue] = React.useState<SortValue>("name:asc")
  const [errorMessage, setErrorMessage] = React.useState("")
  const deferredSearchQuery = React.useDeferredValue(searchQuery)

  const branchNameById = React.useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches]
  )

  const loadDependencies = React.useCallback(async () => {
    try {
      const [roleData, branchData] = await Promise.all([
        roleRepository.getRoles(),
        branchRepository.getBranches(),
      ])

      setRoles(roleData)
      setBranches(branchData)
    } catch (error) {
      console.error(error)
    }
  }, [])

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const [sortBy, sortOrder] = sortValue.split(":") as [UserListSortBy, UserListSortOrder]
      const data = await userRepository.getUsers({
        pageNumber,
        pageSize: PAGE_SIZE,
        searchTerm: deferredSearchQuery.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        roleIds: selectedRoleIds,
        branchIds: selectedBranchId === "all" ? undefined : [selectedBranchId],
        sortBy,
        sortOrder,
      })

      setUsers(data)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load users right now"))
    } finally {
      setIsLoading(false)
    }
  }, [deferredSearchQuery, pageNumber, selectedBranchId, selectedRoleIds, sortValue, statusFilter])

  React.useEffect(() => {
    void loadDependencies()
  }, [loadDependencies])

  React.useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  React.useEffect(() => {
    setPageNumber(1)
  }, [deferredSearchQuery, selectedBranchId, selectedRoleIds, sortValue, statusFilter])

  const filters = [
    ...roles.map((role) => ({
      id: `role:${role.id}`,
      label: role.name,
      isActive: selectedRoleIds.includes(role.id),
    })),
    { id: "status:active", label: "Active Only", isActive: statusFilter === "active" },
    { id: "status:inactive", label: "Inactive Only", isActive: statusFilter === "inactive" },
  ]

  const handleFilterToggle = (id: string) => {
    if (id.startsWith("role:")) {
      const roleId = id.replace("role:", "")
      setSelectedRoleIds((current) =>
        current.includes(roleId)
          ? current.filter((value) => value !== roleId)
          : [...current, roleId]
      )
      return
    }

    if (id === "status:active") {
      setStatusFilter((current) => current === "active" ? "all" : "active")
      return
    }

    if (id === "status:inactive") {
      setStatusFilter((current) => current === "inactive" ? "all" : "inactive")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">User Management</h1>
          <p className="text-sm text-brand-muted">
            Manage internal identities, access roles, branch scope, and account status.
          </p>
        </div>
        {canCreate("settings") && (
          <AdminButton onClick={() => navigate("/settings/users/create")} iconLeft={<Plus size={18} />}>
            Add New User
          </AdminButton>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <AdminTextField
          label="Search Users"
          placeholder="Search by name, username, or email..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          prefixIcon={<Search size={18} />}
          className="bg-white"
        />
        <div className="flex items-center gap-4 rounded-lg border border-brand-navy/10 bg-brand-navy/5 px-4 py-2">
          <div className="rounded-lg bg-brand-navy p-2 text-brand-gold">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Loaded Users</p>
            <p className="text-lg font-bold text-brand-navy">{users.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminDropdown
          label="Branch"
          options={[
            { label: "All branches", value: "all" },
            ...branches.map((branch) => ({ label: branch.name, value: branch.id })),
          ]}
          value={selectedBranchId}
          onChange={setSelectedBranchId}
        />
        <AdminDropdown
          label="Status"
          options={statusOptions.map((option) => ({ label: option.label, value: option.value }))}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as typeof statusFilter)}
        />
        <AdminDropdown
          label="Sort By"
          options={sortOptions}
          value={sortValue}
          onChange={(value) => setSortValue(value as SortValue)}
        />
      </div>

      <FilterBar
        filters={filters}
        onFilterToggle={handleFilterToggle}
        onClearAll={() => {
          setSelectedRoleIds([])
          setStatusFilter("all")
          setSelectedBranchId("all")
          setSortValue("name:asc")
        }}
      />

      <SectionHeader title="System Users" />

      {isLoading ? (
        <InlineLoader />
      ) : errorMessage ? (
        <div className="space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div>
            <h3 className="text-lg font-bold text-brand-navy">Could not load users</h3>
            <p className="text-sm text-brand-muted">{errorMessage}</p>
          </div>
          <AdminButton onClick={() => void loadUsers()}>Retry</AdminButton>
        </div>
      ) : (
        <AdminCard className="p-4 sm:p-6">
          <AdminDataTable<User>
            columns={[
              {
                header: "User",
                accessorKey: "name",
                cell: (user) => (
                  <div>
                    <p className="font-bold text-brand-navy">{user.name}</p>
                    <p className="text-xs text-brand-muted">{user.userName}</p>
                  </div>
                ),
              },
              {
                header: "Role",
                accessorKey: "roleLabel",
                cell: (user) => <RoleBadge role={user.role} label={user.roleLabel} />,
              },
              {
                header: "Branch",
                accessorKey: "branchId",
                cell: (user) => branchNameById.get(user.branchId) || `Branch ${user.branchId}`,
              },
              {
                header: "Status",
                accessorKey: "status",
                cell: (user) => (
                  <StatusBadge status={user.status === "active" ? "completed" : "closed"}>
                    {user.status}
                  </StatusBadge>
                ),
              },
              {
                header: "Last Login",
                accessorKey: "lastLogin",
                cell: (user) => user.lastLogin ? formatDate(user.lastLogin) : "No login yet",
              },
              {
                header: "Joined",
                accessorKey: "createdAt",
                cell: (user) => formatDate(user.createdAt),
              },
            ]}
            data={users}
            onRowClick={(user) => navigate(`/settings/users/${user.id}`)}
            pageNumber={pageNumber}
            onPageChange={setPageNumber}
            hasNextPage={users.length === PAGE_SIZE}
            resultLabel={`Page ${pageNumber}`}
          />
        </AdminCard>
      )}
    </div>
  )
}

type UserListSortBy = "name" | "createdAt" | "lastLogin"
type UserListSortOrder = "asc" | "desc"
