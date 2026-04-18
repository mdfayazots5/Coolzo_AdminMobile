/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { invoiceRepository, ARAgingBucket, Invoice } from "@/core/network/invoice-repository"
import { toast } from "sonner"
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  Clock, 
  User, 
  ArrowUpRight,
  MessageSquare,
  Phone,
  Mail,
  Download
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function ARDashboard() {
  const navigate = useNavigate();
  const [aging, setAging] = React.useState<ARAgingBucket[]>([])
  const [overdue, setOverdue] = React.useState<Invoice[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [agingData, overdueData] = await Promise.all([
          invoiceRepository.getARAging(),
          invoiceRepository.getOverdueInvoices()
        ]);
        setAging(agingData);
        setOverdue(overdueData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [])

  const totalOutstanding = aging.reduce((acc, b) => acc + b.amount, 0);

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Accounts Receivable</h1>
          <p className="text-sm text-brand-muted">Aging analysis and payment follow-up management</p>
        </div>
        <div className="flex gap-2">
          <AdminButton 
            variant="outline" 
            icon={<Download size={18} />}
            onClick={() => toast.success('Aging report exported successfully.')}
          >
            Export Aging Report
          </AdminButton>
        </div>
      </div>

      {/* Aging Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <AdminCard className="lg:col-span-1 p-8 bg-brand-navy text-brand-gold flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Total Outstanding</p>
          <p className="text-4xl font-bold mb-4">₹{(totalOutstanding / 1000).toFixed(1)}k</p>
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp size={14} />
            <span>+8% from last month</span>
          </div>
        </AdminCard>

        <AdminCard className="lg:col-span-3 p-8">
          <SectionHeader title="AR Aging Buckets" icon={<BarChart3 size={18} />} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {aging.map((bucket, i) => (
              <div key={i} className="p-4 bg-brand-navy/5 rounded-2xl relative overflow-hidden group">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">{bucket.label}</p>
                <p className="text-xl font-bold text-brand-navy">₹{(bucket.amount / 1000).toFixed(1)}k</p>
                <p className="text-[10px] font-medium text-brand-muted">{bucket.count} Invoices</p>
                <div className={cn("absolute bottom-0 left-0 h-1 transition-all group-hover:w-full", bucket.color.replace('bg-', 'w-1/2 bg-'))} />
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Invoices */}
        <AdminCard className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-6">
            <SectionHeader title="Critical Overdue Invoices" icon={<AlertCircle size={18} />} />
            <AdminButton variant="outline" size="sm" onClick={() => navigate('/billing/invoices?status=overdue')}>View All</AdminButton>
          </div>
          <div className="space-y-4">
            {overdue.map((inv, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-border rounded-2xl hover:border-brand-gold transition-all group">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className="size-10 bg-status-emergency/10 text-status-emergency rounded-xl flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{inv.customerName}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">{inv.invoiceNumber} • Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-8">
                  <div className="text-right">
                    <p className="text-sm font-bold text-status-emergency">₹{inv.balanceDue.toLocaleString()}</p>
                    <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Balance Due</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toast.info('WhatsApp reminder sent.')}
                      className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy hover:bg-brand-navy/10 transition-colors"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button 
                      onClick={() => toast.info('Initiating collection call...')}
                      className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy hover:bg-brand-navy/10 transition-colors"
                    >
                      <Phone size={16} />
                    </button>
                    <button onClick={() => navigate(`/billing/invoices/${inv.id}`)} className="p-2 text-brand-gold hover:translate-x-1 transition-transform">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {overdue.length === 0 && (
              <p className="text-center py-10 text-brand-muted italic">No critical overdue invoices found.</p>
            )}
          </div>
        </AdminCard>

        {/* Top Debtors */}
        <AdminCard className="lg:col-span-1 p-8">
          <SectionHeader title="Top Debtors" icon={<User size={18} />} />
          <div className="mt-6 space-y-6">
            {[
              { name: 'Tech Park Solutions', amount: 45000, type: 'Corporate' },
              { name: 'Grand Plaza Hotel', amount: 32000, type: 'Corporate' },
              { name: 'Aditi Sharma', amount: 12500, type: 'Individual' },
              { name: 'Rajesh Khanna', amount: 8400, type: 'Individual' },
            ].map((debtor, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy font-bold text-xs">
                    {debtor.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-navy">{debtor.name}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">{debtor.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-brand-navy">₹{debtor.amount.toLocaleString()}</p>
                  <AdminButton 
                    variant="ghost" 
                    className="h-6 text-[8px] px-1 text-brand-gold"
                    onClick={() => toast.success(`Payment reminder sent to ${debtor.name}`)}
                  >
                    Remind
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
          <AdminButton 
            className="w-full mt-8" 
            variant="outline"
            onClick={() => navigate('/billing/invoices?status=overdue')}
          >
            View Full Debtor List
          </AdminButton>
        </AdminCard>
      </div>
    </div>
  )
}
