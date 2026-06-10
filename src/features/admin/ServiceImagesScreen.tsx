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
import { toast } from "sonner"

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.slice(result.indexOf(",") + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export default function ServiceImagesScreen() {
  const { uploadMasterImage } = useMasterData()
  const [services, setServices] = React.useState<AdminServiceItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<number | null>(null)

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

  const handleUpload = async (service: AdminServiceItem, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must not exceed 5 MB")
      return
    }

    setBusyId(service.serviceId)
    try {
      const base64Content = await readFileAsBase64(file)
      const url = await uploadMasterImage("services", {
        fileName: file.name,
        contentType: file.type,
        base64Content,
      })
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
                              void handleUpload(service, file)
                            }
                            event.target.value = ""
                          }}
                        />
                      </label>
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
    </div>
  )
}
