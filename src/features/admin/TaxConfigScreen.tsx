/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { ConfigValueWidget } from "@/components/shared/ConfigWidgets"
import { AdminButton } from "@/components/shared/AdminButton"
import { FileText, Save, Plus, Info, Receipt } from "lucide-react"
import { AdminTextField } from "@/components/shared/AdminTextField"

export default function TaxConfigScreen() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Tax Configuration</h1>
          <p className="text-sm text-brand-muted">Manage GST/VAT rates and HSN/SAC codes</p>
        </div>
        <AdminButton 
          onClick={() => {}}
          iconLeft={<Save size={18} />}
        >
          Save Tax Rules
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader title="Tax Rates by Category" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-brand-navy">Labor / Service</h3>
                <div className="px-2 py-1 bg-status-completed/10 text-status-completed text-[10px] font-bold rounded">ACTIVE</div>
              </div>
              <AdminTextField label="GST Rate (%)" value="18" onChange={() => {}} />
              <AdminTextField label="SAC Code" value="9987" onChange={() => {}} />
            </AdminCard>
            <AdminCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-brand-navy">Material / Spare Parts</h3>
                <div className="px-2 py-1 bg-status-completed/10 text-status-completed text-[10px] font-bold rounded">ACTIVE</div>
              </div>
              <AdminTextField label="GST Rate (%)" value="28" onChange={() => {}} />
              <AdminTextField label="HSN Code" value="8415" onChange={() => {}} />
            </AdminCard>
          </div>

          <SectionHeader title="Invoice Numbering" />
          <AdminCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdminTextField label="Invoice Prefix" value="CZ" onChange={() => {}} />
              <AdminTextField label="Starting Number" value="10001" onChange={() => {}} />
              <div className="md:col-span-2 p-4 bg-brand-navy/5 rounded-xl border border-dashed border-brand-navy/20">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2">Preview Format</p>
                <p className="text-xl font-mono font-bold text-brand-navy">CZ-2024-04-10001</p>
              </div>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <SectionHeader title="Tax Summary Preview" icon={<Receipt size={18} />} />
          <AdminCard className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Service Base Price</span>
                <span className="font-bold text-brand-navy">₹1,500.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">GST (18%)</span>
                <span className="font-bold text-brand-navy">₹270.00</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-bold text-brand-navy">Total Amount</span>
                <span className="font-bold text-brand-gold">₹1,770.00</span>
              </div>
            </div>
            <div className="mt-8 p-4 bg-brand-gold/5 rounded-xl border border-brand-gold/20 flex items-start gap-3">
              <Info size={16} className="text-brand-gold shrink-0 mt-0.5" />
              <p className="text-[10px] text-brand-navy leading-relaxed">
                Tax rates are applied automatically based on the service category. Ensure HSN/SAC codes are accurate for compliance.
              </p>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
