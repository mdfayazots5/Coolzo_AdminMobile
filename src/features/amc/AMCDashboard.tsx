/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { amcRepository, AMCContract } from "@/core/network/amc-repository"
import { useNavigate } from "react-router-dom"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  Calendar, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  FileText,
  User,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts"

const PLAN_DATA = [
  { name: 'Basic', value: 45, color: '#94A3B8' },
  { name: 'Standard', value: 32, color: '#F59E0B' },
  { name: 'Premium', value: 18, color: '#1E293B' },
  { name: 'Enterprise', value: 5, color: '#10B981' },
];

const ENROLLMENT_DATA = [
  { month: 'Jan', count: 12 },
  { month: 'Feb', count: 18 },
  { month: 'Mar', count: 15 },
  { month: 'Apr', count: 22 },
  { month: 'May', count: 28 },
  { month: 'Jun', count: 24 },
];

export default function AMCDashboard() {
  const [stats, setStats] = React.useState<any>(null)
  const [recentEnrollments, setRecentEnrollments] = React.useState<AMCContract[]>([])
  const [expiringSoon, setExpiringSoon] = React.useState<AMCContract[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, contractsData, expiringData] = await Promise.all([
          amcRepository.getAMCDashboardStats(),
          amcRepository.getContracts({ limit: 3 }),
          amcRepository.getRenewalQueue()
        ]);
        setStats(statsData);
        setRecentEnrollments(contractsData.slice(0, 3));
        setExpiringSoon(expiringData.slice(0, 3));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [])

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">AMC Performance Dashboard</h1>
        <p className="text-sm text-brand-muted">Real-time metrics for recurring maintenance contracts</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Active Contracts" 
          value={stats.activeContracts} 
          trend="+12%" 
          up 
          icon={<FileText size={20} />} 
          onClick={() => navigate('/amc/contracts?status=active')}
        />
        <StatCard 
          label="Renewal Rate" 
          value={`${stats.renewalRate}%`} 
          trend="+5%" 
          up 
          icon={<RefreshCw size={20} />} 
          onClick={() => navigate('/amc/renewals')}
        />
        <StatCard 
          label="Monthly Revenue" 
          value={`₹${(stats.revenue / 1000).toFixed(0)}k`} 
          trend="+8%" 
          up 
          icon={<TrendingUp size={20} />} 
        />
        <StatCard 
          label="Visit Completion" 
          value={`${stats.visitCompletionRate}%`} 
          trend="-2%" 
          up={false} 
          icon={<Calendar size={20} />} 
          onClick={() => navigate('/amc/visits')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrollment Trend */}
        <AdminCard className="lg:col-span-2 p-8">
          <SectionHeader title="Enrollment Trend" icon={<TrendingUp size={18} />} />
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ENROLLMENT_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        {/* Plan Breakdown */}
        <AdminCard className="lg:col-span-1 p-8">
          <SectionHeader title="Plan Breakdown" icon={<PieChart size={18} />} />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={PLAN_DATA}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {PLAN_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {PLAN_DATA.map((plan, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="text-xs font-bold text-brand-navy">{plan.name}</span>
                </div>
                <span className="text-xs font-bold text-brand-muted">{plan.value}%</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <AdminCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <SectionHeader title="Recent Enrollments" icon={<Users size={18} />} />
            <button 
              onClick={() => navigate('/amc/contracts')}
              className="text-xs font-bold text-brand-gold uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentEnrollments.map(c => (
              <div 
                key={c.id} 
                onClick={() => navigate(`/amc/contract/${c.id}`)}
                className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-2xl hover:bg-brand-navy/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-white rounded-xl flex items-center justify-center text-brand-navy shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{c.customerName}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">{c.planType} Plan • {c.equipmentIds.length} Units</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-navy">₹{c.fee.toLocaleString()}</p>
                  <p className="text-[10px] text-status-completed font-bold uppercase tracking-widest">{c.paymentStatus}</p>
                </div>
              </div>
            ))}
            {recentEnrollments.length === 0 && <p className="text-center text-xs text-brand-muted py-4">No recent enrollments</p>}
          </div>
        </AdminCard>

        {/* Expiring Soon */}
        <AdminCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <SectionHeader title="Expiring Soon" icon={<AlertCircle size={18} />} />
            <button 
              onClick={() => navigate('/amc/renewals')}
              className="text-xs font-bold text-brand-gold uppercase tracking-widest hover:underline"
            >
              Manage Queue
            </button>
          </div>
          <div className="space-y-4">
            {expiringSoon.map(c => (
              <div 
                key={c.id} 
                onClick={() => navigate(`/amc/contract/${c.id}`)}
                className="flex items-center justify-between p-4 bg-white border border-border rounded-2xl hover:border-brand-gold transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-status-pending/10 text-status-pending rounded-xl flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{c.contractNumber}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">Expires {c.endDate}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-brand-muted group-hover:text-brand-gold transition-colors" />
              </div>
            ))}
            {expiringSoon.length === 0 && <p className="text-center text-xs text-brand-muted py-4">No contracts expiring soon</p>}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function StatCard({ label, value, trend, up, icon, onClick }: any) {
  return (
    <AdminCard 
      className={cn("p-6 transition-all", onClick && "cursor-pointer hover:shadow-lg hover:border-brand-gold")}
      onClick={onClick}
    >
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
