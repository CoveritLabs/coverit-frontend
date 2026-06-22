// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ProjectActivity,
  ProjectCoverageSummary,
  ProjectLatestCrawlSession,
  ProjectLatestRun,
  ProjectLatestTestFlow,
  ProjectRunStatistics,
  TargetApplicationResponse,
} from "@coveritlabs/contracts";
import { Activity, AlertTriangle, CheckCircle2, Clock3, FlaskConical, XCircle } from "lucide-react";
import { useUIStore } from "@app/store";
import { useProjectDashboard } from "@features/dashboard";
import { useTargetApplications } from "@features/target-applications";
import { ContentErrorPanel } from "@shared/feedback/ContentErrorPanel";
import { PageLoader } from "@shared/feedback/PageLoader/PageLoader";
import { Badge, Card, Select } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import styles from "./Dashboard.module.scss";

const LATEST_VERSION_VALUE = "latest";
const EMPTY_COVERAGE: ProjectCoverageSummary = { percentage: 0, coveredTransitions: 0, totalTransitions: 0 } as ProjectCoverageSummary;
const EMPTY_RUN_STATISTICS: ProjectRunStatistics = {
  passedCount: 0,
  warningCount: 0,
  failedCount: 0,
  reportedWarningCount: 0,
  reportedFailedCount: 0,
  totalRuns: 0,
} as ProjectRunStatistics;

type StatusTone = "success" | "warning" | "danger" | "running" | "neutral";

type VersionOption = {
  value: string;
  label: string;
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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className={styles.emptyState}>
      <Activity className={styles.emptyIcon} />
      <h3>{title}</h3>
      <p>{description}</p>
    </Card>
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

function StatusBadge({ status }: { status: string }) {
  const tone = getStatusTone(status);
  return <Badge className={cn(styles.statusBadge, styles[`badge_${tone}`])}>{titleCase(status)}</Badge>;
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

function LatestRuns({ runs }: { runs: ProjectLatestRun[] }) {
  if (runs.length === 0) return <p className={styles.panelEmpty}>No regression runs yet.</p>;

  return (
    <div className={styles.list}>
      {runs.map((run) => (
        <div key={run.id} className={styles.listItem}>
          <div className={styles.listMain}>
            <strong>{run.displayName}</strong>
            <span>
              {run.applicationName}
              {run.version ? ` / ${run.version}` : ""}
            </span>
          </div>
          <div className={styles.listMeta}>
            <StatusBadge status={run.status} />
            <span>{formatDateTime(run.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LatestCrawlSessions({ sessions }: { sessions: ProjectLatestCrawlSession[] }) {
  if (sessions.length === 0) return <p className={styles.panelEmpty}>No crawl sessions yet.</p>;

  return (
    <div className={styles.list}>
      {sessions.map((session) => (
        <div key={session.id} className={styles.listItem}>
          <div className={styles.listMain}>
            <strong>{session.applicationName}</strong>
            <span>
              {session.version} / {formatNumber(session.stateCount)} states / {formatNumber(session.transitionCount)} transitions
            </span>
          </div>
          <div className={styles.listMeta}>
            <StatusBadge status={session.status} />
            <span>{formatDateTime(session.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LatestTestFlows({ flows }: { flows: ProjectLatestTestFlow[] }) {
  if (flows.length === 0) return <p className={styles.panelEmpty}>No test flows generated yet.</p>;

  return (
    <div className={styles.list}>
      {flows.map((flow) => (
        <div key={flow.id} className={styles.listItem}>
          <div className={styles.listMain}>
            <strong>{flow.applicationName}</strong>
            <span>
              {flow.version} / {flow.stepCount} steps / {flow.isClipped ? "Clipped" : "Complete"}
            </span>
          </div>
          <div className={styles.listMeta}>
            <Badge variant="outline" className={styles.hashBadge}>
              {flow.checkpointStateHash.slice(0, 8)}
            </Badge>
            <span>{formatDateTime(flow.createdAt)}</span>
          </div>
        </div>
      ))}
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

function buildVersionOptions(applications: TargetApplicationResponse[]): VersionOption[] {
  const versionOptions = applications.flatMap((application) =>
    (application.versions ?? []).map((version) => ({
      value: version.id,
      label: `${application.name} / ${version.version}`,
    })),
  );

  return [{ value: LATEST_VERSION_VALUE, label: "Latest version" }, ...versionOptions];
}

function Dashboard() {
  const selectedProject = useUIStore((state) => state.selectedProject);
  const [selectedVersionId, setSelectedVersionId] = useState<string>(LATEST_VERSION_VALUE);
  const {
    data: applications = [],
    isLoading: applicationsLoading,
    isError: applicationsError,
  } = useTargetApplications(selectedProject?.id ?? null);

  const versionOptions = useMemo(() => buildVersionOptions(applications), [applications]);
  const resolvedVersionId = selectedVersionId === LATEST_VERSION_VALUE ? undefined : selectedVersionId;
  const dashboardQuery = useProjectDashboard(selectedProject?.id ?? null, resolvedVersionId);
  const dashboard = dashboardQuery.data;

  useEffect(() => {
    if (selectedVersionId === LATEST_VERSION_VALUE) return;
    const versionExists = versionOptions.some((option) => option.value === selectedVersionId);
    if (!versionExists) setSelectedVersionId(LATEST_VERSION_VALUE);
  }, [selectedVersionId, versionOptions]);

  if (!selectedProject) {
    return <EmptyState title="Choose a project" description="Select a project from the sidebar to view dashboard statistics." />;
  }

  if (applicationsLoading && !dashboard) {
    return <PageLoader />;
  }

  if (applicationsError) {
    return <ContentErrorPanel title="Failed to load dashboard filters" message="Project applications could not be loaded." />;
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

  const stats = dashboard.runStatistics ?? EMPTY_RUN_STATISTICS;
  const coverage = dashboard.coverage ?? EMPTY_COVERAGE;
  const resolvedVersionLabel = dashboard.selectedVersion
    ? `${dashboard.selectedVersion.applicationName} / ${dashboard.selectedVersion.version}`
    : "No version available";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{selectedProject.name}</h1>
          <p>Project scope dashboard</p>
        </div>
        <div className={styles.headerControls}>
          <span className={styles.versionLabel}>Version</span>
          <Select
            options={versionOptions}
            value={selectedVersionId}
            onChange={(value) => setSelectedVersionId(value ?? LATEST_VERSION_VALUE)}
            disabled={versionOptions.length <= 1}
            className={styles.versionSelect}
          />
        </div>
      </header>

      <section className={styles.kpiGrid}>
        <KpiCard
          label="Test Coverage"
          value={formatPercent(coverage.percentage)}
          helper={`${formatNumber(coverage.coveredTransitions)} of ${formatNumber(coverage.totalTransitions)} transitions on ${resolvedVersionLabel}`}
          icon={<FlaskConical />}
          tone={coverage.percentage >= 80 ? "success" : coverage.percentage > 0 ? "warning" : "neutral"}
        />
        <KpiCard
          label="Passed"
          value={formatNumber(stats.passedCount)}
          helper={`${formatNumber(stats.totalRuns)} total runs`}
          icon={<CheckCircle2 />}
          tone="success"
        />
        <KpiCard
          label="Warnings"
          value={formatNumber(stats.warningCount)}
          helper={`${formatNumber(stats.reportedWarningCount)} reported`}
          icon={<AlertTriangle />}
          tone="warning"
        />
        <KpiCard
          label="Failed"
          value={formatNumber(stats.failedCount)}
          helper={`${formatNumber(stats.reportedFailedCount)} reported`}
          icon={<XCircle />}
          tone="danger"
        />
      </section>

      <section className={styles.coveragePanel}>
        <Card className={styles.coverageCard}>
          <div className={styles.coverageHeader}>
            <div>
              <h2>Coverage</h2>
              <p>{coverage.crawlSessionId ? `Latest crawl session ${coverage.crawlSessionId}` : "No crawl session available"}</p>
            </div>
            <strong>{formatPercent(coverage.percentage)}</strong>
          </div>
          <div className={styles.coverageTrack}>
            <span style={{ width: `${Math.min(100, Math.max(0, coverage.percentage))}%` }} />
          </div>
        </Card>
      </section>

      <main className={styles.contentGrid}>
        <SectionCard title="Latest Runs" caption="Most recent regression runs across this project">
          <LatestRuns runs={dashboard.latestRuns ?? []} />
        </SectionCard>
        <SectionCard title="Latest Crawl Sessions" caption="Newest crawl sessions across applications">
          <LatestCrawlSessions sessions={dashboard.latestCrawlSessions ?? []} />
        </SectionCard>
        <SectionCard title="Latest Test Flows" caption="Newest generated flows across applications">
          <LatestTestFlows flows={dashboard.latestTestFlows ?? []} />
        </SectionCard>
        <SectionCard title="Recent Activity" caption="Successful project changes recorded by API middleware">
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
