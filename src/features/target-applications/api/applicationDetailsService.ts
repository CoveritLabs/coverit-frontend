// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import type {
  ApplicationDetailStats,
  ApplicationDetailsData,
  CodegenConfigInput,
  CrawlConfigInput,
  CrawlSchedule,
  CrawlSession,
  CrawlSessionStatus,
  CrawlSessionTrigger,
  CreateCrawlSessionInput,
  RegressionCodebaseConfig,
  ScheduleFrequency,
} from "../model/types/applicationDetails.types";

interface MessageResponse {
  message: string;
}

interface CreateIdResponse {
  id: string;
}

type ApiTrigger = number | string;
type ApiStatus = number | string;

interface ApiRegressionCodebase {
  id: string;
  frameworkName?: string;
  repositoryUrl: string;
  repositoryPath?: string;
  apiKey?: string;
}

interface ApiCrawlSession {
  id: string;
  appVersionId: string;
  status: ApiStatus;
  triggerType: ApiTrigger;
  crawlConfig?: Record<string, unknown>;
  codegenConfig?: Record<string, unknown>;
  regressionCodebaseId?: string;
  baseUrlSnapshot?: string;
  scheduleId?: string;
  stateCount?: number;
  transitionCount?: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
}

interface ApiCrawlSessionListResponse {
  sessions: ApiCrawlSession[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

interface ApiCrawlSchedule {
  id: string;
  targetApplicationId: string;
  scheduleType: number | string;
  mode: number | string;
  versionId?: string;
  cron?: string;
  timezone?: string;
  runAt?: string;
  isActive: boolean;
  catchUp: boolean;
  crawlConfig?: Record<string, unknown>;
  codegenConfig?: Record<string, unknown>;
  regressionCodebaseId?: string;
  nextRunAt?: string;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiCrawlScheduleListResponse {
  schedules: ApiCrawlSchedule[];
}

const TRIGGER_TO_API: Record<CrawlSessionTrigger, number> = {
  manual: 1,
  scheduled: 2,
};

const SCHEDULE_TYPE_TO_API = {
  cron: 2,
};

const SCHEDULE_MODE_TO_API = {
  fixedVersion: 2,
};

const DEFAULT_CRAWL_CONFIG: CrawlConfigInput = {
  maxStates: 1000,
  maxDepth: 10,
  includeUrlPatterns: [],
  excludeUrlPatterns: [],
  enableSemanticDecisions: false,
  timeoutSeconds: 3600,
};

const DEFAULT_CODEGEN_CONFIG: CodegenConfigInput = {
  codegenBranch: "auto-tests",
  prTargetBranch: "main",
  prTitle: "",
  prBody: "",
  prDraft: true,
};

function getRepositoryPath(repositoryUrl: string) {
  try {
    const url = new URL(repositoryUrl);
    return url.pathname.replace(/^\/|\.git$/g, "") || repositoryUrl;
  } catch {
    return repositoryUrl.replace(/^https?:\/\/[^/]+\//, "").replace(/\.git$/, "");
  }
}

function normalizeStatus(status: ApiStatus): CrawlSessionStatus {
  const value = typeof status === "number" ? status : status.toUpperCase();

  if (value === 7 || value === "NEW") return "not_started";
  if (value === 3 || value === "COMPLETED") return "success";
  if (value === 4 || value === "FAILED" || value === 5 || value === "ABORTED") return "failed";
  if (value === 2 || value === "RUNNING") return "running";
  return "in_progress";
}

function normalizeTrigger(trigger: ApiTrigger): CrawlSessionTrigger {
  const value = typeof trigger === "number" ? trigger : trigger.toUpperCase();
  return value === 2 || value === "SCHEDULED" ? "scheduled" : "manual";
}

function getDurationMinutes(startedAt?: string, finishedAt?: string) {
  if (!startedAt || !finishedAt) return undefined;

  const started = new Date(startedAt).getTime();
  const finished = new Date(finishedAt).getTime();
  if (Number.isNaN(started) || Number.isNaN(finished) || finished < started) return undefined;

  return Math.max(1, Math.round((finished - started) / 60000));
}

function formatScheduleRun(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

function cronToRunTime(cron?: string) {
  if (!cron) return "02:00 AM";
  const [minute, hour] = cron.split(" ");
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  if (Number.isNaN(hourNumber) || Number.isNaN(minuteNumber)) return "02:00 AM";

  const period = hourNumber >= 12 ? "PM" : "AM";
  const displayHour = hourNumber % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${String(minuteNumber).padStart(2, "0")} ${period}`;
}

function runTimeToCron(runTimeUtc: string, frequency: ScheduleFrequency) {
  const normalized = runTimeUtc.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)?$/);
  if (!match) return "0 2 * * *";

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3];

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  if (frequency === "weekly") return `${minute} ${hour} * * 1`;
  if (frequency === "monthly") return `${minute} ${hour} 1 * *`;
  return `${minute} ${hour} * * *`;
}

function getScheduleFrequency(cron?: string): ScheduleFrequency {
  if (!cron) return "daily";
  const parts = cron.split(" ");
  if (parts[2] !== "*") return "monthly";
  if (parts[4] !== "*") return "weekly";
  return "daily";
}

function mapRegressionConfig(item?: ApiRegressionCodebase): RegressionCodebaseConfig | undefined {
  if (!item) return undefined;

  return {
    id: item.id,
    repositoryUrl: item.repositoryUrl,
    repositoryPath: item.repositoryPath || getRepositoryPath(item.repositoryUrl),
    apiKey: item.apiKey,
  };
}

function mapSchedule(schedule: ApiCrawlSchedule): CrawlSchedule {
  const frequency = getScheduleFrequency(schedule.cron);
  const runTimeUtc = cronToRunTime(schedule.cron);
  const nextRun = formatScheduleRun(schedule.nextRunAt);

  return {
    id: schedule.id,
    title: `${frequency.charAt(0).toUpperCase()}${frequency.slice(1)} at ${runTimeUtc.replace(/\s?(AM|PM)$/i, "")} UTC`,
    frequency,
    cron: schedule.cron ?? "0 2 * * *",
    runTimeUtc,
    nextRun,
    enabled: schedule.isActive,
  };
}

function mapSession(
  session: ApiCrawlSession,
  applicationId: string,
  applicationName: string,
  applicationBaseUrl: string,
  versionName?: string,
  schedules: CrawlSchedule[] = [],
): CrawlSession {
  const startedAt = session.startedAt ?? session.createdAt;
  const schedule = session.scheduleId ? schedules.find((item) => item.id === session.scheduleId) : undefined;

  return {
    id: session.id,
    applicationId,
    applicationName,
    applicationBaseUrl: session.baseUrlSnapshot ?? applicationBaseUrl,
    versionId: session.appVersionId,
    versionName: versionName ?? session.appVersionId,
    status: normalizeStatus(session.status),
    trigger: normalizeTrigger(session.triggerType),
    startedAt,
    finishedAt: session.finishedAt,
    durationMinutes: getDurationMinutes(startedAt, session.finishedAt),
    statesDiscovered: session.stateCount ?? 0,
    transitionsDiscovered: session.transitionCount ?? 0,
    crawlConfig: session.crawlConfig ?? {},
    codegenConfig: session.codegenConfig ?? {},
    schedule,
  };
}

function getStats(versionCount: number, sessions: CrawlSession[]): ApplicationDetailStats {
  const crawledSessions = sessions.filter((session) => session.status === "success");
  const lastSession = [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const statesDiscovered = crawledSessions.reduce((total, session) => total + (session.statesDiscovered ?? 0), 0);

  return {
    versionCount,
    crawledCount: crawledSessions.length,
    statesDiscovered: statesDiscovered,
    lastCrawlDate: lastSession?.startedAt.slice(0, 10) ?? "—",
  };
}

function buildCodegenPayload(config: CodegenConfigInput) {
  return {
    codegenBranch: config.codegenBranch,
    prTargetBranch: config.prTargetBranch,
    prTitle: config.prTitle || undefined,
    prBody: config.prBody || undefined,
    prDraft: config.prDraft,
  };
}

export const applicationDetailsService = {
  defaultCrawlConfig: DEFAULT_CRAWL_CONFIG,
  defaultCodegenConfig: DEFAULT_CODEGEN_CONFIG,

  async getApplicationDetails(params: {
    projectId: string;
    applicationId: string;
    versionId: string | null;
    versionCount: number;
    applicationName: string;
    applicationBaseUrl: string;
    versionName?: string;
  }): Promise<ApplicationDetailsData> {
    const [sessions, regressionConfig, schedules] = await Promise.all([
      params.versionId
        ? this.getCrawlSessions({
            projectId: params.projectId,
            applicationId: params.applicationId,
            versionId: params.versionId,
            applicationName: params.applicationName,
            applicationBaseUrl: params.applicationBaseUrl,
            versionName: params.versionName,
          })
        : Promise.resolve([]),
      this.getRegressionConfig(params.projectId, params.applicationId),
      this.getSchedules(params.projectId, params.applicationId),
    ]);

    return {
      stats: getStats(params.versionCount, sessions),
      regressionConfig,
      sessions,
      schedules,
    };
  },

  async getCrawlSessions(params: {
    projectId: string;
    applicationId: string;
    versionId: string;
    applicationName: string;
    applicationBaseUrl: string;
    versionName?: string;
  }): Promise<CrawlSession[]> {
    const [sessionsResponse, schedules] = await Promise.all([
      apiClient.get<ApiCrawlSessionListResponse>(
        `projects/${params.projectId}/target-applications/${params.applicationId}/versions/${params.versionId}/crawl-sessions`,
        { params: { page: 1, pageSize: 100 } },
      ),
      this.getSchedules(params.projectId, params.applicationId),
    ]);

    return sessionsResponse.data.sessions.map((session) =>
      mapSession(
        session,
        params.applicationId,
        params.applicationName,
        params.applicationBaseUrl,
        params.versionName,
        schedules,
      ),
    );
  },

  async getCrawlSession(params: {
    projectId: string;
    applicationId: string;
    versionId: string;
    sessionId: string;
    applicationName: string;
    applicationBaseUrl: string;
    versionName?: string;
  }): Promise<CrawlSession> {
    const [sessionResponse, schedules] = await Promise.all([
      apiClient.get<ApiCrawlSession>(
        `projects/${params.projectId}/target-applications/${params.applicationId}/versions/${params.versionId}/crawl-sessions/${params.sessionId}`,
      ),
      this.getSchedules(params.projectId, params.applicationId),
    ]);

    return mapSession(
      sessionResponse.data,
      params.applicationId,
      params.applicationName,
      params.applicationBaseUrl,
      params.versionName,
      schedules,
    );
  },

  async createCrawlSession(params: {
    projectId: string;
    applicationId: string;
    versionId: string;
    regressionCodebaseId: string;
    data: CreateCrawlSessionInput;
  }): Promise<CrawlSession> {
    const response = await apiClient.post<ApiCrawlSession>(
      `projects/${params.projectId}/target-applications/${params.applicationId}/versions/${params.versionId}/crawl-sessions`,
      {
        triggerType: TRIGGER_TO_API[params.data.trigger],
        crawlConfig: params.data.crawlConfig,
        regressionCodebaseId: params.regressionCodebaseId,
        codegenConfig: buildCodegenPayload(params.data.codegenConfig),
      },
    );

    return mapSession(response.data, params.applicationId, "", "", undefined);
  },

  async startCrawlSession(params: {
    projectId: string;
    applicationId: string;
    versionId: string;
    sessionId: string;
  }): Promise<MessageResponse> {
    const response = await apiClient.put<MessageResponse>(
      `projects/${params.projectId}/target-applications/${params.applicationId}/versions/${params.versionId}/crawl-sessions/${params.sessionId}/start`,
    );
    return response.data;
  },

  async getRegressionConfig(projectId: string, applicationId: string): Promise<RegressionCodebaseConfig | undefined> {
    const response = await apiClient.get<ApiRegressionCodebase[]>(
      `projects/${projectId}/target-applications/${applicationId}/regression-codebases`,
    );
    return mapRegressionConfig(response.data[0]);
  },

  async saveRegressionConfig(params: {
    projectId: string;
    applicationId: string;
    config: RegressionCodebaseConfig;
  }): Promise<RegressionCodebaseConfig> {
    const body = {
      frameworkName: "Playwright",
      repositoryUrl: params.config.repositoryUrl,
      apiKey: params.config.apiKey,
    };

    if (params.config.id) {
      await apiClient.put<MessageResponse>(
        `projects/${params.projectId}/target-applications/${params.applicationId}/regression-codebases/${params.config.id}`,
        body,
      );
      return params.config;
    }

    const response = await apiClient.post<CreateIdResponse>(
      `projects/${params.projectId}/target-applications/${params.applicationId}/regression-codebases`,
      body,
    );

    return {
      ...params.config,
      id: response.data.id,
    };
  },

  async getSchedules(projectId: string, applicationId: string): Promise<CrawlSchedule[]> {
    const response = await apiClient.get<ApiCrawlScheduleListResponse>(
      `projects/${projectId}/target-applications/${applicationId}/crawl-schedules`,
    );
    return response.data.schedules.map(mapSchedule);
  },

  async saveSchedule(params: {
    projectId: string;
    applicationId: string;
    versionId: string;
    scheduleId?: string;
    frequency: ScheduleFrequency;
    runTimeUtc: string;
    enabled?: boolean;
    regressionCodebaseId?: string;
  }): Promise<CrawlSchedule> {
    const body = {
      scheduleType: SCHEDULE_TYPE_TO_API.cron,
      mode: SCHEDULE_MODE_TO_API.fixedVersion,
      versionId: params.versionId,
      cron: runTimeToCron(params.runTimeUtc, params.frequency),
      timezone: "UTC",
      isActive: params.enabled ?? true,
      catchUp: false,
      regressionCodebaseId: params.regressionCodebaseId,
      crawlConfig: DEFAULT_CRAWL_CONFIG,
    };

    const response = params.scheduleId
      ? await apiClient.put<ApiCrawlSchedule>(
          `projects/${params.projectId}/target-applications/${params.applicationId}/crawl-schedules/${params.scheduleId}`,
          body,
        )
      : await apiClient.post<ApiCrawlSchedule>(
          `projects/${params.projectId}/target-applications/${params.applicationId}/crawl-schedules`,
          body,
        );

    return mapSchedule(response.data);
  },

  async toggleSchedule(params: {
    projectId: string;
    applicationId: string;
    schedule: CrawlSchedule;
  }): Promise<CrawlSchedule> {
    const response = await apiClient.put<ApiCrawlSchedule>(
      `projects/${params.projectId}/target-applications/${params.applicationId}/crawl-schedules/${params.schedule.id}`,
      { isActive: !params.schedule.enabled },
    );
    return mapSchedule(response.data);
  },

  async deleteSchedule(params: {
    projectId: string;
    applicationId: string;
    scheduleId: string;
  }): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(
      `projects/${params.projectId}/target-applications/${params.applicationId}/crawl-schedules/${params.scheduleId}`,
    );
    return response.data;
  },
};
