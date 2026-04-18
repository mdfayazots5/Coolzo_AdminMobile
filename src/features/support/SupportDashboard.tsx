/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { supportRepository, SupportStats } from "@/core/network/support-repository"
import { toast } from "sonner"
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  TrendingUp, 
  BarChart3, 
  PieChart,
  Users,
  ChevronRight,
  Calendar
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
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

export default function SupportDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<SupportStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await supportRepository.getSupportStats();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [])

  if (isLoading || !stats) return <InlineLoader className="h-screen" />;

  const volumeData = [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 18 },
    { day: 'Wed', count: 15 },
    { day: 'Thu', count: 22 },
    { day: 'Fri', count: 28 },
    { day: 'Sat', count: 14 },
    { day: 'Sun', count: 8 },
  ];

  const categoryData = [
    { name: 'Repair', value: 45 },
    { name: 'Billing', value: 25 },
    { name: 'Booking', value: 20 },
    { name: 'Other', value: 10 },
  ];

  const COLORS = ['#0A192F', '#D4AF37', '#E63946', '#457B9D'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Support Dashboard</h1>
          <p className="text-sm text-brand-muted">Monitor service quality and support performance</p>
        </div>
        <div className="flex gap-2">
          <AdminButton 
            variant="outline" 
            icon={<Calendar size={18} />}
            onClick={() => toast.info('Time period selection active.')}
          >
            Last 7 Days
          </AdminButton>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Open Tickets" value={stats.openTickets} trend="New today: 5" icon={<MessageSquare size={20} />} color="navy" />
        <KPICard label="Avg Response" value={stats.avgFirstResponseTime} trend="-2 mins vs avg" icon={<Clock size={20} />} color="gold" />
        <KPICard label="SLA Compliance" value={`${stats.slaComplianceRate}%`} trend="Target: 95%" icon={<CheckCircle2 size={20} />} color="green" />
        <KPICard label="Escalated" value={stats.escalatedCount} trend="Critical: 2" icon={<ShieldAlert size={20} />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Volume Chart */}
        <AdminCard className="lg:col-span-2 p-8">
          <SectionHeader title="Ticket Volume Trend" icon={<BarChart3 size={18} />} />
          <div className="h-[300px] w-full mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#0A192F', opacity: 0.05 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#0A192F" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        {/* Category Breakdown */}
        <AdminCard className="lg:col-span-1 p-8">
          <SectionHeader title="Complaint Categories" icon={<PieChart size={18} />} />
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {categoryData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-bold text-brand-navy">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-brand-muted">{item.value}%</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <AdminCard className="p-8">
          <SectionHeader title="Agent Performance" icon={<Users size={18} />} />
          <div className="mt-6 space-y-4">
            {[
              { name: 'Rahul Verma', tickets: 42, response: '12m', rating: 4.8 },
              { name: 'Priya Singh', tickets: 38, response: '15m', rating: 4.9 },
              { name: 'Amit Kumar', tickets: 35, response: '22m', rating: 4.5 },
            ].map((agent, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-white rounded-xl flex items-center justify-center text-brand-navy font-bold shadow-sm">
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{agent.name}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">{agent.tickets} Tickets Handled</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-brand-navy">Avg: {agent.response}</p>
                  <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest">★ {agent.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* SLA Alerts */}
        <AdminCard className="p-8">
          <SectionHeader title="SLA Breach Alerts" icon={<ShieldAlert size={18} />} />
          <div className="mt-6 space-y-4">
            {[
              { id: 'TCK-1002', time: 'Overdue by 15m', priority: 'High' },
              { id: 'TCK-1005', time: 'Due in 10m', priority: 'Urgent' },
            ].map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-status-emergency/20 bg-status-emergency/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-status-emergency text-white rounded-xl flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{alert.id}</p>
                    <p className="text-[10px] text-status-emergency font-bold uppercase tracking-widest">{alert.time}</p>
                  </div>
                </div>
                <AdminButton variant="ghost" size="sm" className="text-brand-gold" onClick={() => navigate(`/support/tickets`)}>
                  Resolve <ChevronRight size={14} className="ml-1" />
                </AdminButton>
              </div>
            ))}
            {/* Empty state if no alerts */}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function KPICard({ label, value, trend, icon, color }: any) {
  const colors: any = {
    navy: "bg-brand-navy text-white",
    gold: "bg-brand-gold text-brand-navy",
    green: "bg-status-completed text-white",
    red: "bg-status-emergency text-white"
  };

  return (
    <AdminCard className={cn("p-6", colors[color])}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/10 rounded-xl text-white">
          {icon}
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className="text-[10px] font-medium opacity-80">{trend}</p>
    </AdminCard>
  )
}
