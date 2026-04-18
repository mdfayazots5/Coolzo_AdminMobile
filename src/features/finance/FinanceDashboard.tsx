/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { paymentRepository, FinancialKPIs } from "@/core/network/payment-repository"
import { toast } from "sonner"
import { 
  TrendingUp, 
  CreditCard, 
  Clock, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart,
  BarChart3,
  Calendar,
  ChevronRight,
  Download
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
  LineChart,
  Line,
  Cell,
  PieChart as RePieChart,
  Pie
} from "recharts"

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = React.useState<FinancialKPIs | null>(null)
  const [revenueTrend, setRevenueTrend] = React.useState<any[]>([])
  const [revenueByType, setRevenueByType] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiData, trendData, typeData] = await Promise.all([
          paymentRepository.getFinancialKPIs(),
          paymentRepository.getRevenueTrend('monthly'),
          paymentRepository.getRevenueByServiceType()
        ]);
        setKpis(kpiData);
        setRevenueTrend(trendData);
        setRevenueByType(typeData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [])

  if (isLoading || !kpis) return <InlineLoader className="h-screen" />;

  const COLORS = ['#0A192F', '#D4AF37', '#E63946', '#457B9D'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Finance Overview</h1>
          <p className="text-sm text-brand-muted">Real-time financial performance and collection metrics</p>
        </div>
        <div className="flex gap-2">
          <AdminButton 
            variant="outline" 
            icon={<Download size={18} />}
            onClick={() => toast.success('Finance report export started.')}
          >
            Export Monthly Summary
          </AdminButton>
          <AdminButton 
            icon={<Calendar size={18} />}
            onClick={() => toast.info('Custom date range selection active.')}
          >
            Period: April 2024
          </AdminButton>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          label="Revenue Today" 
          value={`₹${(kpis.revenueToday / 1000).toFixed(1)}k`} 
          trend="+15%" 
          isPositive={true}
          icon={<TrendingUp size={20} />}
          color="navy"
        />
        <KPICard 
          label="Collection Rate" 
          value={`${kpis.collectionRate}%`} 
          trend="+2.4%" 
          isPositive={true}
          icon={<CreditCard size={20} />}
          color="gold"
        />
        <KPICard 
          label="Outstanding AR" 
          value={`₹${(kpis.outstandingReceivables / 1000).toFixed(1)}k`} 
          trend="-5%" 
          isPositive={true}
          icon={<Clock size={20} />}
          color="red"
        />
        <KPICard 
          label="Avg Days to Collect" 
          value={`${kpis.avgDaysToCollect} Days`} 
          trend="+1 Day" 
          isPositive={false}
          icon={<FileText size={20} />}
          color="muted"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <AdminCard className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-8">
            <SectionHeader title="Revenue vs Target" icon={<BarChart3 size={18} />} />
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="size-2 bg-brand-navy rounded-full" />
                <span>Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 bg-brand-gold rounded-full" />
                <span>Target</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="period" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#0A192F', opacity: 0.05 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" fill="#0A192F" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="target" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        {/* Revenue by Type */}
        <AdminCard className="lg:col-span-1 p-8">
          <SectionHeader title="Revenue Mix" icon={<PieChart size={18} />} />
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={revenueByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {revenueByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {revenueByType.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-bold text-brand-navy">{item.type}</span>
                </div>
                <span className="text-xs font-bold text-brand-muted">₹{(item.amount / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <AdminCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <SectionHeader title="Recent Collections" icon={<CreditCard size={18} />} />
            <AdminButton variant="ghost" size="sm" onClick={() => navigate('/finance/payments')}>View All</AdminButton>
          </div>
          <div className="space-y-4">
            {[
              { customer: 'Aditi Sharma', amount: 2773, method: 'Online', date: '10 mins ago' },
              { customer: 'Tech Park Solutions', amount: 15400, method: 'Bank Transfer', date: '2 hours ago' },
              { customer: 'Rajesh Khanna', amount: 1200, method: 'COD', date: 'Yesterday' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-2xl hover:bg-brand-navy/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-white rounded-xl flex items-center justify-center text-brand-navy shadow-sm">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{p.customer}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">{p.method} • {p.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-navy">₹{p.amount.toLocaleString()}</p>
                  <ChevronRight size={16} className="text-brand-gold ml-auto mt-1" />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Quick Reports */}
        <AdminCard className="p-8">
          <SectionHeader title="Financial Reports" icon={<FileText size={18} />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <ReportLink title="Tax Liability Report" description="GST summary for filing" onClick={() => navigate('/finance/tax')} />
            <ReportLink title="Collection Efficiency" description="Aging & recovery metrics" onClick={() => toast.info('Loading Collection metrics...')} />
            <ReportLink title="Revenue Analytics" description="Deep dive into sales data" onClick={() => toast.info('Loading Revenue analytics...')} />
            <ReportLink title="Discount Usage" description="Coupon & manual discount ROI" onClick={() => toast.info('Loading Discount data...')} />
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function KPICard({ label, value, trend, isPositive, icon, color }: any) {
  const colors: any = {
    navy: "bg-brand-navy text-white",
    gold: "bg-brand-gold text-brand-navy",
    red: "bg-status-emergency text-white",
    muted: "bg-white border border-border text-brand-navy"
  };

  return (
    <AdminCard className={cn("p-6 relative overflow-hidden", colors[color])}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-2 rounded-xl",
          color === 'muted' ? "bg-brand-navy/5 text-brand-navy" : "bg-white/10 text-white"
        )}>
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
          isPositive ? "bg-status-completed/20 text-status-completed" : "bg-status-emergency/20 text-status-emergency"
        )}>
          {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </AdminCard>
  )
}

function ReportLink({ title, description, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-start p-4 bg-brand-navy/5 rounded-2xl hover:bg-brand-gold/10 hover:border-brand-gold border border-transparent transition-all group text-left"
    >
      <p className="text-sm font-bold text-brand-navy group-hover:text-brand-gold transition-colors">{title}</p>
      <p className="text-[10px] text-brand-muted uppercase tracking-widest mt-1">{description}</p>
    </button>
  )
}
