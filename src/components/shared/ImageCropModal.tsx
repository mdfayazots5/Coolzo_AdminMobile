/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminButton } from "@/components/shared/AdminButton"
import { Minus, Plus, X } from "lucide-react"

export interface CroppedImage {
  base64Content: string
  contentType: string
  fileName: string
}

interface ImageCropModalProps {
  /** Source file the admin selected. */
  file: File
  /** Target output size in pixels — drives both the crop aspect ratio and the exported image. */
  targetWidth: number
  targetHeight: number
  title?: string
  /**
   * Exported image MIME type. Defaults to "image/jpeg" (smaller, for photos). Pass "image/png" for
   * assets that must keep transparency (e.g. a brand logo) — JPEG would flatten it onto a background.
   */
  outputType?: "image/jpeg" | "image/png"
  onCancel: () => void
  onCropped: (result: CroppedImage) => void
}

/**
 * Pan + zoom image cropper locked to the slot's aspect ratio. AI/stock images rarely match a slot's
 * exact dimensions; this lets the admin frame the image and exports it at exactly targetWidth ×
 * targetHeight (cover-fit, no letterboxing) as a JPEG ready for the upload APIs.
 */
export default function ImageCropModal({
  file,
  targetWidth,
  targetHeight,
  title,
  outputType = "image/jpeg",
  onCancel,
  onCropped,
}: ImageCropModalProps) {
  // Guard against bad slot data (0 / missing dimensions) which would collapse the layout.
  const aspect = targetWidth > 0 && targetHeight > 0 ? targetWidth / targetHeight : 1
  const [imageSrc, setImageSrc] = React.useState<string>("")
  const [naturalSize, setNaturalSize] = React.useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = React.useState(1)
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const dragRef = React.useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)

  React.useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Frame (display) size — bounded to always fit inside the fixed-width card (≤ 512px content box)
  // and a sensible height, while keeping the slot's aspect ratio.
  const frame = React.useMemo(() => {
    const maxW = 480
    const maxH = 340
    let w = maxW
    let h = w / aspect
    if (h > maxH) {
      h = maxH
      w = h * aspect
    }
    return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) }
  }, [aspect])

  const baseScale = naturalSize ? Math.max(frame.w / naturalSize.w, frame.h / naturalSize.h) : 1
  const effectiveScale = baseScale * zoom
  const dispW = naturalSize ? naturalSize.w * effectiveScale : frame.w
  const dispH = naturalSize ? naturalSize.h * effectiveScale : frame.h

  const clampOffset = React.useCallback(
    (next: { x: number; y: number }) => {
      const maxX = Math.max(0, (dispW - frame.w) / 2)
      const maxY = Math.max(0, (dispH - frame.h) / 2)
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      }
    },
    [dispW, dispH, frame.w, frame.h],
  )

  React.useEffect(() => {
    setOffset((current) => clampOffset(current))
  }, [zoom, naturalSize, clampOffset])

  const onPointerDown = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: offset.x, baseY: offset.y }
  }
  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = event.clientX - dragRef.current.startX
    const dy = event.clientY - dragRef.current.startY
    setOffset(clampOffset({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy }))
  }
  const onPointerUp = () => {
    dragRef.current = null
  }

  const ZOOM_MIN = 1
  const ZOOM_MAX = 4
  const changeZoom = (delta: number) => {
    setZoom((current) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((current + delta).toFixed(2)))))
  }

  const handleApply = () => {
    const image = imgRef.current
    if (!image || !naturalSize) return

    const imgLeft = (frame.w - dispW) / 2 + offset.x
    const imgTop = (frame.h - dispH) / 2 + offset.y
    const srcLeft = -imgLeft / effectiveScale
    const srcTop = -imgTop / effectiveScale
    const srcW = frame.w / effectiveScale
    const srcH = frame.h / effectiveScale

    const canvas = document.createElement("canvas")
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(image, srcLeft, srcTop, srcW, srcH, 0, 0, targetWidth, targetHeight)

    const isPng = outputType === "image/png"
    const dataUrl = isPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.92)
    const base64Content = dataUrl.slice(dataUrl.indexOf(",") + 1)
    const baseName = file.name.replace(/\.[^.]+$/, "")
    onCropped({
      base64Content,
      contentType: outputType,
      fileName: `${baseName}.${isPng ? "png" : "jpg"}`,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-auto bg-black/50 p-4" onClick={onCancel}>
      {/* Explicit pixel width (not w-full/max-w-*) so the card can never collapse to its text width. */}
      <div
        className="rounded-2xl bg-white p-6 shadow-xl"
        style={{ width: 560, maxWidth: "94vw" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-brand-navy">{title ?? "Crop image"}</h3>
          <button type="button" onClick={onCancel} className="text-brand-muted hover:text-brand-navy" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xs text-brand-muted">
          Drag to reposition, zoom to fit. Exports exactly {targetWidth}×{targetHeight}px.
        </p>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative overflow-hidden rounded-[10px] border border-border bg-brand-surface touch-none select-none"
            style={{ width: frame.w, height: frame.h, cursor: dragRef.current ? "grabbing" : "grab" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {imageSrc && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                onLoad={(event) => {
                  const target = event.currentTarget
                  setNaturalSize({ w: target.naturalWidth, h: target.naturalHeight })
                }}
                style={{
                  position: "absolute",
                  width: dispW,
                  height: dispH,
                  left: (frame.w - dispW) / 2 + offset.x,
                  top: (frame.h - dispH) / 2 + offset.y,
                  maxWidth: "none",
                }}
              />
            )}
            {/* Rule-of-thirds alignment guide (does not block dragging). */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
            </div>
          </div>

          <div className="flex w-full items-center gap-5">
            <button
              type="button"
              onClick={() => changeZoom(-0.25)}
              disabled={zoom <= ZOOM_MIN}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-brand-navy hover:border-brand-navy/40 hover:bg-brand-surface disabled:opacity-40"
              aria-label="Zoom out"
            >
              <Minus size={18} />
            </button>
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-2 w-full cursor-pointer"
              style={{ accentColor: "#C9A84C" }}
              aria-label="Zoom"
            />
            <span className="w-10 shrink-0 text-right text-xs font-semibold text-brand-muted tabular-nums">{zoom.toFixed(1)}×</span>
            <button
              type="button"
              onClick={() => changeZoom(0.25)}
              disabled={zoom >= ZOOM_MAX}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-brand-navy hover:border-brand-navy/40 hover:bg-brand-surface disabled:opacity-40"
              aria-label="Zoom in"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <AdminButton type="button" variant="secondary" onClick={onCancel}>Cancel</AdminButton>
          <AdminButton type="button" onClick={handleApply} disabled={!naturalSize}>Apply &amp; Upload</AdminButton>
        </div>
      </div>
    </div>
  )
}
