/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader } from "@/components/shared/Layout"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Download, 
  Calendar,
  Clock,
  Search,
  Plus,
  Trash2
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  governanceRepository,
  ReportDefinition,
  ReportResult,
  ScheduledReport,
} from "@/core/network/governance-repository"

export default function ReportsHub() {
  const [definitions, setDefinitions] = React.useState<ReportDefinition[]>([])
  const [scheduledReports, setScheduledReports] = React.useState<ScheduledReport[]>([])
  const [selectedReport, setSelectedReport] = React.useState<ReportDefinition | null>(null)
  const [reportResult, setReportResult] = React.useState<ReportResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRunning, setIsRunning] = React.useState(false)
  const [isScheduling, setIsScheduling] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [scheduleTitle, setScheduleTitle] = React.useState("")
  const [scheduleRecipients, setScheduleRecipients] = React.useState("ops@coolzo.com")
  const [scheduleFrequency, setScheduleFrequency] = React.useState<ScheduledReport["frequency"]>("daily")

  React.useEffect(() => {
    const load = async () => {
      try {
        const [reportData, scheduleData] = await Promise.all([
          governanceRepository.getReportDefinitions(),
          governanceRepository.getScheduledReports(),
        ])
        setDefinitions(reportData)
        setSelectedReport(reportData[0] ?? null)
        setScheduledReports(scheduleData)
        if (reportData[0]) {
          setScheduleTitle(reportData[0].name)
        }
      } catch (error) {
        console.error(error)
        toast.error("Unable to load reports")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const categoryMeta: Record<
    ReportDefinition["category"],
    { title: string; icon: React.ReactNode }
  > = {
    operations: { title: "Operations Reports", icon: <ShieldCheck size={18} /> },
    finance: { title: "Financial Reports", icon: <TrendingUp size={18} /> },
    customer_inventory: { title: "Customer & Inventory", icon: <Users size={18} /> },
  }

  const groupedReports = definitions.reduce<Record<ReportDefinition["category"], ReportDefinition[]>>(
    (acc, report) => {
      if (
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        acc[report.category].push(report)
      }
      return acc
    },
    {
      operations: [],
      finance: [],
      customer_inventory: [],
    }
  )

  const handleRunReport = async (report: ReportDefinition) => {
    setSelectedReport(report)
    setIsRunning(true)
    try {
      const result = await governanceRepository.runReport(report.reportType)
      setReportResult(result)
      toast.success(`${report.name} generated`)
    } catch (error) {
      console.error(error)
      toast.error("Unable to run report")
    } finally {
      setIsRunning(false)
    }
  }

  const handleExportReport = async (report: ReportDefinition) => {
    try {
      const result = await governanceRepository.exportReport(report.reportType)
      toast.success(`Export ready: ${result.downloadUrl}`)
    } catch (error) {
      console.error(error)
      toast.error("Unable to export report")
    }
  }

  const handleCreateSchedule = async () => {
    if (!selectedReport) {
      toast.error("Select a report first")
      return
    }

    setIsScheduling(true)
    try {
      const created = await governanceRepository.createScheduledReport({
        reportType: selectedReport.reportType,
        title: scheduleTitle || selectedReport.name,
        frequency: scheduleFrequency,
        nextRunAt: new Date().toISOString(),
        recipients: scheduleRecipients
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      })
      setScheduledReports((current) => [created, ...current])
      toast.success("Scheduled report created")
    } catch (error) {
      console.error(error)
      toast.error("Unable to schedule report")
    } finally {
      setIsScheduling(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await governanceRepository.deleteScheduledReport(scheduleId)
      setScheduledReports((current) => current.filter((item) => item.id !== scheduleId))
      toast.success("Scheduled report removed")
    } catch (error) {
      console.error(error)
      toast.error("Unable to remove schedule")
    }
  }

  React.useEffect(() => {
    if (selectedReport) {
      setScheduleTitle(selectedReport.name)
    }
  }, [selectedReport])

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Reports Hub</h1>
          <p className="text-sm text-brand-muted">Centralized intelligence and operational reporting</p>
        </div>
        <div className="flex gap-2">
          <AdminButton 
            variant="outline" 
            icon={<Clock size={18} />}
            onClick={() => {
              const section = document.getElementById("scheduled-reports")
              section?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
          >
            Scheduled Reports
          </AdminButton>
        </div>
      </div>

      <div className="relative mb-8">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input 
          type="text" 
          placeholder="Search for a report by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-[32px] text-sm focus:ring-2 focus:ring-brand-gold outline-none shadow-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(Object.entries(groupedReports) as [ReportDefinition["category"], ReportDefinition[]][]).map(([category, reports]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2 px-4">
              <div className="p-2 bg-brand-navy/5 rounded-xl text-brand-navy">
                {categoryMeta[category].icon}
              </div>
              <h2 className="font-bold text-brand-navy uppercase tracking-widest text-xs">
                {categoryMeta[category].title}
              </h2>
            </div>
            <div className="space-y-3">
              {reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className="block w-full text-left"
                >
                  <AdminCard
                    className={cn(
                      "p-5 hover:border-brand-gold transition-all group",
                      selectedReport?.id === report.id && "border-brand-gold"
                    )}
                  >
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-brand-navy group-hover:text-brand-gold transition-colors">
                          {report.name}
                        </h3>
                        <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
                          {report.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleRunReport(report)
                          }}
                          className="text-[10px] font-bold text-brand-navy uppercase tracking-widest flex items-center gap-1 hover:text-brand-gold"
                        >
                          <Calendar size={10} /> Run
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleExportReport(report)
                          }}
                          className="text-[10px] font-bold text-brand-navy uppercase tracking-widest flex items-center gap-1 hover:text-brand-gold"
                        >
                          <Download size={10} /> Export
                        </button>
                      </div>
                    </div>
                  </AdminCard>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
        <AdminCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-brand-navy">Report Preview</h2>
              <p className="text-xs text-brand-muted">
                {selectedReport ? selectedReport.name : "Select a report to view output"}
              </p>
            </div>
            <div className="size-12 bg-brand-navy/5 rounded-2xl flex items-center justify-center text-brand-navy">
              <BarChart3 size={24} />
            </div>
          </div>
          {isRunning ? (
            <InlineLoader className="h-48" />
          ) : reportResult ? (
            <div className="space-y-4">
              <div className="rounded-3xl bg-brand-navy/[0.03] p-4">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Generated At</p>
                <p className="mt-1 text-sm font-semibold text-brand-navy">
                  {new Date(reportResult.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-brand-navy/[0.03]">
                      {Object.keys(reportResult.rows[0] ?? { reportType: "", value: "" }).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-brand-muted"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportResult.rows.map((row, index) => (
                      <tr key={`${reportResult.title}-${index}`} className="border-t border-border">
                        {Object.entries(row).map(([key, value]) => (
                          <td key={key} className="px-4 py-3 text-xs text-brand-navy">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-8 text-sm text-brand-muted">
              Run a report to view the current payload returned by the reporting API.
            </div>
          )}
        </AdminCard>

        <AdminCard id="scheduled-reports" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-brand-navy">Scheduled Reports</h2>
              <p className="text-xs text-brand-muted">Create and maintain recurring report delivery.</p>
            </div>
            <Clock size={20} className="text-brand-navy" />
          </div>

          <div className="space-y-3">
            <label className="space-y-1 block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Schedule Title</span>
              <input
                value={scheduleTitle}
                onChange={(event) => setScheduleTitle(event.target.value)}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Recipients</span>
              <input
                value={scheduleRecipients}
                onChange={(event) => setScheduleRecipients(event.target.value)}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Frequency</span>
              <select
                value={scheduleFrequency}
                onChange={(event) => setScheduleFrequency(event.target.value as ScheduledReport["frequency"])}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <AdminButton
              icon={<Plus size={16} />}
              onClick={() => void handleCreateSchedule()}
              disabled={isScheduling || !selectedReport}
            >
              Create Schedule
            </AdminButton>
          </div>

          <div className="space-y-3 pt-2">
            {scheduledReports.map((schedule) => (
              <div key={schedule.id} className="rounded-3xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">{schedule.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">
                      {schedule.frequency} • next run {new Date(schedule.nextRunAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-brand-muted">{schedule.recipients.join(", ")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteSchedule(schedule.id)}
                    className="text-brand-muted transition-colors hover:text-status-emergency"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
