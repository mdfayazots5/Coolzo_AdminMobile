/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { serviceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { technicianRepository } from "@/core/network/technician-repository"
import { useAuthStore } from "@/store/auth-store"
import { 
  ClipboardList, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Bell,
  Star,
  ChevronRight,
  Navigation,
  Phone
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function TechnicianHomeDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [todayJobs, setTodayJobs] = React.useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCheckedIn, setIsCheckedIn] = React.useState(false)

  React.useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.id) return;
      try {
        const myJobs = await serviceRequestRepository.getTechnicianJobs(user.id);
        // Filter jobs assigned to this technician for today
        const filtered = myJobs.filter(sr => 
          sr.status === 'assigned' || sr.status === 'en-route' || sr.status === 'arrived' || sr.status === 'in-progress'
        );
        setTodayJobs(filtered);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, [user?.id])

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    toast.success("Checked in from base successfully", {
      description: `GPS recorded at ${new Date().toLocaleTimeString()}`
    });
  }

  if (isLoading) return <InlineLoader className="h-screen" />;

  const nextJob = todayJobs[0];
  const completedToday = 0; // Mock

  return (
    <div className="space-y-6 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 bg-brand-navy text-brand-gold rounded-2xl flex items-center justify-center font-bold text-xl">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-navy">Hello, {user?.name}</h1>
            <p className="text-xs text-brand-muted font-bold uppercase tracking-widest">Technician ID: {user?.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => toast.info("Check Notification", { description: "2 new job updates from operations team." })}
            className="p-3 bg-white border border-border rounded-2xl text-brand-navy relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 size-2 bg-status-emergency rounded-full border-2 border-white" />
          </button>
        </div>
      </div>

      {/* Attendance Card */}
      {!isCheckedIn ? (
        <AdminCard className="p-6 bg-brand-gold/10 border-brand-gold/30">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-brand-gold text-brand-navy rounded-2xl flex items-center justify-center">
              <MapPin size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-brand-navy">Ready for work?</h3>
              <p className="text-xs text-brand-navy/70">Check in from base to start receiving navigation.</p>
            </div>
            <AdminButton 
              onClick={() => {
                if (user?.id) {
                  technicianRepository.updateTechnician(user.id, { status: 'available' });
                  handleCheckIn();
                }
              }} 
              size="sm"
            >
              Check In
            </AdminButton>
          </div>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <KPIBlock label="Jobs Today" value={todayJobs.length.toString()} icon={<ClipboardList size={16} />} color="navy" />
          <KPIBlock label="Completed" value={completedToday.toString()} icon={<CheckCircle2 size={16} />} color="green" />
        </div>
      )}

      {/* Next Job Countdown */}
      {nextJob && (
        <AdminCard className="p-6 bg-brand-navy text-brand-gold overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold text-[10px] font-bold rounded-full uppercase tracking-widest">
                Next Job
              </span>
              <div className="flex items-center gap-2 text-brand-gold/60">
                <Clock size={14} />
                <span className="text-xs font-bold">Starts in 45m</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-1">{nextJob.srNumber}</h2>
            <p className="text-sm opacity-80 mb-4">{nextJob.serviceType}</p>
            <div className="flex items-center gap-2 text-xs mb-6">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{nextJob.location.address}</span>
            </div>
            <AdminButton 
              className="w-full bg-brand-gold text-brand-navy hover:bg-brand-gold/90"
              onClick={() => navigate(`/field/job/${nextJob.id}`)}
            >
              View Job Details
            </AdminButton>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10">
            <Navigation size={160} />
          </div>
        </AdminCard>
      )}

      {/* Today's Schedule */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-widest">Today's Schedule</h3>
          <button className="text-xs font-bold text-brand-gold" onClick={() => navigate('/field/jobs')}>View All</button>
        </div>
        <div className="space-y-4">
          {todayJobs.map(job => (
            <JobListItem key={job.id} job={job} onClick={() => navigate(`/field/job/${job.id}`)} />
          ))}
          {todayJobs.length === 0 && (
            <div className="p-8 text-center bg-brand-navy/5 rounded-3xl border border-dashed border-border">
              <ClipboardList size={32} className="mx-auto text-brand-muted mb-2 opacity-20" />
              <p className="text-sm text-brand-muted">No jobs assigned for today yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <AdminCard className="p-6">
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-4">Your Performance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-brand-gold mb-1">
              <Star size={14} fill="currentColor" />
              <span className="text-lg font-bold text-brand-navy">4.8</span>
            </div>
            <p className="text-[9px] text-brand-muted font-bold uppercase">Rating</p>
          </div>
          <div className="text-center">
            <span className="text-lg font-bold text-brand-navy block mb-1">98%</span>
            <p className="text-[9px] text-brand-muted font-bold uppercase">SLA</p>
          </div>
          <div className="text-center">
            <span className="text-lg font-bold text-brand-navy block mb-1">12</span>
            <p className="text-[9px] text-brand-muted font-bold uppercase">Incentive</p>
          </div>
        </div>
      </AdminCard>
    </div>
  )
}

function KPIBlock({ label, value, icon, color }: any) {
  return (
    <div className={cn(
      "p-4 rounded-3xl border",
      color === 'navy' ? "bg-brand-navy/5 border-brand-navy/10" : "bg-status-completed/5 border-status-completed/10"
    )}>
      <div className={cn(
        "size-8 rounded-xl flex items-center justify-center mb-2",
        color === 'navy' ? "bg-brand-navy text-brand-gold" : "bg-status-completed text-white"
      )}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-brand-navy">{value}</p>
      <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{label}</p>
    </div>
  )
}

function JobListItem(props: any) {
  const { job, onClick } = props;
  return (
    <div 
      onClick={onClick}
      className="p-4 bg-white border border-border rounded-3xl flex items-center gap-4 hover:border-brand-gold transition-all cursor-pointer group"
    >
      <div className={cn(
        "size-12 rounded-2xl flex items-center justify-center shrink-0",
        job.priority === 'emergency' ? "bg-status-emergency/10 text-status-emergency" : "bg-brand-navy/5 text-brand-navy"
      )}>
        <ClipboardList size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{job.scheduling.requestedSlot}</span>
          {job.priority === 'emergency' && (
            <span className="px-2 py-0.5 bg-status-emergency text-white text-[8px] font-bold rounded-full uppercase">Emergency</span>
          )}
        </div>
        <h4 className="text-sm font-bold text-brand-navy truncate">{job.customer.name}</h4>
        <p className="text-[10px] text-brand-muted truncate">{job.location.address}</p>
      </div>
      <ChevronRight size={18} className="text-brand-muted group-hover:text-brand-gold transition-colors" />
    </div>
  )
}
