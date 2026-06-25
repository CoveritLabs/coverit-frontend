// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  FlowEditorConnectResponse as ContractFlowEditorConnectResponse,
  FlowEditorDetailResponse as ContractFlowEditorDetailResponse,
  FlowEditorDraftStep as ContractFlowEditorDraftStep,
  FlowEditorElementRef as ContractFlowEditorElementRef,
  FlowEditorStepStateLabel as ContractFlowEditorStepStateLabel,
  FlowEditorTestFlowSummary as ContractFlowEditorTestFlowSummary,
  FlowEditorTransitionStep as ContractFlowEditorTransitionStep,
  SaveFlowEditorStepsRequest as ContractSaveFlowEditorStepsRequest,
  SaveFlowEditorStepsResponse as ContractSaveFlowEditorStepsResponse,
} from "@coveritlabs/contracts";
import type { Payload } from "@shared/types/common";

export type TestFlowType = "MANUAL" | "BUG_REPRODUCTION" | "COVERAGE";
export type TestFlowTypeFilter = "all" | TestFlowType;
export type TestFlowStatus = "NEEDS_GENERATION" | "STALE" | "GENERATED";
export type FlowEditorStepKind = "design-class" | "design-operation" | "assertion" | "action-hook" | "group";
export type FlowEditorPositionEdge = "before" | "after";
export type FlowEditorLabelingStatus = "COMPLETED" | "PENDING" | "QUEUED" | "MISSING";

export interface ListTestFlowsRequest {
  versionId?: string;
  sessionId?: string;
  type?: TestFlowType;
  cursor?: string;
  limit?: number;
}

type ContractTestFlow = Payload<ContractFlowEditorTestFlowSummary>;
type ContractElementRef = Payload<ContractFlowEditorElementRef>;
type ContractDraftStep = Payload<ContractFlowEditorDraftStep>;
type ContractStepStateLabel = Payload<ContractFlowEditorStepStateLabel>;
type ContractTransitionStep = Payload<ContractFlowEditorTransitionStep>;
type ContractDetailResponse = Payload<ContractFlowEditorDetailResponse>;
type ContractSaveRequest = Payload<ContractSaveFlowEditorStepsRequest>;
type ContractSaveResponse = Payload<ContractSaveFlowEditorStepsResponse>;

export type TestFlow = Omit<ContractTestFlow, "testFlowType" | "status" | "generatedAt" | "crawlSession"> & {
  testFlowType: TestFlowType;
  status: TestFlowStatus;
  generatedAt: string | null;
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

export type FlowEditorStepStateLabel = Omit<ContractStepStateLabel, "labelingStatus"> & {
  labelingStatus: FlowEditorLabelingStatus;
};

export type FlowEditorElementRef = Omit<ContractElementRef, "selectorCandidates" | "attributes" | "box" | "viewport"> & {
  selectorCandidates?: string[];
  attributes?: Record<string, string>;
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
};

export type FlowEditorDraftStep = Omit<ContractDraftStep, "kind" | "position" | "element" | "definition"> & {
  kind: FlowEditorStepKind;
  position: {
    edge: FlowEditorPositionEdge;
    transitionId: string;
  };
  element?: FlowEditorElementRef;
  definition: Record<string, unknown>;
};

export type FlowEditorTransitionStep = Omit<ContractTransitionStep, "labelingStatus" | "fromState" | "toState"> & {
  labelingStatus: FlowEditorLabelingStatus;
  fromState?: FlowEditorStepStateLabel;
  toState?: FlowEditorStepStateLabel;
};

export type FlowEditorDetailResponse = Omit<ContractDetailResponse, "flow" | "transitionSteps" | "editorSteps"> & {
  flow: TestFlow;
  transitionSteps: FlowEditorTransitionStep[];
  editorSteps: FlowEditorDraftStep[];
};

export type SaveFlowEditorStepsRequest = Omit<ContractSaveRequest, "editorSteps"> & {
  editorSteps: FlowEditorDraftStep[];
};

export type SaveFlowEditorStepsResponse = Omit<ContractSaveResponse, "editorSteps"> & {
  editorSteps: FlowEditorDraftStep[];
};

export type FlowEditorConnectResponse = Payload<ContractFlowEditorConnectResponse>;

export interface RegressionCodebaseOption {
  id: string;
  frameworkName?: string;
  repositoryUrl: string;
}
