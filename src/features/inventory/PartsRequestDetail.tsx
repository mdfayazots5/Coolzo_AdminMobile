/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { inventoryRepository, PartsRequest, Part } from "@/core/network/inventory-repository"
import { 
  Package, 
  ChevronLeft, 
  User, 
  CheckCircle2, 
  FileText,
  Truck,
  AlertTriangle
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function PartsRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = React.useState<PartsRequest | null>(null)
  const [partsInfo, setPartsInfo] = React.useState<Record<string, Part>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [issuedQtys, setIssuedQtys] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const reqData = await inventoryRepository.getPartsRequestById(id);
        if (reqData) {
          setRequest(reqData);
          const initialQtys: Record<string, number> = {};
          const partsMap: Record<string, Part> = {};
          
          for (const item of reqData.items) {
            initialQtys[item.partId] = item.requestedQty;
            const p = await inventoryRepository.getPartById(item.partId);
            if (p) partsMap[item.partId] = p;
          }
          setIssuedQtys(initialQtys);
          setPartsInfo(partsMap);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id])

  const handleProcess = async (status: 'approved' | 'rejected' | 'partially_approved') => {
    if (!request) return;
    try {
      const items = request.items.map(item => ({
        ...item,
        issuedQty: status === 'rejected' ? 0 : issuedQtys[item.partId],
        status: partsInfo[item.partId]?.stockQuantity >= issuedQtys[item.partId] ? 'available' : 'insufficient'
      }));
      
      await inventoryRepository.processPartsRequest(request.id, status, items);
      toast.success(
        status === 'approved'
          ? "Request approved"
          : status === 'partially_approved'
            ? "Request partially approved"
            : "Request rejected"
      );
      navigate('/inventory/requests');
    } catch (error) {
      toast.error("Failed to process request");
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!request) return <div className="p-8 text-center">Request not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Parts Request: {request.srNumber}</h1>
            <p className="text-sm text-brand-muted">Submitted by {request.technicianName} • {new Date(request.submittedAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {request.status === 'pending' && (
            <>
              <AdminButton variant="outline" onClick={() => handleProcess('rejected')}>Reject Request</AdminButton>
              <AdminButton variant="outline" onClick={() => handleProcess('partially_approved')}>Partial Approval</AdminButton>
              <AdminButton onClick={() => handleProcess('approved')}>Approve & Issue Parts</AdminButton>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Request Context" icon={<User size={18} />} />
            <div className="space-y-4 mt-4">
              <InfoRow label="Technician" value={request.technicianName} />
              <InfoRow label="SR Number" value={request.srNumber} />
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Urgency</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  request.urgency === 'emergency' ? "bg-status-emergency text-white" : "bg-brand-navy/5 text-brand-navy"
                )}>
                  {request.urgency}
                </span>
              </div>
              <InfoRow label="Submitted" value={new Date(request.submittedAt).toLocaleTimeString()} />
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Technician Notes" icon={<FileText size={18} />} />
            <div className="p-4 bg-brand-navy/5 rounded-2xl mt-4">
              <p className="text-sm text-brand-navy italic">"{request.notes || 'No additional notes provided.'}"</p>
            </div>
          </AdminCard>

          <AdminCard className="p-6 border-2 border-brand-gold/20 bg-brand-gold/5">
            <SectionHeader title="Dispatch Instructions" icon={<Truck size={18} />} />
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              Once approved, the technician will be notified to collect the parts from the main warehouse. Stock levels will be deducted immediately.
            </p>
          </AdminCard>
        </div>

        {/* Right Column: Parts Table */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <SectionHeader title="Requested Parts & Availability" icon={<Package size={18} />} />
            <div className="overflow-x-auto mt-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Part Name</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Req Qty</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">In Stock</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Issue Qty</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {request.items.map(item => {
                    const part = partsInfo[item.partId];
                    const isAvailable = part && part.stockQuantity >= issuedQtys[item.partId];
                    
                    return (
                      <tr key={item.partId}>
                        <td className="py-4">
                          <span className="text-sm font-bold text-brand-navy">{item.partName}</span>
                          <p className="text-[10px] text-brand-muted uppercase tracking-widest">{part?.partCode || '...'}</p>
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-sm text-brand-navy">{item.requestedQty}</span>
                        </td>
                        <td className="py-4 text-center">
                          <span className={cn("text-sm font-bold", (part?.stockQuantity || 0) < item.requestedQty ? "text-status-emergency" : "text-brand-navy")}>
                            {part?.stockQuantity ?? '...'}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          {request.status === 'pending' ? (
                            <input 
                              type="number" 
                              className="w-16 px-2 py-1 bg-brand-navy/5 border border-border rounded-lg text-sm text-center focus:ring-2 focus:ring-brand-gold outline-none"
                              value={issuedQtys[item.partId]}
                              onChange={(e) => setIssuedQtys(prev => ({ ...prev, [item.partId]: parseInt(e.target.value) || 0 }))}
                            />
                          ) : (
                            <span className="text-sm font-bold text-brand-navy">{item.issuedQty}</span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          {isAvailable ? (
                            <div className="flex items-center justify-end gap-1 text-status-completed">
                              <CheckCircle2 size={14} />
                              <span className="text-[10px] font-bold uppercase">Available</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1 text-status-emergency">
                              <AlertTriangle size={14} />
                              <span className="text-[10px] font-bold uppercase">Insufficient</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
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
