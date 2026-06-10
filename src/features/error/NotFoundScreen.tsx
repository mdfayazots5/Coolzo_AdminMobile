/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"
import { Home, ArrowLeft, MapPin } from "lucide-react"

export default function NotFoundScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brand-white flex flex-col items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-lg w-full bg-white rounded-[32px] p-8 shadow-2xl shadow-brand-navy/5 border border-border relative overflow-hidden"
      >
        {/* Accent Glow */}
        <div className="absolute -top-24 -right-24 size-48 bg-brand-gold/10 blur-3xl rounded-full" />

        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="size-20 bg-brand-gold/10 rounded-3xl flex items-center justify-center text-brand-gold mb-2">
            <MapPin size={40} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-brand-gold/10 text-brand-gold text-[10px] font-bold rounded-md uppercase tracking-widest">Error 404</span>
            </div>
            <h1 className="text-2xl font-bold text-brand-navy tracking-tight">Path Not Found</h1>
            <p className="text-sm text-brand-muted leading-relaxed max-w-sm mx-auto">
              The page you're looking for doesn't exist or has been moved to another coordinate.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full pt-4">
            <AdminButton
              variant="outline"
              onClick={() => navigate(-1)}
              iconLeft={<ArrowLeft size={18} />}
            >
              Go Back
            </AdminButton>
            <AdminButton
              onClick={() => navigate('/dashboard')}
              iconLeft={<Home size={18} />}
            >
              Dashboard
            </AdminButton>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
