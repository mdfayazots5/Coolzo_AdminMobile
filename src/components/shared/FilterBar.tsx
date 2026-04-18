/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, Filter, X } from "lucide-react"

interface FilterBarProps {
  onSearch: (query: string) => void;
  onFilter: () => void;
  placeholder?: string;
  className?: string;
}

export function FilterBar({ onSearch, onFilter, placeholder = "Search...", className }: FilterBarProps) {
  const [query, setQuery] = React.useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
        <input 
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-sm focus:border-brand-gold outline-none transition-all"
        />
        {query && (
          <button 
            onClick={() => { setQuery(""); onSearch(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-navy"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <button 
        onClick={onFilter}
        className="p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-brand-navy hover:bg-brand-navy/10 transition-all flex items-center gap-2"
      >
        <Filter size={18} />
        <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Filters</span>
      </button>
    </div>
  )
}
