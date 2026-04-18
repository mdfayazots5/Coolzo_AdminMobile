/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Technician } from "@/core/network/technician-repository"
import { AdminCard } from "./Cards"
import { StatusBadge } from "./Badges"
import { 
  User, 
  MapPin, 
  Star, 
  Briefcase, 
  Clock, 
  ChevronRight,
  ShieldCheck
} from "lucide-react"

interface TechnicianCardProps {
  technician: Technician;
  onClick?: () => void;
  className?: string;
}

export function TechnicianCard({ technician, onClick, className }: TechnicianCardProps) {
  const statusColors = {
    'available': 'completed',
    'on-job': 'assigned',
    'off-duty': 'closed',
    'on-leave': 'urgent'
  } as const;

  return (
    <AdminCard 
      onClick={onClick}
      className={cn(
        "p-4 hover:border-brand-gold transition-all cursor-pointer group relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-12 bg-brand-navy/5 rounded-2xl flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-brand-gold transition-colors overflow-hidden border border-brand-navy/10">
            {technician.photo ? (
              <img src={technician.photo} alt={technician.name} className="size-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={24} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-brand-navy group-hover:text-brand-gold transition-colors">
              {technician.name}
            </h3>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">
              {technician.employeeId} • {technician.designation}
            </p>
          </div>
        </div>
        <StatusBadge status={statusColors[technician.status]}>
          {technician.status.replace('-', ' ')}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-muted">
            <MapPin size={12} className="text-brand-gold" />
            <span className="text-[11px] font-medium">{technician.zones.join(', ')}</span>
          </div>
          <div className="flex items-center gap-2 text-brand-muted">
            <Star size={12} className="text-status-pending fill-status-pending" />
            <span className="text-[11px] font-bold text-brand-navy">{technician.rating} Rating</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-muted">
            <Briefcase size={12} />
            <span className="text-[11px] font-medium">{technician.todayJobCount} Jobs Today</span>
          </div>
          <div className="flex items-center gap-2 text-brand-muted">
            <Clock size={12} />
            <span className="text-[11px] font-medium">Next: {technician.nextFreeSlot || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {technician.skills.slice(0, 3).map(skill => (
          <span key={skill.id} className="px-2 py-0.5 bg-brand-navy/5 text-[9px] font-bold text-brand-navy rounded border border-brand-navy/10 uppercase tracking-tighter">
            {skill.name}
          </span>
        ))}
        {technician.skills.length > 3 && (
          <span className="px-2 py-0.5 bg-brand-navy/5 text-[9px] font-bold text-brand-muted rounded border border-brand-navy/10">
            +{technician.skills.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-[10px] font-bold text-status-completed uppercase tracking-widest">
          <ShieldCheck size={12} />
          {technician.performance.slaCompliance}% SLA
        </div>
        <ChevronRight size={16} className="text-brand-muted group-hover:text-brand-gold transition-transform group-hover:translate-x-1" />
      </div>
    </AdminCard>
  )
}

export function PerformanceKPIBlock({ label, value, subValue, trend, icon, colorClass }: {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: { val: number; positive: boolean };
  icon: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <AdminCard className="p-5">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-xl", colorClass || "bg-brand-navy/5 text-brand-navy")}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            trend.positive ? "bg-status-completed/10 text-status-completed" : "bg-status-emergency/10 text-status-emergency"
          )}>
            {trend.positive ? '+' : '-'}{trend.val}%
          </div>
        )}
      </div>
      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-brand-navy">{value}</h3>
      {subValue && <p className="text-xs text-brand-muted mt-1">{subValue}</p>}
    </AdminCard>
  )
}
