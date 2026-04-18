/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { inventoryRepository } from "@/core/network/inventory-repository"
import { toast } from "sonner"
import { 
  Package, 
  AlertTriangle, 
  ClipboardList, 
  Truck, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  FileText
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await inventoryRepository.getInventoryStats();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Inventory Dashboard</h1>
          <p className="text-sm text-brand-muted">Real-time warehouse and parts management</p>
        </div>
        <div className="flex gap-2">
          <AdminButton 
            variant="outline" 
            icon={<RefreshCw size={18} />}
            onClick={() => toast.info('Stock audit requested for primary warehouse.')}
          >
            Stock Audit
          </AdminButton>
          <AdminButton icon={<Plus size={18} />} onClick={() => navigate('/inventory/catalog')}>Add New Part</AdminButton>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total SKUs" value={stats.totalSKUs} icon={<Package size={20} />} color="navy" />
        <StatCard label="Stock Value" value={`₹${(stats.totalStockValue / 1000).toFixed(0)}k`} icon={<TrendingUp size={20} />} color="gold" />
        <StatCard label="Low Stock" value={stats.lowStockCount} icon={<AlertTriangle size={20} />} color="orange" alert={stats.lowStockCount > 0} />
        <StatCard label="Out of Stock" value={stats.outOfStockCount} icon={<AlertTriangle size={20} />} color="red" alert={stats.outOfStockCount > 0} />
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionTile 
          title="Process Requests" 
          count={stats.pendingRequests} 
          desc="Technician parts requests awaiting approval"
          icon={<ClipboardList size={24} />}
          onClick={() => navigate('/inventory/requests')}
          color="blue"
        />
        <ActionTile 
          title="Open Purchase Orders" 
          count={stats.openPOs} 
          desc="Track incoming stock from suppliers"
          icon={<Truck size={24} />}
          onClick={() => navigate('/inventory/orders')}
          color="purple"
        />
        <ActionTile 
          title="Stock Ledger" 
          desc="View all chronological stock movements"
          icon={<FileText size={24} />}
          onClick={() => navigate('/inventory/ledger')}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fastest Moving Parts */}
        <AdminCard className="lg:col-span-2 p-8">
          <SectionHeader title="Fastest Moving Parts (Monthly)" icon={<TrendingUp size={18} />} />
          <div className="space-y-4 mt-6">
            {[
              { name: 'Capacitor 45mfd', usage: 142, trend: '+12%', up: true },
              { name: 'Refrigerant R410A', usage: 85, trend: '+5%', up: true },
              { name: 'Fan Motor 1.5T', usage: 42, trend: '-2%', up: false },
              { name: 'Copper Pipe 1/4"', usage: 320, trend: '+18%', up: true },
            ].map((part, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-white rounded-xl flex items-center justify-center text-brand-navy shadow-sm font-bold text-xs">
                    #{i+1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{part.name}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">{part.usage} units consumed</p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold",
                  part.up ? "bg-status-completed/10 text-status-completed" : "bg-status-emergency/10 text-status-emergency"
                )}>
                  {part.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {part.trend}
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Low Stock Alerts */}
        <AdminCard className="lg:col-span-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <SectionHeader title="Low Stock Alerts" icon={<AlertTriangle size={18} />} />
            <button className="text-xs font-bold text-brand-gold uppercase tracking-widest hover:underline" onClick={() => navigate('/inventory/catalog?status=low')}>View All</button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'R410A Gas', stock: 5, min: 15 },
              { name: 'Flare Nut 1/2"', stock: 12, min: 50 },
              { name: 'Blower Motor', stock: 0, min: 2 },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white border border-border rounded-2xl hover:border-brand-gold transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-brand-navy">{item.name}</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase",
                    item.stock === 0 ? "bg-status-emergency/10 text-status-emergency" : "bg-status-pending/10 text-status-pending"
                  )}>
                    {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-navy">{item.stock}</span>
                    <span className="text-[10px] text-brand-muted uppercase tracking-widest">/ {item.min} min</span>
                  </div>
                  <AdminButton 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-[8px] px-2"
                    onClick={() => {
                      toast.success(`Purchase order draft created for ${item.name}`);
                      navigate('/inventory/orders');
                    }}
                  >
                    Order
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
          <AdminButton className="w-full mt-8" onClick={() => navigate('/inventory/orders/new')}>
            Create Bulk PO
          </AdminButton>
        </AdminCard>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, alert }: any) {
  const colors: any = {
    navy: "bg-brand-navy/5 text-brand-navy",
    gold: "bg-brand-gold/10 text-brand-gold",
    orange: "bg-status-pending/10 text-status-pending",
    red: "bg-status-emergency/10 text-status-emergency"
  };
  return (
    <AdminCard className={cn("p-6", alert && "border-2 border-status-emergency/20")}>
      <div className={cn("size-10 rounded-xl flex items-center justify-center mb-4", colors[color])}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-brand-navy mb-1">{value}</p>
      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{label}</p>
    </AdminCard>
  )
}

function ActionTile({ title, count, desc, icon, onClick, color }: any) {
  const colors: any = {
    blue: "bg-blue-500/10 text-blue-600",
    purple: "bg-purple-500/10 text-purple-600",
    green: "bg-emerald-500/10 text-emerald-600"
  };
  return (
    <AdminCard 
      onClick={onClick}
      className="p-6 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", colors[color])}>
          {icon}
        </div>
        {count !== undefined && (
          <span className="size-8 bg-brand-navy text-brand-gold rounded-full flex items-center justify-center text-xs font-bold">
            {count}
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-brand-navy mb-1">{title}</h3>
      <p className="text-xs text-brand-muted">{desc}</p>
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-navy/5 -mr-12 -mt-12 rounded-full blur-2xl" />
    </AdminCard>
  )
}
