/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { FilterBar } from "@/components/shared/FilterBar"
import { TechnicianCard } from "@/components/shared/TechnicianCard"
import { technicianRepository, Technician } from "@/core/network/technician-repository"
import { Plus, Users, LayoutGrid, List, Filter, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"

export default function TechnicianListScreen() {
  const [technicians, setTechnicians] = React.useState<Technician[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchTechs = async () => {
      try {
        const data = await technicianRepository.getTechnicians({});
        setTechnicians(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTechs();
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Technician Management</h1>
          <p className="text-sm text-brand-muted">Manage field staff, skills, zones and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-brand-navy/5 p-1 rounded-lg border border-brand-navy/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'grid' ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-navy"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list' ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-navy"
              )}
            >
              <List size={18} />
            </button>
          </div>
          <AdminButton 
            onClick={() => navigate('/team/create')}
            iconLeft={<Plus size={18} />}
          >
            Add Technician
          </AdminButton>
        </div>
      </div>

      <FilterBar 
        onSearch={() => {}}
        onFilter={() => {}}
        placeholder="Search by name, ID, or skill..."
      />

      {isLoading ? (
        <InlineLoader />
      ) : (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          <AnimatePresence mode="popLayout">
            {technicians.map((tech, index) => (
              <motion.div
                key={tech.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <TechnicianCard 
                  technician={tech} 
                  onClick={() => navigate(`/team/${tech.id}`)}
                  className={viewMode === 'list' ? "flex flex-row items-center gap-6" : ""}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
