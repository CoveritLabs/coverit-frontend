// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { env } from "@shared/config/env";
import type {
  FlowEditorDraftStep,
  FlowEditorElementRef,
  FlowEditorTransitionStep,
} from "@features/test-flows/model/types/test-flows.types";
import type { EditorPosition, FlowEditorViewportSize } from "./flow-editor.types";

export const DEFAULT_VIEWPORT: FlowEditorViewportSize = { width: 1365, height: 768 };

export function buildWsUrl(editorSessionId: string, ticket: string) {
  const base = env.wsUrl?.replace(/\/$/, "");
  if (!base) return "";
  return `${base}/ws/flow-editors/${encodeURIComponent(editorSessionId)}?ticket=${encodeURIComponent(ticket)}`;
}

export function compactId(value: string) {
  return value.length > 10 ? value.slice(0, 10) : value;
}

export function positionKey(position: EditorPosition) {
  return `${position.edge}:${position.transitionId}`;
}

export function elementBoxStyle(element: FlowEditorElementRef | null, viewport: FlowEditorViewportSize) {
  if (!element?.box || viewport.width <= 0 || viewport.height <= 0) return undefined;
  return {
    left: `${(element.box.x / viewport.width) * 100}%`,
    top: `${(element.box.y / viewport.height) * 100}%`,
    width: `${(element.box.width / viewport.width) * 100}%`,
    height: `${(element.box.height / viewport.height) * 100}%`,
  };
}

export function isSameElement(left: FlowEditorElementRef | null, right: FlowEditorElementRef | null) {
  if (!left || !right) return false;
  if (left.selector && left.selector === right.selector) return true;
  if (!left.box || !right.box) return false;
  return (
    left.tag === right.tag &&
    left.box.x === right.box.x &&
    left.box.y === right.box.y &&
    left.box.width === right.box.width &&
    left.box.height === right.box.height
  );
}

export function labelingStatusLabel(status: FlowEditorTransitionStep["labelingStatus"]) {
  if (status === "COMPLETED") return "Labeled";
  if (status === "QUEUED") return "Queued";
  if (status === "PENDING") return "Pending";
  return "Missing";
}

export function computePriorKeys(
  step: FlowEditorDraftStep,
  draftsByPosition: Map<string, FlowEditorDraftStep[]>,
  transitionSteps: FlowEditorTransitionStep[],
): Set<string> {
  const keys = new Set<string>();
  const stepPosition = step.position;
  if (!stepPosition) return keys;

  for (const transition of transitionSteps) {
    const beforeDrafts = draftsByPosition.get(`before:${transition.transitionId}`);
    if (beforeDrafts) {
      for (const draft of beforeDrafts) {
        if (draft.id === step.id) return keys;
        collectSetKeys(draft, keys);
      }
    }

    if (stepPosition.edge === "before" && stepPosition.transitionId === transition.transitionId) return keys;

    const afterDrafts = draftsByPosition.get(`after:${transition.transitionId}`);
    if (afterDrafts) {
      for (const draft of afterDrafts) {
        if (draft.id === step.id) return keys;
        collectSetKeys(draft, keys);
      }
    }

    if (stepPosition.edge === "after" && stepPosition.transitionId === transition.transitionId) return keys;
  }

  return keys;
}

function collectSetKeys(step: FlowEditorDraftStep, keys: Set<string>) {
  const definition = step.definition as Record<string, unknown> | undefined;
  if (!definition) return;
  const type = definition.type as string | undefined;
  if (type && ["set", "append", "prepend", "merge"].includes(type)) {
    const key = definition.key as string | undefined;
    if (key?.trim()) keys.add(key.trim());
  }
}
