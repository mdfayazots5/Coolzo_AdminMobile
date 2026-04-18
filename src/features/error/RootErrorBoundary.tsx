/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useRouteError, useNavigate, isRouteErrorResponse } from "react-router-dom"
import { motion } from "motion/react"
import { AdminButton } from "@/components/shared/AdminButton"
import { AlertCircle, RotateCcw, Home, Info } from "lucide-react"

export default function RootErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  
  console.error("Route Error:", error)

  let title = "System Exception"
  let message = "An unexpected error occurred in the application layer."
  let code = "500"

  if (isRouteErrorResponse(error)) {
    code = error.status.toString()
    if (error.status === 404) {
      title = "Page Not Found"
      message = "The requested module could not be located in the current workspace."
    } else if (error.status === 401) {
      title = "Unauthorized Access"
      message = "You do not have the necessary permissions to view this secure module."
    } else if (error.status === 503) {
      title = "Service Unavailable"
      message = "The underlying API services are currently under maintenance."
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-lg w-full bg-white rounded-[32px] p-8 shadow-2xl shadow-brand-navy/5 border border-border relative overflow-hidden"
      >
        {/* Glow Effect */}
        <div className="absolute -top-24 -right-24 size-48 bg-status-emergency/10 blur-3xl rounded-full" />
        
        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="size-20 bg-status-emergency/10 rounded-3xl flex items-center justify-center text-status-emergency mb-2">
            <AlertCircle size={40} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-status-emergency/10 text-status-emergency text-[10px] font-bold rounded-md uppercase tracking-widest">Error {code}</span>
            </div>
            <h1 className="text-2xl font-bold text-brand-navy tracking-tight">{title}</h1>
            <p className="text-sm text-brand-muted leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
          </div>

          {error instanceof Error && error.stack && (
            <div className="w-full bg-brand-navy/[0.02] border border-border rounded-2xl p-4 text-left overflow-hidden">
              <div className="flex items-center gap-2 mb-2 text-brand-muted">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Debug Console Output</span>
              </div>
              <pre className="text-[10px] font-mono text-brand-muted/70 overflow-x-auto whitespace-pre-wrap max-h-32">
                {error.stack}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 w-full pt-4">
            <AdminButton 
              variant="outline"
              onClick={() => window.location.reload()}
              iconLeft={<RotateCcw size={18} />}
            >
              Reload App
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
