/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { PricingMatrixWidget, ConfigValueWidget } from "@/components/shared/ConfigWidgets"
import { AdminButton } from "@/components/shared/AdminButton"
import { Save, History, Info, CreditCard } from "lucide-react"
import { toast } from "sonner"

export default function PricingConfigScreen() {
  const [pricingData, setPricingData] = React.useState<Record<string, Record<string, number>>>({
    'Deep Cleaning': { '1.0 Ton': 1200, '1.5 Ton': 1500, '2.0 Ton': 1800 },
    'Gas Charging': { '1.0 Ton': 2500, '1.5 Ton': 3000, '2.0 Ton': 3500 },
    'Installation': { '1.0 Ton': 1500, '1.5 Ton': 1800, '2.0 Ton': 2200 },
  });

  const rows = ['Deep Cleaning', 'Gas Charging', 'Installation'];
  const cols = ['1.0 Ton', '1.5 Ton', '2.0 Ton'];

  const handleCellChange = (row: string, col: string, value: number) => {
    setPricingData(prev => ({
      ...prev,
      [row]: {
        ...prev[row],
        [col]: value
      }
    }));
  };

  const handleSave = () => {
    toast.success("Pricing configuration saved successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Pricing Configuration</h1>
          <p className="text-sm text-brand-muted">Manage service rates based on equipment tonnage</p>
        </div>
        <AdminButton 
          onClick={handleSave}
          iconLeft={<Save size={18} />}
        >
          Save Changes
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ConfigValueWidget 
          label="Emergency Surcharge" 
          value="25%" 
          onEdit={() => {}}
          prefix={<CreditCard size={18} />}
        />
        <ConfigValueWidget 
          label="Night Shift Surcharge" 
          value="₹500" 
          onEdit={() => {}}
          prefix={<CreditCard size={18} />}
        />
        <ConfigValueWidget 
          label="Holiday Surcharge" 
          value="15%" 
          onEdit={() => {}}
          prefix={<CreditCard size={18} />}
        />
      </div>

      <AdminCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border bg-brand-navy/[0.02] flex items-center justify-between">
          <SectionHeader title="Base Pricing Matrix (₹)" className="mb-0 border-t-0 pt-0" />
          <div className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            <Info size={14} />
            Prices are exclusive of taxes
          </div>
        </div>
        <div className="p-6">
          <PricingMatrixWidget 
            rows={rows}
            cols={cols}
            data={pricingData}
            onCellChange={handleCellChange}
          />
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <SectionHeader title="Pricing Audit Log" icon={<History size={18} />} />
        <div className="mt-4 space-y-4">
          {[
            { date: 'Today, 10:30 AM', user: 'Fayaz Ahmed', action: 'Updated Gas Charging (1.5 Ton) from ₹2800 to ₹3000' },
            { date: 'Yesterday, 04:15 PM', user: 'Admin', action: 'Increased Emergency Surcharge to 25%' },
          ].map((log, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <div className="size-2 bg-brand-gold rounded-full mt-1" />
              <div>
                <p className="font-bold text-brand-navy">{log.action}</p>
                <p className="text-brand-muted">{log.date} • {log.user}</p>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  )
}
