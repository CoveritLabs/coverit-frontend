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

export interface RegressionCodebaseOption {
  id: string;
  frameworkName?: string;
  repositoryUrl: string;
}
