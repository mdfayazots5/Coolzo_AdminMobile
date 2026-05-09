/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { ChevronLeft, Package, Save } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { inventoryRepository } from "@/core/network/inventory-repository"

type PartFormState = {
  partCode: string
  name: string
  category: string
  description: string
  unitCost: string
  sellingPrice: string
  minReorderLevel: string
  isActive: boolean
}

const EMPTY_FORM: PartFormState = {
  partCode: "",
  name: "",
  category: "",
  description: "",
  unitCost: "",
  sellingPrice: "",
  minReorderLevel: "",
  isActive: true,
}

export default function PartEditorScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)
  const [form, setForm] = React.useState<PartFormState>(EMPTY_FORM)
  const [isLoading, setIsLoading] = React.useState(isEditMode)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (!isEditMode || !id) {
      return
    }

    const loadPart = async () => {
      try {
        const part = await inventoryRepository.getPartById(id)
        if (!part) {
          toast.error("Part not found")
          navigate("/inventory/catalog", { replace: true })
          return
        }

        setForm({
          partCode: part.partCode,
          name: part.name,
          category: part.category,
          description: part.description,
          unitCost: String(part.unitCost ?? ""),
          sellingPrice: part.sellingPrice != null ? String(part.sellingPrice) : "",
          minReorderLevel: String(part.minReorderLevel ?? ""),
          isActive: true,
        })
      } catch (error) {
        console.error(error)
        toast.error("Failed to load the part for editing")
        navigate("/inventory/catalog", { replace: true })
      } finally {
        setIsLoading(false)
      }
    }

    void loadPart()
  }, [id, isEditMode, navigate])

  const updateField = (field: keyof PartFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.partCode.trim() || !form.name.trim() || !form.category.trim()) {
      toast.error("Part code, name, and category are required")
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        partCode: form.partCode.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        unitCost: Number(form.unitCost || 0),
        sellingPrice: form.sellingPrice.trim() === "" ? undefined : Number(form.sellingPrice),
        minReorderLevel: Number(form.minReorderLevel || 0),
        isActive: form.isActive,
      }

      const savedPart = isEditMode && id
        ? await inventoryRepository.updatePart(id, payload)
        : await inventoryRepository.createPart(payload)

      toast.success(isEditMode ? "Part updated successfully" : "Part created successfully")
      navigate(`/inventory/catalog/${savedPart.id}`)
    } catch (error) {
      console.error(error)
      toast.error(isEditMode ? "Failed to update part" : "Failed to create part")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(id ? `/inventory/catalog/${id}` : "/inventory/catalog")}
            className="rounded-xl p-2 transition-colors hover:bg-brand-navy/5"
          >
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{isEditMode ? "Edit Part" : "Add New Part"}</h1>
            <p className="text-sm text-brand-muted">
              {isEditMode ? "Update the inventory catalog details for this part." : "Create a new inventory catalog part."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AdminCard className="p-6 sm:p-8">
          <SectionHeader title="Part Information" icon={<Package size={18} />} />

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <TextField label="Part Code" value={form.partCode} onChange={(value) => updateField("partCode", value)} />
            <TextField label="Part Name" value={form.name} onChange={(value) => updateField("name", value)} />
            <TextField label="Category" value={form.category} onChange={(value) => updateField("category", value)} />
            <NumberField label="Unit Cost" value={form.unitCost} onChange={(value) => updateField("unitCost", value)} />
            <NumberField label="Selling Price" value={form.sellingPrice} onChange={(value) => updateField("sellingPrice", value)} />
            <NumberField
              label="Min Reorder Level"
              value={form.minReorderLevel}
              onChange={(value) => updateField("minReorderLevel", value)}
            />
          </div>

          <div className="mt-5">
            <label className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
            />
          </div>

          <label className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-brand-navy/[0.02] px-4 py-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
              className="size-4 rounded border-border text-brand-gold focus:ring-brand-gold"
            />
            <span className="text-sm font-medium text-brand-navy">Part is active in the inventory catalog</span>
          </label>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AdminButton
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={() => navigate(id ? `/inventory/catalog/${id}` : "/inventory/catalog")}
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" className="sm:flex-1" icon={<Save size={16} />} isLoading={isSaving}>
              {isEditMode ? "Save Changes" : "Create Part"}
            </AdminButton>
          </div>
        </AdminCard>
      </form>
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
        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
      />
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">{label}</label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
      />
    </div>
  )
}
