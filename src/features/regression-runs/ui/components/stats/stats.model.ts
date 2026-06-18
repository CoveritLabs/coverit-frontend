// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  RegressionRunListItem,
  RegressionRunsResultPoint,
  RegressionRunsStatsModel,
  RegressionRunsStatusPoint,
} from "../../../model/types/regression-runs.types";

const RESULT_COLORS = {
  pass: "#2e9f75",
  warn: "#d69026",
  fail: "var(--destructive)",
} as const;

const STATUS_COLORS = {
  running: "var(--chart-2)",
  passed: "var(--chart-4)",
  failed: "var(--destructive)",
  warning: "#d69026",
} as const;

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], percentileValue: number) {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function withPercent<T extends { value: number }>(items: T[], total: number) {
  return items.map((item) => ({
    ...item,
    percent: total === 0 ? 0 : item.value / total,
  }));
}

function getCompletedRuns(runs: RegressionRunListItem[]) {
  return runs.filter((run) => run.status !== "running");
}

function getRunsWithDuration(runs: RegressionRunListItem[]) {
  return runs.filter((run) => typeof run.durationMs === "number" && run.durationMs > 0);
}

export function buildRegressionRunsStats(runs: RegressionRunListItem[]): RegressionRunsStatsModel {
  const totalRuns = runs.length;
  const completedRunsList = getCompletedRuns(runs);
  const runsWithDuration = getRunsWithDuration(completedRunsList);
  const durations = runsWithDuration.map((run) => run.durationMs ?? 0);

  const runningRuns = runs.filter((run) => run.status === "running").length;
  const completedRuns = completedRunsList.length;
  const passedRuns = completedRunsList.filter((run) => run.status === "passed").length;
  const failedRuns = completedRunsList.filter((run) => run.status === "failed").length;
  const warningRuns = completedRunsList.filter((run) => run.warningCount > 0).length;
  const warningStatusRuns = completedRunsList.filter((run) => run.status === "passed" && run.warningCount > 0).length;
  const totalPassedCount = runs.reduce((sum, run) => sum + run.passedCount, 0);
  const totalWarningCount = runs.reduce((sum, run) => sum + run.warningCount, 0);
  const totalFailedCount = runs.reduce((sum, run) => sum + run.failedCount, 0);
  const slowestRun = runsWithDuration.reduce<RegressionRunListItem | null>(
    (slowest, run) => (!slowest || (run.durationMs ?? 0) > (slowest.durationMs ?? 0) ? run : slowest),
    null,
  );

  const summary = {
    totalRuns,
    runningRuns,
    completedRuns,
    passedRuns,
    failedRuns,
    warningRuns,
    completedPassRate: completedRuns === 0 ? null : passedRuns / completedRuns,
    totalPassedCount,
    totalWarningCount,
    totalFailedCount,
    averageDurationMs: average(durations),
    medianDurationMs: percentile(durations, 50),
    p95DurationMs: percentile(durations, 95),
    slowestRun,
    averagePassedPerRun: totalRuns === 0 ? 0 : totalPassedCount / totalRuns,
    averageWarningsPerRun: totalRuns === 0 ? 0 : totalWarningCount / totalRuns,
    averageFailuresPerRun: totalRuns === 0 ? 0 : totalFailedCount / totalRuns,
  };

  const trend = runs
    .slice()
    .reverse()
    .map((run, index) => ({
      label: `Run ${index + 1}`,
      runId: run.runId,
      version: run.versionName,
      status: run.status,
      passed: run.passedCount,
      failed: run.failedCount,
      warnings: run.warningCount,
      durationMs: run.durationMs ?? 0,
    }));

  const resultTotal = totalPassedCount + totalWarningCount + totalFailedCount;
  const resultBreakdown: RegressionRunsResultPoint[] = withPercent(
    [
      { name: "Pass", value: totalPassedCount, color: RESULT_COLORS.pass },
      { name: "Warn", value: totalWarningCount, color: RESULT_COLORS.warn },
      { name: "Fail", value: totalFailedCount, color: RESULT_COLORS.fail },
    ],
    resultTotal,
  );

  const statusDistribution: RegressionRunsStatusPoint[] = withPercent(
    [
      { name: "Running", value: runningRuns, color: STATUS_COLORS.running },
      { name: "Passed", value: Math.max(0, passedRuns - warningStatusRuns), color: STATUS_COLORS.passed },
      { name: "Failed", value: failedRuns, color: STATUS_COLORS.failed },
      { name: "Warning", value: warningStatusRuns, color: STATUS_COLORS.warning },
    ],
    totalRuns,
  );

  return {
    summary,
    trend,
    statusDistribution,
    resultBreakdown,
  };
}
