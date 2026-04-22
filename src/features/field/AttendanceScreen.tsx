/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  LogIn,
  LogOut,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/shared/Cards";
import { AdminButton } from "@/components/shared/AdminButton";
import { InlineLoader } from "@/components/shared/Layout";
import {
  FieldAttendanceRecord,
  HelperJobView,
  fieldWorkflowRepository,
} from "@/core/network/field-workflow-repository";
import { UserRole, useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const isTodayRecord = (attendance?: FieldAttendanceRecord | null) =>
  attendance?.attendanceDate === new Date().toISOString().slice(0, 10);

const captureLocation = async () =>
  new Promise<{ latitude?: number; longitude?: number }>((resolve) => {
    if (!navigator.geolocation) {
      resolve({});
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

export default function AttendanceScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isHelper = user?.role === UserRole.HELPER;
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [attendance, setAttendance] = React.useState<FieldAttendanceRecord | null>(null);
  const [helperJob, setHelperJob] = React.useState<HelperJobView | null>(null);

  const loadAttendance = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (isHelper) {
        const helperView = await fieldWorkflowRepository.getHelperJobView();
        setHelperJob(helperView);
        setAttendance(
          helperView?.attendance.find((item) => isTodayRecord(item)) ?? helperView?.attendance[0] ?? null,
        );
      } else {
        const cachedAttendance = fieldWorkflowRepository.getCachedAttendance();
        setAttendance(isTodayRecord(cachedAttendance) ? cachedAttendance : null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load attendance.");
    } finally {
      setIsLoading(false);
    }
  }, [isHelper]);

  React.useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const isCheckedIn = Boolean(attendance?.checkInOnUtc && !attendance?.checkOutOnUtc);

  const handleTechnicianAttendance = async (mode: "check-in" | "check-out") => {
    setIsSubmitting(true);
    try {
      const location = await captureLocation();
      const nextAttendance =
        mode === "check-in"
          ? await fieldWorkflowRepository.checkIn("Base / field attendance", location.latitude, location.longitude)
          : await fieldWorkflowRepository.checkOut("Field completion", location.latitude, location.longitude);
      setAttendance(nextAttendance);
      toast.success(mode === "check-in" ? "Technician checked in." : "Technician checked out.");
    } catch (error) {
      console.error(error);
      toast.error(`Unable to ${mode}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelperAttendance = async (mode: "check-in" | "check-out") => {
    setIsSubmitting(true);
    try {
      const nextAttendance =
        mode === "check-in"
          ? await fieldWorkflowRepository.checkInHelper("Helper attendance start")
          : await fieldWorkflowRepository.checkOutHelper("Helper attendance close");
      setAttendance(nextAttendance);
      setHelperJob((current) =>
        current
          ? {
              ...current,
              attendance:
                mode === "check-in"
                  ? [nextAttendance, ...current.attendance]
                  : [nextAttendance, ...current.attendance.slice(1)],
            }
          : current,
      );
      toast.success(mode === "check-in" ? "Helper checked in." : "Helper checked out.");
    } catch (error) {
      console.error(error);
      toast.error(`Unable to ${mode}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <InlineLoader className="h-screen" />;
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <button className="rounded-xl p-2 transition hover:bg-brand-navy/5" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Attendance</h1>
          <p className="text-sm text-brand-muted">
            {isHelper
              ? "Helper attendance uses the current helper attendance contract."
              : "Technician attendance is captured through the Phase 10 field workflow endpoints."}
          </p>
        </div>
      </div>

      <AdminCard className="rounded-[32px] border-none bg-brand-navy p-6 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Today</p>
            <h2 className="text-2xl font-bold">
              {isCheckedIn ? "Shift is active right now." : "No active shift recorded today."}
            </h2>
            <p className="text-sm text-white/65">
              {attendance
                ? `${attendance.attendanceStatus} • ${attendance.locationText || "Location captured"}`
                : "Start the day with check-in to unlock live field workflow actions."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <AdminButton
              isLoading={isSubmitting}
              onClick={() =>
                void (isHelper
                  ? handleHelperAttendance(isCheckedIn ? "check-out" : "check-in")
                  : handleTechnicianAttendance(isCheckedIn ? "check-out" : "check-in"))
              }
            >
              {isCheckedIn ? (
                <>
                  <LogOut size={14} /> Check Out
                </>
              ) : (
                <>
                  <LogIn size={14} /> Check In
                </>
              )}
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Attendance Date" value={attendance?.attendanceDate || "--"} icon={<CalendarDays size={18} />} />
        <MetricCard
          label="Check In"
          value={attendance?.checkInOnUtc ? new Date(attendance.checkInOnUtc).toLocaleTimeString() : "--:--"}
          icon={<Clock3 size={18} />}
        />
        <MetricCard
          label="Check Out"
          value={attendance?.checkOutOnUtc ? new Date(attendance.checkOutOnUtc).toLocaleTimeString() : "--:--"}
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {isHelper ? (
        <AdminCard className="rounded-[32px] border p-0">
          <div className="border-b border-border p-5">
            <h3 className="text-base font-bold text-brand-navy">Helper attendance history</h3>
            <p className="text-sm text-brand-muted">
              Retrieved together with the active helper assignment and task checklist.
            </p>
          </div>
          <div className="divide-y divide-border">
            {(helperJob?.attendance ?? []).map((item) => (
              <div key={item.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-navy">{item.attendanceDate}</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-muted">
                    {item.attendanceStatus}
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-brand-navy/75 md:grid-cols-3 md:text-right">
                  <span>{item.checkInOnUtc ? new Date(item.checkInOnUtc).toLocaleTimeString() : "--:--"}</span>
                  <span>{item.checkOutOnUtc ? new Date(item.checkOutOnUtc).toLocaleTimeString() : "--:--"}</span>
                  <span>{item.locationText || "Location not set"}</span>
                </div>
              </div>
            ))}
            {(!helperJob || helperJob.attendance.length === 0) && (
              <div className="p-8 text-center text-sm text-brand-muted">No helper attendance records available yet.</div>
            )}
          </div>
        </AdminCard>
      ) : (
        <AdminCard className="rounded-[32px] border p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-gold/15 text-brand-navy">
              <MapPin size={18} />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-brand-navy">Technician attendance note</h3>
              <p className="text-sm text-brand-muted">
                The current field API exposes check-in and check-out writes for technicians. This screen keeps today&apos;s
                active attendance locally in sync with those calls so the field dashboard and job workflow can react
                immediately even when some submissions are queued offline.
              </p>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}

function MetricCard(props: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <AdminCard className="rounded-[28px] border p-5">
      <div className="mb-4 flex size-10 items-center justify-center rounded-2xl bg-brand-navy text-brand-gold">
        {props.icon}
      </div>
      <p className={cn("text-base font-bold text-brand-navy", props.value === "--" && "text-brand-muted")}>
        {props.value}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-muted">{props.label}</p>
    </AdminCard>
  );
}
