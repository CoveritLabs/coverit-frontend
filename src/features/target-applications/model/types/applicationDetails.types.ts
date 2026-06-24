// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export type CrawlSessionStatus = "not_started" | "success" | "failed" | "running" | "in_progress";
export type CrawlSessionTrigger = "manual" | "on_demand" | "scheduled";
export type CrawlSessionStatusFilter = CrawlSessionStatus | "all";
export type CrawlSessionTriggerFilter = CrawlSessionTrigger | "all";
export type ApplicationDetailTab = "crawl-sessions" | "schedules";
export type ScheduleFrequency = "daily" | "weekly" | "monthly";

export interface ApplicationDetailStats {
  versionCount: number;
  crawledCount: number;
  statesDiscovered: number;
  lastCrawlDate: string;
}

export interface RegressionCodebaseConfig {
  id?: string;
  repositoryUrl: string;
  repositoryPath: string;
  apiKey?: string;
}

export interface CrawlConfigInput {
  maxStates: number;
  timeoutSeconds: number;
  generateTestFlows: boolean;
  generateTestCode?: boolean;
  testFlowGeneration?: {
    coveragePercentage?: number;
    numOfTf?: number;
    maxNumOfTf?: number;
    numOfStates?: number;
    minNumOfStatesPerTf?: number;
  };
  crawlerSettings?: {
    maxTransitions?: number;
    maxElementsPerState?: number;
    maxActionRepeatsPerUrl?: number;
    useSemanticDiversity?: boolean;
  };
  inputDefaults?: {
    fieldPatterns: Record<string, string>;
    typeFallbacks: Record<string, string>;
  };
}

export interface CodegenConfigInput {
  codegenBranch: string;
  prTargetBranch: string;
  prTitle: string;
  prBody: string;
  prDraft: boolean;
}

export interface CreateCrawlSessionInput {
  trigger: CrawlSessionTrigger;
  crawlConfig: CrawlConfigInput;
  codegenConfig?: CodegenConfigInput;
}

export interface CrawlSchedule {
  id: string;
  title: string;
  frequency: ScheduleFrequency;
  cron: string;
  runTimeUtc: string;
  nextRun: string;
  enabled: boolean;
}

export interface CrawlSession {
  id: string;
  applicationId: string;
  applicationName: string;
  applicationBaseUrl: string;
  versionId: string;
  versionName: string;
  status: CrawlSessionStatus;
  trigger: CrawlSessionTrigger;
  startedAt: string;
  finishedAt?: string;
  durationMinutes?: number;
  statesDiscovered: number;
  transitionsDiscovered: number;
  reportUrl?: string;
  crawlConfig: Record<string, unknown>;
  codegenConfig: Record<string, unknown>;
  schedule?: CrawlSchedule;
}

export interface ApplicationDetailsData {
  stats: ApplicationDetailStats;
  regressionConfig?: RegressionCodebaseConfig;
  sessions: CrawlSession[];
  schedules: CrawlSchedule[];
}
