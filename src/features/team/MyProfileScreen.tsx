/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { StatusBadge } from "@/components/shared/Badges"
import { useAuthStore, UserRole } from "@/store/auth-store"
import { authRepository } from "@/core/network/auth-repository"
import { toast } from "sonner"
import { 
  User, 
  Briefcase, 
  Star, 
  ShieldCheck, 
  Clock, 
  Phone, 
  MapPin, 
  LogOut,
  KeyRound,
  AlertCircle
} from "lucide-react"
import { technicianRepository, Technician } from "@/core/network/technician-repository"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { InlineLoader } from "@/components/shared/Layout"

export default function MyProfileScreen() {
  const { user, logout } = useAuthStore()
  const [techData, setTechData] = React.useState<Technician | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        if (user.role === UserRole.TECHNICIAN || user.role === UserRole.HELPER) {
          const data = await technicianRepository.getTechnicianById(user.id);
          setTechData(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user])

  const [isChangingPin, setIsChangingPin] = React.useState(false)
  const [newPin, setNewPin] = React.useState("")

  const handleChangePin = () => {
    if (newPin.length === 4) {
      toast.success("PIN updated successfully")
      setIsChangingPin(false)
      setNewPin("")
    } else {
      toast.error("PIN must be 4 digits")
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;

  const isFieldStaff = user?.role === UserRole.TECHNICIAN || user?.role === UserRole.HELPER;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Change PIN Modal Placeholder Logic */}
      <AnimatePresence>
        {isChangingPin && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangingPin(false)}
              className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-t-[32px] sm:rounded-[32px] p-8 relative z-10 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-brand-navy mb-2">Change Access PIN</h3>
              <p className="text-sm text-brand-muted mb-6">Enter a new 4-digit security PIN for your field login.</p>
              
              <div className="space-y-4">
                <input 
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-16 bg-brand-navy/5 rounded-2xl border-none text-center text-2xl font-bold tracking-[1em] focus:ring-2 focus:ring-brand-gold outline-none"
                />
                <AdminButton fullWidth onClick={handleChangePin}>
                  Confirm New PIN
                </AdminButton>
                <button 
                  onClick={() => setIsChangingPin(false)}
                  className="w-full text-xs font-bold text-brand-muted uppercase tracking-widest py-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="flex flex-col items-center text-center pt-6">
        <div className="size-24 bg-brand-navy rounded-3xl flex items-center justify-center text-brand-gold mb-4 shadow-xl border-4 border-white">
          <User size={48} />
        </div>
        <h1 className="text-2xl font-bold text-brand-navy">{user?.name}</h1>
        <p className="text-sm text-brand-muted font-bold uppercase tracking-widest">
          {techData?.employeeId || 'CZ-ADMIN'} • {techData?.designation || user?.role?.replace('_', ' ')}
        </p>
        <div className="mt-4">
          <StatusBadge status="completed" className="px-4 py-1.5 text-xs">
            {(techData?.status || 'Active').toUpperCase()}
          </StatusBadge>
        </div>
      </div>

      {isFieldStaff && (
        <div className="grid grid-cols-2 gap-4">
          <AdminCard className="p-4 text-center">
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Today's Jobs</p>
            <h3 className="text-xl font-bold text-brand-navy">{techData?.todayJobCount || 0}</h3>
            <p className="text-[10px] text-status-completed font-bold mt-1">Active Performance</p>
          </AdminCard>
          <AdminCard className="p-4 text-center">
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Your Rating</p>
            <div className="flex items-center justify-center gap-1">
              <Star size={16} className="text-status-pending fill-status-pending" />
              <h3 className="text-xl font-bold text-brand-navy">{techData?.performance.avgRating || '0.0'}</h3>
            </div>
            <p className="text-[10px] text-brand-muted font-bold mt-1">Based on feedback</p>
          </AdminCard>
        </div>
      )}

      <AdminCard className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Branch Location</p>
              <p className="text-sm font-bold text-brand-navy">{techData?.branch || 'Mumbai HQ'}</p>
            </div>
          </div>
          {isFieldStaff && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">SLA Compliance</p>
                <p className="text-sm font-bold text-status-completed">{techData?.performance.slaCompliance || 0}%</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-border space-y-4">
          <h4 className="text-xs font-bold text-brand-navy uppercase tracking-widest">Account Settings</h4>
          <button 
            onClick={() => setIsChangingPin(true)}
            className="w-full flex items-center justify-between p-4 bg-brand-navy/5 rounded-xl hover:bg-brand-navy/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <KeyRound size={18} className="text-brand-muted group-hover:text-brand-navy" />
              <span className="text-sm font-bold text-brand-navy">Change Access PIN</span>
            </div>
            <Clock size={16} className="text-brand-muted" />
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-between p-4 bg-status-emergency/5 rounded-xl hover:bg-status-emergency/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} className="text-status-emergency" />
              <span className="text-sm font-bold text-status-emergency">Logout Session</span>
            </div>
          </button>
        </div>
      </AdminCard>

      <div className="p-4 bg-brand-navy text-brand-gold rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-gold/20 rounded-lg">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">Emergency?</p>
            <p className="text-[10px] text-brand-gold/70">Contact Operations Desk</p>
          </div>
        </div>
        <AdminButton 
          size="sm" 
          className="bg-brand-gold text-brand-navy font-bold"
          onClick={() => window.location.href = 'tel:+911800266596'}
        >
          Call Now
        </AdminButton>
      </div>
    </div>
  )
}
