/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { serviceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { technicianRepository, Technician } from "@/core/network/technician-repository"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertTriangle,
  MoreVertical,
  Plus,
  Filter,
  Download,
  Share2,
  TrendingUp,
  ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addDays, startOfDay, eachHourOfInterval, isSameDay, parseISO } from "date-fns"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { AdminButton } from "@/components/shared/AdminButton"

const HOURS = eachHourOfInterval({
  start: new Date(0, 0, 0, 8),
  end: new Date(0, 0, 0, 20)
});

const JobBlock = (props: any) => {
  const { sr, onClick } = props;
  const duration = sr.scheduling.estimatedDuration || 60;
  const height = (duration / 60) * 80; // 80px per hour

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute inset-x-1 z-10 p-2 rounded-lg border shadow-sm cursor-pointer group/job",
        sr.status === 'completed' ? "bg-status-completed/10 border-status-completed/20 text-status-completed" :
        sr.status === 'on-site' ? "bg-status-pending/10 border-status-pending/20 text-status-pending" :
        sr.status === 'assigned' ? "bg-brand-gold/10 border-brand-gold/20 text-brand-gold" : "bg-brand-navy/5 border-brand-navy/10 text-brand-navy"
      )}
      style={{ height: `${height - 4}px`, top: '2px' }}
    >
      <div className="flex justify-between items-start">
        <p className="text-[9px] font-bold truncate">{sr.srNumber}</p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toast.info(`Quick actions for ${sr.srNumber}`, {
              description: "Re-schedule, Cancel, or Re-assign options."
            });
          }}
          className="p-1 hover:bg-black/5 rounded"
        >
          <MoreVertical size={10} className="opacity-0 group-hover/job:opacity-100 transition-opacity" />
        </button>
      </div>
      <p className="text-[10px] font-bold truncate mt-0.5">{sr.customer.name}</p>
      <p className="text-[8px] opacity-70 truncate">{sr.serviceType}</p>
    </motion.div>
  )
}

export default function SchedulingBoardDayView() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = React.useState(new Date())
  const [techs, setTechs] = React.useState<Technician[]>([])
  const [srs, setSrs] = React.useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [allTechs, allSRs] = await Promise.all([
          technicianRepository.getTechnicians({}),
          serviceRequestRepository.getSRs({})
        ]);
        setTechs(allTechs);
        setSrs(allSRs);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [])

  const changeDate = (days: number) => {
    setSelectedDate(prev => addDays(prev, days));
  }

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Scheduling Board</h1>
            <p className="text-sm text-brand-muted">Daily technician timeline and job allocation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-border rounded-xl shadow-sm p-1">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-lg transition-colors">
              <ChevronLeft size={18} className="text-brand-navy" />
            </button>
            <div className="px-4 flex items-center gap-2">
              <CalendarIcon size={16} className="text-brand-gold" />
              <span className="text-sm font-bold text-brand-navy">{format(selectedDate, 'EEE, MMM dd, yyyy')}</span>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-brand-navy/5 rounded-lg transition-colors">
              <ChevronRight size={18} className="text-brand-navy" />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => toast.info("Filter Board", { description: "Filter by Zone, Technician Skill, or Priority." })}
              className="p-2.5 bg-white border border-border rounded-xl text-brand-navy hover:bg-brand-navy/5 transition-colors shadow-sm"
            >
              <Filter size={18} />
            </button>
            <button 
              onClick={() => toast.success("Daily Schedule Downloaded", { description: "PDF report saved to your downloads folder." })}
              className="p-2.5 bg-white border border-border rounded-xl text-brand-navy hover:bg-brand-navy/5 transition-colors shadow-sm"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Scheduling Grid */}
      <AdminCard className="p-0 overflow-hidden border-none shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[800px]">
            {/* Grid Header: Technicians */}
            <div className="flex border-b border-border bg-brand-navy/[0.02]">
              <div className="w-20 shrink-0 border-r border-border flex items-center justify-center p-4">
                <Clock size={16} className="text-brand-muted" />
              </div>
              {techs.map(tech => (
                <div key={tech.id} className="flex-1 min-w-[200px] p-4 border-r border-border last:border-r-0">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-brand-navy/5 rounded-xl flex items-center justify-center text-brand-navy border border-brand-navy/10 overflow-hidden">
                      {tech.photo ? (
                        <img src={tech.photo} alt={tech.name} className="size-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-navy">{tech.name}</h4>
                      <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest">{tech.designation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Body: Time Slots */}
            <div className="relative">
              {HOURS.map((hour, hourIdx) => (
                <div key={hourIdx} className="flex border-b border-border last:border-b-0 group">
                  <div className="w-20 shrink-0 border-r border-border p-4 flex flex-col items-center justify-center bg-brand-navy/[0.01]">
                    <span className="text-[10px] font-bold text-brand-navy">{format(hour, 'hh:mm')}</span>
                    <span className="text-[8px] text-brand-muted font-bold uppercase">{format(hour, 'a')}</span>
                  </div>
                  {techs.map(tech => (
                    <div key={tech.id} className="flex-1 min-w-[200px] border-r border-border last:border-r-0 h-20 relative group-hover:bg-brand-navy/[0.01] transition-colors">
                      {/* Render Jobs for this tech and hour */}
                      {srs
                        .filter(sr => 
                          sr.scheduling.assignedTechnicianId === tech.id && 
                          sr.scheduling.startTime &&
                          isSameDay(parseISO(sr.scheduling.startTime), selectedDate) &&
                          new Date(sr.scheduling.startTime).getHours() === hour.getHours()
                        )
                        .map(sr => (
                          <JobBlock 
                            key={sr.id} 
                            sr={sr} 
                            onClick={() => navigate(`/service-requests/${sr.id}`)}
                          />
                        ))
                      }
                      
                      {/* Empty Slot Hover Action */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none">
                        <button 
                          onClick={() => navigate('/service-requests/create')}
                          className="size-8 bg-brand-gold text-brand-navy rounded-full shadow-lg flex items-center justify-center pointer-events-auto transform scale-75 hover:scale-100 transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Side Queue: Unscheduled Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminCard className="p-0 overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-border bg-brand-navy/[0.02] flex items-center justify-between">
            <SectionHeader title="Unscheduled Queue" icon={<AlertTriangle size={18} className="text-brand-gold" />} className="mb-0" />
            <span className="px-2 py-0.5 bg-brand-gold/10 text-brand-gold text-[10px] font-bold rounded-full">
              {srs.filter(s => !s.scheduling.startTime).length} Jobs
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {srs.filter(s => !s.scheduling.startTime).map(sr => (
              <div 
                key={sr.id} 
                onClick={() => navigate(`/operations/dispatch?srId=${sr.id}`)}
                className="p-3 bg-white border border-border rounded-xl hover:border-brand-gold transition-all cursor-move group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-brand-navy">{sr.srNumber}</span>
                  <div className={cn(
                    "size-2 rounded-full",
                    sr.priority === 'emergency' ? "bg-status-emergency" : 
                    sr.priority === 'urgent' ? "bg-status-pending" : "bg-brand-muted"
                  )} />
                </div>
                <h4 className="text-xs font-bold text-brand-navy mb-1">{sr.customer.name}</h4>
                <p className="text-[9px] text-brand-muted uppercase font-bold tracking-widest">{sr.serviceType}</p>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Capacity Overview */}
        <AdminCard className="p-6">
          <SectionHeader title="Capacity Overview" icon={<TrendingUp size={18} />} />
          <div className="mt-6 space-y-6">
            <CapacityItem label="Technician Utilization" value="78%" trend="+5%" positive />
            <CapacityItem label="Avg. Travel Time" value="24m" trend="-2m" positive />
            <CapacityItem label="SLA Risk Jobs" value="3" trend="+1" positive={false} />
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <button 
              onClick={() => toast.success("Briefing Exported", { description: "Daily technician briefing report generated successfully." })}
              className="w-full py-3 bg-brand-navy text-brand-gold rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={14} />
              Export Daily Briefing
            </button>
          </div>
        </AdminCard>

        {/* Quick Actions */}
        <AdminCard className="p-6 bg-brand-navy text-brand-gold">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4">Scheduling Tools</h4>
          <div className="space-y-3">
            <ScheduleToolButton 
              icon={<CalendarIcon size={16} />} 
              label="Manage Shifts" 
              onClick={() => navigate('/scheduling/shifts')}
            />
            <ScheduleToolButton 
              icon={<Clock size={16} />} 
              label="Slot Availability" 
              onClick={() => navigate('/scheduling/amc')}
            />
            <ScheduleToolButton 
              icon={<AlertTriangle size={16} />} 
              label="Resolve Conflicts" 
              badge="2" 
              onClick={() => toast.info("No schedule conflicts detected for today.")}
            />
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function CapacityItem({ label, value, trend, positive }: any) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-bold text-brand-navy">{value}</p>
      </div>
      <div className={cn(
        "px-2 py-1 rounded-lg text-[10px] font-bold",
        positive ? "bg-status-completed/10 text-status-completed" : "bg-status-emergency/10 text-status-emergency"
      )}>
        {trend}
      </div>
    </div>
  )
}

function ScheduleToolButton({ icon, label, badge, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left group"
    >
      <div className="flex items-center gap-3">
        <div className="text-brand-gold group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      {badge && (
        <span className="size-5 bg-status-emergency text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
      <ChevronRight size={14} className="text-brand-gold/40" />
    </button>
  )
}

