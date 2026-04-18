/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { FilterBar } from "@/components/shared/Filters"
import { UserCard } from "@/components/shared/UserCard"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { userRepository, User } from "@/core/network/user-repository"
import { Search, Plus, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"
import { UserRole } from "@/store/auth-store"

export default function UserManagementListScreen() {
  const [users, setUsers] = React.useState<User[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilters, setActiveFilters] = React.useState<string[]>([])
  const navigate = useNavigate()

  const filters = [
    { id: 'SUPER_ADMIN', label: 'Super Admins', isActive: activeFilters.includes('SUPER_ADMIN') },
    { id: 'OPS_MANAGER', label: 'Ops Managers', isActive: activeFilters.includes('OPS_MANAGER') },
    { id: 'TECHNICIAN', label: 'Technicians', isActive: activeFilters.includes('TECHNICIAN') },
    { id: 'SUPPORT', label: 'Support', isActive: activeFilters.includes('SUPPORT') },
    { id: 'active', label: 'Active Only', isActive: activeFilters.includes('active') },
    { id: 'inactive', label: 'Inactive Only', isActive: activeFilters.includes('inactive') },
  ];

  React.useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const data = await userRepository.getUsers({})
        setUsers(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const roleFilters = activeFilters.filter(f => Object.values(UserRole).includes(f as UserRole));
    const matchesRole = roleFilters.length === 0 || roleFilters.includes(user.role);
    
    const statusFilters = activeFilters.filter(f => ['active', 'inactive'].includes(f));
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(user.status);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleFilterToggle = (id: string) => {
    setActiveFilters(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">User Management</h1>
          <p className="text-sm text-brand-muted">Onboard and manage access for all internal staff</p>
        </div>
        <AdminButton 
          onClick={() => navigate('/settings/users/create')}
          iconLeft={<Plus size={18} />}
        >
          Add New User
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <AdminTextField
            placeholder="Search by name, email or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefixIcon={<Search size={18} />}
            className="bg-white"
          />
        </div>
        <div className="flex items-center gap-4 bg-brand-navy/5 px-4 py-2 rounded-xl border border-brand-navy/10">
          <div className="p-2 bg-brand-navy rounded-lg text-brand-gold">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Total Users</p>
            <p className="text-lg font-bold text-brand-navy">{users.length}</p>
          </div>
        </div>
      </div>

      <FilterBar 
        filters={filters} 
        onFilterToggle={handleFilterToggle}
        onClearAll={() => setActiveFilters([])}
      />

      <SectionHeader title="System Users" />

      {isLoading ? (
        <InlineLoader />
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <UserCard 
                user={user} 
                onClick={() => navigate(`/settings/users/${user.id}`)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-brand-navy/[0.02] rounded-3xl border-2 border-dashed border-brand-navy/10">
          <Users size={48} className="mx-auto text-brand-muted/30 mb-4" />
          <h3 className="text-lg font-bold text-brand-navy">No users found</h3>
          <p className="text-sm text-brand-muted">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
