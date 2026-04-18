/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export function SectionHeader({ title, actionLabel, onAction, className, icon }: { 
  title: string; 
  actionLabel?: string; 
  onAction?: () => void;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between border-t border-brand-navy/10 pt-4 mb-4", className)}>
      <div className="flex items-center gap-2">
        {icon && <div className="text-brand-navy">{icon}</div>}
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-widest">{title}</h3>
      </div>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="text-xs font-bold text-brand-gold uppercase tracking-wider hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function PhotoGrid({ photos, onPhotoClick }: { 
  photos: string[]; 
  onPhotoClick?: (photo: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo, i) => (
        <div 
          key={i} 
          className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onPhotoClick?.(photo)}
        >
          <img 
            src={photo} 
            alt={`Job photo ${i + 1}`} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ))}
    </div>
  )
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center p-4", className)}>
      <Loader2 className="animate-spin text-brand-navy size-6" />
    </div>
  )
}

export function FullPageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 bg-brand-navy/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white">
      <div className="w-16 h-16 bg-brand-gold rounded-2xl flex items-center justify-center mb-6 animate-pulse">
        <span className="text-brand-navy text-2xl font-bold">C</span>
      </div>
      <p className="text-brand-gold font-bold tracking-widest uppercase text-xs">{label}</p>
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-4">
        <div className="h-full bg-brand-gold animate-progress-indeterminate" />
      </div>
    </div>
  )
}
