/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock3,
  ClipboardList,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/shared/Cards";
import { AdminButton } from "@/components/shared/AdminButton";
import { InlineLoader } from "@/components/shared/Layout";
import {
  FieldAttendanceRecord,
  FieldJobListItem,
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

export default function TechnicianHomeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isHelper = user?.role === UserRole.HELPER;
  const [isLoading, setIsLoading] = React.useState(true);
  const [jobs, setJobs] = React.useState<FieldJobListItem[]>([]);
  const [attendance, setAttendance] = React.useState<FieldAttendanceRecord | null>(null);
  const [helperJob, setHelperJob] = React.useState<HelperJobView | null>(null);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = React.useState(false);

  const loadDashboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (isHelper) {
        const assignment = await fieldWorkflowRepository.getHelperJobView();
        setHelperJob(assignment);
        setAttendance(
          assignment?.attendance.find((item) => isTodayRecord(item)) ?? assignment?.attendance[0] ?? null,
        );
      } else {
        const myJobs = await fieldWorkflowRepository.getMyJobs();
        setJobs(myJobs);
        const cachedAttendance = fieldWorkflowRepository.getCachedAttendance();
        setAttendance(isTodayRecord(cachedAttendance) ? cachedAttendance : null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load field dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [isHelper]);

  React.useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleTechnicianAttendance = async (mode: "check-in" | "check-out") => {
    setIsSubmittingAttendance(true);
    try {
      const location = await captureLocation();
      const nextAttendance =
        mode === "check-in"
          ? await fieldWorkflowRepository.checkIn("Base / field start", location.latitude, location.longitude)
          : await fieldWorkflowRepository.checkOut("Field wrap-up", location.latitude, location.longitude);
      setAttendance(nextAttendance);
      toast.success(mode === "check-in" ? "Checked in successfully." : "Checked out successfully.");
    } catch (error) {
      console.error(error);
      toast.error(`Unable to ${mode} right now.`);
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleHelperAttendance = async (mode: "check-in" | "check-out") => {
    setIsSubmittingAttendance(true);
    try {
      const nextAttendance =
        mode === "check-in"
          ? await fieldWorkflowRepository.checkInHelper("Helper shift started")
          : await fieldWorkflowRepository.checkOutHelper("Helper shift closed");
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
      toast.success(mode === "check-in" ? "Helper attendance recorded." : "Helper check-out recorded.");
    } catch (error) {
      console.error(error);
      toast.error(`Unable to ${mode} right now.`);
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  if (isLoading) {
    return <InlineLoader className="h-screen" />;
  }

  if (isHelper) {
    return (
      <HelperDashboard
        attendance={attendance}
        helperJob={helperJob}
        isSubmittingAttendance={isSubmittingAttendance}
        onRefresh={loadDashboard}
        onAttendance={handleHelperAttendance}
        onOpenJob={(serviceRequestId) => navigate(`/field/helper/job/${serviceRequestId}`)}
      />
    );
  }

  const openJobs = jobs.filter((job) => job.status !== "completed" && job.status !== "cancelled");
  const completedCount = jobs.filter((job) => job.status === "completed").length;
  const nextJob = openJobs[0];
  const isCheckedIn = Boolean(attendance?.checkInOnUtc && !attendance?.checkOutOnUtc);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-navy text-brand-gold">
            <UserCircle2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-navy">{user?.name || "Field Team"}</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">
              Technician field dashboard
            </p>
          </div>
        </div>
        <AdminButton variant="secondary" onClick={() => navigate("/attendance")}>
          Attendance
        </AdminButton>
      </div>

      <AdminCard className="overflow-hidden border-none bg-brand-navy p-6 text-white">
        <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">Shift readiness</p>
            <h2 className="text-2xl font-bold">
              {isCheckedIn ? "Field shift is active." : "Check in before you head to the first job."}
            </h2>
            <p className="max-w-xl text-sm text-white/70">
              Attendance is linked to the Phase 10 field workflow API. Once checked in, today&apos;s jobs,
              arrival GPS, report capture, payment collection, and completion flow are ready from the same module.
            </p>
          </div>
          <div className="rounded-[28px] bg-white/8 p-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Today&apos;s status</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/65">Attendance</span>
                <span className="font-semibold">{isCheckedIn ? "Checked in" : "Not checked in"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/65">Open jobs</span>
                <span className="font-semibold">{openJobs.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/65">Completed</span>
                <span className="font-semibold">{completedCount}</span>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <AdminButton
                className="flex-1"
                isLoading={isSubmittingAttendance}
                onClick={() => handleTechnicianAttendance(isCheckedIn ? "check-out" : "check-in")}
              >
                {isCheckedIn ? "Check Out" : "Check In"}
              </AdminButton>
            </div>
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Assigned Today" value={jobs.length} icon={<ClipboardList size={18} />} />
        <KpiCard label="Ready to Visit" value={openJobs.length} icon={<Navigation size={18} />} />
        <KpiCard label="Submitted" value={completedCount} icon={<ShieldCheck size={18} />} />
      </div>

      {nextJob ? (
        <AdminCard className="rounded-[32px] border-brand-gold/25 bg-brand-gold/10 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-navy/50">Next job</p>
              <div>
                <h3 className="text-2xl font-bold text-brand-navy">{nextJob.serviceRequestNumber}</h3>
                <p className="text-sm text-brand-navy/70">{nextJob.serviceName}</p>
              </div>
              <div className="space-y-2 text-sm text-brand-navy/80">
                <div className="flex items-center gap-2">
                  <Clock3 size={14} className="text-brand-gold" />
                  <span>{nextJob.slotLabel}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 text-brand-gold" />
                  <span>{nextJob.addressSummary}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <AdminButton onClick={() => navigate(`/field/job/${nextJob.id}`)}>Open Workflow</AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => window.open(`tel:${nextJob.mobileNumber}`, "_self")}
              >
                <Phone size={14} /> Call Customer
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      ) : (
        <AdminCard className="rounded-[32px] border-dashed p-8 text-center">
          <ClipboardList size={28} className="mx-auto mb-3 text-brand-muted" />
          <h3 className="text-base font-bold text-brand-navy">No active jobs in the current queue.</h3>
          <p className="mt-2 text-sm text-brand-muted">New assignments will appear here as soon as dispatch confirms them.</p>
        </AdminCard>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-brand-navy">Today&apos;s jobs</h3>
            <p className="text-sm text-brand-muted">Sorted by scheduled slot from the new field workflow endpoint.</p>
          </div>
          <AdminButton variant="secondary" onClick={() => navigate("/field/jobs")}>
            View All
          </AdminButton>
        </div>

        <div className="space-y-3">
          {jobs.map((job) => (
            <button
              key={job.id}
              className="w-full rounded-[28px] border border-border bg-white p-5 text-left transition hover:border-brand-gold/40"
              onClick={() => navigate(`/field/job/${job.id}`)}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-bold text-brand-navy">{job.customerName}</h4>
                    <StatusBadge status={job.status}>{job.currentStatus}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-brand-muted">
                    {job.serviceRequestNumber} • {job.serviceName}
                  </p>
                </div>
                <div className="space-y-1 text-sm text-brand-navy/75 md:text-right">
                  <p className="font-medium">{job.slotLabel}</p>
                  <p>{job.addressSummary}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelperDashboard(props: {
  helperJob: HelperJobView | null;
  attendance: FieldAttendanceRecord | null;
  isSubmittingAttendance: boolean;
  onRefresh: () => Promise<void>;
  onAttendance: (mode: "check-in" | "check-out") => Promise<void>;
  onOpenJob: (serviceRequestId: string) => void;
}) {
  const { helperJob, attendance, isSubmittingAttendance, onRefresh, onAttendance, onOpenJob } = props;
  const isCheckedIn = Boolean(attendance?.checkInOnUtc && !attendance?.checkOutOnUtc);
  const completedTasks = helperJob?.tasks.filter((task) => task.responseStatus.toLowerCase() !== "pending").length ?? 0;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Helper field dashboard</h1>
          <p className="text-sm text-brand-muted">Simplified attendance, assignment, and task capture.</p>
        </div>
        <AdminButton variant="secondary" onClick={() => void onRefresh()}>
          Refresh
        </AdminButton>
      </div>

      <AdminCard className="rounded-[32px] border-brand-gold/25 bg-brand-navy p-6 text-white">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Attendance</p>
            <h2 className="mt-2 text-2xl font-bold">
              {isCheckedIn ? "Checked in with the field team." : "Check in before helper tasks begin."}
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Helper mode does not expose financials, parts ordering, or customer contact. It only surfaces the
              assignment, task checklist, attendance, and task photo capture.
            </p>
          </div>
          <AdminButton
            isLoading={isSubmittingAttendance}
            onClick={() => void onAttendance(isCheckedIn ? "check-out" : "check-in")}
          >
            {isCheckedIn ? "Check Out" : "Check In"}
          </AdminButton>
        </div>
      </AdminCard>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Task Responses" value={completedTasks} icon={<ClipboardList size={18} />} />
        <KpiCard
          label="Open Tasks"
          value={(helperJob?.tasks.length ?? 0) - completedTasks}
          icon={<Navigation size={18} />}
        />
        <KpiCard label="Attendance Logs" value={helperJob?.attendance.length ?? 0} icon={<ShieldCheck size={18} />} />
      </div>

      {helperJob?.serviceRequestId ? (
        <AdminCard className="rounded-[32px] border p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-muted">Current assignment</p>
              <div>
                <h3 className="text-2xl font-bold text-brand-navy">{helperJob.serviceRequestNumber}</h3>
                <p className="text-sm text-brand-navy/70">{helperJob.serviceName}</p>
              </div>
              <div className="space-y-2 text-sm text-brand-navy/80">
                <div className="flex items-center gap-2">
                  <UserCircle2 size={14} className="text-brand-gold" />
                  <span>Lead technician: {helperJob.technicianName || "Assigned technician"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 text-brand-gold" />
                  <span>{helperJob.addressSummary}</span>
                </div>
              </div>
            </div>
            <AdminButton onClick={() => onOpenJob(helperJob.serviceRequestId!)}>Open Helper View</AdminButton>
          </div>
        </AdminCard>
      ) : (
        <AdminCard className="rounded-[32px] border-dashed p-8 text-center">
          <ClipboardList size={28} className="mx-auto mb-3 text-brand-muted" />
          <h3 className="text-base font-bold text-brand-navy">No active helper assignment.</h3>
          <p className="mt-2 text-sm text-brand-muted">Dispatch will surface the assigned technician job here.</p>
        </AdminCard>
      )}
    </div>
  );
}

function KpiCard(props: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <AdminCard className="rounded-[28px] border p-5">
      <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-brand-navy text-brand-gold">
        {props.icon}
      </div>
      <p className="text-2xl font-bold text-brand-navy">{props.value}</p>
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-muted">{props.label}</p>
    </AdminCard>
  );
}

function StatusBadge(props: { status: FieldJobListItem["status"]; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
        props.status === "completed" && "bg-status-completed/10 text-status-completed",
        props.status === "in-progress" && "bg-status-pending/10 text-status-pending",
        props.status === "arrived" && "bg-brand-gold/15 text-brand-navy",
        props.status === "en-route" && "bg-brand-navy/10 text-brand-navy",
        props.status === "assigned" && "bg-brand-gold/20 text-brand-navy",
        props.status === "cancelled" && "bg-status-emergency/10 text-status-emergency",
      )}
    >
      {props.children}
    </span>
  );
}
