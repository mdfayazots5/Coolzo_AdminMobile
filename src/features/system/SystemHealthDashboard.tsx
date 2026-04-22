/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { systemRepository, SystemHealth } from "@/core/network/system-repository"
import { useSystemUX } from "@/core/system/SystemUXProvider"
import { 
  Activity, 
  Zap, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Cpu, 
  Database,
  RefreshCw,
  Server,
  Smartphone
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"

export default function SystemHealthDashboard() {
  const [health, setHealth] = React.useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const { isOnline, lastSyncAt } = useSystemUX()

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const data = await systemRepository.getSystemHealth();
      setHealth(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    fetchHealth();
  }, [])

  if (isLoading || !health) return <InlineLoader className="h-screen" />;

  const latencyData = [
    { time: '10:00', latency: 110 },
    { time: '10:15', latency: 145 },
    { time: '10:30', latency: 120 },
    { time: '10:45', latency: 180 },
    { time: '11:00', latency: 130 },
    { time: '11:15', latency: 124 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">System Health & Observability</h1>
          <p className="text-sm text-brand-muted">Real-time performance monitoring and production metrics</p>
        </div>
        <div className="flex gap-2">
          <AdminButton 
            variant="outline" 
            icon={<RefreshCw size={18} />}
            onClick={fetchHealth}
          >
            Refresh Metrics
          </AdminButton>
        </div>
      </div>

      {!isOnline && (
        <AdminCard className="p-4 border border-brand-gold/30 bg-brand-gold/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy">Cached State</p>
          <p className="mt-2 text-sm text-brand-navy">
            Offline mode is active. Showing the last available system snapshot
            {lastSyncAt ? ` from ${new Date(lastSyncAt).toLocaleString()}.` : "."}
          </p>
        </AdminCard>
      )}

      {/* System Status Banner */}
      <AdminCard className={cn(
        "p-6 border-l-8",
        health.status === 'healthy' ? "border-l-status-completed bg-status-completed/5" : "border-l-status-emergency bg-status-emergency/5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "size-12 rounded-2xl flex items-center justify-center",
              health.status === 'healthy' ? "bg-status-completed text-white" : "bg-status-emergency text-white"
            )}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-navy capitalize">System {health.status}</h2>
              <p className="text-xs text-brand-muted font-medium">All core services are operational. Uptime: {health.uptime}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">App Version</p>
            <p className="text-sm font-bold text-brand-navy">v{health.version}</p>
          </div>
        </div>
      </AdminCard>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="API Latency" value={`${health.apiLatency}ms`} trend="Avg: 130ms" icon={<Zap size={20} />} color="gold" />
        <MetricCard label="Active Sessions" value={health.activeUsers} trend="+12% vs last hour" icon={<Activity size={20} />} color="navy" />
        <MetricCard label="Error Rate" value={`${health.errorRate}%`} trend="Target: <0.05%" icon={<AlertCircle size={20} />} color="red" />
        <MetricCard
          label="Last Sync"
          value={lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : "Not synced"}
          trend="Auto-sync queue enabled"
          icon={<RefreshCw size={20} />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Chart */}
        <AdminCard className="lg:col-span-2 p-8">
          <SectionHeader title="API Response Latency (ms)" icon={<TrendingUp size={18} />} />
          <div className="h-[300px] w-full mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="time" 
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
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="latency" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        {/* Resource Usage */}
        <AdminCard className="lg:col-span-1 p-8">
          <SectionHeader title="Infrastructure" icon={<Server size={18} />} />
          <div className="mt-8 space-y-8">
            <ResourceBar label="CPU Usage" value={42} color="bg-brand-navy" />
            <ResourceBar label="Memory Usage" value={68} color="bg-brand-gold" />
            <ResourceBar label="Database Load" value={24} color="bg-status-completed" />
            <ResourceBar label="Storage Capacity" value={15} color="bg-status-emergency" />
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Logs */}
        <AdminCard className="p-8">
          <SectionHeader title="Performance Traces" icon={<Cpu size={18} />} />
          <div className="mt-6 space-y-4">
            {[
              { name: 'Cold Start Time', value: '1.2s', status: 'optimal' },
              { name: 'SR List Load', value: '450ms', status: 'optimal' },
              { name: 'Dispatch Board Render', value: '820ms', status: 'warning' },
              { name: 'Invoice Generation', value: '1.5s', status: 'optimal' },
            ].map((trace, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-2xl">
                <span className="text-sm font-bold text-brand-navy">{trace.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-brand-navy">{trace.value}</span>
                  <div className={cn(
                    "size-2 rounded-full",
                    trace.status === 'optimal' ? "bg-status-completed" : "bg-brand-gold"
                  )} />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Version Management */}
        <AdminCard className="p-8">
          <SectionHeader title="App Version Control" icon={<Smartphone size={18} />} />
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-brand-navy">Current Production Version</p>
                <p className="text-[10px] text-brand-muted uppercase tracking-widest">v1.2.0 (Build 45)</p>
              </div>
              <AdminButton 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://github.com/coolzo/admin-app/releases', '_blank')}
              >
                Manage Releases
              </AdminButton>
            </div>
            <div className="p-4 bg-status-emergency/5 border border-status-emergency/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} className="text-status-emergency" />
                <span className="text-[10px] font-bold text-status-emergency uppercase tracking-widest">Force Update Required</span>
              </div>
              <p className="text-xs text-brand-navy mb-3">Versions below v1.0.0 are no longer supported due to security updates.</p>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-brand-muted font-bold uppercase">Min Support: v1.0.0</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-status-emergency">Policy managed by release ops</span>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function MetricCard({ label, value, trend, icon, color }: any) {
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

function ResourceBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-brand-navy uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-bold text-brand-navy">{value}%</span>
      </div>
      <div className="h-2 bg-brand-navy/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full", color)}
        />
      </div>
    </div>
  )
}
