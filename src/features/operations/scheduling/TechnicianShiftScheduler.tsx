/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { technicianRepository, Technician } from "@/core/network/technician-repository"
import { 
  Calendar, 
  Clock, 
  User, 
  Save, 
  Plus, 
  Trash2, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ArrowLeft
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TechnicianShiftScheduler() {
  const navigate = useNavigate()
  const [techs, setTechs] = React.useState<Technician[]>([])
  const [selectedTech, setSelectedTech] = React.useState<Technician | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    const fetchTechs = async () => {
      try {
        const data = await technicianRepository.getTechnicians({});
        setTechs(data);
        if (data.length > 0) setSelectedTech(data[0]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTechs();
  }, [])

  const handleSave = async () => {
    if (!selectedTech) return;
    setIsSaving(true);
    try {
      await technicianRepository.updateTechnician(selectedTech.id, { shifts: selectedTech.shifts });
      toast.success("Shift schedule updated successfully");
    } catch (error) {
      toast.error("Failed to update schedule");
    } finally {
      setIsSaving(false);
    }
  }

  const toggleOffDay = (dayIdx: number) => {
    if (!selectedTech) return;
    const newShifts = selectedTech.shifts.map(s => 
      s.dayOfWeek === dayIdx ? { ...s, isOffDay: !s.isOffDay } : s
    );
    setSelectedTech({ ...selectedTech, shifts: newShifts });
  }

  const updateTime = (dayIdx: number, field: 'startTime' | 'endTime', value: string) => {
    if (!selectedTech) return;
    const newShifts = selectedTech.shifts.map(s => 
      s.dayOfWeek === dayIdx ? { ...s, [field]: value } : s
    );
    setSelectedTech({ ...selectedTech, shifts: newShifts });
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
            <h1 className="text-2xl font-bold text-brand-navy">Shift & Roster Management</h1>
            <p className="text-sm text-brand-muted">Define working hours and off-days for field staff</p>
          </div>
        </div>
        <AdminButton 
          onClick={handleSave} 
          disabled={isSaving}
          iconLeft={<Save size={18} />}
        >
          {isSaving ? 'Saving...' : 'Save Roster'}
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Technician List */}
        <div className="lg:col-span-4 space-y-4">
          <AdminCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border bg-brand-navy/[0.02]">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest">Select Technician</h3>
            </div>
            <div className="divide-y divide-border">
              {techs.map(tech => (
                <div 
                  key={tech.id} 
                  onClick={() => setSelectedTech(tech)}
                  className={cn(
                    "p-4 flex items-center justify-between cursor-pointer transition-all",
                    selectedTech?.id === tech.id ? "bg-brand-navy/5 border-l-4 border-l-brand-gold" : "hover:bg-brand-navy/[0.01] border-l-4 border-l-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-brand-navy/5 rounded-xl flex items-center justify-center text-brand-navy border border-brand-navy/10 overflow-hidden">
                      {tech.photo ? (
                        <img src={tech.photo} alt={tech.name} className="size-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brand-navy">{tech.name}</h4>
                      <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{tech.designation}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={cn("transition-transform", selectedTech?.id === tech.id ? "text-brand-gold rotate-90" : "text-brand-muted")} />
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="p-6 bg-brand-gold/10 border-brand-gold/20">
            <div className="flex gap-3">
              <AlertCircle size={20} className="text-brand-gold shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-brand-navy uppercase tracking-widest mb-1">Roster Policy</h4>
                <p className="text-[11px] text-brand-navy/70 leading-relaxed">
                  Changes to the roster will be notified to the technician via push notification. Ensure 24-hour notice for shift changes.
                </p>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Shift Editor */}
        <div className="lg:col-span-8">
          {selectedTech ? (
            <AdminCard className="p-0 overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-brand-navy text-brand-gold rounded-2xl flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-navy">Weekly Shift Schedule</h3>
                    <p className="text-sm text-brand-muted">Configuring roster for {selectedTech.name}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {DAYS.map((day, idx) => {
                  const shift = selectedTech.shifts.find(s => s.dayOfWeek === idx);
                  if (!shift) return null;

                  return (
                    <div key={day} className={cn(
                      "p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4",
                      shift.isOffDay ? "bg-brand-navy/[0.02] border-dashed border-brand-navy/10" : "bg-white border-border"
                    )}>
                      <div className="flex items-center gap-4 min-w-[140px]">
                        <div className={cn(
                          "size-10 rounded-xl flex items-center justify-center font-bold text-xs",
                          shift.isOffDay ? "bg-brand-muted/10 text-brand-muted" : "bg-brand-gold/10 text-brand-gold"
                        )}>
                          {day.substring(0, 3).toUpperCase()}
                        </div>
                        <span className={cn("text-sm font-bold", shift.isOffDay ? "text-brand-muted" : "text-brand-navy")}>{day}</span>
                      </div>

                      {!shift.isOffDay ? (
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-brand-muted" />
                            <input 
                              type="time" 
                              value={shift.startTime}
                              onChange={(e) => updateTime(idx, 'startTime', e.target.value)}
                              className="bg-brand-navy/5 border-none rounded-lg px-3 py-2 text-xs font-bold text-brand-navy focus:ring-1 focus:ring-brand-gold"
                            />
                          </div>
                          <span className="text-brand-muted font-bold">to</span>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-brand-muted" />
                            <input 
                              type="time" 
                              value={shift.endTime}
                              onChange={(e) => updateTime(idx, 'endTime', e.target.value)}
                              className="bg-brand-navy/5 border-none rounded-lg px-3 py-2 text-xs font-bold text-brand-navy focus:ring-1 focus:ring-brand-gold"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center gap-2 text-brand-muted italic text-xs">
                          <ShieldCheck size={14} />
                          Weekly Off Day
                        </div>
                      )}

                      <button 
                        onClick={() => toggleOffDay(idx)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                          shift.isOffDay ? "bg-brand-gold text-brand-navy" : "bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10"
                        )}
                      >
                        {shift.isOffDay ? 'Set as Working' : 'Set as Off-Day'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </AdminCard>
          ) : (
            <div className="h-full flex items-center justify-center text-brand-muted">
              Select a technician to manage their shift
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
