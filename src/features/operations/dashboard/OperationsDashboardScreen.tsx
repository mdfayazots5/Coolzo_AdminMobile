/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { StatusBadge } from "@/components/shared/Badges"
import { useLivePolling } from "@/lib/hooks/useLivePolling"
import { serviceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { technicianRepository, Technician } from "@/core/network/technician-repository"
import { toast } from "sonner"
import { 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  User, 
  MapPin, 
  ChevronRight, 
  Zap,
  ShieldAlert,
  Users,
  Briefcase,
  TrendingUp,
  ArrowRight
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"

export default function OperationsDashboardScreen() {
  const navigate = useNavigate()
  const [stats, setStats] = React.useState<any>(null)
  const [pendingSRs, setPendingSRs] = React.useState<ServiceRequest[]>([])
  const [techs, setTechs] = React.useState<Technician[]>([])
  const [slaAlerts, setSlaAlerts] = React.useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    try {
      const [s, allSRs, allTechs, alerts] = await Promise.all([
        serviceRequestRepository.getOperationsStats(),
        serviceRequestRepository.getSRs({ status: 'pending' }),
        technicianRepository.getAvailabilityBoard(),
        serviceRequestRepository.getSLAAlerts()
      ]);
      setStats(s);
      setPendingSRs(allSRs.filter(sr => sr.status === 'pending'));
      setTechs(allTechs);
      setSlaAlerts(alerts);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { lastUpdated, manualRefresh } = useLivePolling(fetchData, 60000);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && !stats) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Auto-refresh status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Operations Command Center</h1>
          <p className="text-sm text-brand-muted flex items-center gap-2">
            Live field visibility • Last updated: {lastUpdated.toLocaleTimeString()}
            <button onClick={manualRefresh} className="p-1 hover:bg-brand-navy/5 rounded-full transition-colors">
              <RefreshCw size={14} className="text-brand-gold" />
            </button>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton variant="outline" size="sm" onClick={() => navigate('/team/availability')}>
            <Users size={16} className="mr-2" />
            Availability Board
          </AdminButton>
          <AdminButton size="sm" onClick={() => navigate('/service-requests/create')}>
            New Request
          </AdminButton>
        </div>
      </div>

      {/* Live KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPIBlock 
          label="Today's Jobs" 
          value={stats.total} 
          icon={<Briefcase size={16} />} 
          color="navy" 
          onClick={() => navigate('/service-requests')}
        />
        <KPIBlock 
          label="Pending" 
          value={stats.pending} 
          icon={<Clock size={16} />} 
          color="gold" 
          highlight={stats.pending > 0} 
          onClick={() => navigate('/service-requests?status=pending')}
        />
        <KPIBlock 
          label="In Progress" 
          value={stats.inProgress} 
          icon={<Zap size={16} />} 
          color="blue" 
          onClick={() => navigate('/service-requests?status=in-progress')}
        />
        <KPIBlock 
          label="Completed" 
          value={stats.completed} 
          icon={<TrendingUp size={16} />} 
          color="green" 
          onClick={() => navigate('/service-requests?status=completed')}
        />
        <KPIBlock 
          label="Overdue" 
          value={stats.overdue} 
          icon={<AlertCircle size={16} />} 
          color="red" 
          highlight={stats.overdue > 0} 
          onClick={() => navigate('/operations/sla-alerts')}
        />
        <KPIBlock 
          label="SLA Compliance" 
          value={`${stats.slaCompliance}%`} 
          icon={<ShieldAlert size={16} />} 
          color="green" 
          onClick={() => navigate('/governance/reports')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pending Queue & SLA Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Assignment Queue */}
          <AdminCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-brand-navy/[0.02]">
              <SectionHeader title="Pending Assignment" icon={<Clock size={18} />} className="mb-0" />
              <span className="px-2 py-0.5 bg-brand-gold/10 text-brand-gold text-[10px] font-bold rounded-full uppercase tracking-widest">
                {pendingSRs.length} Unassigned
              </span>
            </div>
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto no-scrollbar">
              {pendingSRs.length > 0 ? (
                pendingSRs.map(sr => (
                  <div key={sr.id} className="p-4 hover:bg-brand-navy/[0.01] transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center",
                        sr.priority === 'emergency' ? "bg-status-emergency/10 text-status-emergency" : 
                        sr.priority === 'urgent' ? "bg-status-pending/10 text-status-pending" : "bg-brand-navy/5 text-brand-navy"
                      )}>
                        {sr.priority === 'emergency' ? <Zap size={20} /> : <Briefcase size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-bold text-brand-navy">{sr.srNumber}</h4>
                          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">• {sr.customer.name}</span>
                        </div>
                        <p className="text-[11px] text-brand-muted flex items-center gap-1.5">
                          <MapPin size={10} /> Zone {sr.location.zoneId} • {sr.serviceType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] font-bold text-brand-navy">{sr.scheduling.requestedSlot}</p>
                        <p className="text-[9px] text-brand-muted uppercase tracking-widest">Requested Slot</p>
                      </div>
                      <AdminButton 
                        size="sm" 
                        variant="primary" 
                        className="h-8 text-[10px] font-bold uppercase tracking-widest"
                        onClick={() => navigate(`/operations/dispatch?srId=${sr.id}`)}
                      >
                        Assign
                      </AdminButton>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-brand-muted text-sm">No pending assignments</div>
              )}
            </div>
            <div className="p-3 bg-brand-navy/[0.02] border-t border-border text-center">
              <button 
                onClick={() => navigate('/service-requests')}
                className="text-[10px] font-bold text-brand-gold uppercase tracking-widest hover:underline"
              >
                View Full Queue
              </button>
            </div>
          </AdminCard>

          {/* SLA Alert Panel */}
          <AdminCard className="p-0 overflow-hidden border-l-4 border-l-status-emergency">
            <div className="p-4 border-b border-border flex items-center justify-between bg-status-emergency/[0.02]">
              <SectionHeader title="SLA Breach Alerts" icon={<ShieldAlert size={18} className="text-status-emergency" />} className="mb-0" />
              <AdminButton 
                variant="outline" 
                size="sm" 
                className="h-7 text-[9px] border-status-emergency text-status-emergency"
                onClick={() => navigate('/operations/sla-alerts')}
              >
                View All
              </AdminButton>
            </div>
            <div className="divide-y divide-border">
              {slaAlerts.map(sr => (
                <div key={sr.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-status-emergency" />
                    <div>
                      <h4 className="text-sm font-bold text-brand-navy">{sr.srNumber} • {sr.customer.name}</h4>
                      <p className="text-[10px] text-status-emergency font-bold uppercase tracking-widest">
                        {sr.priority === 'emergency' ? 'Emergency SLA Breach Risk' : 'SLA Breached (15m ago)'}
                      </p>
                    </div>
                  </div>
                  <AdminButton 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] border-status-emergency text-status-emergency hover:bg-status-emergency/5"
                    onClick={() => {
                      toast.error(`SLA Escalation initiated for ${sr.srNumber}`, {
                        description: 'Operational managers have been notified.'
                      });
                    }}
                  >
                    Escalate
                  </AdminButton>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        {/* Right Column: Technician Status Board */}
        <div className="space-y-6">
          <AdminCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-brand-navy/[0.02]">
              <SectionHeader title="Technician Status" icon={<Users size={18} />} className="mb-0" />
              <div className="flex gap-1">
                <div className="size-2 rounded-full bg-status-completed" />
                <div className="size-2 rounded-full bg-brand-gold" />
                <div className="size-2 rounded-full bg-brand-muted" />
              </div>
            </div>
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto no-scrollbar">
              {techs.map(tech => (
                <div 
                  key={tech.id} 
                  onClick={() => navigate(`/team/technician/${tech.id}`)}
                  className="p-3 rounded-xl border border-border hover:border-brand-gold transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-brand-navy/5 rounded-lg flex items-center justify-center text-brand-navy border border-brand-navy/10 overflow-hidden">
                        {tech.photo ? (
                          <img src={tech.photo} alt={tech.name} className="size-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-navy">{tech.name}</h4>
                        <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest">Zone {tech.zones.join(', ')}</p>
                      </div>
                    </div>
                    <StatusBadge status={tech.status === 'available' ? 'completed' : tech.status === 'on-job' ? 'assigned' : 'closed'} className="text-[8px] px-1.5 py-0.5">
                      {tech.status.replace('-', ' ')}
                    </StatusBadge>
                  </div>
                  
                  {tech.status === 'on-job' && (
                    <div className="mb-3 p-2 bg-brand-navy/5 rounded-lg border border-brand-navy/10">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[8px] font-bold text-brand-muted uppercase tracking-widest">Current Job</p>
                        <p className="text-[8px] font-bold text-brand-gold uppercase tracking-widest">ETA: 15m</p>
                      </div>
                      <p className="text-[10px] font-bold text-brand-navy truncate">{tech.currentJobId}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-brand-navy/5">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-brand-navy">{tech.todayJobCount}</p>
                        <p className="text-[8px] text-brand-muted uppercase tracking-widest">Done</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-brand-navy">{tech.nextFreeSlot || '--:--'}</p>
                        <p className="text-[8px] text-brand-muted uppercase tracking-widest">Next Free</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-brand-muted group-hover:text-brand-gold transition-colors" />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-brand-navy/[0.02] border-t border-border text-center">
              <button 
                onClick={() => navigate('/team/availability')}
                className="text-[10px] font-bold text-brand-navy uppercase tracking-widest hover:underline"
              >
                Full Availability Board
              </button>
            </div>
          </AdminCard>

          {/* Quick Insights */}
          <AdminCard className="p-6 bg-brand-navy text-brand-gold">
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4">Operations Insight</h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="p-2 bg-brand-gold/20 rounded-lg h-fit">
                  <TrendingUp size={16} />
                </div>
                <p className="text-[11px] leading-relaxed">
                  <span className="font-bold">Zone 2</span> is currently overloaded with 5 pending jobs. Consider reassigning <span className="font-bold">Rajesh</span> from Zone 1.
                </p>
              </div>
              <AdminButton 
                size="sm" 
                className="w-full bg-brand-gold text-brand-navy font-bold text-[10px] uppercase tracking-widest"
                onClick={() => toast.success('Optimization engine started. Re-routing technicians for maximum efficiency...')}
              >
                Optimize Dispatch
              </AdminButton>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

function KPIBlock({ label, value, icon, color, highlight, onClick }: any) {
  const colors = {
    navy: "text-brand-navy bg-brand-navy/5",
    gold: "text-brand-gold bg-brand-gold/5",
    blue: "text-blue-600 bg-blue-50",
    green: "text-status-completed bg-status-completed/5",
    red: "text-status-emergency bg-status-emergency/5"
  } as any;

  return (
    <AdminCard 
      onClick={onClick}
      className={cn(
        "p-4 flex flex-col items-center text-center transition-all cursor-pointer hover:shadow-md active:scale-95",
        highlight ? "ring-2 ring-brand-gold ring-offset-2" : ""
      )}
    >
      <div className={cn("p-2 rounded-lg mb-2", colors[color])}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-brand-navy">{value}</h3>
      <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">{label}</p>
    </AdminCard>
  )
}
