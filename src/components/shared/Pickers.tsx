/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Search } from "lucide-react"

interface AdminDropdownProps {
  label?: string
  options: { label: string; value: string }[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function AdminDropdown({ label, options, value, onChange, placeholder = "Select option", className }: AdminDropdownProps) {
  const selectedOption = options.find(opt => opt.value === value)
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          {label}
        </label>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(
          "flex h-10 w-full items-center justify-between rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy transition-all",
          className
        )}
        aria-label={label || placeholder}
        >
          <span className={cn(!selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={16} className="text-brand-muted" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-[12px]">
          {options.map((option) => (
            <DropdownMenuItem 
              key={option.value} 
              onClick={() => onChange(option.value)}
              className="text-sm py-2 cursor-pointer"
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface AdminBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function AdminBottomSheet({ isOpen, onClose, title, description, children, className }: AdminBottomSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className={cn("rounded-t-[24px] h-[auto] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl", className)}>
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mt-3 mb-2 opacity-20" />
        <div className="px-6 pb-8 pt-2 overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle className={cn("text-xl font-bold", className?.includes('bg-brand-navy') ? "text-white" : "text-brand-navy")}>{title}</SheetTitle>
            {description && <SheetDescription className={className?.includes('bg-brand-navy') ? "text-white/60" : ""}>{description}</SheetDescription>}
          </SheetHeader>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
