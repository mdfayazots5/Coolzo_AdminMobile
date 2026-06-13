/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { StatusBadge } from "@/components/shared/Badges"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { useMasterData } from "@/core/master-data/MasterDataProvider"
import type { MasterDataRecord, MasterDataRecordInput, MasterDataSlug } from "@/core/network/master-data-repository"
import { serviceCatalogRepository, type AdminServiceItem, type AdminServiceCategory } from "@/core/network/service-catalog-repository"
import {
  asOptionalNumber,
  getMetadataNumber,
  getMetadataString,
  getMetadataStringList,
  sortBySortOrder,
  toSlugCode,
} from "./configuration-utils"
import { Image as ImageIcon, Layers3, PackageSearch, Plus, Save, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

// NOTE: "service-types" was retired here (Phase 3). Bookable services live in tblService — manage their
// images in Settings → Service Images. This screen now covers subtypes + equipment taxonomies only.
type CatalogSection = Extract<
  MasterDataSlug,
  "service-subtypes" | "equipment-brands" | "equipment-models"
>

interface CatalogFormState {
  id?: string
  code: string
  label: string
  description: string
  isActive: boolean
  isPublished: boolean
  sortOrder: string
  parentCode: string
  durationModifier: string
  priceModifier: string
  skillTags: string
  origin: string
  brandCode: string
  equipmentType: string
  tonnage: string
  compatibleTypes: string
  defaultWarrantyMonths: string
  manufacturerCode: string
}

const SECTION_META: Record<CatalogSection, { title: string; description: string }> = {
  "service-subtypes": {
    title: "Service Subtypes",
    description: "Sub-service definitions, duration modifiers, and skill requirements.",
  },
  "equipment-brands": {
    title: "Equipment Brands",
    description: "Supported AC brands used across registrations and dispatch flows.",
  },
  "equipment-models": {
    title: "Equipment Models",
    description: "Brand-linked equipment models with tonnage and compatibility metadata.",
  },
}

const createEmptyForm = (sortOrder = 1): CatalogFormState => ({
  code: "",
  label: "",
  description: "",
  isActive: true,
  isPublished: true,
  sortOrder: String(sortOrder),
  parentCode: "",
  durationModifier: "",
  priceModifier: "",
  skillTags: "",
  origin: "",
  brandCode: "",
  equipmentType: "",
  tonnage: "",
  compatibleTypes: "",
  defaultWarrantyMonths: "",
  manufacturerCode: "",
})

const hydrateForm = (section: CatalogSection, sortOrder: number, record?: MasterDataRecord) => {
  const metadata = record?.metadata || {}
  const base = createEmptyForm(record?.sortOrder || sortOrder)

  if (!record) {
    return base
  }

  return {
    ...base,
    id: record.id,
    code: record.code,
    label: record.label,
    description: record.description,
    isActive: record.isActive,
    isPublished: record.isPublished,
    sortOrder: String(record.sortOrder),
    parentCode: getMetadataString(metadata, "parentCode"),
    durationModifier: String(getMetadataNumber(metadata, "durationModifier", 0) || ""),
    priceModifier: String(getMetadataNumber(metadata, "priceModifier", 0) || ""),
    skillTags: getMetadataStringList(metadata, "skillTags").join(", "),
    origin: getMetadataString(metadata, "origin"),
    brandCode: getMetadataString(metadata, "brandCode"),
    equipmentType: getMetadataString(metadata, "equipmentType"),
    tonnage: getMetadataString(metadata, "tonnage"),
    compatibleTypes: getMetadataStringList(metadata, "compatibleTypes").join(", "),
    defaultWarrantyMonths: String(getMetadataNumber(metadata, "defaultWarrantyMonths", 0) || ""),
    manufacturerCode: getMetadataString(metadata, "manufacturerCode"),
  }
}

const buildPayload = (section: CatalogSection, form: CatalogFormState): MasterDataRecordInput => {
  const shared = {
    id: form.id,
    code: form.code.trim(),
    label: form.label.trim(),
    description: form.description.trim(),
    isActive: form.isActive,
    isPublished: form.isPublished,
    sortOrder: asOptionalNumber(form.sortOrder),
  }

  switch (section) {
    case "service-subtypes":
      return {
        ...shared,
        metadata: {
          parentCode: form.parentCode.trim(),
          durationModifier: asOptionalNumber(form.durationModifier),
          priceModifier: asOptionalNumber(form.priceModifier),
          skillTags: form.skillTags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      }
    case "equipment-brands":
      return {
        ...shared,
        metadata: {
          origin: form.origin.trim(),
        },
      }
    case "equipment-models":
      return {
        ...shared,
        metadata: {
          brandCode: form.brandCode.trim(),
          equipmentType: form.equipmentType.trim(),
          tonnage: form.tonnage.trim(),
          compatibleTypes: form.compatibleTypes
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          defaultWarrantyMonths: asOptionalNumber(form.defaultWarrantyMonths),
          manufacturerCode: form.manufacturerCode.trim(),
        },
      }
  }
}

export default function ServiceCatalogScreen() {
  const { masterData, loadMasterData, saveMasterData, removeMasterData } = useMasterData()
  const [activeSection, setActiveSection] = React.useState<CatalogSection>("service-subtypes")
  const [services, setServices] = React.useState<AdminServiceItem[]>([])
  const [categories, setCategories] = React.useState<AdminServiceCategory[]>([])
  const [form, setForm] = React.useState<CatalogFormState>(createEmptyForm())
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [subtypes] = await Promise.all([
          loadMasterData("service-subtypes"),
          loadMasterData("equipment-brands"),
          loadMasterData("equipment-models"),
        ])

        // Real bookable services (tblService) — shown in the reference panel and the subtype
        // "parent" picker. Categories label each service.
        try {
          const [serviceList, categoryList] = await Promise.all([
            serviceCatalogRepository.getServices(),
            serviceCatalogRepository.getServiceCategories(),
          ])
          setServices(serviceList)
          setCategories(categoryList)
        } catch (serviceError) {
          console.error(serviceError)
        }

        setForm(createEmptyForm(subtypes.length + 1))
      } catch (error) {
        console.error(error)
        toast.error("Unable to load service catalog")
      } finally {
        setIsLoading(false)
      }
    }

    void loadCatalog()
  }, [loadMasterData])

  const records: MasterDataRecord[] = sortBySortOrder(masterData[activeSection] || [])
  const equipmentBrands: MasterDataRecord[] = sortBySortOrder(masterData["equipment-brands"] || [])
  const categoryNameById = React.useMemo(() => {
    const map = new Map<number, string>()
    categories.forEach((category) => map.set(category.serviceCategoryId, category.categoryName))
    return map
  }, [categories])

  const resetForm = React.useCallback(
    (section: CatalogSection, record?: MasterDataRecord) => {
      const nextSortOrder = record ? record.sortOrder : (masterData[section]?.length || 0) + 1
      setForm(hydrateForm(section, nextSortOrder, record))
    },
    [masterData]
  )

  React.useEffect(() => {
    if (!isLoading) {
      resetForm(activeSection)
    }
  }, [activeSection, isLoading, resetForm])

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast.error("Label is required")
      return
    }

    const code = form.code.trim() || toSlugCode(form.label)
    if (!code) {
      toast.error("A valid code is required")
      return
    }

    setIsSaving(true)
    try {
      await saveMasterData(activeSection, buildPayload(activeSection, { ...form, code }))
      toast.success(`${SECTION_META[activeSection].title.slice(0, -1)} saved`)
      resetForm(activeSection)
    } catch (error) {
      console.error(error)
      toast.error("Failed to save catalog item")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsSaving(true)
    try {
      await removeMasterData(activeSection, id)
      toast.success("Catalog item removed")
      resetForm(activeSection)
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete catalog item")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <InlineLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Service & Equipment Catalog</h1>
          <p className="text-sm text-brand-muted">
            Maintain service subtypes, equipment brands, and model definitions. Bookable service photos are
            managed in Settings → Service Images.
          </p>
        </div>
        <AdminButton
          variant="secondary"
          onClick={() => resetForm(activeSection)}
          iconLeft={<Plus size={18} />}
        >
          New {SECTION_META[activeSection].title.slice(0, -1)}
        </AdminButton>
      </div>

      {/* Bookable Services — read-only reference (definitions live in tblService; photos are
          managed in Settings → Service Images). Shown here so the catalog is visible at a glance. */}
      <AdminCard className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PackageSearch size={18} className="text-brand-navy" />
            <h2 className="text-lg font-bold text-brand-navy">Bookable Services</h2>
            <span className="text-xs text-brand-muted">({services.length})</span>
          </div>
          <Link
            to="/settings/master/service-images"
            className="text-sm font-semibold text-brand-navy hover:text-brand-gold"
          >
            Manage images →
          </Link>
        </div>
        {services.length === 0 ? (
          <p className="text-sm text-brand-muted">No bookable services found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((service) => (
              <div key={service.serviceId} className="flex items-center gap-4 rounded-[12px] border border-border p-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-[8px] border border-border bg-brand-surface">
                  {service.imageUrl ? (
                    <img src={service.imageUrl} alt={service.serviceName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-brand-muted">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-brand-navy">{service.serviceName}</h3>
                  <p className="text-xs text-brand-muted">
                    {categoryNameById.get(service.serviceCategoryId) || "Uncategorised"}
                    {service.pricingModelName ? ` · ${service.pricingModelName}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-brand-navy">
                    {service.basePrice != null ? `₹${service.basePrice.toLocaleString("en-IN")}` : "—"}
                  </p>
                  <Link
                    to="/settings/master/service-images"
                    className="text-[11px] font-semibold text-brand-gold hover:underline"
                  >
                    {service.imageUrl ? "Change image" : "Add image"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {(Object.keys(SECTION_META) as CatalogSection[]).map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => setActiveSection(section)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              activeSection === section
                ? "border-brand-gold bg-brand-gold/10"
                : "border-border bg-white hover:border-brand-navy/20"
            }`}
          >
            <p className="text-sm font-bold text-brand-navy">{SECTION_META[section].title}</p>
            <p className="mt-1 text-xs text-brand-muted leading-relaxed">{SECTION_META[section].description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.4fr] gap-6">
        <AdminCard className="p-6 space-y-5">
          <SectionHeader title={`Edit ${SECTION_META[activeSection].title}`} icon={<Layers3 size={18} />} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminTextField
              label="Code"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              helperText="Leave blank to auto-generate from the label."
            />
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Label</label>
              <div className="flex gap-2">
                <AdminTextField
                  className="flex-1"
                  value={form.label}
                  onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                />
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => setForm((current) => ({ ...current, code: toSlugCode(current.label) }))}
                >
                  Sync
                </AdminButton>
              </div>
            </div>
            <AdminTextField
              label="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            <AdminTextField
              label="Sort Order"
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
            />

            {activeSection === "service-subtypes" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Parent Service</label>
                  <select
                    title="Parent Service"
                    value={form.parentCode}
                    onChange={(event) => setForm((current) => ({ ...current, parentCode: event.target.value }))}
                    className="flex h-10 w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-navy focus-visible:border-brand-navy"
                  >
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service.serviceId} value={service.serviceName}>
                        {service.serviceName}
                      </option>
                    ))}
                  </select>
                </div>
                <AdminTextField
                  label="Skill Tags"
                  value={form.skillTags}
                  onChange={(event) => setForm((current) => ({ ...current, skillTags: event.target.value }))}
                  helperText="Comma separated values"
                />
                <AdminTextField
                  label="Duration Modifier"
                  type="number"
                  value={form.durationModifier}
                  onChange={(event) => setForm((current) => ({ ...current, durationModifier: event.target.value }))}
                />
                <AdminTextField
                  label="Price Modifier"
                  type="number"
                  value={form.priceModifier}
                  onChange={(event) => setForm((current) => ({ ...current, priceModifier: event.target.value }))}
                />
              </>
            )}

            {activeSection === "equipment-brands" && (
              <AdminTextField
                label="Country / Origin"
                value={form.origin}
                onChange={(event) => setForm((current) => ({ ...current, origin: event.target.value }))}
              />
            )}

            {activeSection === "equipment-models" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Equipment Brand</label>
                  <select
                    title="Equipment Brand"
                    value={form.brandCode}
                    onChange={(event) => setForm((current) => ({ ...current, brandCode: event.target.value }))}
                    className="flex h-10 w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-navy focus-visible:border-brand-navy"
                  >
                    <option value="">Select brand</option>
                    {equipmentBrands.map((brand) => (
                      <option key={brand.id} value={brand.code}>
                        {brand.label}
                      </option>
                    ))}
                  </select>
                </div>
                <AdminTextField
                  label="Equipment Type"
                  value={form.equipmentType}
                  onChange={(event) => setForm((current) => ({ ...current, equipmentType: event.target.value }))}
                />
                <AdminTextField
                  label="Tonnage"
                  value={form.tonnage}
                  onChange={(event) => setForm((current) => ({ ...current, tonnage: event.target.value }))}
                />
                <AdminTextField
                  label="Default Warranty (Months)"
                  type="number"
                  value={form.defaultWarrantyMonths}
                  onChange={(event) => setForm((current) => ({ ...current, defaultWarrantyMonths: event.target.value }))}
                />
                <AdminTextField
                  label="Manufacturer Code"
                  value={form.manufacturerCode}
                  onChange={(event) => setForm((current) => ({ ...current, manufacturerCode: event.target.value }))}
                />
                <AdminTextField
                  label="Compatible Types"
                  value={form.compatibleTypes}
                  onChange={(event) => setForm((current) => ({ ...current, compatibleTypes: event.target.value }))}
                  helperText="Comma separated values"
                />
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
              />
              Published
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <AdminButton onClick={handleSave} isLoading={isSaving} iconLeft={<Save size={18} />}>
              {form.id ? "Update Item" : "Create Item"}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => resetForm(activeSection)}>
              Clear Form
            </AdminButton>
          </div>
        </AdminCard>

        <div className="space-y-4">
          <SectionHeader
            title={SECTION_META[activeSection].title}
            icon={<PackageSearch size={18} />}
          />
          {records.length === 0 ? (
            <AdminCard className="p-8 text-center">
              <p className="text-sm font-medium text-brand-muted">No records configured yet for this catalog.</p>
            </AdminCard>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {records.map((record) => (
                <AdminCard key={record.id} className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-brand-navy">{record.label}</h3>
                        <StatusBadge status={record.isActive ? "completed" : "cancelled"}>
                          {record.isActive ? "active" : "inactive"}
                        </StatusBadge>
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">{record.code}</p>
                      {record.description && (
                        <p className="text-sm text-brand-muted">{record.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-brand-navy">
                        {activeSection === "service-subtypes" && (
                          <>
                            <span>Parent: {getMetadataString(record.metadata, "parentCode", "Not linked")}</span>
                            <span>Duration Modifier: {getMetadataNumber(record.metadata, "durationModifier", 0)}</span>
                            <span>Price Modifier: ₹{getMetadataNumber(record.metadata, "priceModifier", 0)}</span>
                          </>
                        )}
                        {activeSection === "equipment-brands" && (
                          <span>Origin: {getMetadataString(record.metadata, "origin", "Unspecified")}</span>
                        )}
                        {activeSection === "equipment-models" && (
                          <>
                            <span>Brand: {getMetadataString(record.metadata, "brandCode", "Not linked")}</span>
                            <span>Type: {getMetadataString(record.metadata, "equipmentType", "Unknown")}</span>
                            <span>Tonnage: {getMetadataString(record.metadata, "tonnage", "N/A")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => resetForm(activeSection, record)}
                      >
                        Edit
                      </AdminButton>
                      <AdminButton
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDelete(record.id)}
                        iconLeft={<Trash2 size={14} />}
                      >
                        Delete
                      </AdminButton>
                    </div>
                  </div>
                </AdminCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
