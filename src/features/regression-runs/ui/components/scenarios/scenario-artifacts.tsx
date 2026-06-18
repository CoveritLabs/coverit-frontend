// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { RegressionArtifact, RegressionArtifactTreeNode } from "@coveritlabs/contracts";
import { RegressionArtifactsPanel } from "../artifacts/artifacts-panel";

export function RegressionScenarioArtifacts({
  artifacts,
  artifactTree,
  projectId,
  applicationId,
  runId,
}: {
  artifacts: RegressionArtifact[];
  artifactTree: RegressionArtifactTreeNode[];
  projectId: string;
  applicationId: string;
  runId: string;
}) {
  return (
    <RegressionArtifactsPanel
      title="Scenario artifacts"
      artifacts={artifacts}
      artifactTree={artifactTree}
      projectId={projectId}
      applicationId={applicationId}
      runId={runId}
    />
  );
}
