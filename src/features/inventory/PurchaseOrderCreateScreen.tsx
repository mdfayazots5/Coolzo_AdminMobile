/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { ChevronLeft, PackagePlus, Plus, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { inventoryRepository, Part, Supplier } from "@/core/network/inventory-repository"

type DraftPurchaseOrderItem = {
  id: string
  partId: string
  orderedQty: number
  unitPrice: number
}

export default function PurchaseOrderCreateScreen() {
  const navigate = useNavigate()
  const [parts, setParts] = React.useState<Part[]>([])
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [supplierId, setSupplierId] = React.useState("")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = React.useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  const [notes, setNotes] = React.useState("")
  const [items, setItems] = React.useState<DraftPurchaseOrderItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    const loadFormData = async () => {
      try {
        const [catalogParts, supplierDirectory] = await Promise.all([
          inventoryRepository.getParts({ isActive: true }),
          inventoryRepository.getSuppliers(),
        ])

        setParts(catalogParts)
        setSuppliers(supplierDirectory)

        if (supplierDirectory.length > 0) {
          setSupplierId(supplierDirectory[0].id)
        }

        if (catalogParts.length > 0) {
          setItems([
            {
              id: createDraftLineId(),
              partId: catalogParts[0].id,
              orderedQty: Number(catalogParts[0].reorderQuantity || 1),
              unitPrice: Number(catalogParts[0].unitCost || 0),
            },
          ])
        }
      } catch (error) {
        toast.error("Unable to load purchase order form data")
      } finally {
        setIsLoading(false)
      }
    }

    void loadFormData()
  }, [])

  const handleAddLine = () => {
    if (parts.length === 0) {
      toast.info("Add inventory parts before creating a purchase order")
      return
    }

    const part = parts[0]
    setItems((current) => [
      ...current,
      {
        id: createDraftLineId(),
        partId: part.id,
        orderedQty: Number(part.reorderQuantity || 1),
        unitPrice: Number(part.unitCost || 0),
      },
    ])
  }

  const handleItemChange = (lineId: string, field: "partId" | "orderedQty" | "unitPrice", value: string) => {
    setItems((current) => current.map((line) => {
      if (line.id !== lineId) {
        return line
      }

      if (field === "partId") {
        const selectedPart = parts.find((part) => part.id === value)
        return {
          ...line,
          partId: value,
          unitPrice: Number(selectedPart?.unitCost ?? line.unitPrice),
          orderedQty: line.orderedQty > 0 ? line.orderedQty : Number(selectedPart?.reorderQuantity || 1),
        }
      }

      return {
        ...line,
        [field]: Math.max(Number(value) || 0, 0),
      }
    }))
  }

  const handleRemoveLine = (lineId: string) => {
    setItems((current) => current.filter((line) => line.id !== lineId))
  }

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("Select a supplier before creating the purchase order")
      return
    }

    const validItems = items
      .filter((line) => line.partId && line.orderedQty > 0)
      .map((line) => ({
        partId: line.partId,
        orderedQty: line.orderedQty,
        unitPrice: line.unitPrice,
      }))

    if (validItems.length === 0) {
      toast.error("Add at least one line item with a quantity above zero")
      return
    }

    setIsSubmitting(true)
    try {
      const purchaseOrder = await inventoryRepository.createPurchaseOrder({
        supplierId,
        expectedDeliveryDate,
        notes: notes.trim() || undefined,
        items: validItems,
      })

      toast.success("Purchase order created successfully")
      navigate(`/inventory/orders/${purchaseOrder.id}`)
    } catch (error) {
      toast.error("Unable to create purchase order")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = items.reduce((summary, line) => {
    const lineTotal = line.orderedQty * line.unitPrice
    return {
      subtotal: summary.subtotal + lineTotal,
      totalLines: summary.totalLines + (line.orderedQty > 0 ? 1 : 0),
    }
  }, { subtotal: 0, totalLines: 0 })

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/inventory/orders")} className="rounded-xl p-2 transition-colors hover:bg-brand-navy/5">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Create Purchase Order</h1>
            <p className="text-sm text-brand-muted">Create a supplier order for incoming inventory stock.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" onClick={() => navigate("/inventory/orders")}>
            Cancel
          </AdminButton>
          <AdminButton icon={<PackagePlus size={18} />} onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create PO"}
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AdminCard className="space-y-6 p-6 xl:col-span-2">
          <SectionHeader title="Order Lines" icon={<PackagePlus size={18} />} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Supplier</span>
              <select
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
              >
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Expected Delivery</span>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(event) => setExpectedDeliveryDate(event.target.value)}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
              />
            </label>

            <label className="space-y-2 md:col-span-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Add supplier instructions or receiving notes..."
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
              />
            </label>
          </div>

          <div className="space-y-4">
            {items.map((line) => {
              const selectedPart = parts.find((part) => part.id === line.partId)
              const lineTotal = line.orderedQty * line.unitPrice

              return (
                <div key={line.id} className="grid grid-cols-1 gap-4 rounded-3xl border border-border bg-brand-navy/[0.02] p-4 md:grid-cols-[minmax(0,2fr)_140px_160px_auto]">
                  <label className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Part</span>
                    <select
                      value={line.partId}
                      onChange={(event) => handleItemChange(line.id, "partId", event.target.value)}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
                    >
                      {parts.map((part) => (
                        <option key={part.id} value={part.id}>{part.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-brand-muted">{selectedPart?.partCode ?? "No part selected"}</p>
                  </label>

                  <label className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Qty</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={line.orderedQty}
                      onChange={(event) => handleItemChange(line.id, "orderedQty", event.target.value)}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Unit Price</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(event) => handleItemChange(line.id, "unitPrice", event.target.value)}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
                    />
                    <p className="text-xs font-bold text-brand-navy">₹{lineTotal.toLocaleString()}</p>
                  </label>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.id)}
                      disabled={items.length === 1}
                      className="rounded-2xl border border-border bg-white p-3 text-brand-muted transition-colors hover:border-status-emergency hover:text-status-emergency disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <AdminButton variant="outline" icon={<Plus size={18} />} onClick={handleAddLine}>
            Add Line
          </AdminButton>
        </AdminCard>

        <AdminCard className="space-y-6 p-6">
          <SectionHeader title="Summary" icon={<PackagePlus size={18} />} />
          <div className="space-y-4">
            <SummaryRow label="Supplier" value={suppliers.find((supplier) => supplier.id === supplierId)?.name ?? "Unassigned"} />
            <SummaryRow label="Expected" value={expectedDeliveryDate || "Not set"} />
            <SummaryRow label="Line Items" value={String(totals.totalLines)} />
            <SummaryRow label="Subtotal" value={`₹${totals.subtotal.toLocaleString()}`} />
          </div>
          <p className="text-xs leading-6 text-brand-muted">
            Receipt confirmation stays on the PO detail view. Stock increments only when the receive action is completed.
          </p>
        </AdminCard>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{label}</span>
      <span className="text-sm font-bold text-brand-navy">{value}</span>
    </div>
  )
}

function createDraftLineId() {
  return `po-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
