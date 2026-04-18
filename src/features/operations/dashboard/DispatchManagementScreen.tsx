/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { StatusBadge } from "@/components/shared/Badges"
import { serviceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { technicianRepository, Technician } from "@/core/network/technician-repository"
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  User, 
  Zap, 
  CheckCircle2,
  ChevronRight,
  Info,
  ShieldCheck,
  Briefcase
} from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function DispatchManagementScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialSrId = searchParams.get('srId')

  const [pendingSRs, setPendingSRs] = React.useState<ServiceRequest[]>([])
  const [techs, setTechs] = React.useState<Technician[]>([])
  const [selectedSR, setSelectedSR] = React.useState<ServiceRequest | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAssigning, setIsAssigning] = React.useState(false)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [allSRs, allTechs] = await Promise.all([
          serviceRequestRepository.getSRs({ status: 'pending' }),
          technicianRepository.getAvailabilityBoard()
        ]);
        const unassigned = allSRs.filter(sr => sr.status === 'pending');
        setPendingSRs(unassigned);
        setTechs(allTechs);
        
        if (initialSrId) {
          const sr = unassigned.find(s => s.id === initialSrId);
          if (sr) setSelectedSR(sr);
        } else if (unassigned.length > 0) {
          setSelectedSR(unassigned[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [initialSrId])

  const handleAssign = async (tech: Technician) => {
    if (!selectedSR) return;
    setIsAssigning(true);
    try {
      await serviceRequestRepository.assignTechnician(selectedSR.id, tech.id, tech.name);
      toast.success(`SR assigned to ${tech.name} successfully`);
      
      // Refresh local state
      setPendingSRs(prev => prev.filter(s => s.id !== selectedSR.id));
      setSelectedSR(null);
      
      // If there are more pending, select the next one
      const remaining = pendingSRs.filter(s => s.id !== selectedSR.id);
      if (remaining.length > 0) setSelectedSR(remaining[0]);
    } catch (error) {
      toast.error("Failed to assign technician");
    } finally {
      setIsAssigning(false);
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Dispatch Management</h1>
            <p className="text-sm text-brand-muted">Assign service requests to available field staff</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
            <Filter size={16} className="text-brand-muted" />
            <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">All Zones</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Panel: Unassigned SRs */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
          <AdminCard className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-brand-navy/[0.02]">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-widest">Unassigned Queue ({pendingSRs.length})</h3>
              <Search size={16} className="text-brand-muted" />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-border">
              {pendingSRs.map(sr => (
                <div 
                  key={sr.id} 
                  onClick={() => setSelectedSR(sr)}
                  className={cn(
                    "p-4 cursor-pointer transition-all border-l-4",
                    selectedSR?.id === sr.id ? "bg-brand-navy/5 border-l-brand-gold" : "border-l-transparent hover:bg-brand-navy/[0.01]"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-navy">{sr.srNumber}</span>
                    <StatusBadge status={sr.priority === 'emergency' ? 'urgent' : sr.priority === 'urgent' ? 'pending' : 'closed'}>
                      {sr.priority}
                    </StatusBadge>
                  </div>
                  <h4 className="text-sm font-bold text-brand-navy mb-1">{sr.customer.name}</h4>
                  <p className="text-[11px] text-brand-muted flex items-center gap-1.5 mb-2">
                    <MapPin size={10} /> Zone {sr.location.zoneId} • {sr.serviceType}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-bold text-brand-muted uppercase tracking-widest">
                    <span>Requested: {sr.scheduling.requestedSlot}</span>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        {/* Right Panel: Technician Availability & Selection */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
          {selectedSR ? (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Selected SR Summary */}
              <AdminCard className="p-4 bg-brand-navy text-brand-gold border-none shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-brand-gold/20 rounded-xl flex items-center justify-center">
                      <Zap size={20} className="text-brand-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Assigning {selectedSR.srNumber}</h3>
                      <p className="text-xs text-brand-gold/70">{selectedSR.customer.name} • {selectedSR.location.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest">Required Skill</p>
                    <p className="text-sm font-bold">{selectedSR.equipment.brand} {selectedSR.equipment.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-brand-gold/20">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-brand-gold/60" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{selectedSR.scheduling.requestedSlot}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-brand-gold/60" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Zone {selectedSR.location.zoneId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-brand-gold/60" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{selectedSR.serviceType}</span>
                  </div>
                </div>
              </AdminCard>

              {/* Technician Grid */}
              <AdminCard className="flex-1 flex flex-col p-0 overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between bg-brand-navy/[0.02]">
                  <h3 className="text-sm font-bold text-brand-navy uppercase tracking-widest">Available Technicians</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted uppercase">
                      <div className="size-2 rounded-full bg-status-completed" /> Skill Match
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted uppercase">
                      <div className="size-2 rounded-full bg-brand-gold" /> Zone Match
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 no-scrollbar">
                  {techs.map(tech => {
                    const isZoneMatch = tech.zones.includes(selectedSR.location.zoneId);
                    const isSkillMatch = tech.skills.some(s => s.name.includes(selectedSR.equipment.brand));
                    
                    return (
                      <div 
                        key={tech.id} 
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all flex flex-col justify-between",
                          isSkillMatch ? "border-status-completed/20 bg-status-completed/[0.02]" : 
                          isZoneMatch ? "border-brand-gold/20 bg-brand-gold/[0.02]" : "border-border"
                        )}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="size-12 bg-brand-navy/5 rounded-xl flex items-center justify-center text-brand-navy border border-brand-navy/10 overflow-hidden">
                              {tech.photo ? (
                                <img src={tech.photo} alt={tech.name} className="size-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={24} />
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-brand-navy">{tech.name}</h4>
                              <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{tech.designation}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <ShieldCheck size={12} className={isSkillMatch ? "text-status-completed" : "text-brand-muted"} />
                              <span className="text-[10px] font-bold text-brand-navy">Zone {tech.zones.join(', ')}</span>
                            </div>
                            <StatusBadge status={tech.status === 'available' ? 'completed' : 'assigned'} className="text-[8px] px-1.5 py-0.5 mt-1">
                              {tech.status}
                            </StatusBadge>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-brand-muted uppercase tracking-widest">Jobs Today</span>
                            <span className="font-bold text-brand-navy">{tech.todayJobCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-brand-muted uppercase tracking-widest">Rating</span>
                            <span className="font-bold text-brand-navy">{tech.rating} ★</span>
                          </div>
                        </div>

                        <AdminButton 
                          size="sm" 
                          className="w-full text-[10px] font-bold uppercase tracking-widest"
                          disabled={tech.status !== 'available' || isAssigning}
                          onClick={() => handleAssign(tech)}
                        >
                          {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                        </AdminButton>
                      </div>
                    )
                  })}
                </div>
              </AdminCard>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-brand-muted">
              <div className="text-center">
                <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">Select an SR from the queue to dispatch</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
