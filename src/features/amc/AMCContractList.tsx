/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { amcRepository, AMCContract, AMCStatus } from "@/core/network/amc-repository"
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function AMCContractList() {
  const navigate = useNavigate();
  const [contracts, setContracts] = React.useState<AMCContract[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<AMCStatus | 'all'>('all')

  React.useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await amcRepository.getContracts({});
        setContracts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContracts();
  }, [])

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">AMC Contracts</h1>
          <p className="text-sm text-brand-muted">Manage recurring maintenance service contracts</p>
        </div>
        <AdminButton onClick={() => navigate('/amc/enroll')} icon={<Plus size={18} />}>
          Enroll Customer
        </AdminButton>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by contract # or customer name..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="All" />
          <FilterButton active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} label="Active" />
          <FilterButton active={statusFilter === 'expiring_soon'} onClick={() => setStatusFilter('expiring_soon')} label="Expiring Soon" />
          <FilterButton active={statusFilter === 'expired'} onClick={() => setStatusFilter('expired')} label="Expired" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredContracts.map((contract, idx) => (
          <motion.div
            key={contract.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <ContractCard contract={contract} onClick={() => navigate(`/amc/contract/${contract.id}`)} />
          </motion.div>
        ))}
        {filteredContracts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-border">
            <FileText size={48} className="mx-auto text-brand-muted mb-4 opacity-20" />
            <p className="text-brand-muted">No contracts found matching your filters.</p>
          </div>
        )}
      </div>
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

function ContractCard({ contract, onClick }: { contract: AMCContract, onClick: () => void }) {
  const statusConfig = {
    active: { icon: <CheckCircle2 size={14} />, color: "bg-status-completed/10 text-status-completed", label: "Active" },
    expiring_soon: { icon: <AlertCircle size={14} />, color: "bg-status-pending/10 text-status-pending", label: "Expiring Soon" },
    expired: { icon: <XCircle size={14} />, color: "bg-status-emergency/10 text-status-emergency", label: "Expired" },
    cancelled: { icon: <XCircle size={14} />, color: "bg-brand-muted/10 text-brand-muted", label: "Cancelled" },
    pending_payment: { icon: <Clock size={14} />, color: "bg-brand-gold/10 text-brand-navy", label: "Pending Payment" }
  };

  const config = statusConfig[contract.status];
  const progress = (contract.completedVisits / contract.totalVisits) * 100;

  return (
    <AdminCard 
      onClick={onClick}
      className="p-6 hover:shadow-xl transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-brand-gold"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="size-12 bg-brand-navy/5 text-brand-navy rounded-2xl flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-brand-navy">{contract.contractNumber}</h3>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1", config.color)}>
                {config.icon}
                {config.label}
              </span>
            </div>
            <p className="text-sm font-bold text-brand-navy mb-1">{contract.customerName}</p>
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="flex items-center gap-1"><Calendar size={12} /> Ends {contract.endDate}</span>
              <span className="size-1 bg-border rounded-full" />
              <span className="font-bold uppercase tracking-widest text-brand-gold">{contract.planType} Plan</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Visits: {contract.completedVisits}/{contract.totalVisits}</span>
            <span className="text-[10px] font-bold text-brand-navy">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-brand-navy/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-brand-gold"
            />
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Next Visit</p>
            <p className="text-sm font-bold text-brand-navy">
              {contract.visits.find(v => v.status === 'scheduled')?.scheduledDate || 'None'}
            </p>
          </div>
          <ChevronRight size={20} className="text-brand-muted group-hover:text-brand-gold transition-colors" />
        </div>
      </div>
    </AdminCard>
  )
}
