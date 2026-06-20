// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { SetURLSearchParams } from "react-router-dom";
import type { RegressionArtifact as RegressionArtifactResponse, RegressionRun } from "@coveritlabs/contracts";
import type { ArtifactPreviewKind } from "../model/types/regression-runs.types";

export function formatDateTime(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeTime(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = date.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  return formatter.format(days, "day");
}

export function formatDuration(durationMs?: number) {
  if (!durationMs || durationMs <= 0) return "In progress";
  if (durationMs < 1000) return `${durationMs} ms`;
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function formatStatus(value: RegressionRun["status"]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatArtifactKind(kind: RegressionArtifactResponse["kind"]) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function getArtifactPreviewKind(artifact: RegressionArtifactResponse): ArtifactPreviewKind {
  if (artifact.contentType?.startsWith("image/") || artifact.kind === "screenshot") return "image";
  if (artifact.contentType?.startsWith("video/") || artifact.kind === "video") return "video";
  if (isTextPreviewArtifact(artifact)) return "text";
  return "none";
}

const TEXT_CONTENT_TYPES = new Set([
  "application/json",
  "application/x-ndjson",
  "application/ndjson",
  "application/xml",
  "application/javascript",
  "application/yaml",
]);

const TEXT_PREVIEW_EXTENSIONS = [
  ".log",
  ".json",
  ".ndjson",
  ".txt",
  ".md",
  ".csv",
  ".xml",
  ".yaml",
  ".yml",
  ".html",
  ".htm",
  ".js",
  ".ts",
  ".css",
];

export function formatTextArtifactPreview(artifact: RegressionArtifactResponse, text: string): string {
  if (!isJsonArtifact(artifact)) return text;
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function isTextPreviewArtifact(artifact: RegressionArtifactResponse): boolean {
  const contentType = artifact.contentType?.split(";")[0]?.trim().toLowerCase();
  if (contentType?.startsWith("text/")) return true;
  if (contentType && TEXT_CONTENT_TYPES.has(contentType)) return true;

  const name = artifact.name.toLowerCase();
  return TEXT_PREVIEW_EXTENSIONS.some((extension) => name.endsWith(extension));
}

function isJsonArtifact(artifact: RegressionArtifactResponse): boolean {
  const contentType = artifact.contentType?.split(";")[0]?.trim().toLowerCase();
  if (contentType === "application/json") return true;
  return artifact.name.toLowerCase().endsWith(".json");
}

export function formatBytes(bytes?: number | bigint) {
  if (!bytes || bytes <= 0) return "Unknown size";
  if (typeof bytes === "bigint") {
    if (bytes > BigInt(Number.MAX_SAFE_INTEGER)) return `${bytes.toString()} B`;
    bytes = Number(bytes);
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function safeJson(value: unknown): string {
  if (value == null) return "No payload";
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

export function updateSearchParams(
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
  updates: Record<string, string | null>,
  replace = true,
) {
  const next = new URLSearchParams(searchParams);
  Object.entries(updates).forEach(([key, value]) => {
    if (!value) next.delete(key);
    else next.set(key, value);
  });
  setSearchParams(next, { replace });
}
