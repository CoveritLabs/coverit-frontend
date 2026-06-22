// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useAuthStore, useUIStore } from "@app/store";
import { getProjectUserRole } from "@features/projects";
import type {
  ApplicationDetailStats,
  ApplicationDetailTab,
  CrawlSchedule,
  CrawlSession,
  CrawlSessionStatus,
  CrawlSessionStatusFilter,
  CrawlSessionTrigger,
  CrawlSessionTriggerFilter,
  CreateCrawlSessionInput,
  RegressionCodebaseConfig,
  ScheduleFrequency,
} from "@features/target-applications";
import {
  useApplicationDetails,
  useCrawlSchedules,
  useCrawlSession,
  useCrawlSessions,
  useCreateCrawlSession,
  useCreateTargetApplication,
  useCreateTargetApplicationVersion,
  useDeleteCrawlSchedule,
  useDeleteTargetApplication,
  useDeleteTargetApplicationVersion,
  useRegressionConfig,
  useReattachManualSession,
  useRotateTargetApplicationApiKey,
  useSaveCrawlSchedule,
  useSaveRegressionCodebaseConfig,
  useStartCrawlSession,
  useTargetApplications,
  useToggleCrawlSchedule,
  useUpdateTargetApplication,
} from "@features/target-applications";
import { GRADIENTS } from "@shared/constants/gradients";
import { ROUTES } from "@shared/config/routes";
import { Badge, Button, Card, Input } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Edit2,
  GitBranch,
  Globe,
  KeyRound,
  LoaderCircle,
  Network,
  Play,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Applications.module.scss";
import {
  AddApplicationModal,
  AddVersionModal,
  CreateCrawlSessionModal,
  DeleteApplicationModal,
  DeleteScheduleModal,
  DeleteVersionModal,
  EditApplicationModal,
  RegressionCodebaseConfigModal,
  RotateApiKeyModal,
  ScheduleConfigModal,
} from "./ApplicationsModals";

type ModalState =
  | { type: "none" }
  | { type: "addApplication" }
  | { type: "editApplication" }
  | { type: "deleteApplication" }
  | { type: "addVersion" }
  | { type: "deleteVersion" }
  | { type: "rotateApiKey" }
  | { type: "regressionConfig" }
  | { type: "createSession" }
  | { type: "scheduleConfig" }
  | { type: "deleteSchedule" };

type ModalAction = { type: ModalState["type"] };

interface ApplicationVersionView {
  id: string;
  version: string;
}

interface ApplicationView {
  id: string;
  name: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  versions?: ApplicationVersionView[];
}

const modalReducer = (_: ModalState, action: ModalAction): ModalState =>
  action.type === "none" ? { type: "none" } : { type: action.type };

const STATUS_FILTERS: Array<{ value: CrawlSessionStatusFilter; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "not_started", label: "Not Started" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "running", label: "Running" },
  { value: "in_progress", label: "In Progress" },
];

const TRIGGER_FILTERS: Array<{ value: CrawlSessionTriggerFilter; label: string }> = [
  { value: "all", label: "All Triggers" },
  { value: "manual", label: "Manual" },
  { value: "scheduled", label: "Scheduled" },
];

const DEFAULT_STATS: ApplicationDetailStats = {
  versionCount: 0,
  crawledCount: 0,
  statesDiscovered: 0,
  lastCrawlDate: "—",
};

function formatStatus(status: CrawlSessionStatus) {
  if (status === "not_started") return "Not Started";
  if (status === "in_progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatTrigger(trigger: CrawlSessionTrigger) {
  return trigger.charAt(0).toUpperCase() + trigger.slice(1);
}

function formatFrequency(frequency: ScheduleFrequency) {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

function parseUtcDate(value: string) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
    dateTime: `${year}-${month}-${day} ${hours}:${minutes}`,
  };
}

function getStatusClass(status: CrawlSessionStatus) {
  if (status === "not_started") return styles.sessionStatusPending;
  if (status === "success") return styles.sessionStatusSuccess;
  if (status === "failed") return styles.sessionStatusFailed;
  if (status === "running") return styles.sessionStatusRunning;
  return styles.sessionStatusProgress;
}

function getStatusIcon(status: CrawlSessionStatus) {
  if (status === "not_started") return Clock;
  if (status === "success") return CheckCircle2;
  if (status === "failed") return XCircle;
  if (status === "running") return LoaderCircle;
  return Clock;
}

function isActiveSession(status: CrawlSessionStatus) {
  return status === "running" || status === "in_progress";
}

function manualSessionRoute(projectId: string, applicationId: string, versionId: string, sessionId: string) {
  return ROUTES.MANUAL_RECORDING.replace(":projectId", projectId)
    .replace(":applicationId", applicationId)
    .replace(":versionId", versionId)
    .replace(":sessionId", sessionId);
}

function createEmptyRegressionConfig(): RegressionCodebaseConfig {
  return {
    repositoryUrl: "",
    repositoryPath: "",
  };
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function StatCard({
  icon: Icon,
  value,
  label,
  tone = "default",
}: {
  icon: LucideIcon;
  value: ReactNode;
  label: string;
  tone?: "default" | "success";
}) {
  return (
    <Card className={styles.detailStatCard}>
      <span className={cn(styles.detailStatIcon, tone === "success" && styles.detailStatIconSuccess)}>
        <Icon className={styles.iconLarge} />
      </span>
      <span>
        <strong className={styles.detailStatValue}>{value}</strong>
        <span className={styles.detailStatLabel}>{label}</span>
      </span>
    </Card>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={cn(styles.detailTab, active && styles.detailTabActive)} onClick={onClick}>
      {children}
    </button>
  );
}

function FilterPill<T extends string>({
  active,
  value,
  children,
  onClick,
}: {
  active: boolean;
  value: T;
  children: ReactNode;
  onClick: (value: T) => void;
}) {
  return (
    <button
      type="button"
      className={cn(styles.filterPill, active && styles.filterPillActive)}
      onClick={() => onClick(value)}
    >
      {children}
    </button>
  );
}

function RegressionCodebaseCard({ config, onEdit }: { config?: RegressionCodebaseConfig | null; onEdit: () => void }) {
  const hasConfig = Boolean(config?.repositoryPath || config?.repositoryUrl);

  return (
    <Card className={styles.regressionCard}>
      <div className={styles.regressionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Regression Codebase</h3>
          <p className={styles.sectionSubtitle}>Test generation configuration</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className={styles.iconButton}
          onClick={onEdit}
          aria-label="Edit regression codebase"
        >
          {hasConfig ? <Edit2 className={styles.iconSmall} /> : <Plus className={styles.iconSmall} />}
        </Button>
      </div>

      {hasConfig && config ? (
        <div className={styles.regressionBody}>
          <div className={styles.repoLine}>
            <GitBranch className={styles.iconSmallMuted} />
            <strong>{config.repositoryPath}</strong>
          </div>
        </div>
      ) : (
        <div className={styles.emptyCodebase}>
          <span>No codebase configured</span>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Plus className={styles.iconSmall} />
            Configure Codebase
          </Button>
        </div>
      )}
    </Card>
  );
}

function DetailsTop({
  stats,
  regressionConfig,
  onEditRegression,
}: {
  stats: ApplicationDetailStats;
  regressionConfig?: RegressionCodebaseConfig | null;
  onEditRegression: () => void;
}) {
  return (
    <>
      <div className={styles.detailStatsGrid}>
        <StatCard icon={Tag} value={stats.versionCount} label="VERSIONS" />
        <StatCard icon={BadgeCheck} value={stats.crawledCount} label="CRAWLED" tone="success" />
        <StatCard icon={Network} value={stats.statesDiscovered} label="STATES DISCOVERED" />
        <StatCard icon={Clock} value={stats.lastCrawlDate} label="LAST CRAWL" />
      </div>

      <RegressionCodebaseCard config={regressionConfig} onEdit={onEditRegression} />
    </>
  );
}

function SessionsTable({
  sessions,
  totalSessions,
  statusFilter,
  triggerFilter,
  onStatusFilterChange,
  onTriggerFilterChange,
  onCreate,
  canCreate,
  createDisabledReason,
  onView,
  onStart,
  startingSessionId,
}: {
  sessions: CrawlSession[];
  totalSessions: number;
  statusFilter: CrawlSessionStatusFilter;
  triggerFilter: CrawlSessionTriggerFilter;
  onStatusFilterChange: (value: CrawlSessionStatusFilter) => void;
  onTriggerFilterChange: (value: CrawlSessionTriggerFilter) => void;
  onCreate: () => void;
  canCreate: boolean;
  createDisabledReason?: string;
  onView: (sessionId: string) => void;
  onStart: (sessionId: string) => void;
  startingSessionId?: string | null;
}) {
  return (
    <Card className={styles.sessionsPanel}>
      <div className={styles.sessionsPanelHeader}>
        <div>
          <h3 className={styles.sectionTitle}>All Sessions</h3>
          <p className={styles.sectionSubtitle}>
            Showing {sessions.length} of {totalSessions} sessions
          </p>
        </div>
        <Button
          size="sm"
          onClick={onCreate}
          disabled={!canCreate}
          title={!canCreate ? createDisabledReason : undefined}
        >
          <Plus className={styles.iconSmall} />
          Create Session
        </Button>
      </div>

      <div className={styles.sessionsFilterBar}>
        <div className={styles.filterGroup}>
          {STATUS_FILTERS.map((filter) => (
            <FilterPill
              key={filter.value}
              active={statusFilter === filter.value}
              value={filter.value}
              onClick={onStatusFilterChange}
            >
              {filter.label}
            </FilterPill>
          ))}
        </div>
        <div className={styles.filterGroup}>
          {TRIGGER_FILTERS.map((filter) => (
            <FilterPill
              key={filter.value}
              active={triggerFilter === filter.value}
              value={filter.value}
              onClick={onTriggerFilterChange}
            >
              {filter.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className={styles.sessionsTableWrap}>
        {totalSessions === 0 ? (
          <div className={styles.noSessionsState}>
            <Clock className={styles.noSessionsIcon} />
            <p>No crawl sessions yet</p>
            <Button
              size="sm"
              variant="link"
              className={styles.startCrawlButton}
              onClick={onCreate}
              disabled={!canCreate}
              title={!canCreate ? createDisabledReason : undefined}
            >
              Create Session
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className={styles.sessionsEmpty}>No sessions match the selected filters.</div>
        ) : (
          <table className={styles.sessionsTable}>
            <thead>
              <tr>
                <th>Started</th>
                <th>Status</th>
                <th>Trigger</th>
                <th>States</th>
                <th>Transitions</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const StatusIcon = getStatusIcon(session.status);
                const statusClass = getStatusClass(session.status);
                const isRunning = isActiveSession(session.status);
                return (
                  <tr key={session.id}>
                    <td>
                      <span className={styles.startedCell}>
                        <StatusIcon
                          className={cn(
                            styles.sessionStatusIcon,
                            statusClass,
                            isRunning && styles.sessionStatusAnimated,
                          )}
                        />
                        <strong>{parseUtcDate(session.startedAt).dateTime}</strong>
                      </span>
                    </td>
                    <td>
                      <Badge className={cn(styles.sessionBadge, statusClass)}>{formatStatus(session.status)}</Badge>
                    </td>
                    <td>
                      <Badge variant="outline" className={styles.triggerBadge}>
                        {formatTrigger(session.trigger)}
                      </Badge>
                    </td>
                    <td>
                      <strong>{session.statesDiscovered}</strong>
                    </td>
                    <td>
                      <strong>{session.transitionsDiscovered}</strong>
                    </td>
                    <td>
                      <span className={styles.durationCell}>
                        {session.durationMinutes ? (
                          <>
                            <Clock className={styles.iconTinyMuted} />
                            {session.durationMinutes}m
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </td>
                    <td>
                      <div className={styles.sessionActions}>
                        {session.status === "not_started" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStart(session.id)}
                            disabled={startingSessionId === session.id}
                          >
                            <Play className={styles.iconSmall} />
                            {startingSessionId === session.id ? "Starting..." : "Start Crawl"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className={styles.iconButton}
                          onClick={() => onView(session.id)}
                          aria-label={`View session ${session.id}`}
                          title="View"
                        >
                          <ChevronRight className={styles.iconSmall} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

function SchedulesPanel({
  schedules,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}: {
  schedules: CrawlSchedule[];
  onAdd: () => void;
  onEdit: (schedule: CrawlSchedule) => void;
  onToggle: (scheduleId: string) => void;
  onDelete: (schedule: CrawlSchedule) => void;
}) {
  return (
    <section className={styles.schedulesSection}>
      <div className={styles.schedulesHeader}>
        <h3 className={styles.sectionTitle}>Scheduled Crawls</h3>
        <Button size="sm" onClick={onAdd}>
          <Plus className={styles.iconSmall} />
          Add Schedule
        </Button>
      </div>

      <div className={styles.scheduleList}>
        {schedules.map((schedule) => (
          <Card key={schedule.id} className={styles.scheduleRow}>
            <Calendar className={styles.iconMediumMuted} />
            <button type="button" className={styles.scheduleInfo} onClick={() => onEdit(schedule)}>
              <strong>{schedule.title}</strong>
              <span>{schedule.cron}</span>
              <span>Next run: {schedule.nextRun}</span>
            </button>
            <button
              type="button"
              className={cn(styles.toggle, schedule.enabled && styles.toggleEnabled)}
              onClick={() => onToggle(schedule.id)}
              aria-pressed={schedule.enabled}
              aria-label={`${schedule.enabled ? "Disable" : "Enable"} schedule`}
            >
              <span />
            </button>
            <Button
              size="sm"
              variant="ghost"
              className={styles.iconButton}
              onClick={() => onEdit(schedule)}
              aria-label="Edit schedule"
            >
              <Edit2 className={styles.iconSmall} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn(styles.iconButton, styles.dangerButton)}
              onClick={() => onDelete(schedule)}
              aria-label="Delete schedule"
            >
              <Trash2 className={styles.iconSmall} />
            </Button>
          </Card>
        ))}
        {schedules.length === 0 && <Card className={styles.scheduleEmpty}>No scheduled crawls yet.</Card>}
      </div>
    </section>
  );
}

function ConfigSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  return (
    <div className={styles.detailsCollapse}>
      <button type="button" className={styles.detailsCollapseHeader} onClick={() => setOpen((value) => !value)}>
        <ChevronDown className={cn(styles.iconSmall, open && styles.chevronOpen)} />
        <span>{title}</span>
      </button>
      {open && <div className={styles.detailsCollapseBody}>{children}</div>}
    </div>
  );
}

function SessionDetailsPanel({
  session,
  appName,
  selectedVersionName,
  onClose,
  onRerun,
  onReattach,
  reattaching,
}: {
  session: CrawlSession;
  appName: string;
  selectedVersionName?: string;
  onClose: () => void;
  onRerun: (session: CrawlSession) => void;
  onReattach: (session: CrawlSession) => void;
  reattaching: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const StatusIcon = getStatusIcon(session.status);
  const statusClass = getStatusClass(session.status);
  const isInProgress = isActiveSession(session.status);
  const canReattach = session.trigger === "manual" && isActiveSession(session.status);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(session.applicationBaseUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={styles.detailsOverlay} onClick={onClose}>
      <aside className={styles.detailsPanel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.detailsHeader}>
          <span className={styles.detailsBreadcrumb}>
            {appName} / {selectedVersionName ?? session.versionName} / Session
          </span>
          <Button
            size="sm"
            variant="ghost"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Close session details"
          >
            <X className={styles.iconSmall} />
          </Button>
        </div>

        <Badge className={cn(styles.detailsStatusBadge, statusClass)}>
          <StatusIcon className={cn(styles.iconSmall, isInProgress && styles.sessionStatusAnimated)} />
          {formatStatus(session.status)}
        </Badge>

        <div className={styles.detailsMetaGrid}>
          <span>
            <small>STARTED</small>
            <strong>{parseUtcDate(session.startedAt).dateTime}</strong>
          </span>
          <span>
            <small>FINISHED</small>
            <strong>{session.finishedAt ? parseUtcDate(session.finishedAt).dateTime : "In progress"}</strong>
          </span>
          <span>
            <small>DURATION</small>
            <strong>{session.durationMinutes ? `${session.durationMinutes}m` : "In progress"}</strong>
          </span>
          <span>
            <small>TRIGGER</small>
            <Badge variant="outline" className={styles.triggerBadge}>
              {formatTrigger(session.trigger)}
            </Badge>
          </span>
        </div>

        <div className={styles.detailsStatGrid}>
          <StatCard icon={Network} value={session.statesDiscovered} label="STATES DISCOVERED" />
          <StatCard icon={Zap} value={session.transitionsDiscovered} label="TRANSITIONS DISCOVERED" />
        </div>

        <div className={styles.baseUrlGroup}>
          <LabelText>BASE URL</LabelText>
          <div className={styles.copyField}>
            <code>{session.applicationBaseUrl}</code>
            <Button
              size="sm"
              variant="ghost"
              className={styles.iconButton}
              onClick={handleCopy}
              aria-label="Copy base URL"
            >
              {copied ? <CheckCircle2 className={styles.iconSmall} /> : <Copy className={styles.iconSmall} />}
            </Button>
          </div>
        </div>

        <ConfigSection title="Crawl Config" defaultOpen>
          <pre className={styles.codeBlock}>{safeJson(session.crawlConfig)}</pre>
        </ConfigSection>

        <ConfigSection title="Codegen Config">
          <pre className={styles.codeBlock}>{safeJson(session.codegenConfig)}</pre>
        </ConfigSection>

        {session.schedule && (
          <Card className={styles.linkedScheduleCard}>
            <Calendar className={styles.iconMedium} />
            <span>
              <strong>Linked Schedule</strong>
              <small>Type: {formatFrequency(session.schedule.frequency)}</small>
              <small>Cron: {session.schedule.cron}</small>
              <small>Next run: {session.schedule.nextRun}</small>
            </span>
          </Card>
        )}

        <div className={styles.detailsFooter}>
          <Button onClick={() => (canReattach ? onReattach(session) : onRerun(session))} disabled={reattaching}>
            <Play className={styles.iconSmall} />
            {canReattach ? (reattaching ? "Reattaching..." : "Reattach") : "Re-run Crawl"}
          </Button>
        </div>
      </aside>
    </div>
  );
}

function LabelText({ children }: { children: ReactNode }) {
  return <span className={styles.fieldLabel}>{children}</span>;
}

const Applications = () => {
  const selectedProject = useUIStore((s) => s.selectedProject);
  const navigate = useNavigate();
  const { data: applications = [], isLoading, isError } = useTargetApplications(selectedProject?.id ?? null);
  const createTargetApplication = useCreateTargetApplication();
  const updateTargetApplication = useUpdateTargetApplication();
  const deleteTargetApplication = useDeleteTargetApplication();
  const createTargetApplicationVersion = useCreateTargetApplicationVersion();
  const deleteTargetApplicationVersion = useDeleteTargetApplicationVersion();
  const rotateTargetApplicationApiKey = useRotateTargetApplicationApiKey();
  const saveRegressionCodebaseConfig = useSaveRegressionCodebaseConfig();
  const createCrawlSession = useCreateCrawlSession();
  const startCrawlSession = useStartCrawlSession();
  const reattachManualSession = useReattachManualSession();
  const saveCrawlSchedule = useSaveCrawlSchedule();
  const toggleCrawlSchedule = useToggleCrawlSchedule();
  const deleteCrawlSchedule = useDeleteCrawlSchedule();
  const user = useAuthStore((state) => state.user);

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [rotatedApiKey, setRotatedApiKey] = useState<string | null>(null);
  const [modal, dispatchModal] = useReducer(modalReducer, { type: "none" });
  const [activeTab, setActiveTab] = useState<ApplicationDetailTab>("crawl-sessions");
  const [applicationSearch, setApplicationSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CrawlSessionStatusFilter>("all");
  const [triggerFilter, setTriggerFilter] = useState<CrawlSessionTriggerFilter>("all");
  const [editingSchedule, setEditingSchedule] = useState<CrawlSchedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<CrawlSchedule | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionFormInitialData, setSessionFormInitialData] = useState<CreateCrawlSessionInput | undefined>(undefined);

  const closeModal = () => dispatchModal({ type: "none" });
  const typedApplications = useMemo(() => applications as ApplicationView[], [applications]);

  const applicationCards = useMemo(
    () =>
      typedApplications.map((application, index) => ({
        application,
        gradient: GRADIENTS[index % GRADIENTS.length],
        versionCount: application.versions?.length ?? 0,
        baseUrl: application.baseUrl?.trim() || "No description",
      })),
    [typedApplications],
  );

  const filteredApplicationCards = useMemo(() => {
    const search = applicationSearch.trim().toLowerCase();
    if (!search) return applicationCards;

    return applicationCards.filter((card) => {
      const name = card.application.name.toLowerCase();
      const baseUrl = (card.application.baseUrl ?? "").toLowerCase();
      return name.includes(search) || baseUrl.includes(search);
    });
  }, [applicationCards, applicationSearch]);

  const selectedApplicationCard = useMemo(
    () => applicationCards.find((card) => card.application.id === selectedApplicationId) ?? null,
    [applicationCards, selectedApplicationId],
  );
  const selectedApplication = selectedApplicationCard?.application ?? null;
  const currentVersions = useMemo(() => selectedApplication?.versions ?? [], [selectedApplication?.versions]);
  const selectedVersion = currentVersions.find((version) => version.id === selectedVersionId) ?? null;
  const userRole = useMemo(
    () => getProjectUserRole(selectedProject as Parameters<typeof getProjectUserRole>[0], user?.id),
    [selectedProject, user?.id],
  );
  const isAdmin = userRole === "ADMIN";
  const isMember = userRole === "ADMIN" || userRole === "MEMBER";

  const { data: applicationDetails } = useApplicationDetails(
    selectedProject?.id ?? null,
    selectedApplication?.id ?? null,
    selectedVersion?.id ?? null,
    currentVersions.length,
    selectedApplication?.name,
    selectedApplication?.baseUrl ?? "",
    selectedVersion?.version,
  );
  const { data: queriedSessions = [] } = useCrawlSessions(
    selectedProject?.id ?? null,
    selectedApplication?.id ?? null,
    selectedVersion?.id ?? null,
    selectedApplication?.name,
    selectedApplication?.baseUrl ?? "",
    selectedVersion?.version,
  );
  const { data: queriedRegressionConfig } = useRegressionConfig(
    selectedProject?.id ?? null,
    selectedApplication?.id ?? null,
  );
  const { data: queriedSchedules = [] } = useCrawlSchedules(
    selectedProject?.id ?? null,
    selectedApplication?.id ?? null,
  );
  const { data: detailedSelectedSession } = useCrawlSession(
    selectedProject?.id ?? null,
    selectedApplication?.id ?? null,
    selectedVersion?.id ?? null,
    selectedSessionId,
    selectedApplication?.name,
    selectedApplication?.baseUrl ?? "",
    selectedVersion?.version,
  );
  const regressionConfig = queriedRegressionConfig;
  const schedules = queriedSchedules;

  useEffect(() => {
    if (!applicationCards.length) {
      setSelectedApplicationId(null);
      return;
    }
    if (!selectedApplicationId || !applicationCards.some((card) => card.application.id === selectedApplicationId)) {
      setSelectedApplicationId(applicationCards[0].application.id);
    }
  }, [applicationCards, selectedApplicationId]);

  useEffect(() => {
    if (!currentVersions.length) {
      setSelectedVersionId(null);
      return;
    }

    if (!selectedVersionId || !currentVersions.some((version) => version.id === selectedVersionId)) {
      setSelectedVersionId(currentVersions[0].id);
    }
  }, [currentVersions, selectedVersionId]);

  const selectedSession = useMemo(
    () => detailedSelectedSession ?? queriedSessions.find((session) => session.id === selectedSessionId) ?? null,
    [detailedSelectedSession, queriedSessions, selectedSessionId],
  );

  const detailStats = useMemo(
    () => ({
      ...(applicationDetails?.stats ?? DEFAULT_STATS),
      versionCount: currentVersions.length,
    }),
    [applicationDetails?.stats, currentVersions.length],
  );

  const sessionSummary = useMemo(() => {
    return {
      total: queriedSessions.length,
      success: queriedSessions.filter((session) => session.status === "success").length,
      failed: queriedSessions.filter((session) => session.status === "failed").length,
    };
  }, [queriedSessions]);

  const filteredSessions = useMemo(
    () =>
      queriedSessions.filter((session) => {
        const statusMatches = statusFilter === "all" || session.status === statusFilter;
        const triggerMatches = triggerFilter === "all" || session.trigger === triggerFilter;
        return statusMatches && triggerMatches;
      }),
    [queriedSessions, statusFilter, triggerFilter],
  );

  const isApplicationNameDuplicate = (name: string, ignoreId?: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return false;
    return typedApplications.some((a) => a.id !== ignoreId && a.name.trim().toLowerCase() === normalized);
  };

  const isVersionNameDuplicate = (version: string, ignoreId?: string) => {
    const normalized = version.trim().toLowerCase();
    if (!normalized) return false;
    return currentVersions.some((v) => v.id !== ignoreId && v.version.trim().toLowerCase() === normalized);
  };

  const handleAddApplication = (name: string, baseUrl: string) => {
    createTargetApplication.mutate(
      { projectId: selectedProject!.id, data: { name, baseUrl } },
      {
        onSuccess: (data) => {
          setSelectedApplicationId(data.id);
          setRotatedApiKey(data.apiKey || null);
        },
      },
    );
  };

  const handleUpdateApplication = (name: string, baseUrl: string) => {
    if (!selectedApplication) return;
    updateTargetApplication.mutate(
      {
        projectId: selectedProject!.id,
        applicationId: selectedApplication.id,
        data: { name, baseUrl },
      },
      { onSuccess: closeModal },
    );
  };

  const handleDeleteApplication = () => {
    if (!selectedApplication) return;
    deleteTargetApplication.mutate(
      { projectId: selectedProject!.id, applicationId: selectedApplication.id },
      {
        onSuccess: () => {
          closeModal();
          setSelectedApplicationId(null);
        },
      },
    );
  };

  const handleAddVersion = (version: string) => {
    if (!selectedApplication) return;
    createTargetApplicationVersion.mutate(
      {
        projectId: selectedProject!.id,
        applicationId: selectedApplication.id,
        data: { version },
      },
      {
        onSuccess: () => {
          closeModal();
        },
      },
    );
  };

  const handleDeleteVersion = (versionId: string) => {
    if (!selectedApplication) return;
    const remainingVersions = currentVersions.filter((version) => version.id !== versionId);
    deleteTargetApplicationVersion.mutate(
      {
        projectId: selectedProject!.id,
        applicationId: selectedApplication.id,
        versionId,
      },
      {
        onSuccess: () => {
          closeModal();
          setSelectedVersionId(remainingVersions[0]?.id ?? null);
        },
      },
    );
  };

  const handleRotateApiKey = () => {
    if (!selectedApplication) return;
    rotateTargetApplicationApiKey.mutate(
      { projectId: selectedProject!.id, applicationId: selectedApplication.id },
      {
        onSuccess: (data) => {
          setRotatedApiKey(data.apiKey);
        },
      },
    );
  };

  const handleSaveRegressionConfig = (config: RegressionCodebaseConfig) => {
    if (!selectedProject || !selectedApplication) return;
    saveRegressionCodebaseConfig.mutate(
      {
        projectId: selectedProject.id,
        applicationId: selectedApplication.id,
        versionId: selectedVersion?.id,
        config,
      },
      { onSuccess: closeModal },
    );
  };

  const handleOpenCreateSession = (initialData?: CreateCrawlSessionInput) => {
    setSessionFormInitialData(initialData);
    dispatchModal({ type: "createSession" });
  };

  const handleCreateSession = (data: CreateCrawlSessionInput) => {
    if (!selectedProject || !selectedApplication || !selectedVersion || !regressionConfig?.id) return;

    createCrawlSession.mutate(
      {
        projectId: selectedProject.id,
        applicationId: selectedApplication.id,
        versionId: selectedVersion.id,
        regressionCodebaseId: regressionConfig.id,
        data,
      },
      {
        onSuccess: () => {
          setSessionFormInitialData(undefined);
          closeModal();
        },
      },
    );
  };

  const handleStartSession = (sessionId: string) => {
    if (!selectedProject || !selectedApplication || !selectedVersion) return;

    startCrawlSession.mutate({
      projectId: selectedProject.id,
      applicationId: selectedApplication.id,
      versionId: selectedVersion.id,
      sessionId,
    });
  };

  const handleOpenAddSchedule = () => {
    setEditingSchedule(null);
    dispatchModal({ type: "scheduleConfig" });
  };

  const handleOpenEditSchedule = (schedule: CrawlSchedule) => {
    setEditingSchedule(schedule);
    dispatchModal({ type: "scheduleConfig" });
  };

  const handleOpenDeleteSchedule = (schedule: CrawlSchedule) => {
    setScheduleToDelete(schedule);
    dispatchModal({ type: "deleteSchedule" });
  };

  const handleConfirmDeleteSchedule = () => {
    if (!selectedProject || !selectedApplication || !scheduleToDelete) return;
    deleteCrawlSchedule.mutate(
      {
        projectId: selectedProject.id,
        applicationId: selectedApplication.id,
        versionId: selectedVersion?.id,
        scheduleId: scheduleToDelete.id,
      },
      {
        onSuccess: () => {
          setScheduleToDelete(null);
          closeModal();
        },
      },
    );
  };

  const handleSaveSchedule = (frequency: ScheduleFrequency, runTimeUtc: string) => {
    if (!selectedProject || !selectedApplication || !selectedVersion) return;

    saveCrawlSchedule.mutate(
      {
        projectId: selectedProject.id,
        applicationId: selectedApplication.id,
        versionId: selectedVersion.id,
        scheduleId: editingSchedule?.id,
        frequency,
        runTimeUtc,
        enabled: editingSchedule?.enabled ?? true,
        regressionCodebaseId: regressionConfig?.id,
      },
      {
        onSuccess: () => {
          setEditingSchedule(null);
          closeModal();
        },
      },
    );
  };

  const handleToggleSchedule = (scheduleId: string) => {
    if (!selectedProject || !selectedApplication) return;
    const schedule = schedules.find((item) => item.id === scheduleId);
    if (!schedule) return;

    toggleCrawlSchedule.mutate({
      projectId: selectedProject.id,
      applicationId: selectedApplication.id,
      versionId: selectedVersion?.id,
      schedule,
    });
  };

  const handleRerun = (session: CrawlSession) => {
    const crawlerSettings =
      session.crawlConfig.crawlerSettings && typeof session.crawlConfig.crawlerSettings === "object"
        ? (session.crawlConfig.crawlerSettings as Record<string, unknown>)
        : {};
    const inputDefaults =
      session.crawlConfig.inputDefaults && typeof session.crawlConfig.inputDefaults === "object"
        ? (session.crawlConfig.inputDefaults as CreateCrawlSessionInput["crawlConfig"]["inputDefaults"])
        : undefined;
    const testFlowGeneration =
      session.crawlConfig.testFlowGeneration && typeof session.crawlConfig.testFlowGeneration === "object"
        ? (session.crawlConfig.testFlowGeneration as Record<string, unknown>)
        : {};

    handleOpenCreateSession({
      trigger: "manual",
      crawlConfig: {
        maxStates: Number(session.crawlConfig.maxStates ?? 1000),
        timeoutSeconds: Number(session.crawlConfig.timeoutSeconds ?? 3600),
        generateTestFlows: session.crawlConfig.generateTestFlows !== false,
        testFlowGeneration: {
          coveragePercentage: Number(testFlowGeneration.coveragePercentage ?? 100),
          numOfTf: Number(testFlowGeneration.numOfTf ?? 1),
          numOfStates: Number(testFlowGeneration.numOfStates ?? 20),
          minNumOfStatesPerTf: Number(testFlowGeneration.minNumOfStatesPerTf ?? 3),
        },
        crawlerSettings: {
          maxTransitions: Number(crawlerSettings.maxTransitions ?? 5000),
          useSemanticDiversity: crawlerSettings.useSemanticDiversity !== false,
        },
        inputDefaults,
      },
      codegenConfig:
        Object.keys(session.codegenConfig).length > 0
          ? {
              codegenBranch: String(session.codegenConfig.codegenBranch ?? "auto-tests"),
              prTargetBranch: String(session.codegenConfig.prTargetBranch ?? "main"),
              prTitle: String(session.codegenConfig.prTitle ?? ""),
              prBody: String(session.codegenConfig.prBody ?? ""),
              prDraft: Boolean(session.codegenConfig.prDraft ?? true),
            }
          : undefined,
    });
    setSelectedSessionId(null);
  };

  const handleReattach = (session: CrawlSession) => {
    if (!selectedProject || !selectedApplication || !selectedVersion) return;

    reattachManualSession.mutate(
      {
        projectId: selectedProject.id,
        applicationId: selectedApplication.id,
        versionId: selectedVersion.id,
        sessionId: session.id,
      },
      {
        onSuccess: ({ sessionId, wsTicket }) => {
          navigate(
            `${manualSessionRoute(selectedProject.id, selectedApplication.id, selectedVersion.id, sessionId)}?ticket=${encodeURIComponent(wsTicket)}`,
            {
              state: {
                applicationName: selectedApplication.name,
                applicationBaseUrl: selectedApplication.baseUrl ?? "",
                versionName: selectedVersion.version,
              },
            },
          );
          setSelectedSessionId(null);
        },
      },
    );
  };

  return (
    <div className={styles.container}>
      {/* Left Panel - Applications List */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitleRow}>
            <div className={styles.sidebarTitle}>
              <h2 className={styles.sidebarHeading}>Applications</h2>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                className={styles.iconButton}
                onClick={() => dispatchModal({ type: "addApplication" })}
              >
                <Plus className={styles.iconSmall} />
              </Button>
            )}
          </div>
          <div className={styles.applicationSearch}>
            <Search className={styles.searchIcon} />
            <Input
              value={applicationSearch}
              onChange={(event) => setApplicationSearch(event.target.value)}
              placeholder="Search applications..."
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.projectSection}>
          <div className={styles.projectList}>
            {isLoading && <p className={styles.projectMeta}>Loading applications...</p>}
            {isError && !isLoading && <p className={styles.projectError}>Failed to load applications.</p>}
            {!isLoading && !isError && applicationCards.length === 0 && (
              <p className={styles.projectMeta}>No Applications yet.</p>
            )}
            {!isLoading && !isError && applicationCards.length > 0 && filteredApplicationCards.length === 0 && (
              <p className={styles.projectMeta}>No applications match your search.</p>
            )}
            {filteredApplicationCards.map((card) => (
              <button
                key={card.application.id}
                onClick={() => setSelectedApplicationId(card.application.id)}
                className={cn(
                  styles.projectItem,
                  selectedApplication?.id === card.application.id && styles.projectItemActive,
                )}
              >
                <div className={styles.projectInfo}>
                  <p className={styles.projectName}>{card.application.name}</p>
                  <p className={styles.projectDescription}>{card.application.baseUrl}</p>
                  <div className={styles.projectMetaRow}>
                    <span>
                      {card.versionCount} version{card.versionCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right Panel - Versions Management */}
      <main className={styles.main}>
        {selectedApplication ? (
          <>
            <div className={styles.applicationHeader}>
              <div className={styles.applicationHeaderTop}>
                <div className={styles.applicationHeaderInfo}>
                  <div>
                    <h1 className={styles.applicationTitle}>{selectedApplication.name}</h1>
                    <p className={styles.applicationSubtitle}>{selectedApplication.baseUrl}</p>
                  </div>
                </div>

                {isAdmin ? (
                  <div className={styles.applicationActions}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={styles.actionIconButton}
                      onClick={() => dispatchModal({ type: "rotateApiKey" })}
                      aria-label="Rotate API key"
                      title="Rotate API key"
                    >
                      <KeyRound className={styles.iconLarge} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={styles.actionIconButton}
                      onClick={() => dispatchModal({ type: "editApplication" })}
                      aria-label="Edit application"
                      title="Edit application"
                    >
                      <Edit2 className={styles.iconLarge} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={styles.deleteTextButton}
                      onClick={() => dispatchModal({ type: "deleteApplication" })}
                    >
                      <Trash2 className={styles.iconSmall} />
                      Delete App
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => dispatchModal({ type: "addVersion" })}
                      aria-label="Add application version"
                      title="Add application version"
                    >
                      <Plus className={styles.iconLarge} />
                      Add Version
                    </Button>
                  </div>
                ) : isMember ? (
                  <div className={styles.applicationActions}>
                    <Button
                      size="sm"
                      onClick={() => dispatchModal({ type: "addVersion" })}
                      aria-label="Add application version"
                      title="Add application version"
                    >
                      <Plus className={styles.iconLarge} />
                      Add Version
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            {currentVersions.length > 0 ? (
              <>
                <div className={styles.versionBar}>
                  <div className={styles.versionBarContent}>
                    <span className={styles.versionLabel}>VERSION:</span>

                    <div className={styles.versionList}>
                      {currentVersions.map((version) => {
                        const isSelected = selectedVersionId === version.id;

                        return (
                          <button
                            key={version.id}
                            onClick={() => {
                              setSelectedVersionId(version.id);
                            }}
                            className={cn(styles.versionChip, isSelected && styles.versionChipActive)}
                          >
                            <span className={styles.versionChipMain}>
                              <Tag className={styles.versionChipIcon} />
                              <span>{version.version}</span>
                            </span>
                            {isSelected && isAdmin && (
                              <span
                                role="button"
                                tabIndex={0}
                                className={styles.versionChipDelete}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  dispatchModal({ type: "deleteVersion" });
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    dispatchModal({ type: "deleteVersion" });
                                  }
                                }}
                                aria-label={`Delete version ${version.version}`}
                                title="Delete version"
                              >
                                <X className={styles.versionChipDeleteIcon} />
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {isMember && (
                        <button
                          className={styles.versionAddButton}
                          onClick={() => {
                            dispatchModal({ type: "addVersion" });
                          }}
                        >
                          <Plus className={styles.versionChipIcon} />
                          <span>Add Version</span>
                        </button>
                      )}
                    </div>
                    <div className={styles.versionSessionSummary}>
                      <span>{sessionSummary.total} sessions</span>
                      <span className={styles.summaryDotSuccess} />
                      <span>{sessionSummary.success}</span>
                      <span className={styles.summaryDotFailed} />
                      <span>{sessionSummary.failed}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailTabs}>
                  <TabButton active={activeTab === "crawl-sessions"} onClick={() => setActiveTab("crawl-sessions")}>
                    Crawl Sessions
                  </TabButton>
                  <TabButton active={activeTab === "schedules"} onClick={() => setActiveTab("schedules")}>
                    Schedules
                  </TabButton>
                </div>

                <div className={styles.applicationContent}>
                  <DetailsTop
                    stats={detailStats}
                    regressionConfig={regressionConfig}
                    onEditRegression={() => dispatchModal({ type: "regressionConfig" })}
                  />

                  {activeTab === "crawl-sessions" ? (
                    <SessionsTable
                      sessions={filteredSessions}
                      totalSessions={queriedSessions.length}
                      statusFilter={statusFilter}
                      triggerFilter={triggerFilter}
                      onStatusFilterChange={setStatusFilter}
                      onTriggerFilterChange={setTriggerFilter}
                      onCreate={() => handleOpenCreateSession()}
                      canCreate={Boolean(regressionConfig?.id && selectedVersion)}
                      createDisabledReason={
                        regressionConfig?.id
                          ? "Select a version before creating a session."
                          : "Configure a codebase first."
                      }
                      onView={setSelectedSessionId}
                      onStart={handleStartSession}
                      startingSessionId={startCrawlSession.variables?.sessionId ?? null}
                    />
                  ) : (
                    <SchedulesPanel
                      schedules={schedules}
                      onAdd={handleOpenAddSchedule}
                      onEdit={handleOpenEditSchedule}
                      onToggle={handleToggleSchedule}
                      onDelete={handleOpenDeleteSchedule}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className={styles.applicationContent}>
                <DetailsTop
                  stats={detailStats}
                  regressionConfig={regressionConfig}
                  onEditRegression={() => dispatchModal({ type: "regressionConfig" })}
                />

                <Card className={styles.noVersionsPanel}>
                  <Tag className={styles.noVersionsIcon} />
                  <h3>No versions yet</h3>
                  {isMember ? (
                    <>
                      <p className={styles.emptyText}>Create your first application version to start crawl sessions.</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          dispatchModal({ type: "addVersion" });
                        }}
                      >
                        <Plus className={styles.iconSmall} />
                        Add Version
                      </Button>
                    </>
                  ) : (
                    <p className={styles.emptyText}>
                      Contact a project admin or member to create your first application version.
                    </p>
                  )}
                </Card>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>
                <Globe className={styles.iconMediumMuted} />
              </div>

              <h3 className={styles.emptyTitle}>Select an Application</h3>

              <p className={styles.emptyText}>
                Choose an application from the left to view versions and crawl sessions.
              </p>
            </div>
          </div>
        )}
      </main>

      {selectedSession && selectedApplication && (
        <SessionDetailsPanel
          session={selectedSession}
          appName={selectedApplication.name}
          selectedVersionName={selectedVersion?.version}
          onClose={() => setSelectedSessionId(null)}
          onRerun={handleRerun}
          onReattach={handleReattach}
          reattaching={reattachManualSession.variables?.sessionId === selectedSession.id && reattachManualSession.isPending}
        />
      )}

      {modal.type === "addApplication" && isAdmin && (
        <AddApplicationModal
          isNameDuplicate={isApplicationNameDuplicate}
          apiKey={rotatedApiKey}
          onConfirm={handleAddApplication}
          onClose={() => {
            setRotatedApiKey(null);
            closeModal();
          }}
        />
      )}

      {modal.type === "editApplication" && selectedApplication && isAdmin && (
        <EditApplicationModal
          initialName={selectedApplication.name}
          initialBaseUrl={selectedApplication.baseUrl ?? ""}
          isNameDuplicate={(name) => isApplicationNameDuplicate(name, selectedApplication.id)}
          onConfirm={handleUpdateApplication}
          onClose={closeModal}
        />
      )}

      {modal.type === "deleteApplication" && selectedApplication && isAdmin && (
        <DeleteApplicationModal
          applicationName={selectedApplication.name}
          onConfirm={handleDeleteApplication}
          onClose={closeModal}
        />
      )}

      {modal.type === "addVersion" && selectedApplication && (
        <AddVersionModal isNameDuplicate={isVersionNameDuplicate} onConfirm={handleAddVersion} onClose={closeModal} />
      )}

      {modal.type === "deleteVersion" && selectedApplication && selectedVersion && isAdmin && (
        <DeleteVersionModal
          versionName={selectedVersion.version}
          onConfirm={() => handleDeleteVersion(selectedVersion.id)}
          onClose={closeModal}
        />
      )}

      {modal.type === "rotateApiKey" && selectedApplication && isAdmin && (
        <RotateApiKeyModal
          applicationName={selectedApplication.name}
          apiKey={rotatedApiKey}
          isRotating={rotateTargetApplicationApiKey.isPending}
          onConfirm={handleRotateApiKey}
          onClose={() => {
            setRotatedApiKey(null);
            closeModal();
          }}
        />
      )}

      {modal.type === "regressionConfig" && (
        <RegressionCodebaseConfigModal
          applicationName={selectedApplication?.name ?? "this application"}
          initialConfig={regressionConfig ?? createEmptyRegressionConfig()}
          onConfirm={handleSaveRegressionConfig}
          onClose={closeModal}
        />
      )}

      {modal.type === "createSession" && (
        <CreateCrawlSessionModal
          initialData={sessionFormInitialData}
          onConfirm={handleCreateSession}
          onClose={() => {
            setSessionFormInitialData(undefined);
            closeModal();
          }}
        />
      )}

      {modal.type === "scheduleConfig" && (
        <ScheduleConfigModal
          initialSchedule={editingSchedule}
          onConfirm={handleSaveSchedule}
          onClose={() => {
            setEditingSchedule(null);
            closeModal();
          }}
        />
      )}

      {modal.type === "deleteSchedule" && scheduleToDelete && (
        <DeleteScheduleModal
          scheduleTitle={scheduleToDelete.title}
          onConfirm={handleConfirmDeleteSchedule}
          onClose={() => {
            setScheduleToDelete(null);
            closeModal();
          }}
        />
      )}
    </div>
  );
};

export default Applications;
