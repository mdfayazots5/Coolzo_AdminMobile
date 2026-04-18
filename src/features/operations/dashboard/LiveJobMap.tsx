/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader } from "@/components/shared/Layout"
import { MapPin, User, Zap, Clock, Filter, Maximize2, Navigation } from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { serviceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { technicianRepository, Technician } from "@/core/network/technician-repository"
import { useAuthStore, UserRole } from "@/store/auth-store"
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Component to handle map view updates
function MapRefocus({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function LiveJobMap() {
  const { user } = useAuthStore()
  const [activeZone, setActiveZone] = React.useState<string | null>(null)
  const [srs, setSrs] = React.useState<ServiceRequest[]>([])
  const [techs, setTechs] = React.useState<Technician[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLiveEnabled, setIsLiveEnabled] = React.useState(false)
  const [userPos, setUserPos] = React.useState<[number, number] | null>(null)

  // Role-based permissions
  const isAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.OPS_MANAGER;
  const isOps = isAdmin || user?.role === UserRole.OPS_EXECUTIVE;
  const isTechnician = user?.role === UserRole.TECHNICIAN || user?.role === UserRole.HELPER;

  // Simulated Route for a "Blinkit/Zomato" active delivery feel
  const activeRoute: [number, number][] = [
    [17.4150, 78.4411],
    [17.4050, 78.4450],
    [17.3950, 78.4550],
    [17.3850, 78.4867]
  ];

  // Map settings
  const defaultCenter: [number, number] = [17.3850, 78.4867];
  const [mapCenter, setMapCenter] = React.useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = React.useState(13);

  const zoneCoords: Record<string, [number, number]> = {
    'Zone 1': [17.4150, 78.4411],
    'Zone 2': [17.4299, 78.4126],
    'Zone 3': [17.4435, 78.3772],
  };

  React.useEffect(() => {
    let watchId: number;
    if (isLiveEnabled) {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserPos([latitude, longitude]);
            setMapCenter([latitude, longitude]);
            setMapZoom(15);
          },
          (error) => {
            console.error("Error getting location:", error);
            setIsLiveEnabled(false);
          },
          { enableHighAccuracy: true }
        );
      } else {
        alert("Geolocation is not supported by this browser.");
        setIsLiveEnabled(false);
      }
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isLiveEnabled]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [allSRs, allTechs] = await Promise.all([
          serviceRequestRepository.getSRs({}),
          technicianRepository.getAvailabilityBoard()
        ]);
        setSrs(allSRs);
        setTechs(allTechs);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [])

  const handleZoneChange = (zone: string | null) => {
    setActiveZone(zone);
    if (zone && zoneCoords[zone]) {
      setMapCenter(zoneCoords[zone]);
      setMapZoom(14);
    } else {
      setMapCenter(defaultCenter);
      setMapZoom(13);
    }
  };

  // Create custom DivIcons for Leaflet
  const createCustomIcon = (status: string, type: string) => {
    const colorClass = status === 'on-job' ? "bg-brand-navy text-brand-gold" : "bg-brand-gold text-brand-navy";
    const emergencyClass = type === 'emergency' ? "ring-4 ring-status-emergency/30" : "";
    const iconSvg = type === 'emergency' 
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `
        <div class="relative">
          ${type === 'emergency' ? '<div class="absolute -inset-2 bg-status-emergency/20 rounded-full animate-ping"></div>' : ''}
          <div class="size-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all hover:scale-110 ${colorClass} ${emergencyClass}">
            ${iconSvg}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  // Map pins from techs and srs - using simulated lat/long since repository doesn't have real ones yet
  const pins = React.useMemo(() => {
    // If technician, they should only see their own pin and assigned jobs
    if (isTechnician) {
      // Find current user in techs if they exist there mock-wise
      const techPins = techs.filter(t => t.name.includes(user?.name || '')).map((t, i) => ({
        id: `tech-${t.id}`,
        position: [17.3850 + (i * 0.005) - 0.01, 78.4867 + (i * 0.008) - 0.01] as [number, number],
        status: t.status === 'on-job' ? 'on-job' : 'traveling',
        type: 'normal',
        tech: t.name,
        eta: '12m'
      }));

      // Only show SRs that might be assigned to them (mocking assignment)
      const srPins = srs.slice(0, 2).map((s, i) => ({
        id: `sr-${s.id}`,
        position: [17.3850 + (i * 0.01) - 0.015, 78.4867 - (i * 0.006) + 0.01] as [number, number],
        status: 'pending',
        type: s.priority === 'emergency' ? 'emergency' : 'normal',
        tech: 'Assigned to You',
        eta: '15m'
      }));

      return [...techPins, ...srPins];
    }

    // Admins/Ops see everything
    const techPins = techs.map((t, i) => ({
      id: `tech-${t.id}`,
      position: [17.3850 + (i * 0.005) - 0.01, 78.4867 + (i * 0.008) - 0.01] as [number, number],
      status: t.status === 'on-job' ? 'on-job' : 'traveling',
      type: 'normal',
      tech: t.name,
      eta: '12m'
    }));

    const srPins = srs.filter(s => s.priority === 'emergency').map((s, i) => ({
      id: `sr-${s.id}`,
      position: [17.3850 + (i * 0.01) - 0.015, 78.4867 - (i * 0.006) + 0.01] as [number, number],
      status: 'pending',
      type: 'emergency',
      tech: 'Unassigned',
      eta: 'N/A'
    }));

    return [...techPins, ...srPins];
  }, [techs, srs, isTechnician, user?.name]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Live Operations Map</h1>
          <p className="text-sm text-brand-muted">
            {isTechnician ? "Your active route and assigned jobs" : "Real-time technician tracking and job distribution"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <AdminButton 
              size="sm" 
              className="bg-brand-gold text-brand-navy border-none h-10 px-4 font-bold text-[10px] uppercase tracking-widest hidden md:flex"
            >
              Optimize Routes
            </AdminButton>
          )}
          <button 
            onClick={() => setIsLiveEnabled(!isLiveEnabled)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
              isLiveEnabled 
                ? "bg-status-completed text-white border-status-completed shadow-lg shadow-status-completed/20" 
                : "bg-white text-brand-navy border-border"
            )}
          >
            <Navigation size={14} className={isLiveEnabled ? "animate-pulse" : ""} />
            {isLiveEnabled ? "Live GPS Active" : "Enable Live GPS"}
          </button>
          <div className="flex bg-brand-navy/5 p-1 rounded-lg border border-brand-navy/10">
            {['All', 'Zone 1', 'Zone 2', 'Zone 3'].map(z => (
              <button 
                key={z}
                onClick={() => handleZoneChange(z === 'All' ? null : z)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-widest",
                  (activeZone === z || (z === 'All' && !activeZone)) ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-navy"
                )}
              >
                {z}
              </button>
            ))}
          </div>
          <button className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy hover:bg-brand-navy/10 transition-colors">
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Area */}
        <AdminCard className="lg:col-span-3 p-0 relative h-[600px] bg-slate-50 overflow-hidden group z-0">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <MapRefocus center={mapCenter} zoom={mapZoom} />
            
            {/* Draw active route line (Blinkit style) - tech sees their route, admin sees all (simulated) */}
            {(isTechnician || isAdmin) && (
              <Polyline 
                positions={activeRoute} 
                pathOptions={{ 
                  color: '#C9A84C', 
                  weight: 3, 
                  dashArray: '10, 10',
                  opacity: 0.6
                }} 
              />
            )}

            {/* Current User Live Marker */}
            {userPos && (
              <Marker position={userPos} icon={L.divIcon({
                className: 'user-live-marker',
                html: `<div class="size-6 bg-blue-500 rounded-full border-4 border-white shadow-xl ring-4 ring-blue-500/20 animate-pulse"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}>
                <Popup>
                  <div className="text-xs font-bold text-brand-navy">You are here (Live)</div>
                </Popup>
              </Marker>
            )}
            
            {pins.map(pin => (
              <Marker 
                key={pin.id} 
                position={pin.position}
                icon={createCustomIcon(pin.status, pin.type)}
              >
                <Popup className="premium-popup">
                  <div className="w-32">
                    <p className="text-[10px] font-bold mb-0.5 text-brand-navy">{pin.tech}</p>
                    <p className="text-[8px] text-brand-gold font-bold uppercase tracking-widest">{pin.status}</p>
                    <div className="mt-1 flex items-center gap-1 text-brand-muted">
                      <Clock size={10} />
                      <span className="text-[10px]">ETA: {pin.eta}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Controls Overlay */}
          <div className="absolute top-20 left-40 text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] pointer-events-none">Zone 1 (Central)</div>
          <div className="absolute bottom-40 right-40 text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] pointer-events-none">Zone 2 (West)</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] pointer-events-none">Zone 3 (East)</div>

          {/* Map Controls Overlay */}
          <div className="absolute bottom-6 left-6 space-y-2">
            <div className="p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-border">
              <h4 className="text-[10px] font-bold text-brand-navy uppercase tracking-widest mb-3">Legend</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-brand-navy border border-brand-gold" />
                  <span className="text-[9px] font-bold text-brand-muted uppercase">On Job</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-brand-gold border border-brand-navy" />
                  <span className="text-[9px] font-bold text-brand-muted uppercase">Traveling</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-status-emergency animate-pulse" />
                  <span className="text-[9px] font-bold text-brand-muted uppercase">Emergency</span>
                </div>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Sidebar: Live Feed */}
        <div className="space-y-6">
          <AdminCard className="p-0 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-border bg-brand-navy/[0.02]">
              <SectionHeader title="Live Activity Feed" icon={<Zap size={18} className="text-brand-gold" />} className="mb-0" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex gap-3 relative">
                  {i < 6 && <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />}
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm",
                    i === 1 ? "bg-status-emergency text-white" : "bg-brand-navy/5 text-brand-navy"
                  )}>
                    {i === 1 ? <Zap size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="pb-6">
                    <p className="text-[11px] font-bold text-brand-navy">
                      {i === 1 ? 'Emergency SR-99285 Created' : 'Technician Rajesh K. reached site'}
                    </p>
                    <p className="text-[10px] text-brand-muted mt-0.5">2 minutes ago • Zone 2</p>
                    {(i === 1 && isOps) && (
                      <AdminButton size="sm" className="mt-2 h-7 text-[9px] bg-status-emergency text-white border-none">
                        Dispatch Now
                      </AdminButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
