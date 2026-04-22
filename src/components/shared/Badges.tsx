/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        pending: "bg-status-pending/10 text-status-pending border border-status-pending/20",
        assigned: "bg-status-assigned/10 text-status-assigned border border-status-assigned/20",
        progress: "bg-status-progress/10 text-status-progress border border-status-progress/20",
        completed: "bg-status-completed/10 text-status-completed border border-status-completed/20",
        closed: "bg-status-closed/10 text-status-closed border border-status-closed/20",
        cancelled: "bg-status-cancelled/10 text-status-cancelled border border-status-cancelled/20",
        urgent: "bg-status-urgent/10 text-status-urgent border border-status-urgent/20",
        emergency: "bg-status-emergency/10 text-status-emergency border border-status-emergency/20",
      },
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    icon?: React.ReactNode
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ className, status, icon, children, ...props }) => {
  return (
    <div className={cn(badgeVariants({ status }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children || (status ? status.replace('-', ' ') : '')}
    </div>
  )
}

const roleBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
  {
    variants: {
      role: {
        SUPER_ADMIN: "bg-brand-gold text-brand-navy",
        ADMIN: "bg-brand-navy text-white",
        OPS_MANAGER: "bg-blue-600 text-white",
        OPS_EXECUTIVE: "bg-blue-400 text-white",
        SUPPORT: "bg-teal-500 text-white",
        TECHNICIAN: "bg-green-600 text-white",
        HELPER: "bg-green-400 text-white",
        INVENTORY_MANAGER: "bg-orange-500 text-white",
        BILLING_EXECUTIVE: "bg-purple-500 text-white",
        FINANCE_MANAGER: "bg-purple-700 text-white",
        MARKETING_MANAGER: "bg-coral-500 text-white",
        CUSTOM: "bg-brand-navy/10 text-brand-navy",
      },
    },
    defaultVariants: {
      role: "CUSTOM",
    }
  }
)

type RoleBadgeVariant = NonNullable<VariantProps<typeof roleBadgeVariants>["role"]>;

const roleVariantMap: Record<string, RoleBadgeVariant> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  OPS_MANAGER: "OPS_MANAGER",
  OPS_EXECUTIVE: "OPS_EXECUTIVE",
  SUPPORT: "SUPPORT",
  TECHNICIAN: "TECHNICIAN",
  HELPER: "HELPER",
  INVENTORY_MANAGER: "INVENTORY_MANAGER",
  BILLING_EXECUTIVE: "BILLING_EXECUTIVE",
  FINANCE_MANAGER: "FINANCE_MANAGER",
  MARKETING_MANAGER: "MARKETING_MANAGER",
};

export interface RoleBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  role?: string | null
  label?: string
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ className, role, label, ...props }) => {
  const normalizedRole = role ? role.toUpperCase().replace(/[^A-Z0-9]+/g, "_") : "CUSTOM";
  const variant = roleVariantMap[normalizedRole] || "CUSTOM";
  const text = label || role?.replace(/_/g, " ") || "";

  return (
    <div className={cn(roleBadgeVariants({ role: variant }), className)} {...props}>
      {text}
    </div>
  )
}
