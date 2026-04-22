/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { estimateRepository, WorkOrder } from "@/core/network/estimate-repository"
import { 
  ClipboardList, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  User, 
  Package,
  FileText,
  ArrowRight,
  Download,
  AlertCircle
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWo] = React.useState<WorkOrder | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchWO = async () => {
      if (!id) return;
      try {
        const data = await estimateRepository.getWorkOrderById(id);
        if (data) setWo(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWO();
  }, [id])

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!wo) return <div className="p-8 text-center">Work Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{wo.woNumber}</h1>
            <p className="text-sm text-brand-muted">Linked to Estimate: {wo.estimateNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-3 bg-white border border-border rounded-2xl text-brand-navy hover:border-brand-gold transition-all">
            <Download size={20} />
          </button>
          <AdminButton variant="outline">Print Work Order</AdminButton>
          {wo.status !== 'completed' && (
            <AdminButton>Mark as Completed</AdminButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Status & Info */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Work Order Status" icon={<ClipboardList size={18} />} />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Current Status</span>
                <StatusBadge status={wo.status} />
              </div>
              <InfoRow label="Customer" value={wo.customerName} />
              <InfoRow label="Technician" value={wo.technicianName} />
              <InfoRow label="Created On" value={new Date(wo.createdAt).toLocaleDateString()} />
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Parts Status</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  wo.partsIssuedStatus === 'fully_issued' ? "bg-status-completed/10 text-status-completed" : "bg-status-pending/10 text-status-pending"
                )}>
                  {wo.partsIssuedStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6 bg-brand-navy text-brand-gold">
            <SectionHeader title="Financial Authorization" icon={<FileText size={18} />} />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-60">Approved Value</span>
                <span className="text-xl font-bold">₹{wo.totalValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-60">Estimate Ref</span>
                <button onClick={() => navigate(`/estimates/${wo.estimateId}`)} className="text-xs font-bold hover:underline">
                  {wo.estimateNumber} <ArrowRight size={10} className="inline" />
                </button>
              </div>
              <AdminButton className="w-full bg-brand-gold text-brand-navy hover:bg-brand-gold/90" size="sm">
                View Estimate Details
              </AdminButton>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Inventory Link" icon={<Package size={18} />} />
            <p className="text-xs text-brand-muted mb-4">Parts required for this work order are tracked in the inventory module.</p>
            <AdminButton variant="outline" className="w-full" size="sm">
              Check Parts Availability
            </AdminButton>
          </AdminCard>
        </div>

        {/* Right Column: Approved Scope */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <SectionHeader title="Approved Scope of Work" icon={<CheckCircle2 size={18} />} />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Description</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Qty</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Unit Price</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wo.lineItems.map(item => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <span className="text-sm font-bold text-brand-navy">{item.description}</span>
                        <p className="text-[10px] text-brand-muted uppercase tracking-widest">{item.type}</p>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-sm text-brand-navy">{item.quantity}</span>
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

          <AdminCard className="p-8">
            <SectionHeader title="Execution Timeline" icon={<Clock size={18} />} />
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
              {(wo.approvalTimeline || []).map((entry) => (
                <TimelineItem
                  key={entry.id}
                  title={entry.action.replace('_', ' ')}
                  time={new Date(entry.timestamp).toLocaleString()}
                  desc={entry.note || `Handled by ${entry.actorName}.`}
                  active
                />
              ))}
              <TimelineItem 
                title="Job Execution" 
                time="In Progress" 
                desc="Technician is currently performing the approved work."
                active
                pending
              />
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    open: { icon: <Clock size={12} />, class: "bg-status-pending/10 text-status-pending", label: "Open" },
    'in-progress': { icon: <Clock size={12} />, class: "bg-brand-navy/5 text-brand-navy", label: "In Progress" },
    completed: { icon: <CheckCircle2 size={12} />, class: "bg-status-completed/10 text-status-completed", label: "Completed" },
    cancelled: { icon: <AlertCircle size={12} />, class: "bg-status-emergency/10 text-status-emergency", label: "Cancelled" }
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

function TimelineItem({ title, time, desc, active, pending }: any) {
  return (
    <div className="relative pl-10">
      <div className={cn(
        "absolute left-0 size-8 rounded-full border-4 border-white flex items-center justify-center z-10",
        active ? (pending ? "bg-brand-navy" : "bg-status-completed") : "bg-border"
      )}>
        {pending ? <Clock size={12} className="text-white" /> : <CheckCircle2 size={12} className="text-white" />}
      </div>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h4 className="text-sm font-bold text-brand-navy">{title}</h4>
          <span className="text-[10px] text-brand-muted">{time}</span>
        </div>
        <p className="text-xs text-brand-muted">{desc}</p>
      </div>
    </div>
  )
}
