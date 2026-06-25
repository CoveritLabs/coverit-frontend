// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  FlowEditorDraftStep,
  FlowEditorElementRef,
  FlowEditorPositionEdge,
} from "@features/test-flows/model/types/test-flows.types";

export type FlowEditorPanelTab = "flow" | "editor";

export type EditorPosition = {
  edge: FlowEditorPositionEdge;
  transitionId: string;
};

export type FlowEditorViewportSize = {
  width: number;
  height: number;
};

export type WsPayload = {
  type?: string;
  message?: string;
  dataUrl?: string;
  pageUrl?: string;
  title?: string;
  stateHash?: string;
  position?: EditorPosition | null;
  element?: FlowEditorElementRef | null;
  viewport?: Partial<FlowEditorViewportSize>;
};

export type FlowEditorInsertHandler = (step: FlowEditorDraftStep) => void;
