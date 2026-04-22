/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CreditCard,
  Download,
  FileText,
  PieChart,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminButton } from "@/components/shared/AdminButton"
import { FinancialKPIs, paymentRepository } from "@/core/network/payment-repository"
import { cn } from "@/lib/utils"

export default function FinanceDashboard() {
  const navigate = useNavigate()
  const [kpis, setKpis] = React.useState<FinancialKPIs | null>(null)
  const [revenueTrend, setRevenueTrend] = React.useState<any[]>([])
  const [revenueByType, setRevenueByType] = React.useState<any[]>([])
  const [collectionEfficiency, setCollectionEfficiency] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [kpiData, trendData, mixData, collectionData] = await Promise.all([
          paymentRepository.getFinancialKPIs(),
          paymentRepository.getRevenueTrend("monthly"),
          paymentRepository.getRevenueByServiceType(),
          paymentRepository.getCollectionEfficiency(),
        ])
        setKpis(kpiData)
        setRevenueTrend(trendData)
        setRevenueByType(mixData)
        setCollectionEfficiency(collectionData)
      } catch (error) {
        console.error(error)
        toast.error("Unable to load finance dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  if (isLoading || !kpis) {
    return <InlineLoader className="h-screen" />
  }

  const colors = ["#0A192F", "#C9A84C", "#E63946", "#457B9D"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Finance Overview</h1>
          <p className="text-sm text-brand-muted">Collections, cashflow, refunds, receipts, and reporting controls</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Download size={18} />} onClick={() => navigate("/finance/reports/financial-summary")}>
            Financial Summary
          </AdminButton>
          <AdminButton icon={<Calendar size={18} />} onClick={() => toast.info("Monthly dashboard focus active")}>
            April 2026
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue Today" value={`₹${kpis.revenueToday.toLocaleString()}`} trend="+15%" positive icon={<TrendingUp size={20} />} tone="navy" />
        <KpiCard label="Collection Rate" value={`${kpis.collectionRate}%`} trend="+2.4%" positive icon={<CreditCard size={20} />} tone="gold" />
        <KpiCard label="Outstanding AR" value={`₹${kpis.outstandingReceivables.toLocaleString()}`} trend="-5%" positive icon={<FileText size={20} />} tone="red" />
        <KpiCard label="Avg Days to Collect" value={`${kpis.avgDaysToCollect} days`} trend="+1 day" positive={false} icon={<BarChart3 size={20} />} tone="muted" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AdminCard className="p-8 xl:col-span-2">
          <SectionHeader title="Revenue vs Target" icon={<BarChart3 size={18} />} />
          <div className="mt-8 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10, fontWeight: 600 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip />
                <Bar dataKey="amount" fill="#0A192F" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="target" fill="#C9A84C" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard className="p-8">
          <SectionHeader title="Revenue Mix" icon={<PieChart size={18} />} />
          <div className="mt-4 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={revenueByType} cx="50%" cy="50%" innerRadius={60} outerRadius={86} dataKey="amount" paddingAngle={4}>
                  {revenueByType.map((item, index) => (
                    <Cell key={item.type} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {revenueByType.map((item, index) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="text-xs font-bold text-brand-navy">{item.type}</span>
                </div>
                <span className="text-xs font-bold text-brand-muted">₹{item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard className="p-8">
          <SectionHeader title="Collection Efficiency" icon={<CreditCard size={18} />} />
          <div className="mt-6 space-y-4">
            {collectionEfficiency.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">{item.label}</span>
                  <span className="text-xs font-bold text-brand-navy">{item.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-brand-navy/5">
                  <div className="h-2 rounded-full bg-brand-gold" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="p-8">
          <SectionHeader title="Finance Reports" icon={<FileText size={18} />} />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReportButton title="Revenue Analytics" description="Period and zone revenue" onClick={() => navigate("/finance/reports/revenue")} />
            <ReportButton title="Collection Efficiency" description="Recovery and aging performance" onClick={() => navigate("/finance/reports/collection-efficiency")} />
            <ReportButton title="Tax Liability" description="GST summary and HSN/SAC" onClick={() => navigate("/finance/tax")} />
            <ReportButton title="Discount Usage" description="Coupon and manual discount impact" onClick={() => navigate("/finance/reports/discount-coupon-usage")} />
            <ReportButton title="Financial Summary" description="P&L summary" onClick={() => navigate("/finance/reports/financial-summary")} />
            <ReportButton title="Receipts" description="Receipt list and resend" onClick={() => navigate("/finance/receipts")} />
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  trend,
  positive,
  icon,
  tone,
}: {
  label: string
  value: string
  trend: string
  positive: boolean
  icon: React.ReactNode
  tone: "navy" | "gold" | "red" | "muted"
}) {
  const tones: Record<typeof tone, string> = {
    navy: "bg-brand-navy text-white",
    gold: "bg-brand-gold text-brand-navy",
    red: "bg-status-emergency text-white",
    muted: "border border-border bg-white text-brand-navy",
  }

  return (
    <AdminCard className={cn("overflow-hidden p-6", tones[tone])}>
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("rounded-xl p-2", tone === "muted" ? "bg-brand-navy/5 text-brand-navy" : "bg-white/10 text-current")}>{icon}</div>
        <div className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold", positive ? "bg-status-completed/20 text-status-completed" : "bg-status-emergency/20 text-status-emergency")}>
          {positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </AdminCard>
  )
}

function ReportButton({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-transparent bg-brand-navy/5 p-4 text-left transition-all hover:border-brand-gold hover:bg-brand-gold/10">
      <p className="text-sm font-bold text-brand-navy">{title}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-brand-muted">{description}</p>
    </button>
  )
}
