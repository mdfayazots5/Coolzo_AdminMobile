/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPinned,
  RefreshCw,
  Route,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";
import { addDays, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AdminCard } from "@/components/shared/Cards";
import { SectionHeader, InlineLoader } from "@/components/shared/Layout";
import { AdminButton } from "@/components/shared/AdminButton";
import { cn } from "@/lib/utils";
import { useLivePolling } from "@/lib/hooks/useLivePolling";
import { ConflictDetectionService } from "@/core/services/conflict-detection-service";
import {
  schedulingRepository,
  type SchedulingBoard,
  type SchedulingDaySheet,
  type SchedulingJob,
  type SchedulingSlot,
  type SchedulingTechnician,
  type SchedulingTimeSlot,
} from "@/core/network/scheduling-repository";

type BoardViewMode = "day" | "week" | "technician";

export default function SchedulingBoardDayView() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = React.useState<BoardViewMode>("day");
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const [selectedTechnicianId, setSelectedTechnicianId] = React.useState<string>();
  const [selectedZoneId, setSelectedZoneId] = React.useState<string>();
  const [board, setBoard] = React.useState<SchedulingBoard | null>(null);
  const [daySheet, setDaySheet] = React.useState<SchedulingDaySheet | null>(null);
  const [zoneSlots, setZoneSlots] = React.useState<SchedulingSlot[]>([]);
  const [draggingJobId, setDraggingJobId] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isUpdatingSlotId, setIsUpdatingSlotId] = React.useState<string>();

  const loadBoard = React.useCallback(async (showLoader: boolean = false) => {
    const targetDate = format(selectedDate, "yyyy-MM-dd");
    const rangeStart = targetDate;
    const rangeEnd = format(viewMode === "week" ? addDays(selectedDate, 6) : selectedDate, "yyyy-MM-dd");

    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await schedulingRepository.getBoard({
        dateFrom: rangeStart,
        dateTo: rangeEnd,
        technicianId: viewMode === "technician" ? selectedTechnicianId : undefined,
      });
      setBoard(response);

      const nextTechnicianId = selectedTechnicianId || response.technicians[0]?.id;
      if (nextTechnicianId && nextTechnicianId !== selectedTechnicianId) {
        setSelectedTechnicianId(nextTechnicianId);
      }

      const availableZoneIds = Array.from(
        new Set([...response.unassignedJobs, ...response.jobs].map((job) => job.zoneId)),
      );
      const nextZoneId =
        selectedZoneId && availableZoneIds.includes(selectedZoneId)
          ? selectedZoneId
          : availableZoneIds[0];
      if (nextZoneId !== selectedZoneId) {
        setSelectedZoneId(nextZoneId);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load scheduling board");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, selectedTechnicianId, selectedZoneId, viewMode]);

  const loadDaySheet = React.useCallback(async () => {
    if (viewMode !== "technician" || !selectedTechnicianId) {
      setDaySheet(null);
      return;
    }

    try {
      const response = await schedulingRepository.getDaySheet(
        format(selectedDate, "yyyy-MM-dd"),
        selectedTechnicianId,
      );
      setDaySheet(response);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load technician day sheet");
    }
  }, [selectedDate, selectedTechnicianId, viewMode]);

  const loadZoneSlots = React.useCallback(async () => {
    if (!selectedZoneId) {
      setZoneSlots([]);
      return;
    }

    try {
      const response = await schedulingRepository.getSlots(selectedZoneId, format(selectedDate, "yyyy-MM-dd"));
      setZoneSlots(response);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load slot availability");
    }
  }, [selectedDate, selectedZoneId]);

  React.useEffect(() => {
    void loadBoard(true);
  }, [loadBoard]);

  React.useEffect(() => {
    void loadDaySheet();
  }, [loadDaySheet]);

  React.useEffect(() => {
    void loadZoneSlots();
  }, [loadZoneSlots]);

  const { lastUpdated, manualRefresh } = useLivePolling(() => {
    void loadBoard(false);
  }, 60000);

  const refreshAll = async () => {
    manualRefresh();
    await loadBoard(false);
    await loadDaySheet();
    await loadZoneSlots();
  };

  const allJobs = React.useMemo(() => {
    return board ? [...board.jobs, ...board.unassignedJobs] : [];
  }, [board]);

  const selectedTechnician = React.useMemo(
    () => board?.technicians.find((technician) => technician.id === selectedTechnicianId),
    [board, selectedTechnicianId],
  );

  const technicianDaySheet = React.useMemo(
    () => daySheet?.technicians.find((technician) => technician.technicianId === selectedTechnicianId),
    [daySheet, selectedTechnicianId],
  );

  const handleDrop = async (jobId: string, technicianId: string, slot: SchedulingTimeSlot, slotDate: string) => {
    const job = allJobs.find((item) => item.id === jobId);
    if (!job) {
      return;
    }

    const slots = await schedulingRepository.getSlots(job.zoneId, slotDate);
    const targetSlot = slots.find((item) => item.startTime === slot.startTime);
    if (!targetSlot) {
      toast.error("No matching slot exists for the selected time");
      return;
    }

    if (job.technicianId === technicianId && job.slotAvailabilityId === targetSlot.id) {
      return;
    }

    try {
      const conflicts = await ConflictDetectionService.checkConflicts(job.id, technicianId, targetSlot.id);
      const blocking = conflicts.find((conflict) => conflict.severity === "error");
      if (blocking) {
        toast.error(blocking.message);
        return;
      }

      const warning = conflicts.find((conflict) => conflict.severity === "warning");
      if (warning) {
        toast.warning(warning.message);
      }

      if (job.technicianId) {
        await schedulingRepository.reassignJob({
          serviceRequestId: job.id,
          technicianId,
          slotAvailabilityId: targetSlot.id,
          remarks: `Scheduling board update for ${job.srNumber}.`,
        });
      } else {
        await schedulingRepository.assignJob({
          serviceRequestId: job.id,
          technicianId,
          slotAvailabilityId: targetSlot.id,
          remarks: `Scheduling board assignment for ${job.srNumber}.`,
        });
      }

      toast.success(`Schedule saved for ${job.srNumber}`);
      setSelectedZoneId(job.zoneId);
      await refreshAll();
    } catch (error) {
      console.error(error);
      toast.error("Scheduling update failed");
    }
  };

  const handleSlotToggle = async (slot: SchedulingSlot) => {
    setIsUpdatingSlotId(slot.id);
    try {
      await schedulingRepository.updateSlot(slot.id, {
        isBlocked: !slot.isBlocked,
        availableCapacity: slot.availableCapacity,
      });
      toast.success(slot.isBlocked ? "Slot unblocked" : "Slot blocked");
      await loadZoneSlots();
    } catch (error) {
      console.error(error);
      toast.error("Unable to update slot");
    } finally {
      setIsUpdatingSlotId(undefined);
    }
  };

  const exportDaySheetCsv = () => {
    if (!technicianDaySheet) {
      return;
    }

    const rows = [
      ["SR Number", "Customer", "Phone", "Service", "Slot", "Status", "Priority", "Zone", "Address"].join(","),
      ...technicianDaySheet.itinerary.map((item) =>
        [
          item.serviceRequestNumber,
          item.customerName,
          item.mobileNumber,
          item.serviceName,
          `${item.startTime}-${item.endTime}`,
          item.status,
          item.priority,
          item.zoneName,
          item.address.replace(/,/g, " "),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `day-sheet-${selectedTechnician?.name || "technician"}-${format(selectedDate, "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (isLoading && !board) {
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
            <h1 className="text-2xl font-bold text-brand-navy">Scheduling Board</h1>
            <p className="text-sm text-brand-muted">
              Live job scheduling, AMC review, conflict detection, and slot control
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-border bg-white p-1 shadow-sm">
            <button
              onClick={() => setSelectedDate((current) => addDays(current, -1))}
              className="rounded-lg p-2 transition-colors hover:bg-brand-navy/5"
            >
              <ChevronLeft size={18} className="text-brand-navy" />
            </button>
            <div className="flex items-center gap-2 px-4">
              <CalendarIcon size={16} className="text-brand-gold" />
              <span className="text-sm font-bold text-brand-navy">
                {format(selectedDate, "EEE, MMM dd, yyyy")}
              </span>
            </div>
            <button
              onClick={() => setSelectedDate((current) => addDays(current, 1))}
              className="rounded-lg p-2 transition-colors hover:bg-brand-navy/5"
            >
              <ChevronRight size={18} className="text-brand-navy" />
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-white p-1 shadow-sm">
            <ModeButton icon={<CalendarIcon size={16} />} label="Day" active={viewMode === "day"} onClick={() => setViewMode("day")} />
            <ModeButton icon={<CalendarDays size={16} />} label="Week" active={viewMode === "week"} onClick={() => setViewMode("week")} />
            <ModeButton icon={<User size={16} />} label="Technician" active={viewMode === "technician"} onClick={() => setViewMode("technician")} />
          </div>

          <AdminButton variant="outline" iconLeft={<RefreshCw size={16} />} onClick={refreshAll} disabled={isRefreshing}>
            Refresh
          </AdminButton>
          <AdminButton variant="outline" iconLeft={<Users size={16} />} onClick={() => navigate("/scheduling/shifts")}>
            Shift Scheduler
          </AdminButton>
          <AdminButton iconLeft={<Route size={16} />} onClick={() => navigate("/scheduling/amc")}>
            AMC Review
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-9">
          <AdminCard className="overflow-hidden p-0">
            <div className="border-b border-border bg-brand-navy/[0.02] px-6 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <SectionHeader
                  title={viewMode === "technician" ? "Technician View" : viewMode === "week" ? "Week View" : "Day View"}
                  icon={viewMode === "week" ? <CalendarDays size={18} /> : <CalendarIcon size={18} />}
                  className="mb-0"
                />
                <div className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">
                  Last refreshed {format(lastUpdated, "hh:mm a")}
                </div>
              </div>
            </div>

            {viewMode === "day" && board ? (
              <DayGrid
                technicians={board.technicians}
                timeSlots={board.timeSlots}
                jobs={board.jobs}
                dateLabel={format(selectedDate, "yyyy-MM-dd")}
                draggingJobId={draggingJobId}
                onDragStart={setDraggingJobId}
                onDragEnd={() => setDraggingJobId(undefined)}
                onDrop={handleDrop}
                onJobClick={(job) => setSelectedZoneId(job.zoneId)}
              />
            ) : null}

            {viewMode === "week" && board ? (
              <WeekGrid
                technicians={board.technicians}
                jobs={board.jobs}
                selectedDate={selectedDate}
                onSelectDay={(date) => {
                  setSelectedDate(date);
                  setViewMode("day");
                }}
              />
            ) : null}

            {viewMode === "technician" ? (
              <TechnicianPanel
                technician={selectedTechnician}
                technicians={board?.technicians || []}
                selectedTechnicianId={selectedTechnicianId}
                onSelectTechnician={setSelectedTechnicianId}
                itinerary={technicianDaySheet?.itinerary || []}
                onExportCsv={exportDaySheetCsv}
                onPrint={() => window.print()}
              />
            ) : null}
          </AdminCard>
        </div>

        <div className="space-y-6 xl:col-span-3">
          <AdminCard className="p-0 overflow-hidden">
            <div className="border-b border-border bg-brand-navy/[0.02] px-4 py-4">
              <SectionHeader title="Unassigned Queue" icon={<ShieldAlert size={18} className="text-brand-gold" />} className="mb-0" />
            </div>
            <div className="max-h-[360px] space-y-3 overflow-y-auto p-4">
              {board?.unassignedJobs.map((job) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={() => setDraggingJobId(job.id)}
                  onDragEnd={() => setDraggingJobId(undefined)}
                  onClick={() => setSelectedZoneId(job.zoneId)}
                  className="cursor-grab rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-gold"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-navy">{job.srNumber}</span>
                    <span className={PriorityBadgeClass[job.priority]}>{job.priority}</span>
                  </div>
                  <p className="text-sm font-bold text-brand-navy">{job.customerName}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-widest text-brand-muted">{job.serviceName}</p>
                  <p className="mt-2 text-xs text-brand-muted">{job.slotLabel}</p>
                </div>
              ))}
              {board && board.unassignedJobs.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-brand-muted">No jobs waiting for technician assignment.</p>
              ) : null}
            </div>
          </AdminCard>

          <AdminCard className="p-0 overflow-hidden">
            <div className="border-b border-border bg-brand-navy/[0.02] px-4 py-4">
              <SectionHeader title="Slot Availability Manager" icon={<MapPinned size={18} />} className="mb-0" />
            </div>
            <div className="space-y-3 p-4">
              {zoneSlots.map((slot) => (
                <div key={slot.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">{slot.slotLabel}</p>
                      <p className="text-[11px] uppercase tracking-widest text-brand-muted">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest",
                      slot.isBlocked ? "bg-status-emergency/10 text-status-emergency" : "bg-brand-navy/5 text-brand-navy",
                    )}>
                      {slot.isBlocked ? "Blocked" : `${slot.reservedCapacity}/${slot.availableCapacity}`}
                    </span>
                  </div>
                  <AdminButton
                    className="mt-3 w-full"
                    variant="outline"
                    onClick={() => handleSlotToggle(slot)}
                    disabled={isUpdatingSlotId === slot.id}
                  >
                    {slot.isBlocked ? "Unblock Slot" : "Block Slot"}
                  </AdminButton>
                </div>
              ))}
              {zoneSlots.length === 0 ? (
                <p className="py-8 text-center text-sm text-brand-muted">
                  Select a job zone to inspect schedule slots.
                </p>
              ) : null}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}

function ModeButton(props: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors",
        props.active ? "bg-brand-navy text-white" : "text-brand-navy hover:bg-brand-navy/5",
      )}
    >
      {props.icon}
      {props.label}
    </button>
  );
}

function DayGrid(props: {
  technicians: SchedulingTechnician[];
  timeSlots: SchedulingTimeSlot[];
  jobs: SchedulingJob[];
  dateLabel: string;
  draggingJobId?: string;
  onDragStart: (jobId?: string) => void;
  onDragEnd: () => void;
  onDrop: (jobId: string, technicianId: string, slot: SchedulingTimeSlot, slotDate: string) => Promise<void>;
  onJobClick: (job: SchedulingJob) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[960px]">
        <div className="flex border-b border-border bg-brand-navy/[0.02]">
          <div className="w-24 shrink-0 border-r border-border px-4 py-4 text-xs font-bold uppercase tracking-widest text-brand-muted">
            Slot
          </div>
          {props.technicians.map((technician) => (
            <div key={technician.id} className="min-w-[220px] flex-1 border-r border-border px-4 py-4 last:border-r-0">
              <p className="text-sm font-bold text-brand-navy">{technician.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-brand-muted">{technician.status}</p>
            </div>
          ))}
        </div>

        {props.timeSlots.map((slot) => (
          <div key={slot.key} className="flex border-b border-border last:border-b-0">
            <div className="w-24 shrink-0 border-r border-border px-4 py-4">
              <p className="text-xs font-bold text-brand-navy">{slot.startTime}</p>
              <p className="text-[10px] uppercase tracking-widest text-brand-muted">{slot.label}</p>
            </div>
            {props.technicians.map((technician) => {
              const cellJobs = props.jobs.filter(
                (job) =>
                  job.technicianId === technician.id &&
                  job.slotDate === props.dateLabel &&
                  job.startTime === slot.startTime,
              );

              return (
                <div
                  key={`${technician.id}-${slot.key}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={async () => {
                    if (!props.draggingJobId) {
                      return;
                    }

                    await props.onDrop(props.draggingJobId, technician.id, slot, props.dateLabel);
                    props.onDragEnd();
                  }}
                  className="min-h-[104px] flex-1 border-r border-border bg-white p-3 last:border-r-0"
                >
                  <div className="space-y-2">
                    {cellJobs.map((job) => (
                      <button
                        key={job.id}
                        draggable
                        onDragStart={() => props.onDragStart(job.id)}
                        onDragEnd={props.onDragEnd}
                        onClick={() => props.onJobClick(job)}
                        className={cn(
                          "w-full rounded-2xl border p-3 text-left shadow-sm transition-transform hover:-translate-y-0.5",
                          JobCardClass[job.priority],
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold">{job.srNumber}</span>
                          <span className="text-[10px] uppercase tracking-widest opacity-70">{job.endTime}</span>
                        </div>
                        <p className="mt-1 text-sm font-bold">{job.customerName}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-widest opacity-80">{job.serviceName}</p>
                      </button>
                    ))}
                    {cellJobs.length === 0 ? (
                      <div className="flex h-[72px] items-center justify-center rounded-2xl border border-dashed border-border text-[11px] uppercase tracking-widest text-brand-muted">
                        Drop Job Here
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekGrid(props: {
  technicians: SchedulingTechnician[];
  jobs: SchedulingJob[];
  selectedDate: Date;
  onSelectDay: (date: Date) => void;
}) {
  const days = React.useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(props.selectedDate, index)), [props.selectedDate]);

  return (
    <div className="overflow-x-auto p-4">
      <div className="min-w-[860px] rounded-3xl border border-border">
        <div className="grid grid-cols-[220px_repeat(7,minmax(110px,1fr))] border-b border-border bg-brand-navy/[0.02]">
          <div className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-brand-muted">Technician</div>
          {days.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => props.onSelectDay(day)}
              className="border-l border-border px-3 py-4 text-center"
            >
              <p className="text-xs font-bold text-brand-navy">{format(day, "EEE")}</p>
              <p className="text-[10px] uppercase tracking-widest text-brand-muted">{format(day, "dd MMM")}</p>
            </button>
          ))}
        </div>

        {props.technicians.map((technician) => (
          <div key={technician.id} className="grid grid-cols-[220px_repeat(7,minmax(110px,1fr))] border-b border-border last:border-b-0">
            <div className="px-4 py-4">
              <p className="text-sm font-bold text-brand-navy">{technician.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-brand-muted">{technician.status}</p>
            </div>
            {days.map((day) => {
              const dateLabel = format(day, "yyyy-MM-dd");
              const jobs = props.jobs.filter((job) => job.technicianId === technician.id && job.slotDate === dateLabel);
              return (
                <button
                  key={`${technician.id}-${dateLabel}`}
                  onClick={() => props.onSelectDay(day)}
                  className="border-l border-border px-3 py-4 text-left transition-colors hover:bg-brand-navy/[0.02]"
                >
                  <p className="text-sm font-bold text-brand-navy">{jobs.length} jobs</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {jobs.slice(0, 4).map((job) => (
                      <span key={job.id} className={cn("h-2 w-2 rounded-full", DotClass[job.priority])} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function TechnicianPanel(props: {
  technician?: SchedulingTechnician;
  technicians: SchedulingTechnician[];
  selectedTechnicianId?: string;
  onSelectTechnician: (id: string) => void;
  itinerary: SchedulingDaySheet["technicians"][number]["itinerary"];
  onExportCsv: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <AdminCard className="p-0 overflow-hidden">
          <div className="border-b border-border bg-brand-navy/[0.02] px-4 py-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-muted">Technicians</h3>
          </div>
          <div className="divide-y divide-border">
            {props.technicians.map((technician) => (
              <button
                key={technician.id}
                onClick={() => props.onSelectTechnician(technician.id)}
                className={cn(
                  "w-full px-4 py-4 text-left transition-colors",
                  props.selectedTechnicianId === technician.id ? "bg-brand-navy/5" : "hover:bg-brand-navy/[0.02]",
                )}
              >
                <p className="text-sm font-bold text-brand-navy">{technician.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-muted">{technician.status}</p>
              </button>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="space-y-6 lg:col-span-8">
        <AdminCard className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-brand-navy">{props.technician?.name || "Technician Briefing"}</h3>
              <p className="text-sm text-brand-muted">Daily itinerary and printable handover sheet</p>
            </div>
            <div className="flex gap-2">
              <AdminButton variant="outline" iconLeft={<Download size={16} />} onClick={props.onExportCsv}>
                Export CSV
              </AdminButton>
              <AdminButton iconLeft={<Download size={16} />} onClick={props.onPrint}>
                PDF / Print
              </AdminButton>
            </div>
          </div>
        </AdminCard>

        <div className="space-y-3">
          {props.itinerary.map((item) => (
            <AdminCard key={item.serviceRequestId} className="p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">{item.serviceRequestNumber}</p>
                  <h4 className="mt-1 text-lg font-bold text-brand-navy">{item.customerName}</h4>
                  <p className="mt-1 text-sm text-brand-muted">{item.address}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm font-bold text-brand-navy">{item.startTime} - {item.endTime}</p>
                  <p className="text-[10px] uppercase tracking-widest text-brand-muted">{item.zoneName}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-navy">
                  {item.serviceName}
                </span>
                <span className={PriorityBadgeClass[item.priority]}>{item.priority}</span>
                <span className="rounded-full bg-brand-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                  {item.status}
                </span>
              </div>
            </AdminCard>
          ))}

          {props.itinerary.length === 0 ? (
            <AdminCard className="p-10 text-center text-sm text-brand-muted">
              No itinerary is available for the selected technician and day.
            </AdminCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const PriorityBadgeClass: Record<SchedulingJob["priority"], string> = {
  emergency: "rounded-full bg-status-emergency/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-status-emergency",
  urgent: "rounded-full bg-brand-gold/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold",
  normal: "rounded-full bg-brand-navy/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-navy",
};

const JobCardClass: Record<SchedulingJob["priority"], string> = {
  emergency: "border-status-emergency/20 bg-status-emergency/5 text-status-emergency",
  urgent: "border-brand-gold/20 bg-brand-gold/10 text-brand-gold",
  normal: "border-brand-navy/10 bg-brand-navy/5 text-brand-navy",
};

const DotClass: Record<SchedulingJob["priority"], string> = {
  emergency: "bg-status-emergency",
  urgent: "bg-brand-gold",
  normal: "bg-brand-navy",
};
