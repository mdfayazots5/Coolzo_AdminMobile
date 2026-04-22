/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { SupportLookupItem, supportRepository } from "@/core/network/support-repository"

export default function SupportTicketCreateScreen() {
  const navigate = useNavigate()
  const [categories, setCategories] = React.useState<SupportLookupItem[]>([])
  const [priorities, setPriorities] = React.useState<SupportLookupItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [customerId, setCustomerId] = React.useState("")
  const [customerName, setCustomerName] = React.useState("")
  const [linkedSrId, setLinkedSrId] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [categoryId, setCategoryId] = React.useState<number | null>(null)
  const [priorityId, setPriorityId] = React.useState<number | null>(null)

  React.useEffect(() => {
    const loadLookups = async () => {
      try {
        const [categoryItems, priorityItems] = await Promise.all([
          supportRepository.getTicketCategories(),
          supportRepository.getTicketPriorities(),
        ])
        setCategories(categoryItems)
        setPriorities(priorityItems)
        setCategoryId(categoryItems[0]?.value ?? null)
        setPriorityId(priorityItems[0]?.value ?? null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadLookups()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!customerId.trim() || !customerName.trim() || !subject.trim() || !description.trim() || !categoryId || !priorityId) {
      toast.error("Customer, subject, category, priority, and description are required")
      return
    }

    setIsSaving(true)
    try {
      const ticket = await supportRepository.createTicket({
        customerId,
        customerName,
        subject,
        categoryId,
        priorityId,
        description,
        linkedSrId: linkedSrId || undefined,
      })
      toast.success("Support ticket created")
      navigate(`/support/tickets/${ticket.id}`)
    } catch (error) {
      toast.error("Unable to create support ticket")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="rounded-xl p-2 transition-colors hover:bg-brand-navy/5">
          <ChevronLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Create Support Ticket</h1>
          <p className="text-sm text-brand-muted">Register a support complaint with customer and SR context</p>
        </div>
      </div>

      <AdminCard className="p-8">
        <SectionHeader title="Ticket Details" icon={<MessageSquare size={18} />} />
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Customer ID" value={customerId} onChange={setCustomerId} placeholder="Enter customer ID" />
            <Field label="Customer Name" value={customerName} onChange={setCustomerName} placeholder="Enter customer name" />
            <Field label="Linked SR ID" value={linkedSrId} onChange={setLinkedSrId} placeholder="Optional service request" />
            <SelectField label="Category" value={categoryId ?? ""} options={categories} onChange={(value) => setCategoryId(Number(value))} />
            <SelectField label="Priority" value={priorityId ?? ""} options={priorities} onChange={(value) => setPriorityId(Number(value))} />
          </div>

          <Field label="Subject" value={subject} onChange={setSubject} placeholder="Short customer-facing issue summary" />

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Full issue details"
              className="min-h-[180px] w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm outline-none focus-visible:border-brand-navy focus-visible:ring-1 focus-visible:ring-brand-navy"
            />
          </div>

          <div className="flex justify-end gap-3">
            <AdminButton type="button" variant="secondary" onClick={() => navigate("/support/tickets")}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" isLoading={isSaving} icon={<Send size={18} />}>
              Create Ticket
            </AdminButton>
          </div>
        </form>
      </AdminCard>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="flex h-10 w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm outline-none focus-visible:border-brand-navy focus-visible:ring-1 focus-visible:ring-brand-navy"
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
  value: number | string
  options: SupportLookupItem[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm outline-none focus-visible:border-brand-navy focus-visible:ring-1 focus-visible:ring-brand-navy"
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
