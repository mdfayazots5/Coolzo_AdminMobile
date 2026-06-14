/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { toast } from "sonner";
import { Copy, FileText, Image as ImageIcon, Palette, Plus, RefreshCw, Rocket, Save, Upload } from "lucide-react";
import { AdminCard } from "@/components/shared/Cards";
import { AdminButton } from "@/components/shared/AdminButton";
import { InlineLoader } from "@/components/shared/Layout";
import ImageCropModal, { type CroppedImage } from "@/components/shared/ImageCropModal";
import {
  cmsDeliveryRepository,
  CmsBlock,
  CmsBlockUpsert,
  CONTACT_BLOCK_KEYS,
  ScreenImageSlot,
  SnapshotManifest,
  ThemeTokens,
  THEME_COLOR_KEYS,
  THEME_TOKEN_KEYS,
} from "@/core/network/cms-delivery-repository";

type TabKey = "theme" | "content" | "images" | "publish";

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function describeAspectRatio(width: number, height: number): string {
  if (!width || !height) return "";
  const divisor = greatestCommonDivisor(width, height) || 1;
  return `${width / divisor}:${height / divisor}`;
}

const LOGO_RECOMMENDATION = {
  dimensions: "Guideline only — scaled to fit, never cropped",
  format: "SVG preferred (scales perfectly); raster ~64 px tall",
  background: "Transparent PNG / WebP / SVG",
  maxSize: "5 MB",
};

const BREAKPOINT_CONTEXT: Record<string, string> = {
  desktop: "wide desktop / large-screen layout",
  tablet: "tablet / mid-width screen layout",
  mobile: "mobile portrait / small-screen layout",
};

/**
 * Builds an AI image-generation prompt (Gemini / any model) that pairs the seeded
 * creative direction with the slot's hard technical constraints — exact resolution,
 * aspect ratio, and target breakpoint — so the generated image fits the slot.
 */
function buildImagePrompt(slot: ScreenImageSlot): string {
  const ratio = describeAspectRatio(slot.recommendedWidth, slot.recommendedHeight);
  const context = BREAKPOINT_CONTEXT[slot.breakpoint] ?? `${slot.breakpoint} layout`;
  const creative =
    slot.suggestedAIPrompt?.trim() ||
    slot.altText?.trim() ||
    "Professional brand image for an AC (air-conditioning) service company.";

  return [
    creative,
    `Use: this is the "${slot.slotKey}" image on the ${slot.pageKey} page, for a ${context}.`,
    `Output exactly ${slot.recommendedWidth}×${slot.recommendedHeight} px${ratio ? ` (${ratio} aspect ratio)` : ""}; fill the whole frame edge to edge with no letterboxing, borders, or padding.`,
    `Keep the main subject centered within the safe area so nothing important is cropped at this aspect ratio.`,
    `High-resolution, photorealistic, sharp focus, even professional lighting, navy and gold brand palette. No text, logos, watermarks, or UI overlays.`,
  ].join(" ");
}

const EMPTY_BLOCK: CmsBlockUpsert = {
  blockKey: "",
  title: "",
  summary: "",
  content: "",
  previewImageUrl: "",
  isActive: true,
  isPublished: true,
  sortOrder: 0,
};

const TOKEN_LABELS: Record<string, string> = {
  "theme.color.primary": "Primary (Deep Navy)",
  "theme.color.accent": "Accent (Warm Gold)",
  "theme.color.background": "Background",
  "theme.color.surface": "Surface",
  "theme.color.border": "Border / Divider",
  "theme.color.textPrimary": "Text Primary",
  "theme.color.textSecondary": "Text Secondary",
  "theme.color.success": "Success",
  "theme.color.warning": "Warning",
  "theme.color.error": "Error / Urgent",
  "theme.font.family": "Font Family",
  "theme.font.weights": "Font Weights",
  "theme.logoUrl": "Logo URL",
};

/**
 * Friendly labels + default titles for the well-known content-block keys the public site reads.
 * Sourced from CONTACT_BLOCK_KEYS so the picker can never drift from what the website looks up.
 */
const KNOWN_BLOCK_KEYS: Record<string, { label: string; defaultTitle: string; placeholder: string }> = {
  // Footer contact details (read by Footer / Contact / MobileActionBar)
  "contact.phone": { label: "Phone number (footer)", defaultTitle: "Support phone number", placeholder: "e.g. +91 70759 49956" },
  "contact.whatsapp": { label: "WhatsApp number (footer)", defaultTitle: "WhatsApp number", placeholder: "e.g. +91 70759 49956" },
  "contact.email": { label: "Email address (footer)", defaultTitle: "Support email", placeholder: "e.g. care@coolzo.com" },
  "contact.city": { label: "City / location (footer)", defaultTitle: "Service city", placeholder: "e.g. Hyderabad" },
  // Section blocks — Title = heading shown on the site, Text = body shown on the site.
  "home.hero": { label: "Home · hero (heading + text)", defaultTitle: "Coolzo Keeps Every AC Season Running", placeholder: "Hero body, e.g. Fast booking, transparent billing, dependable service." },
  "home.about": { label: "Home · about section (heading + text)", defaultTitle: "Why customers choose Coolzo", placeholder: "About body, e.g. Certified technicians and CMS-driven support." },
  "service-content.general-service": { label: "Services · banner (heading + text)", defaultTitle: "General AC Service", placeholder: "Services intro, e.g. Routine service includes cleaning, airflow validation…" },
  // Home hero trust-strip stats — Title = the figure shown, Text = its caption/label.
  "home.stat.rating": { label: "Home · stat · rating (figure + caption)", defaultTitle: "4.9/5", placeholder: "Caption, e.g. across Hyderabad" },
  "home.stat.zones": { label: "Home · stat · zones (figure + caption)", defaultTitle: "20+", placeholder: "Caption, e.g. Zones Covered" },
  "home.stat.technicians": { label: "Home · stat · technicians (figure + caption)", defaultTitle: "500+", placeholder: "Caption, e.g. Certified Technicians" },
  "home.stat.response": { label: "Home · stat · response (figure + caption)", defaultTitle: "4 hr", placeholder: "Caption, e.g. Emergency Response" },
};

const CUSTOM_KEY_OPTION = "__custom__";

/** Valid block key: lowercase alphanumeric words joined by dots or hyphens (e.g. home.hero.tagline). */
const BLOCK_KEY_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export default function CmsDeliveryManager() {
  const [tab, setTab] = React.useState<TabKey>("theme");
  const [isLoading, setIsLoading] = React.useState(true);
  const [tokens, setTokens] = React.useState<ThemeTokens>({});
  const [slots, setSlots] = React.useState<ScreenImageSlot[]>([]);
  const [blocks, setBlocks] = React.useState<CmsBlock[]>([]);
  const [manifest, setManifest] = React.useState<SnapshotManifest | null>(null);
  const [isSavingTheme, setIsSavingTheme] = React.useState(false);
  const [savingBlockId, setSavingBlockId] = React.useState<number | null>(null);
  const [newBlock, setNewBlock] = React.useState<CmsBlockUpsert>(EMPTY_BLOCK);
  const [isCreatingBlock, setIsCreatingBlock] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [rollbackVersion, setRollbackVersion] = React.useState("");
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isCustomKey, setIsCustomKey] = React.useState(false);
  const [slotCrop, setSlotCrop] = React.useState<{ slot: ScreenImageSlot; file: File } | null>(null);

  const reload = React.useCallback(async () => {
    const [theme, slotList, blockList, currentManifest] = await Promise.all([
      cmsDeliveryRepository.getTheme(),
      cmsDeliveryRepository.getImageSlots(),
      cmsDeliveryRepository.getBlocks(),
      cmsDeliveryRepository.getManifest(),
    ]);
    setTokens(theme.tokens);
    setSlots(slotList);
    setBlocks(blockList);
    setManifest(currentManifest);
  }, []);

  React.useEffect(() => {
    void reload().finally(() => setIsLoading(false));
  }, [reload]);

  const setToken = (key: string, value: string) =>
    setTokens((current) => ({ ...current, [key]: value }));

  const handleSaveTheme = async () => {
    setIsSavingTheme(true);
    try {
      const payload: ThemeTokens = {};
      THEME_TOKEN_KEYS.forEach((key) => {
        payload[key] = tokens[key] ?? "";
      });
      const updated = await cmsDeliveryRepository.updateTheme(payload);
      setTokens(updated.tokens);
      toast.success("Theme saved. Publish to push it live.");
    } catch {
      toast.error("Failed to save theme.");
    } finally {
      setIsSavingTheme(false);
    }
  };

  const setBlockField = <K extends keyof CmsBlock>(id: number, field: K, value: CmsBlock[K]) =>
    setBlocks((current) => current.map((b) => (b.cmsBlockId === id ? { ...b, [field]: value } : b)));

  const handleSaveBlock = async (block: CmsBlock) => {
    if (!block.blockKey.trim()) {
      toast.error("Block key is required.");
      return;
    }
    if (!block.content.trim()) {
      toast.error("Text can't be empty — it would show as blank on the website.");
      return;
    }
    setSavingBlockId(block.cmsBlockId);
    try {
      const updated = await cmsDeliveryRepository.updateBlock(block.cmsBlockId, {
        blockKey: block.blockKey,
        title: block.title,
        summary: block.summary,
        content: block.content,
        previewImageUrl: block.previewImageUrl,
        isActive: block.isActive,
        isPublished: block.isPublished,
        sortOrder: block.sortOrder,
      });
      setBlocks((current) => current.map((b) => (b.cmsBlockId === updated.cmsBlockId ? updated : b)));
      toast.success(`Saved "${block.blockKey}". Publish to push it live.`);
    } catch {
      toast.error("Failed to save block.");
    } finally {
      setSavingBlockId(null);
    }
  };

  const handleCreateBlock = async () => {
    const blockKey = newBlock.blockKey.trim();
    if (!blockKey) {
      toast.error("Choose what to edit (or enter a custom key).");
      return;
    }
    if (isCustomKey && !BLOCK_KEY_PATTERN.test(blockKey)) {
      toast.error("Custom key must be lowercase words separated by dots or hyphens (e.g. home.hero.tagline).");
      return;
    }
    if (existingKeys.has(blockKey)) {
      toast.error(`"${blockKey}" already exists — edit it in the list below.`);
      return;
    }
    if (!newBlock.content.trim()) {
      toast.error("Enter the text that will appear on the website.");
      return;
    }
    setIsCreatingBlock(true);
    try {
      const created = await cmsDeliveryRepository.createBlock({ ...newBlock, blockKey });
      setBlocks((current) => [created, ...current]);
      setNewBlock(EMPTY_BLOCK);
      setIsCustomKey(false);
      toast.success(`Created "${created.blockKey}". Publish to push it live.`);
    } catch {
      toast.error("Failed to create block (key may already exist).");
    } finally {
      setIsCreatingBlock(false);
    }
  };

  const handleSlotFileSelected = (slot: ScreenImageSlot, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    // Open the cropper locked to this slot's exact recommended dimensions so the uploaded image
    // always fills the slot (no letterboxing) regardless of the source image's size.
    setSlotCrop({ slot, file });
  };

  const uploadSlotCropped = async (slot: ScreenImageSlot, cropped: CroppedImage) => {
    setSlotCrop(null);
    try {
      const updated = await cmsDeliveryRepository.uploadImage(slot.screenImageSlotId, {
        fileName: cropped.fileName,
        contentType: cropped.contentType,
        base64Content: cropped.base64Content,
        altText: slot.altText,
      });
      setSlots((current) =>
        current.map((item) => (item.screenImageSlotId === updated.screenImageSlotId ? updated : item)),
      );
      toast.success(`Image updated for ${slot.pageKey}.${slot.slotKey} (${slot.breakpoint}).`);
    } catch {
      toast.error("Image upload failed.");
    }
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const base64Content = await readFileAsBase64(file);
      const { imageUrl } = await cmsDeliveryRepository.uploadAsset({
        fileName: file.name,
        contentType: file.type,
        base64Content,
        assetKey: "logo",
      });
      setToken("theme.logoUrl", imageUrl);
      toast.success("Logo uploaded. Click Save Theme to apply, then Publish to go live.");
    } catch {
      toast.error("Logo upload failed.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await cmsDeliveryRepository.publish();
      setManifest(result);
      toast.success(`Published v${result.version} — live now.`);
    } catch {
      toast.error("Publish failed.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollback = async () => {
    const version = Number(rollbackVersion);
    if (!Number.isInteger(version) || version <= 0) {
      toast.error("Enter a valid version number.");
      return;
    }
    try {
      const result = await cmsDeliveryRepository.rollback(version);
      setManifest(result);
      setRollbackVersion("");
      toast.success(`Rolled back to v${result.version}.`);
    } catch {
      toast.error("Rollback failed.");
    }
  };

  const copyPrompt = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    toast.success("AI image prompt copied.");
  };

  if (isLoading) {
    return <InlineLoader className="h-screen" />;
  }

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: "theme", label: "Theme", icon: <Palette size={16} /> },
    { key: "content", label: "Content", icon: <FileText size={16} /> },
    { key: "images", label: "Images", icon: <ImageIcon size={16} /> },
    { key: "publish", label: "Publish", icon: <Rocket size={16} /> },
  ];

  const existingKeys = new Set(blocks.map((b) => b.blockKey));
  const missingContactKeys = CONTACT_BLOCK_KEYS.filter((k) => !existingKeys.has(k));

  const slotsByPage = slots.reduce<Record<string, ScreenImageSlot[]>>((acc, slot) => {
    (acc[slot.pageKey] ??= []).push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Web Portal CMS</h1>
          <p className="text-sm text-brand-muted">
            Theme, screen images, and one-click publish to the public website. Changes go live only when you Publish.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {manifest ? (
            <span className="rounded-[8px] bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              Live: v{manifest.version}
            </span>
          ) : (
            <span className="rounded-[8px] bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              Not published yet
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[8px] px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.key ? "bg-brand-navy text-white" : "bg-white text-brand-muted hover:bg-slate-50"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {tab === "theme" && (
        <AdminCard className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {THEME_COLOR_KEYS.map((key) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-[8px] border border-slate-100 p-3">
                <label className="text-sm font-medium text-brand-navy" htmlFor={`token-${key}`}>
                  {TOKEN_LABELS[key] ?? key}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    aria-label={`${TOKEN_LABELS[key] ?? key} colour picker`}
                    type="color"
                    value={tokens[key] || "#000000"}
                    onChange={(event) => setToken(key, event.target.value)}
                    className="h-9 w-10 cursor-pointer rounded border border-slate-200"
                  />
                  <input
                    id={`token-${key}`}
                    type="text"
                    value={tokens[key] ?? ""}
                    onChange={(event) => setToken(key, event.target.value)}
                    className="w-28 rounded-[8px] border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(["theme.font.family", "theme.font.weights"] as const).map((key) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-brand-navy" htmlFor={`token-${key}`}>
                  {TOKEN_LABELS[key]}
                </label>
                <input
                  id={`token-${key}`}
                  type="text"
                  value={tokens[key] ?? ""}
                  onChange={(event) => setToken(key, event.target.value)}
                  className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-[12px] border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-brand-navy">{TOKEN_LABELS["theme.logoUrl"]}</label>
              <span className="text-xs text-brand-muted">SVG / PNG · ≤ {LOGO_RECOMMENDATION.maxSize}</span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-48 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-slate-100 bg-slate-50 p-2">
                {tokens["theme.logoUrl"] ? (
                  <img
                    src={tokens["theme.logoUrl"]}
                    alt="Brand logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-brand-muted">No logo uploaded</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-brand-navy px-3 py-2 text-sm font-medium text-brand-navy hover:bg-slate-50">
                  <Upload size={16} />
                  {isUploadingLogo ? "Uploading…" : tokens["theme.logoUrl"] ? "Replace logo" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/webp"
                    className="hidden"
                    disabled={isUploadingLogo}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleLogoUpload(file);
                      event.target.value = "";
                    }}
                  />
                </label>
                <ul className="space-y-0.5 text-xs leading-relaxed text-brand-muted">
                  <li>Sizing: {LOGO_RECOMMENDATION.dimensions}</li>
                  <li>Format: {LOGO_RECOMMENDATION.format}</li>
                  <li>Background: {LOGO_RECOMMENDATION.background}</li>
                  <li>Max file size: {LOGO_RECOMMENDATION.maxSize}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <AdminButton onClick={handleSaveTheme} isLoading={isSavingTheme}>
              Save Theme
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {tab === "content" && (
        <div className="space-y-6">
          <AdminCard className="space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">Add website text</h2>
              <p className="text-sm text-brand-muted">
                A content block is one piece of editable text on the public website, identified by a unique
                <em className="not-italic font-medium"> key</em>. The website looks up each value by its key — for example,
                the footer reads its contact details from
                <code className="mx-1 rounded bg-slate-100 px-1">contact.phone</code>,
                <code className="mx-1 rounded bg-slate-100 px-1">contact.whatsapp</code>,
                <code className="mx-1 rounded bg-slate-100 px-1">contact.email</code>, and
                <code className="mx-1 rounded bg-slate-100 px-1">contact.city</code>.
                Your edits appear on the live site only after you <strong className="font-semibold">Publish</strong>.
              </p>
            </div>

            {missingContactKeys.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-[8px] bg-amber-50 p-3 text-sm text-amber-800">
                <span>These contact blocks aren’t set up yet — click to add one:</span>
                {missingContactKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setIsCustomKey(false);
                      setNewBlock({ ...EMPTY_BLOCK, blockKey: key, title: KNOWN_BLOCK_KEYS[key]?.defaultTitle ?? key });
                    }}
                    className="inline-flex items-center gap-1 rounded-[6px] bg-white px-2 py-1 text-xs font-medium text-brand-navy hover:bg-slate-50"
                  >
                    <Plus size={12} /> {KNOWN_BLOCK_KEYS[key]?.label ?? key}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-brand-navy" htmlFor="new-block-key">
                  What to edit <span className="font-normal text-brand-muted">— pick where this text appears</span>
                </label>
                <select
                  id="new-block-key"
                  aria-label="Block key"
                  value={isCustomKey ? CUSTOM_KEY_OPTION : newBlock.blockKey}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === CUSTOM_KEY_OPTION) {
                      setIsCustomKey(true);
                      setNewBlock({ ...newBlock, blockKey: "" });
                      return;
                    }
                    setIsCustomKey(false);
                    setNewBlock({
                      ...newBlock,
                      blockKey: value,
                      title: newBlock.title || KNOWN_BLOCK_KEYS[value]?.defaultTitle || "",
                    });
                  }}
                  className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {Object.entries(KNOWN_BLOCK_KEYS).map(([key, meta]) => {
                    const alreadyExists = existingKeys.has(key);
                    return (
                      <option key={key} value={key} disabled={alreadyExists}>
                        {meta.label}
                        {alreadyExists ? " — already added (edit below)" : ""}
                      </option>
                    );
                  })}
                  <option value={CUSTOM_KEY_OPTION}>Advanced: custom key…</option>
                </select>
                {isCustomKey && (
                  <input
                    aria-label="Custom block key"
                    type="text"
                    value={newBlock.blockKey}
                    onChange={(e) => setNewBlock({ ...newBlock, blockKey: e.target.value })}
                    placeholder="custom key, e.g. home.hero.tagline"
                    className="mt-1 w-full rounded-[8px] border border-slate-200 px-3 py-2 text-sm"
                  />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-brand-navy" htmlFor="new-block-title">
                  Title <span className="font-normal text-brand-muted">— heading shown on the site (label only for contact rows)</span>
                </label>
                <input
                  id="new-block-title"
                  aria-label="Title"
                  type="text"
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                  placeholder="e.g. Support phone number"
                  className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-brand-navy" htmlFor="new-block-content">
                Text shown on the website <span className="font-normal text-brand-muted">— what visitors actually see</span>
              </label>
              <textarea
                id="new-block-content"
                aria-label="Content"
                value={newBlock.content}
                onChange={(e) => setNewBlock({ ...newBlock, content: e.target.value })}
                placeholder={KNOWN_BLOCK_KEYS[newBlock.blockKey]?.placeholder ?? "e.g. +91 70759 49956"}
                rows={2}
                className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-brand-muted">
                <input
                  type="checkbox"
                  checked={newBlock.isPublished}
                  onChange={(e) => setNewBlock({ ...newBlock, isPublished: e.target.checked })}
                />
                Published
              </label>
              <AdminButton
                onClick={handleCreateBlock}
                isLoading={isCreatingBlock}
                disabled={!newBlock.blockKey.trim() || !newBlock.content.trim()}
                icon={<Plus size={16} />}
              >
                Add block
              </AdminButton>
            </div>
          </AdminCard>

          {blocks.length === 0 ? (
            <AdminCard className="p-6 text-sm text-brand-muted">No content blocks yet. Add one above.</AdminCard>
          ) : (
            blocks.map((block) => {
              const isContact = (CONTACT_BLOCK_KEYS as readonly string[]).includes(block.blockKey);
              return (
                <AdminCard key={block.cmsBlockId} className="space-y-3 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-slate-100 px-2 py-0.5 text-sm font-semibold text-brand-navy">{block.blockKey}</code>
                      {isContact && (
                        <span className="rounded-[6px] bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">contact</span>
                      )}
                      {!block.isPublished && (
                        <span className="rounded-[6px] bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">draft</span>
                      )}
                    </div>
                    <span className="text-xs text-brand-muted">v{block.versionNumber}</span>
                  </div>
                  <input
                    aria-label={`Title for ${block.blockKey}`}
                    type="text"
                    value={block.title}
                    onChange={(e) => setBlockField(block.cmsBlockId, "title", e.target.value)}
                    placeholder="Title"
                    className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    aria-label={`Content for ${block.blockKey}`}
                    value={block.content}
                    onChange={(e) => setBlockField(block.cmsBlockId, "content", e.target.value)}
                    rows={3}
                    placeholder="Text shown on the website"
                    className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm text-brand-muted">
                      <input
                        type="checkbox"
                        checked={block.isPublished}
                        onChange={(e) => setBlockField(block.cmsBlockId, "isPublished", e.target.checked)}
                      />
                      Published
                    </label>
                    <AdminButton
                      variant="outline"
                      onClick={() => handleSaveBlock(block)}
                      isLoading={savingBlockId === block.cmsBlockId}
                      icon={<Save size={16} />}
                    >
                      Save
                    </AdminButton>
                  </div>
                </AdminCard>
              );
            })
          )}
        </div>
      )}

      {tab === "images" && (
        <div className="space-y-6">
          {Object.keys(slotsByPage).length === 0 && (
            <AdminCard className="p-6 text-sm text-brand-muted">No screen image slots defined yet.</AdminCard>
          )}
          {Object.keys(slotsByPage).map((pageKey) => (
            <AdminCard key={pageKey} className="space-y-4 p-6">
              <h2 className="text-lg font-semibold capitalize text-brand-navy">{pageKey}</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {(slotsByPage[pageKey] ?? []).map((slot) => (
                  <div key={slot.screenImageSlotId} className="space-y-3 rounded-[12px] border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-navy">
                        {slot.slotKey} · {slot.breakpoint}
                      </span>
                      <span className="text-xs text-brand-muted">
                        {slot.recommendedWidth}×{slot.recommendedHeight}
                      </span>
                    </div>

                    <div className="flex h-32 items-center justify-center overflow-hidden rounded-[8px] bg-slate-50">
                      {slot.imageUrl ? (
                        <img src={slot.imageUrl} alt={slot.altText} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-brand-muted">No image uploaded</span>
                      )}
                    </div>

                    <div className="rounded-[8px] bg-slate-50 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-brand-muted">Suggested AI image prompt</span>
                        <button
                          type="button"
                          onClick={() => copyPrompt(buildImagePrompt(slot))}
                          className="inline-flex items-center gap-1 text-xs text-brand-navy hover:underline"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600">{buildImagePrompt(slot)}</p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-brand-navy px-3 py-2 text-sm font-medium text-brand-navy hover:bg-slate-50">
                      <Upload size={16} />
                      Upload image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleSlotFileSelected(slot, file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {tab === "publish" && (
        <div className="space-y-6">
          <AdminCard className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-brand-navy">Publish to live site</h2>
            <p className="text-sm text-brand-muted">
              Building a snapshot bundles the current theme, content, and images into a single versioned file the
              website reads directly — no code change, no per-request database load.
            </p>
            {manifest && (
              <div className="rounded-[8px] bg-slate-50 p-4 text-sm">
                <div className="flex justify-between"><span className="text-brand-muted">Active version</span><span className="font-medium">v{manifest.version}</span></div>
                <div className="flex justify-between"><span className="text-brand-muted">Published</span><span className="font-medium">{new Date(manifest.publishedAtUtc).toLocaleString()}</span></div>
                <div className="mt-1 break-all text-xs text-slate-500">checksum {manifest.checksum}</div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <AdminButton onClick={handlePublish} isLoading={isPublishing} icon={<Rocket size={18} />}>
                Publish Now
              </AdminButton>
              <AdminButton variant="outline" icon={<RefreshCw size={18} />} onClick={() => void reload()}>
                Refresh
              </AdminButton>
            </div>
          </AdminCard>

          <AdminCard className="space-y-3 p-6">
            <h2 className="text-lg font-semibold text-brand-navy">Roll back</h2>
            <p className="text-sm text-brand-muted">Re-activate a previously published version by number.</p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                aria-label="Version to roll back to"
                type="number"
                min={1}
                value={rollbackVersion}
                onChange={(event) => setRollbackVersion(event.target.value)}
                placeholder="Version #"
                className="w-32 rounded-[8px] border border-slate-200 px-3 py-2 text-sm"
              />
              <AdminButton variant="outline" onClick={handleRollback}>
                Roll back
              </AdminButton>
            </div>
          </AdminCard>
        </div>
      )}

      {slotCrop && (
        <ImageCropModal
          file={slotCrop.file}
          targetWidth={slotCrop.slot.recommendedWidth}
          targetHeight={slotCrop.slot.recommendedHeight}
          title={`Crop ${slotCrop.slot.slotKey} · ${slotCrop.slot.breakpoint}`}
          onCancel={() => setSlotCrop(null)}
          onCropped={(result) => void uploadSlotCropped(slotCrop.slot, result)}
        />
      )}
    </div>
  );
}
