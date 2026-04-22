/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminButton } from "@/components/shared/AdminButton"
import { StatusBadge } from "@/components/shared/Badges"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import {
  operationsDashboardRepository,
  type OperationsDashboardSummary,
  type OperationsDaySummary,
  type OperationsPendingQueueItem,
  type OperationsSlaAlert,
  type OperationsTechnicianStatus,
  type OperationsZoneWorkload,
} from "@/core/network/operations-dashboard-repository"
import { serviceRequestRepository } from "@/core/network/service-request-repository"
import { useLivePolling } from "@/lib/hooks/useLivePolling"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Clock,
  Map,
  MapPin,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

type BadgeStatus = "pending" | "assigned" | "completed" | "closed" | "urgent" | "emergency"

const getPriorityBadge = (priority: OperationsPendingQueueItem["priority"]): BadgeStatus => {
  if (priority === "emergency") return "emergency"
  if (priority === "urgent") return "urgent"
  return "pending"
}

const getTechnicianBadge = (status: OperationsTechnicianStatus["status"]): BadgeStatus => {
  if (status === "available") return "completed"
  if (status === "on-job") return "assigned"
  return "closed"
}

const getAlertBadge = (alertState: OperationsSlaAlert["alertState"]): BadgeStatus =>
  alertState === "breached" ? "emergency" : "urgent"

const formatAlertAge = (minutesFromDue?: number) => {
  if (typeof minutesFromDue !== "number") {
    return "SLA due time unavailable"
  }

  if (minutesFromDue >= 0) {
    return `Breached by ${minutesFromDue}m`
  }

  return `Due in ${Math.abs(minutesFromDue)}m`
}

const buildDaySummaryText = (summary: OperationsDaySummary) => {
  const zoneLines = summary.zoneWorkload
    .slice(0, 6)
    .map(
      (zone) =>
        `${zone.zoneName}: total ${zone.totalCount}, pending ${zone.pendingCount}, in-progress ${zone.inProgressCount}, completed ${zone.completedCount}`,
    )
    .join("\n")

  return [
    `Coolzo Operations Day Summary`,
    `Date: ${summary.summaryDate}`,
    `Generated: ${new Date(summary.generatedAt).toLocaleString()}`,
    ``,
    `Total jobs: ${summary.totalJobs}`,
    `Pending queue: ${summary.pendingQueueCount}`,
    `Assigned: ${summary.assignedCount}`,
    `In progress: ${summary.inProgressCount}`,
    `Completed: ${summary.completedCount}`,
    `Carry forward: ${summary.carryForwardCount}`,
    `Emergency jobs: ${summary.emergencyCount}`,
    `SLA at risk: ${summary.atRiskAlertCount}`,
    `SLA breached: ${summary.breachedAlertCount}`,
    `Active technicians: ${summary.activeTechnicianCount}`,
    `SLA compliance: ${summary.slaCompliancePercent.toFixed(2)}%`,
    ``,
    `Zone workload`,
    zoneLines || `No zone workload available`,
  ].join("\n")
}

const buildDaySummaryHtml = (summary: OperationsDaySummary) => {
  const zoneRows = summary.zoneWorkload
    .map(
      (zone) => `
        <tr>
          <td>${zone.zoneName}</td>
          <td>${zone.totalCount}</td>
          <td>${zone.pendingCount}</td>
          <td>${zone.inProgressCount}</td>
          <td>${zone.completedCount}</td>
          <td>${zone.activeTechnicianCount}</td>
        </tr>`,
    )
    .join("")

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Coolzo Operations Day Summary</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #10243f; }
      h1 { margin: 0 0 8px; }
      p { margin: 0 0 12px; color: #5f708a; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
      .card { border: 1px solid #d9e1ec; border-radius: 12px; padding: 16px; }
      .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #5f708a; }
      .value { font-size: 26px; font-weight: 700; margin-top: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; }
      th, td { text-align: left; padding: 12px; border-bottom: 1px solid #d9e1ec; }
      th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #5f708a; }
    </style>
  </head>
  <body>
    <h1>Coolzo Operations Day Summary</h1>
    <p>Date ${summary.summaryDate} • Generated ${new Date(summary.generatedAt).toLocaleString()}</p>
    <div class="grid">
      <div class="card"><div class="label">Total Jobs</div><div class="value">${summary.totalJobs}</div></div>
      <div class="card"><div class="label">Pending Queue</div><div class="value">${summary.pendingQueueCount}</div></div>
      <div class="card"><div class="label">In Progress</div><div class="value">${summary.inProgressCount}</div></div>
      <div class="card"><div class="label">Completed</div><div class="value">${summary.completedCount}</div></div>
      <div class="card"><div class="label">SLA Breached</div><div class="value">${summary.breachedAlertCount}</div></div>
      <div class="card"><div class="label">SLA Compliance</div><div class="value">${summary.slaCompliancePercent.toFixed(2)}%</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Zone</th>
          <th>Total</th>
          <th>Pending</th>
          <th>In Progress</th>
          <th>Completed</th>
          <th>Techs</th>
        </tr>
      </thead>
      <tbody>${zoneRows || `<tr><td colspan="6">No workload data available.</td></tr>`}</tbody>
    </table>
  </body>
</html>`
}

function KpiCard({
  label,
  value,
  icon,
  tone = "default",
  onClick,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  tone?: "default" | "warning" | "danger" | "success"
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all",
        tone === "warning" && "border-status-urgent/20 bg-status-urgent/[0.04]",
        tone === "danger" && "border-status-emergency/20 bg-status-emergency/[0.04]",
        tone === "success" && "border-status-completed/20 bg-status-completed/[0.04]",
        tone === "default" && "border-border bg-white hover:border-brand-gold/40",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">{label}</div>
        <div className="text-brand-gold">{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-bold text-brand-navy">{value}</div>
    </button>
  )
}

export default function OperationsDashboardScreen() {
  const navigate = useNavigate()
  const [summary, setSummary] = React.useState<OperationsDashboardSummary | null>(null)
  const [pendingQueue, setPendingQueue] = React.useState<OperationsPendingQueueItem[]>([])
  const [technicianStatus, setTechnicianStatus] = React.useState<OperationsTechnicianStatus[]>([])
  const [slaAlerts, setSlaAlerts] = React.useState<OperationsSlaAlert[]>([])
  const [zoneWorkload, setZoneWorkload] = React.useState<OperationsZoneWorkload[]>([])
  const [daySummary, setDaySummary] = React.useState<OperationsDaySummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadDashboard = React.useCallback(async () => {
    try {
      const [dashboardSummary, queue, technicians, alerts, zones, summaryCard] = await Promise.all([
        operationsDashboardRepository.getDashboardSummary(),
        operationsDashboardRepository.getPendingQueue(),
        operationsDashboardRepository.getTechnicianStatus(),
        operationsDashboardRepository.getSlaAlerts(),
        operationsDashboardRepository.getZoneWorkload(),
        operationsDashboardRepository.getDaySummary(),
      ])

      setSummary(dashboardSummary)
      setPendingQueue(queue)
      setTechnicianStatus(technicians)
      setSlaAlerts(alerts)
      setZoneWorkload(zones)
      setDaySummary(summaryCard)
    } catch {
      toast.error("Failed to load the live operations dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const { lastUpdated, manualRefresh } = useLivePolling(() => {
    void loadDashboard()
  }, 60000)

  React.useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const handleManualRefresh = () => {
    manualRefresh()
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
      await loadDashboard()
    } catch {
      toast.error("Failed to raise the escalation")
    }
  }

  const handleExportPdf = () => {
    if (!daySummary) {
      toast.error("Day summary is not available yet")
      return
    }

    const popup = window.open("", "_blank", "width=960,height=720")
    if (!popup) {
      toast.error("Unable to open the summary window")
      return
    }

    popup.document.write(buildDaySummaryHtml(daySummary))
    popup.document.close()
    popup.focus()
    popup.print()
  }

  const handleShareWhatsApp = () => {
    if (!daySummary) {
      toast.error("Day summary is not available yet")
      return
    }

    const shareUrl = `https://wa.me/?text=${encodeURIComponent(buildDaySummaryText(daySummary))}`
    window.open(shareUrl, "_blank", "noopener,noreferrer")
  }

  if (isLoading && !summary) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Operations Command Center</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-brand-muted">
            Live dispatch posture • Last updated {lastUpdated.toLocaleTimeString()}
            <button
              type="button"
              onClick={handleManualRefresh}
              className="rounded-full p-1 transition-colors hover:bg-brand-navy/5"
            >
              <RefreshCw size={14} className="text-brand-gold" />
            </button>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton variant="secondary" size="sm" onClick={() => navigate("/operations/map")} iconLeft={<Map size={16} />}>
            Live Map
          </AdminButton>
          <AdminButton variant="secondary" size="sm" onClick={() => navigate("/operations/dispatch")} iconLeft={<Users size={16} />}>
            Dispatch Queue
          </AdminButton>
          <AdminButton size="sm" onClick={() => navigate("/service-requests/create")}>
            New Request
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <KpiCard label="Today's Jobs" value={summary?.totalJobs ?? 0} icon={<Briefcase size={16} />} onClick={() => navigate("/service-requests")} />
        <KpiCard
          label="Pending Queue"
          value={summary?.pendingQueueCount ?? 0}
          icon={<Clock size={16} />}
          tone={(summary?.pendingQueueCount ?? 0) > 0 ? "warning" : "default"}
          onClick={() => navigate("/operations/dispatch")}
        />
        <KpiCard label="In Progress" value={summary?.inProgressCount ?? 0} icon={<Radio size={16} />} onClick={() => navigate("/service-requests?status=in-progress")} />
        <KpiCard label="Completed" value={summary?.completedCount ?? 0} icon={<TrendingUp size={16} />} tone="success" onClick={() => navigate("/service-requests?status=completed")} />
        <KpiCard
          label="SLA Breached"
          value={summary?.breachedAlertCount ?? 0}
          icon={<ShieldAlert size={16} />}
          tone={(summary?.breachedAlertCount ?? 0) > 0 ? "danger" : "default"}
          onClick={() => navigate("/operations/sla-alerts")}
        />
        <KpiCard
          label="SLA Compliance"
          value={`${(summary?.slaCompliancePercent ?? 0).toFixed(2)}%`}
          icon={<Zap size={16} />}
          tone="success"
          onClick={() => navigate("/governance/reports")}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AdminCard className="p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-brand-navy/[0.02] p-4">
              <SectionHeader title="Pending Assignment Queue" icon={<Clock size={18} />} className="mb-0" />
              <span className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                {pendingQueue.length} open
              </span>
            </div>
            <div className="divide-y divide-border">
              {pendingQueue.slice(0, 8).map((item) => (
                <div key={item.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-brand-navy">{item.srNumber}</h3>
                      <StatusBadge status={getPriorityBadge(item.priority)}>{item.priority}</StatusBadge>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{item.customerName}</span>
                    </div>
                    <p className="text-xs text-brand-muted">{item.serviceName}</p>
                    <p className="flex items-center gap-1.5 text-[11px] text-brand-muted">
                      <MapPin size={12} />
                      {item.zoneName} • {item.slotLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminButton variant="secondary" size="sm" onClick={() => navigate(`/service-requests/${item.id}`)}>
                      Details
                    </AdminButton>
                    <AdminButton size="sm" onClick={() => navigate(`/operations/dispatch?srId=${item.id}`)}>
                      Assign
                    </AdminButton>
                  </div>
                </div>
              ))}
              {pendingQueue.length === 0 && (
                <div className="p-8 text-center text-sm text-brand-muted">No unassigned service requests are waiting in the queue.</div>
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-0 overflow-hidden border-l-4 border-l-status-emergency">
            <div className="flex items-center justify-between border-b border-border bg-status-emergency/[0.03] p-4">
              <SectionHeader title="SLA Alerts" icon={<ShieldAlert size={18} className="text-status-emergency" />} className="mb-0" />
              <AdminButton variant="secondary" size="sm" onClick={() => navigate("/operations/sla-alerts")}>
                View All
              </AdminButton>
            </div>
            <div className="divide-y divide-border">
              {slaAlerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={getAlertBadge(alert.alertState)}>{alert.alertState.replace("-", " ")}</StatusBadge>
                      <span className="text-xs font-bold text-brand-navy">{alert.srNumber || alert.serviceRequestId || "SR"}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{alert.customerName}</span>
                    </div>
                    <p className="text-sm font-medium text-brand-navy">{alert.message}</p>
                    <p className="text-[11px] text-brand-muted">{formatAlertAge(alert.minutesFromDue)} • {alert.zoneName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.serviceRequestId && (
                      <AdminButton variant="secondary" size="sm" onClick={() => navigate(`/service-requests/${alert.serviceRequestId}`)}>
                        Details
                      </AdminButton>
                    )}
                    <AdminButton size="sm" onClick={() => void handleEscalate(alert)}>
                      Escalate
                    </AdminButton>
                  </div>
                </div>
              ))}
              {slaAlerts.length === 0 && (
                <div className="p-8 text-center text-sm text-brand-muted">No at-risk or breached service request alerts are active.</div>
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-0 overflow-hidden">
            <div className="border-b border-border bg-brand-navy/[0.02] p-4">
              <SectionHeader title="Zone Workload" icon={<MapPin size={18} />} className="mb-0" />
            </div>
            <div className="space-y-4 p-4">
              {zoneWorkload.map((zone) => {
                const maxCount = Math.max(...zoneWorkload.map((item) => item.totalCount), 1)
                const width = `${Math.max((zone.totalCount / maxCount) * 100, 8)}%`

                return (
                  <div key={zone.zoneName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-brand-navy">{zone.zoneName}</h3>
                        <p className="text-[11px] text-brand-muted">
                          Pending {zone.pendingCount} • In progress {zone.inProgressCount} • Techs {zone.activeTechnicianCount}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-brand-navy">{zone.totalCount}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-brand-navy/5">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          zone.breachedAlertCount > 0
                            ? "bg-status-emergency"
                            : zone.emergencyCount > 0
                              ? "bg-status-urgent"
                              : "bg-brand-gold",
                        )}
                        style={{ width }}
                      />
                    </div>
                  </div>
                )
              })}
              {zoneWorkload.length === 0 && (
                <div className="py-6 text-center text-sm text-brand-muted">No workload data is available for today.</div>
              )}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard className="p-0 overflow-hidden">
            <div className="border-b border-border bg-brand-navy/[0.02] p-4">
              <SectionHeader title="Technician Status" icon={<Users size={18} />} className="mb-0" />
            </div>
            <div className="space-y-3 p-4">
              {technicianStatus.slice(0, 8).map((technician) => (
                <button
                  key={technician.id}
                  type="button"
                  onClick={() => navigate(`/team/${technician.id}`)}
                  className="w-full rounded-2xl border border-border p-4 text-left transition-colors hover:border-brand-gold/40"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-brand-navy">{technician.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                        {(technician.zones[0] || technician.baseZone || "Unassigned").toUpperCase()}
                      </p>
                    </div>
                    <StatusBadge status={getTechnicianBadge(technician.status)}>{technician.status.replace("-", " ")}</StatusBadge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-brand-muted">
                    <span>Jobs today {technician.todayJobCount}</span>
                    <span>{technician.nextFreeSlot || "Monitoring live"}</span>
                  </div>
                  {technician.currentJobId && (
                    <div className="mt-3 rounded-xl bg-brand-navy/[0.03] px-3 py-2 text-[11px] font-medium text-brand-navy">
                      Current job {technician.currentJobId}
                    </div>
                  )}
                </button>
              ))}
              {technicianStatus.length === 0 && (
                <div className="py-6 text-center text-sm text-brand-muted">No technician posture data is available.</div>
              )}
            </div>
          </AdminCard>

          <AdminCard className="bg-brand-navy p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Day Summary Export</h3>
                <p className="mt-2 text-sm text-white/70">
                  Package the live dispatch snapshot for end-of-day circulation and WhatsApp sharing.
                </p>
              </div>
              <AlertTriangle size={24} className="text-brand-gold" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Carry Forward</div>
                <div className="mt-2 text-xl font-bold">{daySummary?.carryForwardCount ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Emergency</div>
                <div className="mt-2 text-xl font-bold">{daySummary?.emergencyCount ?? 0}</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <AdminButton variant="secondary" size="sm" className="border-white/20 text-white hover:bg-white/10" onClick={handleExportPdf} iconLeft={<Send size={14} />}>
                Export PDF
              </AdminButton>
              <AdminButton size="sm" onClick={handleShareWhatsApp} iconLeft={<ArrowRight size={14} />}>
                WhatsApp Share
              </AdminButton>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
