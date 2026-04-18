/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { StatusBadge } from "@/components/shared/Badges"
import { PerformanceKPIBlock } from "@/components/shared/TechnicianCard"
import { MockTechnicianRepository, Technician } from "@/core/network/technician-repository"
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Star, 
  Briefcase, 
  ShieldCheck, 
  History, 
  Calendar,
  Award,
  TrendingUp,
  AlertCircle,
  Clock,
  Edit2,
  MoreVertical,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"

const techRepo = new MockTechnicianRepository();

export default function TechnicianDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tech, setTech] = React.useState<Technician | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<'performance' | 'attendance' | 'skills' | 'history'>('performance')

  React.useEffect(() => {
    const fetchTech = async () => {
      if (!id) return;
      try {
        const data = await techRepo.getTechnicianById(id);
        setTech(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTech();
  }, [id])

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!tech) return <div className="p-8 text-center">Technician not found</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-brand-navy" />
          </button>
          <div className="flex items-center gap-4">
            <div className="size-14 bg-brand-navy/5 rounded-2xl flex items-center justify-center text-brand-navy border border-brand-navy/10 overflow-hidden">
              {tech.photo ? (
                <img src={tech.photo} alt={tech.name} className="size-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={28} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-brand-navy">{tech.name}</h1>
                <StatusBadge status={tech.status === 'available' ? 'completed' : 'assigned'}>
                  {tech.status.replace('-', ' ')}
                </StatusBadge>
              </div>
              <p className="text-xs text-brand-muted">{tech.employeeId} • {tech.designation} • {tech.branch}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton variant="outline" size="sm" onClick={() => {}}>
            <Edit2 size={16} className="mr-2" />
            Edit Profile
          </AdminButton>
          <AdminButton size="sm">
            Manage Attendance
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Quick Info */}
        <div className="space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Contact & Zones" icon={<MapPin size={18} />} />
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 text-brand-navy">
                <Phone size={16} className="text-brand-muted" />
                <span className="text-sm font-medium">{tech.phone}</span>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2">Assigned Zones</p>
                <div className="flex flex-wrap gap-2">
                  {tech.zones.map(z => (
                    <span key={z} className="px-2 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-bold rounded uppercase tracking-widest border border-brand-gold/20">
                      Zone {z}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Today's Status" icon={<Clock size={18} />} />
            <div className="mt-4 space-y-4">
              <div className="p-3 bg-brand-navy/5 rounded-xl">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Current Job</p>
                <p className="text-sm font-bold text-brand-navy">{tech.currentJobId || 'No Active Job'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-brand-navy/5 rounded-xl">
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Jobs Done</p>
                  <p className="text-sm font-bold text-brand-navy">{tech.todayJobCount}</p>
                </div>
                <div className="p-3 bg-brand-navy/5 rounded-xl">
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Next Free</p>
                  <p className="text-sm font-bold text-brand-navy">{tech.nextFreeSlot || '--:--'}</p>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-border overflow-x-auto no-scrollbar">
            {[
              { id: 'performance', label: 'Performance', icon: <TrendingUp size={16} /> },
              { id: 'attendance', label: 'Attendance', icon: <Calendar size={16} /> },
              { id: 'skills', label: 'Skills & Certs', icon: <Award size={16} /> },
              { id: 'history', label: 'Job History', icon: <History size={16} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap",
                  activeTab === tab.id 
                    ? "border-brand-gold text-brand-navy" 
                    : "border-transparent text-brand-muted hover:text-brand-navy"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <PerformanceKPIBlock 
                      label="Avg Rating" 
                      value={tech.performance.avgRating} 
                      icon={<Star size={20} />} 
                      colorClass="bg-status-pending/10 text-status-pending"
                      trend={{ val: 5, positive: true }}
                    />
                    <PerformanceKPIBlock 
                      label="Jobs Completed" 
                      value={tech.performance.totalJobs} 
                      icon={<Briefcase size={20} />} 
                      colorClass="bg-brand-navy/10 text-brand-navy"
                    />
                    <PerformanceKPIBlock 
                      label="SLA Compliance" 
                      value={`${tech.performance.slaCompliance}%`} 
                      icon={<ShieldCheck size={20} />} 
                      colorClass="bg-status-completed/10 text-status-completed"
                      trend={{ val: 2, positive: true }}
                    />
                    <PerformanceKPIBlock 
                      label="Revisit Rate" 
                      value={`${tech.performance.revisitRate}%`} 
                      icon={<AlertCircle size={20} />} 
                      colorClass="bg-status-emergency/10 text-status-emergency"
                      trend={{ val: 1, positive: false }}
                    />
                  </div>

                  <AdminCard className="p-6">
                    <SectionHeader title="Performance Insights" />
                    <div className="mt-4 p-4 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                      <p className="text-sm text-brand-navy leading-relaxed">
                        Rajesh is performing <span className="font-bold text-status-completed">12% above team average</span> in SLA compliance. 
                        His revisit rate has dropped by 1% this month, indicating improved quality of service. 
                        Consider assigning him for high-value Enterprise VRF jobs.
                      </p>
                    </div>
                  </AdminCard>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="April 2024 Attendance" className="mb-0" />
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted uppercase">
                        <div className="size-2 rounded-full bg-status-completed" /> Present
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted uppercase">
                        <div className="size-2 rounded-full bg-status-emergency" /> Absent
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted uppercase">
                        <div className="size-2 rounded-full bg-status-pending" /> Leave
                      </div>
                    </div>
                  </div>
                  <AdminCard className="p-6">
                    <div className="grid grid-cols-7 gap-2">
                      {/* Mock Calendar Grid */}
                      {Array.from({ length: 30 }).map((_, i) => {
                        const day = i + 1;
                        const isPresent = day < 11;
                        const isToday = day === 11;
                        return (
                          <div 
                            key={i} 
                            className={cn(
                              "aspect-square rounded-lg flex flex-col items-center justify-center border transition-all",
                              isToday ? "border-brand-gold bg-brand-gold/5" : "border-brand-navy/5",
                              isPresent ? "bg-status-completed/5" : ""
                            )}
                          >
                            <span className="text-[10px] font-bold text-brand-muted mb-1">{day}</span>
                            {isPresent && <CheckCircle2 size={12} className="text-status-completed" />}
                            {isToday && <Clock size={12} className="text-brand-gold" />}
                            {day === 15 && <XCircle size={12} className="text-status-emergency" />}
                          </div>
                        )
                      })}
                    </div>
                  </AdminCard>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="Skills & Certifications" className="mb-0" />
                    <AdminButton size="sm" iconLeft={<Award size={16} />}>Add Skill</AdminButton>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tech.skills.map(skill => (
                      <AdminCard key={skill.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            skill.category === 'brand' ? "bg-purple-50 text-purple-600" : 
                            skill.category === 'equipment' ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
                          )}>
                            <Award size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-brand-navy">{skill.name}</h4>
                            <p className="text-[10px] text-brand-muted uppercase tracking-widest">{skill.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Verified</p>
                          <p className="text-[10px] font-bold text-status-completed">Active</p>
                        </div>
                      </AdminCard>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <SectionHeader title="Recent Job History" />
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <AdminCard key={i} className="p-4 flex items-center justify-between hover:border-brand-gold transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="size-10 bg-brand-navy/5 rounded-xl flex items-center justify-center text-brand-navy">
                            <History size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-brand-navy">SR-9928{i} • AC Repair</h4>
                            <p className="text-[10px] text-brand-muted uppercase tracking-widest">10 Apr 2024 • Powai, Mumbai</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Star size={10} className="text-status-pending fill-status-pending" />
                              <span className="text-xs font-bold text-brand-navy">5.0</span>
                            </div>
                            <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Rating</p>
                          </div>
                          <StatusBadge status="completed">Completed</StatusBadge>
                        </div>
                      </AdminCard>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
