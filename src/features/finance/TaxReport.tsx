/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { paymentRepository } from "@/core/network/payment-repository"
import { 
  FileText, 
  Download, 
  ChevronLeft, 
  Calendar, 
  ShieldCheck, 
  PieChart,
  Table as TableIcon,
  ArrowRight
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function TaxReport() {
  const navigate = useNavigate();
  const [taxData, setTaxData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchTax = async () => {
      try {
        const data = await paymentRepository.getTaxSummary('April 2024');
        setTaxData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTax();
  }, [])

  if (isLoading || !taxData) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Tax Liability Report</h1>
            <p className="text-sm text-brand-muted">GST output tax summary for April 2024</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Download size={18} />}>Export for GST Filing</AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TaxMetricCard label="Total Output GST" value={`₹${taxData.totalGst.toLocaleString()}`} color="navy" />
        <TaxMetricCard label="GST on Labor (18%)" value={`₹${taxData.laborGst.toLocaleString()}`} color="gold" />
        <TaxMetricCard label="GST on Parts (18%)" value={`₹${taxData.partsGst.toLocaleString()}`} color="muted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminCard className="lg:col-span-2 p-8">
          <SectionHeader title="HSN/SAC Code Breakdown" icon={<TableIcon size={18} />} />
          <div className="overflow-x-auto mt-6">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">HSN/SAC Code</th>
                  <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Description</th>
                  <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Taxable Amount</th>
                  <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">GST Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {taxData.hsnBreakdown.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="py-4 text-sm font-bold text-brand-navy">{item.code}</td>
                    <td className="py-4 text-xs text-brand-muted">{item.description}</td>
                    <td className="py-4 text-sm text-right text-brand-navy">₹{item.amount.toLocaleString()}</td>
                    <td className="py-4 text-sm text-right font-bold text-brand-navy">₹{item.tax.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <AdminCard className="lg:col-span-1 p-8">
          <SectionHeader title="Compliance Status" icon={<ShieldCheck size={18} />} />
          <div className="mt-6 space-y-6">
            <div className="p-4 bg-status-completed/5 border border-status-completed/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-2 bg-status-completed rounded-full" />
                <p className="text-xs font-bold text-status-completed uppercase tracking-widest">Ready for Filing</p>
              </div>
              <p className="text-xs text-brand-muted">All invoices for this period have verified tax calculations.</p>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Filing Deadlines</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-navy font-bold">GSTR-1</span>
                <span className="text-xs text-status-emergency font-bold">May 11, 2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-navy font-bold">GSTR-3B</span>
                <span className="text-xs text-status-emergency font-bold">May 20, 2024</span>
              </div>
            </div>

            <AdminButton className="w-full" variant="outline">
              View Tax Reconciliation
            </AdminButton>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function TaxMetricCard({ label, value, color }: any) {
  const colors: any = {
    navy: "bg-brand-navy text-white",
    gold: "bg-brand-gold text-brand-navy",
    muted: "bg-white border border-border text-brand-navy"
  };
  return (
    <AdminCard className={cn("p-6", colors[color])}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </AdminCard>
  )
}
