// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export type TestFlowClippedFilter = "all" | "complete" | "clipped";

export interface ListTestFlowsRequest {
  versionId?: string;
  sessionId?: string;
  clipped?: boolean;
  cursor?: string;
  limit?: number;
}

export interface TestFlow {
  id: string;
  crawlSessionId: string;
  appVersionId: string;
  targetStateHash: string;
  checkpointStateHash: string;
  checkpointUrl: string;
  isClipped: boolean;
  stepCount: number;
  createdAt: string;
}

export interface ListTestFlowsResponse {
  flows: TestFlow[];
  nextCursor?: string | null;
}
