/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { serviceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { useAuthStore } from "@/store/auth-store"
import { 
  ClipboardList, 
  MapPin, 
  Clock, 
  ChevronRight,
  Filter,
  Search,
  ChevronLeft,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function MyJobsList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [jobs, setJobs] = React.useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'today' | 'upcoming' | 'history'>('today')

  React.useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.id) return;
      try {
        const myJobs = await serviceRequestRepository.getTechnicianJobs(user.id);
        setJobs(myJobs);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, [user?.id])

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
          <ChevronLeft size={20} className="text-brand-navy" />
        </button>
        <h1 className="text-xl font-bold text-brand-navy">My Job Queue</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-brand-navy/5 rounded-2xl">
        <TabButton active={filter === 'today'} onClick={() => setFilter('today')} label="Today" />
        <TabButton active={filter === 'upcoming'} onClick={() => setFilter('upcoming')} label="Upcoming" />
        <TabButton active={filter === 'history'} onClick={() => setFilter('history')} label="History" />
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search SR#, Customer..."
            className="w-full bg-white border border-border rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-brand-gold outline-none"
          />
        </div>
        <button 
          onClick={() => toast.info("Filter Jobs", { description: "Filter by status, priority or date range." })}
          className="p-3 bg-white border border-border rounded-2xl text-brand-navy"
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.map((job, idx) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <JobCard job={job} onClick={() => navigate(`/field/job/${job.id}`)} />
          </motion.div>
        ))}
        {jobs.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList size={48} className="mx-auto text-brand-muted mb-4 opacity-20" />
            <p className="text-brand-muted">No jobs found in this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
        active ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted"
      )}
    >
      {label}
    </button>
  )
}

function JobCard({ job, onClick }: { job: ServiceRequest, onClick: () => void }) {
  return (
    <AdminCard 
      onClick={onClick}
      className={cn(
        "p-5 border-l-4 cursor-pointer hover:shadow-lg transition-all",
        job.priority === 'emergency' ? "border-l-status-emergency" : 
        job.priority === 'urgent' ? "border-l-status-pending" : "border-l-brand-gold"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest block mb-1">
            {job.scheduling.requestedSlot}
          </span>
          <h4 className="text-sm font-bold text-brand-navy">{job.srNumber}</h4>
        </div>
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
          job.status === 'completed' ? "bg-status-completed/10 text-status-completed" :
          job.status === 'in-progress' ? "bg-status-pending/10 text-status-pending" : "bg-brand-navy/5 text-brand-navy"
        )}>
          {job.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-brand-navy font-bold">
          <User size={14} className="text-brand-muted" />
          <span>{job.customer.name}</span>
        </div>
        <div className="flex items-start gap-2 text-[11px] text-brand-muted">
          <MapPin size={14} className="shrink-0 mt-0.5" />
          <span className="line-clamp-1">{job.location.address}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="size-6 bg-brand-navy/5 rounded-lg flex items-center justify-center text-brand-navy">
            <Clock size={12} />
          </div>
          <span className="text-[10px] font-bold text-brand-navy uppercase tracking-widest">Est. {job.scheduling.estimatedDuration || 90}m</span>
        </div>
        <ChevronRight size={16} className="text-brand-gold" />
      </div>
    </AdminCard>
  )
}
