// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export type TestFlowType = "MANUAL" | "BUG_REPRODUCTION" | "COVERAGE";
export type TestFlowTypeFilter = "all" | TestFlowType;
export type TestFlowStatus = "NEEDS_GENERATION" | "STALE" | "GENERATED";

export interface ListTestFlowsRequest {
  versionId?: string;
  sessionId?: string;
  type?: TestFlowType;
  cursor?: string;
  limit?: number;
}

export interface TestFlow {
  id: string;
  crawlSessionId: string;
  appVersionId: string;
  appVersionName: string;
  checkpointStateHash: string;
  transitionRefs: string[];
  testFlowType: TestFlowType;
  stepCount: number;
  editorStepCount: number;
  status: TestFlowStatus;
  createdAt: string;
  generatedAt: string | null;
  modifiedAt: string;
  crawlSession: {
    id: string;
    triggerType: string;
    status: string;
    createdAt: string;
    finishedAt?: string | null;
  };
}

export interface ListTestFlowsResponse {
  flows: TestFlow[];
  nextCursor?: string | null;
}

export interface CodegenConfigInput {
  codegenBranch: string;
  prTargetBranch: string;
  prTitle?: string;
  prBody?: string;
  prDraft?: boolean;
}

export interface GenerateTestFlowRequest {
  regressionCodebaseId: string;
  codegenConfig: CodegenConfigInput;
}

export interface GenerateTestFlowResponse {
  message: string;
  flowId: string;
  jobId: string;
}

export type FlowEditorStepKind = "design-class" | "design-operation" | "assertion" | "action-hook" | "group";
export type FlowEditorPositionEdge = "before" | "after";
export type FlowEditorLabelingStatus = "COMPLETED" | "PENDING" | "QUEUED" | "MISSING";
export type FlowEditorValueType = "string" | "number" | "integer" | "currency" | "boolean" | "date" | "json" | "array" | "object";
export type FlowEditorCodeLanguage = "typescript";

export type FlowEditorValueSpec =
  | { literal: unknown }
  | { from: string }
  | { source: "extract"; id: string }
  | { source: "store" | "arg" | "context" | "env"; path: string }
  | { expressionId: string; args?: Record<string, FlowEditorValueSpec> }
  | { functionId: string; args?: Record<string, FlowEditorValueSpec> }
  | { code: FlowEditorInlineCodeBlock; args?: Record<string, FlowEditorValueSpec> }
  | { fields: Record<string, FlowEditorValueSpec> }
  | { list: FlowEditorValueSpec[] };

export interface FlowEditorInlineCodeBlock {
  language: FlowEditorCodeLanguage;
  body: string;
  imports?: string[];
  inputSchema?: unknown;
  outputSchema?: unknown;
}

export interface FlowEditorStepStateLabel {
  stateHash: string;
  label: string;
  labelingStatus: FlowEditorLabelingStatus;
}

export interface FlowEditorElementRef {
  selector?: string;
  selectorCandidates?: string[];
  tag?: string | null;
  text?: string;
  accessibleName?: string;
  attributes?: Record<string, string>;
  pageUrl?: string;
  stateHash?: string;
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface FlowEditorDraftStep {
  id: string;
  kind: FlowEditorStepKind;
  position: {
    edge: FlowEditorPositionEdge;
    transitionId: string;
  };
  order: number;
  label: string;
  element?: FlowEditorElementRef;
  definition: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FlowEditorTransitionStep {
  id: string;
  index: number;
  transitionId: string;
  label: string;
  action?: string;
  labelingStatus: FlowEditorLabelingStatus;
  fromState?: FlowEditorStepStateLabel;
  toState?: FlowEditorStepStateLabel;
}

export interface FlowEditorDetailResponse {
  flow: TestFlow;
  transitionSteps: FlowEditorTransitionStep[];
  editorSteps: FlowEditorDraftStep[];
}

export interface SaveFlowEditorStepsResponse {
  editorSteps: FlowEditorDraftStep[];
  editorStepCount: number;
}

export interface FlowEditorConnectResponse {
  editorSessionId: string;
  wsTicket: string;
}

export interface RegressionCodebaseOption {
  id: string;
  frameworkName?: string;
  repositoryUrl: string;
}
