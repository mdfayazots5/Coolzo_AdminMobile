/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
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
import {
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
  Star,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminButton } from "@/components/shared/AdminButton"
import { FeedbackAnalytics, SupportStats, supportRepository } from "@/core/network/support-repository"
import { cn } from "@/lib/utils"

export default function SupportDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = React.useState<SupportStats | null>(null)
  const [analytics, setAnalytics] = React.useState<FeedbackAnalytics | null>(null)
  const [negativeCount, setNegativeCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsData, analyticsData, negativeQueue] = await Promise.all([
          supportRepository.getSupportStats(),
          supportRepository.getFeedbackAnalytics(),
          supportRepository.getNegativeFeedbackQueue(),
        ])
        setStats(statsData)
        setAnalytics(analyticsData)
        setNegativeCount(negativeQueue.length)
      } catch (error) {
        console.error(error)
        toast.error("Unable to load support dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  if (isLoading || !stats || !analytics) {
    return <InlineLoader className="h-screen" />
  }

  const complaintMix = [
    { name: "Open Tickets", value: stats.openTickets },
    { name: "Escalated", value: stats.escalatedCount },
    { name: "Negative Feedback", value: negativeCount },
  ]

  const colors = ["#0A192F", "#C9A84C", "#E63946"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Support Dashboard</h1>
          <p className="text-sm text-brand-muted">Ticket operations, service quality, and review-response monitoring</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" onClick={() => navigate("/support/feedback")}>
            Feedback Queue
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open Tickets" value={stats.openTickets} trend={stats.avgFirstResponseTime} icon={<MessageSquare size={20} />} tone="navy" />
        <KpiCard label="SLA Compliance" value={`${stats.slaComplianceRate}%`} trend={stats.avgResolutionTime} icon={<CheckCircle2 size={20} />} tone="green" />
        <KpiCard label="Escalated" value={stats.escalatedCount} trend="Needs senior attention" icon={<ShieldAlert size={20} />} tone="red" />
        <KpiCard label="Average Rating" value={analytics.averageRating.toFixed(1)} trend={analytics.npsLabel} icon={<Star size={20} />} tone="gold" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AdminCard className="p-8 xl:col-span-2">
          <SectionHeader title="Ticket Volume Trend" icon={<MessageSquare size={18} />} />
          <div className="mt-6 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.volumeTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10, fontWeight: 600 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0A192F" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard className="p-8">
          <SectionHeader title="Issue Mix" icon={<ShieldAlert size={18} />} />
          <div className="mt-4 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={complaintMix} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {complaintMix.map((item, index) => (
                    <Cell key={item.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard className="p-8">
          <SectionHeader title="Agent Performance" icon={<Users size={18} />} />
          <div className="mt-6 space-y-4">
            {stats.agentPerformance.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between rounded-2xl bg-brand-navy/5 p-4">
                <div>
                  <p className="text-sm font-bold text-brand-navy">{agent.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-brand-muted">{agent.tickets} tickets</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-brand-navy">Avg reply {agent.response}</p>
                  <p className="text-[10px] uppercase tracking-widest text-brand-gold">Rating {agent.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="p-8">
          <SectionHeader title="Technician Review Ranking" icon={<Star size={18} />} />
          <div className="mt-6 space-y-4">
            {analytics.technicianRanking.map((technician) => (
              <div key={technician.technicianName} className="flex items-center justify-between rounded-2xl bg-brand-gold/10 p-4">
                <div>
                  <p className="text-sm font-bold text-brand-navy">{technician.technicianName}</p>
                  <p className="text-[10px] uppercase tracking-widest text-brand-muted">{technician.reviewCount} reviews</p>
                </div>
                <p className="text-sm font-bold text-brand-gold">{technician.rating.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function KpiCard({ label, value, trend, icon, tone }: { label: string; value: string | number; trend: string; icon: React.ReactNode; tone: "navy" | "gold" | "green" | "red" }) {
  const tones = {
    navy: "bg-brand-navy text-white",
    gold: "bg-brand-gold text-brand-navy",
    green: "bg-status-completed text-white",
    red: "bg-status-emergency text-white",
  }

  return (
    <AdminCard className={cn("p-6", tones[tone])}>
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-white/10 p-2 text-current">{icon}</div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-[10px] uppercase tracking-widest opacity-80">{trend}</p>
    </AdminCard>
  )
}
