/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { InlineLoader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { StatusBadge } from "@/components/shared/Badges"
import { useMasterData } from "@/core/master-data/MasterDataProvider"
import {
  serviceCatalogRepository,
  type ServiceCatalog,
  type AdminCatalogCategory,
  type AdminCatalogService,
  type CategoryUpsertInput,
  type ServiceUpsertInput,
} from "@/core/network/service-catalog-repository"
import { ChevronDown, ChevronRight, Image as ImageIcon, Pencil, Plus, Trash2, Upload, X } from "lucide-react"
import ImageCropModal, { type CroppedImage } from "@/components/shared/ImageCropModal"
import { toast } from "sonner"

interface CategoryForm {
  serviceCategoryId?: number
  categoryName: string
  categoryCode: string
  description: string
  imageUrl: string | null
  isActive: boolean
  sortOrder: string
}

interface ServiceForm {
  serviceId?: number
  serviceCategoryId: number
  pricingModelId: number
  serviceName: string
  serviceCode: string
  summary: string
  basePrice: string
  estimatedDurationInMinutes: string
  imageUrl: string | null
  isActive: boolean
  sortOrder: string
}

function Modal({ title, onClose, children, footer }: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      {/* Explicit pixel width (not w-full/max-w-lg) so the card can never collapse to its text width. */}
      <div
        className="max-h-[90vh] overflow-auto rounded-2xl bg-white p-6 shadow-xl"
        style={{ width: 520, maxWidth: "94vw" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-navy">{title}</h3>
          <button type="button" onClick={onClose} className="text-brand-muted hover:text-brand-navy" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-3">{footer}</div>
      </div>
    </div>
  )
}

export default function ServiceCatalogManager() {
  const { uploadMasterImage } = useMasterData()
  const [catalog, setCatalog] = React.useState<ServiceCatalog | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [expandedCategoryId, setExpandedCategoryId] = React.useState<number | null>(null)
  const [categoryForm, setCategoryForm] = React.useState<CategoryForm | null>(null)
  const [serviceForm, setServiceForm] = React.useState<ServiceForm | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [imageBusy, setImageBusy] = React.useState(false)
  const [cropFile, setCropFile] = React.useState<File | null>(null)
  const [categoryImageBusy, setCategoryImageBusy] = React.useState(false)
  const [categoryCropFile, setCategoryCropFile] = React.useState<File | null>(null)

  const loadCatalog = React.useCallback(async () => {
    try {
      setCatalog(await serviceCatalogRepository.getCatalog())
    } catch (error) {
      console.error(error)
      toast.error("Unable to load the service catalog")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  const servicesByCategory = React.useMemo(() => {
    const map = new Map<number, AdminCatalogService[]>()
    catalog?.services.forEach((service) => {
      const list = map.get(service.serviceCategoryId) ?? []
      list.push(service)
      map.set(service.serviceCategoryId, list)
    })
    return map
  }, [catalog])

  // ── Category modal ───────────────────────────────────────────────────────
  const openCreateCategory = () => {
    const nextSort = (catalog?.categories.length ?? 0) + 1
    setCategoryForm({ categoryName: "", categoryCode: "", description: "", imageUrl: null, isActive: true, sortOrder: String(nextSort) })
  }

  const openEditCategory = (category: AdminCatalogCategory) => {
    setCategoryForm({
      serviceCategoryId: category.serviceCategoryId,
      categoryName: category.categoryName,
      categoryCode: category.categoryCode,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      sortOrder: String(category.sortOrder),
    })
  }

  const handleCategoryFileSelected = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    setCategoryCropFile(file)
  }

  const uploadCroppedCategoryImage = async (cropped: CroppedImage) => {
    setCategoryCropFile(null)
    setCategoryImageBusy(true)
    try {
      const url = await uploadMasterImage("categories", cropped)
      setCategoryForm((current) => (current ? { ...current, imageUrl: url } : current))
      toast.success("Image uploaded")
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload image")
    } finally {
      setCategoryImageBusy(false)
    }
  }

  const saveCategory = async () => {
    if (!categoryForm) return
    if (!categoryForm.categoryName.trim()) {
      toast.error("Category name is required")
      return
    }
    const input: CategoryUpsertInput = {
      categoryName: categoryForm.categoryName.trim(),
      categoryCode: categoryForm.categoryCode.trim() || null,
      description: categoryForm.description.trim() || null,
      imageUrl: categoryForm.imageUrl,
      isActive: categoryForm.isActive,
      sortOrder: Number(categoryForm.sortOrder) || 0,
    }
    setIsSaving(true)
    try {
      if (categoryForm.serviceCategoryId) {
        await serviceCatalogRepository.updateCategory(categoryForm.serviceCategoryId, input)
        toast.success("Category updated")
      } else {
        await serviceCatalogRepository.createCategory(input)
        toast.success("Category created")
      }
      setCategoryForm(null)
      await loadCatalog()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save category")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteCategory = async (category: AdminCatalogCategory) => {
    if (!window.confirm(`Delete category "${category.categoryName}"? This cannot be undone.`)) return
    try {
      await serviceCatalogRepository.deleteCategory(category.serviceCategoryId)
      toast.success("Category deleted")
      await loadCatalog()
    } catch (error) {
      console.error(error)
      toast.error("Cannot delete: the category still has services. Remove them first.")
    }
  }

  // ── Service modal ────────────────────────────────────────────────────────
  const openCreateService = (serviceCategoryId: number) => {
    const firstPricingModel = catalog?.pricingModels[0]?.pricingModelId ?? 0
    setServiceForm({
      serviceCategoryId,
      pricingModelId: firstPricingModel,
      serviceName: "",
      serviceCode: "",
      summary: "",
      basePrice: "",
      estimatedDurationInMinutes: "60",
      imageUrl: null,
      isActive: true,
      sortOrder: String((servicesByCategory.get(serviceCategoryId)?.length ?? 0) + 1),
    })
  }

  const openEditService = (service: AdminCatalogService) => {
    setServiceForm({
      serviceId: service.serviceId,
      serviceCategoryId: service.serviceCategoryId,
      pricingModelId: service.pricingModelId,
      serviceName: service.serviceName,
      serviceCode: service.serviceCode,
      summary: service.summary,
      basePrice: String(service.basePrice),
      estimatedDurationInMinutes: String(service.estimatedDurationInMinutes),
      imageUrl: service.imageUrl,
      isActive: service.isActive,
      sortOrder: String(service.sortOrder),
    })
  }

  const handleServiceFileSelected = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    setCropFile(file)
  }

  const uploadCroppedServiceImage = async (cropped: CroppedImage) => {
    setCropFile(null)
    setImageBusy(true)
    try {
      const url = await uploadMasterImage("services", cropped)
      setServiceForm((current) => (current ? { ...current, imageUrl: url } : current))
      toast.success("Image uploaded")
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload image")
    } finally {
      setImageBusy(false)
    }
  }

  const saveService = async () => {
    if (!serviceForm) return
    if (!serviceForm.serviceName.trim()) {
      toast.error("Service name is required")
      return
    }
    if (!serviceForm.serviceCategoryId) {
      toast.error("Please select a category")
      return
    }
    if (!serviceForm.pricingModelId) {
      toast.error("Please select a pricing model")
      return
    }
    const input: ServiceUpsertInput = {
      serviceCategoryId: serviceForm.serviceCategoryId,
      pricingModelId: serviceForm.pricingModelId,
      serviceName: serviceForm.serviceName.trim(),
      serviceCode: serviceForm.serviceCode.trim() || null,
      summary: serviceForm.summary.trim() || null,
      basePrice: Number(serviceForm.basePrice) || 0,
      estimatedDurationInMinutes: Number(serviceForm.estimatedDurationInMinutes) || 0,
      imageUrl: serviceForm.imageUrl,
      isActive: serviceForm.isActive,
      sortOrder: Number(serviceForm.sortOrder) || 0,
    }
    setIsSaving(true)
    try {
      if (serviceForm.serviceId) {
        await serviceCatalogRepository.updateService(serviceForm.serviceId, input)
        toast.success("Service updated")
      } else {
        await serviceCatalogRepository.createService(input)
        toast.success("Service created")
      }
      setServiceForm(null)
      await loadCatalog()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save service")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteService = async (service: AdminCatalogService) => {
    if (!window.confirm(`Delete service "${service.serviceName}"? This cannot be undone.`)) return
    try {
      await serviceCatalogRepository.deleteService(service.serviceId)
      toast.success("Service deleted")
      await loadCatalog()
    } catch (error) {
      console.error(error)
      toast.error("Cannot delete: this service is referenced by bookings. Deactivate it instead.")
    }
  }

  if (isLoading) {
    return <InlineLoader />
  }

  const categories = catalog?.categories ?? []
  const pricingModels = catalog?.pricingModels ?? []

  return (
    <div className="space-y-4">
      {/* Toolbar only — the page header ("Service Catalog") already titles this screen, so we don't
          repeat a second heading here; just the primary action, right-aligned. */}
      <div className="flex items-center justify-end">
        <AdminButton onClick={openCreateCategory} iconLeft={<Plus size={18} />}>
          Add Category
        </AdminButton>
      </div>

      {categories.length === 0 ? (
        <AdminCard className="p-8 text-center">
          <p className="text-sm font-medium text-brand-muted">No categories yet. Add your first category to start.</p>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const isExpanded = expandedCategoryId === category.serviceCategoryId
            const services = servicesByCategory.get(category.serviceCategoryId) ?? []
            return (
              <AdminCard key={category.serviceCategoryId} className="overflow-hidden p-0">
                <div className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => setExpandedCategoryId(isExpanded ? null : category.serviceCategoryId)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    {isExpanded ? <ChevronDown size={18} className="text-brand-navy" /> : <ChevronRight size={18} className="text-brand-muted" />}
                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-[8px] border border-border bg-brand-surface">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.categoryName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-brand-muted"><ImageIcon size={14} /></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-brand-navy">{category.categoryName}</h3>
                        <StatusBadge status={category.isActive ? "completed" : "cancelled"}>
                          {category.isActive ? "active" : "inactive"}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-brand-muted">{services.length} {services.length === 1 ? "service" : "services"}</p>
                    </div>
                  </button>
                  <AdminButton type="button" variant="secondary" size="sm" iconLeft={<Pencil size={14} />} onClick={() => openEditCategory(category)}>
                    Edit
                  </AdminButton>
                  <AdminButton type="button" variant="destructive" size="sm" iconLeft={<Trash2 size={14} />} onClick={() => void deleteCategory(category)}>
                    Delete
                  </AdminButton>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-brand-surface/40 p-4 space-y-3">
                    {services.length === 0 ? (
                      <p className="text-sm text-brand-muted">No services in this category yet.</p>
                    ) : (
                      services.map((service) => (
                        <div key={service.serviceId} className="flex items-center gap-4 rounded-[12px] border border-border bg-white p-3">
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-[8px] border border-border bg-brand-surface">
                            {service.imageUrl ? (
                              <img src={service.imageUrl} alt={service.serviceName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-brand-muted"><ImageIcon size={16} /></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="truncate font-semibold text-brand-navy">{service.serviceName}</h4>
                              {!service.isActive && <StatusBadge status="cancelled">inactive</StatusBadge>}
                            </div>
                            <p className="text-xs text-brand-muted">
                              ₹{service.basePrice.toLocaleString("en-IN")} · {service.estimatedDurationInMinutes} min · {service.pricingModelName}
                            </p>
                          </div>
                          <AdminButton type="button" variant="secondary" size="sm" iconLeft={<Pencil size={14} />} onClick={() => openEditService(service)}>
                            Edit
                          </AdminButton>
                          <AdminButton type="button" variant="destructive" size="sm" iconLeft={<Trash2 size={14} />} onClick={() => void deleteService(service)}>
                            Delete
                          </AdminButton>
                        </div>
                      ))
                    )}
                    <AdminButton type="button" variant="secondary" size="sm" iconLeft={<Plus size={16} />} onClick={() => openCreateService(category.serviceCategoryId)}>
                      Add Service to {category.categoryName}
                    </AdminButton>
                  </div>
                )}
              </AdminCard>
            )
          })}
        </div>
      )}

      {/* Category modal */}
      {categoryForm && (
        <Modal
          title={categoryForm.serviceCategoryId ? "Edit Category" : "Add Category"}
          onClose={() => setCategoryForm(null)}
          footer={
            <>
              <AdminButton type="button" variant="secondary" onClick={() => setCategoryForm(null)}>Cancel</AdminButton>
              <AdminButton onClick={saveCategory} isLoading={isSaving}>Save</AdminButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-[8px] border border-border bg-brand-surface">
                {categoryForm.imageUrl ? (
                  <img src={categoryForm.imageUrl} alt="Category" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-muted"><ImageIcon size={18} /></div>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-border bg-white px-3 py-2 text-sm font-medium text-brand-navy hover:border-brand-navy/30">
                <Upload size={16} />
                {categoryImageBusy ? "Uploading…" : categoryForm.imageUrl ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  disabled={categoryImageBusy}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) handleCategoryFileSelected(file)
                    event.target.value = ""
                  }}
                />
              </label>
              {categoryForm.imageUrl && (
                <button type="button" className="text-xs font-semibold text-brand-muted hover:text-red-600" onClick={() => setCategoryForm({ ...categoryForm, imageUrl: null })}>
                  Remove
                </button>
              )}
            </div>

            <AdminTextField label="Category Name" value={categoryForm.categoryName} onChange={(event) => setCategoryForm({ ...categoryForm, categoryName: event.target.value })} />
            <AdminTextField label="Code" value={categoryForm.categoryCode} onChange={(event) => setCategoryForm({ ...categoryForm, categoryCode: event.target.value })} helperText="Leave blank to auto-generate from the name." />
            <AdminTextField label="Description" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} />
            <AdminTextField label="Sort Order" type="number" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: event.target.value })} />
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={categoryForm.isActive} onChange={(event) => setCategoryForm({ ...categoryForm, isActive: event.target.checked })} />
              Active
            </label>
          </div>
        </Modal>
      )}

      {/* Service modal */}
      {serviceForm && (
        <Modal
          title={serviceForm.serviceId ? "Edit Service" : "Add Service"}
          onClose={() => setServiceForm(null)}
          footer={
            <>
              <AdminButton type="button" variant="secondary" onClick={() => setServiceForm(null)}>Cancel</AdminButton>
              <AdminButton onClick={saveService} isLoading={isSaving}>Save</AdminButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-[8px] border border-border bg-brand-surface">
                {serviceForm.imageUrl ? (
                  <img src={serviceForm.imageUrl} alt="Service" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-muted"><ImageIcon size={18} /></div>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-border bg-white px-3 py-2 text-sm font-medium text-brand-navy hover:border-brand-navy/30">
                <Upload size={16} />
                {imageBusy ? "Uploading…" : serviceForm.imageUrl ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  disabled={imageBusy}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) handleServiceFileSelected(file)
                    event.target.value = ""
                  }}
                />
              </label>
              {serviceForm.imageUrl && (
                <button type="button" className="text-xs font-semibold text-brand-muted hover:text-red-600" onClick={() => setServiceForm({ ...serviceForm, imageUrl: null })}>
                  Remove
                </button>
              )}
            </div>

            <AdminTextField label="Service Name" value={serviceForm.serviceName} onChange={(event) => setServiceForm({ ...serviceForm, serviceName: event.target.value })} />

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Category</label>
              <select
                title="Category"
                value={serviceForm.serviceCategoryId}
                onChange={(event) => setServiceForm({ ...serviceForm, serviceCategoryId: Number(event.target.value) })}
                className="flex h-10 w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-navy focus-visible:border-brand-navy"
              >
                {categories.map((category) => (
                  <option key={category.serviceCategoryId} value={category.serviceCategoryId}>{category.categoryName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Pricing Model</label>
              <select
                title="Pricing Model"
                value={serviceForm.pricingModelId}
                onChange={(event) => setServiceForm({ ...serviceForm, pricingModelId: Number(event.target.value) })}
                className="flex h-10 w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-navy focus-visible:border-brand-navy"
              >
                <option value={0}>Select pricing model</option>
                {pricingModels.map((model) => (
                  <option key={model.pricingModelId} value={model.pricingModelId}>{model.pricingModelName}</option>
                ))}
              </select>
            </div>

            <AdminTextField label="Summary" value={serviceForm.summary} onChange={(event) => setServiceForm({ ...serviceForm, summary: event.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <AdminTextField label="Base Price (₹)" type="number" value={serviceForm.basePrice} onChange={(event) => setServiceForm({ ...serviceForm, basePrice: event.target.value })} />
              <AdminTextField label="Duration (min)" type="number" value={serviceForm.estimatedDurationInMinutes} onChange={(event) => setServiceForm({ ...serviceForm, estimatedDurationInMinutes: event.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <AdminTextField label="Code" value={serviceForm.serviceCode} onChange={(event) => setServiceForm({ ...serviceForm, serviceCode: event.target.value })} helperText="Auto from name if blank." />
              <AdminTextField label="Sort Order" type="number" value={serviceForm.sortOrder} onChange={(event) => setServiceForm({ ...serviceForm, sortOrder: event.target.value })} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={serviceForm.isActive} onChange={(event) => setServiceForm({ ...serviceForm, isActive: event.target.checked })} />
              Active
            </label>
          </div>
        </Modal>
      )}

      {cropFile && (
        <ImageCropModal
          file={cropFile}
          targetWidth={1280}
          targetHeight={720}
          title="Crop service image (16:9)"
          onCancel={() => setCropFile(null)}
          onCropped={(result) => void uploadCroppedServiceImage(result)}
        />
      )}

      {categoryCropFile && (
        <ImageCropModal
          file={categoryCropFile}
          targetWidth={1280}
          targetHeight={720}
          title="Crop category image (16:9)"
          onCancel={() => setCategoryCropFile(null)}
          onCropped={(result) => void uploadCroppedCategoryImage(result)}
        />
      )}
    </div>
  )
}
