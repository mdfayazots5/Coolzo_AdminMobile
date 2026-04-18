/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { systemRepository, OfflineSubmission } from "@/core/network/system-repository"
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Package, 
  MessageSquare,
  AlertTriangle,
  ChevronRight
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function OfflineSyncQueue() {
  const [queue, setQueue] = React.useState<OfflineSubmission[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSyncingAll, setIsSyncingAll] = React.useState(false)

  React.useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await systemRepository.getOfflineQueue();
        setQueue(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQueue();
  }, [])

  const handleSync = async (id: string) => {
    try {
      setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'syncing' } : item));
      await systemRepository.syncSubmission(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      toast.success("Item synced successfully");
    } catch (error) {
      setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'failed' } : item));
      toast.error("Sync failed. Please try again.");
    }
  }

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    for (const item of queue) {
      if (item.status !== 'success') {
        await handleSync(item.id);
      }
    }
    setIsSyncingAll(false);
  }

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Offline Submission Queue</h1>
          <p className="text-sm text-brand-muted">Manage data captured while offline</p>
        </div>
        <div className="flex gap-2">
          <AdminButton 
            onClick={handleSyncAll} 
            disabled={queue.length === 0 || isSyncingAll}
            icon={<RefreshCw size={18} className={isSyncingAll ? "animate-spin" : ""} />}
          >
            Sync All Pending
          </AdminButton>
        </div>
      </div>

      {/* Network Status Card */}
      <AdminCard className="p-6 bg-brand-navy text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center">
              {navigator.onLine ? <Wifi size={24} className="text-status-completed" /> : <WifiOff size={24} className="text-status-emergency" />}
            </div>
            <div>
              <h2 className="text-lg font-bold">Network Status: {navigator.onLine ? 'Online' : 'Offline'}</h2>
              <p className="text-xs text-white/60">
                {navigator.onLine 
                  ? "You are connected. Pending items will auto-sync." 
                  : "You are currently offline. Data is being saved locally."}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Queue Size</p>
            <p className="text-2xl font-bold text-brand-gold">{queue.length} Items</p>
          </div>
        </div>
      </AdminCard>

      <div className="space-y-4">
        {queue.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <AdminCard className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn(
                    "size-12 rounded-2xl flex items-center justify-center shrink-0",
                    item.status === 'failed' ? "bg-status-emergency/10 text-status-emergency" : "bg-brand-navy/5 text-brand-navy"
                  )}>
                    <TypeIcon type={item.type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-brand-navy capitalize">{item.type.replace('_', ' ')}</h3>
                      <StatusBadge status={item.status} />
                      <span className="text-[10px] text-brand-muted font-bold flex items-center gap-1">
                        <Clock size={10} /> {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted mb-2">ID: {item.id} • Retries: {item.retryCount}</p>
                    {item.errorMessage && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-status-emergency bg-status-emergency/5 px-3 py-1 rounded-full w-fit">
                        <AlertTriangle size={10} /> {item.errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <AdminButton 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSync(item.id)}
                    disabled={item.status === 'syncing'}
                    icon={<RefreshCw size={14} className={item.status === 'syncing' ? "animate-spin" : ""} />}
                  >
                    Retry Sync
                  </AdminButton>
                  <button 
                    onClick={() => alert(`Submission Details:\nType: ${item.type}\nStatus: ${item.status}\nData: ${JSON.stringify(item.data)}`)}
                    className="p-2 text-brand-muted hover:text-brand-navy transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </AdminCard>
          </motion.div>
        ))}

        {queue.length === 0 && (
          <div className="py-20 text-center bg-brand-navy/5 rounded-[40px] border border-dashed border-border">
            <CheckCircle2 size={48} className="mx-auto text-status-completed mb-4 opacity-20" />
            <p className="text-brand-muted font-medium">Your sync queue is empty. All data is up to date.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'job_report': return <FileText size={24} />;
    case 'part_request': return <Package size={24} />;
    case 'feedback': return <MessageSquare size={24} />;
    default: return <FileText size={24} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    pending: "bg-brand-navy/10 text-brand-navy",
    syncing: "bg-brand-gold/10 text-brand-gold",
    failed: "bg-status-emergency/10 text-status-emergency",
    success: "bg-status-completed/10 text-status-completed"
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest", config[status])}>
      {status}
    </span>
  )
}
