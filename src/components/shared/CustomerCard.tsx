/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Customer } from "@/core/network/customer-repository"
import { AdminCard } from "./Cards"
import { StatusBadge } from "./Badges"
import { 
  User, 
  Phone, 
  ShieldCheck, 
  ChevronRight, 
  Calendar,
  AlertTriangle,
  CreditCard
} from "lucide-react"

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
  className?: string;
}

export function CustomerCard({ customer, onClick, className }: CustomerCardProps) {
  const typeColors = {
    residential: 'bg-blue-50 text-blue-600 border-blue-100',
    commercial: 'bg-purple-50 text-purple-600 border-purple-100',
    enterprise: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };

  return (
    <AdminCard 
      onClick={onClick}
      className={cn(
        "p-4 hover:border-brand-gold transition-all cursor-pointer group relative overflow-hidden",
        customer.riskLevel === 'high' && "border-status-emergency/30",
        className
      )}
    >
      {customer.riskLevel !== 'low' && (
        <div className={cn(
          "absolute top-0 right-0 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-bl-lg flex items-center gap-1",
          customer.riskLevel === 'high' ? "bg-status-emergency text-white" : "bg-status-urgent text-white"
        )}>
          <AlertTriangle size={8} />
          {customer.riskLevel} Risk
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-brand-gold transition-colors">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-bold text-brand-navy group-hover:text-brand-gold transition-colors">
              {customer.name}
            </h3>
            <div className={cn(
              "inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border mt-0.5",
              typeColors[customer.type]
            )}>
              {customer.type}
            </div>
          </div>
        </div>
        <StatusBadge status={customer.amcStatus === 'active' ? 'completed' : 'closed'}>
          {customer.amcStatus === 'active' ? 'AMC Active' : 'No AMC'}
        </StatusBadge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-brand-muted">
          <Phone size={12} />
          <span className="text-xs">{customer.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-brand-muted">
          <Calendar size={12} />
          <span className="text-xs">Customer since {customer.customerSince}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
        <div>
          <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Total Bookings</p>
          <p className="text-sm font-bold text-brand-navy">{customer.totalServices}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">Outstanding</p>
          <p className={cn(
            "text-sm font-bold",
            customer.outstandingAmount > 0 ? "text-status-emergency" : "text-status-completed"
          )}>
            ₹{customer.outstandingAmount}
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-brand-muted group-hover:text-brand-gold transition-colors">
        <ChevronRight size={18} />
      </div>
    </AdminCard>
  )
}
