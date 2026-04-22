/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Search,
  ShieldCheck,
} from "lucide-react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminButton } from "@/components/shared/AdminButton"
import { Payment, PaymentMethod, PaymentStatus, paymentRepository } from "@/core/network/payment-repository"
import { cn } from "@/lib/utils"

export default function PaymentListScreen() {
  const navigate = useNavigate()
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [unmatched, setUnmatched] = React.useState<Payment[]>([])
  const [codPending, setCodPending] = React.useState<Payment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<PaymentStatus | "all">("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const loadPayments = async () => {
      try {
        const [paymentList, unmatchedList, codList] = await Promise.all([
          paymentRepository.getPayments({ status: statusFilter }),
          paymentRepository.getUnmatchedPayments(),
          paymentRepository.getCodPending(),
        ])
        setPayments(paymentList)
        setUnmatched(unmatchedList)
        setCodPending(codList)
      } catch (error) {
        console.error(error)
        toast.error("Unable to load payments")
      } finally {
        setIsLoading(false)
      }
    }

    void loadPayments()
  }, [statusFilter])

  const filteredPayments = payments.filter((payment) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return true
    }

    return (
      payment.paymentId.toLowerCase().includes(query) ||
      payment.customerName.toLowerCase().includes(query) ||
      payment.invoiceNumber.toLowerCase().includes(query) ||
      (payment.gatewayTransactionId ?? "").toLowerCase().includes(query)
    )
  })

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Payment Transactions</h1>
          <p className="text-sm text-brand-muted">Collection tracking, gateway reconciliation, and COD verification</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Download size={18} />} onClick={() => navigate("/finance/receipts")}>
            Receipts
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AdminCard className="p-6 xl:col-span-2">
          <SectionHeader title="Unmatched Gateway Payments" icon={<AlertCircle size={18} />} />
          <div className="mt-4 space-y-3">
            {unmatched.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-status-emergency/20 bg-status-emergency/5 p-4">
                <div>
                  <p className="text-sm font-bold text-brand-navy">{payment.gatewayTransactionId}</p>
                  <p className="text-[10px] uppercase tracking-widest text-brand-muted">{payment.gatewayName} • ₹{payment.amount.toLocaleString()}</p>
                </div>
                <AdminButton variant="outline" size="sm" onClick={async () => {
                  await paymentRepository.matchGatewayPayment(payment.gatewayTransactionId ?? "", "inv2")
                  toast.success("Gateway payment matched to invoice")
                  navigate(`/finance/payments/${payment.id}`)
                }}>
                  Match
                </AdminButton>
              </div>
            ))}
            {unmatched.length === 0 && <p className="text-sm text-brand-muted">No unmatched gateway payments.</p>}
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <SectionHeader title="COD Pending Verification" icon={<ShieldCheck size={18} />} />
          <div className="mt-4 space-y-3">
            {codPending.map((payment) => (
              <div key={payment.id} className="rounded-2xl bg-brand-navy/5 p-4">
                <p className="text-sm font-bold text-brand-navy">{payment.customerName}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-muted">{payment.technicianName} • ₹{payment.amount.toLocaleString()}</p>
                <button
                  onClick={async () => {
                    await paymentRepository.verifyCodCollection(payment.id, "billing-admin")
                    toast.success("COD collection verified")
                    navigate(`/finance/payments/${payment.id}`)
                  }}
                  className="mt-3 text-[10px] font-bold uppercase tracking-widest text-brand-gold"
                >
                  Verify collection
                </button>
              </div>
            ))}
            {codPending.length === 0 && <p className="text-sm text-brand-muted">No COD verification items pending.</p>}
          </div>
        </AdminCard>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by payment ID, invoice, customer, or gateway transaction..."
            className="w-full rounded-2xl border border-border bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <FilterButton active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label="All" />
          <FilterButton active={statusFilter === "confirmed"} onClick={() => setStatusFilter("confirmed")} label="Confirmed" />
          <FilterButton active={statusFilter === "pending_verification"} onClick={() => setStatusFilter("pending_verification")} label="Pending" />
          <FilterButton active={statusFilter === "refunded"} onClick={() => setStatusFilter("refunded")} label="Refunded" />
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-brand-navy/[0.02] text-left">
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Payment</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Method</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Amount</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Status</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Date</th>
                <th className="p-6 text-right text-[10px] font-bold uppercase tracking-widest text-brand-muted">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.map((payment, index) => (
                <motion.tr key={payment.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-navy">{payment.paymentId}</p>
                        <p className="text-[10px] uppercase tracking-widest text-brand-muted">{payment.invoiceNumber} • {payment.customerName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <MethodBadge method={payment.method} />
                  </td>
                  <td className="p-6">
                    <p className="text-sm font-bold text-brand-navy">₹{payment.amount.toLocaleString()}</p>
                    {payment.gatewayTransactionId && (
                      <p className="text-[10px] uppercase tracking-widest text-brand-muted">{payment.gatewayTransactionId}</p>
                    )}
                  </td>
                  <td className="p-6">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-brand-muted" />
                      <span className="text-xs font-bold text-brand-navy">{new Date(payment.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/finance/payments/${payment.id}`)} className="rounded-lg p-2 text-brand-muted transition-colors hover:text-brand-gold">
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

function MethodBadge({ method }: { method: PaymentMethod }) {
  const methodMap: Record<PaymentMethod, { label: string; className: string }> = {
    online: { label: "Online", className: "bg-brand-navy/5 text-brand-navy" },
    cod: { label: "COD", className: "bg-brand-gold/10 text-brand-gold" },
    bank_transfer: { label: "Bank Transfer", className: "bg-status-completed/10 text-status-completed" },
    cheque: { label: "Cheque", className: "bg-brand-muted/10 text-brand-muted" },
    corporate_credit: { label: "Corporate", className: "bg-brand-navy text-white" },
  }

  const config = methodMap[method]
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", config.className)}>{config.label}</span>
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const statusMap: Record<PaymentStatus, { label: string; className: string }> = {
    initiated: { label: "Initiated", className: "bg-brand-navy/5 text-brand-navy" },
    confirmed: { label: "Confirmed", className: "bg-status-completed/10 text-status-completed" },
    pending_verification: { label: "Pending", className: "bg-brand-gold/10 text-brand-gold" },
    failed: { label: "Failed", className: "bg-status-emergency/10 text-status-emergency" },
    refunded: { label: "Refunded", className: "bg-brand-navy/10 text-brand-navy" },
    unmatched: { label: "Unmatched", className: "bg-status-emergency/10 text-status-emergency" },
  }

  const config = statusMap[status]
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", config.className)}>{config.label}</span>
}
