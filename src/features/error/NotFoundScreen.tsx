/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"
import { Home, ArrowLeft, RefreshCw } from "lucide-react"

export default function NotFoundScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="relative">
          <div className="text-[120px] font-black text-brand-navy/5 leading-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-24 bg-brand-gold rounded-full flex items-center justify-center text-brand-navy shadow-xl shadow-brand-gold/20">
              <MapPin size={48} className="animate-bounce" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-brand-navy tracking-tight">Path Not Found</h1>
          <p className="text-brand-muted">
            The page you're looking for doesn't exist or has been moved to another coordinate.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <AdminButton 
            fullWidth 
            onClick={() => navigate('/dashboard')}
            iconLeft={<Home size={18} />}
          >
            Return to Dashboard
          </AdminButton>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 text-sm font-bold text-brand-muted hover:text-brand-navy transition-colors py-2"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  )
}

import { MapPin } from "lucide-react"
