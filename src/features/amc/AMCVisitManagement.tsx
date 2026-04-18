/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { amcRepository, AMCVisit } from "@/core/network/amc-repository"
import { 
  Calendar, 
  Search, 
  Filter, 
  User, 
  MapPin, 
  Clock, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ChevronLeft
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function AMCVisitManagement() {
  const navigate = useNavigate();
  const [visits, setVisits] = React.useState<AMCVisit[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'scheduled' | 'completed' | 'missed'>('all')

  React.useEffect(() => {
    const fetchVisits = async () => {
      try {
        const data = await amcRepository.getVisits({});
        setVisits(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchVisits();
  }, [])

  const filteredVisits = visits.filter(v => filter === 'all' || v.status === filter);

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">AMC Visit Management</h1>
          <p className="text-sm text-brand-muted">Track and schedule recurring maintenance visits</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Calendar size={18} />}>Calendar View</AdminButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by customer or contract #..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All Visits" />
          <FilterButton active={filter === 'scheduled'} onClick={() => setFilter('scheduled')} label="Scheduled" />
          <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')} label="Completed" />
          <FilterButton active={filter === 'missed'} onClick={() => setFilter('missed')} label="Missed" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredVisits.map((visit, idx) => (
          <motion.div
            key={visit.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <VisitCard visit={visit} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function FilterButton({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
        active ? "bg-brand-navy text-brand-gold" : "bg-white text-brand-muted border border-border hover:border-brand-gold"
      )}
    >
      {label}
    </button>
  )
}

function VisitCard({ visit }: { visit: AMCVisit }) {
  return (
    <AdminCard className="p-6 hover:shadow-xl transition-all group">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "size-12 rounded-2xl flex items-center justify-center shrink-0",
            visit.status === 'completed' ? "bg-status-completed/10 text-status-completed" : 
            visit.status === 'scheduled' ? "bg-brand-navy/5 text-brand-navy" : "bg-status-emergency/10 text-status-emergency"
          )}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-brand-navy">Visit {visit.visitNumber} of {visit.totalVisits}</h3>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                visit.status === 'completed' ? "bg-status-completed/10 text-status-completed" :
                visit.status === 'scheduled' ? "bg-brand-navy/5 text-brand-navy" : "bg-status-emergency/10 text-status-emergency"
              )}>
                {visit.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="flex items-center gap-1 font-bold text-brand-navy"><Clock size={12} /> {visit.scheduledDate}</span>
              <span className="size-1 bg-border rounded-full" />
              <span>{visit.scheduledSlot}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xs">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy">
              <User size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Technician</p>
              <p className="text-xs font-bold text-brand-navy">{visit.assignedTechnicianName || 'Unassigned'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-6">
          <div className="flex gap-2">
            {visit.status === 'scheduled' && !visit.assignedTechnicianId && (
              <AdminButton size="sm">Assign Tech</AdminButton>
            )}
            {visit.status === 'scheduled' && visit.assignedTechnicianId && (
              <AdminButton size="sm" variant="outline">Reschedule</AdminButton>
            )}
            {visit.status === 'completed' && (
              <AdminButton size="sm" variant="outline" icon={<CheckCircle2 size={14} />}>View Report</AdminButton>
            )}
          </div>
          <button className="p-2 text-brand-muted hover:bg-brand-navy/5 rounded-lg">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </AdminCard>
  )
}
