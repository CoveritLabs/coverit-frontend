// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { RegressionRun as RegressionRunResponse, TargetApplicationVersionResponse } from "@coveritlabs/contracts";
import type { RegressionRunListItem } from "../types/regression-runs.types";

type ApplicationVersion = NonNullable<TargetApplicationVersionResponse[]>[number];

export function buildVersionNameMap(versions: ApplicationVersion[] = []) {
  return new Map(versions.map((version) => [version.id, version.version]));
}

export function getRunVersionName(run: RegressionRunResponse, versionNameById: Map<string, string>) {
  if (!run.versionId) return "Latest";
  return versionNameById.get(run.versionId) ?? "Unknown version";
}

export function enrichRegressionRun(
  run: RegressionRunResponse,
  versionNameById: Map<string, string>,
): RegressionRunListItem {
  return {
    ...run,
    versionName: getRunVersionName(run, versionNameById),
  };
}

export function enrichRegressionRuns(
  runs: RegressionRunResponse[],
  versionNameById: Map<string, string>,
): RegressionRunListItem[] {
  return runs.map((run) => enrichRegressionRun(run, versionNameById));
}
