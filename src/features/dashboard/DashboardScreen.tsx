/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { MockDashboardRepository, DashboardStats } from "@/core/network/dashboard-repository"
import { 
  TrendingUp, 
  Users, 
  Wrench, 
  Star, 
  ShieldCheck, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

const dashRepo = new MockDashboardRepository();

export default function DashboardScreen() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashRepo.getStats();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [])

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!stats) return <div className="p-8 text-center">Failed to load dashboard data</div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Global Dashboard</h1>
          <p className="text-sm text-brand-muted">Real-time operational metrics and performance overview</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl shadow-sm">
          <Calendar size={16} className="text-brand-muted" />
          <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">April 2024</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Total Revenue" 
          value={`₹${(stats.totalRevenue / 100000).toFixed(1)}L`} 
          trend="+12.5%" 
          positive={true}
          icon={<DollarSign size={20} />}
          colorClass="bg-brand-gold/10 text-brand-gold"
        />
        <KPICard 
          label="Active Jobs" 
          value={stats.activeJobs} 
          trend="+4" 
          positive={true}
          icon={<Wrench size={20} />}
          colorClass="bg-brand-navy/10 text-brand-navy"
        />
        <KPICard 
          label="CSAT Score" 
          value={stats.customerSatisfaction} 
          trend="+0.2" 
          positive={true}
          icon={<Star size={20} />}
          colorClass="bg-status-pending/10 text-status-pending"
        />
        <KPICard 
          label="SLA Compliance" 
          value={`${stats.slaCompliance}%`} 
          trend="-1.2%" 
          positive={false}
          icon={<ShieldCheck size={20} />}
          colorClass="bg-status-completed/10 text-status-completed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Placeholder */}
        <AdminCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <SectionHeader title="Revenue Trend" icon={<TrendingUp size={18} />} className="mb-0" />
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-brand-navy/5 text-[10px] font-bold text-brand-navy rounded">WEEKLY</span>
              <span className="px-2 py-1 text-[10px] font-bold text-brand-muted rounded">MONTHLY</span>
            </div>
          </div>
          <div className="h-[300px] w-full bg-brand-navy/[0.02] rounded-2xl border border-dashed border-brand-navy/10 flex items-center justify-center relative overflow-hidden">
            {/* Simple SVG Chart Mockup */}
            <svg className="absolute inset-0 w-full h-full p-4" preserveAspectRatio="none">
              <path 
                d="M0,200 Q100,150 200,180 T400,100 T600,120 T800,50 T1000,80" 
                fill="none" 
                stroke="url(#gradient)" 
                strokeWidth="4" 
                className="drop-shadow-lg"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C5A059" />
                  <stop offset="100%" stopColor="#1A2B44" />
                </linearGradient>
              </defs>
            </svg>
            <div className="z-10 text-center">
              <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">Interactive Charts Coming Soon</p>
              <p className="text-[10px] text-brand-muted/60 mt-1">D3.js / Recharts Integration in Progress</p>
            </div>
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
                  <span className="text-brand-muted">{item.count}</span>
                </div>
                <div className="h-2 w-full bg-brand-navy/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / 83) * 100}%` }}
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
        {/* Top Technicians */}
        <AdminCard className="p-6">
          <SectionHeader title="Top Performing Technicians" icon={<Users size={18} />} />
          <div className="mt-4 space-y-3">
            {stats.topTechnicians.map((tech, i) => (
              <div key={tech.name} className="flex items-center justify-between p-3 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-brand-navy text-brand-gold rounded-lg flex items-center justify-center font-bold text-xs">
                    {tech.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{tech.name}</p>
                    <p className="text-[10px] text-brand-muted uppercase font-bold">{tech.jobs} Jobs Completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-status-pending fill-status-pending" />
                  <span className="text-xs font-bold text-brand-navy">{tech.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Recent Alerts / Insights */}
        <AdminCard className="p-6">
          <SectionHeader title="Operational Insights" icon={<ArrowUpRight size={18} />} />
          <div className="mt-4 space-y-4">
            <InsightItem 
              type="success"
              title="Revenue Growth"
              description="Daily revenue is up 15% compared to last week due to increased AMC renewals."
            />
            <InsightItem 
              type="warning"
              title="SLA Alert"
              description="Zone 3 is experiencing a 5% dip in on-time arrivals. Check technician availability."
            />
            <InsightItem 
              type="info"
              title="New Skill Tag"
              description="3 technicians completed 'Inverter AC' certification today."
            />
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function KPICard({ label, value, trend, positive, icon, colorClass }: any) {
  return (
    <AdminCard className="p-5">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-xl", colorClass)}>
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full",
          positive ? "bg-status-completed/10 text-status-completed" : "bg-status-emergency/10 text-status-emergency"
        )}>
          {positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-brand-navy">{value}</h3>
    </AdminCard>
  )
}

function InsightItem({ type, title, description }: any) {
  const colors = {
    success: "bg-status-completed/10 text-status-completed border-status-completed/20",
    warning: "bg-status-pending/10 text-status-pending border-status-pending/20",
    info: "bg-brand-navy/10 text-brand-navy border-brand-navy/20",
    error: "bg-status-emergency/10 text-status-emergency border-status-emergency/20"
  } as any;

  return (
    <div className={cn("p-4 rounded-xl border", colors[type])}>
      <h4 className="text-xs font-bold uppercase tracking-widest mb-1">{title}</h4>
      <p className="text-xs opacity-80 leading-relaxed">{description}</p>
    </div>
  )
}
