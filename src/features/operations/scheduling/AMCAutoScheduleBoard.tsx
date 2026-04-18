/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { MockServiceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { 
  Calendar, 
  User, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Filter,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  ArrowLeft
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

const srRepo = new MockServiceRequestRepository();

export default function AMCAutoScheduleBoard() {
  const navigate = useNavigate()
  const [amcJobs, setAmcJobs] = React.useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedJobs, setSelectedJobs] = React.useState<string[]>([])

  React.useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await srRepo.getSRs({});
        // Mocking some jobs as AMC auto-generated
        setAmcJobs(data.map(s => ({ ...s, serviceType: 'AMC Maintenance', subType: 'Quarterly Service' })));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, [])

  const toggleSelect = (id: string) => {
    setSelectedJobs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  const handleBulkAssign = () => {
    if (selectedJobs.length === 0) return;
    toast.success(`Bulk assignment triggered for ${selectedJobs.length} jobs`);
  }

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">AMC Auto-Schedule Board</h1>
            <p className="text-sm text-brand-muted">Review and assign system-generated AMC maintenance visits</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl shadow-sm">
            <Filter size={16} className="text-brand-muted" />
            <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">Next 7 Days</span>
          </div>
          <AdminButton 
            onClick={handleBulkAssign} 
            disabled={selectedJobs.length === 0}
            iconLeft={<Zap size={18} />}
          >
            Bulk Assign ({selectedJobs.length})
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="space-y-4">
          <AdminCard className="p-6">
            <h4 className="text-xs font-bold text-brand-navy uppercase tracking-widest mb-4">Filters</h4>
            <div className="space-y-4">
              <FilterGroup label="Contract Type" options={['Comprehensive', 'Non-Comprehensive', 'Labor Only']} />
              <FilterGroup label="Zone" options={['Zone 1', 'Zone 2', 'Zone 3']} />
              <FilterGroup label="Priority" options={['High', 'Medium', 'Low']} />
            </div>
          </AdminCard>

          <AdminCard className="p-6 bg-brand-navy text-brand-gold">
            <div className="flex gap-3">
              <ShieldCheck size={20} />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-1">AMC Automation</h4>
                <p className="text-[10px] opacity-80 leading-relaxed">
                  These visits are generated based on contract terms. Unassigned visits will be flagged as SLA risks if not scheduled 48h before the slot.
                </p>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Main List */}
        <div className="lg:col-span-3 space-y-4">
          {amcJobs.map(job => (
            <div 
              key={job.id} 
              onClick={() => toggleSelect(job.id)}
              className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4",
                selectedJobs.includes(job.id) ? "bg-brand-navy/5 border-brand-gold shadow-md" : "bg-white border-border hover:border-brand-navy/20"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center",
                  selectedJobs.includes(job.id) ? "bg-brand-gold text-brand-navy" : "bg-brand-navy/5 text-brand-navy"
                )}>
                  {selectedJobs.includes(job.id) ? <CheckCircle2 size={20} /> : <Calendar size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-bold text-brand-navy">{job.srNumber}</h4>
                    <span className="px-2 py-0.5 bg-brand-navy/5 text-[9px] font-bold text-brand-navy rounded uppercase tracking-widest">
                      {job.subType}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-brand-navy">{job.customer.name}</p>
                  <p className="text-[10px] text-brand-muted flex items-center gap-1.5 mt-1">
                    <MapPin size={10} /> {job.location.address}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-bold text-brand-navy">{job.scheduling.requestedDate}</p>
                  <p className="text-[10px] text-brand-muted uppercase tracking-widest">{job.scheduling.requestedSlot}</p>
                </div>
                <div className="h-10 w-px bg-border hidden md:block" />
                <div className="flex items-center gap-2">
                  <div className="size-8 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-muted">
                    <User size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Assigned To</p>
                    <p className="text-xs font-bold text-brand-navy">Unassigned</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-brand-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ label, options }: any) {
  return (
    <div>
      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => (
          <button 
            key={opt} 
            onClick={() => toast.info(`Filtering AMC by ${label}: ${opt}`)}
            className="px-3 py-1.5 bg-brand-navy/5 text-[10px] font-bold text-brand-navy rounded-lg hover:bg-brand-navy/10 transition-colors"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
