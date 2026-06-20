// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { downloadArtifact } from "./downloadArtifact";
import { getArtifact, listRunArtifacts, listScenarioArtifacts } from "./regressionArtifactsApi";
import { getRun, listRuns } from "./regressionRunsApi";
import { getScenario, listScenarioEvents, listScenarios } from "./regressionScenariosApi";

export const regressionRunService = {
  listRuns,
  getRun,
  listScenarios,
  getScenario,
  listScenarioEvents,
  listRunArtifacts,
  listScenarioArtifacts,
  getArtifact,
  downloadArtifact,
};
