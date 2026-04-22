/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminButton } from "@/components/shared/AdminButton"
import { StatusBadge } from "@/components/shared/Badges"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader } from "@/components/shared/Layout"
import {
  operationsDashboardRepository,
  type OperationsPendingQueueItem,
} from "@/core/network/operations-dashboard-repository"
import { serviceRequestRepository } from "@/core/network/service-request-repository"
import { technicianRepository, type Technician } from "@/core/network/technician-repository"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Clock,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { useNavigate, useSearchParams } from "react-router-dom"

type BadgeStatus = "pending" | "assigned" | "completed" | "closed" | "urgent" | "emergency"

const getPriorityBadge = (priority: OperationsPendingQueueItem["priority"]): BadgeStatus => {
  if (priority === "emergency") return "emergency"
  if (priority === "urgent") return "urgent"
  return "pending"
}

const getTechnicianBadge = (status: Technician["status"]): BadgeStatus => {
  if (status === "available") return "completed"
  if (status === "on-job") return "assigned"
  return "closed"
}

export default function DispatchManagementScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialSrId = searchParams.get("srId")

  const [pendingQueue, setPendingQueue] = React.useState<OperationsPendingQueueItem[]>([])
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(initialSrId)
  const [technicians, setTechnicians] = React.useState<Technician[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const deferredSearchQuery = React.useDeferredValue(searchQuery)
  const [zoneFilter, setZoneFilter] = React.useState<string>("All")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isAssigning, setIsAssigning] = React.useState(false)

  const loadPendingQueue = React.useCallback(async () => {
    try {
      const queue = await operationsDashboardRepository.getPendingQueue()
      setPendingQueue(queue)
    } catch {
      toast.error("Failed to load the pending assignment queue")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    void loadPendingQueue()
  }, [loadPendingQueue])

  React.useEffect(() => {
    if (initialSrId && pendingQueue.some((item) => item.id === initialSrId)) {
      setSelectedRequestId(initialSrId)
      return
    }

    if (selectedRequestId && pendingQueue.some((item) => item.id === selectedRequestId)) {
      return
    }

    setSelectedRequestId(pendingQueue[0]?.id ?? null)
  }, [initialSrId, pendingQueue, selectedRequestId])

  const zoneOptions = Array.from(new Set(pendingQueue.map((item) => item.zoneName || "Unassigned")))

  const visibleQueue = pendingQueue.filter((item) => {
    const matchesZone = zoneFilter === "All" || item.zoneName === zoneFilter
    const query = deferredSearchQuery.trim().toLowerCase()
    const matchesQuery =
      query.length === 0 ||
      item.srNumber.toLowerCase().includes(query) ||
      item.customerName.toLowerCase().includes(query) ||
      item.serviceName.toLowerCase().includes(query)

    return matchesZone && matchesQuery
  })

  const selectedRequest = pendingQueue.find((item) => item.id === selectedRequestId) ?? null

  React.useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedRequest) {
        setTechnicians([])
        return
      }

      try {
        const availability = await technicianRepository.getAvailabilityBoard(selectedRequest.id)
        setTechnicians(availability)
      } catch {
        toast.error("Failed to load technician availability")
      }
    }

    void loadAvailability()
  }, [selectedRequest])

  const handleRefresh = () => {
    setIsRefreshing(true)
    void loadPendingQueue()
  }

  const handleAssign = async (technician: Technician) => {
    if (!selectedRequest) {
      return
    }

    setIsAssigning(true)

    try {
      await serviceRequestRepository.assignTechnician(selectedRequest.id, technician.id, technician.name)
      toast.success(`${selectedRequest.srNumber} assigned to ${technician.name}`)

      setPendingQueue((current) => current.filter((item) => item.id !== selectedRequest.id))
      setSelectedRequestId((current) => (current === selectedRequest.id ? null : current))
    } catch {
      toast.error("Failed to assign the technician")
    } finally {
      setIsAssigning(false)
    }
  }

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className="rounded-full p-2 transition-colors hover:bg-brand-navy/5">
            <ArrowLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Dispatch Management</h1>
            <p className="text-sm text-brand-muted">Assign unallocated service requests to available technicians.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton variant="secondary" size="sm" onClick={handleRefresh} iconLeft={<RefreshCw size={14} className={isRefreshing ? "animate-spin" : undefined} />}>
            Refresh
          </AdminButton>
          <AdminButton size="sm" onClick={() => navigate("/operations/map")}>
            Open Map
          </AdminButton>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-12">
        <div className="flex min-h-0 flex-col gap-4 lg:col-span-4">
          <AdminCard className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search SR, customer, service"
                className="w-full rounded-xl border border-brand-navy/10 bg-brand-navy/5 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand-gold"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setZoneFilter("All")}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
                  zoneFilter === "All"
                    ? "border-brand-gold bg-brand-gold/10 text-brand-navy"
                    : "border-brand-navy/10 text-brand-muted hover:text-brand-navy",
                )}
              >
                All Zones
              </button>
              {zoneOptions.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setZoneFilter(zone)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
                    zoneFilter === zone
                      ? "border-brand-gold bg-brand-gold/10 text-brand-navy"
                      : "border-brand-navy/10 text-brand-muted hover:text-brand-navy",
                  )}
                >
                  {zone}
                </button>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="min-h-0 flex-1 overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border bg-brand-navy/[0.02] p-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand-navy">Unassigned Queue</h3>
                <p className="text-[11px] text-brand-muted">{visibleQueue.length} requests in view</p>
              </div>
              <Filter size={16} className="text-brand-muted" />
            </div>
            <div className="divide-y divide-border overflow-y-auto">
              {visibleQueue.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelectedRequestId(request.id)}
                  className={cn(
                    "w-full border-l-4 p-4 text-left transition-colors",
                    selectedRequestId === request.id
                      ? "border-l-brand-gold bg-brand-navy/[0.03]"
                      : "border-l-transparent hover:bg-brand-navy/[0.02]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-brand-navy">{request.srNumber}</span>
                        <StatusBadge status={getPriorityBadge(request.priority)}>{request.priority}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-brand-navy">{request.customerName}</p>
                    </div>
                    <Clock size={16} className="text-brand-muted" />
                  </div>
                  <p className="mt-2 text-[11px] text-brand-muted">{request.serviceName}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-brand-muted">
                    <MapPin size={11} />
                    {request.zoneName} • {request.slotLabel}
                  </p>
                </button>
              ))}
              {visibleQueue.length === 0 && (
                <div className="p-8 text-center text-sm text-brand-muted">No queue items match the current filters.</div>
              )}
            </div>
          </AdminCard>
        </div>

        <div className="min-h-0 lg:col-span-8">
          {selectedRequest ? (
            <div className="flex h-full flex-col gap-4">
              <AdminCard className="border-none bg-brand-navy p-5 text-white shadow-lg">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-brand-gold/15 p-3 text-brand-gold">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold">{selectedRequest.srNumber}</h2>
                        <StatusBadge status={getPriorityBadge(selectedRequest.priority)}>{selectedRequest.priority}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-white/80">{selectedRequest.customerName}</p>
                      <p className="mt-2 text-xs text-white/60">{selectedRequest.address}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:min-w-[280px]">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Service</div>
                      <div className="mt-2 text-sm font-semibold">{selectedRequest.serviceName}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Slot</div>
                      <div className="mt-2 text-sm font-semibold">{selectedRequest.slotLabel}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Zone</div>
                      <div className="mt-2 text-sm font-semibold">{selectedRequest.zoneName}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Created</div>
                      <div className="mt-2 text-sm font-semibold">{new Date(selectedRequest.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <AdminButton variant="secondary" size="sm" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate(`/service-requests/${selectedRequest.id}`)}>
                    View Request
                  </AdminButton>
                </div>
              </AdminCard>

              <AdminCard className="min-h-0 flex-1 overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-border bg-brand-navy/[0.02] p-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-brand-navy">Technician Match Cards</h3>
                    <p className="text-[11px] text-brand-muted">Availability is ranked by the existing technician availability API.</p>
                  </div>
                </div>
                <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-2">
                  {technicians.map((technician) => {
                    const isZoneMatch = technician.zones.some(
                      (zone) => zone.trim().toLowerCase() === selectedRequest.zoneName.trim().toLowerCase(),
                    )
                    const skillPreview = technician.skills.slice(0, 3).map((skill) => skill.name).join(", ")

                    return (
                      <div
                        key={technician.id}
                        className={cn(
                          "flex flex-col justify-between rounded-2xl border p-4 transition-colors",
                          technician.status === "available"
                            ? "border-status-completed/30 bg-status-completed/[0.03]"
                            : "border-border bg-white",
                        )}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl border border-brand-navy/10 bg-brand-navy/5 text-brand-navy">
                                {technician.photo ? (
                                  <img src={technician.photo} alt={technician.name} className="size-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <User size={22} />
                                )}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-brand-navy">{technician.name}</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{technician.designation}</p>
                              </div>
                            </div>
                            <StatusBadge status={getTechnicianBadge(technician.status)}>{technician.status.replace("-", " ")}</StatusBadge>
                          </div>

                          <div className="mt-4 space-y-2 text-[11px] text-brand-muted">
                            <p className="flex items-center gap-2">
                              <ShieldCheck size={12} className={isZoneMatch ? "text-status-completed" : "text-brand-muted"} />
                              {isZoneMatch ? "Zone aligned" : "Cross-zone dispatch"}
                            </p>
                            <p>Zones: {technician.zones.join(", ")}</p>
                            <p>Skills: {skillPreview || "No mapped skills"}</p>
                            <p>Jobs today: {technician.todayJobCount} • Rating {technician.rating.toFixed(1)}</p>
                            <p>{technician.nextFreeSlot || "Live availability active"}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <AdminButton variant="secondary" size="sm" fullWidth onClick={() => navigate(`/team/${technician.id}`)}>
                            Profile
                          </AdminButton>
                          <AdminButton
                            size="sm"
                            fullWidth
                            disabled={technician.status !== "available" || isAssigning}
                            onClick={() => void handleAssign(technician)}
                          >
                            {isAssigning ? "Assigning..." : "Assign"}
                          </AdminButton>
                        </div>
                      </div>
                    )
                  })}
                  {technicians.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-brand-muted md:col-span-2">
                      No technicians are available for this queue item right now.
                    </div>
                  )}
                </div>
              </AdminCard>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-border bg-white">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-navy/5 text-brand-navy">
                  <Search size={24} />
                </div>
                <h2 className="text-lg font-bold text-brand-navy">Select a queue item</h2>
                <p className="mt-2 text-sm text-brand-muted">
                  Pick a service request from the left panel to review technician match cards and complete the assignment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
