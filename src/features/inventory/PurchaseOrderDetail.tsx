/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { inventoryRepository, PurchaseOrder } from "@/core/network/inventory-repository"
import { 
  Truck, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  Package,
  FileText,
  Download,
  AlertCircle,
  DollarSign,
  XCircle
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = React.useState<PurchaseOrder | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [receivedQtys, setReceivedQtys] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    const fetchPO = async () => {
      if (!id) return;
      try {
        const data = await inventoryRepository.getPurchaseOrderById(id);
        if (data) {
          setPo(data);
          const initialQtys: Record<string, number> = {};
          data.items.forEach(item => {
            initialQtys[item.partId] = item.orderedQty;
          });
          setReceivedQtys(initialQtys);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPO();
  }, [id])

  const handleReceive = async () => {
    if (!po) return;
    try {
      await inventoryRepository.receivePurchaseOrder(po.id, receivedQtys);
      toast.success("Stock received and updated successfully");
      navigate('/inventory/orders');
    } catch (error) {
      toast.error("Failed to update stock");
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!po) return <div className="p-8 text-center">Purchase Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{po.poNumber}</h1>
            <p className="text-sm text-brand-muted">Supplier: {po.supplierName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-3 bg-white border border-border rounded-2xl text-brand-navy hover:border-brand-gold transition-all">
            <Download size={20} />
          </button>
          {po.status !== 'fully_received' && po.status !== 'cancelled' && (
            <AdminButton onClick={handleReceive}>Confirm Receipt</AdminButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Status & Info */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Order Status" icon={<Truck size={18} />} />
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Current Status</span>
                <StatusBadge status={po.status} />
              </div>
              <InfoRow label="Supplier" value={po.supplierName} />
              <InfoRow label="Created On" value={new Date(po.createdAt).toLocaleDateString()} />
              <InfoRow label="Expected Delivery" value={new Date(po.expectedDeliveryDate).toLocaleDateString()} />
              {po.receivedAt && (
                <InfoRow label="Received On" value={new Date(po.receivedAt).toLocaleDateString()} />
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-6 bg-brand-navy text-brand-gold">
            <SectionHeader title="Order Total" icon={<DollarSign size={18} />} />
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-60">Subtotal</span>
                <span className="text-sm font-bold">₹{po.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-60">Tax</span>
                <span className="text-sm font-bold">₹{po.tax.toLocaleString()}</span>
              </div>
              <div className="h-px bg-brand-gold/20" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Grand Total</span>
                <span className="text-2xl font-bold">₹{po.total.toLocaleString()}</span>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Supplier Notes" icon={<FileText size={18} />} />
            <p className="text-xs text-brand-muted mt-2 leading-relaxed italic">
              "{po.notes || 'No notes provided for this order.'}"
            </p>
          </AdminCard>
        </div>

        {/* Right Column: Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <SectionHeader title="Order Line Items" icon={<Package size={18} />} />
            <div className="overflow-x-auto mt-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Part Name</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Ordered</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Received</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Unit Price</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {po.items.map(item => (
                    <tr key={item.partId}>
                      <td className="py-4">
                        <span className="text-sm font-bold text-brand-navy">{item.partName}</span>
                        <p className="text-[10px] text-brand-muted uppercase tracking-widest">ID: {item.partId}</p>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-sm text-brand-navy">{item.orderedQty}</span>
                      </td>
                      <td className="py-4 text-center">
                        {po.status === 'submitted' || po.status === 'confirmed' ? (
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 bg-brand-navy/5 border border-border rounded-lg text-sm text-center focus:ring-2 focus:ring-brand-gold outline-none"
                            value={receivedQtys[item.partId]}
                            onChange={(e) => setReceivedQtys(prev => ({ ...prev, [item.partId]: parseInt(e.target.value) || 0 }))}
                          />
                        ) : (
                          <span className="text-sm font-bold text-brand-navy">{item.receivedQty}</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm text-brand-muted">₹{item.unitPrice.toLocaleString()}</span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-bold text-brand-navy">₹{item.total.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>

          {po.status === 'fully_received' && (
            <AdminCard className="p-8 border-2 border-status-completed/20 bg-status-completed/5">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-status-completed text-white rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-navy">Inventory Updated</h3>
                  <p className="text-sm text-brand-muted">All items have been added to the warehouse stock levels.</p>
                </div>
              </div>
            </AdminCard>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    draft: { icon: <Clock size={12} />, class: "bg-brand-muted/10 text-brand-muted", label: "Draft" },
    submitted: { icon: <Clock size={12} />, class: "bg-status-pending/10 text-status-pending", label: "Submitted" },
    confirmed: { icon: <CheckCircle2 size={12} />, class: "bg-brand-navy/5 text-brand-navy", label: "Confirmed" },
    partially_received: { icon: <AlertCircle size={12} />, class: "bg-brand-gold/10 text-brand-gold", label: "Partially Received" },
    fully_received: { icon: <CheckCircle2 size={12} />, class: "bg-status-completed/10 text-status-completed", label: "Fully Received" },
    cancelled: { icon: <XCircle size={12} />, class: "bg-status-emergency/10 text-status-emergency", label: "Cancelled" }
  };
  const c = config[status];
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1", c.class)}>
      {c.icon} {c.label}
    </span>
  )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-brand-navy">{value}</span>
    </div>
  )
}
