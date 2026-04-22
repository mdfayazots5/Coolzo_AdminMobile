/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { ArrowLeft, CalendarClock, Clock3, Coffee, Save, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AdminCard } from "@/components/shared/Cards";
import { InlineLoader, SectionHeader } from "@/components/shared/Layout";
import { AdminButton } from "@/components/shared/AdminButton";
import { schedulingRepository, type SchedulingShiftDay } from "@/core/network/scheduling-repository";
import { technicianRepository, type Technician } from "@/core/network/technician-repository";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_SHIFT_START = "09:00";
const DEFAULT_SHIFT_END = "18:00";
const DEFAULT_BREAK_START = "13:00";
const DEFAULT_BREAK_END = "14:00";

type EditableShiftField = "shiftStartTime" | "shiftEndTime" | "breakStartTime" | "breakEndTime";

export default function TechnicianShiftScheduler() {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = React.useState<Technician[]>([]);
  const [shiftState, setShiftState] = React.useState<Record<string, SchedulingShiftDay[]>>({});
  const [selectedTechnicianId, setSelectedTechnicianId] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const loadRoster = async () => {
      try {
        const [technicianRows, shiftRows] = await Promise.all([
          technicianRepository.getTechnicians({ activeOnly: true }),
          schedulingRepository.getTechnicianShifts(),
        ]);

        const shiftLookup = new Map(
          shiftRows.map((shift) => [shift.technicianId, normalizeShiftDays(shift.days)]),
        );

        setTechnicians(technicianRows);
        setShiftState(
          Object.fromEntries(
            technicianRows.map((technician) => [
              technician.id,
              shiftLookup.get(technician.id) || buildFallbackShiftDays(),
            ]),
          ),
        );
        setSelectedTechnicianId((current) => current || technicianRows[0]?.id);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load technician shifts");
      } finally {
        setIsLoading(false);
      }
    };

    void loadRoster();
  }, []);

  const selectedTechnician = React.useMemo(
    () => technicians.find((technician) => technician.id === selectedTechnicianId),
    [selectedTechnicianId, technicians],
  );

  const selectedDays = React.useMemo(
    () => (selectedTechnicianId ? shiftState[selectedTechnicianId] || buildFallbackShiftDays() : []),
    [selectedTechnicianId, shiftState],
  );

  const handleDayChange = React.useCallback(
    (dayOfWeekNumber: number, updater: (day: SchedulingShiftDay) => SchedulingShiftDay) => {
      if (!selectedTechnicianId) {
        return;
      }

      setShiftState((current) => ({
        ...current,
        [selectedTechnicianId]: normalizeShiftDays(
          (current[selectedTechnicianId] || buildFallbackShiftDays()).map((day) =>
            day.dayOfWeekNumber === dayOfWeekNumber ? updater(day) : day,
          ),
        ),
      }));
    },
    [selectedTechnicianId],
  );

  const handleTimeChange = (dayOfWeekNumber: number, field: EditableShiftField, value: string) => {
    handleDayChange(dayOfWeekNumber, (day) => ({
      ...day,
      [field]: value || undefined,
    }));
  };

  const handleOffDutyToggle = (dayOfWeekNumber: number) => {
    handleDayChange(dayOfWeekNumber, (day) => {
      const nextOffDuty = !day.isOffDuty;
      return nextOffDuty
        ? {
            ...day,
            isOffDuty: true,
            shiftStartTime: undefined,
            shiftEndTime: undefined,
            breakStartTime: undefined,
            breakEndTime: undefined,
          }
        : {
            ...day,
            isOffDuty: false,
            shiftStartTime: day.shiftStartTime || DEFAULT_SHIFT_START,
            shiftEndTime: day.shiftEndTime || DEFAULT_SHIFT_END,
            breakStartTime: day.breakStartTime,
            breakEndTime: day.breakEndTime,
          };
    });
  };

  const handleBreakToggle = (dayOfWeekNumber: number) => {
    handleDayChange(dayOfWeekNumber, (day) => {
      const hasBreak = Boolean(day.breakStartTime || day.breakEndTime);
      return {
        ...day,
        breakStartTime: hasBreak ? undefined : day.breakStartTime || DEFAULT_BREAK_START,
        breakEndTime: hasBreak ? undefined : day.breakEndTime || DEFAULT_BREAK_END,
      };
    });
  };

  const handleSave = async () => {
    if (!selectedTechnicianId) {
      return;
    }

    setIsSaving(true);
    try {
      const savedShift = await schedulingRepository.updateTechnicianShifts({
        technicianId: selectedTechnicianId,
        days: selectedDays.map((day) => ({
          ...day,
          shiftStartTime: day.isOffDuty ? undefined : day.shiftStartTime || undefined,
          shiftEndTime: day.isOffDuty ? undefined : day.shiftEndTime || undefined,
          breakStartTime: day.isOffDuty ? undefined : day.breakStartTime || undefined,
          breakEndTime: day.isOffDuty ? undefined : day.breakEndTime || undefined,
        })),
      });

      setShiftState((current) => ({
        ...current,
        [savedShift.technicianId]: normalizeShiftDays(savedShift.days),
      }));
      toast.success("Technician roster updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update technician roster");
    } finally {
      setIsSaving(false);
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
            <h1 className="text-2xl font-bold text-brand-navy">Technician Shift Scheduler</h1>
            <p className="text-sm text-brand-muted">
              Weekly roster management for shifts, breaks, and off-duty windows
            </p>
          </div>
        </div>

        <AdminButton onClick={handleSave} disabled={!selectedTechnicianId || isSaving} iconLeft={<Save size={18} />}>
          {isSaving ? "Saving..." : "Save Shift Schedule"}
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4">
          <AdminCard className="overflow-hidden p-0">
            <div className="border-b border-border bg-brand-navy/[0.02] px-4 py-4">
              <SectionHeader title="Technicians" icon={<User size={18} />} className="mb-0" />
            </div>
            <div className="divide-y divide-border">
              {technicians.map((technician) => {
                const activeDays = (shiftState[technician.id] || []).filter((day) => !day.isOffDuty).length;
                return (
                  <button
                    key={technician.id}
                    onClick={() => setSelectedTechnicianId(technician.id)}
                    className={cn(
                      "w-full px-4 py-4 text-left transition-colors",
                      selectedTechnicianId === technician.id ? "bg-brand-navy/5" : "hover:bg-brand-navy/[0.02]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-brand-navy/10 bg-brand-navy/5 text-brand-navy">
                        {technician.photo ? (
                          <img
                            src={technician.photo}
                            alt={technician.name}
                            className="size-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-brand-navy">{technician.name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-brand-muted">{technician.designation}</p>
                        <p className="mt-1 text-xs text-brand-muted">
                          {activeDays} working days
                          {technician.zoneAssignments.find((assignment) => assignment.isPrimary)?.name
                            ? ` • ${technician.zoneAssignments.find((assignment) => assignment.isPrimary)?.name}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard className="border-brand-gold/20 bg-brand-gold/10 p-6">
            <div className="flex gap-3">
              <ShieldCheck size={20} className="shrink-0 text-brand-gold" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy">Roster Rules</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-brand-navy/70">
                  Working days require valid shift hours. Break windows are optional, but if used they must stay inside the
                  shift window.
                </p>
              </div>
            </div>
          </AdminCard>
        </div>

        <div className="xl:col-span-8">
          {selectedTechnician ? (
            <div className="space-y-6">
              <AdminCard className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-brand-navy">{selectedTechnician.name}</h2>
                    <p className="text-sm text-brand-muted">
                      {selectedTechnician.designation}
                      {selectedTechnician.zoneAssignments.find((assignment) => assignment.isPrimary)?.name
                        ? ` • ${selectedTechnician.zoneAssignments.find((assignment) => assignment.isPrimary)?.name}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTechnician.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full bg-brand-navy/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-navy"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              </AdminCard>

              <AdminCard className="overflow-hidden p-0">
                <div className="border-b border-border bg-brand-navy/[0.02] px-6 py-4">
                  <SectionHeader title="Weekly Shift Plan" icon={<CalendarClock size={18} />} className="mb-0" />
                </div>
                <div className="space-y-4 p-6">
                  {selectedDays.map((day) => {
                    const hasBreak = Boolean(day.breakStartTime || day.breakEndTime);
                    return (
                      <div
                        key={day.dayOfWeekNumber}
                        className={cn(
                          "rounded-3xl border p-5",
                          day.isOffDuty ? "border-dashed border-brand-navy/15 bg-brand-navy/[0.02]" : "border-border bg-white",
                        )}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-sm font-bold text-brand-navy">{day.dayName}</p>
                            <p className="text-[11px] uppercase tracking-widest text-brand-muted">
                              {day.isOffDuty
                                ? "Off duty"
                                : `${day.shiftStartTime || DEFAULT_SHIFT_START} - ${day.shiftEndTime || DEFAULT_SHIFT_END}`}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleBreakToggle(day.dayOfWeekNumber)}
                              disabled={day.isOffDuty}
                              className={cn(
                                "rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                                day.isOffDuty
                                  ? "cursor-not-allowed bg-brand-navy/5 text-brand-muted"
                                  : hasBreak
                                    ? "bg-brand-gold/10 text-brand-gold"
                                    : "bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10",
                              )}
                            >
                              {hasBreak ? "Remove Break" : "Add Break"}
                            </button>
                            <button
                              onClick={() => handleOffDutyToggle(day.dayOfWeekNumber)}
                              className={cn(
                                "rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                                day.isOffDuty
                                  ? "bg-brand-gold text-brand-navy"
                                  : "bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10",
                              )}
                            >
                              {day.isOffDuty ? "Set Working Day" : "Set Off Duty"}
                            </button>
                          </div>
                        </div>

                        {!day.isOffDuty ? (
                          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <TimeField
                              label="Shift Start"
                              icon={<Clock3 size={14} className="text-brand-muted" />}
                              value={day.shiftStartTime || ""}
                              onChange={(value) => handleTimeChange(day.dayOfWeekNumber, "shiftStartTime", value)}
                            />
                            <TimeField
                              label="Shift End"
                              icon={<Clock3 size={14} className="text-brand-muted" />}
                              value={day.shiftEndTime || ""}
                              onChange={(value) => handleTimeChange(day.dayOfWeekNumber, "shiftEndTime", value)}
                            />
                            <TimeField
                              label="Break Start"
                              icon={<Coffee size={14} className="text-brand-muted" />}
                              value={day.breakStartTime || ""}
                              onChange={(value) => handleTimeChange(day.dayOfWeekNumber, "breakStartTime", value)}
                              placeholder={hasBreak ? undefined : "Optional"}
                            />
                            <TimeField
                              label="Break End"
                              icon={<Coffee size={14} className="text-brand-muted" />}
                              value={day.breakEndTime || ""}
                              onChange={(value) => handleTimeChange(day.dayOfWeekNumber, "breakEndTime", value)}
                              placeholder={hasBreak ? undefined : "Optional"}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </AdminCard>
            </div>
          ) : (
            <AdminCard className="p-10 text-center text-sm text-brand-muted">
              No active technicians are available for shift scheduling.
            </AdminCard>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeField(props: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{props.label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-brand-navy/[0.03] px-4 py-3">
        {props.icon}
        <input
          type="time"
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          placeholder={props.placeholder}
          className="w-full border-none bg-transparent text-sm font-bold text-brand-navy outline-none"
        />
      </div>
    </label>
  );
}

function buildFallbackShiftDays(): SchedulingShiftDay[] {
  return DAY_NAMES.map((dayName, dayOfWeekNumber) => ({
    dayOfWeekNumber,
    dayName,
    isOffDuty: dayOfWeekNumber === 0,
    shiftStartTime: dayOfWeekNumber === 0 ? undefined : DEFAULT_SHIFT_START,
    shiftEndTime: dayOfWeekNumber === 0 ? undefined : DEFAULT_SHIFT_END,
    breakStartTime: undefined,
    breakEndTime: undefined,
  }));
}

function normalizeShiftDays(days: SchedulingShiftDay[]): SchedulingShiftDay[] {
  const fallback = buildFallbackShiftDays();
  const lookup = new Map(days.map((day) => [day.dayOfWeekNumber, day]));

  return fallback.map((day) => {
    const existing = lookup.get(day.dayOfWeekNumber);
    return existing
      ? {
          ...existing,
          dayName: existing.dayName || day.dayName,
        }
      : day;
  });
}
