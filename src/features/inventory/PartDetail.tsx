/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { inventoryRepository, Part, StockMovement } from "@/core/network/inventory-repository"
import { 
  Package, 
  ChevronLeft, 
  Edit, 
  History, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertTriangle,
  MapPin,
  Wrench,
  DollarSign,
  Plus,
  Minus
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function PartDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [part, setPart] = React.useState<Part | null>(null)
  const [movements, setMovements] = React.useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAdjusting, setIsAdjusting] = React.useState(false)
  const [adjustmentQty, setAdjustmentQty] = React.useState(0)
  const [adjustmentReason, setAdjustmentReason] = React.useState("")

  React.useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const partData = await inventoryRepository.getPartById(id);
        const movementData = await inventoryRepository.getStockMovements({ partId: id });
        if (partData) setPart(partData);
        setMovements(movementData.filter(m => m.partId === id));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id])

  const handleAdjustment = async () => {
    if (!part || adjustmentQty === 0 || !adjustmentReason) return;
    try {
      await inventoryRepository.adjustStock(part.id, adjustmentQty, adjustmentReason);
      toast.success("Stock adjusted successfully");
      setIsAdjusting(false);
      setAdjustmentQty(0);
      setAdjustmentReason("");
      // Refresh data
      const updatedPart = await inventoryRepository.getPartById(part.id);
      if (updatedPart) setPart(updatedPart);
      const updatedMovements = await inventoryRepository.getStockMovements({ partId: part.id });
      setMovements(updatedMovements.filter(m => m.partId === part.id));
    } catch (error) {
      toast.error("Failed to adjust stock");
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!part) return <div className="p-8 text-center">Part not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{part.name}</h1>
            <p className="text-sm text-brand-muted">{part.partCode} • {part.category}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Edit size={18} />} onClick={() => navigate(`/inventory/catalog/${part.id}/edit`)}>
            Edit Part
          </AdminButton>
          <AdminButton icon={<Plus size={18} />} onClick={() => setIsAdjusting(true)}>Adjust Stock</AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Inventory Status" icon={<Package size={18} />} />
            <div className="flex flex-col items-center py-6">
              <div className={cn(
                "size-24 rounded-3xl flex flex-col items-center justify-center mb-4",
                part.status === 'in_stock' ? "bg-status-completed/10 text-status-completed" : 
                part.status === 'low_stock' ? "bg-status-pending/10 text-status-pending" : "bg-status-emergency/10 text-status-emergency"
              )}>
                <span className="text-3xl font-bold">{part.stockQuantity}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Units</span>
              </div>
              <StatusBadge status={part.status} />
            </div>
            <div className="space-y-4 border-t border-border pt-6">
              <InfoRow icon={<MapPin size={14} />} label="Location" value={part.location} />
              <InfoRow icon={<AlertTriangle size={14} />} label="Min Level" value={part.minReorderLevel.toString()} />
              <InfoRow icon={<RefreshCw size={14} />} label="Reorder Qty" value={part.reorderQuantity.toString()} />
              <InfoRow icon={<DollarSign size={14} />} label="Unit Cost" value={`₹${part.unitCost.toLocaleString()}`} />
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Compatibility" icon={<Wrench size={18} />} />
            <div className="flex flex-wrap gap-2 mt-4">
              {part.compatibleBrands.map((brand, i) => (
                <span key={i} className="px-3 py-1 bg-brand-navy/5 text-brand-navy rounded-full text-xs font-bold">
                  {brand}
                </span>
              ))}
            </div>
            <p className="text-xs text-brand-muted mt-4 leading-relaxed">
              {part.description}
            </p>
          </AdminCard>
        </div>

        {/* Right Column: Movement History */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <SectionHeader title="Stock Movement History" icon={<History size={18} />} />
            <div className="mt-6 space-y-4">
              {movements.map((move, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white border border-border rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center",
                      move.type === 'IN' ? "bg-status-completed/10 text-status-completed" : 
                      move.type === 'OUT' ? "bg-status-emergency/10 text-status-emergency" : "bg-brand-navy/5 text-brand-navy"
                    )}>
                      {move.type === 'IN' ? <ArrowDownRight size={20} /> : move.type === 'OUT' ? <ArrowUpRight size={20} /> : <RefreshCw size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        {move.type === 'IN' ? 'Stock Received' : move.type === 'OUT' ? 'Stock Issued' : 'Manual Adjustment'}
                      </p>
                      <p className="text-[10px] text-brand-muted uppercase tracking-widest">
                        Ref: {move.referenceId} • {new Date(move.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      move.type === 'IN' ? "text-status-completed" : move.type === 'OUT' ? "text-status-emergency" : "text-brand-navy"
                    )}>
                      {move.type === 'IN' ? '+' : '-'}{move.quantity}
                    </p>
                    <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Bal: {move.balanceAfter}</p>
                  </div>
                </div>
              ))}
              {movements.length === 0 && (
                <p className="text-center py-10 text-brand-muted italic">No movement history found.</p>
              )}
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Adjustment Modal */}
      {isAdjusting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/60 px-4 py-6 backdrop-blur-sm"
          onClick={() => setIsAdjusting(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(event) => event.stopPropagation()}
            className="w-[min(100%,30rem)] min-w-[18rem] overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-adjustment-title"
          >
            <h2 id="stock-adjustment-title" className="mb-2 text-xl font-bold text-brand-navy sm:text-2xl">
              Manual Stock Adjustment
            </h2>
            <p className="mb-6 text-sm leading-6 text-brand-muted">
              Adjust the current stock level of {part.name}.
            </p>
            
            <div className="space-y-5">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-[28px] bg-brand-navy/[0.03] px-4 py-5">
                <button 
                  onClick={() => setAdjustmentQty(prev => prev - 1)}
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-navy/5 text-brand-navy transition-colors hover:bg-brand-navy/10"
                >
                  <Minus size={20} />
                </button>
                <div className="min-w-0 text-center">
                  <span className={cn("text-4xl font-bold sm:text-5xl", adjustmentQty > 0 ? "text-status-completed" : adjustmentQty < 0 ? "text-status-emergency" : "text-brand-navy")}>
                    {adjustmentQty > 0 ? '+' : ''}{adjustmentQty}
                  </span>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-muted">Adjustment</p>
                </div>
                <button 
                  onClick={() => setAdjustmentQty(prev => prev + 1)}
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-navy/5 text-brand-navy transition-colors hover:bg-brand-navy/10"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div>
                <label className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-[0.28em] text-brand-muted">
                  Reason for Adjustment
                </label>
                <select 
                  className="w-full appearance-none rounded-2xl border-none bg-brand-navy/5 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                >
                  <option value="">Select Reason...</option>
                  <option value="Damaged Stock">Damaged Stock</option>
                  <option value="Stock Audit Correction">Stock Audit Correction</option>
                  <option value="Returned to Supplier">Returned to Supplier</option>
                  <option value="Found in Warehouse">Found in Warehouse</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <AdminButton variant="outline" className="flex-1" onClick={() => setIsAdjusting(false)}>Cancel</AdminButton>
                <AdminButton className="flex-1" onClick={handleAdjustment} disabled={adjustmentQty === 0 || !adjustmentReason}>Confirm</AdminButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: any = {
    in_stock: { color: 'bg-status-completed/10 text-status-completed', text: 'In Stock' },
    low_stock: { color: 'bg-status-pending/10 text-status-pending', text: 'Low Stock' },
    out_of_stock: { color: 'bg-status-emergency/10 text-status-emergency', text: 'Out of Stock' },
  };
  const config = statusMap[status];
  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest", config.color)}>
      {config.text}
    </span>
  )
}

function InfoRow({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2 text-brand-muted">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-bold text-brand-navy">{value}</span>
    </div>
  )
}

function RefreshCw({ size, className }: { size: number, className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
}
