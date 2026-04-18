/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { technicianRepository, AttendanceRecord } from "@/core/network/technician-repository"
import { useAuthStore } from "@/store/auth-store"
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Coffee,
  AlertCircle,
  ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function AttendanceScreen() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [attendance, setAttendance] = React.useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?.id) return;
      try {
        const data = await technicianRepository.getTechnicianById(user.id);
        if (data) {
          setAttendance(data.attendance);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAttendance();
  }, [user?.id])

  if (isLoading) return <InlineLoader className="h-screen" />;

  // Stats
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const leaveDays = attendance.filter(a => a.status === 'leave').length;
  const workingDays = attendance.length;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
          <ChevronLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Attendance Logs</h1>
          <p className="text-sm text-brand-muted">Monthly performance & check-in records</p>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatItem label="Working Days" value={workingDays.toString()} icon={<Calendar size={18} />} color="navy" />
        <StatItem label="Present" value={presentDays.toString()} icon={<CheckCircle2 size={18} />} color="green" />
        <StatItem label="Off/Leave" value={leaveDays.toString()} icon={<Coffee size={18} />} color="orange" />
        <StatItem label="On Time" value="95%" icon={<Clock size={18} />} color="blue" />
      </div>

      <AdminCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border">
          <SectionHeader title="Activity History" icon={<Clock size={18} />} className="mb-0" />
        </div>
        <div className="divide-y divide-border">
          {attendance.map((log, idx) => (
            <div key={idx} className="p-6 flex items-center justify-between hover:bg-brand-navy/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center",
                  log.status === 'present' ? "bg-status-completed/10 text-status-completed" : "bg-status-pending/10 text-status-pending"
                )}>
                  {log.status === 'present' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-navy">{log.date}</p>
                  <p className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">{log.status}</p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="text-right">
                  <p className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Check In</p>
                  <p className="text-xs font-bold text-brand-navy">{log.checkIn || '--:--'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Check Out</p>
                  <p className="text-xs font-bold text-brand-navy">{log.checkOut || '--:--'}</p>
                </div>
              </div>
            </div>
          ))}
          {attendance.length === 0 && (
            <div className="p-12 text-center">
              <AlertCircle size={32} className="mx-auto text-brand-muted mb-2 opacity-20" />
              <p className="text-sm text-brand-muted">No attendance logs found for this month.</p>
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}

function StatItem({ label, value, icon, color }: any) {
  const colors: any = {
    navy: "bg-brand-navy border-brand-navy/10 text-brand-gold",
    green: "bg-status-completed/10 border-status-completed/10 text-status-completed",
    orange: "bg-status-pending/10 border-status-pending/10 text-status-pending",
    blue: "bg-brand-navy/5 border-brand-navy/10 text-brand-navy"
  };

  return (
    <div className={cn("p-4 rounded-3xl border", colors[color])}>
      <div className="flex items-center justify-between mb-2">
        <span className="opacity-60">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">{label}</p>
    </div>
  )
}
