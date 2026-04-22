/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircle,
  ChevronLeft,
  Clock3,
  CreditCard,
  Download,
  FileText,
  History,
  Mail,
  Pencil,
  Plus,
  Send,
  ShieldAlert,
  User,
} from "lucide-react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminButton } from "@/components/shared/AdminButton"
import {
  Invoice,
  InvoiceStatus,
  MarkInvoicePaidRequest,
  ManualDiscountRequest,
  PaymentMethod,
  invoiceRepository,
} from "@/core/network/invoice-repository"
import { cn } from "@/lib/utils"

type ModalState = "payment" | "discount" | "credit-note" | "edit" | null

export default function InvoiceDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeModal, setActiveModal] = React.useState<ModalState>(null)
  const [paymentForm, setPaymentForm] = React.useState<MarkInvoicePaidRequest>({
    amount: 0,
    method: "cash",
    reference: "",
    notes: "",
  })
  const [discountForm, setDiscountForm] = React.useState<ManualDiscountRequest>({
    code: "",
    amount: 0,
    reason: "",
  })
  const [creditNoteAmount, setCreditNoteAmount] = React.useState(0)
  const [creditNoteReason, setCreditNoteReason] = React.useState("")
  const [changeReason, setChangeReason] = React.useState("")
  const [editableItems, setEditableItems] = React.useState<Invoice["items"]>([])

  const loadInvoice = React.useCallback(async () => {
    if (!id) {
      return
    }

    setIsLoading(true)
    try {
      const data = await invoiceRepository.getInvoiceById(id)
      setInvoice(data)
      setEditableItems(data?.items ?? [])
      setPaymentForm((current) => ({
        ...current,
        amount: data?.balanceDue ?? 0,
      }))
    } catch (error) {
      console.error(error)
      toast.error("Unable to load invoice")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    void loadInvoice()
  }, [loadInvoice])

  const handleSendInvoice = async () => {
    if (!invoice) {
      return
    }

    try {
      const updated = await invoiceRepository.sendInvoice(invoice.id)
      setInvoice(updated)
      toast.success("Invoice sent to customer")
    } catch (error) {
      toast.error("Unable to send invoice")
    }
  }

  const handleRecordPayment = async () => {
    if (!invoice) {
      return
    }

    try {
      const updated = await invoiceRepository.markAsPaid(invoice.id, paymentForm)
      setInvoice(updated)
      setActiveModal(null)
      toast.success("Payment recorded")
    } catch (error) {
      toast.error("Unable to record payment")
    }
  }

  const handleApplyDiscount = async () => {
    if (!invoice) {
      return
    }

    try {
      const updated = await invoiceRepository.applyDiscount(invoice.id, discountForm)
      setInvoice(updated)
      setActiveModal(null)
      toast.success("Discount applied")
    } catch (error) {
      toast.error("Unable to apply discount")
    }
  }

  const handleIssueCreditNote = async () => {
    if (!invoice) {
      return
    }

    try {
      const updated = await invoiceRepository.issueCreditNote(invoice.id, {
        amount: creditNoteAmount,
        reason: creditNoteReason,
      })
      setInvoice(updated)
      setActiveModal(null)
      toast.success("Credit note issued")
    } catch (error) {
      toast.error("Unable to issue credit note")
    }
  }

  const handleSaveEdit = async () => {
    if (!invoice || !changeReason.trim()) {
      toast.error("Change reason is required")
      return
    }

    const subtotal = editableItems.reduce((sum, item) => sum + item.total, 0)
    const netPayable = subtotal - invoice.discountTotal + invoice.taxTotal

    try {
      const updated = await invoiceRepository.updateInvoice(
        invoice.id,
        {
          items: editableItems,
          subtotal,
          netPayable,
        },
        changeReason,
      )
      setInvoice(updated)
      setActiveModal(null)
      toast.success("Invoice updated")
    } catch (error) {
      toast.error("Unable to update invoice")
    }
  }

  const handleMarkBadDebt = async () => {
    if (!invoice) {
      return
    }

    try {
      const updated = await invoiceRepository.markBadDebt(invoice.id)
      setInvoice(updated)
      toast.success("Invoice marked as bad debt")
    } catch (error) {
      toast.error("Unable to mark bad debt")
    }
  }

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  if (!invoice) {
    return <div className="p-8 text-center">Invoice not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="rounded-xl p-2 transition-colors hover:bg-brand-navy/5">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-brand-muted">Service request {invoice.srNumber}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-2xl border border-border bg-white p-3 text-brand-navy transition-all hover:border-brand-gold">
            <Download size={18} />
          </button>
          <AdminButton variant="outline" icon={<Send size={18} />} onClick={handleSendInvoice}>
            Send
          </AdminButton>
          <AdminButton variant="outline" icon={<Pencil size={18} />} onClick={() => setActiveModal("edit")}>
            Edit
          </AdminButton>
          {invoice.status !== "paid" && invoice.status !== "bad_debt" && (
            <AdminButton icon={<Plus size={18} />} onClick={() => setActiveModal("payment")}>
              Mark as Paid
            </AdminButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Payment Status" icon={<CreditCard size={18} />} />
            <div className="mt-6 flex flex-col items-center">
              <div className={cn(
                "flex size-24 flex-col items-center justify-center rounded-3xl",
                invoice.status === "paid"
                  ? "bg-status-completed/10 text-status-completed"
                  : invoice.status === "overdue"
                    ? "bg-status-emergency/10 text-status-emergency"
                    : "bg-brand-navy/5 text-brand-navy",
              )}>
                <span className="text-2xl font-bold">₹{Math.ceil(invoice.balanceDue / 1000)}k</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Balance</span>
              </div>
              <div className="mt-4">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
            <div className="mt-6 space-y-4 border-t border-border pt-6">
              <InfoRow label="Net Payable" value={`₹${invoice.netPayable.toLocaleString()}`} />
              <InfoRow label="Amount Paid" value={`₹${invoice.amountPaid.toLocaleString()}`} />
              <InfoRow label="Balance" value={`₹${invoice.balanceDue.toLocaleString()}`} />
              <InfoRow label="Due Date" value={new Date(invoice.dueDate).toLocaleDateString()} />
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Customer" icon={<User size={18} />} />
            <div className="mt-4 space-y-3">
              <p className="text-sm font-bold text-brand-navy">{invoice.customerName}</p>
              <p className="text-[10px] uppercase tracking-widest text-brand-muted">{invoice.customerType} account</p>
              <div className="flex gap-2">
                <button className="rounded-lg bg-brand-navy/5 p-2 text-brand-navy transition-colors hover:bg-brand-navy/10">
                  <Mail size={16} />
                </button>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Billing Actions" icon={<AlertCircle size={18} />} />
            <div className="mt-4 space-y-3">
              <ActionButton label="Apply Discount" onClick={() => setActiveModal("discount")} />
              <ActionButton label="Issue Credit Note" onClick={() => setActiveModal("credit-note")} />
              <ActionButton label="Mark as Bad Debt" onClick={handleMarkBadDebt} tone="danger" />
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <AdminCard className="p-8">
            <SectionHeader title="Line Items" icon={<FileText size={18} />} />
            <div className="mt-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Description</th>
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Type</th>
                    <th className="pb-4 text-right text-[10px] font-bold uppercase tracking-widest text-brand-muted">Qty</th>
                    <th className="pb-4 text-right text-[10px] font-bold uppercase tracking-widest text-brand-muted">Unit Price</th>
                    <th className="pb-4 text-right text-[10px] font-bold uppercase tracking-widest text-brand-muted">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 text-sm font-bold text-brand-navy">{item.description}</td>
                      <td className="py-4 text-xs uppercase tracking-widest text-brand-muted">{item.type.replace("_", " ")}</td>
                      <td className="py-4 text-right text-sm text-brand-navy">{item.quantity}</td>
                      <td className="py-4 text-right text-sm text-brand-muted">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="py-4 text-right text-sm font-bold text-brand-navy">₹{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-xs space-y-3">
                <InfoRow label="Subtotal" value={`₹${invoice.subtotal.toLocaleString()}`} />
                <InfoRow label="Discount" value={`-₹${invoice.discountTotal.toLocaleString()}`} danger />
                <InfoRow label="Tax" value={`₹${invoice.taxTotal.toLocaleString()}`} />
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-navy">Net Payable</span>
                  <span className="text-2xl font-bold text-brand-navy">₹{invoice.netPayable.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </AdminCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AdminCard className="p-8">
              <SectionHeader title="Payments" icon={<Clock3 size={18} />} />
              <div className="mt-6 space-y-4">
                {invoice.paymentHistory.length === 0 && (
                  <p className="py-6 text-center text-sm text-brand-muted">No payments recorded yet.</p>
                )}
                {invoice.paymentHistory.map((payment) => (
                  <div key={payment.id} className="rounded-2xl bg-brand-navy/5 p-4">
                    <p className="text-sm font-bold text-brand-navy">₹{payment.amount.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">
                      {payment.method.replace("_", " ")} • {payment.reference}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-brand-muted">
                      {new Date(payment.date).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </AdminCard>

            <AdminCard className="p-8">
              <SectionHeader title="Version History" icon={<History size={18} />} />
              <div className="mt-6 space-y-4">
                {invoice.versionHistory.map((entry) => (
                  <motion.div key={entry.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">v{entry.version}</span>
                      <span className="text-[10px] uppercase tracking-widest text-brand-muted">{new Date(entry.changedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-brand-navy">{entry.changeReason}</p>
                    <p className="mt-1 text-xs text-brand-muted">{entry.summary}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-brand-muted">By {entry.changedBy}</p>
                  </motion.div>
                ))}
              </div>
            </AdminCard>
          </div>

          {invoice.creditNotes.length > 0 && (
            <AdminCard className="p-8">
              <SectionHeader title="Credit Notes" icon={<ShieldAlert size={18} />} />
              <div className="mt-6 space-y-4">
                {invoice.creditNotes.map((creditNote) => (
                  <div key={creditNote.id} className="rounded-2xl border border-status-emergency/20 bg-status-emergency/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-brand-navy">₹{creditNote.amount.toLocaleString()}</p>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-status-emergency">{creditNote.status.replace("_", " ")}</span>
                    </div>
                    <p className="mt-2 text-xs text-brand-muted">{creditNote.reason}</p>
                  </div>
                ))}
              </div>
            </AdminCard>
          )}
        </div>
      </div>

      {activeModal && (
        <ModalFrame onClose={() => setActiveModal(null)}>
          {activeModal === "payment" && (
            <ModalSection
              title="Record Payment"
              actionLabel="Save Payment"
              onAction={handleRecordPayment}
              onCancel={() => setActiveModal(null)}
            >
              <NumberField label="Amount" value={paymentForm.amount} onChange={(value) => setPaymentForm((current) => ({ ...current, amount: value }))} />
              <SelectField
                label="Method"
                value={paymentForm.method}
                options={[
                  { value: "cash", label: "Cash" },
                  { value: "cheque", label: "Cheque" },
                  { value: "bank_transfer", label: "Bank Transfer" },
                  { value: "online", label: "Online" },
                ]}
                onChange={(value) => setPaymentForm((current) => ({ ...current, method: value as PaymentMethod }))}
              />
              <TextField label="Reference" value={paymentForm.reference} onChange={(value) => setPaymentForm((current) => ({ ...current, reference: value }))} />
            </ModalSection>
          )}

          {activeModal === "discount" && (
            <ModalSection
              title="Apply Discount"
              actionLabel="Apply Discount"
              onAction={handleApplyDiscount}
              onCancel={() => setActiveModal(null)}
            >
              <TextField label="Coupon Code" value={discountForm.code ?? ""} onChange={(value) => setDiscountForm((current) => ({ ...current, code: value }))} />
              <NumberField label="Discount Amount" value={discountForm.amount ?? 0} onChange={(value) => setDiscountForm((current) => ({ ...current, amount: value }))} />
              <TextField label="Reason" value={discountForm.reason} onChange={(value) => setDiscountForm((current) => ({ ...current, reason: value }))} />
            </ModalSection>
          )}

          {activeModal === "credit-note" && (
            <ModalSection
              title="Issue Credit Note"
              actionLabel="Create Credit Note"
              onAction={handleIssueCreditNote}
              onCancel={() => setActiveModal(null)}
            >
              <NumberField label="Credit Amount" value={creditNoteAmount} onChange={setCreditNoteAmount} />
              <TextField label="Reason" value={creditNoteReason} onChange={setCreditNoteReason} />
            </ModalSection>
          )}

          {activeModal === "edit" && (
            <ModalSection
              title="Edit Invoice"
              actionLabel="Save Changes"
              onAction={handleSaveEdit}
              onCancel={() => setActiveModal(null)}
            >
              <div className="space-y-3">
                {editableItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 gap-3 rounded-2xl bg-brand-navy/5 p-4 lg:grid-cols-[1fr_96px_120px]">
                    <TextField
                      label="Description"
                      value={item.description}
                      onChange={(value) =>
                        setEditableItems((current) =>
                          current.map((entry) => (entry.id === item.id ? { ...entry, description: value } : entry)),
                        )
                      }
                    />
                    <NumberField
                      label="Qty"
                      value={item.quantity}
                      onChange={(value) =>
                        setEditableItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, quantity: value, total: value * entry.unitPrice }
                              : entry,
                          ),
                        )
                      }
                    />
                    <NumberField
                      label="Unit Price"
                      value={item.unitPrice}
                      onChange={(value) =>
                        setEditableItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, unitPrice: value, total: entry.quantity * value }
                              : entry,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <TextField label="Change Reason" value={changeReason} onChange={setChangeReason} />
            </ModalSection>
          )}
        </ModalFrame>
      )}
    </div>
  )
}

function ActionButton({ label, onClick, tone = "default" }: { label: string; onClick: () => void; tone?: "default" | "danger" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border px-4 py-3 text-left text-xs font-bold uppercase tracking-widest transition-all",
        tone === "danger"
          ? "border-status-emergency/20 bg-status-emergency/5 text-status-emergency hover:bg-status-emergency/10"
          : "border-border bg-white text-brand-navy hover:border-brand-gold",
      )}
    >
      {label}
    </button>
  )
}

function InfoRow({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">{label}</span>
      <span className={cn("text-sm font-bold", danger ? "text-status-emergency" : "text-brand-navy")}>{value}</span>
    </div>
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
    <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest", config.className)}>
      {config.label}
    </span>
  )
}

function ModalFrame({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[40px] bg-white p-8 shadow-2xl">
        {children}
        <button onClick={onClose} className="sr-only">
          Close
        </button>
      </div>
    </div>
  )
}

function ModalSection({
  title,
  children,
  actionLabel,
  onAction,
  onCancel,
}: {
  title: string
  children: React.ReactNode
  actionLabel: string
  onAction: () => void
  onCancel: () => void
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-brand-navy">{title}</h2>
      <div className="mt-6 space-y-4">{children}</div>
      <div className="mt-6 flex gap-3">
        <AdminButton variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </AdminButton>
        <AdminButton className="flex-1" onClick={onAction}>
          {actionLabel}
        </AdminButton>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl bg-brand-navy/5 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
      />
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full rounded-2xl bg-brand-navy/5 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl bg-brand-navy/5 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
