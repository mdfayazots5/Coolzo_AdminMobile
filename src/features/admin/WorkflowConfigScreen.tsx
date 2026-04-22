/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { StatusBadge } from "@/components/shared/Badges"
import { useMasterData } from "@/core/master-data/MasterDataProvider"
import { asOptionalNumber, getMetadataBoolean, getMetadataNumber, getMetadataString, getMetadataStringList, toSlugCode } from "./configuration-utils"
import { AlertTriangle, GitBranchPlus, Save, ShieldCheck, Siren, Wrench, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface MasterRuleFormState {
  id?: string
  code: string
  label: string
  description: string
  sortOrder: string
  isActive: boolean
  isPublished: boolean
}

interface JobStatusFormState extends MasterRuleFormState {
  colorHex: string
  nextStatuses: string
  isTerminal: boolean
}

interface UrgencyFormState extends MasterRuleFormState {
  surchargePercent: string
  escalationPolicyKey: string
}

interface SkillFormState extends MasterRuleFormState {
  certificationRequired: boolean
}

interface SlaTargetFormState {
  id?: string
  key: string
  label: string
  assignmentHours: string
  arrivalHours: string
  completionHours: string
  isActive: boolean
}

interface EscalationRuleFormState {
  id?: string
  key: string
  ruleName: string
  triggerEvent: string
  thresholdMinutes: string
  recipientRoles: string
  notificationTemplateId: string
  isActive: boolean
}

const createMasterForm = (sortOrder = 1): MasterRuleFormState => ({
  code: "",
  label: "",
  description: "",
  sortOrder: String(sortOrder),
  isActive: true,
  isPublished: true,
})

const createJobStatusForm = (sortOrder = 1): JobStatusFormState => ({
  ...createMasterForm(sortOrder),
  colorHex: "#0F172A",
  nextStatuses: "",
  isTerminal: false,
})

const createUrgencyForm = (sortOrder = 1): UrgencyFormState => ({
  ...createMasterForm(sortOrder),
  surchargePercent: "",
  escalationPolicyKey: "",
})

const createSkillForm = (sortOrder = 1): SkillFormState => ({
  ...createMasterForm(sortOrder),
  certificationRequired: false,
})

const createSlaForm = (): SlaTargetFormState => ({
  key: "standard",
  label: "Standard",
  assignmentHours: "2",
  arrivalHours: "6",
  completionHours: "24",
  isActive: true,
})

const createEscalationForm = (): EscalationRuleFormState => ({
  key: "standard-breach",
  ruleName: "Standard SLA Breach",
  triggerEvent: "sla-breach",
  thresholdMinutes: "60",
  recipientRoles: "OPS_MANAGER",
  notificationTemplateId: "",
  isActive: true,
})

export default function WorkflowConfigScreen() {
  const {
    masterData,
    configurations,
    loadMasterData,
    saveMasterData,
    removeMasterData,
    loadConfiguration,
    saveConfiguration,
  } = useMasterData()
  const [jobStatusForm, setJobStatusForm] = React.useState<JobStatusFormState>(createJobStatusForm())
  const [urgencyForm, setUrgencyForm] = React.useState<UrgencyFormState>(createUrgencyForm())
  const [skillForm, setSkillForm] = React.useState<SkillFormState>(createSkillForm())
  const [slaForm, setSlaForm] = React.useState<SlaTargetFormState>(createSlaForm())
  const [escalationForm, setEscalationForm] = React.useState<EscalationRuleFormState>(createEscalationForm())
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const jobStatuses = React.useMemo(
    () => [...(masterData["job-statuses"] || [])].sort((left, right) => left.sortOrder - right.sortOrder),
    [masterData]
  )
  const urgencyLevels = React.useMemo(
    () => [...(masterData["urgency-levels"] || [])].sort((left, right) => left.sortOrder - right.sortOrder),
    [masterData]
  )
  const skillTags = React.useMemo(
    () => [...(masterData["skill-tags"] || [])].sort((left, right) => left.sortOrder - right.sortOrder),
    [masterData]
  )
  const slaTargets = React.useMemo(
    () => [...(configurations["sla-targets"] || [])].sort((left, right) => left.key.localeCompare(right.key)),
    [configurations]
  )
  const escalationRules = React.useMemo(
    () =>
      [...(configurations["auto-escalation-rules"] || [])].sort((left, right) =>
        left.key.localeCompare(right.key)
      ),
    [configurations]
  )

  const resetJobStatusForm = React.useCallback((record?: (typeof jobStatuses)[number]) => {
    if (!record) {
      setJobStatusForm(createJobStatusForm(jobStatuses.length + 1))
      return
    }

    setJobStatusForm({
      id: record.id,
      code: record.code,
      label: record.label,
      description: record.description,
      sortOrder: String(record.sortOrder),
      isActive: record.isActive,
      isPublished: record.isPublished,
      colorHex: getMetadataString(record.metadata, "colorHex", "#0F172A"),
      nextStatuses: getMetadataStringList(record.metadata, "nextStatuses").join(", "),
      isTerminal: getMetadataBoolean(record.metadata, "isTerminal", false),
    })
  }, [jobStatuses])

  const resetUrgencyForm = React.useCallback((record?: (typeof urgencyLevels)[number]) => {
    if (!record) {
      setUrgencyForm(createUrgencyForm(urgencyLevels.length + 1))
      return
    }

    setUrgencyForm({
      id: record.id,
      code: record.code,
      label: record.label,
      description: record.description,
      sortOrder: String(record.sortOrder),
      isActive: record.isActive,
      isPublished: record.isPublished,
      surchargePercent: String(getMetadataNumber(record.metadata, "surchargePercent", 0) || ""),
      escalationPolicyKey: getMetadataString(record.metadata, "escalationPolicyKey"),
    })
  }, [urgencyLevels])

  const resetSkillForm = React.useCallback((record?: (typeof skillTags)[number]) => {
    if (!record) {
      setSkillForm(createSkillForm(skillTags.length + 1))
      return
    }

    setSkillForm({
      id: record.id,
      code: record.code,
      label: record.label,
      description: record.description,
      sortOrder: String(record.sortOrder),
      isActive: record.isActive,
      isPublished: record.isPublished,
      certificationRequired: getMetadataBoolean(record.metadata, "certificationRequired", false),
    })
  }, [skillTags])

  const resetSlaForm = React.useCallback((record?: (typeof slaTargets)[number]) => {
    if (!record) {
      setSlaForm(createSlaForm())
      return
    }

    setSlaForm({
      id: record.id,
      key: record.key,
      label: getMetadataString(record.metadata, "label", record.key),
      assignmentHours: String(getMetadataNumber(record.metadata, "assignmentHours", 0)),
      arrivalHours: String(getMetadataNumber(record.metadata, "arrivalHours", 0)),
      completionHours: String(getMetadataNumber(record.metadata, "completionHours", 0)),
      isActive: record.isActive,
    })
  }, [slaTargets])

  const resetEscalationForm = React.useCallback((record?: (typeof escalationRules)[number]) => {
    if (!record) {
      setEscalationForm(createEscalationForm())
      return
    }

    setEscalationForm({
      id: record.id,
      key: record.key,
      ruleName: getMetadataString(record.metadata, "ruleName", record.key),
      triggerEvent: getMetadataString(record.metadata, "triggerEvent"),
      thresholdMinutes: String(getMetadataNumber(record.metadata, "thresholdMinutes", 0)),
      recipientRoles: getMetadataStringList(record.metadata, "recipientRoles").join(", "),
      notificationTemplateId: getMetadataString(record.metadata, "notificationTemplateId"),
      isActive: record.isActive,
    })
  }, [escalationRules])

  React.useEffect(() => {
    const loadWorkflowData = async () => {
      try {
        const [loadedJobStatuses, loadedUrgencies, loadedSkills, loadedSlaTargets, loadedEscalationRules] = await Promise.all([
          loadMasterData("job-statuses"),
          loadMasterData("urgency-levels"),
          loadMasterData("skill-tags"),
          loadConfiguration("sla-targets"),
          loadConfiguration("auto-escalation-rules"),
        ])

        resetJobStatusForm(loadedJobStatuses[0])
        resetUrgencyForm(loadedUrgencies[0])
        resetSkillForm(loadedSkills[0])
        resetSlaForm(loadedSlaTargets[0])
        resetEscalationForm(loadedEscalationRules[0])
      } catch (error) {
        console.error(error)
        toast.error("Unable to load workflow configuration")
      } finally {
        setIsLoading(false)
      }
    }

    void loadWorkflowData()
  }, [loadConfiguration, loadMasterData, resetEscalationForm, resetJobStatusForm, resetSkillForm, resetSlaForm, resetUrgencyForm])

  const handleSaveJobStatus = async () => {
    if (!jobStatusForm.label.trim()) {
      toast.error("Status label is required")
      return
    }

    setIsSaving(true)
    try {
      await saveMasterData("job-statuses", {
        id: jobStatusForm.id,
        code: jobStatusForm.code.trim() || toSlugCode(jobStatusForm.label),
        label: jobStatusForm.label.trim(),
        description: jobStatusForm.description.trim(),
        isActive: jobStatusForm.isActive,
        isPublished: jobStatusForm.isPublished,
        sortOrder: asOptionalNumber(jobStatusForm.sortOrder),
        metadata: {
          colorHex: jobStatusForm.colorHex.trim(),
          nextStatuses: jobStatusForm.nextStatuses
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          isTerminal: jobStatusForm.isTerminal,
        },
      })
      toast.success("Job status saved")
      resetJobStatusForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save job status")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveUrgency = async () => {
    if (!urgencyForm.label.trim()) {
      toast.error("Urgency label is required")
      return
    }

    setIsSaving(true)
    try {
      await saveMasterData("urgency-levels", {
        id: urgencyForm.id,
        code: urgencyForm.code.trim() || toSlugCode(urgencyForm.label),
        label: urgencyForm.label.trim(),
        description: urgencyForm.description.trim(),
        isActive: urgencyForm.isActive,
        isPublished: urgencyForm.isPublished,
        sortOrder: asOptionalNumber(urgencyForm.sortOrder),
        metadata: {
          surchargePercent: asOptionalNumber(urgencyForm.surchargePercent),
          escalationPolicyKey: urgencyForm.escalationPolicyKey.trim(),
        },
      })
      toast.success("Urgency level saved")
      resetUrgencyForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save urgency level")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSkillTag = async () => {
    if (!skillForm.label.trim()) {
      toast.error("Skill tag label is required")
      return
    }

    setIsSaving(true)
    try {
      await saveMasterData("skill-tags", {
        id: skillForm.id,
        code: skillForm.code.trim() || toSlugCode(skillForm.label),
        label: skillForm.label.trim(),
        description: skillForm.description.trim(),
        isActive: skillForm.isActive,
        isPublished: skillForm.isPublished,
        sortOrder: asOptionalNumber(skillForm.sortOrder),
        metadata: {
          certificationRequired: skillForm.certificationRequired,
        },
      })
      toast.success("Skill tag saved")
      resetSkillForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save skill tag")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSlaTarget = async () => {
    if (!slaForm.key.trim()) {
      toast.error("SLA key is required")
      return
    }

    setIsSaving(true)
    try {
      await saveConfiguration("sla-targets", {
        id: slaForm.id,
        key: slaForm.key.trim(),
        valueType: "json",
        isActive: slaForm.isActive,
        metadata: {
          label: slaForm.label.trim(),
          assignmentHours: asOptionalNumber(slaForm.assignmentHours),
          arrivalHours: asOptionalNumber(slaForm.arrivalHours),
          completionHours: asOptionalNumber(slaForm.completionHours),
        },
      })
      toast.success("SLA target saved")
      resetSlaForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save SLA target")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEscalationRule = async () => {
    if (!escalationForm.key.trim()) {
      toast.error("Escalation rule key is required")
      return
    }

    setIsSaving(true)
    try {
      await saveConfiguration("auto-escalation-rules", {
        id: escalationForm.id,
        key: escalationForm.key.trim(),
        valueType: "json",
        isActive: escalationForm.isActive,
        metadata: {
          ruleName: escalationForm.ruleName.trim(),
          triggerEvent: escalationForm.triggerEvent.trim(),
          thresholdMinutes: asOptionalNumber(escalationForm.thresholdMinutes),
          recipientRoles: escalationForm.recipientRoles
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          notificationTemplateId: escalationForm.notificationTemplateId.trim(),
        },
      })
      toast.success("Escalation rule saved")
      resetEscalationForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save escalation rule")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMasterRecord = async (slug: "job-statuses" | "urgency-levels" | "skill-tags", id: string) => {
    setIsSaving(true)
    try {
      await removeMasterData(slug, id)
      if (slug === "job-statuses") {
        resetJobStatusForm()
      } else if (slug === "urgency-levels") {
        resetUrgencyForm()
      } else {
        resetSkillForm()
      }
      toast.success("Master record removed")
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete record")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <InlineLoader />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Workflow, SLA & Skills</h1>
        <p className="text-sm text-brand-muted">
          Configure dispatch statuses, urgency levels, technician skill tags, service-level targets, and escalation policies.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AdminCard className="p-6 space-y-5">
          <SectionHeader title="Job Status Workflow" icon={<GitBranchPlus size={18} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminTextField label="Code" value={jobStatusForm.code} onChange={(event) => setJobStatusForm((current) => ({ ...current, code: event.target.value }))} />
            <AdminTextField label="Label" value={jobStatusForm.label} onChange={(event) => setJobStatusForm((current) => ({ ...current, label: event.target.value }))} />
            <AdminTextField label="Description" value={jobStatusForm.description} onChange={(event) => setJobStatusForm((current) => ({ ...current, description: event.target.value }))} />
            <AdminTextField label="Sort Order" type="number" value={jobStatusForm.sortOrder} onChange={(event) => setJobStatusForm((current) => ({ ...current, sortOrder: event.target.value }))} />
            <AdminTextField label="Color Hex" value={jobStatusForm.colorHex} onChange={(event) => setJobStatusForm((current) => ({ ...current, colorHex: event.target.value }))} />
            <AdminTextField label="Allowed Next Statuses" value={jobStatusForm.nextStatuses} helperText="Comma separated status codes" onChange={(event) => setJobStatusForm((current) => ({ ...current, nextStatuses: event.target.value }))} />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={jobStatusForm.isActive} onChange={(event) => setJobStatusForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={jobStatusForm.isPublished} onChange={(event) => setJobStatusForm((current) => ({ ...current, isPublished: event.target.checked }))} />
              Published
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={jobStatusForm.isTerminal} onChange={(event) => setJobStatusForm((current) => ({ ...current, isTerminal: event.target.checked }))} />
              Terminal status
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminButton onClick={handleSaveJobStatus} isLoading={isSaving} iconLeft={<Save size={18} />}>
              {jobStatusForm.id ? "Update Status" : "Create Status"}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => resetJobStatusForm()}>
              Clear
            </AdminButton>
          </div>
          <div className="space-y-3">
            {jobStatuses.map((status) => (
              <div key={status.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{status.label}</p>
                    <p className="text-xs text-brand-muted">{status.code}</p>
                  </div>
                  <StatusBadge status={status.isActive ? "completed" : "cancelled"}>
                    {status.isActive ? "active" : "inactive"}
                  </StatusBadge>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-navy">
                  <span>Next: {getMetadataStringList(status.metadata, "nextStatuses").join(", ") || "None"}</span>
                  <span>Color: {getMetadataString(status.metadata, "colorHex", "#0F172A")}</span>
                  <span>{getMetadataBoolean(status.metadata, "isTerminal", false) ? "Terminal" : "Non-terminal"}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <AdminButton type="button" variant="secondary" size="sm" onClick={() => resetJobStatusForm(status)}>
                    Edit
                  </AdminButton>
                  <AdminButton type="button" variant="destructive" size="sm" onClick={() => void handleDeleteMasterRecord("job-statuses", status.id)} iconLeft={<Trash2 size={14} />}>
                    Delete
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="p-6 space-y-5">
          <SectionHeader title="Urgency Levels" icon={<Siren size={18} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminTextField label="Code" value={urgencyForm.code} onChange={(event) => setUrgencyForm((current) => ({ ...current, code: event.target.value }))} />
            <AdminTextField label="Label" value={urgencyForm.label} onChange={(event) => setUrgencyForm((current) => ({ ...current, label: event.target.value }))} />
            <AdminTextField label="Description" value={urgencyForm.description} onChange={(event) => setUrgencyForm((current) => ({ ...current, description: event.target.value }))} />
            <AdminTextField label="Sort Order" type="number" value={urgencyForm.sortOrder} onChange={(event) => setUrgencyForm((current) => ({ ...current, sortOrder: event.target.value }))} />
            <AdminTextField label="Surcharge Percent" type="number" value={urgencyForm.surchargePercent} onChange={(event) => setUrgencyForm((current) => ({ ...current, surchargePercent: event.target.value }))} />
            <AdminTextField label="Escalation Policy Key" value={urgencyForm.escalationPolicyKey} onChange={(event) => setUrgencyForm((current) => ({ ...current, escalationPolicyKey: event.target.value }))} />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={urgencyForm.isActive} onChange={(event) => setUrgencyForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={urgencyForm.isPublished} onChange={(event) => setUrgencyForm((current) => ({ ...current, isPublished: event.target.checked }))} />
              Published
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminButton onClick={handleSaveUrgency} isLoading={isSaving} iconLeft={<Save size={18} />}>
              {urgencyForm.id ? "Update Urgency" : "Create Urgency"}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => resetUrgencyForm()}>
              Clear
            </AdminButton>
          </div>
          <div className="space-y-3">
            {urgencyLevels.map((urgency) => (
              <div key={urgency.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{urgency.label}</p>
                    <p className="text-xs text-brand-muted">{urgency.code}</p>
                  </div>
                  <StatusBadge status={urgency.isActive ? "completed" : "cancelled"}>
                    {urgency.isActive ? "active" : "inactive"}
                  </StatusBadge>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-navy">
                  <span>Surcharge: {getMetadataNumber(urgency.metadata, "surchargePercent", 0)}%</span>
                  <span>Escalation: {getMetadataString(urgency.metadata, "escalationPolicyKey", "Not linked")}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <AdminButton type="button" variant="secondary" size="sm" onClick={() => resetUrgencyForm(urgency)}>
                    Edit
                  </AdminButton>
                  <AdminButton type="button" variant="destructive" size="sm" onClick={() => void handleDeleteMasterRecord("urgency-levels", urgency.id)} iconLeft={<Trash2 size={14} />}>
                    Delete
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="p-6 space-y-5">
          <SectionHeader title="Technician Skill Tags" icon={<Wrench size={18} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminTextField label="Code" value={skillForm.code} onChange={(event) => setSkillForm((current) => ({ ...current, code: event.target.value }))} />
            <AdminTextField label="Label" value={skillForm.label} onChange={(event) => setSkillForm((current) => ({ ...current, label: event.target.value }))} />
            <AdminTextField label="Description" value={skillForm.description} onChange={(event) => setSkillForm((current) => ({ ...current, description: event.target.value }))} />
            <AdminTextField label="Sort Order" type="number" value={skillForm.sortOrder} onChange={(event) => setSkillForm((current) => ({ ...current, sortOrder: event.target.value }))} />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={skillForm.isActive} onChange={(event) => setSkillForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={skillForm.isPublished} onChange={(event) => setSkillForm((current) => ({ ...current, isPublished: event.target.checked }))} />
              Published
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={skillForm.certificationRequired} onChange={(event) => setSkillForm((current) => ({ ...current, certificationRequired: event.target.checked }))} />
              Certification required
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminButton onClick={handleSaveSkillTag} isLoading={isSaving} iconLeft={<Save size={18} />}>
              {skillForm.id ? "Update Skill Tag" : "Create Skill Tag"}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => resetSkillForm()}>
              Clear
            </AdminButton>
          </div>
          <div className="space-y-3">
            {skillTags.map((skill) => (
              <div key={skill.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{skill.label}</p>
                    <p className="text-xs text-brand-muted">{skill.code}</p>
                  </div>
                  <StatusBadge status={skill.isActive ? "completed" : "cancelled"}>
                    {skill.isActive ? "active" : "inactive"}
                  </StatusBadge>
                </div>
                <div className="mt-3 text-xs text-brand-navy">
                  {getMetadataBoolean(skill.metadata, "certificationRequired", false)
                    ? "Certification required"
                    : "Certification optional"}
                </div>
                <div className="mt-3 flex gap-2">
                  <AdminButton type="button" variant="secondary" size="sm" onClick={() => resetSkillForm(skill)}>
                    Edit
                  </AdminButton>
                  <AdminButton type="button" variant="destructive" size="sm" onClick={() => void handleDeleteMasterRecord("skill-tags", skill.id)} iconLeft={<Trash2 size={14} />}>
                    Delete
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard className="p-6 space-y-5">
            <SectionHeader title="SLA Targets" icon={<ShieldCheck size={18} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminTextField label="SLA Key" value={slaForm.key} onChange={(event) => setSlaForm((current) => ({ ...current, key: event.target.value }))} />
              <AdminTextField label="Label" value={slaForm.label} onChange={(event) => setSlaForm((current) => ({ ...current, label: event.target.value }))} />
              <AdminTextField label="Assignment SLA (Hours)" type="number" value={slaForm.assignmentHours} onChange={(event) => setSlaForm((current) => ({ ...current, assignmentHours: event.target.value }))} />
              <AdminTextField label="Arrival SLA (Hours)" type="number" value={slaForm.arrivalHours} onChange={(event) => setSlaForm((current) => ({ ...current, arrivalHours: event.target.value }))} />
              <AdminTextField label="Completion SLA (Hours)" type="number" value={slaForm.completionHours} onChange={(event) => setSlaForm((current) => ({ ...current, completionHours: event.target.value }))} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={slaForm.isActive} onChange={(event) => setSlaForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Active target
            </label>
            <div className="flex flex-wrap gap-3">
              <AdminButton onClick={handleSaveSlaTarget} isLoading={isSaving} iconLeft={<Save size={18} />}>
                {slaForm.id ? "Update SLA Target" : "Create SLA Target"}
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={() => resetSlaForm()}>
                Clear
              </AdminButton>
            </div>
            <div className="space-y-3">
              {slaTargets.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => resetSlaForm(target)}
                  className="w-full rounded-2xl border border-border p-4 text-left transition-all hover:border-brand-gold"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        {getMetadataString(target.metadata, "label", target.key)}
                      </p>
                      <p className="text-xs text-brand-muted">{target.key}</p>
                    </div>
                    <StatusBadge status={target.isActive ? "completed" : "cancelled"}>
                      {target.isActive ? "active" : "inactive"}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-navy">
                    <span>Assign: {getMetadataNumber(target.metadata, "assignmentHours", 0)}h</span>
                    <span>Arrival: {getMetadataNumber(target.metadata, "arrivalHours", 0)}h</span>
                    <span>Completion: {getMetadataNumber(target.metadata, "completionHours", 0)}h</span>
                  </div>
                </button>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="p-6 space-y-5">
            <SectionHeader title="Auto-Escalation Rules" icon={<AlertTriangle size={18} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminTextField label="Rule Key" value={escalationForm.key} onChange={(event) => setEscalationForm((current) => ({ ...current, key: event.target.value }))} />
              <AdminTextField label="Rule Name" value={escalationForm.ruleName} onChange={(event) => setEscalationForm((current) => ({ ...current, ruleName: event.target.value }))} />
              <AdminTextField label="Trigger Event" value={escalationForm.triggerEvent} onChange={(event) => setEscalationForm((current) => ({ ...current, triggerEvent: event.target.value }))} />
              <AdminTextField label="Threshold Minutes" type="number" value={escalationForm.thresholdMinutes} onChange={(event) => setEscalationForm((current) => ({ ...current, thresholdMinutes: event.target.value }))} />
              <AdminTextField label="Recipient Roles" value={escalationForm.recipientRoles} helperText="Comma separated role codes" onChange={(event) => setEscalationForm((current) => ({ ...current, recipientRoles: event.target.value }))} />
              <AdminTextField label="Notification Template Id" value={escalationForm.notificationTemplateId} onChange={(event) => setEscalationForm((current) => ({ ...current, notificationTemplateId: event.target.value }))} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={escalationForm.isActive} onChange={(event) => setEscalationForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Active rule
            </label>
            <div className="flex flex-wrap gap-3">
              <AdminButton onClick={handleSaveEscalationRule} isLoading={isSaving} iconLeft={<Save size={18} />}>
                {escalationForm.id ? "Update Rule" : "Create Rule"}
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={() => resetEscalationForm()}>
                Clear
              </AdminButton>
            </div>
            <div className="space-y-3">
              {escalationRules.map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => resetEscalationForm(rule)}
                  className="w-full rounded-2xl border border-border p-4 text-left transition-all hover:border-brand-gold"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        {getMetadataString(rule.metadata, "ruleName", rule.key)}
                      </p>
                      <p className="text-xs text-brand-muted">{rule.key}</p>
                    </div>
                    <StatusBadge status={rule.isActive ? "completed" : "cancelled"}>
                      {rule.isActive ? "active" : "inactive"}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-navy">
                    <span>Trigger: {getMetadataString(rule.metadata, "triggerEvent", "N/A")}</span>
                    <span>Threshold: {getMetadataNumber(rule.metadata, "thresholdMinutes", 0)} mins</span>
                    <span>Recipients: {getMetadataStringList(rule.metadata, "recipientRoles").join(", ") || "None"}</span>
                  </div>
                </button>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
