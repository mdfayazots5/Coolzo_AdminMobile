/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  ImagePlus,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/shared/Cards";
import { AdminButton } from "@/components/shared/AdminButton";
import { InlineLoader } from "@/components/shared/Layout";
import {
  FieldChecklistItem,
  FieldCustomerSignature,
  FieldJobDetail,
  FieldPartsRequestPayload,
  FieldEstimatePayload,
  FieldPaymentPayload,
  fieldWorkflowRepository,
} from "@/core/network/field-workflow-repository";
import { cn } from "@/lib/utils";

type ChecklistState = Record<string, { isChecked: boolean; responseRemarks: string }>;

type PartsRequestDraft = {
  urgency: "Normal" | "Emergency";
  notes: string;
  items: Array<{
    id: string;
    partCode: string;
    partName: string;
    quantityRequested: string;
    remarks: string;
  }>;
};

type EstimateDraft = {
  discountAmount: string;
  taxPercentage: string;
  remarks: string;
  lines: Array<{
    id: string;
    lineType: "Service" | "Labour" | "Part" | "VisitFee";
    lineDescription: string;
    quantity: string;
    unitPrice: string;
  }>;
};

type ReportDraft = {
  equipmentCondition: string;
  issuesIdentified: string;
  actionTaken: string;
  recommendation: string;
  observations: string;
};

const createId = () => `draft-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const createPartItem = () => ({
  id: createId(),
  partCode: "",
  partName: "",
  quantityRequested: "1",
  remarks: "",
});

const createEstimateLine = () => ({
  id: createId(),
  lineType: "Service" as const,
  lineDescription: "",
  quantity: "1",
  unitPrice: "0",
});

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

const fileToDataUrl = async (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });

const buildChecklistState = (items: FieldChecklistItem[]): ChecklistState =>
  Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        isChecked: item.isChecked,
        responseRemarks: item.responseRemarks ?? "",
      },
    ]),
  );

export default function JobWorkflowContainer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const signaturePadRef = React.useRef<SignaturePadHandle>(null);
  const [job, setJob] = React.useState<FieldJobDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const [checklistState, setChecklistState] = React.useState<ChecklistState>({});
  const [partsDraft, setPartsDraft] = React.useState<PartsRequestDraft>({
    urgency: "Normal",
    notes: "",
    items: [createPartItem()],
  });
  const [estimateDraft, setEstimateDraft] = React.useState<EstimateDraft>({
    discountAmount: "0",
    taxPercentage: "0",
    remarks: "",
    lines: [createEstimateLine()],
  });
  const [reportDraft, setReportDraft] = React.useState<ReportDraft>({
    equipmentCondition: "",
    issuesIdentified: "",
    actionTaken: "",
    recommendation: "",
    observations: "",
  });
  const [photoType, setPhotoType] = React.useState<"Before" | "During" | "After" | "IssueEvidence">("Before");
  const [photoRemarks, setPhotoRemarks] = React.useState("");
  const [signatureCustomerName, setSignatureCustomerName] = React.useState("");
  const [signatureRemarks, setSignatureRemarks] = React.useState("");
  const [paymentDraft, setPaymentDraft] = React.useState<FieldPaymentPayload>({
    paidAmount: 0,
    paymentMethod: "Cash",
    referenceNumber: "",
    remarks: "",
  });
  const [arrivalOverride, setArrivalOverride] = React.useState<{
    message: string;
    distanceMeters: number;
    latitude: number;
    longitude: number;
    reason: string;
  } | null>(null);

  const loadJob = React.useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    try {
      const detail = await fieldWorkflowRepository.getJobDetail(id);
      setJob(detail);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load the field job.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void loadJob();
  }, [loadJob]);

  React.useEffect(() => {
    if (!job) {
      return;
    }

    setChecklistState(buildChecklistState(job.checklist));
    setSignatureCustomerName(job.signature?.customerName || job.customerName);
    setSignatureRemarks(job.signature?.remarks || "");
    setPaymentDraft((current) => ({
      ...current,
      paidAmount: job.invoice?.balanceAmount || current.paidAmount || 0,
      expectedInvoiceAmount: job.invoice?.grandTotalAmount,
    }));
    setReportDraft({
      equipmentCondition: job.latestReport?.equipmentCondition || "",
      issuesIdentified: job.latestReport?.issuesIdentified.join(", ") || "",
      actionTaken: job.latestReport?.actionTaken || "",
      recommendation: job.latestReport?.recommendation || "",
      observations: job.latestReport?.observations || "",
    });
  }, [job]);

  const applyJobUpdate = async (updater: () => Promise<FieldJobDetail | null>) => {
    setBusyAction("job");
    try {
      const nextJob = await updater();
      if (nextJob) {
        setJob(nextJob);
      } else {
        await loadJob();
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to update the field job.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleDepart = async () => {
    if (!job) {
      return;
    }

    setBusyAction("depart");
    try {
      const location = await captureLocation();
      const nextJob = await fieldWorkflowRepository.depart(job.id, {
        remarks: "Departed from the field workflow screen.",
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (nextJob) {
        setJob(nextJob);
      }
      toast.success("Journey started.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to mark this job en route.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleArrive = async (overrideReason?: string) => {
    if (!job) {
      return;
    }

    setBusyAction("arrive");
    try {
      const location = await captureLocation();
      if (location.latitude == null || location.longitude == null) {
        toast.error("Location access is required for arrival check-in.");
        return;
      }

      const result = await fieldWorkflowRepository.arrive(job.id, {
        remarks: "Arrived from the field workflow screen.",
        latitude: location.latitude,
        longitude: location.longitude,
        overrideReason,
      });

      if (result.overrideRequired) {
        setArrivalOverride({
          message: result.message,
          distanceMeters: result.distanceMeters,
          latitude: location.latitude,
          longitude: location.longitude,
          reason: overrideReason ?? "",
        });
        return;
      }

      if (result.job) {
        setJob(result.job);
      }
      setArrivalOverride(null);
      toast.success(result.queued ? "Arrival queued for sync." : "Arrival recorded.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to record arrival.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleStartWork = async () => {
    if (!job) {
      return;
    }

    await applyJobUpdate(() => fieldWorkflowRepository.startWork(job.id, "Work started from the field workflow screen."));
    toast.success("Work started.");
  };

  const handleSaveProgress = async () => {
    if (!job) {
      return;
    }

    setBusyAction("progress");
    try {
      const payload = {
        items: job.checklist.map((item) => ({
          serviceChecklistMasterId: Number(item.id),
          isChecked: checklistState[item.id]?.isChecked ?? false,
          responseRemarks: checklistState[item.id]?.responseRemarks ?? "",
        })),
        remarks: "Checklist progress saved from field workflow.",
      };
      const nextJob = await fieldWorkflowRepository.saveProgress(job.id, payload);
      if (nextJob) {
        setJob(nextJob);
      }
      toast.success("Checklist progress saved.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save checklist progress.");
    } finally {
      setBusyAction(null);
    }
  };

  const handlePartsRequest = async () => {
    if (!job) {
      return;
    }

    const validItems = partsDraft.items.filter((item) => item.partCode.trim() && item.partName.trim());
    if (validItems.length === 0) {
      toast.error("Add at least one part item before submitting.");
      return;
    }

    setBusyAction("parts");
    try {
      const payload: FieldPartsRequestPayload = {
        urgency: partsDraft.urgency,
        notes: partsDraft.notes,
        items: validItems.map((item) => ({
          partCode: item.partCode.trim(),
          partName: item.partName.trim(),
          quantityRequested: Number(item.quantityRequested || "0"),
          remarks: item.remarks,
        })),
      };
      await fieldWorkflowRepository.createPartsRequest(job.id, payload);
      await loadJob();
      setPartsDraft({
        urgency: "Normal",
        notes: "",
        items: [createPartItem()],
      });
      toast.success("Parts request submitted.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to submit the parts request.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleEstimate = async () => {
    if (!job) {
      return;
    }

    const validLines = estimateDraft.lines.filter((line) => line.lineDescription.trim());
    if (validLines.length === 0) {
      toast.error("Add at least one estimate line before submitting.");
      return;
    }

    setBusyAction("estimate");
    try {
      const payload: FieldEstimatePayload = {
        discountAmount: Number(estimateDraft.discountAmount || "0"),
        taxPercentage: Number(estimateDraft.taxPercentage || "0"),
        remarks: estimateDraft.remarks,
        lines: validLines.map((line) => ({
          lineType: line.lineType,
          lineDescription: line.lineDescription.trim(),
          quantity: Number(line.quantity || "0"),
          unitPrice: Number(line.unitPrice || "0"),
        })),
      };
      await fieldWorkflowRepository.createEstimate(job.id, payload);
      await loadJob();
      toast.success("Estimate submitted.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to create the estimate.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleReport = async () => {
    if (!job) {
      return;
    }

    const issues = reportDraft.issuesIdentified
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (issues.length === 0) {
      toast.error("Enter at least one issue before submitting the report.");
      return;
    }

    setBusyAction("report");
    try {
      await fieldWorkflowRepository.submitReport(job.id, {
        equipmentCondition: reportDraft.equipmentCondition,
        issuesIdentified: issues,
        actionTaken: reportDraft.actionTaken,
        recommendation: reportDraft.recommendation,
        observations: reportDraft.observations,
      });
      await loadJob();
      toast.success("Job report submitted.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to submit the job report.");
    } finally {
      setBusyAction(null);
    }
  };

  const handlePhotoUpload = async (file?: File | null) => {
    if (!job || !file) {
      return;
    }

    setBusyAction("photo");
    try {
      const base64Content = await fileToDataUrl(file);
      await fieldWorkflowRepository.uploadPhoto(job.id, {
        photoType,
        fileName: file.name,
        contentType: file.type || "image/jpeg",
        base64Content,
        remarks: photoRemarks,
      });
      await loadJob();
      setPhotoRemarks("");
      toast.success("Field photo uploaded.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to upload the field photo.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveSignature = async () => {
    if (!job) {
      return;
    }

    const signatureBase64 = signaturePadRef.current?.toDataUrl();
    if (!signatureBase64) {
      toast.error("Capture a customer signature before saving.");
      return;
    }

    setBusyAction("signature");
    try {
      const signature = await fieldWorkflowRepository.saveSignature(job.id, {
        customerName: signatureCustomerName,
        signatureBase64,
        remarks: signatureRemarks,
      });
      if (signature) {
        setJob((current) => (current ? { ...current, signature: signature as FieldCustomerSignature } : current));
      }
      await loadJob();
      toast.success("Customer signature captured.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save the customer signature.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCollectPayment = async () => {
    if (!job) {
      return;
    }

    if (!paymentDraft.paidAmount || paymentDraft.paidAmount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }

    setBusyAction("payment");
    try {
      await fieldWorkflowRepository.collectPayment(job.id, paymentDraft);
      await loadJob();
      toast.success("Payment recorded.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to record payment.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleComplete = async () => {
    if (!job) {
      return;
    }

    setBusyAction("complete");
    try {
      const nextJob = await fieldWorkflowRepository.complete(
        job.id,
        reportDraft.actionTaken || "Completed from the field workflow screen.",
      );
      if (nextJob) {
        setJob(nextJob);
      }
      await loadJob();
      toast.success("Field completion submitted.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to complete the field job.");
    } finally {
      setBusyAction(null);
    }
  };

  if (isLoading) {
    return <InlineLoader className="h-screen" />;
  }

  if (!job) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center gap-3">
          <button className="rounded-xl p-2 transition hover:bg-brand-navy/5" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-brand-navy">Field workflow</h1>
            <p className="text-sm text-brand-muted">Job detail is not available.</p>
          </div>
        </div>
      </div>
    );
  }

  const completedPhotos = job.photos.length;
  const mandatoryChecklistDone = job.checklist
    .filter((item) => item.isMandatory)
    .every((item) => checklistState[item.id]?.isChecked);
  const issuesCount = reportDraft.issuesIdentified
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;
  const readyForCompletion = Boolean(
    mandatoryChecklistDone &&
      completedPhotos >= 2 &&
      reportDraft.actionTaken.trim() &&
      reportDraft.equipmentCondition.trim() &&
      job.signature,
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background px-4 py-4 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button className="rounded-xl p-2 transition hover:bg-brand-navy/5" onClick={() => navigate(-1)}>
              <ChevronLeft size={20} className="text-brand-navy" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-brand-navy">{job.serviceRequestNumber}</h1>
              <p className="text-sm text-brand-muted">
                {job.serviceName} • {job.currentStatus}
              </p>
            </div>
          </div>
          <Link className="text-sm font-medium text-brand-gold underline-offset-4 hover:underline" to="/system/sync">
            View offline queue
          </Link>
        </div>
      </div>

      <AdminCard className="overflow-hidden rounded-[34px] border-none bg-brand-navy p-6 text-white">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={job.status}>{job.currentStatus}</StatusPill>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">
                {job.slotLabel}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{job.customerName}</h2>
              <p className="text-sm text-white/70">{job.serviceName}</p>
            </div>
            <div className="space-y-2 text-sm text-white/75">
              <button
                className="flex items-start gap-2 text-left transition hover:text-brand-gold"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      job.customerLatitude != null && job.customerLongitude != null
                        ? `${job.customerLatitude},${job.customerLongitude}`
                        : job.addressSummary,
                    )}`,
                    "_blank",
                  )
                }
              >
                <MapPin size={15} className="mt-0.5" />
                <span>{job.addressSummary}</span>
              </button>
              <button
                className="flex items-center gap-2 transition hover:text-brand-gold"
                onClick={() => window.open(`tel:${job.mobileNumber}`, "_self")}
              >
                <Phone size={15} />
                <span>{job.mobileNumber}</span>
              </button>
            </div>
          </div>

          <div className="rounded-[28px] bg-white/8 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">Action rail</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <AdminButton
                fullWidth
                isLoading={busyAction === "depart"}
                disabled={job.status !== "assigned"}
                onClick={() => void handleDepart()}
              >
                <Navigation size={14} /> Depart
              </AdminButton>
              <AdminButton
                fullWidth
                variant="secondary"
                isLoading={busyAction === "arrive"}
                disabled={job.status !== "assigned" && job.status !== "en-route"}
                onClick={() => void handleArrive()}
              >
                <MapPin size={14} /> Arrive
              </AdminButton>
              <AdminButton
                fullWidth
                variant="secondary"
                isLoading={busyAction === "job"}
                disabled={job.status !== "arrived"}
                onClick={() => void handleStartWork()}
              >
                <Wrench size={14} /> Start Work
              </AdminButton>
              <AdminButton
                fullWidth
                variant="secondary"
                isLoading={busyAction === "complete"}
                disabled={!readyForCompletion}
                onClick={() => void handleComplete()}
              >
                <CheckCircle2 size={14} /> Complete
              </AdminButton>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <CompletionMetric label="Checklist" value={mandatoryChecklistDone ? "Ready" : "Pending"} />
              <CompletionMetric label="Photos" value={`${completedPhotos}/2+`} />
              <CompletionMetric label="Report" value={issuesCount > 0 && reportDraft.actionTaken ? "Ready" : "Draft"} />
            </div>
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          icon={<Wrench size={18} />}
          title="Equipment"
          lines={[job.acTypeName, `${job.brandName} • ${job.modelName}`, job.tonnageName]}
        />
        <InfoCard
          icon={<ClipboardList size={18} />}
          title="Issue notes"
          lines={[job.issueNotes || "No issue notes captured.", job.assignmentRemarks || "No assignment remarks."]}
        />
      </div>

      <AdminCard className="rounded-[32px] border p-6">
        <SectionHeading
          title="Work progress checklist"
          description="Save service-type checklist responses through `/progress` before the report and completion steps."
        />
        <div className="mt-5 space-y-4">
          {job.checklist.map((item) => (
            <div key={item.id} className="rounded-[24px] border border-border p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <label className="flex flex-1 items-start gap-3">
                  <input
                    checked={checklistState[item.id]?.isChecked ?? false}
                    className="mt-1 size-4 rounded border-border"
                    type="checkbox"
                    onChange={(event) =>
                      setChecklistState((current) => ({
                        ...current,
                        [item.id]: {
                          isChecked: event.target.checked,
                          responseRemarks: current[item.id]?.responseRemarks ?? "",
                        },
                      }))
                    }
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-brand-navy">{item.title}</h3>
                      {item.isMandatory && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-status-emergency">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-brand-muted">{item.description}</p>
                  </div>
                </label>
                <textarea
                  className="min-h-[92px] w-full rounded-2xl border border-border p-3 text-sm outline-none transition md:max-w-sm focus:border-brand-gold/40"
                  placeholder="Checklist response remarks"
                  value={checklistState[item.id]?.responseRemarks ?? ""}
                  onChange={(event) =>
                    setChecklistState((current) => ({
                      ...current,
                      [item.id]: {
                        isChecked: current[item.id]?.isChecked ?? false,
                        responseRemarks: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <AdminButton isLoading={busyAction === "progress"} onClick={() => void handleSaveProgress()}>
            Save Progress
          </AdminButton>
        </div>
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard className="rounded-[32px] border p-6">
          <SectionHeading
            title="Parts request"
            description="Raise a job-linked parts request without leaving the workflow."
          />
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                value={partsDraft.urgency}
                onChange={(event) =>
                  setPartsDraft((current) => ({
                    ...current,
                    urgency: event.target.value as PartsRequestDraft["urgency"],
                  }))
                }
              >
                <option value="Normal">Normal</option>
                <option value="Emergency">Emergency</option>
              </select>
              <input
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                placeholder="Request note"
                value={partsDraft.notes}
                onChange={(event) => setPartsDraft((current) => ({ ...current, notes: event.target.value }))}
              />
            </div>
            {partsDraft.items.map((item, index) => (
              <div key={item.id} className="rounded-[24px] border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-brand-navy">Part Item {index + 1}</p>
                  {partsDraft.items.length > 1 && (
                    <button
                      className="rounded-lg p-2 text-brand-muted transition hover:bg-brand-navy/5 hover:text-brand-navy"
                      onClick={() =>
                        setPartsDraft((current) => ({
                          ...current,
                          items: current.items.filter((entry) => entry.id !== item.id),
                        }))
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                      placeholder="Part code"
                      value={item.partCode}
                      onChange={(event) =>
                        setPartsDraft((current) => ({
                          ...current,
                          items: current.items.map((entry) =>
                            entry.id === item.id ? { ...entry, partCode: event.target.value } : entry,
                          ),
                        }))
                      }
                    />
                    <input
                      className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                      placeholder="Quantity"
                      type="number"
                      value={item.quantityRequested}
                      onChange={(event) =>
                        setPartsDraft((current) => ({
                          ...current,
                          items: current.items.map((entry) =>
                            entry.id === item.id ? { ...entry, quantityRequested: event.target.value } : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                  <input
                    className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                    placeholder="Part name"
                    value={item.partName}
                    onChange={(event) =>
                      setPartsDraft((current) => ({
                        ...current,
                        items: current.items.map((entry) =>
                          entry.id === item.id ? { ...entry, partName: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                  <textarea
                    className="min-h-[90px] rounded-2xl border border-border p-4 text-sm outline-none transition focus:border-brand-gold/40"
                    placeholder="Item remarks"
                    value={item.remarks}
                    onChange={(event) =>
                      setPartsDraft((current) => ({
                        ...current,
                        items: current.items.map((entry) =>
                          entry.id === item.id ? { ...entry, remarks: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <AdminButton
                variant="secondary"
                onClick={() =>
                  setPartsDraft((current) => ({
                    ...current,
                    items: [...current.items, createPartItem()],
                  }))
                }
              >
                <Plus size={14} /> Add Part
              </AdminButton>
              <AdminButton isLoading={busyAction === "parts"} onClick={() => void handlePartsRequest()}>
                Submit Parts Request
              </AdminButton>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="rounded-[32px] border p-6">
          <SectionHeading
            title="Estimate creation"
            description="Send labour, service, and parts lines to the field estimate endpoint."
          />
          <div className="mt-5 space-y-4">
            {estimateDraft.lines.map((line, index) => (
              <div key={line.id} className="rounded-[24px] border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-brand-navy">Estimate Line {index + 1}</p>
                  {estimateDraft.lines.length > 1 && (
                    <button
                      className="rounded-lg p-2 text-brand-muted transition hover:bg-brand-navy/5 hover:text-brand-navy"
                      onClick={() =>
                        setEstimateDraft((current) => ({
                          ...current,
                          lines: current.lines.filter((entry) => entry.id !== line.id),
                        }))
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <select
                      className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                      value={line.lineType}
                      onChange={(event) =>
                        setEstimateDraft((current) => ({
                          ...current,
                          lines: current.lines.map((entry) =>
                            entry.id === line.id
                              ? { ...entry, lineType: event.target.value as EstimateDraft["lines"][number]["lineType"] }
                              : entry,
                          ),
                        }))
                      }
                    >
                      <option value="Service">Service</option>
                      <option value="Labour">Labour</option>
                      <option value="Part">Part</option>
                      <option value="VisitFee">Visit Fee</option>
                    </select>
                    <input
                      className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                      placeholder="Quantity"
                      type="number"
                      value={line.quantity}
                      onChange={(event) =>
                        setEstimateDraft((current) => ({
                          ...current,
                          lines: current.lines.map((entry) =>
                            entry.id === line.id ? { ...entry, quantity: event.target.value } : entry,
                          ),
                        }))
                      }
                    />
                    <input
                      className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                      placeholder="Unit price"
                      type="number"
                      value={line.unitPrice}
                      onChange={(event) =>
                        setEstimateDraft((current) => ({
                          ...current,
                          lines: current.lines.map((entry) =>
                            entry.id === line.id ? { ...entry, unitPrice: event.target.value } : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                  <input
                    className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                    placeholder="Line description"
                    value={line.lineDescription}
                    onChange={(event) =>
                      setEstimateDraft((current) => ({
                        ...current,
                        lines: current.lines.map((entry) =>
                          entry.id === line.id ? { ...entry, lineDescription: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                placeholder="Discount amount"
                type="number"
                value={estimateDraft.discountAmount}
                onChange={(event) =>
                  setEstimateDraft((current) => ({ ...current, discountAmount: event.target.value }))
                }
              />
              <input
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                placeholder="Tax percentage"
                type="number"
                value={estimateDraft.taxPercentage}
                onChange={(event) =>
                  setEstimateDraft((current) => ({ ...current, taxPercentage: event.target.value }))
                }
              />
              <input
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                placeholder="Estimate remarks"
                value={estimateDraft.remarks}
                onChange={(event) =>
                  setEstimateDraft((current) => ({ ...current, remarks: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <AdminButton
                variant="secondary"
                onClick={() =>
                  setEstimateDraft((current) => ({
                    ...current,
                    lines: [...current.lines, createEstimateLine()],
                  }))
                }
              >
                <Plus size={14} /> Add Estimate Line
              </AdminButton>
              <AdminButton isLoading={busyAction === "estimate"} onClick={() => void handleEstimate()}>
                Submit Estimate
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminCard className="rounded-[32px] border p-6">
          <SectionHeading
            title="Job report"
            description="The field report requires equipment condition, issues, action taken, and at least two photos."
          />
          <div className="mt-5 grid gap-4">
            <input
              className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
              placeholder="Equipment condition"
              value={reportDraft.equipmentCondition}
              onChange={(event) =>
                setReportDraft((current) => ({ ...current, equipmentCondition: event.target.value }))
              }
            />
            <textarea
              className="min-h-[100px] rounded-2xl border border-border p-4 text-sm outline-none transition focus:border-brand-gold/40"
              placeholder="Issues identified, separated by commas"
              value={reportDraft.issuesIdentified}
              onChange={(event) =>
                setReportDraft((current) => ({ ...current, issuesIdentified: event.target.value }))
              }
            />
            <textarea
              className="min-h-[110px] rounded-2xl border border-border p-4 text-sm outline-none transition focus:border-brand-gold/40"
              placeholder="Action taken"
              value={reportDraft.actionTaken}
              onChange={(event) =>
                setReportDraft((current) => ({ ...current, actionTaken: event.target.value }))
              }
            />
            <textarea
              className="min-h-[90px] rounded-2xl border border-border p-4 text-sm outline-none transition focus:border-brand-gold/40"
              placeholder="Recommendation"
              value={reportDraft.recommendation}
              onChange={(event) =>
                setReportDraft((current) => ({ ...current, recommendation: event.target.value }))
              }
            />
            <textarea
              className="min-h-[90px] rounded-2xl border border-border p-4 text-sm outline-none transition focus:border-brand-gold/40"
              placeholder="Observations"
              value={reportDraft.observations}
              onChange={(event) =>
                setReportDraft((current) => ({ ...current, observations: event.target.value }))
              }
            />
            <div className="flex items-center justify-between rounded-[24px] bg-brand-navy/[0.03] p-4 text-sm">
              <span className="text-brand-muted">Captured photos</span>
              <span className={cn("font-semibold", completedPhotos < 2 && "text-status-emergency")}>
                {completedPhotos} / minimum 2
              </span>
            </div>
            <div className="flex justify-end">
              <AdminButton isLoading={busyAction === "report"} onClick={() => void handleReport()}>
                Submit Job Report
              </AdminButton>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="rounded-[32px] border p-6">
          <SectionHeading
            title="Photo capture"
            description="Upload Before, During, After, and IssueEvidence images. Offline submissions stay visible in the sync queue."
          />
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-[0.45fr_0.55fr]">
              <select
                className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                value={photoType}
                onChange={(event) =>
                  setPhotoType(event.target.value as "Before" | "During" | "After" | "IssueEvidence")
                }
              >
                <option value="Before">Before</option>
                <option value="During">During</option>
                <option value="After">After</option>
                <option value="IssueEvidence">IssueEvidence</option>
              </select>
              <input
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                placeholder="Photo remarks"
                value={photoRemarks}
                onChange={(event) => setPhotoRemarks(event.target.value)}
              />
            </div>
            <label className="flex cursor-pointer items-center justify-center rounded-[24px] border border-dashed border-border bg-brand-navy/[0.02] px-4 py-6 text-sm font-medium text-brand-navy transition hover:border-brand-gold/40">
              <ImagePlus size={16} className="mr-2 text-brand-gold" />
              Select Photo
              <input hidden accept="image/*" type="file" onChange={(event) => void handlePhotoUpload(event.target.files?.[0] ?? null)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {job.photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-[24px] border border-border">
                  <img alt={photo.fileName} className="h-48 w-full object-cover" src={photo.storageUrl} />
                  <div className="space-y-1 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-brand-navy">{photo.photoType}</p>
                      <Camera size={14} className="text-brand-gold" />
                    </div>
                    <p className="text-sm text-brand-muted">{photo.fileName}</p>
                    {photo.photoRemarks && <p className="text-sm text-brand-navy/75">{photo.photoRemarks}</p>}
                  </div>
                </div>
              ))}
              {job.photos.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-brand-muted">
                  No field photos uploaded yet.
                </div>
              )}
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard className="rounded-[32px] border p-6">
          <SectionHeading
            title="Customer signature"
            description="Capture the customer signature on canvas and save it against the field job."
          />
          <div className="mt-5 space-y-4">
            <input
              className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
              placeholder="Customer name"
              value={signatureCustomerName}
              onChange={(event) => setSignatureCustomerName(event.target.value)}
            />
            <SignaturePad ref={signaturePadRef} />
            <textarea
              className="min-h-[90px] rounded-2xl border border-border p-4 text-sm outline-none transition focus:border-brand-gold/40"
              placeholder="Signature remarks"
              value={signatureRemarks}
              onChange={(event) => setSignatureRemarks(event.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <AdminButton variant="secondary" onClick={() => signaturePadRef.current?.clear()}>
                Clear Canvas
              </AdminButton>
              <AdminButton isLoading={busyAction === "signature"} onClick={() => void handleSaveSignature()}>
                Save Signature
              </AdminButton>
            </div>
            {job.signature && (
              <div className="rounded-[24px] border border-border p-4">
                <p className="text-sm font-bold text-brand-navy">{job.signature.customerName}</p>
                <p className="mb-3 text-sm text-brand-muted">
                  Signed {new Date(job.signature.signedAtUtc).toLocaleString()}
                </p>
                <img
                  alt={job.signature.customerName}
                  className="h-28 rounded-2xl border border-border bg-white p-2"
                  src={job.signature.signatureDataUrl}
                />
              </div>
            )}
          </div>
        </AdminCard>

        <AdminCard className="rounded-[32px] border p-6">
          <SectionHeading
            title="Payment collection"
            description="Record COD, UPI, or card collections directly against the field invoice."
          />
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                placeholder="Paid amount"
                type="number"
                value={paymentDraft.paidAmount || ""}
                onChange={(event) =>
                  setPaymentDraft((current) => ({
                    ...current,
                    paidAmount: Number(event.target.value || "0"),
                  }))
                }
              />
              <select
                className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
                value={paymentDraft.paymentMethod}
                onChange={(event) =>
                  setPaymentDraft((current) => ({
                    ...current,
                    paymentMethod: event.target.value as FieldPaymentPayload["paymentMethod"],
                  }))
                }
              >
                <option value="Cash">Cash</option>
                <option value="Upi">Upi</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <input
              className="rounded-2xl border border-border px-4 py-3 text-sm outline-none transition focus:border-brand-gold/40"
              placeholder="Reference number"
              value={paymentDraft.referenceNumber || ""}
              onChange={(event) =>
                setPaymentDraft((current) => ({
                  ...current,
                  referenceNumber: event.target.value,
                }))
              }
            />
            <textarea
              className="min-h-[100px] rounded-2xl border border-border p-4 text-sm outline-none transition focus:border-brand-gold/40"
              placeholder="Payment remarks"
              value={paymentDraft.remarks || ""}
              onChange={(event) =>
                setPaymentDraft((current) => ({
                  ...current,
                  remarks: event.target.value,
                }))
              }
            />
            <div className="flex items-center justify-between rounded-[24px] bg-brand-navy/[0.03] p-4 text-sm">
              <span className="text-brand-muted">Invoice balance</span>
              <span className="font-semibold text-brand-navy">
                {job.invoice ? job.invoice.balanceAmount.toFixed(2) : "No invoice yet"}
              </span>
            </div>
            <div className="flex justify-end">
              <AdminButton isLoading={busyAction === "payment"} onClick={() => void handleCollectPayment()}>
                <CreditCard size={14} /> Record Payment
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminCard className="rounded-[32px] border p-6">
          <SectionHeading
            title="Billing snapshot"
            description="Estimate, invoice, and payment state stay visible during field execution."
          />
          <div className="mt-5 space-y-4">
            <InfoRow label="Estimate" value={job.quotation ? `${job.quotation.quotationNumber} • ${job.quotation.currentStatus}` : "Not created"} />
            <InfoRow label="Invoice" value={job.invoice ? `${job.invoice.invoiceNumber} • ${job.invoice.currentStatus}` : "Not generated"} />
            <InfoRow
              label="Balance"
              value={job.invoice ? `${job.invoice.balanceAmount.toFixed(2)}` : "--"}
            />
            <div className="rounded-[24px] border border-border p-4">
              <p className="text-sm font-bold text-brand-navy">Payments</p>
              <div className="mt-3 space-y-3">
                {job.payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl bg-brand-navy/[0.03] p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-brand-navy">{payment.paymentMethod}</span>
                      <span className="text-brand-muted">{payment.paidAmount.toFixed(2)}</span>
                    </div>
                    <p className="mt-1 text-brand-muted">
                      {payment.referenceNumber || "No reference"} • {new Date(payment.paymentDateUtc).toLocaleString()}
                    </p>
                  </div>
                ))}
                {job.payments.length === 0 && <p className="text-sm text-brand-muted">No field payments recorded yet.</p>}
              </div>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="rounded-[32px] border p-6">
          <SectionHeading
            title="Execution timeline"
            description="Live event stream from the technician job detail and Phase 10 workflow updates."
          />
          <div className="mt-5 space-y-4">
            {job.timeline.map((item) => (
              <div key={`${item.eventType}-${item.eventDateUtc}`} className="flex gap-4">
                <div className="mt-1 size-3 rounded-full bg-brand-gold" />
                <div className="flex-1 rounded-[24px] border border-border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-brand-navy">{item.eventTitle}</p>
                      <p className="text-sm text-brand-muted">{item.status}</p>
                    </div>
                    <span className="text-sm text-brand-muted">{new Date(item.eventDateUtc).toLocaleString()}</span>
                  </div>
                  {item.remarks && <p className="mt-3 text-sm text-brand-navy/75">{item.remarks}</p>}
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {arrivalOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/55 p-4">
          <AdminCard className="w-full max-w-xl rounded-[32px] border p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-status-emergency/10 text-status-emergency">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-brand-navy">Arrival override required</h3>
                <p className="text-sm text-brand-muted">{arrivalOverride.message}</p>
                <p className="text-sm text-brand-muted">
                  Reported distance: {Math.round(arrivalOverride.distanceMeters)}m
                </p>
                <textarea
                  className="min-h-[110px] w-full rounded-2xl border border-border p-4 text-sm outline-none transition focus:border-brand-gold/40"
                  placeholder="Explain why arrival must be overridden."
                  value={arrivalOverride.reason}
                  onChange={(event) =>
                    setArrivalOverride((current) =>
                      current
                        ? {
                            ...current,
                            reason: event.target.value,
                          }
                        : current,
                    )
                  }
                />
                <div className="flex flex-wrap justify-end gap-3">
                  <AdminButton variant="secondary" onClick={() => setArrivalOverride(null)}>
                    Cancel
                  </AdminButton>
                  <AdminButton
                    disabled={!arrivalOverride.reason.trim()}
                    onClick={() => void handleArrive(arrivalOverride.reason.trim())}
                  >
                    Submit Override
                  </AdminButton>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      )}
    </div>
  );
}

function SectionHeading(props: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-brand-navy">{props.title}</h2>
      <p className="text-sm text-brand-muted">{props.description}</p>
    </div>
  );
}

function CompletionMetric(props: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white/8 p-4 text-center">
      <p className="text-lg font-bold">{props.value}</p>
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">{props.label}</p>
    </div>
  );
}

function InfoCard(props: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <AdminCard className="rounded-[28px] border p-5">
      <div className="mb-4 flex size-10 items-center justify-center rounded-2xl bg-brand-navy text-brand-gold">
        {props.icon}
      </div>
      <h3 className="text-base font-bold text-brand-navy">{props.title}</h3>
      <div className="mt-3 space-y-2 text-sm text-brand-muted">
        {props.lines.filter(Boolean).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </AdminCard>
  );
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[24px] bg-brand-navy/[0.03] px-4 py-3 text-sm">
      <span className="text-brand-muted">{props.label}</span>
      <span className="font-semibold text-brand-navy">{props.value}</span>
    </div>
  );
}

function StatusPill(props: { status: FieldJobDetail["status"]; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
        props.status === "completed" && "bg-status-completed/15 text-white",
        props.status === "in-progress" && "bg-status-pending/15 text-white",
        props.status === "arrived" && "bg-brand-gold text-brand-navy",
        props.status === "en-route" && "bg-white/15 text-white",
        props.status === "assigned" && "bg-white/15 text-white",
      )}
    >
      {props.children}
    </span>
  );
}

type SignaturePadHandle = {
  toDataUrl: () => string;
  clear: () => void;
};

const SignaturePad = React.forwardRef<SignaturePadHandle>(function SignaturePad(_, ref) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawingRef = React.useRef(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#1A2746";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const begin = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }

    const point = getPoint(event);
    isDrawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = canvasRef.current?.getContext("2d");
    if (!context || !isDrawingRef.current) {
      return;
    }

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const end = () => {
    isDrawingRef.current = false;
  };

  React.useImperativeHandle(ref, () => ({
    toDataUrl: () => canvasRef.current?.toDataURL("image/png") || "",
    clear: () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#1A2746";
      context.lineWidth = 2.5;
      context.lineCap = "round";
      context.lineJoin = "round";
    },
  }));

  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-white">
      <canvas
        ref={canvasRef}
        className="h-56 w-full touch-none"
        height={280}
        width={900}
        onPointerDown={begin}
        onPointerLeave={end}
        onPointerMove={draw}
        onPointerUp={end}
      />
    </div>
  );
});
