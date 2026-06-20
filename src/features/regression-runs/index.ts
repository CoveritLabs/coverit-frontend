// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export { regressionRunService } from "./api/regressionRunService";
export { default as RegressionRuns } from "./ui/RegressionRuns";
export { RegressionSemanticMarker } from "./ui/RegressionSemanticMarker";
export {
  useRegressionArtifact,
  useRegressionRun,
  useRegressionRunArtifacts,
  useRegressionRuns,
  useRegressionScenario,
  useRegressionScenarioArtifacts,
  useRegressionScenarioEvents,
  useRegressionScenarios,
} from "./model/queries/useRegressionRuns";
export { useRegressionRunDownloads } from "./model/queries/useRegressionRunDownloads";
export type {
  RegressionArtifact as RegressionArtifactResponse,
  RegressionArtifactTreeNode as RegressionArtifactTreeNodeResponse,
  RegressionEvent as RegressionEventResponse,
  RegressionRun as RegressionRunResponse,
  RegressionScenario as RegressionScenarioResponse,
} from "@coveritlabs/contracts";
export type { RegressionRunStatusValue } from "./model/types/regression-runs.types";
