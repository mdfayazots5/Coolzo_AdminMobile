/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader } from "@/components/shared/Layout"
import {
  operationsDashboardRepository,
  type OperationsLiveMap,
  type OperationsServiceRequestMapPin,
  type OperationsTechnicianMapPin,
} from "@/core/network/operations-dashboard-repository"
import { useLivePolling } from "@/lib/hooks/useLivePolling"
import { cn } from "@/lib/utils"
import { useAuthStore, UserRole } from "@/store/auth-store"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  Route,
  ShieldAlert,
  Users,
  Zap,
} from "lucide-react"
import * as ReactLeaflet from "react-leaflet"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"
import { toast } from "sonner"

const { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } = ReactLeaflet

const defaultCenter: [number, number] = [17.385, 78.4867]

L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const createCircleIcon = (background: string, border: string, size = 18) =>
  L.divIcon({
    className: "coolzo-live-map-pin",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${background};border:3px solid ${border};box-shadow:0 10px 24px rgba(16,36,63,0.18);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })

const createTechnicianIcon = (status: OperationsTechnicianMapPin["status"]) => {
  if (status === "on-job") return createCircleIcon("#10243f", "#c9a84c", 20)
  if (status === "available") return createCircleIcon("#16a34a", "#ffffff", 18)
  return createCircleIcon("#64748b", "#ffffff", 18)
}

const createRequestIcon = (priority: OperationsServiceRequestMapPin["priority"]) => {
  if (priority === "emergency") return createCircleIcon("#dc2626", "#ffffff", 20)
  if (priority === "urgent") return createCircleIcon("#f59e0b", "#ffffff", 18)
  return createCircleIcon("#1d4ed8", "#ffffff", 16)
}

const createUserIcon = () =>
  L.divIcon({
    className: "coolzo-live-map-user-pin",
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:4px solid #ffffff;box-shadow:0 0 0 6px rgba(37,99,235,0.18);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })

function MapRefocus({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()

  React.useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])

  return null
}

export default function LiveJobMap() {
  const { user } = useAuthStore()
  const [liveMap, setLiveMap] = React.useState<OperationsLiveMap | null>(null)
  const [activeZone, setActiveZone] = React.useState<string>("All")
  const [isLoading, setIsLoading] = React.useState(true)
  const [userPosition, setUserPosition] = React.useState<[number, number] | null>(null)
  const [isLiveGpsEnabled, setIsLiveGpsEnabled] = React.useState(false)

  const isTechnicianView = user?.role === UserRole.TECHNICIAN || user?.role === UserRole.HELPER

  const loadMap = React.useCallback(async () => {
    try {
      const response = await operationsDashboardRepository.getLiveMap()
      setLiveMap(response)
    } catch {
      toast.error("Failed to load the live operations map")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const { lastUpdated, manualRefresh } = useLivePolling(() => {
    void loadMap()
  }, 60000)

  React.useEffect(() => {
    void loadMap()
  }, [loadMap])

  React.useEffect(() => {
    if (!isLiveGpsEnabled) {
      return
    }

    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported on this device")
      setIsLiveGpsEnabled(false)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude])
      },
      () => {
        toast.error("Unable to access the current GPS position")
        setIsLiveGpsEnabled(false)
      },
      { enableHighAccuracy: true, maximumAge: 30000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [isLiveGpsEnabled])

  const zoneOptions = React.useMemo(() => {
    if (!liveMap) {
      return []
    }

    return Array.from(
      new Set([
        ...liveMap.serviceRequestPins.map((pin) => pin.zoneName || "Unassigned"),
        ...liveMap.technicianPins.map((pin) => pin.baseZone).filter(Boolean),
      ]),
    ).filter(Boolean) as string[]
  }, [liveMap])

  const visibleTechnicianPins = React.useMemo(() => {
    if (!liveMap) {
      return []
    }

    return liveMap.technicianPins.filter((pin) => {
      const matchesZone = activeZone === "All" || (pin.baseZone || "").toLowerCase() === activeZone.toLowerCase()
      const matchesRole =
        !isTechnicianView ||
        (pin.name || "").trim().toLowerCase() === (user?.name || "").trim().toLowerCase()

      return matchesZone && matchesRole
    })
  }, [activeZone, isTechnicianView, liveMap, user?.name])

  const visibleRequestPins = React.useMemo(() => {
    if (!liveMap) {
      return []
    }

    return liveMap.serviceRequestPins.filter((pin) => {
      const matchesZone = activeZone === "All" || pin.zoneName.toLowerCase() === activeZone.toLowerCase()
      const matchesRole =
        !isTechnicianView ||
        (pin.assignedTechnicianName || "").trim().toLowerCase() === (user?.name || "").trim().toLowerCase()

      return matchesZone && matchesRole
    })
  }, [activeZone, isTechnicianView, liveMap, user?.name])

  const mapCenter = React.useMemo<[number, number]>(() => {
    if (userPosition) {
      return userPosition
    }

    const firstTech = visibleTechnicianPins[0]
    if (firstTech) {
      return [firstTech.lat, firstTech.lng]
    }

    const firstRequest = visibleRequestPins[0]
    if (firstRequest) {
      return [firstRequest.lat, firstRequest.lng]
    }

    return defaultCenter
  }, [userPosition, visibleRequestPins, visibleTechnicianPins])

  const mapZoom = activeZone === "All" ? 12 : 13

  if (isLoading && !liveMap) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Live Operations Map</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Real technician GPS breadcrumbs and service request pins. Last updated {lastUpdated.toLocaleTimeString()}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton variant="secondary" size="sm" onClick={manualRefresh} iconLeft={<RefreshCw size={14} />}>
            Refresh
          </AdminButton>
          <AdminButton
            variant={isLiveGpsEnabled ? "primary" : "secondary"}
            size="sm"
            onClick={() => setIsLiveGpsEnabled((current) => !current)}
            iconLeft={<Navigation size={14} />}
          >
            {isLiveGpsEnabled ? "Disable GPS" : "Enable GPS"}
          </AdminButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveZone("All")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
            activeZone === "All"
              ? "border-brand-gold bg-brand-gold/10 text-brand-navy"
              : "border-brand-navy/10 text-brand-muted hover:text-brand-navy",
          )}
        >
          All Zones
        </button>
        {zoneOptions.map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => setActiveZone(zone)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
              activeZone === zone
                ? "border-brand-gold bg-brand-gold/10 text-brand-navy"
                : "border-brand-navy/10 text-brand-muted hover:text-brand-navy",
            )}
          >
            {zone}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <AdminCard className="relative h-[640px] overflow-hidden p-0 xl:col-span-3">
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRefocus center={mapCenter} zoom={mapZoom} />

            {visibleTechnicianPins.map((pin) => (
              <React.Fragment key={pin.id}>
                <Polyline
                  positions={pin.breadcrumbs.map((point) => [point.lat, point.lng] as [number, number])}
                  pathOptions={{ color: "#c9a84c", weight: 3, opacity: 0.75 }}
                />
                <Marker position={[pin.lat, pin.lng]} icon={createTechnicianIcon(pin.status)}>
                  <Popup>
                    <div className="min-w-[160px] space-y-1 text-xs">
                      <div className="font-bold text-brand-navy">{pin.name}</div>
                      <div className="uppercase tracking-widest text-brand-muted">{pin.status.replace("-", " ")}</div>
                      <div>{pin.baseZone || "Unassigned"}</div>
                      {pin.currentJobId && <div>Current job {pin.currentJobId}</div>}
                      <div>Tracked {new Date(pin.trackedOn).toLocaleTimeString()}</div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}

            {visibleRequestPins.map((pin) => (
              <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={createRequestIcon(pin.priority)}>
                <Popup>
                  <div className="min-w-[180px] space-y-1 text-xs">
                    <div className="font-bold text-brand-navy">{pin.srNumber}</div>
                    <div>{pin.customerName}</div>
                    <div className="uppercase tracking-widest text-brand-muted">{pin.priority}</div>
                    <div>{pin.serviceName}</div>
                    <div>{pin.zoneName}</div>
                    <div>{pin.address}</div>
                    {pin.assignedTechnicianName && <div>Assigned {pin.assignedTechnicianName}</div>}
                  </div>
                </Popup>
              </Marker>
            ))}

            {userPosition && (
              <Marker position={userPosition} icon={createUserIcon()}>
                <Popup>
                  <div className="text-xs font-bold text-brand-navy">Current device location</div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard className="p-0 overflow-hidden">
            <div className="border-b border-border bg-brand-navy/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-brand-navy">Technician Pins</h2>
                  <p className="text-[11px] text-brand-muted">{visibleTechnicianPins.length} visible</p>
                </div>
                <Users size={18} className="text-brand-gold" />
              </div>
            </div>
            <div className="max-h-[260px] space-y-3 overflow-y-auto p-4">
              {visibleTechnicianPins.map((pin) => (
                <div key={pin.id} className="rounded-2xl border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-brand-navy">{pin.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                        {pin.baseZone || "Unassigned"}
                      </p>
                    </div>
                    <div className="rounded-full bg-brand-navy/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-navy">
                      {pin.status.replace("-", " ")}
                    </div>
                  </div>
                  {pin.currentJobId && <p className="mt-2 text-[11px] text-brand-muted">Current job {pin.currentJobId}</p>}
                </div>
              ))}
              {visibleTechnicianPins.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-brand-muted">
                  No technician pins are visible for the current slice.
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-0 overflow-hidden">
            <div className="border-b border-border bg-brand-navy/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-brand-navy">Service Pins</h2>
                  <p className="text-[11px] text-brand-muted">{visibleRequestPins.length} visible</p>
                </div>
                <MapPin size={18} className="text-brand-gold" />
              </div>
            </div>
            <div className="max-h-[320px] space-y-3 overflow-y-auto p-4">
              {visibleRequestPins.map((pin) => (
                <div key={pin.id} className="rounded-2xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-brand-navy">{pin.srNumber}</h3>
                        {pin.priority === "emergency" ? (
                          <ShieldAlert size={14} className="text-status-emergency" />
                        ) : pin.priority === "urgent" ? (
                          <Zap size={14} className="text-status-urgent" />
                        ) : (
                          <Radio size={14} className="text-brand-muted" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-brand-muted">{pin.customerName}</p>
                    </div>
                    <div className="text-right text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                      {pin.status.replace("-", " ")}
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-brand-muted">{pin.serviceName} • {pin.zoneName}</p>
                  <p className="mt-2 text-[11px] text-brand-muted">{pin.address}</p>
                </div>
              ))}
              {visibleRequestPins.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-brand-muted">
                  No service request pins are visible for the current slice.
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard className="bg-brand-navy p-5 text-white">
            <div className="flex items-center gap-3">
              <Route size={18} className="text-brand-gold" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest">Live Feed Notes</h2>
                <p className="mt-2 text-sm text-white/70">
                  Technician markers use the latest GPS log of the day. Service markers use customer address coordinates from the booking.
                </p>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
