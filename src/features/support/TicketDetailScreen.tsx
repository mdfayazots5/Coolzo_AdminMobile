/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ChevronLeft,
  ExternalLink,
  MessageSquare,
  Send,
  ShieldAlert,
  User,
} from "lucide-react"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { SupportTicket, TicketStatus, supportRepository } from "@/core/network/support-repository"
import { cn } from "@/lib/utils"

export default function TicketDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = React.useState<SupportTicket | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [replyText, setReplyText] = React.useState("")
  const [isInternal, setIsInternal] = React.useState(false)

  React.useEffect(() => {
    const loadTicket = async () => {
      if (!id) {
        return
      }

      try {
        setTicket(await supportRepository.getTicketById(id))
      } catch (error) {
        console.error(error)
        toast.error("Unable to load ticket")
      } finally {
        setIsLoading(false)
      }
    }

    void loadTicket()
  }, [id])

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  if (!ticket) {
    return <div className="p-8 text-center">Ticket not found</div>
  }

  const handleReply = async () => {
    if (!replyText.trim()) {
      return
    }
    const updated = await supportRepository.addMessage(ticket.id, {
      senderId: "admin-agent",
      senderName: "Admin Agent",
      senderRole: "agent",
      text: replyText,
      isInternal,
    })
    setTicket(updated)
    setReplyText("")
    toast.success(isInternal ? "Internal note added" : "Reply sent")
  }

  const handleStatusChange = async (status: TicketStatus) => {
    const updated = await supportRepository.updateTicketStatus(ticket.id, status)
    setTicket(updated)
    toast.success(`Status updated to ${status}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="rounded-xl p-2 transition-colors hover:bg-brand-navy/5">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{ticket.ticketNumber}</h1>
            <p className="text-sm text-brand-muted">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={ticket.status}
            onChange={(event) => void handleStatusChange(event.target.value as TicketStatus)}
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold text-brand-navy outline-none focus:ring-2 focus:ring-brand-gold"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <AdminButton variant="outline" icon={<User size={18} />} onClick={async () => {
            const updated = await supportRepository.assignTicket(ticket.id, "101")
            setTicket(updated)
            toast.success("Ticket assigned")
          }}>
            Assign
          </AdminButton>
          <AdminButton icon={<ShieldAlert size={18} />} onClick={async () => {
            const updated = await supportRepository.escalateTicket(ticket.id, "OperationsManager", "Escalated from admin mobile")
            setTicket(updated)
            toast.success("Ticket escalated")
          }}>
            Escalate
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Customer Context" icon={<User size={18} />} />
            <div className="mt-4 space-y-3">
              <p className="text-sm font-bold text-brand-navy">{ticket.customerName}</p>
              <p className="text-[10px] uppercase tracking-widest text-brand-muted">Customer ID {ticket.customerId}</p>
              {ticket.linkedSrNumber && (
                <button className="flex items-center gap-2 text-xs font-bold text-brand-gold">
                  {ticket.linkedSrNumber} <ExternalLink size={12} />
                </button>
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Ticket Meta" icon={<ShieldAlert size={18} />} />
            <div className="mt-4 space-y-4">
              <InfoRow label="Category" value={ticket.category.replace("_", " ")} />
              <InfoRow label="Priority" value={ticket.priority} />
              <InfoRow label="Assigned" value={ticket.assignedAgentName ?? "Unassigned"} />
              <InfoRow label="SLA" value={new Date(ticket.slaDeadline).toLocaleString()} />
            </div>
          </AdminCard>
        </div>

        <div className="xl:col-span-3">
          <AdminCard className="flex h-[720px] flex-col overflow-hidden rounded-[40px] p-0">
            <div className="border-b border-border bg-brand-navy/[0.02] p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-navy">Conversation</p>
                  <p className="text-[10px] uppercase tracking-widest text-brand-muted">{ticket.messages.length} messages</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {ticket.messages.map((message) => (
                <div key={message.id} className={cn("flex flex-col", message.senderRole === "customer" ? "items-start" : "items-end")}>
                  <div className="mb-1 flex items-center gap-2 px-2 text-[10px] uppercase tracking-widest text-brand-muted">
                    <span className="font-bold text-brand-navy">{message.senderName}</span>
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-3xl p-4 text-sm leading-relaxed shadow-sm",
                      message.senderRole === "customer"
                        ? "rounded-tl-none bg-brand-navy text-white"
                        : message.isInternal
                          ? "rounded-tr-none border border-brand-gold/20 bg-brand-gold/10 text-brand-navy italic"
                          : "rounded-tr-none border border-border bg-white text-brand-navy",
                    )}
                  >
                    {message.isInternal && <span className="mb-1 block text-[8px] font-bold uppercase tracking-widest text-brand-gold">Internal Note</span>}
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-6">
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setIsInternal(false)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                    !isInternal ? "bg-brand-navy text-brand-gold" : "bg-brand-navy/5 text-brand-muted",
                  )}
                >
                  Customer Reply
                </button>
                <button
                  onClick={() => setIsInternal(true)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                    isInternal ? "bg-brand-gold text-brand-navy" : "bg-brand-navy/5 text-brand-muted",
                  )}
                >
                  Internal Note
                </button>
              </div>
              <div className="flex items-end gap-4">
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder={isInternal ? "Add internal note..." : "Reply to customer..."}
                  className="min-h-[110px] flex-1 rounded-3xl bg-brand-navy/5 p-4 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
                />
                <button
                  onClick={() => void handleReply()}
                  className="flex size-14 items-center justify-center rounded-3xl bg-brand-navy text-brand-gold transition-all hover:scale-105"
                >
                  <Send size={22} />
                </button>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">{label}</span>
      <span className="text-right text-sm font-bold capitalize text-brand-navy">{value}</span>
    </div>
  )
}
