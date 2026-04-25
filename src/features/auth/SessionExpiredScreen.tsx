/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminCard } from "@/components/shared/Cards"
import { ShieldAlert, LogIn, Clock3, LockKeyhole } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function SessionExpiredScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center w-full">
          <div className="w-16 h-16 bg-brand-gold rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-brand-gold/20">
            <span className="text-brand-navy text-3xl font-bold tracking-tighter">C</span>
          </div>
          <h1 className="text-brand-gold text-2xl font-bold tracking-[0.2em] uppercase">Coolzo</h1>
          <p className="text-brand-muted text-xs mt-1 tracking-widest uppercase">Admin Portal</p>
        </div>

        <AdminCard className="p-6 sm:p-8 border-brand-navy/20 bg-brand-surface/95 backdrop-blur-sm shadow-2xl text-center">
          <div className="w-20 h-20 bg-status-urgent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-status-urgent">
            <ShieldAlert size={40} />
          </div>
          
          <h2 className="text-2xl font-bold text-brand-navy mb-3">Session Expired</h2>
          <p className="text-sm text-brand-muted mb-6 leading-relaxed">
            For your security, your admin session is no longer active. Sign in again to restore access and continue where you left off.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            <div className="rounded-2xl border border-brand-navy/10 bg-brand-navy/5 p-3">
              <div className="flex items-center gap-2 text-brand-navy mb-1">
                <Clock3 size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Reason</span>
              </div>
              <p className="text-sm font-semibold text-brand-navy">Timeout or forced refresh</p>
            </div>
            <div className="rounded-2xl border border-brand-navy/10 bg-brand-navy/5 p-3">
              <div className="flex items-center gap-2 text-brand-navy mb-1">
                <LockKeyhole size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Action</span>
              </div>
              <p className="text-sm font-semibold text-brand-navy">Login required</p>
            </div>
          </div>

          <AdminButton
            fullWidth
            onClick={() => navigate("/login")}
            iconLeft={<LogIn size={18} />}
            className="h-12 text-sm font-bold uppercase tracking-[0.1em]"
          >
            Re-Authenticate
          </AdminButton>
        </AdminCard>

        <p className="text-center mt-8 text-brand-muted/40 text-[10px] uppercase tracking-[0.2em]">
          Coolzo Enterprise Security Protocol v1.0
        </p>
      </motion.div>
    </div>
  )
}
