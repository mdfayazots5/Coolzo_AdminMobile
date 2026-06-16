/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { toast } from "sonner"
import { Check, Copy, RotateCcw, Sparkles, X } from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"

/**
 * A drop-in "Prompt" control that sits beside an image upload/replace button. The admin edits a
 * short SUBJECT seed (the business intent — what the photo is of); the engine composes a full,
 * Gemini-ready professional-photography prompt (positive + negative) shown live below for copy.
 *
 * Only the subject seed is persisted (DB-backed) — the global photography-quality and negative
 * standards are layered in by `compose`, so every image stays on-brand and camera-grade with no
 * rewriting and no rework. Saved subjects are shared across admins/devices.
 */
interface ImagePromptStudioProps {
  /** Heading for the modal, e.g. the service or slot name. */
  title: string
  /** Optional size/aspect hint shown to the admin, e.g. "1280×720 · 16:9". */
  dimensionHint?: string
  /** Label for the editable subject field. */
  subjectLabel?: string
  /** Auto-generated default subject seed for this image. */
  suggestedSeed: string
  /** Currently persisted subject seed ("" when none saved — the suggestion is used instead). */
  savedSeed: string
  /** Builds the full Gemini prompt (positive + negative) from the current subject seed. */
  compose: (seed: string) => string
  /** Persists the subject seed. Empty string clears the override. */
  onSave: (seed: string) => Promise<void>
  /** Optional extra classes for the trigger button. */
  className?: string
  /** Disables the trigger button (e.g. while the row is busy). */
  disabled?: boolean
}

export default function ImagePromptStudio({
  title,
  dimensionHint,
  subjectLabel,
  suggestedSeed,
  savedSeed,
  compose,
  onSave,
  className,
  disabled,
}: ImagePromptStudioProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const hasCustom = savedSeed.trim().length > 0

  return (
    <>
      <AdminButton
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        icon={<Sparkles size={16} />}
        className={cn("relative", className)}
        onClick={() => setIsOpen(true)}
      >
        Prompt
        {hasCustom && (
          <span className="ml-1 inline-block h-2 w-2 rounded-full bg-brand-gold" aria-label="Custom prompt saved" />
        )}
      </AdminButton>

      {isOpen && (
        <PromptModal
          title={title}
          dimensionHint={dimensionHint}
          subjectLabel={subjectLabel}
          suggestedSeed={suggestedSeed}
          savedSeed={savedSeed}
          compose={compose}
          onSave={onSave}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

function PromptModal({
  title,
  dimensionHint,
  subjectLabel = "Subject / creative direction",
  suggestedSeed,
  savedSeed,
  compose,
  onSave,
  onClose,
}: Omit<ImagePromptStudioProps, "className" | "disabled"> & { onClose: () => void }) {
  const initial = savedSeed.trim().length > 0 ? savedSeed : suggestedSeed
  const [seed, setSeed] = React.useState(initial)
  const [isSaving, setIsSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Close on Escape for keyboard accessibility.
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const fullPrompt = compose(seed)
  const isDirty = seed !== initial
  const isSuggested = seed.trim() === suggestedSeed.trim()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullPrompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Couldn't copy to clipboard.")
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(seed.trim())
      toast.success("Prompt saved.")
      onClose()
    } catch {
      toast.error("Failed to save prompt.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`AI image prompt for ${title}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[90vh] w-[min(94vw,680px)] flex-col overflow-hidden rounded-[12px] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <div className="flex items-center gap-2 text-brand-navy">
              <Sparkles size={18} className="text-brand-gold" />
              <h2 className="text-base font-bold">AI image prompt · Gemini-ready</h2>
            </div>
            <p className="mt-0.5 text-sm text-brand-muted">
              {title}
              {dimensionHint ? <span className="ml-2 text-xs text-brand-muted">· {dimensionHint}</span> : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-[8px] p-1 text-brand-muted hover:bg-brand-navy/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Editable subject seed — the only thing stored. */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{subjectLabel}</label>
              {!isSuggested && (
                <button
                  type="button"
                  onClick={() => setSeed(suggestedSeed)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-navy hover:underline"
                >
                  <RotateCcw size={12} /> Reset to suggested
                </button>
              )}
            </div>
            <textarea
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              spellCheck
              rows={3}
              className="w-full resize-y rounded-[8px] border border-border bg-brand-navy/5 p-3 text-sm leading-relaxed text-brand-navy outline-none focus:ring-2 focus:ring-brand-gold"
              placeholder="What is this photo of? e.g. General AC service — routine cleaning and airflow check"
            />
            <p className="text-[11px] text-brand-muted">
              {seed.trim().length}/1024 · Describe only the subject. Professional camera, lighting, brand, and
              quality/negative standards are added automatically below.
            </p>
          </div>

          {/* Live, read-only composed Gemini prompt (positive + negative) — what you copy. */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Full Gemini prompt (copy this)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-navy hover:underline"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="max-h-[280px] overflow-y-auto whitespace-pre-wrap rounded-[8px] border border-border bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700">
              {fullPrompt}
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4">
          <AdminButton type="button" variant="outline" size="sm" icon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={handleCopy}>
            {copied ? "Copied" : "Copy prompt"}
          </AdminButton>
          <AdminButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton type="button" size="sm" isLoading={isSaving} disabled={!isDirty} onClick={handleSave}>
            Save subject
          </AdminButton>
        </div>
      </div>
    </div>
  )
}
