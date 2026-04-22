/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Clock,
  Filter,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  SquarePen,
  User,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { AdminButton } from "@/components/shared/AdminButton"
import { StatusBadge } from "@/components/shared/Badges"
import { AdminCard } from "@/components/shared/Cards"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminDropdown, AdminBottomSheet } from "@/components/shared/Pickers"
import { bookingLookupRepository, BookingZoneLookup } from "@/core/network/booking-lookup-repository"
import { getApiErrorMessage } from "@/core/network/api-error"
import {
  HelperProfile,
  HelperUpdateInput,
  Technician,
  technicianRepository,
} from "@/core/network/technician-repository"

const resolveTechnicianStatusBadge = (status: Technician["status"]) => {
  if (status === "available") return "completed"
  if (status === "on-job") return "assigned"
  if (status === "off-duty") return "closed"
  return "urgent"
}

const resolveHelperStatusBadge = (helper: HelperProfile) => {
  if (!helper.activeFlag) {
    return "closed"
  }

  if ((helper.currentAssignmentStatus || "").toLowerCase().includes("assign")) {
    return "assigned"
  }

  return "completed"
}

export default function TechnicianAvailabilityBoard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const serviceRequestId = searchParams.get("srId") || undefined
  const [technicians, setTechnicians] = React.useState<Technician[]>([])
  const [helpers, setHelpers] = React.useState<HelperProfile[]>([])
  const [zones, setZones] = React.useState<BookingZoneLookup[]>([])
  const [zoneFilter, setZoneFilter] = React.useState("all")
  const [helperSearch, setHelperSearch] = React.useState("")
  const [errorMessage, setErrorMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [editingHelper, setEditingHelper] = React.useState<HelperProfile | null>(null)
  const [helperForm, setHelperForm] = React.useState<HelperUpdateInput>({
    code: "",
    name: "",
    mobileNo: "",
    activeFlag: true,
  })
  const [isSavingHelper, setIsSavingHelper] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const deferredHelperSearch = React.useDeferredValue(helperSearch)

  React.useEffect(() => {
    const loadBoard = async () => {
      setIsLoading(true)
      setErrorMessage("")

      try {
        const [technicianData, helperData, zoneData] = await Promise.all([
          technicianRepository.getAvailabilityBoard(serviceRequestId),
          technicianRepository.getHelpers(deferredHelperSearch.trim() || undefined),
          bookingLookupRepository.getZones(),
        ])

        setTechnicians(technicianData)
        setHelpers(helperData)
        setZones(zoneData)
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Unable to load technician availability"))
      } finally {
        setIsLoading(false)
      }
    }

    void loadBoard()
  }, [deferredHelperSearch, refreshKey, serviceRequestId])

  const activeZone = zones.find((zone) => zone.id === zoneFilter)
  const filteredTechnicians = zoneFilter === "all"
    ? technicians
    : technicians.filter((technician) =>
        technician.zoneAssignments.some((zone) => zone.zoneId === zoneFilter || zone.name === activeZone?.name) ||
        technician.zones.includes(activeZone?.name || "")
      )

  const openHelperEditor = (helper: HelperProfile) => {
    setEditingHelper(helper)
    setHelperForm({
      code: helper.code,
      name: helper.name,
      mobileNo: helper.mobileNo,
      activeFlag: helper.activeFlag,
    })
  }

  const closeHelperEditor = () => {
    setEditingHelper(null)
    setHelperForm({
      code: "",
      name: "",
      mobileNo: "",
      activeFlag: true,
    })
  }

  const handleHelperSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!editingHelper) {
      return
    }

    setIsSavingHelper(true)

    try {
      const updatedHelper = await technicianRepository.updateHelper(editingHelper.id, {
        code: helperForm.code.trim(),
        name: helperForm.name.trim(),
        mobileNo: helperForm.mobileNo.trim(),
        activeFlag: helperForm.activeFlag,
      })

      setHelpers((current) => current.map((helper) => helper.id === updatedHelper.id ? updatedHelper : helper))
      toast.success("Helper profile updated")
      closeHelperEditor()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update helper profile"))
    } finally {
      setIsSavingHelper(false)
    }
  }

  const zoneOptions = [
    { label: "All zones", value: "all" },
    ...zones.map((zone) => ({
      label: `${zone.name}${zone.cityName ? ` • ${zone.cityName}` : ""}`,
      value: zone.id,
    })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Availability Board</h1>
          <p className="text-sm text-brand-muted">
            Live technician dispatch posture, zone coverage, and helper assignment visibility.
          </p>
          {serviceRequestId && (
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-gold">
              Dispatch context loaded for Service Request #{serviceRequestId}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-brand-navy/10 bg-brand-navy/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-brand-muted" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy">
                {filteredTechnicians.length} technicians in view
              </span>
            </div>
          </div>
          <AdminButton variant="outline" size="sm" onClick={() => setRefreshKey((current) => current + 1)}>
            <RefreshCw size={16} className="mr-2" />
            Refresh Board
          </AdminButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr,1fr] xl:grid-cols-[1fr,1fr,1fr]">
        <AdminDropdown
          label="Zone Filter"
          options={zoneOptions}
          value={zoneFilter}
          onChange={setZoneFilter}
        />
        <AdminTextField
          label="Search Helpers"
          value={helperSearch}
          onChange={(event) => setHelperSearch(event.target.value)}
          placeholder="Search by helper name, code, or mobile..."
          prefixIcon={<Search size={18} />}
        />
        <AdminCard className="flex items-center gap-4 p-4">
          <div className="rounded-xl bg-brand-navy p-3 text-brand-gold">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Active Helpers</p>
            <p className="text-xl font-bold text-brand-navy">{helpers.filter((helper) => helper.activeFlag).length}</p>
          </div>
        </AdminCard>
      </div>

      {isLoading ? (
        <InlineLoader />
      ) : errorMessage ? (
        <div className="space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div>
            <h3 className="text-lg font-bold text-brand-navy">Could not load availability board</h3>
            <p className="text-sm text-brand-muted">{errorMessage}</p>
          </div>
          <AdminButton onClick={() => setRefreshKey((current) => current + 1)}>
            Retry
          </AdminButton>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredTechnicians.map((technician) => (
              <AdminCard key={technician.id} className="border-l-4 border-l-brand-gold p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg border border-brand-navy/10 bg-brand-navy/5 text-brand-navy">
                      {technician.photo ? (
                        <img src={technician.photo} alt={technician.name} className="size-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brand-navy">{technician.name}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{technician.employeeId}</p>
                    </div>
                  </div>
                  <StatusBadge status={resolveTechnicianStatusBadge(technician.status)} className="text-[8px] px-1.5 py-0.5">
                    {technician.status.replace("-", " ")}
                  </StatusBadge>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-brand-muted">
                      <MapPin size={12} />
                      Coverage
                    </span>
                    <span className="font-bold text-brand-navy">{technician.zones.join(", ")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-brand-muted">
                      <Clock size={12} />
                      Next Free
                    </span>
                    <span className="font-bold text-brand-gold">{technician.nextFreeSlot || "Unspecified"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-brand-muted">
                      <ShieldCheck size={12} />
                      SLA / Rating
                    </span>
                    <span className="font-bold text-brand-navy">
                      {technician.performance.slaCompliance}% • {technician.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {technician.currentJobId && (
                  <div className="mt-4 rounded-lg border border-brand-navy/10 bg-brand-navy/5 p-3">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-brand-muted">Active Job</p>
                    <p className="text-[11px] font-bold text-brand-navy">{technician.currentJobId}</p>
                  </div>
                )}

                <AdminButton
                  variant={technician.status === "available" ? "primary" : "secondary"}
                  size="sm"
                  className="mt-4 w-full text-[10px] font-bold uppercase tracking-widest"
                  onClick={() => navigate(`/team/${technician.id}`)}
                >
                  View Profile
                </AdminButton>
              </AdminCard>
            ))}
          </div>

          <div className="pt-4">
            <SectionHeader title="Field Assistants / Helpers" icon={<Users size={18} />} className="mb-4 border-t-0 pt-0" />
            {helpers.length === 0 ? (
              <AdminCard className="p-8 text-center">
                <h3 className="text-lg font-bold text-brand-navy">No helpers match the current search</h3>
                <p className="mt-2 text-sm text-brand-muted">
                  Adjust the helper search to review paired field assistants and update their profiles.
                </p>
              </AdminCard>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {helpers.map((helper) => (
                  <AdminCard key={helper.id} className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-brand-navy/5 text-brand-navy">
                          <User size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-brand-navy">{helper.name}</h4>
                          <p className="text-[10px] uppercase tracking-widest text-brand-muted">{helper.code}</p>
                        </div>
                      </div>
                      <StatusBadge status={resolveHelperStatusBadge(helper)} className="text-[8px] px-1.5 py-0.5">
                        {helper.activeFlag ? helper.currentAssignmentStatus || "Active" : "Inactive"}
                      </StatusBadge>
                    </div>

                    <div className="space-y-2 text-[11px] text-brand-muted">
                      <div className="flex items-center gap-2">
                        <Phone size={12} />
                        <span className="font-medium text-brand-navy">{helper.mobileNo}</span>
                      </div>
                      <div className="rounded-xl border border-brand-navy/10 bg-brand-navy/[0.02] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-brand-muted">Assigned To</p>
                        <p className="mt-1 text-[11px] font-bold text-brand-navy">{helper.pairedTechnicianName || "Not paired"}</p>
                        <p className="mt-1 text-[10px] text-brand-muted">{helper.serviceRequestNumber || "No active service request"}</p>
                      </div>
                    </div>

                    <AdminButton
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => openHelperEditor(helper)}
                    >
                      <SquarePen size={16} className="mr-2" />
                      Edit Helper
                    </AdminButton>
                  </AdminCard>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <AdminBottomSheet
        isOpen={Boolean(editingHelper)}
        onClose={closeHelperEditor}
        title="Edit Helper Profile"
        description="Update helper identity and activation state for team operations."
      >
        <form onSubmit={handleHelperSubmit} className="space-y-4">
          <AdminTextField
            label="Helper Code"
            value={helperForm.code}
            onChange={(event) => setHelperForm((current) => ({ ...current, code: event.target.value }))}
            required
          />
          <AdminTextField
            label="Helper Name"
            value={helperForm.name}
            onChange={(event) => setHelperForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <AdminTextField
            label="Mobile Number"
            value={helperForm.mobileNo}
            onChange={(event) => setHelperForm((current) => ({ ...current, mobileNo: event.target.value }))}
            required
          />
          <label className="flex items-center gap-3 rounded-[8px] border border-input bg-brand-surface px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={helperForm.activeFlag}
              onChange={(event) => setHelperForm((current) => ({ ...current, activeFlag: event.target.checked }))}
              className="size-4 rounded border-border"
            />
            <span className="font-medium text-brand-navy">Helper is available for assignment</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <AdminButton type="button" variant="outline" onClick={closeHelperEditor}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" isLoading={isSavingHelper}>
              Save Helper
            </AdminButton>
          </div>
        </form>
      </AdminBottomSheet>
    </div>
  )
}
