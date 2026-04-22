/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Clock,
  Download,
  MessageSquare,
  User,
} from "lucide-react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminButton } from "@/components/shared/AdminButton"
import { AccountsReceivableDashboard, invoiceRepository } from "@/core/network/invoice-repository"
import { cn } from "@/lib/utils"

export default function ARDashboard() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = React.useState<AccountsReceivableDashboard | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await invoiceRepository.getAccountsReceivableDashboard()
        setDashboard(data)
      } catch (error) {
        console.error(error)
        toast.error("Unable to load receivables dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  if (isLoading || !dashboard) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Accounts Receivable</h1>
          <p className="text-sm text-brand-muted">Aging buckets, overdue recovery, and customer follow-up</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Download size={18} />} onClick={() => toast.success("AR export prepared")}>
            Export Aging Report
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <AdminCard className="p-8 bg-brand-navy text-brand-gold lg:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Outstanding</p>
          <p className="mt-3 text-4xl font-bold">₹{dashboard.totalOutstanding.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
            <ArrowUpRight size={14} />
            <span>Collections need daily follow-up</span>
          </div>
        </AdminCard>

        <AdminCard className="p-8 lg:col-span-3">
          <SectionHeader title="Aging Buckets" icon={<BarChart3 size={18} />} />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {dashboard.aging.map((bucket) => (
              <div key={bucket.label} className="relative overflow-hidden rounded-2xl bg-brand-navy/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{bucket.label}</p>
                <p className="mt-2 text-xl font-bold text-brand-navy">₹{bucket.amount.toLocaleString()}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-muted">{bucket.count} invoices</p>
                <div className={cn("absolute bottom-0 left-0 h-1 w-1/2", bucket.color)} />
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AdminCard className="p-8 xl:col-span-2">
          <div className="flex items-center justify-between">
            <SectionHeader title="Overdue Invoice Queue" icon={<AlertCircle size={18} />} />
            <AdminButton variant="outline" size="sm" onClick={() => navigate("/billing/invoices?status=overdue")}>
              View All
            </AdminButton>
          </div>
          <div className="mt-6 space-y-4">
            {dashboard.overdueInvoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-col gap-4 rounded-3xl border border-border p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-status-emergency/10 text-status-emergency">
                    <Clock size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{invoice.customerName}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">
                      {invoice.invoiceNumber} • Due {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-6 lg:justify-end">
                  <div className="text-right">
                    <p className="text-sm font-bold text-status-emergency">₹{invoice.balanceDue.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">Balance due</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await invoiceRepository.sendPaymentReminder(invoice.id)
                        toast.success(`Reminder sent for ${invoice.invoiceNumber}`)
                      }}
                      className="rounded-lg bg-brand-navy/5 p-2 text-brand-navy transition-colors hover:bg-brand-navy/10"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/billing/invoices/${invoice.id}`)}
                      className="rounded-lg p-2 text-brand-gold transition-transform hover:translate-x-1"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="p-8">
          <SectionHeader title="Top Outstanding Customers" icon={<User size={18} />} />
          <div className="mt-6 space-y-5">
            {dashboard.topOutstandingCustomers.map((customer) => (
              <div key={customer.customerId} className="rounded-2xl bg-brand-navy/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{customer.customerName}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">{customer.customerType}</p>
                  </div>
                  <button
                    onClick={async () => {
                      const invoice = dashboard.overdueInvoices.find((item) => item.customerId === customer.customerId)
                      if (!invoice) {
                        toast.info("No direct overdue invoice found for reminder")
                        return
                      }
                      await invoiceRepository.sendPaymentReminder(invoice.id)
                      toast.success(`Reminder sent to ${customer.customerName}`)
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest text-brand-gold"
                  >
                    Remind
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-status-emergency">₹{customer.outstandingAmount.toLocaleString()}</span>
                  <span className="text-[10px] uppercase tracking-widest text-brand-muted">{customer.overdueInvoices} overdue</span>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
