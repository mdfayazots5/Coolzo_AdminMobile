/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { estimateRepository, Estimate, LineItem } from "@/core/network/estimate-repository"
import { 
  FileText, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  ArrowRight,
  Download,
  Share2,
  MessageSquare,
  AlertCircle,
  ShieldCheck
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function EstimateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = React.useState<Estimate | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchEstimate = async () => {
      if (!id) return;
      try {
        const data = await estimateRepository.getEstimateById(id);
        if (data) setEstimate(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEstimate();
  }, [id])

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!estimate) return;
    try {
      await estimateRepository.updateEstimateStatus(estimate.id, status);
      toast.success(`Estimate ${status === 'approved' ? 'Approved' : 'Rejected'}`);
      const updated = await estimateRepository.getEstimateById(estimate.id);
      setEstimate(updated);
    } catch (error) {
      toast.error("Failed to update status");
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!estimate) return <div className="p-8 text-center">Estimate not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{estimate.estimateNumber}</h1>
            <p className="text-sm text-brand-muted">Linked to SR: {estimate.srNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-3 bg-white border border-border rounded-2xl text-brand-navy hover:border-brand-gold transition-all">
            <Download size={20} />
          </button>
          <button className="p-3 bg-white border border-border rounded-2xl text-brand-navy hover:border-brand-gold transition-all">
            <Share2 size={20} />
          </button>
          {estimate.status === 'pending' && (
            <AdminButton variant="outline" onClick={() => handleStatusUpdate('rejected')}>Reject</AdminButton>
          )}
          {estimate.status === 'pending' && (
            <AdminButton onClick={() => handleStatusUpdate('approved')}>Approve & Create WO</AdminButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Estimate Context" icon={<FileText size={18} />} />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Status</span>
                <StatusBadge status={estimate.status} />
              </div>
              <InfoRow label="Customer" value={estimate.customerName} />
              <InfoRow label="Technician" value={estimate.technicianName} />
              <InfoRow label="Created On" value={new Date(estimate.createdAt).toLocaleDateString()} />
              <InfoRow label="Channel" value={estimate.channel} />
              {estimate.respondedAt && (
                <InfoRow label="Responded On" value={new Date(estimate.respondedAt).toLocaleDateString()} />
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-6 bg-brand-navy text-brand-gold">
            <SectionHeader title="Financial Summary" icon={<ShieldCheck size={18} />} />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-60">Subtotal</span>
                <span className="text-sm font-bold">₹{estimate.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-60">Tax (GST 18%)</span>
                <span className="text-sm font-bold">₹{estimate.tax.toLocaleString()}</span>
              </div>
              <div className="h-px bg-brand-gold/20" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Total Amount</span>
                <span className="text-2xl font-bold">₹{estimate.total.toLocaleString()}</span>
              </div>
            </div>
          </AdminCard>

          {estimate.workOrderId && (
            <AdminCard className="p-6 border-2 border-status-completed/20 bg-status-completed/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-brand-navy">Work Order Generated</h3>
                <CheckCircle2 size={18} className="text-status-completed" />
              </div>
              <AdminButton 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate(`/work-orders/${estimate.workOrderId}`)}
              >
                View Work Order <ArrowRight size={14} className="ml-2" />
              </AdminButton>
            </AdminCard>
          )}
        </div>

        {/* Right Column: Line Items */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <SectionHeader title="Scope of Work & Parts" icon={<FileText size={18} />} />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Description</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Type</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Qty</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Unit Price</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {estimate.lineItems.map(item => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <span className="text-sm font-bold text-brand-navy">{item.description}</span>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase",
                          item.type === 'part' ? "bg-brand-gold/10 text-brand-gold" : "bg-brand-navy/5 text-brand-navy"
                        )}>
                          {item.type}
                        </span>
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
            <SectionHeader title="Approval Timeline" icon={<Clock size={18} />} />
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
              <TimelineItem 
                title="Estimate Created" 
                time={new Date(estimate.createdAt).toLocaleString()} 
                desc={`Created by ${estimate.technicianName} in the field.`}
                active
              />
              <TimelineItem 
                title="Sent to Customer" 
                time={new Date(estimate.createdAt).toLocaleString()} 
                desc={`Sent via ${estimate.channel} for approval.`}
                active
              />
              {estimate.respondedAt && (
                <TimelineItem 
                  title={estimate.status === 'approved' ? "Customer Approved" : "Customer Rejected"} 
                  time={new Date(estimate.respondedAt).toLocaleString()} 
                  desc={estimate.status === 'approved' ? "Customer accepted the scope and pricing." : "Customer declined the additional work."}
                  active
                  status={estimate.status}
                />
              )}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    pending: { icon: <Clock size={12} />, class: "bg-status-pending/10 text-status-pending", label: "Pending" },
    approved: { icon: <CheckCircle2 size={12} />, class: "bg-status-completed/10 text-status-completed", label: "Approved" },
    rejected: { icon: <XCircle size={12} />, class: "bg-status-emergency/10 text-status-emergency", label: "Rejected" },
    expired: { icon: <AlertCircle size={12} />, class: "bg-brand-muted/10 text-brand-muted", label: "Expired" }
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

function TimelineItem({ title, time, desc, active, status }: any) {
  return (
    <div className="relative pl-10">
      <div className={cn(
        "absolute left-0 size-8 rounded-full border-4 border-white flex items-center justify-center z-10",
        active ? (status === 'rejected' ? "bg-status-emergency" : "bg-status-completed") : "bg-border"
      )}>
        {status === 'rejected' ? <XCircle size={12} className="text-white" /> : <CheckCircle2 size={12} className="text-white" />}
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
