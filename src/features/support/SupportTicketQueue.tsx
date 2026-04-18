/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { supportRepository, SupportTicket, TicketStatus, TicketPriority } from "@/core/network/support-repository"
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  User, 
  Tag,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function SupportTicketQueue() {
  const navigate = useNavigate();
  const [tickets, setTickets] = React.useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<TicketStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await supportRepository.getTickets({});
        setTickets(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTickets();
  }, [])

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    if (a.status === 'escalated' && b.status !== 'escalated') return -1;
    if (a.status !== 'escalated' && b.status === 'escalated') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Support Tickets</h1>
          <p className="text-sm text-brand-muted">Manage customer complaints and inquiries</p>
        </div>
        <div className="flex gap-2">
          <AdminButton icon={<Plus size={18} />} onClick={() => navigate('/support/new')}>Create Ticket</AdminButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by Ticket #, Customer or Subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
          <FilterButton active={filter === 'open'} onClick={() => setFilter('open')} label="Open" />
          <FilterButton active={filter === 'escalated'} onClick={() => setFilter('escalated')} label="Escalated" />
          <FilterButton active={filter === 'resolved'} onClick={() => setFilter('resolved')} label="Resolved" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.map((ticket, idx) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <TicketCard ticket={ticket} onClick={() => navigate(`/support/tickets/${ticket.id}`)} />
          </motion.div>
        ))}
        {filteredTickets.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-border">
            <MessageSquare size={48} className="mx-auto text-brand-muted mb-4 opacity-20" />
            <p className="text-brand-muted">No support tickets found.</p>
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

function TicketCard({ ticket, onClick }: { ticket: SupportTicket, onClick: () => void }) {
  const statusConfig: Record<TicketStatus, { icon: any, class: string, label: string }> = {
    open: { icon: <Clock size={14} />, class: "bg-status-pending/10 text-status-pending", label: "Open" },
    in_progress: { icon: <Clock size={14} />, class: "bg-brand-gold/10 text-brand-gold", label: "In Progress" },
    escalated: { icon: <AlertTriangle size={14} />, class: "bg-status-emergency/10 text-status-emergency", label: "Escalated" },
    resolved: { icon: <CheckCircle2 size={14} />, class: "bg-status-completed/10 text-status-completed", label: "Resolved" },
    closed: { icon: <CheckCircle2 size={14} />, class: "bg-brand-muted/10 text-brand-muted", label: "Closed" }
  };

  const priorityConfig: Record<TicketPriority, { class: string }> = {
    low: { class: "bg-brand-navy/5 text-brand-navy" },
    medium: { class: "bg-brand-gold/10 text-brand-gold" },
    high: { class: "bg-status-emergency/10 text-status-emergency" },
    urgent: { class: "bg-status-emergency text-white" }
  };

  const config = statusConfig[ticket.status];
  const pConfig = priorityConfig[ticket.priority];

  return (
    <AdminCard 
      onClick={onClick}
      className={cn(
        "p-6 hover:shadow-xl transition-all cursor-pointer group border-l-4",
        ticket.status === 'escalated' ? "border-l-status-emergency" : "border-l-transparent"
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", config.class)}>
            <MessageSquare size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-brand-navy">{ticket.ticketNumber}</h3>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1", config.class)}>
                {config.icon} {config.label}
              </span>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", pConfig.class)}>
                {ticket.priority}
              </span>
              {ticket.unreadCount > 0 && (
                <span className="size-2 bg-status-emergency rounded-full animate-pulse" />
              )}
            </div>
            <p className="text-sm font-bold text-brand-navy mb-1 line-clamp-1">{ticket.subject}</p>
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="font-bold text-brand-navy">{ticket.customerName}</span>
              <span className="size-1 bg-border rounded-full" />
              <span className="flex items-center gap-1"><Tag size={12} /> {ticket.category.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-8">
          <div className="text-right">
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">Last Activity</p>
            <p className="text-xs font-bold text-brand-navy">{new Date(ticket.lastReplyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{new Date(ticket.lastReplyAt).toLocaleDateString()}</p>
          </div>
          <ChevronRight size={20} className="text-brand-gold group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </AdminCard>
  )
}
