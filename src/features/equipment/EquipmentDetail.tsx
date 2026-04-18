/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { equipmentRepository, Equipment } from "@/core/network/equipment-repository"
import { 
  Wrench, 
  MapPin, 
  User, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert,
  ChevronLeft,
  History,
  Info,
  ArrowRight,
  Edit2,
  Plus
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eq, setEq] = React.useState<Equipment | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchEq = async () => {
      if (!id) return;
      try {
        const data = await equipmentRepository.getEquipmentById(id);
        if (data) setEq(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEq();
  }, [id])

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!eq) return <div className="p-8 text-center">Equipment not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{eq.equipmentId}</h1>
            <p className="text-sm text-brand-muted">{eq.brand} {eq.model} • {eq.locationLabel}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Edit2 size={18} />}>Edit Details</AdminButton>
          <AdminButton icon={<Plus size={18} />}>Book Service</AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Identity */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Unit Identity" icon={<Info size={18} />} />
            <div className="space-y-4">
              <InfoRow label="Brand" value={eq.brand} />
              <InfoRow label="Model" value={eq.model} />
              <InfoRow label="Type" value={eq.type.toUpperCase()} />
              <InfoRow label="Capacity" value={eq.capacity} />
              <InfoRow label="Serial #" value={eq.serialNumber} />
              <InfoRow label="Installed" value={eq.installationYear.toString()} />
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Ownership" icon={<User size={18} />} />
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 bg-brand-navy/5 text-brand-navy rounded-2xl flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-navy">{eq.customerName}</p>
                <p className="text-xs text-brand-muted">Customer ID: {eq.customerId}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-brand-navy/80 p-3 bg-brand-navy/5 rounded-xl">
              <MapPin size={14} className="shrink-0 mt-0.5 text-brand-gold" />
              <span>{eq.locationLabel}</span>
            </div>
            <AdminButton variant="outline" className="w-full mt-4" size="sm" onClick={() => navigate(`/customers/${eq.customerId}`)}>
              View Customer 360
            </AdminButton>
          </AdminCard>

          <AdminCard className={cn(
            "p-6 border-2",
            eq.isUnderAMC ? "border-status-completed/20 bg-status-completed/5" : "border-brand-muted/20 bg-brand-navy/5"
          )}>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="AMC & Warranty" icon={<ShieldCheck size={18} />} />
              {eq.isUnderAMC ? (
                <span className="px-2 py-0.5 bg-status-completed text-white text-[8px] font-bold rounded-full uppercase">Active</span>
              ) : (
                <span className="px-2 py-0.5 bg-brand-muted text-white text-[8px] font-bold rounded-full uppercase">Inactive</span>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-muted font-bold uppercase tracking-widest">AMC Contract</span>
                {eq.isUnderAMC ? (
                  <button onClick={() => navigate(`/amc/contract/${eq.amcContractId}`)} className="text-brand-gold font-bold hover:underline">
                    {eq.amcContractId} <ArrowRight size={10} className="inline" />
                  </button>
                ) : (
                  <span className="text-brand-navy font-bold">None</span>
                )}
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-muted font-bold uppercase tracking-widest">Warranty Expiry</span>
                <span className="text-brand-navy font-bold">{eq.warrantyExpiry || 'Expired'}</span>
              </div>
            </div>
            {!eq.isUnderAMC && (
              <AdminButton className="w-full mt-4" size="sm" onClick={() => navigate('/amc/enroll')}>
                Enroll in AMC
              </AdminButton>
            )}
          </AdminCard>
        </div>

        {/* Service History */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <SectionHeader title="Service History Timeline" icon={<History size={18} />} />
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-brand-navy/20 before:via-brand-navy/10 before:to-transparent">
              {eq.serviceHistory.map((history, idx) => (
                <div key={idx} className="relative flex items-start gap-8 group">
                  <div className="absolute left-0 size-10 bg-white border-2 border-brand-gold rounded-full flex items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-sm">
                    <Wrench size={16} className="text-brand-navy" />
                  </div>
                  <div className="ml-12 flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest block mb-1">{history.date}</span>
                        <h4 className="text-sm font-bold text-brand-navy">{history.type}</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-status-completed/10 text-status-completed rounded-full text-[10px] font-bold uppercase">
                        {history.status}
                      </span>
                    </div>
                    <div className="p-4 bg-brand-navy/5 rounded-2xl">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-brand-muted" />
                          <span className="text-brand-navy font-bold">{history.technician}</span>
                        </div>
                        <div className="size-1 bg-border rounded-full" />
                        <button onClick={() => navigate(`/jobs/${history.srId}`)} className="text-brand-gold font-bold hover:underline">
                          View SR: {history.srId}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {eq.serviceHistory.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-brand-muted italic">No service history recorded for this unit.</p>
                </div>
              )}
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
