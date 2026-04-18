/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { AdminButton } from "./AdminButton"
import { Skeleton } from "@/components/ui/skeleton"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({ title, description, icon, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center space-y-4", className)}>
      <div className="w-20 h-20 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy/40">
        {icon || (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-brand-navy">{title}</h3>
        <p className="text-sm text-brand-muted max-w-xs mx-auto">{description}</p>
      </div>
      {actionLabel && onAction && (
        <AdminButton onClick={onAction} variant="primary" className="mt-2">
          {actionLabel}
        </AdminButton>
      )}
    </div>
  )
}

export const SkeletonLoader = {
  Card: () => (
    <div className="p-5 rounded-[12px] border border-border bg-brand-surface space-y-4 shadow-sm">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="size-10 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  ),
  List: () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 rounded-[12px] border border-border bg-brand-surface flex items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  ),
  Table: () => (
    <div className="rounded-[12px] border border-border bg-brand-surface overflow-hidden">
      <div className="h-12 bg-brand-navy/[0.02] border-b border-border flex items-center px-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3 flex-1" />)}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 border-b border-border last:border-0 flex items-center px-4 gap-4">
          {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
        </div>
      ))}
    </div>
  )
}
