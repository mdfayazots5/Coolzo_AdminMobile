/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { toast } from "sonner"
import { Download, FileText, Mail } from "lucide-react"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminButton } from "@/components/shared/AdminButton"
import { Receipt, paymentRepository } from "@/core/network/payment-repository"

export default function ReceiptManagementScreen() {
  const [receipts, setReceipts] = React.useState<Receipt[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadReceipts = async () => {
      try {
        const data = await paymentRepository.getReceipts()
        setReceipts(data)
      } catch (error) {
        console.error(error)
        toast.error("Unable to load receipts")
      } finally {
        setIsLoading(false)
      }
    }

    void loadReceipts()
  }, [])

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Receipt Management</h1>
          <p className="text-sm text-brand-muted">Receipt list, resend flow, and PDF retrieval</p>
        </div>
      </div>

      <AdminCard className="p-8">
        <SectionHeader title="Receipts" icon={<FileText size={18} />} />
        <div className="mt-6 space-y-4">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="flex flex-col gap-4 rounded-3xl border border-border p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-brand-navy">{receipt.receiptNumber}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-muted">{receipt.invoiceNumber} • {receipt.customerName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="mr-2 text-sm font-bold text-brand-navy">₹{receipt.amount.toLocaleString()}</span>
                <AdminButton variant="outline" size="sm" onClick={() => toast.success(`PDF ready: ${receipt.pdfUrl}`)}>
                  <Download size={14} className="mr-2" /> PDF
                </AdminButton>
                <AdminButton variant="outline" size="sm" onClick={async () => {
                  await paymentRepository.resendReceipt(receipt.id)
                  toast.success(`Receipt resent for ${receipt.receiptNumber}`)
                }}>
                  <Mail size={14} className="mr-2" /> Resend
                </AdminButton>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  )
}
