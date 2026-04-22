/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ClipboardList, MapPin, Search, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/shared/Cards";
import { AdminButton } from "@/components/shared/AdminButton";
import { InlineLoader } from "@/components/shared/Layout";
import {
  FieldJobListItem,
  HelperJobView,
  fieldWorkflowRepository,
} from "@/core/network/field-workflow-repository";
import { UserRole, useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

type JobTab = "today" | "history";

export default function MyJobsList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isHelper = user?.role === UserRole.HELPER;
  const [isLoading, setIsLoading] = React.useState(true);
  const [tab, setTab] = React.useState<JobTab>("today");
  const [query, setQuery] = React.useState("");
  const [todayJobs, setTodayJobs] = React.useState<FieldJobListItem[]>([]);
  const [historyJobs, setHistoryJobs] = React.useState<FieldJobListItem[]>([]);
  const [helperJob, setHelperJob] = React.useState<HelperJobView | null>(null);

  React.useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (isHelper) {
          setHelperJob(await fieldWorkflowRepository.getHelperJobView());
        } else {
          const [myJobs, jobHistory] = await Promise.all([
            fieldWorkflowRepository.getMyJobs(),
            fieldWorkflowRepository.getJobHistory(),
          ]);
          setTodayJobs(myJobs);
          setHistoryJobs(jobHistory);
        }
      } catch (error) {
        console.error(error);
        toast.error("Unable to load the field queue.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [isHelper]);

  if (isLoading) {
    return <InlineLoader className="h-screen" />;
  }

  if (isHelper) {
    return (
      <HelperAssignmentList
        helperJob={helperJob}
        onBack={() => navigate(-1)}
        onOpen={(serviceRequestId) => navigate(`/field/helper/job/${serviceRequestId}`)}
      />
    );
  }

  const source = tab === "today" ? todayJobs : historyJobs;
  const filteredJobs = source.filter((job) => {
    const lookup = `${job.serviceRequestNumber} ${job.customerName} ${job.serviceName}`.toLowerCase();
    return lookup.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <button
          className="rounded-xl p-2 transition hover:bg-brand-navy/5"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-navy">My field jobs</h1>
          <p className="text-sm text-brand-muted">Phase 10 live queue backed by `/api/v1/field`.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[auto_1fr_auto]">
        <div className="inline-flex rounded-2xl bg-brand-navy/5 p-1">
          <TabButton active={tab === "today"} label="Today" onClick={() => setTab("today")} />
          <TabButton active={tab === "history"} label="History" onClick={() => setTab("history")} />
        </div>
        <label className="relative block">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            className="w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-gold/40"
            placeholder="Search SR number, customer, service"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <AdminButton variant="secondary" onClick={() => navigate("/technician/home")}>
          Dashboard
        </AdminButton>
      </div>

      {filteredJobs.length === 0 ? (
        <AdminCard className="rounded-[32px] border-dashed p-8 text-center">
          <ClipboardList size={30} className="mx-auto mb-3 text-brand-muted" />
          <h2 className="text-base font-bold text-brand-navy">No jobs in this view.</h2>
          <p className="mt-2 text-sm text-brand-muted">
            {tab === "today"
              ? "Dispatch has not assigned any live jobs to this queue yet."
              : "Completed field jobs will appear here after submission for closure."}
          </p>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <button
              key={job.id}
              className="w-full rounded-[28px] border border-border bg-white p-5 text-left transition hover:border-brand-gold/40"
              onClick={() => navigate(`/field/job/${job.id}`)}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-brand-navy">{job.customerName}</h3>
                    <span className={badgeClass(job.status)}>{job.currentStatus}</span>
                  </div>
                  <p className="text-sm text-brand-muted">
                    {job.serviceRequestNumber} • {job.serviceName}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-brand-navy/75 md:text-right">
                  <p className="font-semibold">{job.slotLabel}</p>
                  <div className="flex items-start gap-2 md:justify-end">
                    <MapPin size={14} className="mt-0.5 text-brand-gold" />
                    <span className="max-w-md">{job.addressSummary}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HelperAssignmentList(props: {
  helperJob: HelperJobView | null;
  onBack: () => void;
  onOpen: (serviceRequestId: string) => void;
}) {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <button className="rounded-xl p-2 transition hover:bg-brand-navy/5" onClick={props.onBack}>
          <ChevronLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Helper assignments</h1>
          <p className="text-sm text-brand-muted">Simplified job list with helper-only task visibility.</p>
        </div>
      </div>

      {props.helperJob?.serviceRequestId ? (
        <AdminCard className="rounded-[32px] border p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-brand-muted">
                <UserCircle2 size={16} className="text-brand-gold" />
                <span>{props.helperJob.technicianName || "Assigned technician"}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-navy">{props.helperJob.serviceRequestNumber}</h2>
                <p className="text-sm text-brand-navy/70">{props.helperJob.serviceName}</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-brand-navy/80">
                <MapPin size={14} className="mt-0.5 text-brand-gold" />
                <span>{props.helperJob.addressSummary}</span>
              </div>
              <p className="text-sm text-brand-muted">{props.helperJob.assignmentRemarks}</p>
            </div>
            <div className="space-y-3">
              <p className={cn("text-xs font-bold uppercase tracking-[0.24em]", "text-brand-muted")}>
                {props.helperJob.assignmentStatus}
              </p>
              <AdminButton onClick={() => props.onOpen(props.helperJob!.serviceRequestId!)}>Open Helper View</AdminButton>
            </div>
          </div>
        </AdminCard>
      ) : (
        <AdminCard className="rounded-[32px] border-dashed p-8 text-center">
          <ClipboardList size={30} className="mx-auto mb-3 text-brand-muted" />
          <h2 className="text-base font-bold text-brand-navy">No helper assignment available.</h2>
          <p className="mt-2 text-sm text-brand-muted">
            Once dispatch pairs the helper to a technician job, it will appear here.
          </p>
        </AdminCard>
      )}
    </div>
  );
}

function TabButton(props: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={cn(
        "rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition",
        props.active ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted",
      )}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function badgeClass(status: FieldJobListItem["status"]) {
  return cn(
    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
    status === "completed" && "bg-status-completed/10 text-status-completed",
    status === "in-progress" && "bg-status-pending/10 text-status-pending",
    status === "arrived" && "bg-brand-gold/15 text-brand-navy",
    status === "en-route" && "bg-brand-navy/10 text-brand-navy",
    status === "assigned" && "bg-brand-gold/20 text-brand-navy",
    status === "cancelled" && "bg-status-emergency/10 text-status-emergency",
  );
}
