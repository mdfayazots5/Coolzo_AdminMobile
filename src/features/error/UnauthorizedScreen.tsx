/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { ShieldX, ArrowLeft, MessageSquare } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"

export default function UnauthorizedScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brand-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={false}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <AdminCard className="p-6 md:p-10 border-status-emergency/20 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-status-emergency/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 text-status-emergency">
            <ShieldX size={32} className="md:size-10" />
          </div>
          
          <h2 className="text-2xl font-bold text-brand-navy mb-4">Access Restricted</h2>
          <p className="text-sm text-brand-muted mb-10 leading-relaxed">
            Your current role does not have permission to access this module. If you believe this is an error, please contact your System Administrator.
          </p>

          <div className="space-y-4">
            <AdminButton
              fullWidth
              onClick={() => navigate(-1)}
              iconLeft={<ArrowLeft size={18} />}
            >
              Go Back
            </AdminButton>
            <AdminButton
              fullWidth
              variant="ghost"
              iconLeft={<MessageSquare size={18} />}
              onClick={() => window.location.href = 'mailto:it-support@coolzo.com'}
            >
              Contact Support
            </AdminButton>
          </div>
        </AdminCard>
      </motion.div>
    </div>
  )
}
