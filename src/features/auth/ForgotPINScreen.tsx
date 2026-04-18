/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function ForgotPINScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md z-10"
      >
        <button 
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-brand-muted hover:text-brand-gold transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Login</span>
        </button>

        <AdminCard className="p-8 border-brand-navy/20 bg-brand-surface/95 backdrop-blur-sm">
          <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-gold">
            <MessageSquare size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-brand-navy mb-4 text-center">Forgot Your PIN?</h2>
          <p className="text-sm text-brand-muted mb-6 leading-relaxed text-center">
            For security reasons, field team PINs cannot be reset self-service. Please contact your Branch Manager or HR Administrator to reset your access credentials.
          </p>

          <div className="bg-brand-navy/5 p-6 rounded-xl space-y-4">
            <a href="tel:+911800266596" className="block hover:bg-brand-navy/5 p-2 rounded-lg transition-colors">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">HR Support Hotline</p>
              <p className="text-sm font-bold text-brand-navy">+91 1800-COOLZO-HR</p>
            </a>
            <a href="mailto:admin-support@coolzo.com" className="block hover:bg-brand-navy/5 p-2 rounded-lg transition-colors">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Admin Email</p>
              <p className="text-sm font-bold text-brand-navy">admin-support@coolzo.com</p>
            </a>
          </div>

          <p className="text-[11px] text-brand-muted mt-8 text-center italic">
            Please have your Employee ID ready for verification.
          </p>
        </AdminCard>
      </motion.div>
    </div>
  )
}
