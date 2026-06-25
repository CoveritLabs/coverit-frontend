// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function statusLabel(status: string) {
  if (status === "crawler_connected") return "Crawler Connected";
  if (status === "frontend_connected") return "Frontend Connected";
  if (status === "starting_browser") return "Starting Browser";
  if (status === "running") return "Live";
  if (status === "crawler_disconnected") return "Crawler Disconnected";
  if (status === "disconnect_pending") return "Disconnect Pending";
  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
