/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { dashboardRepository, DashboardStats } from "@/core/network/dashboard-repository"
import { 
  TrendingUp, 
  Wrench, 
  Ticket, 
  ClipboardList,
  DollarSign,
  Wallet,
  BadgePercent,
  FileText,
  Clock,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
})

const wholeNumberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
})

export default function DashboardScreen() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardRepository.getStats();
        setStats(data);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load dashboard data")
      } finally {
        setIsLoading(false);
      }
    }
    void fetchStats();
  }, [])

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!stats) return <div className="p-8 text-center">Failed to load dashboard data</div>;

  const chartData = stats.bookingTrend.map((point) => ({
    label: point.label,
    bookings: point.value,
  }))
  const jobStatusTotal = stats.jobStatusDistribution.reduce((total, item) => total + item.count, 0)
  const snapshotLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Global Dashboard</h1>
          <p className="text-sm text-brand-muted">Live executive summary wired to the admin analytics APIs</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl shadow-sm">
          <Calendar size={16} className="text-brand-muted" />
          <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">{snapshotLabel}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Total Revenue" 
          value={compactCurrencyFormatter.format(stats.totalRevenue)}
          hint={`${wholeNumberFormatter.format(stats.revenueSummary.invoiceCount)} invoices`}
          icon={<DollarSign size={20} />}
          colorClass="bg-brand-gold/10 text-brand-gold"
        />
        <KPICard 
          label="Total Jobs" 
          value={wholeNumberFormatter.format(stats.totalJobs)}
          hint={`${wholeNumberFormatter.format(stats.totalServiceRequests)} service requests`}
          icon={<Wrench size={20} />}
          colorClass="bg-brand-navy/10 text-brand-navy"
        />
        <KPICard 
          label="Total Bookings" 
          value={wholeNumberFormatter.format(stats.totalBookings)}
          hint={`${wholeNumberFormatter.format(stats.totalAmcCustomers)} AMC customers`}
          icon={<ClipboardList size={20} />}
          colorClass="bg-status-pending/10 text-status-pending"
        />
        <KPICard 
          label="Open Tickets" 
          value={wholeNumberFormatter.format(stats.supportOverview.openTickets)}
          hint={`${wholeNumberFormatter.format(stats.supportOverview.escalationCount)} escalated`}
          icon={<Ticket size={20} />}
          colorClass="bg-status-completed/10 text-status-completed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Booking Trend */}
        <AdminCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <SectionHeader title="Booking Trend" icon={<TrendingUp size={18} />} className="mb-0" />
            <div className="flex items-center gap-2 rounded-xl bg-brand-navy/5 px-3 py-2">
              <BadgePercent size={14} className="text-brand-navy" />
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Support Resolution</p>
                <p className="text-sm font-bold text-brand-navy">
                  {stats.supportOverview.totalTickets > 0
                    ? `${Math.round((stats.supportOverview.resolvedTickets / stats.supportOverview.totalTickets) * 100)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full rounded-2xl border border-border bg-brand-navy/[0.02] px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dashboard-booking-trend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  formatter={(value) => [wholeNumberFormatter.format(Number(value)), "Bookings"]}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#1A2B44"
                  strokeWidth={3}
                  fill="url(#dashboard-booking-trend)"
                  activeDot={{ r: 5, fill: "#C5A059" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        {/* Job Distribution */}
        <AdminCard className="p-6">
          <SectionHeader title="Job Status" icon={<Clock size={18} />} />
          <div className="space-y-4 mt-6">
            {stats.jobStatusDistribution.map((item) => (
              <div key={item.status} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-brand-navy">{item.status}</span>
                  <span className="text-brand-muted">
                    {wholeNumberFormatter.format(item.count)}
                    {jobStatusTotal > 0 ? ` • ${Math.round((item.count / jobStatusTotal) * 100)}%` : ""}
                  </span>
                </div>
                <div className="h-2 w-full bg-brand-navy/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${jobStatusTotal > 0 ? (item.count / jobStatusTotal) * 100 : 0}%` }}
                    className={cn(
                      "h-full rounded-full",
                      item.status === 'Completed' ? "bg-status-completed" :
                      item.status === 'Assigned' ? "bg-brand-gold" :
                      item.status === 'In Progress' ? "bg-status-pending" : "bg-brand-muted"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Summary */}
        <AdminCard className="p-6">
          <SectionHeader title="Revenue Summary" icon={<Wallet size={18} />} />
          <div className="mt-4 space-y-3">
            <SummaryRow label="Gross Revenue" value={currencyFormatter.format(stats.revenueSummary.totalRevenue)} />
            <SummaryRow label="Collected Revenue" value={currencyFormatter.format(stats.revenueSummary.paidRevenue)} />
            <SummaryRow label="Outstanding Revenue" value={currencyFormatter.format(stats.revenueSummary.outstandingRevenue)} />
            <SummaryRow label="Invoice Count" value={wholeNumberFormatter.format(stats.revenueSummary.invoiceCount)} />
          </div>
        </AdminCard>

        {/* Support Overview */}
        <AdminCard className="p-6">
          <SectionHeader title="Support Overview" icon={<FileText size={18} />} />
          <div className="mt-4 space-y-4">
            <InsightItem type="success" title="Total Tickets" description={wholeNumberFormatter.format(stats.supportOverview.totalTickets)} />
            <InsightItem type="warning" title="Average Resolution" description={`${stats.supportOverview.averageResolutionHours.toFixed(1)} hours`} />
            <InsightItem type="error" title="Escalations" description={wholeNumberFormatter.format(stats.supportOverview.escalationCount)} />
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function KPICard({
  label,
  value,
  hint,
  icon,
  colorClass,
}: {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
  colorClass: string
}) {
  return (
    <AdminCard className="p-5">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-xl", colorClass)}>
          {icon}
        </div>
        <div className="rounded-full bg-brand-navy/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-muted">
          Live
        </div>
      </div>
      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-brand-navy">{value}</h3>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-muted">{hint}</p>
    </AdminCard>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-brand-navy/10 bg-brand-navy/5 p-4">
      <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">{label}</span>
      <span className="text-sm font-bold text-brand-navy">{value}</span>
    </div>
  )
}

function InsightItem({
  type,
  title,
  description,
}: {
  type: "success" | "warning" | "info" | "error"
  title: string
  description: string
}) {
  const colors = {
    success: "bg-status-completed/10 text-status-completed border-status-completed/20",
    warning: "bg-status-pending/10 text-status-pending border-status-pending/20",
    info: "bg-brand-navy/10 text-brand-navy border-brand-navy/20",
    error: "bg-status-emergency/10 text-status-emergency border-status-emergency/20"
  } as const;

  return (
    <div className={cn("p-4 rounded-xl border", colors[type])}>
      <h4 className="text-xs font-bold uppercase tracking-widest mb-1">{title}</h4>
      <p className="text-xs opacity-80 leading-relaxed">{description}</p>
    </div>
  )
}
