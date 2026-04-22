/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircle,
  Building2,
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Filter,
  MessageSquare,
  Plus,
  Search,
  User,
} from "lucide-react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminButton } from "@/components/shared/AdminButton"
import {
  AccountsReceivableDashboard,
  Invoice,
  InvoiceStatus,
  invoiceRepository,
} from "@/core/network/invoice-repository"
import { cn } from "@/lib/utils"

export default function InvoiceListScreen() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = React.useState<AccountsReceivableDashboard | null>(null)
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<InvoiceStatus | "all">("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [invoiceData, arDashboard] = await Promise.all([
        invoiceRepository.getInvoices({ status: filter, search: searchQuery }),
        invoiceRepository.getAccountsReceivableDashboard(),
      ])
      setInvoices(invoiceData)
      setDashboard(arDashboard)
    } catch (error) {
      console.error(error)
      toast.error("Unable to load invoices")
    } finally {
      setIsLoading(false)
    }
  }, [filter, searchQuery])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  const handleBulkExport = async (format: "csv" | "pdf") => {
    try {
      await invoiceRepository.bulkExportInvoices({ format })
      toast.success(`Invoice ${format.toUpperCase()} export prepared`)
    } catch (error) {
      toast.error("Bulk export failed")
    }
  }

  const handleCreateCorporateInvoice = async () => {
    try {
      const invoice = await invoiceRepository.createCorporateInvoice("corporate-account")
      toast.success("Corporate invoice generated")
      navigate(`/billing/invoices/${invoice.id}`)
    } catch (error) {
      toast.error("Unable to generate corporate invoice")
    }
  }

  const handleCreateProforma = async () => {
    try {
      const invoice = await invoiceRepository.createProformaInvoice("proforma-customer")
      toast.success("Proforma invoice generated")
      navigate(`/billing/invoices/${invoice.id}`)
    } catch (error) {
      toast.error("Unable to generate proforma invoice")
    }
  }

  const filteredInvoices = invoices
    .filter((invoice) => {
      const normalizedQuery = searchQuery.trim().toLowerCase()
      if (!normalizedQuery) {
        return true
      }

      return (
        invoice.invoiceNumber.toLowerCase().includes(normalizedQuery) ||
        invoice.customerName.toLowerCase().includes(normalizedQuery) ||
        invoice.srNumber.toLowerCase().includes(normalizedQuery)
      )
    })
    .sort((left, right) => new Date(right.issueDate).getTime() - new Date(left.issueDate).getTime())

  if (isLoading || !dashboard) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Invoices & Billing</h1>
          <p className="text-sm text-brand-muted">Billing operations, reminders, exports, and receivable follow-up</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton variant="outline" icon={<Download size={18} />} onClick={() => handleBulkExport("csv")}>
            Export CSV
          </AdminButton>
          <AdminButton variant="outline" icon={<Building2 size={18} />} onClick={handleCreateCorporateInvoice}>
            Corporate Invoice
          </AdminButton>
          <AdminButton variant="outline" icon={<FileText size={18} />} onClick={handleCreateProforma}>
            Proforma Invoice
          </AdminButton>
          <AdminButton icon={<Plus size={18} />} onClick={() => navigate("/billing/new")}>
            Create Manual Invoice
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <AdminCard className="xl:col-span-3 p-8 bg-brand-navy text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Outstanding Collection Watch</p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-4xl font-bold">₹{dashboard.totalOutstanding.toLocaleString()}</p>
              <p className="mt-2 text-sm text-white/70">Total outstanding across current AR buckets</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {dashboard.aging.map((bucket) => (
                <div key={bucket.label} className="rounded-3xl bg-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{bucket.label}</p>
                  <p className="mt-2 text-lg font-bold">₹{bucket.amount.toLocaleString()}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/60">{bucket.count} invoices</p>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6 border-status-emergency/20 bg-status-emergency/5">
          <SectionHeader title="Reminder Queue" icon={<AlertCircle size={18} />} />
          <div className="mt-4 space-y-4">
            {dashboard.overdueInvoices.slice(0, 2).map((invoice) => (
              <div key={invoice.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-brand-navy">{invoice.customerName}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-muted">{invoice.invoiceNumber}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-status-emergency">₹{invoice.balanceDue.toLocaleString()}</span>
                  <button
                    onClick={async () => {
                      await invoiceRepository.sendPaymentReminder(invoice.id)
                      toast.success(`Reminder sent for ${invoice.invoiceNumber}`)
                    }}
                    className="rounded-xl bg-brand-navy px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-gold"
                  >
                    Remind
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search by invoice, customer, or SR number..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-2xl border border-border bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
          <FilterButton active={filter === "unpaid"} onClick={() => setFilter("unpaid")} label="Unpaid" />
          <FilterButton active={filter === "paid"} onClick={() => setFilter("paid")} label="Paid" />
          <FilterButton active={filter === "overdue"} onClick={() => setFilter("overdue")} label="Overdue" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <AdminCard className="overflow-hidden xl:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-brand-navy/[0.02] text-left">
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Invoice</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Customer</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Amount</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Status</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Due Date</th>
                  <th className="p-6 text-right text-[10px] font-bold uppercase tracking-widest text-brand-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group hover:bg-brand-navy/[0.01]"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-navy">{invoice.invoiceNumber}</p>
                          <p className="text-[10px] uppercase tracking-widest text-brand-muted">{invoice.srNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        {invoice.customerType === "corporate" ? <Building2 size={14} className="text-brand-muted" /> : <User size={14} className="text-brand-muted" />}
                        <div>
                          <p className="text-xs font-bold text-brand-navy">{invoice.customerName}</p>
                          <p className="text-[10px] uppercase tracking-widest text-brand-muted">{invoice.customerType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-bold text-brand-navy">₹{invoice.netPayable.toLocaleString()}</p>
                      <p className="text-[10px] uppercase tracking-widest text-brand-muted">Balance ₹{invoice.balanceDue.toLocaleString()}</p>
                    </td>
                    <td className="p-6">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-brand-muted" />
                        <span className={cn("text-xs font-bold", invoice.status === "overdue" ? "text-status-emergency" : "text-brand-navy")}>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.status === "overdue" && (
                          <button
                            onClick={async () => {
                              await invoiceRepository.sendPaymentReminder(invoice.id)
                              toast.success(`Reminder sent for ${invoice.invoiceNumber}`)
                            }}
                            className="rounded-lg p-2 text-brand-muted transition-colors hover:bg-brand-navy/5 hover:text-brand-gold"
                          >
                            <MessageSquare size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/billing/invoices/${invoice.id}`)}
                          className="rounded-lg p-2 text-brand-muted transition-colors hover:text-brand-gold"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <SectionHeader title="Top Outstanding" icon={<Filter size={18} />} />
          <div className="mt-4 space-y-4">
            {dashboard.topOutstandingCustomers.map((customer) => (
              <div key={customer.customerId} className="rounded-2xl bg-brand-navy/5 p-4">
                <p className="text-sm font-bold text-brand-navy">{customer.customerName}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-muted">{customer.customerType}</p>
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

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all",
        active ? "bg-brand-navy text-brand-gold" : "border border-border bg-white text-brand-muted hover:border-brand-gold",
      )}
    >
      {label}
    </button>
  )
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const statusMap: Record<InvoiceStatus, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-brand-navy/5 text-brand-navy" },
    sent: { label: "Sent", className: "bg-brand-gold/10 text-brand-gold" },
    unpaid: { label: "Unpaid", className: "bg-brand-navy/5 text-brand-navy" },
    partially_paid: { label: "Partial", className: "bg-brand-gold/10 text-brand-gold" },
    paid: { label: "Paid", className: "bg-status-completed/10 text-status-completed" },
    overdue: { label: "Overdue", className: "bg-status-emergency/10 text-status-emergency" },
    cancelled: { label: "Cancelled", className: "bg-brand-muted/10 text-brand-muted" },
    bad_debt: { label: "Bad Debt", className: "bg-brand-navy text-white" },
  }

  const config = statusMap[status]
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", config.className)}>
      {config.label}
    </span>
  )
}
