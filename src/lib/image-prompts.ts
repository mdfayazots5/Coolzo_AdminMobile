/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Gemini-optimised AI image-prompt engine — authored by the Prompt Engineer working as a Senior
 * Commercial Photographer. Every image (bookable services + all CMS screen slots) gets a full,
 * camera-grade prompt that reads like a real DSLR commercial photograph, NOT AI artwork.
 *
 * Architecture: we store only a short SUBJECT seed (the business intent — what the picture is of).
 * `compose*Prompt` then layers in professional photography craft, brand palette, slot-exact
 * technical constraints, and the GLOBAL quality + negative standards. This guarantees the global
 * standards are appended to EVERY image (even admin-edited ones), keeps stored seeds tiny, and
 * means a future standards change re-flows to all images with no rework.
 *
 * Design-system guardrails (Backend/Docs/CLAUDE.md → DESIGN SYSTEM): navy/gold palette, no neon,
 * no text/logos/watermarks, premium & trustworthy. People are authentic & candid (real working
 * humans) — never cheesy posed uniformed-staff stock.
 */

/** Coolzo public-Web brand palette (source of truth for the Web surface). */
const BRAND_NAVY = "#0A192F"
const BRAND_GOLD = "#D4AF37"

/** Service catalog images are cropped/displayed at 1280×720 (16:9) — keep the prompt in lockstep. */
export const SERVICE_IMAGE_WIDTH = 1280
export const SERVICE_IMAGE_HEIGHT = 720

/**
 * GLOBAL quality requirements — appended verbatim to the positive prompt of every image so output
 * is indistinguishable from genuine professional photography.
 */
export const GLOBAL_QUALITY =
  "Ultra-realistic professional photography, photorealistic, commercial advertising quality, DSLR camera, " +
  "full-frame sensor, natural lighting, realistic shadows, authentic textures, shallow depth of field, " +
  "premium color grading, realistic skin tones, highly detailed, 8K quality, professional composition, " +
  "genuine human expressions, real-world environment."

/** GLOBAL negative prompt — appended verbatim as the negative prompt of every image. */
export const GLOBAL_NEGATIVE =
  "cartoon, anime, illustration, painting, sketch, CGI, 3D render, artificial lighting, plastic skin, " +
  "unrealistic faces, distorted hands, extra fingers, blurry, low quality, overexposed, oversaturated, " +
  "fake environment, text, logo, watermark, duplicate objects."

/** Maps a CMS breakpoint to a human layout context for the prompt. */
const BREAKPOINT_CONTEXT: Record<string, string> = {
  desktop: "wide desktop / large-screen layout",
  tablet: "tablet / mid-width screen layout",
  mobile: "mobile portrait / small-screen layout",
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b)
}

function describeAspectRatio(width: number, height: number): string {
  if (!width || !height) return ""
  const divisor = greatestCommonDivisor(width, height) || 1
  return `${width / divisor}:${height / divisor}`
}

/**
 * Wraps a positive description into a Gemini-ready two-part prompt: a "Positive prompt:" block
 * (subject + craft + GLOBAL_QUALITY) and a "Negative prompt:" block (GLOBAL_NEGATIVE). This is the
 * exact text an admin copies into Gemini.
 */
function composeGeminiPrompt(positive: string): string {
  return `Positive prompt:\n${positive} ${GLOBAL_QUALITY}\n\nNegative prompt:\n${GLOBAL_NEGATIVE}`
}

// ── Services ────────────────────────────────────────────────────────────────────────────────────

interface ServiceSeedInput {
  serviceName: string
  summary?: string
}

/**
 * The short, editable SUBJECT seed for a service image (what the photo is of). This is what gets
 * stored; `composeServicePrompt` turns it into the full camera-grade prompt.
 */
export function defaultServiceSubject({ serviceName, summary }: ServiceSeedInput): string {
  const name = serviceName.trim() || "Air-conditioning service"
  const detail = summary?.trim()
  return detail ? `${name} — ${detail}` : `${name} — professional air-conditioning (HVAC) service`
}

/**
 * Composes the full Gemini photoreal prompt for a service image from its subject seed.
 * Deterministic: same subject → same prompt. Locked to 1280×720 (16:9).
 */
export function composeServicePrompt(subject: string): string {
  const subjectText = subject.trim() || "professional air-conditioning (HVAC) service"
  const positive =
    `A genuine, camera-captured commercial photograph for a premium air-conditioning (HVAC) service brand. ` +
    `Subject: ${subjectText}. ` +
    `Featuring a real, professional service technician as an authentic working person — natural posture, genuine focused expression, ` +
    `realistic skin texture and pores, anatomically correct hands working precisely on a clean, modern split / wall-mounted AC unit; ` +
    `a candid documentary moment, never posed or staged stock photography. ` +
    `Setting: a bright, spotless, believable residential or light-commercial interior with natural everyday detail. ` +
    `Shot on a full-frame DSLR with a 35mm f/1.8 prime lens, shallow depth of field with soft background bokeh, ` +
    `soft natural window daylight, realistic directional shadows and gentle highlights, refined premium color grading and true-to-life skin tones. ` +
    `Subtle deep-navy (${BRAND_NAVY}) and warm-gold (${BRAND_GOLD}) brand accents within the scene, with clean negative space for marketing text. ` +
    `Composition follows the rule of thirds with the main subject centered in the safe area, framed consistently for desktop, mobile, and marketing use. ` +
    `Output exactly ${SERVICE_IMAGE_WIDTH}×${SERVICE_IMAGE_HEIGHT} px (16:9 aspect ratio), filling the entire frame edge to edge with no letterboxing, borders, or padding.`
  return composeGeminiPrompt(positive)
}

/** Convenience: full prompt straight from a service record (uses the default subject seed). */
export function buildServiceImagePrompt(input: ServiceSeedInput): string {
  return composeServicePrompt(defaultServiceSubject(input))
}

// ── Service categories ────────────────────────────────────────────────────────────────────────────

interface CategorySeedInput {
  categoryName: string
  description?: string
}

/**
 * The short, editable SUBJECT seed for a category image (what the photo is of). A category groups
 * several services, so the seed leans on the grouping theme rather than one specific task.
 */
export function defaultCategorySubject({ categoryName, description }: CategorySeedInput): string {
  const name = categoryName.trim() || "Air-conditioning services"
  const detail = description?.trim()
  return detail ? `${name} — ${detail}` : `${name} — premium air-conditioning (HVAC) service category`
}

/**
 * Composes the full Gemini photoreal prompt for a category image from its subject seed. A category
 * tile represents a family of services, so the framing is a clean, representative hero shot rather
 * than a single close-up task. Deterministic and locked to 1280×720 (16:9).
 */
export function composeCategoryPrompt(subject: string): string {
  const subjectText = subject.trim() || "premium air-conditioning (HVAC) service category"
  const positive =
    `A genuine, camera-captured commercial photograph representing a category of premium air-conditioning (HVAC) services. ` +
    `Subject: ${subjectText}. ` +
    `A clean, representative hero shot that reads as the theme for a whole group of related services; ` +
    `if a person appears they are a real, professional service technician as an authentic working human — natural posture, genuine focused expression, ` +
    `realistic skin texture, anatomically correct hands — captured candidly, never posed or staged stock photography. ` +
    `Setting: a bright, spotless, believable residential or light-commercial interior with modern split / wall-mounted AC equipment and natural everyday detail. ` +
    `Shot on a full-frame DSLR with a 35mm f/1.8 prime lens, shallow depth of field with soft background bokeh, ` +
    `soft natural window daylight, realistic directional shadows and gentle highlights, refined premium color grading and true-to-life skin tones. ` +
    `Subtle deep-navy (${BRAND_NAVY}) and warm-gold (${BRAND_GOLD}) brand accents within the scene, with clean negative space for marketing text. ` +
    `Composition follows the rule of thirds with the main subject centered in the safe area, framed consistently for desktop, mobile, and marketing use. ` +
    `Output exactly ${SERVICE_IMAGE_WIDTH}×${SERVICE_IMAGE_HEIGHT} px (16:9 aspect ratio), filling the entire frame edge to edge with no letterboxing, borders, or padding.`
  return composeGeminiPrompt(positive)
}

// ── CMS screen slots ──────────────────────────────────────────────────────────────────────────

interface SlotPromptInput {
  subject: string
  pageKey: string
  slotKey: string
  breakpoint: string
  width: number
  height: number
}

/**
 * Composes the full Gemini photoreal prompt for a CMS screen-image slot from its subject seed plus
 * the slot's exact technical constraints (page, breakpoint, resolution, aspect).
 */
export function composeSlotPrompt({ subject, pageKey, slotKey, breakpoint, width, height }: SlotPromptInput): string {
  const subjectText =
    subject.trim() || "premium air-conditioning (HVAC) service brand imagery"
  const ratio = describeAspectRatio(width, height)
  const context = BREAKPOINT_CONTEXT[breakpoint] ?? `${breakpoint} layout`
  const positive =
    `A genuine, camera-captured commercial photograph for a premium air-conditioning (HVAC) service brand. ` +
    `Subject: ${subjectText}. ` +
    `If people appear, they are real, authentic working professionals or customers with natural expressions, realistic skin texture and ` +
    `anatomically correct hands, captured candidly rather than posed. ` +
    `Photographed on a full-frame DSLR with a fast prime lens, shallow depth of field, soft natural lighting with realistic shadows, ` +
    `refined premium color grading and true-to-life tones. ` +
    `Subtle deep-navy (${BRAND_NAVY}) and warm-gold (${BRAND_GOLD}) brand accents, with a clean composition and negative space for marketing text. ` +
    `Use: this is the "${slotKey}" image on the ${pageKey} page, designed for a ${context} and kept visually consistent across desktop, mobile, and marketing. ` +
    `Keep the main subject centered in the safe area. ` +
    `Output exactly ${width}×${height} px${ratio ? ` (${ratio} aspect ratio)` : ""}, filling the whole frame edge to edge with no letterboxing, borders, or padding.`
  return composeGeminiPrompt(positive)
}
