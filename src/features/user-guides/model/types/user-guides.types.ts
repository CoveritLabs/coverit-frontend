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

export type UserGuideStateKind = "PAGE" | "DRAWER" | "FLOW";

export interface UserGuideState {
  stateHash: string;
  label: string;
  path: string;
  displayLabel: string;
  displayPath: string;
  copyUrl: string;
  url?: string;
  title?: string;
  kind?: UserGuideStateKind;
}

export interface GenerateGuideParams {
  projectId: string;
  applicationId: string;
  versionId: string;
  startStateHash: string;
  endStateHash: string;
}

export interface GenerateGuideResult {
  lines: string[];
}
