/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { supportRepository, SupportTicket, TicketMessage, TicketStatus } from "@/core/network/support-repository"
import { 
  ChevronLeft, 
  Send, 
  Paperclip, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  MoreVertical,
  ShieldAlert,
  Tag,
  ExternalLink,
  MessageSquare
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function TicketDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = React.useState<SupportTicket | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [replyText, setReplyText] = React.useState("")
  const [isInternal, setIsInternal] = React.useState(false)

  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      try {
        const data = await supportRepository.getTicketById(id);
        setTicket(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTicket();
  }, [id])

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages])

  const handleSend = async () => {
    if (!ticket || !replyText.trim()) return;
    try {
      const updated = await supportRepository.addMessage(ticket.id, {
        senderId: 'agent-1',
        senderName: 'Admin Agent',
        senderRole: 'agent',
        text: replyText,
        isInternal
      });
      setTicket({ ...updated });
      setReplyText("");
      toast.success(isInternal ? "Internal note added" : "Reply sent to customer");
    } catch (error) {
      toast.error("Failed to send message");
    }
  }

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    try {
      await supportRepository.updateTicketStatus(ticket.id, status);
      setTicket({ ...ticket, status });
      toast.success(`Ticket status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!ticket) return <div className="p-8 text-center">Ticket not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{ticket.ticketNumber}</h1>
            <p className="text-sm text-brand-muted">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-2 bg-white border border-border rounded-xl text-sm font-bold text-brand-navy outline-none focus:ring-2 focus:ring-brand-gold"
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <AdminButton variant="outline" icon={<ShieldAlert size={18} />}>Escalate</AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Context */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Customer Info" icon={<User size={18} />} />
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-bold text-brand-navy">{ticket.customerName}</p>
                <p className="text-[10px] text-brand-muted uppercase tracking-widest">Customer ID: {ticket.customerId}</p>
              </div>
              <AdminButton variant="ghost" size="sm" className="w-full justify-start px-0 text-brand-gold">
                View Customer 360 <ExternalLink size={14} className="ml-2" />
              </AdminButton>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Ticket Details" icon={<Tag size={18} />} />
            <div className="mt-4 space-y-4">
              <InfoRow label="Category" value={ticket.category.replace('_', ' ')} />
              <InfoRow label="Priority" value={ticket.priority} />
              <InfoRow label="Created" value={new Date(ticket.createdAt).toLocaleDateString()} />
              {ticket.linkedSrNumber && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">Linked SR</p>
                  <AdminButton variant="ghost" size="sm" className="w-full justify-start px-0 text-brand-navy font-bold">
                    {ticket.linkedSrNumber} <ExternalLink size={14} className="ml-2" />
                  </AdminButton>
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-6 bg-status-emergency/5 border-2 border-status-emergency/20">
            <SectionHeader title="SLA Deadline" icon={<Clock size={18} />} />
            <div className="mt-4">
              <p className="text-2xl font-bold text-status-emergency">2h 15m</p>
              <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Remaining for resolution</p>
            </div>
          </AdminCard>
        </div>

        {/* Right Column: Chat */}
        <div className="lg:col-span-3 flex flex-col h-[700px]">
          <AdminCard className="flex-1 flex flex-col overflow-hidden p-0 rounded-[40px]">
            <div className="p-6 border-b border-border bg-brand-navy/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-brand-navy text-brand-gold rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-navy">Conversation History</p>
                  <p className="text-[10px] text-brand-muted uppercase tracking-widest">{ticket.messages.length} Messages</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Assigned:</span>
                <span className="text-xs font-bold text-brand-navy">{ticket.assignedAgentName || 'Unassigned'}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {ticket.messages.map((msg, i) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.senderRole === 'customer' ? "mr-auto" : "ml-auto items-end"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1 px-2">
                    <span className="text-[10px] font-bold text-brand-navy uppercase tracking-widest">{msg.senderName}</span>
                    <span className="text-[10px] text-brand-muted">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={cn(
                    "p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                    msg.senderRole === 'customer' ? "bg-brand-navy text-white rounded-tl-none" : 
                    msg.isInternal ? "bg-brand-gold/10 text-brand-navy border border-brand-gold/20 rounded-tr-none italic" :
                    "bg-white border border-border text-brand-navy rounded-tr-none"
                  )}>
                    {msg.isInternal && <span className="block text-[8px] font-bold uppercase tracking-widest text-brand-gold mb-1">Internal Note</span>}
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t border-border bg-white">
              <div className="flex items-center gap-4 mb-4">
                <button 
                  onClick={() => setIsInternal(false)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                    !isInternal ? "bg-brand-navy text-brand-gold" : "bg-brand-navy/5 text-brand-muted"
                  )}
                >
                  Reply to Customer
                </button>
                <button 
                  onClick={() => setIsInternal(true)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                    isInternal ? "bg-brand-gold text-brand-navy" : "bg-brand-navy/5 text-brand-muted"
                  )}
                >
                  Internal Note
                </button>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1 relative">
                  <textarea 
                    placeholder={isInternal ? "Add internal note..." : "Type your reply here..."}
                    className="w-full p-4 bg-brand-navy/5 border-none rounded-3xl text-sm focus:ring-2 focus:ring-brand-gold outline-none min-h-[100px] resize-none"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button className="absolute right-4 bottom-4 p-2 text-brand-muted hover:text-brand-gold transition-colors">
                    <Paperclip size={20} />
                  </button>
                </div>
                <button 
                  onClick={handleSend}
                  disabled={!replyText.trim()}
                  className="size-14 bg-brand-navy text-brand-gold rounded-3xl flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={24} />
                </button>
              </div>
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
      <span className="text-sm font-bold text-brand-navy capitalize">{value}</span>
    </div>
  )
}
