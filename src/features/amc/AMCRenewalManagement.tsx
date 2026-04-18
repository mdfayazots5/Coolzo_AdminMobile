/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { amcRepository, AMCContract } from "@/core/network/amc-repository"
import { 
  RefreshCw, 
  Search, 
  Filter, 
  Bell, 
  MessageSquare, 
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  FileText
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function AMCRenewalManagement() {
  const navigate = useNavigate();
  const [queue, setQueue] = React.useState<AMCContract[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  React.useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await amcRepository.getRenewalQueue();
        setQueue(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQueue();
  }, [])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  const handleBulkReminder = () => {
    toast.success(`Sent renewal reminders to ${selectedIds.length} customers via WhatsApp`);
    setSelectedIds([]);
  }

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">AMC Renewal Management</h1>
          <p className="text-sm text-brand-muted">Proactively manage contracts expiring in the next 30-90 days</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<TrendingUp size={18} />}>Conversion Stats</AdminButton>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIBlock label="Expiring (30 Days)" value="12" icon={<AlertCircle size={20} />} color="orange" />
        <KPIBlock label="Renewal Rate" value="85%" icon={<RefreshCw size={20} />} color="green" />
        <KPIBlock label="Follow-ups Pending" value="8" icon={<MessageSquare size={20} />} color="navy" />
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-brand-navy text-brand-gold rounded-2xl flex items-center justify-between shadow-xl"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold">{selectedIds.length} Contracts Selected</span>
            <div className="h-4 w-px bg-brand-gold/20" />
            <button className="text-xs font-bold uppercase tracking-widest hover:underline">Export CSV</button>
          </div>
          <div className="flex gap-2">
            <AdminButton size="sm" variant="outline" className="border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10" onClick={handleBulkReminder}>
              Send Bulk WhatsApp
            </AdminButton>
            <AdminButton size="sm" className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90">
              Assign Follow-up
            </AdminButton>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search expiring contracts..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <FilterButton active label="Next 30 Days" />
          <FilterButton label="Next 60 Days" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {queue.map((contract, idx) => (
          <motion.div
            key={contract.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <RenewalCard 
              contract={contract} 
              selected={selectedIds.includes(contract.id)}
              onSelect={() => toggleSelect(contract.id)}
              onRenew={() => navigate(`/amc/enroll?renew=${contract.id}`)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function KPIBlock({ label, value, icon, color }: any) {
  const colors: any = {
    orange: "bg-status-pending/10 text-status-pending",
    green: "bg-status-completed/10 text-status-completed",
    navy: "bg-brand-navy/5 text-brand-navy"
  };
  return (
    <AdminCard className="p-6">
      <div className="flex items-center gap-4">
        <div className={cn("size-12 rounded-2xl flex items-center justify-center", colors[color])}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-navy">{value}</p>
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{label}</p>
        </div>
      </div>
    </AdminCard>
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

function RenewalCard({ contract, selected, onSelect, onRenew }: any) {
  return (
    <AdminCard className={cn(
      "p-6 hover:shadow-xl transition-all group border-2",
      selected ? "border-brand-gold bg-brand-gold/5" : "border-transparent"
    )}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div 
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
              "size-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer",
              selected ? "bg-brand-gold border-brand-gold text-brand-navy" : "border-border bg-white"
            )}
          >
            {selected && <TrendingUp size={14} />}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-brand-navy">{contract.customerName}</h3>
              <span className="px-2 py-0.5 bg-status-pending/10 text-status-pending rounded-full text-[10px] font-bold uppercase">
                Expires in 12 Days
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="flex items-center gap-1"><FileText size={12} /> {contract.contractNumber}</span>
              <span className="size-1 bg-border rounded-full" />
              <span className="flex items-center gap-1"><Calendar size={12} /> Ends {contract.endDate}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xs">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy">
              <Users size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Plan</p>
              <p className="text-xs font-bold text-brand-navy">{contract.planType.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-3 bg-white border border-border rounded-2xl text-brand-navy hover:border-brand-gold transition-all">
            <MessageSquare size={20} />
          </button>
          <AdminButton onClick={onRenew}>Renew Now</AdminButton>
        </div>
      </div>
    </AdminCard>
  )
}
