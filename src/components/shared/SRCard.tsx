/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { ServiceRequest } from "@/core/network/service-request-repository"
import { AdminCard } from "./Cards"
import { StatusBadge } from "./Badges"
import { 
  MapPin, 
  Calendar, 
  User, 
  AlertCircle, 
  ChevronRight,
  Clock,
  ShieldCheck
} from "lucide-react"

interface SRCardProps {
  sr: ServiceRequest;
  onClick?: () => void;
  className?: string;
}

export function SRCard({ sr, onClick, className }: SRCardProps) {
  const priorityColors = {
    normal: 'bg-brand-navy/5 text-brand-navy',
    urgent: 'bg-status-urgent/10 text-status-urgent',
    emergency: 'bg-status-emergency/10 text-status-emergency'
  };

  const statusColors = {
    pending: 'urgent',
    assigned: 'processing',
    'on-site': 'processing',
    completed: 'completed',
    closed: 'closed',
    cancelled: 'closed'
  } as const;

  return (
    <AdminCard 
      onClick={onClick}
      className={cn(
        "p-4 hover:border-brand-gold transition-all cursor-pointer group relative overflow-hidden",
        sr.isEscalated && "border-status-emergency/30",
        className
      )}
    >
      {sr.isEscalated && (
        <div className="absolute top-0 right-0 bg-status-emergency text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
          <AlertCircle size={8} />
          Escalated
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-brand-navy">{sr.srNumber}</span>
          <div className={cn(
            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
            priorityColors[sr.priority]
          )}>
            {sr.priority}
          </div>
        </div>
        <StatusBadge status={statusColors[sr.status]}>
          {sr.status}
        </StatusBadge>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-brand-navy truncate group-hover:text-brand-gold transition-colors">
            {sr.customer.name}
          </h3>
          <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">
            {sr.serviceType}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-brand-muted">
            <MapPin size={12} className="shrink-0" />
            <span className="text-[11px] truncate">{sr.location.zoneId}</span>
          </div>
          <div className="flex items-center gap-2 text-brand-muted">
            <Calendar size={12} className="shrink-0" />
            <span className="text-[11px] truncate">{sr.scheduling.requestedDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy">
              <User size={12} />
            </div>
            <span className="text-[11px] font-bold text-brand-navy truncate max-w-[100px]">
              {sr.scheduling.assignedTechnicianName || 'Unassigned'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {sr.customer.isAMC && (
              <div className="p-1 bg-brand-gold/10 text-brand-gold rounded" title="AMC Customer">
                <ShieldCheck size={12} />
              </div>
            )}
            <ChevronRight size={16} className="text-brand-muted group-hover:text-brand-gold transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </AdminCard>
  )
}
