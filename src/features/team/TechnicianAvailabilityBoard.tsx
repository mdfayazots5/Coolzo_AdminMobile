/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { StatusBadge } from "@/components/shared/Badges"
import { technicianRepository, Technician } from "@/core/network/technician-repository"
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  User, 
  Briefcase,
  ChevronRight,
  ShieldCheck
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { cn } from "@/lib/utils"

export default function TechnicianAvailabilityBoard() {
  const [techs, setTechs] = React.useState<Technician[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filterZone, setFilterZone] = React.useState('all')

  React.useEffect(() => {
    const fetchTechs = async () => {
      try {
        const data = await technicianRepository.getAvailabilityBoard();
        setTechs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTechs();
  }, [])

  const statusColors = {
    'available': 'completed',
    'on-job': 'assigned',
    'off-duty': 'closed',
    'on-leave': 'urgent'
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Availability Board</h1>
          <p className="text-sm text-brand-muted">Real-time technician tracking and dispatch companion</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
            <Filter size={16} className="text-brand-muted" />
            <select 
              className="bg-transparent text-xs font-bold text-brand-navy outline-none uppercase tracking-widest"
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
            >
              <option value="all">All Zones</option>
              <option value="z1">Zone 1 (Central)</option>
              <option value="z2">Zone 2 (West)</option>
              <option value="z3">Zone 3 (East)</option>
            </select>
          </div>
          <AdminButton variant="outline" size="sm">Refresh Board</AdminButton>
        </div>
      </div>

      {isLoading ? (
        <InlineLoader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {techs.map((tech) => (
            <AdminCard key={tech.id} className="p-4 border-l-4 border-l-brand-gold">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 bg-brand-navy/5 rounded-lg flex items-center justify-center text-brand-navy border border-brand-navy/10 overflow-hidden">
                    {tech.photo ? (
                      <img src={tech.photo} alt={tech.name} className="size-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-navy truncate max-w-[100px]">{tech.name}</h4>
                    <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest">{tech.employeeId}</p>
                  </div>
                </div>
                <StatusBadge status={statusColors[tech.status]} className="text-[8px] px-1.5 py-0.5">
                  {tech.status.replace('-', ' ')}
                </StatusBadge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-brand-muted uppercase tracking-widest">Zone Coverage</span>
                  <span className="font-bold text-brand-navy">{tech.zones.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-brand-muted uppercase tracking-widest">Jobs Today</span>
                  <span className="font-bold text-brand-navy">{tech.todayJobCount}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-brand-muted uppercase tracking-widest">Next Free</span>
                  <span className="font-bold text-brand-gold">{tech.nextFreeSlot || '--:--'}</span>
                </div>
              </div>

              {tech.status === 'on-job' && (
                <div className="mb-4 p-2 bg-brand-navy/5 rounded-lg border border-brand-navy/10">
                  <p className="text-[8px] font-bold text-brand-muted uppercase tracking-widest mb-1">Active Job</p>
                  <p className="text-[10px] font-bold text-brand-navy truncate">{tech.currentJobId}</p>
                </div>
              )}

              <AdminButton 
                variant={tech.status === 'available' ? 'primary' : 'secondary'} 
                size="sm" 
                className="w-full text-[10px] font-bold uppercase tracking-widest"
                disabled={tech.status !== 'available'}
              >
                {tech.status === 'available' ? 'Quick Assign' : 'View Details'}
              </AdminButton>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Helper Section */}
      <div className="pt-8">
        <SectionHeader title="Field Assistants / Helpers" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3].map(i => (
            <AdminCard key={i} className="p-3 bg-brand-navy/[0.02]">
              <div className="flex items-center gap-3">
                <div className="size-8 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-muted">
                  <User size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-brand-navy">Helper {i}</h4>
                  <p className="text-[9px] text-brand-muted">ID: CZ-H-00{i}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-brand-navy/5">
                <p className="text-[8px] font-bold text-brand-muted uppercase tracking-widest mb-1">Assigned To</p>
                <p className="text-[10px] font-bold text-brand-navy">Rajesh Kumar</p>
              </div>
            </AdminCard>
          ))}
        </div>
      </div>
    </div>
  )
}
