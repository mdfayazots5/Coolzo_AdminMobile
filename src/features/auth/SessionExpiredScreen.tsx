/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminCard } from "@/components/shared/Cards"
import { ShieldAlert, LogIn } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function SessionExpiredScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md z-10"
      >
        <AdminCard className="p-10 border-brand-navy/20 bg-brand-surface/95 backdrop-blur-sm text-center">
          <div className="w-20 h-20 bg-status-urgent/10 rounded-full flex items-center justify-center mx-auto mb-8 text-status-urgent">
            <ShieldAlert size={40} />
          </div>
          
          <h2 className="text-2xl font-bold text-brand-navy mb-4">Session Expired</h2>
          <p className="text-sm text-brand-muted mb-10 leading-relaxed">
            For your security, your session has timed out due to inactivity or a security update. Please log in again to continue.
          </p>

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
