/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const getMetadataString = (
  metadata: Record<string, unknown>,
  key: string,
  fallback = ""
) => {
  const value = metadata[key]
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return fallback
}

export const getMetadataNumber = (
  metadata: Record<string, unknown>,
  key: string,
  fallback = 0
) => {
  const value = metadata[key]
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

export const getMetadataBoolean = (
  metadata: Record<string, unknown>,
  key: string,
  fallback = false
) => {
  const value = metadata[key]
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true"
  }

  if (typeof value === "number") {
    return value > 0
  }

  return fallback
}

export const getMetadataStringList = (metadata: Record<string, unknown>, key: string) => {
  const value = metadata[key]
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return parseCsvList(value)
  }

  return []
}

export const parseCsvList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

export const toSlugCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const asOptionalNumber = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)

export const sortBySortOrder = <T extends { sortOrder?: number; label?: string; key?: string }>(records: T[]) =>
  [...records].sort((left, right) => {
    const leftOrder = left.sortOrder ?? 0
    const rightOrder = right.sortOrder ?? 0
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    const leftLabel = (left.label || left.key || "").toLowerCase()
    const rightLabel = (right.label || right.key || "").toLowerCase()
    return leftLabel.localeCompare(rightLabel)
  })
