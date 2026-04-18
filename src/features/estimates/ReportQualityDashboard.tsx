/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { jobReportRepository } from "@/core/network/job-report-repository"
import { 
  TrendingUp, 
  Users, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts"

const TREND_DATA = [
  { day: 'Mon', score: 88 },
  { day: 'Tue', score: 92 },
  { day: 'Wed', score: 85 },
  { day: 'Thu', score: 94 },
  { day: 'Fri', score: 90 },
  { day: 'Sat', score: 82 },
  { day: 'Sun', score: 89 },
];

export default function ReportQualityDashboard() {
  const [metrics, setMetrics] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await jobReportRepository.getQualityMetrics();
        setMetrics(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMetrics();
  }, [])

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Report Quality Dashboard</h1>
        <p className="text-sm text-brand-muted">Monitoring service documentation standards and technician performance</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Avg Quality Score" value={91} trend="+4%" up icon={<Star size={20} />} />
        <StatCard label="Checklist Completion" value={`${metrics.avgChecklistCompletion}%`} trend="+2%" up icon={<CheckCircle2 size={20} />} />
        <StatCard label="Avg Photo Count" value={metrics.avgPhotoCount} trend="+0.5" up icon={<Camera size={20} />} />
        <StatCard label="Flagged Reports" value={`${metrics.flaggedRate}%`} trend="-1%" up={false} icon={<AlertCircle size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Trend */}
        <AdminCard className="lg:col-span-2 p-8">
          <SectionHeader title="Quality Score Trend (7 Days)" icon={<TrendingUp size={18} />} />
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[70, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="score" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        {/* Technician Leaderboard */}
        <AdminCard className="lg:col-span-1 p-8">
          <SectionHeader title="Technician Performance" icon={<Users size={18} />} />
          <div className="space-y-6 mt-4">
            {metrics.technicianPerformance.map((tech: any, i: number) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-brand-navy">{tech.name}</span>
                  <span className="text-xs font-bold text-brand-gold">{tech.score}</span>
                </div>
                <div className="h-2 w-full bg-brand-navy/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${tech.score}%` }}
                    className="h-full bg-brand-gold"
                  />
                </div>
              </div>
            ))}
          </div>
          <AdminButton 
            variant="outline" 
            className="w-full mt-8" 
            size="sm"
            onClick={() => toast.info('Performance report generation starting...')}
          >
            Full Performance Report
          </AdminButton>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Issues */}
        <AdminCard className="p-8">
          <SectionHeader title="Common Quality Issues" icon={<AlertCircle size={18} />} />
          <div className="space-y-4 mt-4">
            <IssueRow label="Missing Before Photos" count={12} trend="+3" />
            <IssueRow label="Incomplete Checklists" count={8} trend="-2" />
            <IssueRow label="Missing Signatures" count={3} trend="0" />
            <IssueRow label="Low Customer Rating" count={5} trend="+1" />
          </div>
        </AdminCard>

        {/* Documentation Stats */}
        <AdminCard className="p-8">
          <SectionHeader title="Documentation Standards" icon={<CheckCircle2 size={18} />} />
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="p-4 bg-brand-navy/5 rounded-2xl text-center">
              <p className="text-2xl font-bold text-brand-navy">{metrics.signatureRate}%</p>
              <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Digital Signature Rate</p>
            </div>
            <div className="p-4 bg-brand-navy/5 rounded-2xl text-center">
              <p className="text-2xl font-bold text-brand-navy">4.2</p>
              <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Avg Photos Per Job</p>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function StatCard({ label, value, trend, up, icon }: any) {
  return (
    <AdminCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="size-10 bg-brand-navy/5 text-brand-navy rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold",
          up ? "bg-status-completed/10 text-status-completed" : "bg-status-emergency/10 text-status-emergency"
        )}>
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <p className="text-2xl font-bold text-brand-navy mb-1">{value}</p>
      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{label}</p>
    </AdminCard>
  )
}

function IssueRow({ label, count, trend }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-2xl">
      <span className="text-sm font-bold text-brand-navy">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-brand-navy">{count}</span>
        <span className={cn(
          "text-[10px] font-bold",
          trend.startsWith('+') ? "text-status-emergency" : trend === '0' ? "text-brand-muted" : "text-status-completed"
        )}>
          {trend}
        </span>
      </div>
    </div>
  )
}

function BarChart3({ size }: { size: number }) {
  return <div className="size-5 bg-brand-navy/5 rounded flex items-end gap-0.5 p-1">
    <div className="w-1 h-2 bg-brand-navy/40 rounded-full" />
    <div className="w-1 h-3 bg-brand-navy/60 rounded-full" />
    <div className="w-1 h-1.5 bg-brand-navy/30 rounded-full" />
  </div>
}
