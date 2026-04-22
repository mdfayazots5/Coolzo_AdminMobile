/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { StatusBadge } from "@/components/shared/Badges"
import { useMasterData } from "@/core/master-data/MasterDataProvider"
import { asOptionalNumber, formatCurrency, getMetadataBoolean, getMetadataNumber, getMetadataString } from "./configuration-utils"
import { FileText, Receipt, Save } from "lucide-react"
import { toast } from "sonner"

interface TaxFormState {
  id?: string
  key: string
  category: string
  rate: string
  code: string
  codeLabel: string
  isInclusive: boolean
  isActive: boolean
}

interface InvoiceNumberingFormState {
  id?: string
  key: string
  prefix: string
  fiscalYearFormat: string
  nextNumber: string
  resetPolicy: string
  isActive: boolean
}

const createTaxForm = (): TaxFormState => ({
  key: "labor",
  category: "Labor",
  rate: "18",
  code: "9987",
  codeLabel: "SAC",
  isInclusive: false,
  isActive: true,
})

const createInvoiceForm = (): InvoiceNumberingFormState => ({
  key: "primary",
  prefix: "CZ",
  fiscalYearFormat: "YYYY",
  nextNumber: "10001",
  resetPolicy: "yearly",
  isActive: true,
})

export default function TaxConfigScreen() {
  const { configurations, loadConfiguration, saveConfiguration } = useMasterData()
  const [taxForm, setTaxForm] = React.useState<TaxFormState>(createTaxForm())
  const [invoiceForm, setInvoiceForm] = React.useState<InvoiceNumberingFormState>(createInvoiceForm())
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const taxRecords = configurations["tax"] || []
  const invoiceRecords = configurations["invoice-numbering"] || []

  const resetTaxForm = React.useCallback((record?: (typeof taxRecords)[number]) => {
    if (!record) {
      setTaxForm(createTaxForm())
      return
    }

    setTaxForm({
      id: record.id,
      key: record.key,
      category: getMetadataString(record.metadata, "category", record.key),
      rate: String(getMetadataNumber(record.metadata, "rate", 0)),
      code: getMetadataString(record.metadata, "code"),
      codeLabel: getMetadataString(record.metadata, "codeLabel", "HSN"),
      isInclusive: getMetadataBoolean(record.metadata, "isInclusive", false),
      isActive: record.isActive,
    })
  }, [taxRecords])

  const resetInvoiceForm = React.useCallback((record?: (typeof invoiceRecords)[number]) => {
    if (!record) {
      setInvoiceForm(createInvoiceForm())
      return
    }

    setInvoiceForm({
      id: record.id,
      key: record.key,
      prefix: getMetadataString(record.metadata, "prefix", "CZ"),
      fiscalYearFormat: getMetadataString(record.metadata, "fiscalYearFormat", "YYYY"),
      nextNumber: String(getMetadataNumber(record.metadata, "nextNumber", 10001)),
      resetPolicy: getMetadataString(record.metadata, "resetPolicy", "yearly"),
      isActive: record.isActive,
    })
  }, [invoiceRecords])

  React.useEffect(() => {
    const loadTaxConfiguration = async () => {
      try {
        const [loadedTaxRecords, loadedInvoiceRecords] = await Promise.all([
          loadConfiguration("tax"),
          loadConfiguration("invoice-numbering"),
        ])

        resetTaxForm(loadedTaxRecords[0])
        resetInvoiceForm(loadedInvoiceRecords[0])
      } catch (error) {
        console.error(error)
        toast.error("Unable to load tax configuration")
      } finally {
        setIsLoading(false)
      }
    }

    void loadTaxConfiguration()
  }, [loadConfiguration, resetInvoiceForm, resetTaxForm])

  const handleSaveTax = async () => {
    setIsSaving(true)
    try {
      await saveConfiguration("tax", {
        id: taxForm.id,
        key: taxForm.key.trim(),
        valueType: "json",
        isActive: taxForm.isActive,
        metadata: {
          category: taxForm.category.trim(),
          rate: asOptionalNumber(taxForm.rate),
          code: taxForm.code.trim(),
          codeLabel: taxForm.codeLabel.trim(),
          isInclusive: taxForm.isInclusive,
        },
      })
      toast.success("Tax rule saved")
      resetTaxForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save tax rule")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveInvoiceNumbering = async () => {
    setIsSaving(true)
    try {
      await saveConfiguration("invoice-numbering", {
        id: invoiceForm.id,
        key: invoiceForm.key.trim(),
        valueType: "json",
        isActive: invoiceForm.isActive,
        metadata: {
          prefix: invoiceForm.prefix.trim(),
          fiscalYearFormat: invoiceForm.fiscalYearFormat.trim(),
          nextNumber: asOptionalNumber(invoiceForm.nextNumber),
          resetPolicy: invoiceForm.resetPolicy.trim(),
        },
      })
      toast.success("Invoice numbering saved")
      resetInvoiceForm()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save invoice numbering")
    } finally {
      setIsSaving(false)
    }
  }

  const previewBasePrice = 1500
  const previewTaxRate = asOptionalNumber(taxForm.rate)
  const previewTaxValue = Math.round((previewBasePrice * previewTaxRate) / 100)
  const previewTotal = taxForm.isInclusive ? previewBasePrice : previewBasePrice + previewTaxValue
  const invoicePreview = `${invoiceForm.prefix}-${new Date().getUTCFullYear()}-04-${invoiceForm.nextNumber}`

  if (isLoading) {
    return <InlineLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Tax & Invoice Numbering</h1>
          <p className="text-sm text-brand-muted">
            Configure GST or VAT rules by category and control invoice sequencing behavior.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-6">
          <AdminCard className="p-6 space-y-5">
            <SectionHeader title="Tax Rules" icon={<FileText size={18} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminTextField label="Tax Key" value={taxForm.key} onChange={(event) => setTaxForm((current) => ({ ...current, key: event.target.value }))} />
              <AdminTextField label="Category" value={taxForm.category} onChange={(event) => setTaxForm((current) => ({ ...current, category: event.target.value }))} />
              <AdminTextField label="Tax Rate (%)" type="number" value={taxForm.rate} onChange={(event) => setTaxForm((current) => ({ ...current, rate: event.target.value }))} />
              <AdminTextField label={`${taxForm.codeLabel || "Code"} Value`} value={taxForm.code} onChange={(event) => setTaxForm((current) => ({ ...current, code: event.target.value }))} />
              <AdminTextField label="Code Label" value={taxForm.codeLabel} onChange={(event) => setTaxForm((current) => ({ ...current, codeLabel: event.target.value }))} />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
                <input type="checkbox" checked={taxForm.isInclusive} onChange={(event) => setTaxForm((current) => ({ ...current, isInclusive: event.target.checked }))} />
                Inclusive tax
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
                <input type="checkbox" checked={taxForm.isActive} onChange={(event) => setTaxForm((current) => ({ ...current, isActive: event.target.checked }))} />
                Active rule
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <AdminButton onClick={handleSaveTax} isLoading={isSaving} iconLeft={<Save size={18} />}>
                Save Tax Rule
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={() => resetTaxForm()}>
                Clear
              </AdminButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taxRecords.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => resetTaxForm(record)}
                  className="rounded-2xl border border-border p-4 text-left transition-all hover:border-brand-gold"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        {getMetadataString(record.metadata, "category", record.key)}
                      </p>
                      <p className="text-xs text-brand-muted">{record.key}</p>
                    </div>
                    <StatusBadge status={record.isActive ? "completed" : "cancelled"}>
                      {record.isActive ? "active" : "inactive"}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-navy">
                    <span>{getMetadataNumber(record.metadata, "rate", 0)}%</span>
                    <span>
                      {getMetadataString(record.metadata, "codeLabel", "Code")} {getMetadataString(record.metadata, "code", "N/A")}
                    </span>
                    <span>
                      {getMetadataBoolean(record.metadata, "isInclusive", false) ? "Inclusive" : "Exclusive"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="p-6 space-y-5">
            <SectionHeader title="Invoice Numbering" icon={<Receipt size={18} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminTextField label="Record Key" value={invoiceForm.key} onChange={(event) => setInvoiceForm((current) => ({ ...current, key: event.target.value }))} />
              <AdminTextField label="Prefix" value={invoiceForm.prefix} onChange={(event) => setInvoiceForm((current) => ({ ...current, prefix: event.target.value }))} />
              <AdminTextField label="Fiscal Year Format" value={invoiceForm.fiscalYearFormat} onChange={(event) => setInvoiceForm((current) => ({ ...current, fiscalYearFormat: event.target.value }))} />
              <AdminTextField label="Next Number" type="number" value={invoiceForm.nextNumber} onChange={(event) => setInvoiceForm((current) => ({ ...current, nextNumber: event.target.value }))} />
              <AdminTextField label="Reset Policy" value={invoiceForm.resetPolicy} onChange={(event) => setInvoiceForm((current) => ({ ...current, resetPolicy: event.target.value }))} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-brand-navy">
              <input type="checkbox" checked={invoiceForm.isActive} onChange={(event) => setInvoiceForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Active numbering scheme
            </label>
            <div className="rounded-2xl border border-dashed border-brand-navy/20 bg-brand-navy/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Preview</p>
              <p className="text-xl font-mono font-bold text-brand-navy">{invoicePreview}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <AdminButton onClick={handleSaveInvoiceNumbering} isLoading={isSaving} iconLeft={<Save size={18} />}>
                Save Invoice Numbering
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={() => resetInvoiceForm()}>
                Clear
              </AdminButton>
            </div>
            <div className="space-y-3">
              {invoiceRecords.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => resetInvoiceForm(record)}
                  className="w-full rounded-2xl border border-border p-4 text-left transition-all hover:border-brand-gold"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">{record.key}</p>
                      <p className="text-xs text-brand-muted">
                        {getMetadataString(record.metadata, "prefix", "CZ")} · {getMetadataString(record.metadata, "resetPolicy", "yearly")}
                      </p>
                    </div>
                    <StatusBadge status={record.isActive ? "completed" : "cancelled"}>
                      {record.isActive ? "active" : "inactive"}
                    </StatusBadge>
                  </div>
                </button>
              ))}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Tax Summary Preview" icon={<Receipt size={18} />} />
            <div className="space-y-4 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Service Base Price</span>
                <span className="font-bold text-brand-navy">{formatCurrency(previewBasePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">
                  {taxForm.codeLabel} {taxForm.code || "N/A"} ({previewTaxRate}%)
                </span>
                <span className="font-bold text-brand-navy">{formatCurrency(previewTaxValue)}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-bold text-brand-navy">Total Amount</span>
                <span className="font-bold text-brand-gold">{formatCurrency(previewTotal)}</span>
              </div>
            </div>
            <div className="mt-8 p-4 bg-brand-gold/5 rounded-xl border border-brand-gold/20">
              <p className="text-[11px] text-brand-navy leading-relaxed">
                Use separate tax keys for labor, materials, and bundled service packs if compliance treatment differs.
              </p>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Compliance Notes" icon={<FileText size={18} />} />
            <div className="space-y-3 text-sm text-brand-muted">
              <p>Invoice numbering should stay stable after go-live and reset only on a deliberate fiscal policy.</p>
              <p>Inclusive pricing is useful for customer-facing promotional plans, while standard service billing usually remains tax-exclusive.</p>
              <p>Code labels let the same screen support GST, VAT, HSN, or SAC terminology without changing the backend schema.</p>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
