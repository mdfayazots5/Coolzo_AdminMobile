/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { branchRepository } from "@/core/network/branch-repository"
import { Branch } from "@/core/network/user-repository"
import { MapPin, Plus, Users, Wrench, ChevronRight, Building2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"

export default function BranchManagementListScreen() {
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await branchRepository.getBranches()
        setBranches(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBranches()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Branch Management</h1>
          <p className="text-sm text-brand-muted">Manage service centers and regional teams</p>
        </div>
        <AdminButton 
          onClick={() => navigate('/settings/branches/create')}
          iconLeft={<Plus size={18} />}
        >
          Add New Branch
        </AdminButton>
      </div>

      <SectionHeader title="Operational Branches" />

      {isLoading ? (
        <InlineLoader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AdminCard 
                onClick={() => navigate(`/settings/branches/${branch.id}`)}
                className="p-6 hover:border-brand-gold transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-brand-navy/5 rounded-2xl text-brand-navy group-hover:bg-brand-navy group-hover:text-brand-gold transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Branch ID</p>
                    <p className="text-sm font-bold text-brand-navy">{branch.id}</p>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-brand-navy mb-1">{branch.name}</h3>
                <div className="flex items-center gap-1 text-xs text-brand-muted mb-6">
                  <MapPin size={12} />
                  {branch.city}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={14} className="text-brand-muted" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Team</span>
                    </div>
                    <p className="text-lg font-bold text-brand-navy">{branch.technicianCount}</p>
                  </div>
                  <div className="p-3 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench size={14} className="text-brand-muted" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Monthly SR</span>
                    </div>
                    <p className="text-lg font-bold text-brand-navy">{branch.srCount}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">View Details</span>
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
