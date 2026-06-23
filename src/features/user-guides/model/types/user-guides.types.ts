// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export interface UserGuideApplication {
  id: string;
  name: string;
}

export interface UserGuideVersion {
  id: string;
  name: string;
}

export interface RawUserGuideSession {
  id: string;
  createdAt: string;
  label?: string;
}

export interface UserGuideSession extends RawUserGuideSession {
  displayName: string;
  sessionNumber: number;
}

export type UserGuideStateKind = "PAGE" | "DRAWER" | "FLOW";

export interface UserGuideState {
  stateHash: string;
  label: string;
  path: string;
  url?: string;
  title?: string;
  kind?: UserGuideStateKind;
}

export interface GenerateGuideParams {
  projectId: string;
  applicationId: string;
  versionId: string;
  sessionId: string;
  startStateHash: string;
  endStateHash: string;
}

export interface GenerateGuideResult {
  lines: string[];
}
