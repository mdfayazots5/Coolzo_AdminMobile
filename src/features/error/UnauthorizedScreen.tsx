/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { ShieldX, ArrowLeft, MessageSquare, LayoutGrid, LockKeyhole } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"

export default function UnauthorizedScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const blockedModule = typeof location.state?.module === "string" ? location.state.module : ""
  const blockedRoute = typeof location.state?.from === "string" ? location.state.from : location.pathname
  const moduleLabel = blockedModule
    ? blockedModule.replace(/[-_]/g, " ").replace(/\b\w/g, (segment) => segment.toUpperCase())
    : "Restricted Module"

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-1 py-6 md:px-0">
      <motion.div
        initial={false}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-3xl"
      >
        <AdminCard className="overflow-hidden border-status-emergency/20 shadow-2xl">
          <div className="bg-[radial-gradient(circle_at_top_right,_rgba(239,68,68,0.12),_transparent_40%),linear-gradient(180deg,_rgba(15,23,42,0.02),_rgba(15,23,42,0))] p-6 md:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-status-emergency/10 rounded-3xl flex items-center justify-center mb-6 text-status-emergency">
                  <ShieldX size={32} className="md:size-10" />
                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-status-emergency mb-3">
                  Permission Required
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-navy mb-4">Access Restricted</h2>
                <p className="text-sm md:text-base text-brand-muted leading-relaxed">
                  Your current role does not have permission to open this area. If you believe this access should be available, contact your system administrator or switch to a role with the required module access.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-md">
                <div className="rounded-2xl border border-brand-navy/10 bg-brand-navy/5 p-4">
                  <div className="flex items-center gap-2 text-brand-navy mb-2">
                    <LayoutGrid size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Blocked Module</span>
                  </div>
                  <p className="text-sm font-semibold text-brand-navy break-words">{moduleLabel}</p>
                </div>
                <div className="rounded-2xl border border-brand-navy/10 bg-brand-navy/5 p-4">
                  <div className="flex items-center gap-2 text-brand-navy mb-2">
                    <LockKeyhole size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Current Route</span>
                  </div>
                  <p className="text-sm font-semibold text-brand-navy break-all">{blockedRoute}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AdminButton
                onClick={() => navigate(-1)}
                iconLeft={<ArrowLeft size={18} />}
                className="sm:min-w-44"
              >
                Go Back
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => navigate("/dashboard")}
                className="sm:min-w-44"
              >
                Go to Dashboard
              </AdminButton>
              <AdminButton
                variant="ghost"
                iconLeft={<MessageSquare size={18} />}
                onClick={() => {
                  window.location.href = "mailto:it-support@coolzo.com"
                }}
                className="sm:min-w-44"
              >
                Contact Support
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      </motion.div>
    </div>
  )
}
