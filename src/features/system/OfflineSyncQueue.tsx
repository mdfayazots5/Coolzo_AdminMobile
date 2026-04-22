/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader } from "@/components/shared/Layout"
import { systemRepository, OfflineSubmission } from "@/core/network/system-repository"
import { useSystemUX } from "@/core/system/SystemUXProvider"
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function OfflineSyncQueue() {
  const [queue, setQueue] = React.useState<OfflineSubmission[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSyncingAll, setIsSyncingAll] = React.useState(false)
  const { isOnline, setSyncing, refreshQueueState, recordSyncCompleted } = useSystemUX()

  const fetchQueue = React.useCallback(async () => {
    try {
      const data = await systemRepository.getOfflineQueue()
      setQueue(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchQueue()
  }, [fetchQueue])

  const handleSync = async (id: string) => {
    try {
      setSyncing(true)
      setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status: "syncing" } : item)))
      const result = await systemRepository.syncSubmission(id)
      if (result?.status === "success") {
        setQueue((prev) => prev.filter((item) => item.id !== id))
        recordSyncCompleted()
        toast.success("Item synced successfully")
      } else {
        setQueue((prev) => prev.map((item) => (item.id === id ? (result ?? item) : item)))
        toast.error(result?.errorMessage ?? "Sync blocked")
      }
    } catch (error) {
      setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status: "failed" } : item)))
      toast.error("Sync failed. Please try again.")
    } finally {
      setSyncing(false)
      await refreshQueueState()
    }
  }

  const handleSyncAll = async () => {
    setIsSyncingAll(true)
    for (const item of queue) {
      if (item.status !== "success") {
        await handleSync(item.id)
      }
    }
    setIsSyncingAll(false)
  }

  const handleDismiss = async (id: string) => {
    await systemRepository.deleteOfflineSubmission(id)
    setQueue((prev) => prev.filter((item) => item.id !== id))
    await refreshQueueState()
  }

  if (isLoading) return <InlineLoader className="h-screen" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Offline Submission Queue</h1>
          <p className="text-sm text-brand-muted">Ordered offline sync queue with retry and conflict visibility</p>
        </div>
        <div className="flex gap-2">
          <AdminButton
            onClick={handleSyncAll}
            disabled={queue.length === 0 || isSyncingAll || !isOnline}
            icon={<RefreshCw size={18} className={isSyncingAll ? "animate-spin" : ""} />}
          >
            Sync All Pending
          </AdminButton>
        </div>
      </div>

      <AdminCard className="p-6 bg-brand-navy text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center">
              {isOnline ? <Wifi size={24} className="text-status-completed" /> : <WifiOff size={24} className="text-status-emergency" />}
            </div>
            <div>
              <h2 className="text-lg font-bold">Network Status: {isOnline ? "Online" : "Offline"}</h2>
              <p className="text-xs text-white/60">
                {isOnline
                  ? "You are connected. Queued submissions can resume in order."
                  : "You are offline. New submissions remain cached until connectivity is restored."}
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
        {queue.map((item) => (
          <AdminCard key={item.id} className="p-6">
            <div className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={cn(
                      "size-12 rounded-2xl flex items-center justify-center shrink-0",
                      item.status === "failed" ? "bg-status-emergency/10 text-status-emergency" : "bg-brand-navy/5 text-brand-navy"
                    )}
                  >
                    <TypeIcon type={item.type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-bold text-brand-navy capitalize">{item.type.replaceAll("_", " ")}</h3>
                      <StatusBadge status={item.status} />
                      <span className="text-[10px] text-brand-muted font-bold flex items-center gap-1">
                        <Clock size={10} /> {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted mb-2">
                      {item.method} {item.endpoint} • Retries: {item.retryCount}/5
                    </p>
                    {item.errorMessage && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-status-emergency bg-status-emergency/5 px-3 py-1 rounded-full w-fit">
                        <AlertTriangle size={10} /> {item.errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleSync(item.id)}
                    disabled={item.status === "syncing" || !isOnline}
                    icon={<RefreshCw size={14} className={item.status === "syncing" ? "animate-spin" : ""} />}
                  >
                    Retry Sync
                  </AdminButton>
                  <button
                    onClick={() => void handleDismiss(item.id)}
                    className="p-2 text-brand-muted hover:text-brand-navy transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <MetadataTile label="Idempotency Key" value={item.idempotencyKey} />
                <MetadataTile label="Next Retry" value={item.nextRetryAt ? new Date(item.nextRetryAt).toLocaleString() : "Immediate"} />
                <MetadataTile label="Payload Ref" value={JSON.stringify(item.data)} />
                <MetadataTile label="Attachments" value={item.localFilePaths.length ? item.localFilePaths.join(", ") : "No local files"} />
              </div>

              {item.requiresConflictResolution && (
                <div className="rounded-2xl border border-status-emergency/20 bg-status-emergency/5 px-4 py-3 text-sm text-brand-navy flex items-center gap-2">
                  <ShieldAlert size={16} className="text-status-emergency" />
                  Conflict resolution required before this item can be retried.
                </div>
              )}
            </div>
          </AdminCard>
        ))}

        {queue.length === 0 && (
          <div className="py-20 text-center bg-brand-navy/5 rounded-[40px] border border-dashed border-border">
            <CheckCircle2 size={48} className="mx-auto text-status-completed mb-4 opacity-20" />
            <p className="text-brand-muted font-medium">Your sync queue is empty. All cached submissions are up to date.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MetadataTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-brand-navy/[0.03] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{label}</p>
      <p className="mt-2 text-xs text-brand-navy break-all">{value}</p>
    </div>
  )
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "job_report":
    case "estimate":
      return <FileText size={24} />
    case "part_request":
      return <Package size={24} />
    case "job_photo":
    case "job_signature":
    case "job_payment":
      return <MessageSquare size={24} />
    default:
      return <FileText size={24} />
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    pending: "bg-brand-navy/10 text-brand-navy",
    syncing: "bg-brand-gold/10 text-brand-gold",
    failed: "bg-status-emergency/10 text-status-emergency",
    success: "bg-status-completed/10 text-status-completed",
  }
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest", config[status])}>
      {status}
    </span>
  )
}
