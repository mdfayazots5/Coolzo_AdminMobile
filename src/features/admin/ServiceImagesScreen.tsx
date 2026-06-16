/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { useMasterData } from "@/core/master-data/MasterDataProvider"
import { serviceCatalogRepository, type AdminServiceItem } from "@/core/network/service-catalog-repository"
import { Image as ImageIcon, PackageSearch, Upload } from "lucide-react"
import ImageCropModal, { type CroppedImage } from "@/components/shared/ImageCropModal"
import ImagePromptStudio from "@/components/shared/ImagePromptStudio"
import { composeServicePrompt, defaultServiceSubject } from "@/lib/image-prompts"
import { toast } from "sonner"

export default function ServiceImagesScreen() {
  const { uploadMasterImage } = useMasterData()
  const [services, setServices] = React.useState<AdminServiceItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [cropTarget, setCropTarget] = React.useState<{ service: AdminServiceItem; file: File } | null>(null)

  React.useEffect(() => {
    const load = async () => {
      try {
        setServices(await serviceCatalogRepository.getServices())
      } catch (error) {
        console.error(error)
        toast.error("Unable to load services")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const applyImage = (serviceId: number, imageUrl: string) => {
    setServices((current) =>
      current.map((service) => (service.serviceId === serviceId ? { ...service, imageUrl } : service))
    )
  }

  const handleFileSelected = (service: AdminServiceItem, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    setCropTarget({ service, file })
  }

  const uploadCropped = async (service: AdminServiceItem, cropped: CroppedImage) => {
    setCropTarget(null)
    setBusyId(service.serviceId)
    try {
      const url = await uploadMasterImage("services", cropped)
      await serviceCatalogRepository.setServiceImage(service.serviceId, url)
      applyImage(service.serviceId, url)
      toast.success(`Image saved for ${service.serviceName}`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload image")
    } finally {
      setBusyId(null)
    }
  }

  const savePrompt = async (service: AdminServiceItem, prompt: string) => {
    const updated = await serviceCatalogRepository.setServicePrompt(service.serviceId, prompt || null)
    setServices((current) =>
      current.map((item) =>
        item.serviceId === service.serviceId ? { ...item, imageAIPrompt: updated.imageAIPrompt ?? "" } : item,
      ),
    )
  }

  const handleRemove = async (service: AdminServiceItem) => {
    setBusyId(service.serviceId)
    try {
      await serviceCatalogRepository.setServiceImage(service.serviceId, null)
      applyImage(service.serviceId, "")
      toast.success(`Image removed for ${service.serviceName}`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to remove image")
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) {
    return <InlineLoader />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Service Images</h1>
        <p className="text-sm text-brand-muted">
          Upload a photo for each bookable service. Images are saved immediately and shown on the public website.
        </p>
      </div>

      {services.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-[12px] border border-border bg-brand-surface px-4 py-3 text-sm">
          <span className="font-medium text-brand-navy">{services.length} services</span>
          <span className="text-brand-muted">
            <span className="font-medium text-brand-navy">
              {services.filter((service) => service.imageUrl).length}
            </span>{" "}
            with an image
          </span>
          <span className="text-brand-muted">
            <span className="font-medium text-brand-navy">
              {services.filter((service) => !service.imageUrl).length}
            </span>{" "}
            still need one
          </span>
          <span className="text-brand-muted">
            <span className="font-medium text-brand-navy">
              {services.filter((service) => service.imageAIPrompt).length}
            </span>{" "}
            custom prompts saved
          </span>
        </div>
      )}

      <SectionHeader title="Bookable Services" icon={<PackageSearch size={18} />} />

      {services.length === 0 ? (
        <AdminCard className="p-8 text-center">
          <p className="text-sm font-medium text-brand-muted">No bookable services found.</p>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => {
            const isBusy = busyId === service.serviceId
            return (
              <AdminCard key={service.serviceId} className="p-5">
                <div className="flex gap-4">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-[8px] border border-border bg-brand-surface">
                    {service.imageUrl ? (
                      <img src={service.imageUrl} alt={service.serviceName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-muted">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-brand-navy">{service.serviceName}</h3>
                    {service.summary && (
                      <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">{service.summary}</p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-border bg-white px-3 py-2 text-sm font-medium text-brand-navy hover:border-brand-navy/30">
                        <Upload size={16} />
                        {isBusy ? "Saving…" : service.imageUrl ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          disabled={isBusy}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) {
                              handleFileSelected(service, file)
                            }
                            event.target.value = ""
                          }}
                        />
                      </label>
                      <ImagePromptStudio
                        title={service.serviceName}
                        dimensionHint="1280×720 · 16:9"
                        suggestedSeed={defaultServiceSubject({
                          serviceName: service.serviceName,
                          summary: service.summary,
                        })}
                        savedSeed={service.imageAIPrompt ?? ""}
                        compose={composeServicePrompt}
                        disabled={isBusy}
                        onSave={(seed) => savePrompt(service, seed)}
                      />
                      {service.imageUrl && (
                        <AdminButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => void handleRemove(service)}
                        >
                          Remove
                        </AdminButton>
                      )}
                    </div>
                  </div>
                </div>
              </AdminCard>
            )
          })}
        </div>
      )}

      {cropTarget && (
        <ImageCropModal
          file={cropTarget.file}
          targetWidth={1280}
          targetHeight={720}
          title="Crop service image (16:9)"
          onCancel={() => setCropTarget(null)}
          onCropped={(result) => void uploadCropped(cropTarget.service, result)}
        />
      )}
    </div>
  )
}
