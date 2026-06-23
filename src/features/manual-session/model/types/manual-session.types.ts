// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export type RouteParams = {
  projectId: string;
  applicationId: string;
  versionId: string;
  sessionId: string;
};

export type LocationState = {
  applicationName?: string;
  applicationBaseUrl?: string;
  versionName?: string;
};

export type ApplicationVersionView = {
  id: string;
  version: string;
};

export type ApplicationView = {
  id: string;
  name: string;
  baseUrl?: string | null;
  versions?: ApplicationVersionView[];
};

export type RecordedEvent = {
  id?: string;
  timestamp?: string;
  action?: string;
  selector?: string;
  selectorCandidates?: string[];
  selector_candidates?: string[];
  interactiveSelector?: string;
  interactive_selector?: string;
  element?: string;
  targetSelector?: string;
  target_selector?: string;
  tag?: string | null;
  role?: string;
  targetRole?: string;
  label?: string;
  text?: string;
  accessibleName?: string;
  pageUrl?: string;
  value?: string | null;
  optionValue?: string;
  optionText?: string;
  inputType?: string;
  key?: string;
  fromUrl?: string;
  x?: number;
  y?: number;
};

export type PendingRecordedEvent = RecordedEvent & {
  receivedAt: number;
};

export type BrowserSelectOption = {
  value: string;
  text: string;
  disabled?: boolean;
};

export type BrowserSelectPayload = {
  selector: string;
  selectorCandidates?: string[];
  value?: string;
  label?: string;
  optionText?: string;
  options: BrowserSelectOption[];
  elementBox?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  viewport?: {
    width?: number;
    height?: number;
  };
};

export type RecordedAction = {
  id?: string;
  type?: string;
  selector?: string;
  value?: string;
  description?: string;
};

export type RecordedStep = {
  id?: string;
  stepId?: string;
  index?: number;
  flowRevision?: number;
  transitionId?: string;
  sourceStateHash?: string;
  targetStateHash?: string;
  sourceUrl?: string;
  targetUrl?: string;
  pageUrl?: string;
  title?: string;
  timestamp?: string;
  description?: string;
  action?: string;
  selector?: string;
  value?: string;
  events?: RecordedEvent[];
  actions?: RecordedAction[];
};

export type VisibleStepItem = {
  key: string;
  index: string;
  label: string;
  detail: string;
  pending: boolean;
  finalizedEvent: boolean;
  canContinue: boolean;
  step: RecordedStep | null;
};

export type ManualAction = "start" | "reset" | "continue" | "finish" | "bug" | "disconnect";

export type ActionFeedback = {
  kind: "pending" | "success" | "error";
  message: string;
};

export type WsPayload = {
  type?: string;
  status?: string;
  message?: string;
  dataUrl?: string;
  url?: string;
  pageUrl?: string;
  title?: string;
  timestamp?: string;
  flowId?: string;
  checkpointHash?: string;
  transitionIds?: string[];
  testFlowType?: string;
  stepCount?: number;
  flowRevision?: number;
  eventIds?: string[];
  reason?: string;
  events?: RecordedEvent[];
  steps?: RecordedStep[];
  step?: RecordedStep;
  select?: BrowserSelectPayload;
  keptStepIds?: string[];
  removedStepIds?: string[];
  stateHash?: string;
  viewport?: {
    width?: number;
    height?: number;
  };
  ttlSeconds?: number;
  remainingSeconds?: number;
  expiresAt?: string;
  resetAt?: string;
  event?: RecordedEvent;
};
