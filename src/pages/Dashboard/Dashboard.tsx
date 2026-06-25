// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, CheckCircle2, Clock3, FlaskConical, RefreshCw, Route } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUIStore } from "@app/store";
import {
  useProjectDashboard,
  type ProjectActivity,
  type ProjectCoveragePoint,
  type ProjectCrawlSessionTrendPoint,
  type ProjectRunTrendPoint,
  type ProjectTestFlowBreakdownPoint,
} from "@features/dashboard";
import { useProjects } from "@features/projects";
import { applicationContextEquals, buildApplicationContext } from "@features/target-applications";
import { ROUTES } from "@shared/config/routes";
import { ContentErrorPanel } from "@shared/feedback/ContentErrorPanel";
import { PageLoader } from "@shared/feedback/PageLoader/PageLoader";
import { Badge, Button, Card } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import styles from "./Dashboard.module.scss";

const EMPTY_TOTALS = {
  totalStates: 0,
  totalTransitions: 0,
  totalOnDemandSessions: 0,
  totalRuns: 0,
  passedCount: 0,
  warningCount: 0,
  failedCount: 0,
  reportedWarningCount: 0,
  reportedFailedCount: 0,
};

const RESULT_COLORS = {
  passed: "#2e9f75",
  warning: "#d69026",
  failed: "var(--destructive)",
} as const;

const CHART_GRID_STROKE = "var(--border)";
const CHART_TEXT_COLOR = "var(--text-secondary)";

type StatusTone = "success" | "warning" | "danger" | "running" | "neutral";
type ChartTooltipPayload = {
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
  payload?: unknown;
};

function formatDateTime(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat().format(value ?? 0);
}

function formatPercent(value?: number) {
  return `${(value ?? 0).toFixed(value && value % 1 !== 0 ? 1 : 0)}%`;
}

function titleCase(value?: string) {
  if (!value) return "Unknown";
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getStatusTone(status?: string): StatusTone {
  const normalized = status?.toLowerCase();
  if (normalized === "passed" || normalized === "completed" || normalized === "success") return "success";
  if (normalized === "failed" || normalized === "aborted") return "danger";
  if (normalized === "warning") return "warning";
  if (normalized === "running" || normalized === "queued" || normalized === "new" || normalized === "paused") return "running";
  return "neutral";
}

function getActivityLabel(eventType: string) {
  return titleCase(eventType.replace(/\./g, " "));
}

function getOverallCoverage(points: ProjectCoveragePoint[]) {
  const covered = points.reduce((sum, point) => sum + point.coveredTransitions, 0);
  const total = points.reduce((sum, point) => sum + point.totalTransitions, 0);
  return total > 0 ? Math.min(100, (covered / total) * 100) : 0;
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className={styles.emptyState}>
      <Activity className={styles.emptyIcon} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </Card>
  );
}

function PlainEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.plainEmptyState}>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <Card className={cn(styles.kpiCard, styles[`tone_${tone}`])}>
      <div className={styles.kpiTop}>
        <span className={styles.kpiIcon}>{icon}</span>
        <span className={styles.kpiLabel}>{label}</span>
      </div>
      <strong className={styles.kpiValue}>{value}</strong>
      {helper && <span className={styles.kpiHelper}>{helper}</span>}
    </Card>
  );
}

function SectionCard({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  return (
    <Card className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>{title}</h2>
          {caption && <p>{caption}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = getStatusTone(status);
  return <Badge className={cn(styles.statusBadge, styles[`badge_${tone}`])}>{titleCase(status)}</Badge>;
}

function ChartGrid() {
  return <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" vertical={false} />;
}

function ChartXAxis({ dataKey = "label", interval = 0 }: { dataKey?: string; interval?: number }) {
  return (
    <XAxis
      dataKey={dataKey}
      interval={interval}
      tick={{ fill: CHART_TEXT_COLOR, fontSize: 11 }}
      tickLine={false}
      axisLine={{ stroke: CHART_GRID_STROKE }}
      minTickGap={12}
    />
  );
}

function ChartYAxis({ tickFormatter, width = 42 }: { tickFormatter?: (value: number) => string; width?: number }) {
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

function DashboardTooltip({ active, payload, label }: { active?: boolean; payload?: ChartTooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <strong>{label ?? (payload[0]?.payload as { label?: string } | undefined)?.label}</strong>
      {payload.map((item) => (
        <span key={`${item.dataKey}-${item.name}`}>
          {item.name ?? titleCase(String(item.dataKey))}: {formatNumber(Number(item.value))}
        </span>
      ))}
    </div>
  );
}

function CoverageTooltip({ active, payload }: { active?: boolean; payload?: ChartTooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as ProjectCoveragePoint & { label: string };
  return (
    <div className={styles.chartTooltip}>
      <strong>{point.applicationName}</strong>
      <span>{point.version}</span>
      <span>Coverage: {formatPercent(point.percentage)}</span>
      <span>
        {formatNumber(point.coveredTransitions)} / {formatNumber(point.totalTransitions)} transitions
      </span>
      <span>{formatNumber(point.sessionCount)} on-demand sessions</span>
    </div>
  );
}

function RunTooltip({ active, payload }: { active?: boolean; payload?: ChartTooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as ProjectRunTrendPoint & { label: string };
  return (
    <div className={styles.chartTooltip}>
      <strong>{point.displayName}</strong>
      <span>{point.applicationName}{point.version ? ` / ${point.version}` : ""}</span>
      <span>Status: {titleCase(point.status)}</span>
      <span>Pass: {formatNumber(point.passedCount)}</span>
      <span>Warn: {formatNumber(point.warningCount)}</span>
      <span>Fail: {formatNumber(point.failedCount)}</span>
    </div>
  );
}

function CoveragePanel({
  appCoverage,
  versionCoverage,
  selectedApplicationId,
  onSelectApplication,
}: {
  appCoverage: ProjectCoveragePoint[];
  versionCoverage: ProjectCoveragePoint[];
  selectedApplicationId: string | null;
  onSelectApplication: (applicationId: string) => void;
}) {
  const selectedApp = appCoverage.find((point) => point.applicationId === selectedApplicationId) ?? appCoverage[0];
  const versions = selectedApp
    ? versionCoverage.filter((point) => point.applicationId === selectedApp.applicationId)
    : [];
  const chartData = appCoverage.map((point) => ({
    ...point,
    label: point.applicationName,
  }));

  return (
    <Card className={styles.coverageCard}>
      <div className={styles.coverageHeader}>
        <div>
          <h2>Coverage by application</h2>
          <p>Latest version per application, based on completed on-demand sessions</p>
        </div>
        {selectedApp && (
          <Badge variant="outline" className={styles.coverageSelection}>
            {selectedApp.applicationName}
          </Badge>
        )}
      </div>

      {chartData.length === 0 ? (
        <p className={styles.panelEmpty}>Coverage appears after applications have completed on-demand crawls.</p>
      ) : (
        <div className={styles.coverageGrid}>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <ChartGrid />
                <ChartXAxis interval={0} />
                <ChartYAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<CoverageTooltip />} cursor={{ fill: "color-mix(in oklab, var(--muted) 55%, transparent)" }} />
                <Bar
                  dataKey="percentage"
                  name="Coverage"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                  onClick={(point) => {
                    const applicationId =
                      (point as { applicationId?: string; payload?: { applicationId?: string } }).applicationId ??
                      (point as { payload?: { applicationId?: string } }).payload?.applicationId;
                    if (applicationId) onSelectApplication(applicationId);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.versionDrilldown}>
            <div className={styles.versionDrilldownHeader}>
              <span>{selectedApp ? selectedApp.applicationName : "Versions"}</span>
              <strong>{selectedApp ? formatPercent(selectedApp.percentage) : "0%"}</strong>
            </div>
            {versions.length === 0 ? (
              <p className={styles.versionEmpty}>Select an application to compare its versions.</p>
            ) : (
              <div className={styles.versionRows}>
                {versions.map((version) => (
                  <div key={version.versionId} className={styles.versionRow}>
                    <div>
                      <span>{version.version}</span>
                      <strong>{formatPercent(version.percentage)}</strong>
                    </div>
                    <div className={styles.versionTrack}>
                      <span style={{ width: `${Math.min(100, Math.max(0, version.percentage))}%` }} />
                    </div>
                    <em>
                      {formatNumber(version.coveredTransitions)} / {formatNumber(version.totalTransitions)} transitions
                    </em>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function RunsTrend({ runs }: { runs: ProjectRunTrendPoint[] }) {
  const chartData = runs.map((run, index) => ({
    ...run,
    label: `Run ${index + 1}`,
  }));
  const recentRuns = runs.slice(-5).reverse();
  const interval = chartData.length <= 8 ? 0 : Math.ceil(chartData.length / 8) - 1;

  if (runs.length === 0) return <p className={styles.panelEmpty}>No regression runs yet.</p>;

  return (
    <div className={styles.runsPanel}>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <ChartGrid />
            <ChartXAxis interval={interval} />
            <ChartYAxis />
            <Tooltip content={<RunTooltip />} cursor={{ fill: "color-mix(in oklab, var(--muted) 55%, transparent)" }} />
            <Bar dataKey="passedCount" name="Pass" stackId="results" fill={RESULT_COLORS.passed} />
            <Bar dataKey="warningCount" name="Warn" stackId="results" fill={RESULT_COLORS.warning} />
            <Bar dataKey="failedCount" name="Fail" stackId="results" fill={RESULT_COLORS.failed} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.recentRunStrip}>
        {recentRuns.map((run) => (
          <div key={run.id} className={styles.recentRunItem}>
            <div>
              <strong>{run.displayName}</strong>
              <span>{run.applicationName}{run.version ? ` / ${run.version}` : ""}</span>
            </div>
            <StatusBadge status={run.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CrawlTrend({ sessions }: { sessions: ProjectCrawlSessionTrendPoint[] }) {
  const data = sessions.map((session, index) => ({
    ...session,
    label: `Crawl ${index + 1}`,
  }));

  if (sessions.length === 0) return <p className={styles.panelEmpty}>No completed on-demand crawls yet.</p>;

  return (
    <div className={styles.chartWrap}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <ChartGrid />
          <ChartXAxis interval={data.length <= 8 ? 0 : 1} />
          <ChartYAxis />
          <Tooltip content={<DashboardTooltip />} cursor={{ fill: "color-mix(in oklab, var(--muted) 55%, transparent)" }} />
          <Bar dataKey="stateCount" name="States" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="transitionCount" name="Transitions" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TestFlowBreakdown({ flows }: { flows: ProjectTestFlowBreakdownPoint[] }) {
  const data = flows.map((flow) => ({
    ...flow,
    label: titleCase(flow.type),
  }));

  if (flows.length === 0) return <p className={styles.panelEmpty}>No test flows generated yet.</p>;

  return (
    <div className={styles.flowBreakdown}>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <ChartGrid />
            <ChartXAxis interval={0} />
            <ChartYAxis />
            <Tooltip content={<DashboardTooltip />} cursor={{ fill: "color-mix(in oklab, var(--muted) 55%, transparent)" }} />
            <Bar dataKey="generatedCount" name="Generated" stackId="flows" fill="var(--chart-4)" />
            <Bar dataKey="staleCount" name="Stale" stackId="flows" fill="var(--chart-5)" />
            <Bar dataKey="pendingCount" name="Pending" stackId="flows" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.flowRows}>
        {flows.map((flow) => (
          <div key={flow.type} className={styles.flowRow}>
            <span>{titleCase(flow.type)}</span>
            <strong>{formatNumber(flow.count)}</strong>
            <em>{formatNumber(flow.totalSteps)} steps</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivities({ activities }: { activities: ProjectActivity[] }) {
  if (activities.length === 0) return <p className={styles.panelEmpty}>No recent project activity.</p>;

  return (
    <div className={styles.activityList}>
      {activities.map((activity) => (
        <div key={activity.id} className={styles.activityItem}>
          <span className={styles.activityMarker} />
          <div className={styles.activityBody}>
            <div className={styles.activityTitleRow}>
              <strong>{activity.message}</strong>
              <span>{formatDateTime(activity.createdAt)}</span>
            </div>
            <div className={styles.activityMeta}>
              <span>{getActivityLabel(activity.eventType)}</span>
              {activity.actorName && <span>{activity.actorName}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const selectedProject = useUIStore((state) => state.selectedProject);
  const selectedApplicationContext = useUIStore((state) => state.selectedApplicationContext);
  const setSelectedProject = useUIStore((state) => state.setSelectedProject);
  const setSelectedApplicationContext = useUIStore((state) => state.setSelectedApplicationContext);
  const setUserRole = useUIStore((state) => state.setUserRole);
  const { data: projects = [], isLoading: projectsLoading, isPlaceholderData: projectsPlaceholderData } = useProjects();
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const selectedProjectExists = Boolean(
    selectedProject && projects.some((project) => project.id === selectedProject.id),
  );
  const activeProject = projectsLoading || projectsPlaceholderData || selectedProjectExists ? selectedProject : null;
  const dashboardQuery = useProjectDashboard(activeProject?.id ?? null);
  const dashboard = dashboardQuery.data;
  const isRefreshing = dashboardQuery.isFetching;

  const handleRefresh = () => {
    void dashboardQuery.refetch();
  };

  useEffect(() => {
    if (projectsLoading || projectsPlaceholderData || !selectedProject || selectedProjectExists) return;
    setSelectedProject(null);
    setUserRole(null);
  }, [projectsLoading, projectsPlaceholderData, selectedProject, selectedProjectExists, setSelectedProject, setUserRole]);

  useEffect(() => {
    const coverage = dashboard?.coverageByApplication ?? [];
    if (!coverage.length) {
      setSelectedApplicationId(null);
      return;
    }

    const storedApplicationId =
      selectedApplicationContext && activeProject && selectedApplicationContext.projectId === activeProject.id
        ? selectedApplicationContext.applicationId
        : null;
    const storedApplication = storedApplicationId
      ? coverage.find((point) => point.applicationId === storedApplicationId)
      : null;
    const currentApplication = coverage.find((point) => point.applicationId === selectedApplicationId);
    const nextApplication = currentApplication ?? storedApplication ?? coverage[0];

    if (selectedApplicationId !== nextApplication.applicationId) {
      setSelectedApplicationId(nextApplication.applicationId);
    }

    if (activeProject) {
      const nextContext = buildApplicationContext(
        activeProject.id,
        { id: nextApplication.applicationId, name: nextApplication.applicationName },
        { id: nextApplication.versionId, version: nextApplication.version },
      );
      if (!applicationContextEquals(selectedApplicationContext, nextContext)) {
        setSelectedApplicationContext(nextContext);
      }
    }
  }, [activeProject, dashboard?.coverageByApplication, selectedApplicationContext, selectedApplicationId, setSelectedApplicationContext]);

  const handleCoverageApplicationSelect = (applicationId: string) => {
    setSelectedApplicationId(applicationId);

    const coverage = dashboard?.coverageByApplication ?? [];
    const point = coverage.find((item) => item.applicationId === applicationId);
    if (!activeProject || !point) return;

    setSelectedApplicationContext(
      buildApplicationContext(
        activeProject.id,
        { id: point.applicationId, name: point.applicationName },
        { id: point.versionId, version: point.version },
      ),
    );
  };

  if (!activeProject) {
    if (!projectsLoading && !projectsPlaceholderData && projects.length === 0) {
      return (
        <PlainEmptyState
          title="Create a project first"
          description="Dashboard statistics appear after a project exists."
          action={<Button onClick={() => navigate(ROUTES.ADMINISTRATE)}>Create Project</Button>}
        />
      );
    }

    return <EmptyState title="Choose a project" description="Select a project from the sidebar to view dashboard statistics." />;
  }

  if (dashboardQuery.isError) {
    return (
      <ContentErrorPanel
        title="Failed to load project dashboard"
        message="The project statistics request failed."
        error={dashboardQuery.error}
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  if (!dashboard) {
    return <PageLoader />;
  }

  const totals = dashboard.totals ?? EMPTY_TOTALS;
  const overallCoverage = getOverallCoverage(dashboard.coverageByApplication ?? []);
  const reportedIssues = totals.reportedWarningCount + totals.reportedFailedCount;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{activeProject.name}</h1>
          <p>Project scope dashboard</p>
        </div>
        <div className={styles.headerControls}>
          <Button
            size="sm"
            variant="ghost"
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh dashboard"
            title="Refresh"
          >
            <RefreshCw className={cn(styles.refreshIcon, isRefreshing && styles.spinIcon)} />
          </Button>
        </div>
      </header>

      <section className={styles.kpiGrid}>
        <KpiCard
          label="Coverage"
          value={formatPercent(overallCoverage)}
          helper={`${formatNumber(dashboard.coverageByApplication.length)} applications with latest-version coverage`}
          icon={<FlaskConical />}
          tone={overallCoverage >= 80 ? "success" : overallCoverage > 0 ? "warning" : "neutral"}
        />
        <KpiCard
          label="New States"
          value={formatNumber(totals.totalStates)}
          helper={`${formatNumber(totals.totalTransitions)} transitions from ${formatNumber(totals.totalOnDemandSessions)} on-demand sessions`}
          icon={<Route />}
          tone="running"
        />
        <KpiCard
          label="Run Results"
          value={formatNumber(totals.totalRuns)}
          helper={`${formatNumber(totals.passedCount)} pass / ${formatNumber(totals.warningCount)} warn / ${formatNumber(totals.failedCount)} fail`}
          icon={<CheckCircle2 />}
          tone={totals.failedCount > 0 ? "danger" : totals.warningCount > 0 ? "warning" : "success"}
        />
        <KpiCard
          label="Reported"
          value={formatNumber(reportedIssues)}
          helper={`${formatNumber(totals.reportedWarningCount)} warnings / ${formatNumber(totals.reportedFailedCount)} failures reported`}
          icon={<AlertTriangle />}
          tone={reportedIssues > 0 ? "warning" : "neutral"}
        />
      </section>

      <CoveragePanel
        appCoverage={dashboard.coverageByApplication ?? []}
        versionCoverage={dashboard.coverageByVersion ?? []}
        selectedApplicationId={selectedApplicationId}
        onSelectApplication={handleCoverageApplicationSelect}
      />

      <main className={styles.contentGrid}>
        <SectionCard title="Runs Trend" caption="Pass, warning, and failure counts by recent run">
          <RunsTrend runs={dashboard.runTrend ?? []} />
        </SectionCard>
        <SectionCard title="Crawl Discoveries" caption="New states and transitions from completed on-demand sessions">
          <CrawlTrend sessions={dashboard.crawlSessionTrend ?? []} />
        </SectionCard>
        <SectionCard title="Test Flows" caption="Generation status by flow type">
          <TestFlowBreakdown flows={dashboard.testFlowBreakdown ?? []} />
        </SectionCard>
        <SectionCard title="Recent Activity" caption="Project operations recorded after successful actions">
          <RecentActivities activities={dashboard.recentActivities ?? []} />
        </SectionCard>
      </main>

      {dashboardQuery.isFetching && (
        <div className={styles.refreshHint}>
          <Clock3 size={14} />
          Refreshing
        </div>
      )}
    </div>
  );
}

export default Dashboard;
