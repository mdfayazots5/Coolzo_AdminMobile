/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { toast } from "sonner";
import { Copy, Image as ImageIcon, Palette, RefreshCw, Rocket, Upload } from "lucide-react";
import { AdminCard } from "@/components/shared/Cards";
import { AdminButton } from "@/components/shared/AdminButton";
import { InlineLoader } from "@/components/shared/Layout";
import {
  cmsDeliveryRepository,
  ScreenImageSlot,
  SnapshotManifest,
  ThemeTokens,
  THEME_COLOR_KEYS,
  THEME_TOKEN_KEYS,
} from "@/core/network/cms-delivery-repository";

type TabKey = "theme" | "images" | "publish";

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
  const [manifest, setManifest] = React.useState<SnapshotManifest | null>(null);
  const [isSavingTheme, setIsSavingTheme] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [rollbackVersion, setRollbackVersion] = React.useState("");

  const reload = React.useCallback(async () => {
    const [theme, slotList, currentManifest] = await Promise.all([
      cmsDeliveryRepository.getTheme(),
      cmsDeliveryRepository.getImageSlots(),
      cmsDeliveryRepository.getManifest(),
    ]);
    setTokens(theme.tokens);
    setSlots(slotList);
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

  const handleUpload = async (slot: ScreenImageSlot, file: File) => {
    try {
      const base64Content = await readFileAsBase64(file);
      const updated = await cmsDeliveryRepository.uploadImage(slot.screenImageSlotId, {
        fileName: file.name,
        contentType: file.type,
        base64Content,
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
    toast.success("Gemini prompt copied.");
  };

  if (isLoading) {
    return <InlineLoader className="h-screen" />;
  }

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: "theme", label: "Theme", icon: <Palette size={16} /> },
    { key: "images", label: "Screen Images", icon: <ImageIcon size={16} /> },
    { key: "publish", label: "Publish & Versions", icon: <Rocket size={16} /> },
  ];

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

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`inline-flex items-center gap-2 rounded-[8px] px-4 py-2 text-sm font-medium transition-colors ${
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(["theme.font.family", "theme.font.weights", "theme.logoUrl"] as const).map((key) => (
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

          <div className="flex justify-end">
            <AdminButton onClick={handleSaveTheme} isLoading={isSavingTheme}>
              Save Theme
            </AdminButton>
          </div>
        </AdminCard>
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
                        <span className="text-xs font-medium text-brand-muted">Suggested Gemini prompt</span>
                        <button
                          type="button"
                          onClick={() => copyPrompt(slot.suggestedAIPrompt)}
                          className="inline-flex items-center gap-1 text-xs text-brand-navy hover:underline"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600">{slot.suggestedAIPrompt}</p>
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
                          if (file) void handleUpload(slot, file);
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
    </div>
  );
}
