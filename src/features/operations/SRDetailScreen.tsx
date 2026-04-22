/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { StatusBadge } from "@/components/shared/Badges"
import { serviceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Wrench, 
  AlertCircle,
  MessageSquare,
  History,
  ShieldCheck,
  MoreVertical,
  Send,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { toast } from "sonner"

export default function SRDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sr, setSr] = React.useState<ServiceRequest | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [newNote, setNewNote] = React.useState("")
  const badgeStatus =
    sr?.status === "pending"
      ? "pending"
      : sr?.status === "assigned" || sr?.status === "en-route" || sr?.status === "arrived" || sr?.status === "in-progress"
        ? "processing"
        : sr?.status === "completed"
          ? "completed"
          : "closed"

  const refreshSR = React.useCallback(async () => {
    if (!id) return
    const data = await serviceRequestRepository.getSRById(id)
    setSr(data)
  }, [id])

  React.useEffect(() => {
    const fetchSR = async () => {
      if (!id) return;
      try {
        await refreshSR()
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSR();
  }, [refreshSR])

  const handleAddNote = async () => {
    if (!newNote.trim() || !sr) return;
    try {
      await serviceRequestRepository.addInternalNote(sr.id, newNote);
      await refreshSR()
      setNewNote("");
      toast.success("Internal note added");
    } catch (error) {
      toast.error("Failed to add note");
    }
  }

  const handleEscalate = async () => {
    if (!sr) return
    try {
      await serviceRequestRepository.escalateSR(sr.id, "ServiceRequestEscalation", `Manual escalation raised for ${sr.srNumber}.`)
      await refreshSR()
      toast.success("Service request escalated")
    } catch (error) {
      console.error(error)
      toast.error("Failed to escalate service request")
    }
  }

  const handleCancel = async () => {
    if (!sr) return
    try {
      await serviceRequestRepository.cancelSR(sr.id, `Cancelled from SR detail for ${sr.srNumber}.`)
      await refreshSR()
      toast.success("Service request cancelled")
    } catch (error) {
      console.error(error)
      toast.error("Failed to cancel service request")
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!sr) return <div className="p-8 text-center">SR not found</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-brand-navy">{sr.srNumber}</h1>
              <StatusBadge status={badgeStatus}>
                {sr.status}
              </StatusBadge>
              {sr.isEscalated && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-status-emergency/10 text-status-emergency text-[10px] font-bold rounded uppercase tracking-widest">
                  <AlertCircle size={12} />
                  Escalated
                </div>
              )}
            </div>
            <p className="text-xs text-brand-muted">Created on {new Date(sr.createdAt).toLocaleString()} by {sr.createdBy}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton 
            variant="outline" 
            size="sm" 
            onClick={handleEscalate}
          >
            <AlertTriangle size={18} />
          </AdminButton>
          <AdminButton 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
          >
            <XCircle size={18} />
          </AdminButton>
          <AdminButton 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/service-requests/${sr.id}/edit`)}
          >
            <MoreVertical size={18} />
          </AdminButton>
          <AdminButton 
            size="sm" 
            onClick={() => navigate(`/operations/dispatch?srId=${sr.id}`)}
          >
            Assign Tech
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminCard className="p-6">
              <SectionHeader title="Customer Details" icon={<User size={18} />} />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 
                    className="font-bold text-brand-navy text-lg cursor-pointer hover:text-brand-gold transition-colors"
                    onClick={() => sr.customer.id ? navigate(`/customers/${sr.customer.id}`) : toast.info("Customer 360 will be available when SRs are linked to customer records.")}
                  >
                    {sr.customer.name}
                  </h3>
                  {sr.customer.isAMC && (
                    <div className="flex items-center gap-1 text-brand-gold text-[10px] font-bold uppercase tracking-widest">
                      <ShieldCheck size={14} />
                      AMC Member
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-brand-navy">
                    <Phone size={16} className="text-brand-muted" />
                    <span className="text-sm font-medium">{sr.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-brand-navy">
                    <Mail size={16} className="text-brand-muted" />
                    <span className="text-sm font-medium">{sr.customer.email}</span>
                  </div>
                </div>
              </div>
            </AdminCard>

            <AdminCard className="p-6">
              <SectionHeader title="Service Location" icon={<MapPin size={18} />} />
              <div className="space-y-4">
                <p className="text-sm font-medium text-brand-navy leading-relaxed">
                  {sr.location.address}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-brand-gold uppercase tracking-widest">
                  <MapPin size={12} />
                  Zone: {sr.location.zoneId} • {sr.location.city}
                </div>
                <AdminButton 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const query = encodeURIComponent(`${sr.location.address}, ${sr.location.city}, India`);
                    window.open(`https://www.openstreetmap.org/search?query=${query}`, '_blank');
                  }}
                >
                  View on Map
                </AdminButton>
              </div>
            </AdminCard>
          </div>

          {/* Equipment & Service */}
          <AdminCard className="p-6">
            <SectionHeader title="Service & Equipment" icon={<Wrench size={18} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Service Type</p>
                  <p className="text-sm font-bold text-brand-navy">{sr.serviceType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Priority</p>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "size-2 rounded-full",
                      sr.priority === 'emergency' ? "bg-status-emergency" : sr.priority === 'urgent' ? "bg-status-urgent" : "bg-brand-navy"
                    )} />
                    <p className="text-sm font-bold text-brand-navy capitalize">{sr.priority}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Equipment</p>
                  <p className="text-sm font-bold text-brand-navy">{sr.equipment.brand} {sr.equipment.model}</p>
                  <p className="text-xs text-brand-muted">{sr.equipment.type} • {sr.equipment.tonnage}</p>
                </div>
              </div>
            </div>
          </AdminCard>

          {/* Timeline */}
          <AdminCard className="p-6">
            <SectionHeader title="Job Timeline" icon={<History size={18} />} />
            <div className="mt-6 space-y-8">
              {sr.timeline.map((event, i) => (
                <div key={i} className="relative flex gap-4">
                  {i < sr.timeline.length - 1 && (
                    <div className="absolute left-[11px] top-6 w-px h-10 bg-border" />
                  )}
                  <div className={cn(
                    "size-6 rounded-full flex items-center justify-center shrink-0 z-10",
                    i === 0 ? "bg-brand-gold text-brand-navy" : "bg-brand-navy/5 text-brand-muted"
                  )}>
                    {event.status === 'completed' ? <CheckCircle2 size={14} /> : 
                     event.status === 'cancelled' ? <XCircle size={14} /> :
                     <Clock size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-brand-navy capitalize">{event.status}</p>
                      <p className="text-[10px] text-brand-muted">{new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-brand-muted">Action by {event.actor}</p>
                    {event.note && (
                      <p className="mt-2 p-2 bg-brand-navy/5 rounded text-xs text-brand-navy italic">
                        "{event.note}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        {/* Right Column: Scheduling & Notes */}
        <div className="space-y-6">
          {/* Scheduling */}
          <AdminCard className="p-6">
            <SectionHeader title="Scheduling" icon={<Calendar size={18} />} />
            <div className="space-y-6">
              <div className="p-4 bg-brand-gold/5 rounded-xl border border-brand-gold/20">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar size={18} className="text-brand-gold" />
                  <p className="text-sm font-bold text-brand-navy">{sr.scheduling.requestedDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-brand-gold" />
                  <p className="text-xs text-brand-navy">{sr.scheduling.requestedSlot}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Assigned Technician</p>
                {sr.scheduling.assignedTechnicianName ? (
                  <div 
                    className="flex items-center gap-3 p-3 bg-brand-navy/5 rounded-xl border border-brand-navy/10 cursor-pointer hover:border-brand-gold transition-colors"
                    onClick={() => navigate(`/team/${sr.scheduling.assignedTechnicianId}`)}
                  >
                    <div className="size-10 bg-brand-navy text-brand-gold rounded-full flex items-center justify-center font-bold">
                      {sr.scheduling.assignedTechnicianName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-navy">{sr.scheduling.assignedTechnicianName}</p>
                      <p className="text-[10px] text-brand-muted uppercase tracking-widest">Senior Technician</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-border rounded-xl text-center">
                    <p className="text-xs text-brand-muted mb-3">No technician assigned yet</p>
                    <AdminButton 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/operations/dispatch?srId=${sr.id}`)}
                    >
                      Assign Now
                    </AdminButton>
                  </div>
                )}
              </div>
            </div>
          </AdminCard>

          {/* Internal Notes */}
          <AdminCard className="p-6">
            <SectionHeader title="Internal Notes" icon={<MessageSquare size={18} />} />
            <div className="space-y-4 mt-4">
              <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
                {sr.internalNotes.length === 0 ? (
                  <p className="text-xs text-brand-muted text-center py-4">No internal notes yet</p>
                ) : (
                  sr.internalNotes.map(note => (
                    <div key={note.id} className={cn(
                      "p-3 rounded-xl text-xs",
                      note.isEscalation ? "bg-status-emergency/5 border border-status-emergency/10" : "bg-brand-navy/5"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-brand-navy">{note.author}</span>
                        <span className="text-[10px] text-brand-muted">{new Date(note.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-brand-navy leading-relaxed">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a private note..."
                  className="w-full h-20 p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-xs focus:border-brand-gold outline-none resize-none"
                />
                <AdminButton 
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="w-full"
                  size="sm"
                  iconRight={<Send size={14} />}
                >
                  Add Note
                </AdminButton>
              </div>
            </div>
          </AdminCard>

          {/* Communication Log */}
          <AdminCard className="p-6">
            <SectionHeader title="Communication Log" icon={<Send size={18} />} />
            <div className="space-y-4 mt-4">
              {sr.communicationLog.map(log => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy">
                    {log.channel === 'WhatsApp' ? <MessageSquare size={14} /> : <Mail size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-navy">{log.subject}</p>
                    <p className="text-[10px] text-brand-muted">{log.channel} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="size-1.5 bg-status-completed rounded-full" />
                      <span className="text-[9px] font-bold text-status-completed uppercase tracking-widest">{log.status}</span>
                    </div>
                  </div>
                </div>
              ))}
              <AdminButton 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => toast.info("Opening full communication logs...")}
              >
                View Full Log
              </AdminButton>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
