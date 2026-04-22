/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader } from "@/components/shared/Layout"
import { estimateRepository, WorkOrder } from "@/core/network/estimate-repository"
import { 
  ClipboardList, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Package
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function WorkOrderList() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'open' | 'in-progress' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const data = await estimateRepository.getWorkOrders({});
        setWorkOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWorkOrders();
  }, [])

  const filteredWOs = workOrders.filter((wo) => {
    const matchesFilter = filter === 'all' || wo.status === filter;
    const matchesSearch = [wo.woNumber, wo.estimateNumber, wo.customerName]
      .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Work Orders</h1>
          <p className="text-sm text-brand-muted">Manage approved additional work and parts replacement</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by WO #, Estimate # or Customer..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
          <FilterButton active={filter === 'open'} onClick={() => setFilter('open')} label="Open" />
          <FilterButton active={filter === 'in-progress'} onClick={() => setFilter('in-progress')} label="In Progress" />
          <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')} label="Completed" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredWOs.map((wo, idx) => (
          <motion.div
            key={wo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <WorkOrderCard wo={wo} onClick={() => navigate(`/work-orders/${wo.id}`)} />
          </motion.div>
        ))}
        {filteredWOs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-border">
            <ClipboardList size={48} className="mx-auto text-brand-muted mb-4 opacity-20" />
            <p className="text-brand-muted">No work orders found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterButton({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
        active ? "bg-brand-navy text-brand-gold" : "bg-white text-brand-muted border border-border hover:border-brand-gold"
      )}
    >
      {label}
    </button>
  )
}

function WorkOrderCard({ wo, onClick }: { wo: WorkOrder, onClick: () => void }) {
  const statusConfig = {
    open: { icon: <Clock size={14} />, class: "bg-status-pending/10 text-status-pending", label: "Open" },
    'in-progress': { icon: <Clock size={14} />, class: "bg-brand-navy/5 text-brand-navy", label: "In Progress" },
    completed: { icon: <CheckCircle2 size={14} />, class: "bg-status-completed/10 text-status-completed", label: "Completed" },
    cancelled: { icon: <AlertCircle size={14} />, class: "bg-status-emergency/10 text-status-emergency", label: "Cancelled" }
  };

  const config = statusConfig[wo.status];

  return (
    <AdminCard 
      onClick={onClick}
      className="p-6 hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", config.class)}>
            <ClipboardList size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-brand-navy">{wo.woNumber}</h3>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1", config.class)}>
                {config.icon} {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="font-bold text-brand-navy">Est: {wo.estimateNumber}</span>
              <span className="size-1 bg-border rounded-full" />
              <span>{wo.customerName}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xs">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy">
              <Package size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Parts Status</p>
              <p className="text-xs font-bold text-brand-navy">{wo.partsIssuedStatus.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-8">
          <div className="text-right">
            <p className="text-lg font-bold text-brand-navy">₹{wo.totalValue.toLocaleString()}</p>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Total Value</p>
          </div>
          <ChevronRight size={20} className="text-brand-gold group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </AdminCard>
  )
}
