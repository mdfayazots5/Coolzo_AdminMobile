/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { addDays, format } from "date-fns";
import { ArrowLeft, CalendarDays, CheckCircle2, Filter, MapPin, RefreshCw, Search, User, Zap } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AdminCard } from "@/components/shared/Cards";
import { InlineLoader, SectionHeader } from "@/components/shared/Layout";
import { AdminButton } from "@/components/shared/AdminButton";
import {
  schedulingRepository,
  type SchedulingAmcAutoVisit,
  type SchedulingSlot,
} from "@/core/network/scheduling-repository";
import { technicianRepository, type Technician } from "@/core/network/technician-repository";
import { cn } from "@/lib/utils";

export default function AMCAutoScheduleBoard() {
  const navigate = useNavigate();
  const [visits, setVisits] = React.useState<SchedulingAmcAutoVisit[]>([]);
  const [technicians, setTechnicians] = React.useState<Technician[]>([]);
  const [selectedVisitIds, setSelectedVisitIds] = React.useState<string[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = React.useState<string>();
  const [slotOptionsByVisit, setSlotOptionsByVisit] = React.useState<Record<string, SchedulingSlot[]>>({});
  const [slotSelectionByVisit, setSlotSelectionByVisit] = React.useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = React.useState("");
  const [zoneFilter, setZoneFilter] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState(() => format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = React.useState(() => format(addDays(new Date(), 6), "yyyy-MM-dd"));
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isAssigning, setIsAssigning] = React.useState(false);

  const loadBoard = React.useCallback(async (showLoader: boolean = false) => {
    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [visitRows, technicianRows] = await Promise.all([
        schedulingRepository.getAmcAuto(dateFrom, dateTo),
        technicianRepository.getTechnicians({ activeOnly: true }),
      ]);

      setVisits(visitRows);
      setTechnicians(technicianRows);
      setSelectedTechnicianId((current) => current || technicianRows[0]?.id);

      const uniqueSlotKeys = Array.from(
        new Set(visitRows.map((visit) => `${visit.zoneId}:${visit.scheduledDate}`)),
      );
      const slotResults = await Promise.all(
        uniqueSlotKeys.map(async (key) => {
          const [zoneId, scheduledDate] = key.split(":");
          return [key, await schedulingRepository.getSlots(zoneId, scheduledDate)] as const;
        }),
      );
      const slotLookup = new Map(slotResults);

      setSlotOptionsByVisit(
        Object.fromEntries(
          visitRows.map((visit) => [
            visit.amcVisitScheduleId,
            slotLookup.get(`${visit.zoneId}:${visit.scheduledDate}`) || [],
          ]),
        ),
      );
      setSlotSelectionByVisit((current) => {
        const next = { ...current };
        for (const visit of visitRows) {
          const slots = slotLookup.get(`${visit.zoneId}:${visit.scheduledDate}`) || [];
          if (!slots.some((slot) => slot.id === next[visit.amcVisitScheduleId])) {
            next[visit.amcVisitScheduleId] = pickDefaultSlot(slots)?.id || "";
          }
        }

        return next;
      });
      setSelectedVisitIds((current) => current.filter((id) => visitRows.some((visit) => visit.amcVisitScheduleId === id)));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load AMC auto-schedule board");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFrom, dateTo]);

  React.useEffect(() => {
    void loadBoard(true);
  }, [loadBoard]);

  const visibleVisits = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return visits.filter((visit) => {
      const matchesSearch =
        !query ||
        visit.customerName.toLowerCase().includes(query) ||
        visit.mobileNumber.toLowerCase().includes(query) ||
        visit.zoneName.toLowerCase().includes(query) ||
        visit.jobCardNumber.toLowerCase().includes(query) ||
        visit.originServiceRequestNumber?.toLowerCase().includes(query);
      const matchesZone = zoneFilter === "all" || visit.zoneId === zoneFilter;
      return matchesSearch && matchesZone;
    });
  }, [searchTerm, visits, zoneFilter]);

  const zoneOptions = React.useMemo(
    () =>
      Array.from(new Map(visits.map((visit) => [visit.zoneId, visit.zoneName])).entries()).map(([id, name]) => ({
        id,
        name,
      })),
    [visits],
  );

  const selectedTechnician = React.useMemo(
    () => technicians.find((technician) => technician.id === selectedTechnicianId),
    [selectedTechnicianId, technicians],
  );

  const allVisibleSelected =
    visibleVisits.length > 0 &&
    visibleVisits.every((visit) => selectedVisitIds.includes(visit.amcVisitScheduleId));

  const toggleVisitSelection = (visitId: string) => {
    setSelectedVisitIds((current) =>
      current.includes(visitId) ? current.filter((item) => item !== visitId) : [...current, visitId],
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = visibleVisits.map((visit) => visit.amcVisitScheduleId);
    setSelectedVisitIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  };

  const handleBulkAssign = async () => {
    if (!selectedTechnicianId) {
      toast.error("Select a technician before bulk assigning AMC visits");
      return;
    }

    if (selectedVisitIds.length === 0) {
      toast.error("Select at least one AMC visit");
      return;
    }

    const missingSlotVisit = selectedVisitIds.find((visitId) => !slotSelectionByVisit[visitId]);
    if (missingSlotVisit) {
      toast.error("Every selected AMC visit needs a slot");
      return;
    }

    setIsAssigning(true);
    try {
      await schedulingRepository.bulkAssignAmc({
        technicianId: selectedTechnicianId,
        visits: selectedVisitIds.map((visitId) => ({
          amcVisitScheduleId: visitId,
          slotAvailabilityId: slotSelectionByVisit[visitId],
        })),
        remarks: `AMC bulk assignment for ${selectedVisitIds.length} visit(s).`,
      });

      toast.success(`Assigned ${selectedVisitIds.length} AMC visit(s) to ${selectedTechnician?.name || "technician"}`);
      setSelectedVisitIds([]);
      await loadBoard(false);
    } catch (error) {
      console.error(error);
      toast.error("AMC bulk assignment failed");
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return <InlineLoader className="h-screen" />;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 transition-colors hover:bg-brand-navy/5"
          >
            <ArrowLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">AMC Auto-Schedule Review Board</h1>
            <p className="text-sm text-brand-muted">
              Review auto-generated AMC visits and bulk assign technicians with schedule slots
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AdminButton
            variant="outline"
            iconLeft={<RefreshCw size={16} />}
            onClick={() => void loadBoard(false)}
            disabled={isRefreshing}
          >
            Refresh
          </AdminButton>
          <AdminButton
            onClick={handleBulkAssign}
            disabled={!selectedTechnicianId || selectedVisitIds.length === 0 || isAssigning}
            iconLeft={<Zap size={18} />}
          >
            {isAssigning ? "Assigning..." : `Bulk Assign (${selectedVisitIds.length})`}
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4">
          <AdminCard className="space-y-5 p-6">
            <SectionHeader title="Filters" icon={<Filter size={18} />} className="mb-0" />

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Search</span>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-brand-navy/[0.03] px-4 py-3">
                <Search size={16} className="text-brand-muted" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Customer, SR, zone, or job card"
                  className="w-full border-none bg-transparent text-sm text-brand-navy outline-none"
                />
              </div>
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-brand-navy/[0.03] px-4 py-3 text-sm font-bold text-brand-navy outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-brand-navy/[0.03] px-4 py-3 text-sm font-bold text-brand-navy outline-none"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Zone</span>
              <select
                value={zoneFilter}
                onChange={(event) => setZoneFilter(event.target.value)}
                className="w-full rounded-2xl border border-border bg-brand-navy/[0.03] px-4 py-3 text-sm font-bold text-brand-navy outline-none"
              >
                <option value="all">All Zones</option>
                {zoneOptions.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Assign Technician</span>
              <select
                value={selectedTechnicianId || ""}
                onChange={(event) => setSelectedTechnicianId(event.target.value || undefined)}
                className="w-full rounded-2xl border border-border bg-brand-navy/[0.03] px-4 py-3 text-sm font-bold text-brand-navy outline-none"
              >
                <option value="">Select technician</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
              </select>
            </label>
          </AdminCard>

          <AdminCard className="space-y-4 border-brand-gold/20 bg-brand-gold/10 p-6">
            <div className="flex items-center gap-3">
              <CalendarDays size={18} className="text-brand-gold" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-navy">AMC Review Summary</p>
                <p className="mt-1 text-sm text-brand-navy/70">
                  {visibleVisits.length} visit(s) in range • {selectedVisitIds.length} selected
                </p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-brand-navy/70">
              Slot options are loaded per zone and scheduled date so bulk assignment stays aligned with scheduling board capacity.
            </p>
          </AdminCard>
        </div>

        <div className="space-y-4 xl:col-span-8">
          <AdminCard className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-brand-navy">Pending AMC Visits</h3>
              <p className="text-sm text-brand-muted">Unlinked visits generated by the AMC scheduling engine</p>
            </div>
            <button
              onClick={toggleSelectAllVisible}
              className="rounded-xl bg-brand-navy/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-navy transition-colors hover:bg-brand-navy/10"
            >
              {allVisibleSelected ? "Clear Visible" : "Select Visible"}
            </button>
          </AdminCard>

          {visibleVisits.map((visit) => {
            const isSelected = selectedVisitIds.includes(visit.amcVisitScheduleId);
            const slots = slotOptionsByVisit[visit.amcVisitScheduleId] || [];
            const selectedSlotId = slotSelectionByVisit[visit.amcVisitScheduleId] || "";

            return (
              <AdminCard
                key={visit.amcVisitScheduleId}
                className={cn(
                  "border transition-colors",
                  isSelected ? "border-brand-gold bg-brand-navy/[0.02]" : "border-border",
                )}
              >
                <div className="flex flex-col gap-5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <button
                      onClick={() => toggleVisitSelection(visit.amcVisitScheduleId)}
                      className="flex items-start gap-4 text-left"
                    >
                      <div
                        className={cn(
                          "mt-1 flex size-10 items-center justify-center rounded-2xl",
                          isSelected ? "bg-brand-gold text-brand-navy" : "bg-brand-navy/5 text-brand-navy",
                        )}
                      >
                        {isSelected ? <CheckCircle2 size={18} /> : <CalendarDays size={18} />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-brand-navy">{visit.customerName}</p>
                          <span className="rounded-full bg-brand-navy/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-navy">
                            Visit {visit.visitNumber}
                          </span>
                          <span className="rounded-full bg-brand-gold/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                            {visit.amcPlanName}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-brand-navy">{visit.serviceName}</p>
                        <p className="mt-2 flex items-start gap-2 text-xs text-brand-muted">
                          <MapPin size={12} className="mt-0.5 shrink-0" />
                          <span>{visit.address}</span>
                        </p>
                      </div>
                    </button>

                    <div className="rounded-2xl bg-brand-navy/[0.03] px-4 py-3 text-left lg:min-w-[220px] lg:text-right">
                      <p className="text-sm font-bold text-brand-navy">{visit.scheduledDate}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-brand-muted">{visit.zoneName}</p>
                      <p className="mt-2 text-xs text-brand-muted">Job Card {visit.jobCardNumber}</p>
                      {visit.originServiceRequestNumber ? (
                        <p className="text-xs text-brand-muted">Source SR {visit.originServiceRequestNumber}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <InfoPill label="Mobile" value={visit.mobileNumber} />
                      <InfoPill label="Status" value={visit.currentStatus} />
                    </div>

                    <label className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Schedule Slot</span>
                      <select
                        value={selectedSlotId}
                        onChange={(event) =>
                          setSlotSelectionByVisit((current) => ({
                            ...current,
                            [visit.amcVisitScheduleId]: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm font-bold text-brand-navy outline-none"
                      >
                        <option value="">Select slot</option>
                        {slots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.slotLabel} • {slot.reservedCapacity}/{slot.availableCapacity}
                            {slot.isBlocked ? " • blocked" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </AdminCard>
            );
          })}

          {visibleVisits.length === 0 ? (
            <AdminCard className="p-10 text-center text-sm text-brand-muted">
              No AMC visits match the selected date range and filters.
            </AdminCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoPill(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-brand-navy/[0.03] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{props.label}</p>
      <p className="mt-1 text-sm font-bold text-brand-navy">{props.value}</p>
    </div>
  );
}

function pickDefaultSlot(slots: SchedulingSlot[]): SchedulingSlot | undefined {
  return (
    slots.find((slot) => !slot.isBlocked && slot.isAvailable) ||
    slots.find((slot) => !slot.isBlocked) ||
    slots[0]
  );
}
