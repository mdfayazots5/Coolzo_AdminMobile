/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { inventoryRepository, PartsRequest } from "@/core/network/inventory-repository"
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  User,
  AlertCircle,
  Package
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function PartsRequestQueue() {
  const navigate = useNavigate();
  const [requests, setRequests] = React.useState<PartsRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected' | 'partially_approved'>('all')
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await inventoryRepository.getPartsRequests({});
        setRequests(sortRequests(data));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRequests();
  }, [])

  const filteredRequests = requests.filter((request) => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = [request.technicianName, request.srNumber]
      .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Parts Requests Queue</h1>
          <p className="text-sm text-brand-muted">Process technician requests for spare parts and consumables</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by Technician or SR #..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All Requests" />
          <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')} label="Pending" />
          <FilterButton active={filter === 'approved'} onClick={() => setFilter('approved')} label="Approved" />
          <FilterButton active={filter === 'partially_approved'} onClick={() => setFilter('partially_approved')} label="Partial" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map((request, idx) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <RequestCard request={request} onClick={() => navigate(`/inventory/requests/${request.id}`)} />
          </motion.div>
        ))}
        {filteredRequests.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-border">
            <ClipboardList size={48} className="mx-auto text-brand-muted mb-4 opacity-20" />
            <p className="text-brand-muted">No parts requests found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function sortRequests(requests: PartsRequest[]) {
  return [...requests].sort((left, right) => {
    if (left.urgency === 'emergency' && right.urgency !== 'emergency') {
      return -1;
    }
    if (right.urgency === 'emergency' && left.urgency !== 'emergency') {
      return 1;
    }
    return new Date(left.submittedAt).getTime() - new Date(right.submittedAt).getTime();
  });
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

function RequestCard({ request, onClick }: { request: PartsRequest, onClick: () => void }) {
  const statusConfig = {
    pending: { icon: <Clock size={14} />, class: "bg-status-pending/10 text-status-pending", label: "Pending Approval" },
    approved: { icon: <CheckCircle2 size={14} />, class: "bg-status-completed/10 text-status-completed", label: "Approved" },
    partially_approved: { icon: <AlertCircle size={14} />, class: "bg-brand-gold/10 text-brand-gold", label: "Partially Approved" },
    rejected: { icon: <XCircle size={14} />, class: "bg-status-emergency/10 text-status-emergency", label: "Rejected" }
  };

  const config = statusConfig[request.status];
  const timeElapsed = Math.floor((new Date().getTime() - new Date(request.submittedAt).getTime()) / (1000 * 60));

  return (
    <AdminCard 
      onClick={onClick}
      className="p-6 hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", config.class)}>
            <Package size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-brand-navy">SR: {request.srNumber}</h3>
              {request.urgency === 'emergency' && (
                <span className="px-2 py-0.5 bg-status-emergency text-white rounded-full text-[8px] font-bold uppercase animate-pulse">Emergency</span>
              )}
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1", config.class)}>
                {config.icon} {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="font-bold text-brand-navy">{request.technicianName}</span>
              <span className="size-1 bg-border rounded-full" />
              <span>{request.items.length} items requested</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xs">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy">
              <Clock size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Time Elapsed</p>
              <p className="text-xs font-bold text-brand-navy">{timeElapsed} minutes ago</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-8">
          <div className="text-right">
            <p className="text-sm font-bold text-brand-navy">{new Date(request.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{new Date(request.submittedAt).toLocaleDateString()}</p>
          </div>
          <ChevronRight size={20} className="text-brand-gold group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </AdminCard>
  )
}
