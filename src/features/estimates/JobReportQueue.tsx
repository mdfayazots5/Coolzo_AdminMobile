/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader } from "@/components/shared/Layout"
import { jobReportRepository, JobReport } from "@/core/network/job-report-repository"
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  User,
  Camera,
  Star
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function JobReportQueue() {
  const navigate = useNavigate();
  const [reports, setReports] = React.useState<JobReport[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'pending_review' | 'approved' | 'flagged'>('all')
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await jobReportRepository.getJobReports({});
        setReports(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, [])

  const filteredReports = reports.filter((report) => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = [report.srNumber, report.technicianName, report.serviceType]
      .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Job Reports Queue</h1>
          <p className="text-sm text-brand-muted">Review and approve technician service reports</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<BarChart3 size={18} />} onClick={() => navigate('/job-reports/dashboard')}>Quality Dashboard</AdminButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by SR #, Technician or Service Type..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All Reports" />
          <FilterButton active={filter === 'pending_review'} onClick={() => setFilter('pending_review')} label="Pending Review" />
          <FilterButton active={filter === 'approved'} onClick={() => setFilter('approved')} label="Approved" />
          <FilterButton active={filter === 'flagged'} onClick={() => setFilter('flagged')} label="Flagged" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReports.map((report, idx) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <ReportCard report={report} onClick={() => navigate(`/job-reports/${report.id}`)} />
          </motion.div>
        ))}
        {filteredReports.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-border">
            <ClipboardCheck size={48} className="mx-auto text-brand-muted mb-4 opacity-20" />
            <p className="text-brand-muted">No reports found in the queue.</p>
          </div>
        )}
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

function ReportCard({ report, onClick }: { report: JobReport, onClick: () => void }) {
  const statusConfig = {
    pending_review: { icon: <Clock size={14} />, class: "bg-status-pending/10 text-status-pending", label: "Pending Review" },
    approved: { icon: <CheckCircle2 size={14} />, class: "bg-status-completed/10 text-status-completed", label: "Approved" },
    flagged: { icon: <AlertCircle size={14} />, class: "bg-status-emergency/10 text-status-emergency", label: "Flagged" }
  };

  const config = statusConfig[report.status];

  return (
    <AdminCard 
      onClick={onClick}
      className="p-6 hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", config.class)}>
            <ClipboardCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-brand-navy">SR: {report.srNumber}</h3>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1", config.class)}>
                {config.icon} {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="font-bold text-brand-navy">{report.serviceType}</span>
              <span className="size-1 bg-border rounded-full" />
              <span>Submitted {new Date(report.submissionTime).toLocaleString()}</span>
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
              <p className="text-xs font-bold text-brand-navy">{report.technicianName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-8">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-brand-navy font-bold">
                <Camera size={14} className="text-brand-muted" />
                <span>{report.photos.length}</span>
              </div>
              <p className="text-[8px] text-brand-muted font-bold uppercase tracking-widest">Photos</p>
            </div>
            <div className="size-px h-8 bg-border" />
            <div className="text-center">
              <div className="flex items-center gap-1 text-brand-navy font-bold">
                <Star size={14} className="text-brand-gold" />
                <span>{report.qualityScore}</span>
              </div>
              <p className="text-[8px] text-brand-muted font-bold uppercase tracking-widest">Score</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-brand-gold group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </AdminCard>
  )
}

function BarChart3({ size }: { size: number }) {
  return <div className="size-5 bg-brand-navy/5 rounded flex items-end gap-0.5 p-1">
    <div className="w-1 h-2 bg-brand-navy/40 rounded-full" />
    <div className="w-1 h-3 bg-brand-navy/60 rounded-full" />
    <div className="w-1 h-1.5 bg-brand-navy/30 rounded-full" />
  </div>
}
