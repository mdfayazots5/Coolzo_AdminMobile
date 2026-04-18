/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { roleRepository, Role } from "@/core/network/role-repository"
import { Shield, Plus, Users, ChevronRight, Lock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"

export default function RoleManagementListScreen() {
  const [roles, setRoles] = React.useState<Role[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await roleRepository.getRoles()
        setRoles(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRoles()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Role Management</h1>
          <p className="text-sm text-brand-muted">Configure permissions and access matrices</p>
        </div>
        <AdminButton 
          onClick={() => navigate('/settings/roles/create')}
          iconLeft={<Plus size={18} />}
        >
          Create Custom Role
        </AdminButton>
      </div>

      <SectionHeader title="System & Custom Roles" />

      {isLoading ? (
        <InlineLoader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <AdminCard 
                onClick={() => navigate(`/settings/roles/${role.id}`)}
                className="p-6 hover:border-brand-gold transition-all cursor-pointer group h-full flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-brand-navy/5 rounded-2xl text-brand-navy group-hover:bg-brand-navy group-hover:text-brand-gold transition-colors">
                    <Shield size={24} />
                  </div>
                  {role.isSystem && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-brand-muted uppercase tracking-widest bg-brand-navy/5 px-2 py-1 rounded-full">
                      <Lock size={10} />
                      System
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-brand-navy mb-2">{role.name}</h3>
                <p className="text-sm text-brand-muted mb-6 flex-1">{role.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-brand-muted" />
                    <span className="text-sm font-bold text-brand-navy">{role.userCount} Users</span>
                  </div>
                  <div className="text-brand-muted group-hover:text-brand-gold transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
