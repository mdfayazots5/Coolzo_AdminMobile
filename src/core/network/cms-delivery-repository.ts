/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from "./api-client";

/** Theme token keys mirror Backend SnapshotKeys.Theme.* */
export const THEME_TOKEN_KEYS = [
  "theme.color.primary",
  "theme.color.accent",
  "theme.color.background",
  "theme.color.surface",
  "theme.color.border",
  "theme.color.textPrimary",
  "theme.color.textSecondary",
  "theme.color.success",
  "theme.color.warning",
  "theme.color.error",
  "theme.font.family",
  "theme.font.weights",
  "theme.logoUrl",
] as const;

export const THEME_COLOR_KEYS = THEME_TOKEN_KEYS.filter((key) => key.startsWith("theme.color."));

export type ThemeTokens = Record<string, string>;

export interface ThemeResponse {
  tokens: ThemeTokens;
}

export type Breakpoint = "desktop" | "tablet" | "mobile";

export interface ScreenImageSlot {
  screenImageSlotId: number;
  pageKey: string;
  slotKey: string;
  breakpoint: Breakpoint;
  recommendedWidth: number;
  recommendedHeight: number;
  altText: string;
  suggestedAIPrompt: string;
  imageUrl: string;
  isActive: boolean;
}

export interface ScreenImageSlotUpsert {
  pageKey: string;
  slotKey: string;
  breakpoint: Breakpoint;
  recommendedWidth: number;
  recommendedHeight: number;
  altText?: string;
  suggestedAIPrompt?: string;
  isActive: boolean;
}

export interface ScreenImageUpload {
  fileName: string;
  contentType: string;
  base64Content: string;
  altText?: string;
}

export interface SnapshotManifest {
  version: number;
  bucketUrl: string;
  checksum: string;
  publishedAtUtc: string;
}

export const cmsDeliveryRepository = {
  async getTheme(): Promise<ThemeResponse> {
    const response = await apiClient.get<ThemeResponse>("/api/cms/admin/theme");
    return response.data;
  },

  async updateTheme(tokens: ThemeTokens): Promise<ThemeResponse> {
    const response = await apiClient.put<ThemeResponse>("/api/cms/admin/theme", { tokens });
    return response.data;
  },

  async getImageSlots(pageKey?: string): Promise<ScreenImageSlot[]> {
    const response = await apiClient.get<ScreenImageSlot[]>("/api/cms/admin/image-slots", {
      params: { pageKey },
    });
    return response.data;
  },

  async createImageSlot(payload: ScreenImageSlotUpsert): Promise<ScreenImageSlot> {
    const response = await apiClient.post<ScreenImageSlot>("/api/cms/admin/image-slots", payload);
    return response.data;
  },

  async updateImageSlot(id: number, payload: ScreenImageSlotUpsert): Promise<ScreenImageSlot> {
    const response = await apiClient.put<ScreenImageSlot>(`/api/cms/admin/image-slots/${id}`, payload);
    return response.data;
  },

  async uploadImage(id: number, payload: ScreenImageUpload): Promise<ScreenImageSlot> {
    const response = await apiClient.post<ScreenImageSlot>(`/api/cms/admin/image-slots/${id}/upload`, payload);
    return response.data;
  },

  async publish(): Promise<SnapshotManifest> {
    const response = await apiClient.post<SnapshotManifest>("/api/cms/publish");
    return response.data;
  },

  async getManifest(): Promise<SnapshotManifest | null> {
    try {
      const response = await apiClient.get<SnapshotManifest>("/api/cms/snapshot/manifest");
      return response.data;
    } catch {
      // 404 = nothing published yet.
      return null;
    }
  },

  async rollback(version: number): Promise<SnapshotManifest> {
    const response = await apiClient.post<SnapshotManifest>(`/api/cms/rollback/${version}`);
    return response.data;
  },
};
