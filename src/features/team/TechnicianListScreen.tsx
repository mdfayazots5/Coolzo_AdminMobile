/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { useNavigate } from "react-router-dom"
import { LayoutGrid, List, Plus, Search, Star, Users } from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminCard } from "@/components/shared/Cards"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { TechnicianCard } from "@/components/shared/TechnicianCard"
import { InlineLoader } from "@/components/shared/Layout"
import { AdminDropdown } from "@/components/shared/Pickers"
import { bookingLookupRepository, BookingZoneLookup } from "@/core/network/booking-lookup-repository"
import { useRBAC } from "@/core/auth/RBACProvider"
import { getApiErrorMessage } from "@/core/network/api-error"
import { Technician, technicianRepository, TechnicianStatus } from "@/core/network/technician-repository"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "list"

const availabilityOptions: { label: string; value: string }[] = [
  { label: "All statuses", value: "all" },
  { label: "Available", value: "available" },
  { label: "On Job", value: "on-job" },
  { label: "Off Duty", value: "off-duty" },
  { label: "On Leave", value: "on-leave" },
]

const minimumRatingOptions: { label: string; value: string }[] = [
  { label: "All ratings", value: "all" },
  { label: "4.5 and above", value: "4.5" },
  { label: "4.0 and above", value: "4.0" },
  { label: "3.5 and above", value: "3.5" },
]

export default function TechnicianListScreen() {
  const navigate = useNavigate()
  const { canCreate } = useRBAC()
  const [technicians, setTechnicians] = React.useState<Technician[]>([])
  const [zones, setZones] = React.useState<BookingZoneLookup[]>([])
  const [skillOptions, setSkillOptions] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [errorMessage, setErrorMessage] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [zoneFilter, setZoneFilter] = React.useState("all")
  const [skillFilter, setSkillFilter] = React.useState("all")
  const [availabilityFilter, setAvailabilityFilter] = React.useState("all")
  const [minimumRatingFilter, setMinimumRatingFilter] = React.useState("all")
  const [refreshKey, setRefreshKey] = React.useState(0)
  const deferredSearchQuery = React.useDeferredValue(searchQuery)

  React.useEffect(() => {
    const loadFilters = async () => {
      try {
        const [zoneData, allTechnicians] = await Promise.all([
          bookingLookupRepository.getZones(),
          technicianRepository.getTechnicians({}),
        ])

        setZones(zoneData)
        setSkillOptions(
          Array.from(
            new Set(
              allTechnicians
                .flatMap((technician) => technician.skills.map((skill) => skill.name))
                .filter((skillName) => skillName.trim().length > 0)
            )
          ).sort((left, right) => left.localeCompare(right))
        )
      } catch {
      }
    }

    void loadFilters()
  }, [])

  React.useEffect(() => {
    const loadTechnicians = async () => {
      setIsLoading(true)
      setErrorMessage("")

      try {
        const data = await technicianRepository.getTechnicians({
          searchTerm: deferredSearchQuery.trim() || undefined,
          zone: zoneFilter === "all" ? undefined : zoneFilter,
          skill: skillFilter === "all" ? undefined : skillFilter,
          availability: availabilityFilter === "all"
            ? undefined
            : (availabilityFilter as TechnicianStatus),
          minimumRating: minimumRatingFilter === "all" ? undefined : Number(minimumRatingFilter),
        })

        setTechnicians(data)
      } catch (error) {
        setTechnicians([])
        setErrorMessage(getApiErrorMessage(error, "Unable to load technician profiles"))
      } finally {
        setIsLoading(false)
      }
    }

    void loadTechnicians()
  }, [availabilityFilter, deferredSearchQuery, minimumRatingFilter, refreshKey, skillFilter, zoneFilter])

  const averageRating = technicians.length > 0
    ? (technicians.reduce((total, technician) => total + technician.rating, 0) / technicians.length).toFixed(1)
    : "0.0"

  const zoneOptions = [
    { label: "All zones", value: "all" },
    ...zones.map((zone) => ({
      label: `${zone.name}${zone.cityName ? ` • ${zone.cityName}` : ""}`,
      value: zone.name,
    })),
  ]

  const skillDropdownOptions = [
    { label: "All skills", value: "all" },
    ...skillOptions.map((skillName) => ({ label: skillName, value: skillName })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Technician Management</h1>
          <p className="text-sm text-brand-muted">
            Manage field coverage, skill readiness, zone alignment, and technician availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-brand-navy/10 bg-brand-navy/5 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-2 transition-all",
                viewMode === "grid" ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-navy"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md p-2 transition-all",
                viewMode === "list" ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-navy"
              )}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>
          {canCreate("team") && (
            <AdminButton onClick={() => navigate("/team/create")} iconLeft={<Plus size={18} />}>
              Add Technician
            </AdminButton>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr,1fr]">
        <AdminTextField
          label="Search"
          placeholder="Search by name, code, phone, email, or skill..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          prefixIcon={<Search size={18} />}
          className="bg-white"
        />
        <AdminCard className="flex items-center gap-4 p-4">
          <div className="rounded-xl bg-brand-navy p-3 text-brand-gold">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Loaded Technicians</p>
            <p className="text-xl font-bold text-brand-navy">{technicians.length}</p>
          </div>
        </AdminCard>
        <AdminCard className="flex items-center gap-4 p-4">
          <div className="rounded-xl bg-brand-gold/15 p-3 text-brand-gold">
            <Star size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Average Rating</p>
            <p className="text-xl font-bold text-brand-navy">{averageRating}</p>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminDropdown
          label="Zone"
          options={zoneOptions}
          value={zoneFilter}
          onChange={setZoneFilter}
        />
        <AdminDropdown
          label="Skill"
          options={skillDropdownOptions}
          value={skillFilter}
          onChange={setSkillFilter}
        />
        <AdminDropdown
          label="Availability"
          options={availabilityOptions}
          value={availabilityFilter}
          onChange={setAvailabilityFilter}
        />
        <AdminDropdown
          label="Minimum Rating"
          options={minimumRatingOptions}
          value={minimumRatingFilter}
          onChange={setMinimumRatingFilter}
        />
      </div>

      {isLoading ? (
        <InlineLoader />
      ) : errorMessage ? (
        <div className="space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div>
            <h3 className="text-lg font-bold text-brand-navy">Could not load technicians</h3>
            <p className="text-sm text-brand-muted">{errorMessage}</p>
          </div>
          <AdminButton onClick={() => setRefreshKey((current) => current + 1)}>
            Retry
          </AdminButton>
        </div>
      ) : technicians.length === 0 ? (
        <AdminCard className="p-10 text-center">
          <h3 className="text-lg font-bold text-brand-navy">No technicians match the current filters</h3>
          <p className="mt-2 text-sm text-brand-muted">
            Adjust the search, zone, skill, availability, or rating filters to broaden the result set.
          </p>
        </AdminCard>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
          )}
        >
          <AnimatePresence mode="popLayout">
            {technicians.map((technician, index) => (
              <motion.div
                key={technician.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, delay: index * 0.03 }}
              >
                <TechnicianCard
                  technician={technician}
                  onClick={() => navigate(`/team/${technician.id}`)}
                  className={viewMode === "list" ? "flex flex-row items-center gap-6" : ""}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
