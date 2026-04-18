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
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function EquipmentRegisterList() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = React.useState<Equipment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const data = await equipmentRepository.getEquipment({});
        setEquipment(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEquipment();
  }, [])

  const filteredEquipment = equipment.filter(eq => 
    eq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    eq.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Equipment Register</h1>
          <p className="text-sm text-brand-muted">Track every AC unit serviced by the company</p>
        </div>
        <AdminButton icon={<Plus size={18} />}>Register Equipment</AdminButton>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by ID, Customer, Brand or Model..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active label="All Units" />
          <FilterButton label="Under AMC" />
          <FilterButton label="Out of Warranty" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEquipment.map((eq, idx) => (
          <motion.div
            key={eq.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <EquipmentCard eq={eq} onClick={() => navigate(`/equipment/${eq.id}`)} />
          </motion.div>
        ))}
        {filteredEquipment.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-[40px] border border-dashed border-border">
            <Wrench size={48} className="mx-auto text-brand-muted mb-4 opacity-20" />
            <p className="text-brand-muted">No equipment found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterButton({ active, label }: any) {
  return (
    <button className={cn(
      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
      active ? "bg-brand-navy text-brand-gold" : "bg-white text-brand-muted border border-border hover:border-brand-gold"
    )}>
      {label}
    </button>
  )
}

function EquipmentCard({ eq, onClick }: { eq: Equipment, onClick: () => void }) {
  return (
    <AdminCard 
      onClick={onClick}
      className="p-6 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="size-12 bg-brand-navy/5 text-brand-navy rounded-2xl flex items-center justify-center">
          <Wrench size={24} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{eq.equipmentId}</span>
          {eq.isUnderAMC ? (
            <span className="px-2 py-0.5 bg-status-completed/10 text-status-completed rounded-full text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={10} /> AMC Active
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-brand-muted/10 text-brand-muted rounded-full text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert size={10} /> No AMC
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-bold text-brand-navy truncate">{eq.brand} {eq.model}</h3>
        <p className="text-xs text-brand-muted uppercase tracking-widest font-bold">{eq.type} • {eq.capacity}</p>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-xs text-brand-navy font-bold">
          <User size={14} className="text-brand-muted" />
          <span>{eq.customerName}</span>
        </div>
        <div className="flex items-start gap-2 text-[11px] text-brand-muted">
          <MapPin size={14} className="shrink-0 mt-0.5" />
          <span className="line-clamp-1">{eq.locationLabel}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-brand-muted" />
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-brand-muted uppercase tracking-widest">Last Service</span>
            <span className="text-[10px] font-bold text-brand-navy">{eq.lastServiceDate || 'Never'}</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-brand-gold group-hover:translate-x-1 transition-transform" />
      </div>

      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 -mr-12 -mt-12 rounded-full blur-2xl" />
    </AdminCard>
  )
}
