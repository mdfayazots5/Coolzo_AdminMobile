/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"
import {
  ArrowLeft,
  Award,
  Calendar,
  Clock,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Star,
  TrendingUp,
  User,
  UserCog,
  CheckCircle2,
  XCircle,
  Navigation,
  Route,
  AlertCircle,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminCard } from "@/components/shared/Cards"
import { StatusBadge } from "@/components/shared/Badges"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminDropdown } from "@/components/shared/Pickers"
import { PerformanceKPIBlock } from "@/components/shared/TechnicianCard"
import { bookingLookupRepository, BookingZoneLookup } from "@/core/network/booking-lookup-repository"
import { getApiErrorMessage } from "@/core/network/api-error"
import {
  AttendanceRecord,
  Technician,
  TechnicianGpsLog,
  TechnicianSkillCategory,
  TechnicianSkillInput,
  technicianRepository,
} from "@/core/network/technician-repository"
import { cn } from "@/lib/utils"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const defaultMarkerIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = defaultMarkerIcon

type DetailTab = "performance" | "attendance" | "skills" | "coverage" | "gps"

type CalendarCell = {
  key: string
  isEmpty: boolean
  dayNumber?: number
  date?: string
  attendance?: AttendanceRecord
}

const tabOptions: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
  { id: "performance", label: "Performance", icon: <TrendingUp size={16} /> },
  { id: "attendance", label: "Attendance", icon: <Calendar size={16} /> },
  { id: "skills", label: "Skills", icon: <Award size={16} /> },
  { id: "coverage", label: "Zone Coverage", icon: <MapPin size={16} /> },
  { id: "gps", label: "GPS Trail", icon: <Navigation size={16} /> },
]

const skillCategoryOptions: { label: string; value: TechnicianSkillCategory }[] = [
  { label: "Brand", value: "brand" },
  { label: "Equipment", value: "equipment" },
  { label: "Special", value: "special" },
]

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const getCurrentMonthValue = () => new Date().toISOString().slice(0, 7)
const getCurrentDateValue = () => new Date().toISOString().slice(0, 10)

const formatDateTimeLabel = (value?: string) => {
  if (!value) {
    return "Not recorded"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatDateLabel = (value?: string) => {
  if (!value) {
    return "Not scheduled"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const formatMonthHeading = (monthValue: string) => {
  const [year, month] = monthValue.split("-").map(Number)
  if (!year || !month) {
    return monthValue
  }

  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

const resolveStatusBadge = (status: Technician["status"]) => {
  if (status === "available") return "completed"
  if (status === "on-job") return "assigned"
  if (status === "off-duty") return "closed"
  return "urgent"
}

const resolveAttendanceTone = (record?: AttendanceRecord) => {
  if (!record) {
    return "border-border bg-white text-brand-muted"
  }

  if (record.status === "present") {
    return "border-status-completed/20 bg-status-completed/10 text-status-completed"
  }

  if (record.status === "leave") {
    return "border-brand-gold/20 bg-brand-gold/10 text-brand-gold"
  }

  if (record.status === "holiday") {
    return "border-brand-navy/15 bg-brand-navy/5 text-brand-navy"
  }

  return "border-status-emergency/20 bg-status-emergency/10 text-status-emergency"
}

const buildAttendanceCalendar = (monthValue: string, records: AttendanceRecord[]): CalendarCell[] => {
  const [year, month] = monthValue.split("-").map(Number)
  if (!year || !month) {
    return []
  }

  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const leadingEmptyCells = firstDay.getUTCDay()
  const recordByDate = new Map(records.map((record) => [record.date.slice(0, 10), record]))
  const cells: CalendarCell[] = []

  for (let index = 0; index < leadingEmptyCells; index += 1) {
    cells.push({ key: `empty-start-${index}`, isEmpty: true })
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    cells.push({
      key: dateKey,
      isEmpty: false,
      dayNumber: day,
      date: dateKey,
      attendance: recordByDate.get(dateKey),
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `empty-end-${cells.length}`, isEmpty: true })
  }

  return cells
}

function GpsMapRefocus({ center }: { center: [number, number] }) {
  const map = useMap()

  React.useEffect(() => {
    map.setView(center, 13)
  }, [center, map])

  return null
}

export default function TechnicianDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [technician, setTechnician] = React.useState<Technician | null>(null)
  const [zones, setZones] = React.useState<BookingZoneLookup[]>([])
  const [attendance, setAttendance] = React.useState<AttendanceRecord[]>([])
  const [gpsLog, setGpsLog] = React.useState<TechnicianGpsLog[]>([])
  const [activeTab, setActiveTab] = React.useState<DetailTab>("performance")
  const [monthValue, setMonthValue] = React.useState(getCurrentMonthValue())
  const [gpsDate, setGpsDate] = React.useState(getCurrentDateValue())
  const [selectedZoneIds, setSelectedZoneIds] = React.useState<string[]>([])
  const [primaryZoneId, setPrimaryZoneId] = React.useState("")
  const [draftSkills, setDraftSkills] = React.useState<TechnicianSkillInput[]>([])
  const [newSkillName, setNewSkillName] = React.useState("")
  const [newSkillCode, setNewSkillCode] = React.useState("")
  const [newSkillCategory, setNewSkillCategory] = React.useState<TechnicianSkillCategory>("brand")
  const [leaveDate, setLeaveDate] = React.useState(getCurrentDateValue())
  const [leaveReason, setLeaveReason] = React.useState("")
  const [errorMessage, setErrorMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSavingSkills, setIsSavingSkills] = React.useState(false)
  const [isSavingZones, setIsSavingZones] = React.useState(false)
  const [isSubmittingLeave, setIsSubmittingLeave] = React.useState(false)
  const [isRefreshingAttendance, setIsRefreshingAttendance] = React.useState(false)
  const [isRefreshingGps, setIsRefreshingGps] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const syncTechnicianState = (profile: Technician) => {
    setTechnician(profile)
    setDraftSkills(
      profile.skills.map((skill) => ({
        code: skill.code,
        name: skill.name,
        category: skill.category,
        certifiedDate: skill.certifiedDate,
      }))
    )
    setSelectedZoneIds(profile.zoneAssignments.map((zone) => zone.zoneId))
    setPrimaryZoneId(
      profile.zoneAssignments.find((zone) => zone.isPrimary)?.zoneId ||
        profile.zoneAssignments[0]?.zoneId ||
        ""
    )
  }

  React.useEffect(() => {
    const loadProfile = async () => {
      if (!id) {
        setErrorMessage("Technician identifier is missing")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage("")

      try {
        const [profile, zoneData] = await Promise.all([
          technicianRepository.getTechnicianById(id),
          bookingLookupRepository.getZones(),
        ])

        if (!profile) {
          toast.error("Technician not found")
          navigate("/team")
          return
        }

        setZones(zoneData)
        syncTechnicianState(profile)
        setAttendance(profile.attendance)
        setGpsLog(profile.gpsLog)
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Unable to load technician profile"))
      } finally {
        setIsLoading(false)
      }
    }

    void loadProfile()
  }, [id, navigate, refreshKey])

  React.useEffect(() => {
    const loadAttendance = async () => {
      if (!id || !technician) {
        return
      }

      const [year, month] = monthValue.split("-").map(Number)
      if (!year || !month) {
        return
      }

      setIsRefreshingAttendance(true)

      try {
        const records = await technicianRepository.getTechnicianAttendance(id, year, month)
        setAttendance(records)
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load attendance calendar"))
      } finally {
        setIsRefreshingAttendance(false)
      }
    }

    void loadAttendance()
  }, [id, monthValue, technician])

  React.useEffect(() => {
    const loadGpsLog = async () => {
      if (!id || !technician) {
        return
      }

      setIsRefreshingGps(true)

      try {
        const records = await technicianRepository.getGpsLog(id, gpsDate)
        setGpsLog(records)
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load GPS trail"))
      } finally {
        setIsRefreshingGps(false)
      }
    }

    void loadGpsLog()
  }, [gpsDate, id, technician])

  const refreshProfile = async () => {
    if (!id) {
      return
    }

    try {
      const profile = await technicianRepository.getTechnicianById(id)
      if (profile) {
        syncTechnicianState(profile)
        setAttendance(profile.attendance)
        setGpsLog(profile.gpsLog)
        setErrorMessage("")
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to refresh technician profile"))
    }
  }

  const toggleZone = (zoneId: string) => {
    setSelectedZoneIds((current) => {
      const nextZoneIds = current.includes(zoneId)
        ? current.filter((value) => value !== zoneId)
        : [...current, zoneId]

      if (nextZoneIds.length === 0) {
        setPrimaryZoneId("")
      } else if (!nextZoneIds.includes(primaryZoneId)) {
        setPrimaryZoneId(nextZoneIds[0])
      }

      return nextZoneIds
    })
  }

  const addSkillDraft = () => {
    if (!newSkillName.trim()) {
      return
    }

    setDraftSkills((current) => [
      ...current,
      {
        code: newSkillCode.trim(),
        name: newSkillName.trim(),
        category: newSkillCategory,
      },
    ])
    setNewSkillName("")
    setNewSkillCode("")
    setNewSkillCategory("brand")
  }

  const removeSkillDraft = (index: number) => {
    setDraftSkills((current) => current.filter((_, skillIndex) => skillIndex !== index))
  }

  const handleSaveSkills = async () => {
    if (!id) {
      return
    }

    setIsSavingSkills(true)

    try {
      const updatedSkills = await technicianRepository.updateSkills(id, draftSkills)
      setDraftSkills(
        updatedSkills.map((skill) => ({
          code: skill.code,
          name: skill.name,
          category: skill.category,
          certifiedDate: skill.certifiedDate,
        }))
      )
      setTechnician((current) => current ? { ...current, skills: updatedSkills } : current)
      await refreshProfile()
      toast.success("Technician skill tags updated")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update technician skills"))
    } finally {
      setIsSavingSkills(false)
    }
  }

  const handleSaveZones = async () => {
    if (!id) {
      return
    }

    if (selectedZoneIds.length === 0 || !primaryZoneId) {
      toast.error("Assign at least one zone and select a primary zone")
      return
    }

    setIsSavingZones(true)

    try {
      const updatedZones = await technicianRepository.updateZones(id, selectedZoneIds, primaryZoneId)
      const primaryZoneName = updatedZones.find((zone) => zone.isPrimary)?.name || updatedZones[0]?.name || "Unassigned"
      setTechnician((current) => current ? {
        ...current,
        zoneAssignments: updatedZones,
        zones: updatedZones.map((zone) => zone.name),
        branch: primaryZoneName,
      } : current)
      setSelectedZoneIds(updatedZones.map((zone) => zone.zoneId))
      setPrimaryZoneId(updatedZones.find((zone) => zone.isPrimary)?.zoneId || updatedZones[0]?.zoneId || "")
      await refreshProfile()
      toast.success("Technician zone coverage updated")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update zone assignments"))
    } finally {
      setIsSavingZones(false)
    }
  }

  const handleRequestLeave = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!id) {
      return
    }

    setIsSubmittingLeave(true)

    try {
      await technicianRepository.requestLeave(id, {
        leaveDate,
        leaveReason: leaveReason.trim() || undefined,
      })
      setLeaveReason("")
      const requestedMonth = leaveDate.slice(0, 7)
      setMonthValue(requestedMonth)
      const [year, month] = requestedMonth.split("-").map(Number)
      if (year && month) {
        const records = await technicianRepository.getTechnicianAttendance(id, year, month)
        setAttendance(records)
      }
      await refreshProfile()
      toast.success("Leave request submitted")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to submit leave request"))
    } finally {
      setIsSubmittingLeave(false)
    }
  }

  const handleReviewLeave = async (record: AttendanceRecord, decision: "approve" | "reject") => {
    if (!id) {
      return
    }

    try {
      await technicianRepository.reviewLeave(id, record.id, { decision })
      const [year, month] = monthValue.split("-").map(Number)
      if (year && month) {
        const records = await technicianRepository.getTechnicianAttendance(id, year, month)
        setAttendance(records)
      }
      await refreshProfile()
      toast.success(decision === "approve" ? "Leave request approved" : "Leave request rejected")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update leave request"))
    }
  }

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  if (errorMessage || !technician) {
    return (
      <div className="space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
        <div>
          <h3 className="text-lg font-bold text-brand-navy">Could not load technician profile</h3>
          <p className="text-sm text-brand-muted">{errorMessage || "Technician not found"}</p>
        </div>
        <div className="flex justify-center gap-3">
          <AdminButton variant="outline" onClick={() => navigate("/team")}>
            Back to Team
          </AdminButton>
          <AdminButton onClick={() => setRefreshKey((current) => current + 1)}>
            Retry
          </AdminButton>
        </div>
      </div>
    )
  }

  const pendingLeaveRequests = attendance.filter((record) =>
    record.workflowStatus.toLowerCase().includes("requested")
  )
  const attendanceCalendar = buildAttendanceCalendar(monthValue, attendance)
  const lastGpsPoint = gpsLog.length > 0 ? gpsLog[gpsLog.length - 1] : null
  const gpsCenter: [number, number] = lastGpsPoint
    ? [lastGpsPoint.latitude, lastGpsPoint.longitude]
    : [19.076, 72.8777]
  const gpsPolyline = gpsLog.map((record) => [record.latitude, record.longitude] as [number, number])
  const slaDelta = Number((technician.performance.slaCompliance - technician.performance.teamAverageSlaCompliance).toFixed(1))

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/team")}
            className="rounded-full p-2 transition-colors hover:bg-brand-navy/5"
          >
            <ArrowLeft size={20} className="text-brand-navy" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-brand-navy/10 bg-brand-navy/5 text-brand-navy">
              {technician.photo ? (
                <img src={technician.photo} alt={technician.name} className="size-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={28} />
              )}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-brand-navy">{technician.name}</h1>
                <StatusBadge status={resolveStatusBadge(technician.status)}>
                  {technician.status.replace("-", " ")}
                </StatusBadge>
              </div>
              <p className="text-xs text-brand-muted">
                {technician.employeeId} • {technician.designation} • {technician.branch}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton variant="outline" size="sm" onClick={() => void refreshProfile()}>
            Refresh Profile
          </AdminButton>
          <AdminButton size="sm" onClick={() => navigate(`/team/${technician.id}/edit`)}>
            <Edit2 size={16} className="mr-2" />
            Edit Profile
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Contact & Dispatch" icon={<Phone size={18} />} className="mb-4 border-t-0 pt-0" />
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-brand-navy">
                <Phone size={16} className="text-brand-muted" />
                <span className="text-sm font-medium">{technician.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-brand-navy">
                <Mail size={16} className="text-brand-muted" />
                <span className="text-sm font-medium">{technician.email || "No email on file"}</span>
              </div>
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Assigned Zones</p>
                <div className="flex flex-wrap gap-2">
                  {technician.zoneAssignments.length > 0 ? technician.zoneAssignments.map((zone) => (
                    <span
                      key={zone.id}
                      className={cn(
                        "rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest",
                        zone.isPrimary
                          ? "border-brand-gold/30 bg-brand-gold/10 text-brand-gold"
                          : "border-brand-navy/10 bg-brand-navy/5 text-brand-navy"
                      )}
                    >
                      {zone.name}
                    </span>
                  )) : (
                    <span className="text-sm text-brand-muted">No zone assignments</span>
                  )}
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Operational Snapshot" icon={<Clock size={18} />} className="mb-4 border-t-0 pt-0" />
            <div className="space-y-3">
              <div className="rounded-xl bg-brand-navy/5 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Current Job</p>
                <p className="text-sm font-bold text-brand-navy">{technician.currentJobId || "No active assignment"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-brand-navy/5 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Jobs Today</p>
                  <p className="text-sm font-bold text-brand-navy">{technician.todayJobCount}</p>
                </div>
                <div className="rounded-xl bg-brand-navy/5 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Next Free</p>
                  <p className="text-sm font-bold text-brand-gold">{technician.nextFreeSlot || "Unspecified"}</p>
                </div>
              </div>
              <div className="rounded-xl border border-brand-navy/10 bg-brand-navy/[0.02] p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Max Daily Assignments</p>
                <p className="text-sm font-bold text-brand-navy">{technician.maxDailyAssignments}</p>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Readiness" icon={<UserCog size={18} />} className="mb-4 border-t-0 pt-0" />
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-brand-navy/5 p-3">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">Onboarding</span>
                <span className="text-sm font-bold text-brand-navy">{technician.onboardingStatus}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-brand-navy/5 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Docs Verified</p>
                  <p className="text-sm font-bold text-brand-navy">
                    {technician.verifiedDocumentCount}/{technician.uploadedDocumentCount}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-navy/5 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Trainings</p>
                  <p className="text-sm font-bold text-brand-navy">{technician.completedTrainingCount}</p>
                </div>
              </div>
              <div className="rounded-xl border border-brand-navy/10 bg-brand-navy/[0.02] p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Latest Assessment</p>
                <p className="text-sm font-bold text-brand-navy">{technician.latestAssessmentResult}</p>
              </div>
              {technician.pendingEligibilityItems.length > 0 && (
                <div className="rounded-xl border border-status-emergency/20 bg-status-emergency/5 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-status-emergency">Pending Eligibility Items</p>
                  <div className="space-y-2">
                    {technician.pendingEligibilityItems.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs text-brand-navy">
                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-status-emergency" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <div className="flex overflow-x-auto border-b border-border no-scrollbar">
            {tabOptions.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-4 text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "border-brand-gold text-brand-navy"
                    : "border-transparent text-brand-muted hover:text-brand-navy"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "performance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <PerformanceKPIBlock
                  label="Average Rating"
                  value={technician.performance.avgRating.toFixed(1)}
                  icon={<Star size={20} />}
                  colorClass="bg-status-pending/10 text-status-pending"
                />
                <PerformanceKPIBlock
                  label="Jobs Completed"
                  value={technician.performance.completedJobs}
                  subValue={`${technician.performance.totalJobs} assigned overall`}
                  icon={<CheckCircle2 size={20} />}
                  colorClass="bg-brand-navy/10 text-brand-navy"
                />
                <PerformanceKPIBlock
                  label="SLA Compliance"
                  value={`${technician.performance.slaCompliance}%`}
                  trend={{ val: Math.abs(slaDelta), positive: slaDelta >= 0 }}
                  icon={<ShieldCheck size={20} />}
                  colorClass="bg-status-completed/10 text-status-completed"
                />
                <PerformanceKPIBlock
                  label="Revisit Rate"
                  value={`${technician.performance.revisitRate}%`}
                  icon={<Route size={20} />}
                  colorClass="bg-status-emergency/10 text-status-emergency"
                />
              </div>

              <AdminCard className="p-6">
                <SectionHeader title="Performance Trend" icon={<TrendingUp size={18} />} className="mb-4 border-t-0 pt-0" />
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={technician.performance.trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748B", fontSize: 10, fontWeight: 600 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Line type="monotone" dataKey="jobsCompleted" stroke="#0F172A" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="slaCompliance" stroke="#D4AF37" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </AdminCard>

              <AdminCard className="p-6">
                <SectionHeader title="Performance Insight" icon={<ShieldCheck size={18} />} className="mb-4 border-t-0 pt-0" />
                <div className="rounded-2xl border border-brand-navy/10 bg-brand-navy/[0.02] p-4">
                  <p className="text-sm leading-relaxed text-brand-navy">
                    {technician.name} is operating{" "}
                    <span className={cn("font-bold", slaDelta >= 0 ? "text-status-completed" : "text-status-emergency")}>
                      {Math.abs(slaDelta)}% {slaDelta >= 0 ? "above" : "below"}
                    </span>{" "}
                    the team average on SLA compliance. Revenue generated is{" "}
                    <span className="font-bold text-brand-gold">
                      ₹{technician.performance.revenueGenerated.toLocaleString("en-IN")}
                    </span>{" "}
                    with a revisit rate of{" "}
                    <span className="font-bold text-brand-navy">{technician.performance.revisitRate}%</span>.
                  </p>
                </div>
              </AdminCard>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="grid gap-6 xl:grid-cols-[1.45fr,1fr]">
              <AdminCard className="p-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-brand-navy">{formatMonthHeading(monthValue)} Attendance</h3>
                    <p className="text-sm text-brand-muted">Attendance calendar and workflow state for technician shifts and leave.</p>
                  </div>
                  <div className="w-full md:w-52">
                    <AdminTextField
                      label="Month"
                      type="month"
                      value={monthValue}
                      onChange={(event) => setMonthValue(event.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-7 gap-2">
                  {weekdayLabels.map((label) => (
                    <div key={label} className="text-center text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                      {label}
                    </div>
                  ))}
                </div>

                {isRefreshingAttendance ? (
                  <InlineLoader />
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {attendanceCalendar.map((cell) => (
                      <div
                        key={cell.key}
                        className={cn(
                          "min-h-[76px] rounded-xl border p-2 transition-colors",
                          cell.isEmpty ? "border-transparent bg-transparent" : resolveAttendanceTone(cell.attendance)
                        )}
                      >
                        {!cell.isEmpty && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{cell.dayNumber}</span>
                              {cell.attendance?.status === "present" && <CheckCircle2 size={14} />}
                              {cell.attendance?.status === "absent" && <XCircle size={14} />}
                              {cell.attendance?.status === "leave" && <Calendar size={14} />}
                            </div>
                            {cell.attendance && (
                              <div className="mt-2 space-y-1 text-[10px]">
                                <p className="font-bold uppercase tracking-widest">{cell.attendance.workflowStatus}</p>
                                {cell.attendance.checkIn && <p>In: {formatDateTimeLabel(cell.attendance.checkIn)}</p>}
                                {cell.attendance.checkOut && <p>Out: {formatDateTimeLabel(cell.attendance.checkOut)}</p>}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AdminCard>

              <div className="space-y-6">
                <AdminCard className="p-6">
                  <SectionHeader title="Request Leave" icon={<Calendar size={18} />} className="mb-4 border-t-0 pt-0" />
                  <form onSubmit={handleRequestLeave} className="space-y-4">
                    <AdminTextField
                      label="Leave Date"
                      type="date"
                      value={leaveDate}
                      onChange={(event) => setLeaveDate(event.target.value)}
                      required
                    />
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Reason</label>
                      <textarea
                        value={leaveReason}
                        onChange={(event) => setLeaveReason(event.target.value)}
                        placeholder="Optional reason for leave request"
                        className="min-h-[100px] w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm outline-none transition-all focus:border-brand-navy focus:ring-1 focus:ring-brand-navy"
                      />
                    </div>
                    <AdminButton type="submit" fullWidth isLoading={isSubmittingLeave}>
                      Submit Leave Request
                    </AdminButton>
                  </form>
                </AdminCard>

                <AdminCard className="p-6">
                  <SectionHeader title="Pending Leave Reviews" icon={<AlertCircle size={18} />} className="mb-4 border-t-0 pt-0" />
                  {pendingLeaveRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-brand-muted">
                      No pending leave requests for the selected month.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingLeaveRequests.map((record) => (
                        <div key={record.id} className="rounded-2xl border border-border p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-brand-navy">{formatDateLabel(record.date)}</p>
                              <p className="mt-1 text-xs text-brand-muted">{record.leaveReason || "No leave reason provided."}</p>
                            </div>
                            <StatusBadge status="pending">{record.workflowStatus}</StatusBadge>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <AdminButton
                              size="sm"
                              className="flex-1"
                              onClick={() => void handleReviewLeave(record, "approve")}
                            >
                              Approve
                            </AdminButton>
                            <AdminButton
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => void handleReviewLeave(record, "reject")}
                            >
                              Reject
                            </AdminButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AdminCard>
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="grid gap-6 xl:grid-cols-[1.45fr,1fr]">
              <AdminCard className="p-6">
                <SectionHeader title="Skill Tag Manager" icon={<Award size={18} />} className="mb-4 border-t-0 pt-0" />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr,1fr,auto]">
                  <AdminTextField
                    label="Skill Name"
                    value={newSkillName}
                    onChange={(event) => setNewSkillName(event.target.value)}
                    placeholder="Daikin Certified"
                  />
                  <AdminDropdown
                    label="Category"
                    options={skillCategoryOptions}
                    value={newSkillCategory}
                    onChange={(value) => setNewSkillCategory(value as TechnicianSkillCategory)}
                  />
                  <div className="md:pt-6">
                    <AdminButton type="button" onClick={addSkillDraft} iconLeft={<Plus size={16} />}>
                      Add Skill
                    </AdminButton>
                  </div>
                </div>

                <div className="mt-4">
                  <AdminTextField
                    label="Skill Code"
                    value={newSkillCode}
                    onChange={(event) => setNewSkillCode(event.target.value)}
                    placeholder="Optional short code"
                  />
                </div>

                <div className="mt-6 space-y-3">
                  {draftSkills.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-brand-muted">
                      No skill tags configured.
                    </div>
                  ) : (
                    draftSkills.map((skill, index) => (
                      <div key={`${skill.name}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
                        <div>
                          <p className="text-sm font-bold text-brand-navy">{skill.name}</p>
                          <p className="text-[10px] uppercase tracking-widest text-brand-muted">
                            {skill.category}{skill.code ? ` • ${skill.code}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSkillDraft(index)}
                          className="rounded-full p-2 text-brand-muted transition-colors hover:bg-status-emergency/10 hover:text-status-emergency"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <AdminButton onClick={() => void handleSaveSkills()} isLoading={isSavingSkills} iconLeft={<Save size={16} />}>
                    Save Skill Tags
                  </AdminButton>
                </div>
              </AdminCard>

              <AdminCard className="p-6">
                <SectionHeader title="Capability Snapshot" icon={<ShieldCheck size={18} />} className="mb-4 border-t-0 pt-0" />
                <div className="space-y-4">
                  <div className="rounded-2xl bg-brand-navy/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Current Tags</p>
                    <p className="mt-1 text-2xl font-bold text-brand-navy">{draftSkills.length}</p>
                  </div>
                  <div className="rounded-2xl bg-brand-gold/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Brand / Equipment / Special</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-brand-navy">{draftSkills.filter((skill) => skill.category === "brand").length}</p>
                        <p className="text-[10px] uppercase tracking-widest text-brand-muted">Brand</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-brand-navy">{draftSkills.filter((skill) => skill.category === "equipment").length}</p>
                        <p className="text-[10px] uppercase tracking-widest text-brand-muted">Equipment</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-brand-navy">{draftSkills.filter((skill) => skill.category === "special").length}</p>
                        <p className="text-[10px] uppercase tracking-widest text-brand-muted">Special</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AdminCard>
            </div>
          )}

          {activeTab === "coverage" && (
            <div className="grid gap-6 xl:grid-cols-[1.45fr,1fr]">
              <AdminCard className="p-6">
                <SectionHeader title="Zone Assignment Manager" icon={<MapPin size={18} />} className="mb-4 border-t-0 pt-0" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {zones.map((zone) => {
                    const isAssigned = selectedZoneIds.includes(zone.id)
                    const isPrimary = primaryZoneId === zone.id

                    return (
                      <label
                        key={zone.id}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-brand-gold"
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => toggleZone(zone.id)}
                          className="mt-1 size-4"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-brand-navy">{zone.name}</p>
                          <p className="text-[11px] uppercase tracking-widest text-brand-muted">{zone.cityName || zone.code || "Zone"}</p>
                          {isPrimary && (
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-gold">Primary Dispatch Zone</p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <AdminButton onClick={() => void handleSaveZones()} isLoading={isSavingZones} iconLeft={<Save size={16} />}>
                    Save Zone Coverage
                  </AdminButton>
                </div>
              </AdminCard>

              <AdminCard className="p-6">
                <SectionHeader title="Primary Zone" icon={<MapPin size={18} />} className="mb-4 border-t-0 pt-0" />
                <div className="space-y-4">
                  <AdminDropdown
                    label="Dispatch Base"
                    options={zones
                      .filter((zone) => selectedZoneIds.includes(zone.id))
                      .map((zone) => ({
                        label: `${zone.name}${zone.cityName ? ` • ${zone.cityName}` : ""}`,
                        value: zone.id,
                      }))}
                    value={primaryZoneId}
                    onChange={setPrimaryZoneId}
                    placeholder="Select primary zone"
                  />

                  <div className="rounded-2xl border border-brand-navy/10 bg-brand-navy/[0.02] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Current Dispatch Coverage</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedZoneIds.length > 0 ? selectedZoneIds.map((zoneId) => {
                        const zone = zones.find((item) => item.id === zoneId)
                        if (!zone) {
                          return null
                        }

                        return (
                          <span
                            key={zone.id}
                            className={cn(
                              "rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest",
                              primaryZoneId === zone.id
                                ? "border-brand-gold/30 bg-brand-gold/10 text-brand-gold"
                                : "border-brand-navy/10 bg-brand-navy/5 text-brand-navy"
                            )}
                          >
                            {zone.name}
                          </span>
                        )
                      }) : (
                        <span className="text-sm text-brand-muted">No zones selected.</span>
                      )}
                    </div>
                  </div>
                </div>
              </AdminCard>
            </div>
          )}

          {activeTab === "gps" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-brand-navy">GPS Breadcrumb Trail</h3>
                  <p className="text-sm text-brand-muted">Daily movement log for attendance verification and route review.</p>
                </div>
                <div className="w-full md:w-56">
                  <AdminTextField
                    label="Tracking Date"
                    type="date"
                    value={gpsDate}
                    onChange={(event) => setGpsDate(event.target.value)}
                  />
                </div>
              </div>

              {isRefreshingGps ? (
                <InlineLoader />
              ) : gpsLog.length === 0 ? (
                <AdminCard className="p-10 text-center">
                  <h3 className="text-lg font-bold text-brand-navy">No GPS log for the selected date</h3>
                  <p className="mt-2 text-sm text-brand-muted">
                    Choose another date once GPS tracking entries are available for this technician.
                  </p>
                </AdminCard>
              ) : (
                <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
                  <AdminCard className="h-[460px] overflow-hidden p-0">
                    <MapContainer center={gpsCenter} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <GpsMapRefocus center={gpsCenter} />
                      <Polyline positions={gpsPolyline} pathOptions={{ color: "#D4AF37", weight: 5, opacity: 0.8 }} />
                      {gpsLog.map((record) => (
                        <Marker key={record.id} position={[record.latitude, record.longitude]}>
                          <Popup>
                            <div className="space-y-1">
                              <p className="font-bold">{record.locationText}</p>
                              <p>{formatDateTimeLabel(record.trackedOn)}</p>
                              <p className="capitalize">{record.trackingSource}</p>
                              {record.serviceRequestId && <p>SR #{record.serviceRequestId}</p>}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </AdminCard>

                  <AdminCard className="p-6">
                    <SectionHeader title="Breadcrumb Log" icon={<Route size={18} />} className="mb-4 border-t-0 pt-0" />
                    <div className="space-y-3">
                      {gpsLog.map((record, index) => (
                        <div key={record.id} className="rounded-2xl border border-border p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-brand-navy">{record.locationText}</p>
                              <p className="mt-1 text-xs text-brand-muted">{formatDateTimeLabel(record.trackedOn)}</p>
                            </div>
                            <span className="rounded-full bg-brand-navy/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-navy">
                              Stop {index + 1}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-brand-muted">
                            <span>Lat: {record.latitude.toFixed(5)}</span>
                            <span>Lng: {record.longitude.toFixed(5)}</span>
                            <span className="capitalize">Source: {record.trackingSource}</span>
                            <span>SR: {record.serviceRequestId || "N/A"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AdminCard>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
