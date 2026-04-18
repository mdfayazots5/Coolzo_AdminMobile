/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { inventoryRepository, Part, StockStatus } from "@/core/network/inventory-repository"
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Package, 
  Download,
  AlertTriangle,
  MoreVertical,
  Eye,
  Edit
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate, useSearchParams } from "react-router-dom"

export default function PartsCatalogList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as StockStatus | 'all' || 'all';

  const [parts, setParts] = React.useState<Part[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<StockStatus | 'all'>(initialStatus)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchParts = async () => {
      try {
        const data = await inventoryRepository.getParts({});
        setParts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchParts();
  }, [])

  const filteredParts = parts.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.partCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Parts Catalog</h1>
          <p className="text-sm text-brand-muted">Manage all spare parts and inventory items</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Download size={18} />}>Export CSV</AdminButton>
          <AdminButton icon={<Plus size={18} />} onClick={() => navigate('/inventory/add')}>Add New Part</AdminButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by part name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All Items" />
          <FilterButton active={filter === 'in_stock'} onClick={() => setFilter('in_stock')} label="In Stock" />
          <FilterButton active={filter === 'low_stock'} onClick={() => setFilter('low_stock')} label="Low Stock" />
          <FilterButton active={filter === 'out_of_stock'} onClick={() => setFilter('out_of_stock')} label="Out of Stock" />
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border bg-brand-navy/[0.02]">
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Part Info</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Category</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Stock Qty</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Unit Cost</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredParts.map((part, idx) => (
                <motion.tr
                  key={part.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group hover:bg-brand-navy/[0.01] transition-colors"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-brand-navy/5 rounded-xl flex items-center justify-center text-brand-navy shrink-0">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-navy">{part.name}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-widest">{part.partCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-bold text-brand-navy bg-brand-navy/5 px-2 py-1 rounded-lg">
                      {part.category}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-brand-navy">{part.stockQuantity}</span>
                      <span className="text-[10px] text-brand-muted uppercase tracking-widest">/ {part.minReorderLevel} min</span>
                    </div>
                  </td>
                  <td className="p-6 text-sm font-bold text-brand-navy">₹{part.unitCost.toLocaleString()}</td>
                  <td className="p-6">
                    <StatusBadge status={part.status} />
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/inventory/catalog/${part.id}`)} className="p-2 text-brand-muted hover:text-brand-gold transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-brand-muted hover:text-brand-navy transition-colors">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-brand-muted hover:bg-brand-navy/5 rounded-lg">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
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

function StatusBadge({ status }: { status: StockStatus }) {
  const statusMap: Record<StockStatus, { color: string, text: string, icon: any }> = {
    in_stock: { color: 'bg-status-completed/10 text-status-completed', text: 'In Stock', icon: <Package size={10} /> },
    low_stock: { color: 'bg-status-pending/10 text-status-pending', text: 'Low Stock', icon: <AlertTriangle size={10} /> },
    out_of_stock: { color: 'bg-status-emergency/10 text-status-emergency', text: 'Out of Stock', icon: <AlertTriangle size={10} /> },
  };

  const config = statusMap[status];

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit",
      config.color
    )}>
      {config.icon} {config.text}
    </span>
  )
}
