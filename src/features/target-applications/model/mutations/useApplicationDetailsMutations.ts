// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/config/queryKeys";
import { toast } from "@shared/ui";
import { applicationDetailsService } from "../../api/applicationDetailsService";
import type {
  CrawlSchedule,
  CreateCrawlSessionInput,
  RegressionCodebaseConfig,
  ScheduleFrequency,
} from "../types/applicationDetails.types";

function invalidateApplicationDetails(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  applicationId: string,
  versionId?: string | null,
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.targetApplications.regressionConfig(projectId, applicationId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.targetApplications.crawlSchedules(projectId, applicationId),
  });

  if (versionId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.targetApplications.applicationDetails(projectId, applicationId, versionId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.targetApplications.crawlSessions(projectId, applicationId, versionId),
    });
  }
}

export function useSaveRegressionCodebaseConfig() {
  const queryClient = useQueryClient();

  return useMutation<
    RegressionCodebaseConfig,
    Error,
    { projectId: string; applicationId: string; versionId?: string | null; config: RegressionCodebaseConfig }
  >({
    mutationFn: ({ projectId, applicationId, config }) =>
      applicationDetailsService.saveRegressionConfig({ projectId, applicationId, config }),
    onSuccess: (_data, variables) => {
      toast.success("Regression codebase saved");
      invalidateApplicationDetails(queryClient, variables.projectId, variables.applicationId, variables.versionId);
    },
    onError: (error) => {
      toast.error("Failed to save regression codebase", error.message);
    },
  });
}

export function useCreateCrawlSession() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    {
      projectId: string;
      applicationId: string;
      versionId: string;
      regressionCodebaseId: string;
      data: CreateCrawlSessionInput;
    }
  >({
    mutationFn: ({ projectId, applicationId, versionId, regressionCodebaseId, data }) =>
      applicationDetailsService.createCrawlSession({ projectId, applicationId, versionId, regressionCodebaseId, data }),
    onSuccess: (_data, variables) => {
      toast.success("Crawl session created");
      invalidateApplicationDetails(queryClient, variables.projectId, variables.applicationId, variables.versionId);
    },
    onError: (error) => {
      toast.error("Failed to create crawl session", error.message);
    },
  });
}

export function useStartCrawlSession() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    { projectId: string; applicationId: string; versionId: string; sessionId: string }
  >({
    mutationFn: ({ projectId, applicationId, versionId, sessionId }) =>
      applicationDetailsService.startCrawlSession({ projectId, applicationId, versionId, sessionId }),
    onSuccess: (_data, variables) => {
      toast.success("Crawl session started");
      invalidateApplicationDetails(queryClient, variables.projectId, variables.applicationId, variables.versionId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.targetApplications.crawlSession(
          variables.projectId,
          variables.applicationId,
          variables.versionId,
          variables.sessionId,
        ),
      });
    },
    onError: (error) => {
      toast.error("Failed to start crawl session", error.message);
    },
  });
}

export function useSaveCrawlSchedule() {
  const queryClient = useQueryClient();

  return useMutation<
    CrawlSchedule,
    Error,
    {
      projectId: string;
      applicationId: string;
      versionId: string;
      scheduleId?: string;
      frequency: ScheduleFrequency;
      runTimeUtc: string;
      enabled?: boolean;
      regressionCodebaseId?: string;
    }
  >({
    mutationFn: (variables) => applicationDetailsService.saveSchedule(variables),
    onSuccess: (_data, variables) => {
      toast.success(variables.scheduleId ? "Schedule updated" : "Schedule created");
      invalidateApplicationDetails(queryClient, variables.projectId, variables.applicationId, variables.versionId);
    },
    onError: (error) => {
      toast.error("Failed to save schedule", error.message);
    },
  });
}

export function useToggleCrawlSchedule() {
  const queryClient = useQueryClient();

  return useMutation<
    CrawlSchedule,
    Error,
    { projectId: string; applicationId: string; versionId?: string | null; schedule: CrawlSchedule }
  >({
    mutationFn: ({ projectId, applicationId, schedule }) =>
      applicationDetailsService.toggleSchedule({ projectId, applicationId, schedule }),
    onSuccess: (_data, variables) => {
      invalidateApplicationDetails(queryClient, variables.projectId, variables.applicationId, variables.versionId);
    },
    onError: (error) => {
      toast.error("Failed to update schedule", error.message);
    },
  });
}

export function useDeleteCrawlSchedule() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    { projectId: string; applicationId: string; versionId?: string | null; scheduleId: string }
  >({
    mutationFn: ({ projectId, applicationId, scheduleId }) =>
      applicationDetailsService.deleteSchedule({ projectId, applicationId, scheduleId }),
    onSuccess: (_data, variables) => {
      toast.success("Schedule deleted");
      invalidateApplicationDetails(queryClient, variables.projectId, variables.applicationId, variables.versionId);
    },
    onError: (error) => {
      toast.error("Failed to delete schedule", error.message);
    },
  });
}
