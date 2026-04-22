/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { WifiOff, RefreshCw, AlertTriangle } from "lucide-react"
import { useSystemUX } from "@/core/system/SystemUXProvider"
import { navigateToPath, PushNavigationIntent, resolvePushIntentPath } from "@/core/system/navigation-intents"

export function NetworkStatusBanner() {
  const { isOnline, isSyncing, lastSyncAt, pendingSyncCount } = useSystemUX()
  const [foregroundMessage, setForegroundMessage] = React.useState<{ title: string; path: string | null } | null>(null)

  React.useEffect(() => {
    const handleForegroundPush = (event: Event) => {
      const detail = (event as CustomEvent<PushNavigationIntent & { title?: string }>).detail
      setForegroundMessage({
        title: detail.title ?? detail.type.replaceAll("_", " "),
        path: resolvePushIntentPath(detail),
      })
    }
    window.addEventListener("coolzo:push-message", handleForegroundPush as EventListener)
    return () => {
      window.removeEventListener("coolzo:push-message", handleForegroundPush as EventListener)
    }
  }, [])

  if (isOnline && !isSyncing && pendingSyncCount === 0 && !foregroundMessage) return null;

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
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Offline Mode Active {lastSyncAt ? `• Last Sync ${new Date(lastSyncAt).toLocaleTimeString()}` : "• Cached state only"}
            </span>
          </div>
          <button 
            onClick={() => navigateToPath("/system/sync")}
            className="relative z-10 ml-4 px-3 py-1 bg-brand-navy text-brand-gold rounded-full text-[8px] font-bold uppercase tracking-widest hover:scale-105 transition-transform"
          >
            View Queue
          </button>
        </motion.div>
      )}
      {isOnline && (isSyncing || pendingSyncCount > 0) && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-brand-navy text-brand-gold px-4 py-2 flex items-center justify-center gap-3 z-[100] relative"
        >
          <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {isSyncing ? "Syncing offline data with server..." : `${pendingSyncCount} items pending sync`}
          </span>
        </motion.div>
      )}
      {foregroundMessage && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-brand-gold text-brand-navy px-4 py-2 flex items-center justify-center gap-3 z-[100] relative"
        >
          <AlertTriangle size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{foregroundMessage.title}</span>
          {foregroundMessage.path && (
            <button
              onClick={() => {
                navigateToPath(foregroundMessage.path!)
                setForegroundMessage(null)
              }}
              className="rounded-full bg-brand-navy px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-brand-gold"
            >
              Open
            </button>
          )}
          <button
            onClick={() => setForegroundMessage(null)}
            className="rounded-full border border-brand-navy/20 px-3 py-1 text-[8px] font-bold uppercase tracking-widest"
          >
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
