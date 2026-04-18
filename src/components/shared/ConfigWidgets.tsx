/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Edit2 } from "lucide-react"

interface ConfigValueWidgetProps {
  label: string;
  value: string | number;
  onEdit?: () => void;
  className?: string;
  prefix?: React.ReactNode;
}

export function ConfigValueWidget({ label, value, onEdit, className, prefix }: ConfigValueWidgetProps) {
  return (
    <div className={cn("flex items-center justify-between p-4 bg-brand-navy/5 rounded-xl border border-brand-navy/10", className)}>
      <div className="flex items-center gap-3">
        {prefix && <div className="text-brand-navy">{prefix}</div>}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{label}</p>
          <p className="text-sm font-bold text-brand-navy">{value}</p>
        </div>
      </div>
      {onEdit && (
        <button 
          onClick={onEdit}
          className="p-2 hover:bg-brand-navy/10 rounded-lg text-brand-muted hover:text-brand-navy transition-all"
        >
          <Edit2 size={14} />
        </button>
      )}
    </div>
  )
}

interface PricingMatrixWidgetProps {
  rows: string[];
  cols: string[];
  data: Record<string, Record<string, number>>;
  onCellChange?: (row: string, col: string, value: number) => void;
}

export function PricingMatrixWidget({ rows, cols, data, onCellChange }: PricingMatrixWidgetProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-brand-navy/5">
            <th className="p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy border-b border-border">Service / Tonnage</th>
            {cols.map(col => (
              <th key={col} className="p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy text-center border-b border-border">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row} className="hover:bg-brand-navy/[0.02] transition-colors">
              <td className="p-4 text-sm font-bold text-brand-navy border-b border-border capitalize">
                {row}
              </td>
              {cols.map(col => {
                const value = data[row]?.[col] || 0;
                return (
                  <td key={col} className="p-4 border-b border-border text-center">
                    <input 
                      type="number"
                      value={value}
                      onChange={(e) => onCellChange?.(row, col, parseFloat(e.target.value))}
                      className="w-20 bg-white border border-border rounded px-2 py-1 text-xs font-bold text-brand-navy focus:border-brand-gold outline-none text-center"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
