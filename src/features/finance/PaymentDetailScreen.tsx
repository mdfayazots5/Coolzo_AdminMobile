/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ChevronLeft,
  CreditCard,
  Download,
  FileText,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminButton } from "@/components/shared/AdminButton"
import { Payment, paymentRepository } from "@/core/network/payment-repository"

export default function PaymentDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [payment, setPayment] = React.useState<Payment | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadPayment = async () => {
      if (!id) {
        return
      }

      try {
        const data = await paymentRepository.getPaymentById(id)
        setPayment(data)
      } catch (error) {
        console.error(error)
        toast.error("Unable to load payment")
      } finally {
        setIsLoading(false)
      }
    }

    void loadPayment()
  }, [id])

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  if (!payment) {
    return <div className="p-8 text-center">Payment not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="rounded-xl p-2 transition-colors hover:bg-brand-navy/5">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{payment.paymentId}</h1>
            <p className="text-sm text-brand-muted">{payment.invoiceNumber} • {payment.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Download size={18} />} onClick={() => navigate("/finance/receipts")}>
            View Receipts
          </AdminButton>
          {payment.status === "pending_verification" && payment.method === "cod" && (
            <AdminButton icon={<ShieldCheck size={18} />} onClick={async () => {
              const updated = await paymentRepository.verifyCodCollection(payment.id, "billing-admin")
              setPayment(updated)
              toast.success("COD collection verified")
            }}>
              Verify COD
            </AdminButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AdminCard className="p-6">
          <SectionHeader title="Payment Summary" icon={<CreditCard size={18} />} />
          <div className="mt-6 space-y-4">
            <InfoRow label="Amount" value={`₹${payment.amount.toLocaleString()}`} />
            <InfoRow label="Method" value={payment.method.replace("_", " ")} />
            <InfoRow label="Status" value={payment.status.replace("_", " ")} />
            <InfoRow label="Date" value={new Date(payment.date).toLocaleString()} />
            {payment.referenceNumber && <InfoRow label="Reference" value={payment.referenceNumber} />}
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <SectionHeader title="Gateway & Verification" icon={<ShieldCheck size={18} />} />
          <div className="mt-6 space-y-4">
            <InfoRow label="Gateway" value={payment.gatewayName ?? "N/A"} />
            <InfoRow label="Gateway Txn" value={payment.gatewayTransactionId ?? "N/A"} />
            <InfoRow label="Verified By" value={payment.verifiedBy ?? "Pending"} />
            <InfoRow label="Verification Date" value={payment.verificationDate ? new Date(payment.verificationDate).toLocaleString() : "Pending"} />
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <SectionHeader title="Actions" icon={<RefreshCcw size={18} />} />
          <div className="mt-6 space-y-3">
            <AdminButton variant="outline" className="w-full" onClick={() => navigate(`/billing/invoices/${payment.invoiceId}`)}>
              Open Invoice
            </AdminButton>
            <AdminButton variant="outline" className="w-full" onClick={async () => {
              const updated = await paymentRepository.refundPayment(payment.id)
              setPayment(updated)
              toast.success("Refund processed")
            }}>
              Process Refund
            </AdminButton>
            <AdminButton variant="outline" className="w-full" onClick={() => navigate("/finance/receipts")}>
              <FileText size={16} className="mr-2" /> Receipt Management
            </AdminButton>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">{label}</span>
      <span className="text-right text-sm font-bold capitalize text-brand-navy">{value}</span>
    </div>
  )
}
