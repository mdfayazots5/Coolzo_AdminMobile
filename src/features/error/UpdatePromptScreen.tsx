/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { Download, Rocket } from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"

export default function UpdatePromptScreen() {
  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md z-10"
      >
        <AdminCard className="p-6 md:p-10 border-brand-gold/20 bg-brand-surface/95 backdrop-blur-sm text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 text-brand-gold">
            <Rocket size={32} className="md:size-10" />
          </div>
          
          <h2 className="text-2xl font-bold text-brand-navy mb-4">Update Required</h2>
          <p className="text-sm text-brand-muted mb-10 leading-relaxed">
            A critical security and performance update is available. To continue using the Coolzo Admin Platform, please update to the latest version.
          </p>

          <div className="space-y-4">
            <AdminButton
              fullWidth
              iconLeft={<Download size={18} />}
              className="h-12 text-sm font-bold uppercase tracking-[0.1em]"
            >
              Update from Play Store
            </AdminButton>
            <p className="text-[10px] text-brand-muted uppercase tracking-widest">
              Current Version: v1.0.0 • Required: v1.1.0
            </p>
          </div>
        </AdminCard>
      </motion.div>
    </div>
  )
}
