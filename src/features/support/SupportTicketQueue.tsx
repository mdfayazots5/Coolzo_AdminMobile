/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, Plus, Search, Tag } from "lucide-react"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { InlineLoader } from "@/components/shared/Layout"
import { SupportTicket, TicketPriority, TicketStatus, supportRepository } from "@/core/network/support-repository"
import { cn } from "@/lib/utils"

export default function SupportTicketQueue() {
  const navigate = useNavigate()
  const [tickets, setTickets] = React.useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<TicketStatus | "all">("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const loadTickets = async () => {
      try {
        const data = await supportRepository.getTickets({})
        setTickets(data)
      } finally {
        setIsLoading(false)
      }
    }

    void loadTickets()
  }, [])

  const filtered = tickets
    .filter((ticket) => statusFilter === "all" || ticket.status === statusFilter)
    .filter((ticket) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) {
        return true
      }
      return (
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.customerName.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query)
      )
    })
    .sort((left, right) => {
      if (left.status === "escalated" && right.status !== "escalated") return -1
      if (left.status !== "escalated" && right.status === "escalated") return 1
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Support Tickets</h1>
          <p className="text-sm text-brand-muted">Escalated-first queue with SLA-driven follow-up</p>
        </div>
        <AdminButton icon={<Plus size={18} />} onClick={() => navigate("/support/new")}>
          Create Ticket
        </AdminButton>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by ticket, customer, or subject..."
            className="w-full rounded-2xl border border-border bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { label: "All", value: "all" },
            { label: "Open", value: "open" },
            { label: "Escalated", value: "escalated" },
            { label: "Resolved", value: "resolved" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value as TicketStatus | "all")}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all",
                statusFilter === filter.value ? "bg-brand-navy text-brand-gold" : "border border-border bg-white text-brand-muted",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((ticket, index) => (
          <motion.div key={ticket.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
            <TicketCard ticket={ticket} onClick={() => navigate(`/support/tickets/${ticket.id}`)} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  const statusConfig: Record<TicketStatus, { label: string; className: string; icon: React.ReactNode }> = {
    open: { label: "Open", className: "bg-brand-navy/5 text-brand-navy", icon: <Clock size={12} /> },
    in_progress: { label: "In Progress", className: "bg-brand-gold/10 text-brand-gold", icon: <Clock size={12} /> },
    escalated: { label: "Escalated", className: "bg-status-emergency/10 text-status-emergency", icon: <AlertTriangle size={12} /> },
    resolved: { label: "Resolved", className: "bg-status-completed/10 text-status-completed", icon: <CheckCircle2 size={12} /> },
    closed: { label: "Closed", className: "bg-brand-muted/10 text-brand-muted", icon: <CheckCircle2 size={12} /> },
  }

  const priorityConfig: Record<TicketPriority, string> = {
    low: "bg-brand-navy/5 text-brand-navy",
    medium: "bg-brand-gold/10 text-brand-gold",
    high: "bg-status-emergency/10 text-status-emergency",
    urgent: "bg-status-emergency text-white",
  }

  return (
    <AdminCard onClick={onClick} className={cn("cursor-pointer p-6 transition-all hover:shadow-xl", ticket.status === "escalated" && "border-l-4 border-l-status-emergency")}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn("flex size-12 items-center justify-center rounded-2xl", statusConfig[ticket.status].className)}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-brand-navy">{ticket.ticketNumber}</span>
              <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", statusConfig[ticket.status].className)}>
                {statusConfig[ticket.status].icon}
                {statusConfig[ticket.status].label}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", priorityConfig[ticket.priority])}>
                {ticket.priority}
              </span>
            </div>
            <p className="text-sm font-bold text-brand-navy">{ticket.subject}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-brand-muted">
              <span className="font-bold text-brand-navy">{ticket.customerName}</span>
              <span className="flex items-center gap-1"><Tag size={12} /> {ticket.category.replace("_", " ")}</span>
              {ticket.linkedSrNumber && <span>{ticket.linkedSrNumber}</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Last Activity</p>
          <p className="text-xs font-bold text-brand-navy">{new Date(ticket.lastReplyAt).toLocaleString()}</p>
        </div>
      </div>
    </AdminCard>
  )
}
