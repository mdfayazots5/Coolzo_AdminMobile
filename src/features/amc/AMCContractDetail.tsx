/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { amcRepository, AMCContract, AMCVisit } from "@/core/network/amc-repository"
import { equipmentRepository, Equipment } from "@/core/network/equipment-repository"
import { 
  FileText, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  ChevronLeft,
  Wrench,
  CreditCard,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Download,
  Share2,
  MoreVertical,
  Plus
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function AMCContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = React.useState<AMCContract | null>(null)
  const [equipment, setEquipment] = React.useState<Equipment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const c = await amcRepository.getContractById(id);
        if (c) {
          setContract(c);
          const eq = await Promise.all(c.equipmentIds.map(eid => equipmentRepository.getEquipmentById(eid)));
          setEquipment(eq.filter((e): e is Equipment => e !== null));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id])

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!contract) return <div className="p-8 text-center">Contract not found</div>;

  const progress = (contract.completedVisits / contract.totalVisits) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{contract.contractNumber}</h1>
            <p className="text-sm text-brand-muted">Contract Details & Visit Schedule</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-3 bg-white border border-border rounded-2xl text-brand-navy hover:border-brand-gold transition-all">
            <Download size={20} />
          </button>
          <button className="p-3 bg-white border border-border rounded-2xl text-brand-navy hover:border-brand-gold transition-all">
            <Share2 size={20} />
          </button>
          <AdminButton variant="outline">Edit Contract</AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Equipment */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Contract Identity" icon={<FileText size={18} />} />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Status</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  contract.status === 'active' ? "bg-status-completed/10 text-status-completed" : "bg-status-pending/10 text-status-pending"
                )}>
                  {contract.status.replace('_', ' ')}
                </span>
              </div>
              <InfoRow label="Plan Type" value={contract.planType.toUpperCase()} />
              <InfoRow label="Customer" value={contract.customerName} />
              <InfoRow label="Start Date" value={contract.startDate} />
              <InfoRow label="End Date" value={contract.endDate} />
              <InfoRow label="Enrolled By" value={contract.enrolledBy} />
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Covered Equipment" icon={<Wrench size={18} />} />
            <div className="space-y-3">
              {equipment.map(eq => (
                <div key={eq.id} className="p-3 bg-brand-navy/5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-brand-navy/10 transition-all" onClick={() => navigate(`/equipment/${eq.id}`)}>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{eq.locationLabel}</p>
                    <p className="text-[10px] text-brand-muted">{eq.brand} - {eq.model}</p>
                  </div>
                  <ChevronRight size={16} className="text-brand-muted group-hover:text-brand-gold" />
                </div>
              ))}
              <button className="w-full py-3 border-2 border-dashed border-border rounded-2xl text-[10px] font-bold text-brand-muted uppercase tracking-widest hover:border-brand-gold hover:text-brand-gold transition-all flex items-center justify-center gap-2">
                <Plus size={14} /> Add Equipment
              </button>
            </div>
          </AdminCard>

          <AdminCard className="p-6 bg-brand-navy text-brand-gold">
            <SectionHeader title="Payment Summary" icon={<CreditCard size={18} />} />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-60">Total Fee</span>
                <span className="text-xl font-bold">₹{contract.fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-60">Status</span>
                <span className="px-2 py-0.5 bg-brand-gold/20 text-brand-gold text-[10px] font-bold rounded-full uppercase">
                  {contract.paymentStatus}
                </span>
              </div>
              <AdminButton className="w-full bg-brand-gold text-brand-navy hover:bg-brand-gold/90" size="sm">
                View Receipt
              </AdminButton>
            </div>
          </AdminCard>
        </div>

        {/* Right Column: Visit Tracker & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-lg font-bold text-brand-navy mb-1">Visit Progress</h3>
                <p className="text-sm text-brand-muted">Tracking maintenance visits for this contract</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-navy">{contract.totalVisits}</p>
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Total</p>
                </div>
                <div className="size-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-status-completed">{contract.completedVisits}</p>
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Done</p>
                </div>
                <div className="size-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-gold">{contract.totalVisits - contract.completedVisits}</p>
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Left</p>
                </div>
              </div>
            </div>

            <div className="h-4 w-full bg-brand-navy/5 rounded-full overflow-hidden mb-8">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-brand-gold"
              />
            </div>

            <SectionHeader title="Visit Schedule" icon={<Calendar size={18} />} />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Visit #</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Date & Slot</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Technician</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Status</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contract.visits.map(visit => (
                    <tr key={visit.id} className="group">
                      <td className="py-4">
                        <span className="text-sm font-bold text-brand-navy">Visit {visit.visitNumber}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-brand-navy">{visit.scheduledDate}</span>
                          <span className="text-[10px] text-brand-muted">{visit.scheduledSlot}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        {visit.assignedTechnicianName ? (
                          <div className="flex items-center gap-2">
                            <div className="size-6 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy">
                              <User size={12} />
                            </div>
                            <span className="text-xs font-bold text-brand-navy">{visit.assignedTechnicianName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-muted italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          visit.status === 'completed' ? "bg-status-completed/10 text-status-completed" :
                          visit.status === 'scheduled' ? "bg-brand-navy/5 text-brand-navy" : "bg-status-emergency/10 text-status-emergency"
                        )}>
                          {visit.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {visit.status === 'scheduled' ? (
                            <AdminButton size="sm" variant="outline">Assign</AdminButton>
                          ) : visit.status === 'completed' ? (
                            <button className="p-2 text-brand-gold hover:bg-brand-gold/10 rounded-lg transition-all">
                              <FileText size={16} />
                            </button>
                          ) : null}
                          <button className="p-2 text-brand-muted hover:bg-brand-navy/5 rounded-lg">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>

          {contract.status === 'expiring_soon' && (
            <AdminCard className="p-8 bg-status-pending/5 border-2 border-status-pending/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 bg-status-pending text-white rounded-2xl flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-navy">Contract Expiring Soon</h3>
                  <p className="text-sm text-brand-muted">This contract expires in 12 days. Start the renewal process now.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <AdminButton className="flex-1">Renew Contract</AdminButton>
                <AdminButton variant="outline" className="flex-1">Send Renewal Quote</AdminButton>
              </div>
            </AdminCard>
          )}
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
