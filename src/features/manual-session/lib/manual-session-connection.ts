// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { CLOSE_DELAY_MS } from "../model/constants/manual-session.constants";

type SharedConnection = {
  ws: WebSocket;
  closeTimer?: number;
};

const sharedConnections = new Map<string, SharedConnection>();

export function acquireConnection(key: string, url: string) {
  const existing = sharedConnections.get(key);
  if (existing && existing.ws.readyState !== WebSocket.CLOSING && existing.ws.readyState !== WebSocket.CLOSED) {
    if (existing.closeTimer) {
      window.clearTimeout(existing.closeTimer);
      existing.closeTimer = undefined;
    }
    return existing.ws;
  }

  const ws = new WebSocket(url);
  sharedConnections.set(key, { ws });
  return ws;
}

export function releaseConnection(key: string, closeNow = false) {
  const entry = sharedConnections.get(key);
  if (!entry) return;

  if (entry.closeTimer) {
    window.clearTimeout(entry.closeTimer);
    entry.closeTimer = undefined;
  }

  if (closeNow) {
    entry.ws.close(1000, "Manual recording closed");
    sharedConnections.delete(key);
    return;
  }

  entry.closeTimer = window.setTimeout(() => {
    entry.ws.close(1000, "Manual recording page left");
    sharedConnections.delete(key);
  }, CLOSE_DELAY_MS);
}

export function forgetConnection(key: string, ws: WebSocket) {
  const entry = sharedConnections.get(key);
  if (entry?.ws === ws) {
    sharedConnections.delete(key);
  }
}
