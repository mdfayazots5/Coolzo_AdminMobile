/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { PricingMatrixWidget } from "@/components/shared/ConfigWidgets"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { StatusBadge } from "@/components/shared/Badges"
import { useMasterData } from "@/core/master-data/MasterDataProvider"
import { asOptionalNumber, formatCurrency, getMetadataNumber, getMetadataString, getMetadataStringList, toSlugCode } from "./configuration-utils"
import { CreditCard, History, Info, Save, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

interface PaymentTermsFormState {
  id?: string
  key: string
  label: string
  dueDays: string
  lateFeePercent: string
  reminderSchedule: string
  isActive: boolean
}

interface AmcPlanFormState {
  id?: string
  key: string
  planName: string
  visitsPerYear: string
  frequency: string
  price: string
  validityMonths: string
  featureMatrix: string
  isActive: boolean
}

interface WarrantyFormState {
  id?: string
  key: string
  serviceTypeCode: string
  durationMonths: string
  isActive: boolean
}

const DEFAULT_TONNAGE_COLUMNS = ["1.0 Ton", "1.5 Ton", "2.0 Ton"]

const createPaymentTermsForm = (): PaymentTermsFormState => ({
  key: "default",
  label: "Default Terms",
  dueDays: "7",
  lateFeePercent: "2",
  reminderSchedule: "T+1, T+3",
  isActive: true,
})

const createAmcPlanForm = (): AmcPlanFormState => ({
  key: "premium",
  planName: "Coolzo Premium",
  visitsPerYear: "4",
  frequency: "quarterly",
  price: "3499",
  validityMonths: "12",
  featureMatrix: "Priority support, Unlimited breakdown calls",
  isActive: true,
})

const createWarrantyForm = (): WarrantyFormState => ({
  key: "installation",
  serviceTypeCode: "",
  durationMonths: "12",
  isActive: true,
})

export default function PricingConfigScreen() {
  const {
    masterData,
    configurations,
    loadMasterData,
    loadConfiguration,
    saveConfiguration,
  } = useMasterData()
  const [selectedZoneCode, setSelectedZoneCode] = React.useState("")
  const [selectedEquipmentType, setSelectedEquipmentType] = React.useState("Split AC")
  const [pricingMatrix, setPricingMatrix] = React.useState<Record<string, Record<string, number>>>({})
  const [paymentTermsForm, setPaymentTermsForm] = React.useState<PaymentTermsFormState>(createPaymentTermsForm())
  const [amcPlanForm, setAmcPlanForm] = React.useState<AmcPlanFormState>(createAmcPlanForm())
  const [warrantyForm, setWarrantyForm] = React.useState<WarrantyFormState>(createWarrantyForm())
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const serviceTypes = React.useMemo(
    () => [...(masterData["service-types"] || [])].sort((left, right) => left.sortOrder - right.sortOrder),
    [masterData]
  )
  const zones = React.useMemo(
    () => [...(masterData["zones"] || [])].sort((left, right) => left.sortOrder - right.sortOrder),
    [masterData]
  )
  const pricingRecords = configurations["pricing-matrix"] || []
  const amcPlans = configurations["amc-plans"] || []
  const paymentTerms = configurations["payment-terms"] || []
  const warrantyPeriods = configurations["warranty-periods"] || []

  const rowDefinitions = React.useMemo(() => {
    if (serviceTypes.length > 0) {
      return serviceTypes.map((serviceType) => ({
        code: serviceType.code,
        label: serviceType.label,
      }))
    }

    return pricingRecords.map((record) => ({
      code: getMetadataString(record.metadata, "serviceTypeCode", record.key),
      label: getMetadataString(record.metadata, "serviceTypeLabel", record.key),
    }))
  }, [pricingRecords, serviceTypes])

  const tonnageColumns = React.useMemo(() => {
    const values = pricingRecords
      .map((record) => getMetadataString(record.metadata, "tonnage"))
      .filter(Boolean)
    return Array.from(new Set(values.length > 0 ? values : DEFAULT_TONNAGE_COLUMNS))
  }, [pricingRecords])

  const equipmentTypes = React.useMemo(() => {
    const values = pricingRecords
      .map((record) => getMetadataString(record.metadata, "equipmentType"))
      .filter(Boolean)
    return Array.from(new Set(values.length > 0 ? values : ["Split AC"]))
  }, [pricingRecords])

  const rebuildPricingMatrix = React.useCallback((
    zoneCode: string,
    equipmentType: string
  ) => {
    const nextMatrix: Record<string, Record<string, number>> = {}
    rowDefinitions.forEach((row) => {
      nextMatrix[row.label] = {}
      tonnageColumns.forEach((tonnage) => {
        const matchingRecord = pricingRecords.find((record) =>
          getMetadataString(record.metadata, "serviceTypeCode") === row.code &&
          getMetadataString(record.metadata, "zoneCode") === zoneCode &&
          getMetadataString(record.metadata, "equipmentType") === equipmentType &&
          getMetadataString(record.metadata, "tonnage") === tonnage
        )

        nextMatrix[row.label][tonnage] = matchingRecord
          ? getMetadataNumber(matchingRecord.metadata, "price", 0)
          : 0
      })
    })

    setPricingMatrix(nextMatrix)
  }, [pricingRecords, rowDefinitions, tonnageColumns])

  const resetPaymentTermsForm = React.useCallback((record?: (typeof paymentTerms)[number]) => {
    if (!record) {
      setPaymentTermsForm(createPaymentTermsForm())
      return
    }

    setPaymentTermsForm({
      id: record.id,
      key: record.key,
      label: getMetadataString(record.metadata, "label", record.key),
      dueDays: String(getMetadataNumber(record.metadata, "dueDays", 0)),
      lateFeePercent: String(getMetadataNumber(record.metadata, "lateFeePercent", 0)),
      reminderSchedule: getMetadataStringList(record.metadata, "reminderSchedule").join(", "),
      isActive: record.isActive,
    })
  }, [paymentTerms])

  const resetAmcPlanForm = React.useCallback((record?: (typeof amcPlans)[number]) => {
    if (!record) {
      setAmcPlanForm(createAmcPlanForm())
      return
    }

    setAmcPlanForm({
      id: record.id,
      key: record.key,
      planName: getMetadataString(record.metadata, "planName", record.key),
      visitsPerYear: String(getMetadataNumber(record.metadata, "visitsPerYear", 0)),
      frequency: getMetadataString(record.metadata, "frequency"),
      price: String(getMetadataNumber(record.metadata, "price", 0)),
      validityMonths: String(getMetadataNumber(record.metadata, "validityMonths", 0)),
      featureMatrix: getMetadataStringList(record.metadata, "featureMatrix").join(", "),
      isActive: record.isActive,
    })
  }, [amcPlans])

  const resetWarrantyForm = React.useCallback((record?: (typeof warrantyPeriods)[number]) => {
    if (!record) {
      setWarrantyForm((current) => ({
        ...createWarrantyForm(),
        serviceTypeCode: current.serviceTypeCode || serviceTypes[0]?.code || "",
      }))
      return
    }

    setWarrantyForm({
      id: record.id,
      key: record.key,
      serviceTypeCode: getMetadataString(record.metadata, "serviceTypeCode"),
      durationMonths: String(getMetadataNumber(record.metadata, "durationMonths", 0)),
      isActive: record.isActive,
    })
  }, [serviceTypes, warrantyPeriods])

  React.useEffect(() => {
    const loadPricingData = async () => {
      try {
        const [loadedZones, loadedPricingRecords, loadedAmcPlans, loadedPaymentTerms, loadedWarrantyPeriods] = await Promise.all([
          loadMasterData("zones"),
          loadConfiguration("pricing-matrix"),
          loadConfiguration("amc-plans"),
          loadConfiguration("payment-terms"),
          loadConfiguration("warranty-periods"),
        ])

        await loadMasterData("service-types")

        const defaultZoneCode = loadedZones[0]?.code || getMetadataString(loadedPricingRecords[0]?.metadata || {}, "zoneCode", "default-zone")
        const defaultEquipmentType = getMetadataString(loadedPricingRecords[0]?.metadata || {}, "equipmentType", "Split AC")

        setSelectedZoneCode(defaultZoneCode)
        setSelectedEquipmentType(defaultEquipmentType)
        resetPaymentTermsForm(loadedPaymentTerms[0])
        resetAmcPlanForm(loadedAmcPlans[0])
        resetWarrantyForm(loadedWarrantyPeriods[0])
      } catch (error) {
        console.error(error)
        toast.error("Unable to load pricing configuration")
      } finally {
        setIsLoading(false)
      }
    }

    void loadPricingData()
  }, [loadConfiguration, loadMasterData, resetAmcPlanForm, resetPaymentTermsForm, resetWarrantyForm])

  React.useEffect(() => {
    if (!isLoading && selectedZoneCode) {
      rebuildPricingMatrix(selectedZoneCode, selectedEquipmentType)
    }
  }, [isLoading, rebuildPricingMatrix, selectedEquipmentType, selectedZoneCode])

  React.useEffect(() => {
    if (!selectedZoneCode && zones[0]?.code) {
      setSelectedZoneCode(zones[0].code)
    }
  }, [selectedZoneCode, zones])

  React.useEffect(() => {
    if (!warrantyForm.serviceTypeCode && serviceTypes[0]?.code) {
      setWarrantyForm((current) => ({
        ...current,
        serviceTypeCode: serviceTypes[0]?.code || "",
      }))
    }
  }, [serviceTypes, warrantyForm.serviceTypeCode])

  const handleSavePricingMatrix = async () => {
    if (!selectedZoneCode) {
      toast.error("Select a zone first")
      return
    }

    setIsSaving(true)
    try {
      await Promise.all(
        rowDefinitions.flatMap((row) =>
          tonnageColumns.map(async (tonnage) => {
            const price = pricingMatrix[row.label]?.[tonnage] || 0
            const existingRecord = pricingRecords.find((record) =>
              getMetadataString(record.metadata, "serviceTypeCode") === row.code &&
              getMetadataString(record.metadata, "zoneCode") === selectedZoneCode &&
              getMetadataString(record.metadata, "equipmentType") === selectedEquipmentType &&
              getMetadataString(record.metadata, "tonnage") === tonnage
            )

            return saveConfiguration("pricing-matrix", {
              id: existingRecord?.id,
              key: existingRecord?.key || `${row.code}-${toSlugCode(selectedEquipmentType)}-${toSlugCode(tonnage)}-${selectedZoneCode}`,
              valueType: "json",
              isActive: true,
              metadata: {
                serviceTypeCode: row.code,
                serviceTypeLabel: row.label,
                equipmentType: selectedEquipmentType,
                tonnage,
                zoneCode: selectedZoneCode,
                price,
              },
            })
          })
        )
      )
      toast.success("Pricing matrix updated")
    } catch (error) {
      console.error(error)
      toast.error("Failed to save pricing matrix")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePaymentTerms = async () => {
    setIsSaving(true)
    try {
      await saveConfiguration("payment-terms", {
        id: paymentTermsForm.id,
        key: paymentTermsForm.key.trim(),
        valueType: "json",
        isActive: paymentTermsForm.isActive,
        metadata: {
          label: paymentTermsForm.label.trim(),
          dueDays: asOptionalNumber(paymentTermsForm.dueDays),
          lateFeePercent: asOptionalNumber(paymentTermsForm.lateFeePercent),
          reminderSchedule: paymentTermsForm.reminderSchedule
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      })
      toast.success("Payment terms saved")
      resetPaymentTermsForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save payment terms")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAmcPlan = async () => {
    setIsSaving(true)
    try {
      await saveConfiguration("amc-plans", {
        id: amcPlanForm.id,
        key: amcPlanForm.key.trim() || toSlugCode(amcPlanForm.planName),
        valueType: "json",
        isActive: amcPlanForm.isActive,
        metadata: {
          planName: amcPlanForm.planName.trim(),
          visitsPerYear: asOptionalNumber(amcPlanForm.visitsPerYear),
          frequency: amcPlanForm.frequency.trim(),
          price: asOptionalNumber(amcPlanForm.price),
          validityMonths: asOptionalNumber(amcPlanForm.validityMonths),
          featureMatrix: amcPlanForm.featureMatrix
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      })
      toast.success("AMC plan saved")
      resetAmcPlanForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save AMC plan")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveWarranty = async () => {
    if (!warrantyForm.serviceTypeCode) {
      toast.error("Select a service type")
      return
    }

    setIsSaving(true)
    try {
      await saveConfiguration("warranty-periods", {
        id: warrantyForm.id,
        key: warrantyForm.key.trim() || warrantyForm.serviceTypeCode,
        valueType: "json",
        isActive: warrantyForm.isActive,
        metadata: {
          serviceTypeCode: warrantyForm.serviceTypeCode,
          durationMonths: asOptionalNumber(warrantyForm.durationMonths),
        },
      })
      toast.success("Warranty period saved")
      resetWarrantyForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save warranty period")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <InlineLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Pricing, AMC & Warranty</h1>
          <p className="text-sm text-brand-muted">
            Manage zone-level pricing, AMC commercial plans, warranty durations, and default payment terms.
          </p>
        </div>
        <AdminButton onClick={handleSavePricingMatrix} isLoading={isSaving} iconLeft={<Save size={18} />}>
          Save Pricing Matrix
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Selected Zone</p>
          <select
            value={selectedZoneCode}
            onChange={(event) => setSelectedZoneCode(event.target.value)}
            className="mt-2 flex h-10 w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-navy focus-visible:border-brand-navy"
          >
            {zones.map((zone) => (
              <option key={zone.id} value={zone.code}>
                {zone.label}
              </option>
            ))}
          </select>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Equipment Type</p>
          <select
            value={selectedEquipmentType}
            onChange={(event) => setSelectedEquipmentType(event.target.value)}
            className="mt-2 flex h-10 w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-navy focus-visible:border-brand-navy"
          >
            {equipmentTypes.map((equipmentType) => (
              <option key={equipmentType} value={equipmentType}>
                {equipmentType}
              </option>
            ))}
          </select>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Rows</p>
          <p className="mt-2 text-lg font-bold text-brand-navy">{rowDefinitions.length}</p>
          <p className="text-xs text-brand-muted">service types</p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Columns</p>
          <p className="mt-2 text-lg font-bold text-brand-navy">{tonnageColumns.length}</p>
          <p className="text-xs text-brand-muted">tonnage tiers</p>
        </AdminCard>
      </div>

      <AdminCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border bg-brand-navy/[0.02] flex items-center justify-between">
          <SectionHeader title="Base Pricing Matrix (₹)" className="mb-0 border-t-0 pt-0" />
          <div className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            <Info size={14} />
            {selectedZoneCode || "No zone"} · {selectedEquipmentType}
          </div>
        </div>
        <div className="p-6">
          <PricingMatrixWidget
            rows={rowDefinitions.map((row) => row.label)}
            cols={tonnageColumns}
            data={pricingMatrix}
            onCellChange={(row, col, value) => {
              setPricingMatrix((current) => ({
                ...current,
                [row]: {
                  ...(current[row] || {}),
                  [col]: Number.isFinite(value) ? value : 0,
                },
              }))
            }}
          />
        </div>
      </AdminCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AdminCard className="p-6 space-y-5">
          <SectionHeader title="AMC Plan Definitions" icon={<ShieldCheck size={18} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminTextField label="Plan Key" value={amcPlanForm.key} onChange={(event) => setAmcPlanForm((current) => ({ ...current, key: event.target.value }))} />
            <AdminTextField label="Plan Name" value={amcPlanForm.planName} onChange={(event) => setAmcPlanForm((current) => ({ ...current, planName: event.target.value }))} />
            <AdminTextField label="Visits Per Year" type="number" value={amcPlanForm.visitsPerYear} onChange={(event) => setAmcPlanForm((current) => ({ ...current, visitsPerYear: event.target.value }))} />
            <AdminTextField label="Frequency" value={amcPlanForm.frequency} onChange={(event) => setAmcPlanForm((current) => ({ ...current, frequency: event.target.value }))} />
            <AdminTextField label="Plan Price" type="number" value={amcPlanForm.price} onChange={(event) => setAmcPlanForm((current) => ({ ...current, price: event.target.value }))} />
            <AdminTextField label="Validity Months" type="number" value={amcPlanForm.validityMonths} onChange={(event) => setAmcPlanForm((current) => ({ ...current, validityMonths: event.target.value }))} />
            <div className="md:col-span-2">
              <AdminTextField label="Feature Matrix" value={amcPlanForm.featureMatrix} helperText="Comma separated benefits" onChange={(event) => setAmcPlanForm((current) => ({ ...current, featureMatrix: event.target.value }))} />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
            <input type="checkbox" checked={amcPlanForm.isActive} onChange={(event) => setAmcPlanForm((current) => ({ ...current, isActive: event.target.checked }))} />
            Active plan
          </label>
          <div className="flex flex-wrap gap-3">
            <AdminButton onClick={handleSaveAmcPlan} isLoading={isSaving} iconLeft={<Save size={18} />}>
              {amcPlanForm.id ? "Update Plan" : "Create Plan"}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => resetAmcPlanForm()}>
              Clear
            </AdminButton>
          </div>
          <div className="space-y-3">
            {amcPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => resetAmcPlanForm(plan)}
                className="w-full rounded-2xl border border-border p-4 text-left transition-all hover:border-brand-gold"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-navy">
                      {getMetadataString(plan.metadata, "planName", plan.key)}
                    </p>
                    <p className="text-xs text-brand-muted">{plan.key}</p>
                  </div>
                  <StatusBadge status={plan.isActive ? "completed" : "cancelled"}>
                    {plan.isActive ? "active" : "inactive"}
                  </StatusBadge>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-navy">
                  <span>{getMetadataNumber(plan.metadata, "visitsPerYear", 0)} visits</span>
                  <span>{getMetadataString(plan.metadata, "frequency", "custom")}</span>
                  <span>{formatCurrency(getMetadataNumber(plan.metadata, "price", 0))}</span>
                </div>
              </button>
            ))}
          </div>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard className="p-6 space-y-5">
            <SectionHeader title="Payment Terms" icon={<CreditCard size={18} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminTextField label="Terms Key" value={paymentTermsForm.key} onChange={(event) => setPaymentTermsForm((current) => ({ ...current, key: event.target.value }))} />
              <AdminTextField label="Label" value={paymentTermsForm.label} onChange={(event) => setPaymentTermsForm((current) => ({ ...current, label: event.target.value }))} />
              <AdminTextField label="Due Days" type="number" value={paymentTermsForm.dueDays} onChange={(event) => setPaymentTermsForm((current) => ({ ...current, dueDays: event.target.value }))} />
              <AdminTextField label="Late Fee Percent" type="number" value={paymentTermsForm.lateFeePercent} onChange={(event) => setPaymentTermsForm((current) => ({ ...current, lateFeePercent: event.target.value }))} />
              <div className="md:col-span-2">
                <AdminTextField label="Reminder Schedule" value={paymentTermsForm.reminderSchedule} helperText="Comma separated reminders" onChange={(event) => setPaymentTermsForm((current) => ({ ...current, reminderSchedule: event.target.value }))} />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={paymentTermsForm.isActive} onChange={(event) => setPaymentTermsForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Active terms
            </label>
            <div className="flex flex-wrap gap-3">
              <AdminButton onClick={handleSavePaymentTerms} isLoading={isSaving} iconLeft={<Save size={18} />}>
                Save Payment Terms
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={() => resetPaymentTermsForm()}>
                Clear
              </AdminButton>
            </div>
            <div className="space-y-3">
              {paymentTerms.map((terms) => (
                <button
                  key={terms.id}
                  type="button"
                  onClick={() => resetPaymentTermsForm(terms)}
                  className="w-full rounded-2xl border border-border p-4 text-left transition-all hover:border-brand-gold"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        {getMetadataString(terms.metadata, "label", terms.key)}
                      </p>
                      <p className="text-xs text-brand-muted">{terms.key}</p>
                    </div>
                    <StatusBadge status={terms.isActive ? "completed" : "cancelled"}>
                      {terms.isActive ? "active" : "inactive"}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-navy">
                    <span>{getMetadataNumber(terms.metadata, "dueDays", 0)} due days</span>
                    <span>{getMetadataNumber(terms.metadata, "lateFeePercent", 0)}% late fee</span>
                    <span>{getMetadataStringList(terms.metadata, "reminderSchedule").join(", ") || "No reminders"}</span>
                  </div>
                </button>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="p-6 space-y-5">
            <SectionHeader title="Warranty Periods" icon={<History size={18} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminTextField label="Record Key" value={warrantyForm.key} onChange={(event) => setWarrantyForm((current) => ({ ...current, key: event.target.value }))} />
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Service Type</label>
                <select
                  value={warrantyForm.serviceTypeCode}
                  onChange={(event) => setWarrantyForm((current) => ({ ...current, serviceTypeCode: event.target.value }))}
                  className="flex h-10 w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-navy focus-visible:border-brand-navy"
                >
                  <option value="">Select service type</option>
                  {serviceTypes.map((serviceType) => (
                    <option key={serviceType.id} value={serviceType.code}>
                      {serviceType.label}
                    </option>
                  ))}
                </select>
              </div>
              <AdminTextField label="Duration Months" type="number" value={warrantyForm.durationMonths} onChange={(event) => setWarrantyForm((current) => ({ ...current, durationMonths: event.target.value }))} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={warrantyForm.isActive} onChange={(event) => setWarrantyForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Active warranty rule
            </label>
            <div className="flex flex-wrap gap-3">
              <AdminButton onClick={handleSaveWarranty} isLoading={isSaving} iconLeft={<Save size={18} />}>
                Save Warranty
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={() => resetWarrantyForm()}>
                Clear
              </AdminButton>
            </div>
            <div className="space-y-3">
              {warrantyPeriods.map((warranty) => (
                <button
                  key={warranty.id}
                  type="button"
                  onClick={() => resetWarrantyForm(warranty)}
                  className="w-full rounded-2xl border border-border p-4 text-left transition-all hover:border-brand-gold"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        {serviceTypes.find((serviceType) => serviceType.code === getMetadataString(warranty.metadata, "serviceTypeCode"))?.label ||
                          getMetadataString(warranty.metadata, "serviceTypeCode", warranty.key)}
                      </p>
                      <p className="text-xs text-brand-muted">{warranty.key}</p>
                    </div>
                    <StatusBadge status={warranty.isActive ? "completed" : "cancelled"}>
                      {warranty.isActive ? "active" : "inactive"}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-xs text-brand-navy">
                    {getMetadataNumber(warranty.metadata, "durationMonths", 0)} months coverage
                  </p>
                </button>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
