/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { inventoryRepository, StockMovement } from "@/core/network/inventory-repository"
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Calendar
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"

export default function StockMovementLedger() {
  const [movements, setMovements] = React.useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'IN' | 'OUT' | 'ADJ'>('all')

  React.useEffect(() => {
    const fetchMovements = async () => {
      try {
        const data = await inventoryRepository.getStockMovements({});
        setMovements(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMovements();
  }, [])

  const filteredMovements = movements.filter(m => filter === 'all' || m.type === filter);

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Stock Movement Ledger</h1>
          <p className="text-sm text-brand-muted">Complete chronological log of all inventory transactions</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Download size={18} />}>Export Ledger</AdminButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by Part Name, Ref ID or Actor..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All Movements" />
          <FilterButton active={filter === 'IN'} onClick={() => setFilter('IN')} label="Stock In" />
          <FilterButton active={filter === 'OUT'} onClick={() => setFilter('OUT')} label="Stock Out" />
          <FilterButton active={filter === 'ADJ'} onClick={() => setFilter('ADJ')} label="Adjustments" />
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border bg-brand-navy/[0.02]">
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Date & Time</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Part Info</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Type</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Qty</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Balance</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Reference</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMovements.map((move, idx) => (
                <motion.tr
                  key={move.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="group hover:bg-brand-navy/[0.01] transition-colors"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-brand-muted" />
                      <div>
                        <p className="text-sm font-bold text-brand-navy">{new Date(move.timestamp).toLocaleDateString()}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-widest">{new Date(move.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-sm font-bold text-brand-navy">{move.partName}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">ID: {move.partId}</p>
                  </td>
                  <td className="p-6">
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 w-fit",
                      move.type === 'IN' ? "bg-status-completed/10 text-status-completed" : 
                      move.type === 'OUT' ? "bg-status-emergency/10 text-status-emergency" : "bg-brand-navy/5 text-brand-navy"
                    )}>
                      {move.type === 'IN' ? <ArrowDownRight size={12} /> : move.type === 'OUT' ? <ArrowUpRight size={12} /> : <RefreshCw size={12} />}
                      {move.type}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className={cn(
                      "text-sm font-bold",
                      move.type === 'IN' ? "text-status-completed" : move.type === 'OUT' ? "text-status-emergency" : "text-brand-navy"
                    )}>
                      {move.type === 'IN' ? '+' : '-'}{move.quantity}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="text-sm font-bold text-brand-navy">{move.balanceAfter}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-navy bg-brand-navy/5 px-2 py-1 rounded-lg">
                        {move.referenceId}
                      </span>
                      <span className="text-[10px] text-brand-muted uppercase tracking-widest">{move.referenceType}</span>
                    </div>
                  </td>
                  <td className="p-6 text-sm text-brand-navy">{move.actor}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
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

function RefreshCw({ size, className }: { size: number, className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
}
