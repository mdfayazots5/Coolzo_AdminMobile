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
  type OperationsSlaAlert,
} from "@/core/network/operations-dashboard-repository"
import { serviceRequestRepository } from "@/core/network/service-request-repository"
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

type AlertFilter = "all" | "breached" | "at-risk"
type BadgeStatus = "pending" | "assigned" | "completed" | "closed" | "urgent" | "emergency"

const getAlertBadge = (alertState: OperationsSlaAlert["alertState"]): BadgeStatus =>
  alertState === "breached" ? "emergency" : "urgent"

const formatAlertAge = (minutesFromDue?: number) => {
  if (typeof minutesFromDue !== "number") {
    return "SLA due time unavailable"
  }

  if (minutesFromDue >= 0) {
    return `Breached by ${minutesFromDue} minutes`
  }

  return `Due in ${Math.abs(minutesFromDue)} minutes`
}

export default function SLAAlertsScreen() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = React.useState<OperationsSlaAlert[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [activeFilter, setActiveFilter] = React.useState<AlertFilter>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const deferredSearchQuery = React.useDeferredValue(searchQuery)

  const loadAlerts = React.useCallback(async () => {
    try {
      const liveAlerts = await operationsDashboardRepository.getSlaAlerts()
      setAlerts(liveAlerts)
    } catch {
      toast.error("Failed to load SLA alerts")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    void loadAlerts()
  }, [loadAlerts])

  const filteredAlerts = alerts.filter((alert) => {
    const matchesFilter = activeFilter === "all" || alert.alertState === activeFilter
    const query = deferredSearchQuery.trim().toLowerCase()
    const matchesQuery =
      query.length === 0 ||
      (alert.srNumber || "").toLowerCase().includes(query) ||
      alert.customerName.toLowerCase().includes(query) ||
      alert.zoneName.toLowerCase().includes(query) ||
      alert.serviceName.toLowerCase().includes(query)

    return matchesFilter && matchesQuery
  })

  const handleRefresh = () => {
    setIsRefreshing(true)
    void loadAlerts()
  }

  const handleEscalate = async (alert: OperationsSlaAlert) => {
    if (!alert.serviceRequestId) {
      toast.error("This alert is not linked to a service request")
      return
    }

    try {
      await serviceRequestRepository.escalateSR(
        alert.serviceRequestId,
        alert.alertType || "ServiceRequestSla",
        alert.message || `SLA escalation raised for ${alert.srNumber || alert.serviceRequestId}.`,
      )
      toast.success(`Escalation raised for ${alert.srNumber || alert.serviceRequestId}`)
      await loadAlerts()
    } catch {
      toast.error("Failed to raise the escalation")
    }
  }

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className="rounded-full p-2 transition-colors hover:bg-brand-navy/5">
            <ArrowLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-brand-navy">
              SLA Breach Queue
              <span className="rounded-full bg-status-emergency/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-status-emergency">
                {alerts.length} active
              </span>
            </h1>
            <p className="text-sm text-brand-muted">At-risk and breached service requests from the live dashboard alert feed.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton variant="secondary" size="sm" onClick={handleRefresh} iconLeft={<RefreshCw size={14} className={isRefreshing ? "animate-spin" : undefined} />}>
            Refresh
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
          <input
            type="text"
            placeholder="Search SR, customer, zone, service"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-brand-navy/10 bg-brand-navy/5 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand-gold"
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-brand-navy/10 bg-brand-navy/5 p-1">
          <Filter size={16} className="ml-2 text-brand-muted" />
          {(["all", "breached", "at-risk"] as AlertFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                activeFilter === filter ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-navy"
              }`}
            >
              {filter.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAlerts.map((alert) => (
          <AdminCard key={alert.id} className="overflow-hidden border-l-4 border-l-status-emergency p-0">
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-status-emergency/10 text-status-emergency">
                  {alert.alertState === "breached" ? <AlertTriangle size={24} /> : <ShieldAlert size={24} />}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-brand-navy">{alert.srNumber || alert.serviceRequestId || "SR Alert"}</h3>
                    <StatusBadge status={getAlertBadge(alert.alertState)}>{alert.alertState.replace("-", " ")}</StatusBadge>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{alert.priority}</span>
                  </div>
                  <p className="text-sm font-semibold text-brand-navy">{alert.customerName}</p>
                  <p className="text-sm text-brand-muted">{alert.serviceName} • {alert.zoneName}</p>
                  <p className="text-sm text-brand-navy">{alert.message}</p>
                </div>
              </div>

              <div className="min-w-[240px] space-y-3">
                <div className="rounded-2xl bg-brand-navy/[0.03] p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-muted">
                    <Clock size={12} />
                    {formatAlertAge(alert.minutesFromDue)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-brand-navy">
                    {alert.slaDueDate ? new Date(alert.slaDueDate).toLocaleString() : "No due time recorded"}
                  </p>
                  <p className="mt-2 text-[11px] text-brand-muted">
                    Severity {alert.severity} • Escalation level {alert.escalationLevel}
                  </p>
                </div>
                <div className="flex gap-2">
                  {alert.serviceRequestId && (
                    <AdminButton variant="secondary" size="sm" fullWidth onClick={() => navigate(`/service-requests/${alert.serviceRequestId}`)}>
                      Details
                    </AdminButton>
                  )}
                  <AdminButton size="sm" fullWidth onClick={() => void handleEscalate(alert)}>
                    Escalate
                  </AdminButton>
                </div>
              </div>
            </div>
          </AdminCard>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center">
            <ShieldAlert size={48} className="mx-auto mb-4 text-brand-muted/20" />
            <p className="text-sm font-bold uppercase tracking-widest text-brand-muted">No alerts match the current view</p>
            <p className="mt-2 text-xs text-brand-muted">Adjust the search or filter to inspect a different SLA slice.</p>
          </div>
        )}
      </div>
    </div>
  )
}
