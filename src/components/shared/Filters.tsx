/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface FilterChipProps {
  label: string
  isActive?: boolean
  onClick: () => void
  onRemove?: () => void
  className?: string
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, isActive, onClick, onRemove, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
        isActive 
          ? "bg-brand-gold text-brand-navy shadow-sm" 
          : "bg-transparent border border-brand-navy text-brand-navy hover:bg-brand-navy/5",
        className
      )}
    >
      {label}
      {isActive && onRemove && (
        <span 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-brand-navy/10 rounded-full p-0.5"
        >
          <X size={12} />
        </span>
      )}
    </button>
  )
}

interface FilterBarProps {
  filters: { id: string; label: string; isActive: boolean }[]
  onFilterToggle: (id: string) => void
  onClearAll?: () => void
  className?: string
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterToggle, onClearAll, className }) => {
  const activeCount = filters.filter(f => f.isActive).length

  return (
    <div className={cn("flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar", className)}>
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          label={filter.label}
          isActive={filter.isActive}
          onClick={() => onFilterToggle(filter.id)}
        />
      ))}
      {activeCount > 0 && onClearAll && (
        <button 
          onClick={onClearAll}
          className="text-xs font-bold text-brand-gold uppercase tracking-wider hover:underline ml-2 whitespace-nowrap"
        >
          Clear All ({activeCount})
        </button>
      )}
    </div>
  )
}
