/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineItemProps {
  icon?: React.ReactNode
  title: string
  timestamp: string
  actor?: string
  description?: string
  isLast?: boolean
}

export function TimelineItem({ icon, title, timestamp, actor, description, isLast }: TimelineItemProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="size-8 rounded-full bg-brand-navy/5 flex items-center justify-center text-brand-navy z-10 border-2 border-brand-white">
          {icon || <div className="size-2 rounded-full bg-brand-navy" />}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border -my-1" />}
      </div>
      <div className="pb-8 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-sm font-bold text-brand-navy">{title}</h4>
          <span className="text-[11px] font-medium text-brand-muted whitespace-nowrap">{timestamp}</span>
        </div>
        {actor && <p className="text-xs font-semibold text-brand-gold uppercase tracking-wider">{actor}</p>}
        {description && <p className="text-sm text-brand-muted leading-relaxed">{description}</p>}
      </div>
    </div>
  )
}

interface PriorityIndicatorProps {
  priority: "normal" | "urgent" | "emergency"
  className?: string
}

export function PriorityIndicator({ priority, className }: PriorityIndicatorProps) {
  const colors = {
    normal: "bg-status-closed",
    urgent: "bg-status-urgent",
    emergency: "bg-status-emergency",
  }
  
  return (
    <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-[12px]", colors[priority], className)} />
  )
}
