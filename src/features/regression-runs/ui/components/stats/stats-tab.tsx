// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ReactNode } from "react";
import { Activity, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@shared/ui";
import { buildRegressionRunsStats } from "./stats.model";
import { EmptyState } from "../common/common";
import type { RegressionRunListItem, RegressionRunsTrendPoint } from "../../../model/types/regression-runs.types";
import { formatDuration } from "../../../lib/formatters";
import styles from "../../RegressionRuns.module.scss";

const CHART_GRID_STROKE = "var(--border)";
const CHART_GRID_DASH = "3 3";
const CHART_TEXT_COLOR = "var(--text-secondary)";
const CHART_RUNNING_COLOR = "var(--primary)";
const RESULT_COLORS = {
  pass: "#2e9f75",
  warn: "#d69026",
  fail: "var(--destructive)",
} as const;

function formatPercent(value: number | null) {
  return value == null ? "Pending" : `${Math.round(value * 100)}%`;
}

function formatNumber(value: number) {
  return value.toFixed(1);
}

function formatDurationTick(value: number) {
  return value > 0 ? formatDuration(value) : "0s";
}

function formatStatus(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getChartTickInterval(pointCount: number) {
  if (pointCount <= 8) return 0;
  return Math.max(0, Math.ceil(pointCount / 10) - 1);
}

function PrimaryKpiCard({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string | number;
  helper: string;
  accent?: string;
}) {
  return (
    <Card className={styles.statsKpiCard} style={accent ? { borderLeftColor: accent } : undefined}>
      <span className={styles.statsKpiLabel}>{label}</span>
      <strong className={styles.statsKpiValue}>{value}</strong>
      <span className={styles.statsKpiHelper}>{helper}</span>
    </Card>
  );
}

function StatsSection({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <section className={styles.statsSection}>
      <div className={styles.statsSectionHeader}>
        <span>{title}</span>
        <p>{caption}</p>
      </div>
      {children}
    </section>
  );
}

function ChartGrid() {
  return <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray={CHART_GRID_DASH} vertical={false} />;
}

function ChartXAxis({ interval }: { interval: number }) {
  return (
    <XAxis
      dataKey="label"
      interval={interval}
      tick={{ fill: CHART_TEXT_COLOR, fontSize: 11 }}
      tickLine={false}
      axisLine={{ stroke: CHART_GRID_STROKE }}
      minTickGap={12}
    />
  );
}

function ChartYAxis({ width = 42, tickFormatter }: { width?: number; tickFormatter?: (value: number) => string }) {
  return (
    <YAxis
      tickFormatter={tickFormatter}
      tick={{ fill: CHART_TEXT_COLOR, fontSize: 11 }}
      tickLine={false}
      axisLine={false}
      width={width}
    />
  );
}

function ResultBreakdownCard({
  results,
}: {
  results: Array<{ name: string; value: number; color: string; percent: number }>;
}) {
  const total = results.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={styles.statsChartCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Result breakdown</h3>
          <p>Current filtered run set</p>
        </div>
      </div>

      {total === 0 ? (
        <div className={styles.statsEmpty}>No result counts recorded yet.</div>
      ) : (
        <>
          <div className={styles.statsSegmentBar} aria-label="Pass warning fail result distribution">
            {results.map((item) => (
              <span
                key={item.name}
                style={{
                  flexGrow: item.value,
                  width: item.value === 0 ? "2px" : undefined,
                  background: item.color,
                  opacity: item.value === 0 ? 0.35 : 1,
                }}
                title={`${item.name}: ${item.value}`}
              />
            ))}
          </div>
          <div className={styles.statsResultRows}>
            {results.map((item) => (
              <div key={item.name} className={styles.statsResultRow}>
                <span>
                  <i style={{ background: item.color }} />
                  {item.name}
                </span>
                <strong>{item.value}</strong>
                <em>{(item.percent * 100).toFixed(1)}%</em>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function ResultRatesCard({ items }: { items: Array<{ label: string; value: string | number; color: string }> }) {
  return (
    <Card className={styles.statsChartCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Result rates</h3>
          <p>Average test case outcomes per run</p>
        </div>
      </div>
      <div className={styles.statsRateList}>
        {items.map((item) => (
          <div key={item.label} className={styles.statsRateRow}>
            <span>
              <i style={{ background: item.color }} />
              {item.label}
            </span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatusDistributionCard({
  statuses,
}: {
  statuses: Array<{ name: string; value: number; color: string; percent: number }>;
}) {
  const total = statuses.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={styles.statsChartCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Runs by status</h3>
          <p>Completed and active run state</p>
        </div>
      </div>

      {total === 0 ? (
        <div className={styles.statsEmpty}>No runs match the selected filters.</div>
      ) : (
        <div className={styles.statusDistributionList}>
          {statuses.map((item) => (
            <div key={item.name} className={styles.statusDistributionRow}>
              <span>{item.name}</span>
              <strong>{item.value}</strong>
              <div className={styles.statusDistributionTrack}>
                <span
                  style={{ width: `${Math.max(item.percent * 100, item.value > 0 ? 2 : 0)}%`, background: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SummaryCard({
  title,
  caption,
  icon: Icon,
  accent,
  items,
  note,
}: {
  title: string;
  caption: string;
  icon: LucideIcon;
  accent: string;
  items: Array<{ label: string; value: string | number; tone?: "default" | "good" | "bad" }>;
  note?: string;
}) {
  return (
    <Card className={styles.statsSummaryCard}>
      <div className={styles.statsSummaryHeader}>
        <span style={{ color: accent, background: `color-mix(in oklab, ${accent} 13%, transparent)` }}>
          <Icon size={17} />
        </span>
        <div>
          <h3>{title}</h3>
          <p>{caption}</p>
        </div>
      </div>
      <div className={styles.statsMetricStrip}>
        {items.map((item) => (
          <div key={item.label} className={styles.statsMetricItem}>
            <span>{item.label}</span>
            <strong
              className={
                item.tone === "good"
                  ? styles.metricValueGood
                  : item.tone === "bad"
                    ? styles.metricValueBad
                    : styles.metricValue
              }
            >
              {item.value}
            </strong>
          </div>
        ))}
      </div>
      {note && <div className={styles.statsSummaryNote}>{note}</div>}
    </Card>
  );
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RegressionRunsTrendPoint; dataKey?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className={styles.statsTooltip}>
      <strong>{point.runId}</strong>
      <span>{point.version}</span>
      <span>Status: {formatStatus(point.status)}</span>
      <span>Duration: {formatDurationTick(point.durationMs)}</span>
      <span>Pass: {point.passed}</span>
      <span>Warn: {point.warnings}</span>
      <span>Fail: {point.failed}</span>
    </div>
  );
}

export function RegressionStatsTab({ runs }: { runs: RegressionRunListItem[] }) {
  if (runs.length === 0) {
    return (
      <EmptyState
        title="No runs match the selected filters"
        description="Adjust filters to see statistics for regression runs."
      />
    );
  }

  const stats = buildRegressionRunsStats(runs);
  const durationTrend = stats.trend.filter((run) => run.durationMs > 0);
  const chartTickInterval = getChartTickInterval(stats.trend.length);
  const testCaseTotal =
    stats.summary.totalPassedCount + stats.summary.totalWarningCount + stats.summary.totalFailedCount;

  return (
    <div className={styles.statsColumn}>
      <StatsSection title="Run-level results" caption={`${stats.summary.totalRuns} runs in the current filter set`}>
        <div className={styles.statsKpiGrid}>
          <PrimaryKpiCard label="Total runs" value={stats.summary.totalRuns} helper="Current filter set" />
          <PrimaryKpiCard
            label="Active runs"
            value={stats.summary.runningRuns}
            helper={stats.summary.runningRuns === 1 ? "Currently running" : "Currently running"}
            accent={CHART_RUNNING_COLOR}
          />
          <PrimaryKpiCard
            label="Completed runs"
            value={stats.summary.completedRuns}
            helper={`${stats.summary.passedRuns} passed / ${stats.summary.failedRuns} failed`}
            accent="var(--chart-4)"
          />
          <PrimaryKpiCard
            label="Completed pass rate"
            value={formatPercent(stats.summary.completedPassRate)}
            helper="Based on completed runs only"
            accent={
              stats.summary.completedPassRate != null && stats.summary.completedPassRate < 0.5
                ? RESULT_COLORS.fail
                : RESULT_COLORS.pass
            }
          />
        </div>

        {stats.summary.completedRuns === 0 && (
          <Card className={styles.statsNotice}>
            <strong>No completed runs yet.</strong>
            <span>Pass rate will appear once at least one run finishes.</span>
          </Card>
        )}

        <StatusDistributionCard statuses={stats.statusDistribution} />
      </StatsSection>

      <StatsSection
        title="Test case results"
        caption={`${testCaseTotal} assertion results captured across the filtered runs`}
      >
        <div className={styles.statsSplitGrid}>
          <ResultBreakdownCard results={stats.resultBreakdown} />
          <ResultRatesCard
            items={[
              {
                label: "Pass / run",
                value: formatNumber(stats.summary.averagePassedPerRun),
                color: RESULT_COLORS.pass,
              },
              {
                label: "Warn / run",
                value: formatNumber(stats.summary.averageWarningsPerRun),
                color: RESULT_COLORS.warn,
              },
              {
                label: "Fail / run",
                value: formatNumber(stats.summary.averageFailuresPerRun),
                color: RESULT_COLORS.fail,
              },
            ]}
          />
        </div>

        <Card className={styles.statsChartCard}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Run results trend</h3>
              <p>Pass, warning, and failure test case counts by run</p>
            </div>
          </div>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.trend}>
                <ChartGrid />
                <ChartXAxis interval={chartTickInterval} />
                <ChartYAxis />
                <Tooltip
                  content={<TrendTooltip />}
                  cursor={{ fill: "color-mix(in oklab, var(--muted) 55%, transparent)" }}
                />
                <Bar dataKey="passed" stackId="results" fill={RESULT_COLORS.pass} radius={[4, 4, 0, 0]} />
                <Bar dataKey="warnings" stackId="results" fill={RESULT_COLORS.warn} />
                <Bar dataKey="failed" stackId="results" fill={RESULT_COLORS.fail} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </StatsSection>

      <StatsSection title="Execution duration" caption="Timing behavior for completed runs with reported duration">
        <div className={styles.statsWideGrid}>
          <Card className={styles.statsChartCard}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Duration trend</h3>
                <p>
                  Avg {formatDurationTick(stats.summary.averageDurationMs)} / Median{" "}
                  {formatDurationTick(stats.summary.medianDurationMs)} / P95{" "}
                  {formatDurationTick(stats.summary.p95DurationMs)}
                </p>
              </div>
            </div>
            {durationTrend.length === 0 ? (
              <div className={styles.statsEmpty}>Duration trend will appear after completed runs report duration.</div>
            ) : (
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={durationTrend}>
                    <ChartGrid />
                    <ChartXAxis interval={chartTickInterval} />
                    <ChartYAxis tickFormatter={formatDurationTick} width={64} />
                    <Tooltip content={<TrendTooltip />} cursor={{ stroke: CHART_GRID_STROKE }} />
                    <Line
                      type="monotone"
                      dataKey="durationMs"
                      stroke={CHART_RUNNING_COLOR}
                      strokeWidth={2.25}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div className={styles.statsSummaryStack}>
            <SummaryCard
              title="Duration summary"
              caption="Completed run timing"
              icon={Timer}
              accent={CHART_RUNNING_COLOR}
              items={[
                { label: "Average", value: formatDurationTick(stats.summary.averageDurationMs) },
                { label: "Median", value: formatDurationTick(stats.summary.medianDurationMs) },
                { label: "P95", value: formatDurationTick(stats.summary.p95DurationMs) },
                {
                  label: "Slowest",
                  value: stats.summary.slowestRun
                    ? formatDurationTick(stats.summary.slowestRun.durationMs ?? 0)
                    : "Pending",
                },
              ]}
              note={
                stats.summary.slowestRun
                  ? `Slowest run: ${stats.summary.slowestRun.runId} / ${stats.summary.slowestRun.versionName}`
                  : "Slowest run will appear once a completed run reports duration."
              }
            />
            <SummaryCard
              title="Result summary"
              caption="Test case totals"
              icon={Activity}
              accent={RESULT_COLORS.pass}
              items={[
                { label: "Pass", value: stats.summary.totalPassedCount, tone: "good" },
                { label: "Warnings", value: stats.summary.totalWarningCount },
                {
                  label: "Failures",
                  value: stats.summary.totalFailedCount,
                  tone: stats.summary.totalFailedCount > 0 ? "bad" : "default",
                },
              ]}
              note={
                stats.summary.totalFailedCount === 0 && stats.summary.totalWarningCount === 0
                  ? "No failed or warning test cases detected in the current filter set."
                  : `${stats.summary.totalWarningCount} warnings / ${stats.summary.totalFailedCount} failures in the current filter set.`
              }
            />
          </div>
        </div>
      </StatsSection>
    </div>
  );
}
