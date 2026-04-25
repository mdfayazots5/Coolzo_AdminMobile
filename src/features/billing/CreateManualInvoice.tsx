/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Calendar,
  ChevronLeft,
  FileText,
  Plus,
  Save,
  Send,
  Trash2,
  User,
} from "lucide-react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader } from "@/components/shared/Layout"
import { AdminButton } from "@/components/shared/AdminButton"
import { InvoiceLineItem, invoiceRepository } from "@/core/network/invoice-repository"
import { cn } from "@/lib/utils"

type CustomerType = "individual" | "corporate"

const createLineItem = (id: string): InvoiceLineItem => ({
  id,
  description: "",
  quantity: 1,
  unitPrice: 0,
  total: 0,
  type: "service",
  hsnSacCode: "",
})

export default function CreateManualInvoice() {
  const navigate = useNavigate()
  const dueDateFieldId = React.useId()
  const notesFieldId = React.useId()
  const [customerId, setCustomerId] = React.useState("")
  const [customerName, setCustomerName] = React.useState("")
  const [customerType, setCustomerType] = React.useState<CustomerType>("individual")
  const [dueDate, setDueDate] = React.useState("")
  const [discount, setDiscount] = React.useState(0)
  const [notes, setNotes] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [items, setItems] = React.useState<InvoiceLineItem[]>([createLineItem("1")])

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const taxableAmount = Math.max(subtotal - discount, 0)
  const tax = taxableAmount * 0.18
  const netPayable = taxableAmount + tax

  const updateItem = <K extends keyof InvoiceLineItem>(id: string, field: K, value: InvoiceLineItem[K]) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
              total:
                field === "quantity"
                  ? (Number(value) || 0) * item.unitPrice
                  : field === "unitPrice"
                    ? item.quantity * (Number(value) || 0)
                    : item.total,
            }
          : item,
      ),
    )
  }

  const addItem = () => setItems((current) => [...current, createLineItem(Date.now().toString())])
  const removeItem = (id: string) => setItems((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current))

  const saveInvoice = async (status: "draft" | "sent") => {
    if (!customerName.trim() || !dueDate || !customerId.trim()) {
      toast.error("Customer, customer ID, and due date are required")
      return
    }

    setIsSubmitting(true)
    try {
      const invoice = await invoiceRepository.createInvoice({
        customerId,
        customerName,
        customerType,
        dueDate,
        status,
        notes,
        items,
        subtotal,
        discountTotal: discount,
        taxTotal: tax,
        netPayable,
        technicianName: "Billing Team",
        srNumber: `MANUAL-${Date.now().toString().slice(-5)}`,
      })
      toast.success(status === "draft" ? "Invoice draft saved" : "Invoice generated and sent")
      navigate(`/billing/invoices/${invoice.id}`)
    } catch (error) {
      toast.error("Unable to save invoice")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="rounded-xl p-2 transition-colors hover:bg-brand-navy/5">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Create Manual Invoice</h1>
            <p className="text-sm text-brand-muted">Manual billing for standalone jobs, proforma, and corporate requests</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Save size={18} />} disabled={isSubmitting} onClick={() => saveInvoice("draft")}>
            Save Draft
          </AdminButton>
          <AdminButton icon={<Send size={18} />} disabled={isSubmitting} onClick={() => saveInvoice("sent")}>
            Generate & Send
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Customer Details" icon={<User size={18} />} />
            <div className="mt-6 space-y-4">
              <Field label="Customer ID" value={customerId} onChange={setCustomerId} placeholder="CUST-10001" />
              <Field label="Customer Name" value={customerName} onChange={setCustomerName} placeholder="Customer full name" />
              <div>
                <label className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">Customer Type</label>
                <div className="flex gap-2">
                  <TypeButton active={customerType === "individual"} label="Individual" onClick={() => setCustomerType("individual")} />
                  <TypeButton active={customerType === "corporate"} label="Corporate" onClick={() => setCustomerType("corporate")} />
                </div>
              </div>
              <div>
                <label htmlFor={dueDateFieldId} className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">Due Date</label>
                <input
                  id={dueDateFieldId}
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full rounded-2xl bg-brand-navy/5 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Discount & Notes" icon={<Calendar size={18} />} />
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">Manual Discount</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(event) => setDiscount(Number(event.target.value) || 0)}
                  className="w-full rounded-2xl bg-brand-navy/5 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
                />
              </div>
              <div>
                <label htmlFor={notesFieldId} className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">Billing Notes</label>
                <textarea
                  id={notesFieldId}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Internal notes or payment instructions..."
                  className="min-h-[160px] w-full rounded-2xl bg-brand-navy/5 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <AdminCard className="p-8">
            <div className="flex items-center justify-between">
              <SectionHeader title="Invoice Line Items" icon={<FileText size={18} />} />
              <AdminButton variant="outline" size="sm" icon={<Plus size={14} />} onClick={addItem}>
                Add Item
              </AdminButton>
            </div>

            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-4 rounded-3xl bg-brand-navy/5 p-5 lg:grid-cols-[1fr_130px_100px_130px_48px]">
                  <Field label="Description" value={item.description} onChange={(value) => updateItem(item.id, "description", value)} placeholder="Service or part description" compact />
                  <Field label="HSN / SAC" value={item.hsnSacCode ?? ""} onChange={(value) => updateItem(item.id, "hsnSacCode", value)} placeholder="9987" compact />
                  <NumericField label="Qty" value={item.quantity} onChange={(value) => updateItem(item.id, "quantity", value)} compact />
                  <NumericField label="Unit Price" value={item.unitPrice} onChange={(value) => updateItem(item.id, "unitPrice", value)} compact />
                  <div className="flex items-end justify-end">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded-xl p-2 text-brand-muted transition-colors hover:bg-status-emergency/10 hover:text-status-emergency"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="lg:col-span-5 flex flex-col gap-3 border-t border-white/70 pt-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-2">
                      {(["service", "part", "visit_charge"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => updateItem(item.id, "type", type)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                            item.type === type ? "bg-brand-navy text-brand-gold" : "bg-white text-brand-muted",
                          )}
                        >
                          {type.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-brand-navy">Line Total: ₹{item.total.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-xs space-y-3">
                <SummaryRow label="Subtotal" value={subtotal} />
                <SummaryRow label="Discount" value={discount} danger />
                <SummaryRow label="Tax (18%)" value={tax} />
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-navy">Net Payable</span>
                  <span className="text-2xl font-bold text-brand-navy">₹{netPayable.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  compact = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  compact?: boolean
}) {
  const fieldId = React.useId()

  return (
    <div>
      <label htmlFor={fieldId} className={cn("mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted", compact && "ml-2")}>{label}</label>
      <input
        id={fieldId}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
      />
    </div>
  )
}

function NumericField({
  label,
  value,
  onChange,
  compact = false,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  compact?: boolean
}) {
  const fieldId = React.useId()

  return (
    <div>
      <label htmlFor={fieldId} className={cn("mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted", compact && "ml-2")}>{label}</label>
      <input
        id={fieldId}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
      />
    </div>
  )
}

function TypeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-2xl py-3 text-xs font-bold uppercase tracking-widest transition-all",
        active ? "bg-brand-navy text-brand-gold" : "bg-brand-navy/5 text-brand-muted",
      )}
    >
      {label}
    </button>
  )
}

function SummaryRow({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">{label}</span>
      <span className={cn("text-sm font-bold", danger ? "text-status-emergency" : "text-brand-navy")}>
        {danger ? "-" : ""}₹{value.toLocaleString()}
      </span>
    </div>
  )
}
