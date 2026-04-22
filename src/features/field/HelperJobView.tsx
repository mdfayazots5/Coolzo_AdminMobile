/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  ImagePlus,
  MapPin,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/shared/Cards";
import { AdminButton } from "@/components/shared/AdminButton";
import { InlineLoader } from "@/components/shared/Layout";
import {
  HelperJobView as HelperJobViewModel,
  HelperTask,
  fieldWorkflowRepository,
} from "@/core/network/field-workflow-repository";
import { cn } from "@/lib/utils";

const fileToDataUrl = async (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });

export default function HelperJobView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = React.useState(true);
  const [helperJob, setHelperJob] = React.useState<HelperJobViewModel | null>(null);
  const [remarksByTask, setRemarksByTask] = React.useState<Record<string, string>>({});
  const [busyTaskId, setBusyTaskId] = React.useState<string | null>(null);
  const [isAttendanceBusy, setIsAttendanceBusy] = React.useState(false);

  const loadHelperJob = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const nextJob = await fieldWorkflowRepository.getHelperJobView(id);
      setHelperJob(nextJob);
      setRemarksByTask(
        Object.fromEntries((nextJob?.tasks ?? []).map((task) => [task.id, task.responseRemarks ?? ""])),
      );
    } catch (error) {
      console.error(error);
      toast.error("Unable to load the helper assignment.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void loadHelperJob();
  }, [loadHelperJob]);

  const todayAttendance = helperJob?.attendance[0];
  const isCheckedIn = Boolean(todayAttendance?.checkInOnUtc && !todayAttendance?.checkOutOnUtc);

  const handleAttendance = async (mode: "check-in" | "check-out") => {
    setIsAttendanceBusy(true);
    try {
      const nextAttendance =
        mode === "check-in"
          ? await fieldWorkflowRepository.checkInHelper("Helper shift started")
          : await fieldWorkflowRepository.checkOutHelper("Helper shift closed");
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
      setIsAttendanceBusy(false);
    }
  };

  const updateTasks = (tasks: HelperTask[]) => {
    setHelperJob((current) => (current ? { ...current, tasks } : current));
    setRemarksByTask((current) => ({
      ...current,
      ...Object.fromEntries(tasks.map((task) => [task.id, task.responseRemarks ?? ""])),
    }));
  };

  const handleSaveResponse = async (taskId: string, responseStatus: string) => {
    setBusyTaskId(taskId);
    try {
      const tasks = await fieldWorkflowRepository.saveHelperTaskResponse(
        taskId,
        responseStatus,
        remarksByTask[taskId],
      );
      updateTasks(tasks);
      toast.success("Helper task response saved.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save the helper task response.");
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleUploadPhoto = async (taskId: string, file?: File | null) => {
    if (!file) {
      return;
    }

    setBusyTaskId(taskId);
    try {
      const base64Content = await fileToDataUrl(file);
      const tasks = await fieldWorkflowRepository.uploadHelperTaskPhoto(taskId, {
        fileName: file.name,
        contentType: file.type || "image/jpeg",
        base64Content,
        responseRemarks: remarksByTask[taskId],
      });
      updateTasks(tasks);
      toast.success("Helper task photo uploaded.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to upload the helper task photo.");
    } finally {
      setBusyTaskId(null);
    }
  };

  if (isLoading) {
    return <InlineLoader className="h-screen" />;
  }

  if (!helperJob?.serviceRequestId) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center gap-3">
          <button className="rounded-xl p-2 transition hover:bg-brand-navy/5" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-brand-navy">Helper job view</h1>
            <p className="text-sm text-brand-muted">No active helper assignment found.</p>
          </div>
        </div>
        <AdminCard className="rounded-[32px] border-dashed p-8 text-center">
          <ShieldCheck size={30} className="mx-auto mb-3 text-brand-muted" />
          <p className="text-sm text-brand-muted">
            Dispatch has not assigned a technician job to this helper profile yet.
          </p>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <button className="rounded-xl p-2 transition hover:bg-brand-navy/5" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-navy">{helperJob.serviceRequestNumber}</h1>
          <p className="text-sm text-brand-muted">Helper task checklist and photo workflow.</p>
        </div>
      </div>

      <AdminCard className="rounded-[32px] border-none bg-brand-navy p-6 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Helper scope</p>
            <h2 className="text-2xl font-bold">Task execution only.</h2>
            <p className="max-w-2xl text-sm text-white/65">
              This screen only exposes the helper assignment, task checklist, task photos, and helper attendance.
              Customer contact, parts ordering, estimates, and payment controls remain hidden by design.
            </p>
          </div>
          <AdminButton isLoading={isAttendanceBusy} onClick={() => void handleAttendance(isCheckedIn ? "check-out" : "check-in")}>
            {isCheckedIn ? "Check Out" : "Check In"}
          </AdminButton>
        </div>
      </AdminCard>

      <AdminCard className="rounded-[32px] border p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-brand-muted">
              <UserCircle2 size={16} className="text-brand-gold" />
              <span>Lead technician: {helperJob.technicianName || "Assigned technician"}</span>
            </div>
            <h3 className="text-2xl font-bold text-brand-navy">{helperJob.serviceName}</h3>
            <div className="space-y-2 text-sm text-brand-navy/75">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 text-brand-gold" />
                <span>{helperJob.addressSummary}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 size={14} className="text-brand-gold" />
                <span>{helperJob.assignmentRemarks || "Follow the lead technician's instructions on site."}</span>
              </div>
            </div>
          </div>
          <div className="rounded-[24px] bg-brand-gold/10 p-5 text-sm text-brand-navy">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-muted">Attendance</p>
            <p className="mt-3 font-semibold">{todayAttendance?.attendanceStatus || "No active session"}</p>
            <p className="mt-2 text-brand-navy/70">
              {todayAttendance?.locationText || "Check in from this screen before starting task responses."}
            </p>
          </div>
        </div>
      </AdminCard>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-brand-navy">Helper task checklist</h3>
          <p className="text-sm text-brand-muted">Save each response and upload task evidence directly to the helper task contract.</p>
        </div>

        {helperJob.tasks.map((task) => (
          <AdminCard key={task.id} className="rounded-[32px] border p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-bold text-brand-navy">{task.taskName}</h4>
                    <span className={taskBadge(task.responseStatus)}>{task.responseStatus || "Pending"}</span>
                  </div>
                  <p className="text-sm text-brand-muted">{task.taskDescription}</p>
                  {task.mandatoryFlag && (
                    <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-status-emergency">
                      Mandatory task
                    </span>
                  )}
                </div>
                <div className="text-sm text-brand-navy/70">
                  {task.respondedOnUtc
                    ? `Updated ${new Date(task.respondedOnUtc).toLocaleString()}`
                    : "No response saved yet"}
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-brand-navy">Task remarks</span>
                <textarea
                  className="min-h-[110px] w-full rounded-2xl border border-border p-4 text-sm outline-none transition focus:border-brand-gold/40"
                  placeholder="Add helper notes, site observations, or task completion remarks."
                  value={remarksByTask[task.id] ?? ""}
                  onChange={(event) =>
                    setRemarksByTask((current) => ({
                      ...current,
                      [task.id]: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
                <AdminButton
                  variant="secondary"
                  className="justify-center"
                  isLoading={busyTaskId === task.id}
                  onClick={() => void handleSaveResponse(task.id, "Pending")}
                >
                  Pending
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  className="justify-center"
                  isLoading={busyTaskId === task.id}
                  onClick={() => void handleSaveResponse(task.id, "InProgress")}
                >
                  In Progress
                </AdminButton>
                <AdminButton
                  className="justify-center"
                  isLoading={busyTaskId === task.id}
                  onClick={() => void handleSaveResponse(task.id, "Completed")}
                >
                  <CheckCircle2 size={14} /> Complete
                </AdminButton>
                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border px-4 py-3 text-sm font-medium text-brand-navy transition hover:border-brand-gold/40">
                  <ImagePlus size={16} className="mr-2 text-brand-gold" />
                  Upload Photo
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={(event) => void handleUploadPhoto(task.id, event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {task.responsePhotoUrl ? (
                <div className="overflow-hidden rounded-[24px] border border-border">
                  <img
                    alt={task.taskName}
                    className="h-56 w-full object-cover"
                    src={task.responsePhotoUrl}
                  />
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-border bg-brand-navy/[0.02] p-5 text-sm text-brand-muted">
                  <div className="flex items-center gap-2">
                    <Camera size={16} className="text-brand-gold" />
                    <span>No task photo uploaded yet.</span>
                  </div>
                </div>
              )}
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}

function taskBadge(status: string) {
  const normalized = status.toLowerCase();
  return cn(
    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
    normalized === "completed" && "bg-status-completed/10 text-status-completed",
    normalized === "inprogress" && "bg-status-pending/10 text-status-pending",
    normalized === "pending" && "bg-brand-gold/20 text-brand-navy",
  );
}
