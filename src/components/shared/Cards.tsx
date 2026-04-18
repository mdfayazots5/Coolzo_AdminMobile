/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hasAccent?: boolean
  isElevated?: boolean
}

const AdminCard = React.forwardRef<HTMLDivElement, AdminCardProps>(
  ({ className, hasAccent, isElevated = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-[12px] bg-brand-surface border border-border transition-all",
          isElevated && "shadow-[0_2px_16px_rgba(0,0,0,0.06)]",
          hasAccent && "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-brand-navy",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
AdminCard.displayName = "AdminCard"

interface StatCardProps {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  color?: string
  className?: string
}

const StatCard = ({ label, value, trend, trendLabel, icon, color, className }: StatCardProps) => {
  const isPositive = trend && trend > 0
  
  return (
    <AdminCard className={cn("p-5", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            {label}
          </p>
          <h3 className="text-2xl font-bold text-brand-navy">{value}</h3>
        </div>
        {icon && (
          <div className={cn(
            "p-2 rounded-lg bg-opacity-10",
            color ? `bg-${color} text-${color}` : "bg-brand-navy/10 text-brand-navy"
          )}>
            {icon}
          </div>
        )}
      </div>
      
      {(trend !== undefined || trendLabel) && (
        <div className="mt-4 flex items-center gap-2">
          {trend !== undefined && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              isPositive ? "text-status-completed" : "text-status-emergency"
            )}>
              {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
          {trendLabel && (
            <span className="text-xs text-brand-muted">{trendLabel}</span>
          )}
        </div>
      )}
    </AdminCard>
  )
}

export { AdminCard, StatCard }
