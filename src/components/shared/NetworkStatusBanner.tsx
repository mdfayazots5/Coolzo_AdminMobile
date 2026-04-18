/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = React.useState(false)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !isSyncing) return null;

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-status-pending text-brand-navy px-4 py-2 flex items-center justify-center gap-3 z-[100] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-brand-gold/20 animate-pulse" />
          <div className="flex items-center gap-2 relative z-10">
            <WifiOff size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Offline Mode Active — Some features may be limited</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="relative z-10 ml-4 px-3 py-1 bg-brand-navy text-brand-gold rounded-full text-[8px] font-bold uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Retry Connection
          </button>
        </motion.div>
      )}
      {isOnline && isSyncing && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-brand-navy text-brand-gold px-4 py-2 flex items-center justify-center gap-3 z-[100] relative"
        >
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Syncing offline data with server...</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
