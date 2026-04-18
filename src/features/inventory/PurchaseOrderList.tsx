/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { inventoryRepository, PurchaseOrder, POStatus } from "@/core/network/inventory-repository"
import { 
  Truck, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Calendar,
  DollarSign
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const [pos, setPos] = React.useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<POStatus | 'all'>('all')

  React.useEffect(() => {
    const fetchPOs = async () => {
      try {
        const data = await inventoryRepository.getPurchaseOrders({});
        setPos(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPOs();
  }, [])

  const filteredPOs = pos.filter(p => filter === 'all' || p.status === filter);

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Purchase Orders</h1>
          <p className="text-sm text-brand-muted">Manage supplier orders and incoming inventory</p>
        </div>
        <div className="flex gap-2">
          <AdminButton icon={<Plus size={18} />} onClick={() => navigate('/inventory/orders/new')}>Create New PO</AdminButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by PO # or Supplier..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All POs" />
          <FilterButton active={filter === 'submitted'} onClick={() => setFilter('submitted')} label="Submitted" />
          <FilterButton active={filter === 'confirmed'} onClick={() => setFilter('confirmed')} label="Confirmed" />
          <FilterButton active={filter === 'fully_received'} onClick={() => setFilter('fully_received')} label="Received" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPOs.map((po, idx) => (
          <motion.div
            key={po.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <POCard po={po} onClick={() => navigate(`/inventory/orders/${po.id}`)} />
          </motion.div>
        ))}
        {filteredPOs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-border">
            <Truck size={48} className="mx-auto text-brand-muted mb-4 opacity-20" />
            <p className="text-brand-muted">No purchase orders found.</p>
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

function POCard({ po, onClick }: { po: PurchaseOrder, onClick: () => void }) {
  const statusConfig: Record<POStatus, { icon: any, class: string, label: string }> = {
    draft: { icon: <Clock size={14} />, class: "bg-brand-muted/10 text-brand-muted", label: "Draft" },
    submitted: { icon: <Clock size={14} />, class: "bg-status-pending/10 text-status-pending", label: "Submitted" },
    confirmed: { icon: <CheckCircle2 size={14} />, class: "bg-brand-navy/5 text-brand-navy", label: "Confirmed" },
    partially_received: { icon: <AlertCircle size={14} />, class: "bg-brand-gold/10 text-brand-gold", label: "Partially Received" },
    fully_received: { icon: <CheckCircle2 size={14} />, class: "bg-status-completed/10 text-status-completed", label: "Fully Received" },
    cancelled: { icon: <XCircle size={14} />, class: "bg-status-emergency/10 text-status-emergency", label: "Cancelled" }
  };

  const config = statusConfig[po.status];

  return (
    <AdminCard 
      onClick={onClick}
      className="p-6 hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", config.class)}>
            <Truck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-brand-navy">{po.poNumber}</h3>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1", config.class)}>
                {config.icon} {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="font-bold text-brand-navy">{po.supplierName}</span>
              <span className="size-1 bg-border rounded-full" />
              <span>{po.items.length} items</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xs">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy">
              <Calendar size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Expected Delivery</p>
              <p className="text-xs font-bold text-brand-navy">{new Date(po.expectedDeliveryDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-8">
          <div className="text-right">
            <p className="text-lg font-bold text-brand-navy">₹{po.total.toLocaleString()}</p>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Total Value</p>
          </div>
          <ChevronRight size={20} className="text-brand-gold group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </AdminCard>
  )
}
