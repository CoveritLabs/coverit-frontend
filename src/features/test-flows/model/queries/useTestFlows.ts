// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/config/queryKeys";
import type { Payload } from "@shared/types/common";
import { toast } from "@shared/ui";
import { testFlowService } from "../../api/testFlowService";
import type {
  FlowEditorConnectResponse,
  FlowEditorDetailResponse,
  FlowEditorDraftStep,
  GenerateTestFlowRequest,
  GenerateTestFlowResponse,
  ListTestFlowsRequest,
  ListTestFlowsResponse,
  RegressionCodebaseOption,
} from "../types/test-flows.types";

const emptyTestFlowsResponse: ListTestFlowsResponse = { flows: [] };

export function useTestFlows(
  projectId: string | null,
  applicationId: string | null,
  filters: Payload<ListTestFlowsRequest> = {},
) {
  const queryClient = useQueryClient();
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";

  return useQuery({
    queryKey: queryKeys.testFlows.list(safeProjectId, safeApplicationId, filters),
    queryFn: () => testFlowService.listTestFlows(safeProjectId, safeApplicationId, filters),
    enabled: Boolean(projectId) && Boolean(applicationId),
    placeholderData: () =>
      projectId && applicationId
        ? (queryClient.getQueryData<ListTestFlowsResponse>(
            queryKeys.testFlows.list(projectId, applicationId, filters),
          ) ?? emptyTestFlowsResponse)
        : emptyTestFlowsResponse,
  });
}

export function useFlowEditor(projectId: string | null, applicationId: string | null, flowId: string | null) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";
  const safeFlowId = flowId ?? "__missing__";

  return useQuery<FlowEditorDetailResponse>({
    queryKey: queryKeys.testFlows.editor(safeProjectId, safeApplicationId, safeFlowId),
    queryFn: () => testFlowService.getFlowEditor(safeProjectId, safeApplicationId, safeFlowId),
    enabled: Boolean(projectId) && Boolean(applicationId) && Boolean(flowId),
  });
}

export function useSaveFlowEditorSteps() {
  const queryClient = useQueryClient();

  return useMutation<
    { response: Awaited<ReturnType<typeof testFlowService.saveFlowEditorSteps>>; editorSteps: FlowEditorDraftStep[] },
    Error,
    { projectId: string; applicationId: string; flowId: string; editorSteps: FlowEditorDraftStep[] }
  >({
    mutationFn: async ({ projectId, applicationId, flowId, editorSteps }) => ({
      response: await testFlowService.saveFlowEditorSteps(projectId, applicationId, flowId, editorSteps),
      editorSteps,
    }),
    onSuccess: (_data, variables) => {
      toast.success("Editor steps saved");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testFlows.editor(variables.projectId, variables.applicationId, variables.flowId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testFlows.lists(variables.projectId, variables.applicationId),
      });
    },
    onError: (error) => {
      toast.error("Failed to save editor steps", error.message);
    },
  });
}

export function useConnectFlowEditor() {
  return useMutation<
    FlowEditorConnectResponse,
    Error,
    { projectId: string; applicationId: string; flowId: string }
  >({
    mutationFn: ({ projectId, applicationId, flowId }) =>
      testFlowService.connectFlowEditor(projectId, applicationId, flowId),
    onError: (error) => {
      toast.error("Failed to open editor session", error.message);
    },
  });
}

export function useRegressionCodebases(projectId: string | null, applicationId: string | null) {
  const safeProjectId = projectId ?? "__missing__";
  const safeApplicationId = applicationId ?? "__missing__";

  return useQuery<RegressionCodebaseOption[]>({
    queryKey: queryKeys.targetApplications.regressionCodebases(safeProjectId, safeApplicationId),
    queryFn: () => testFlowService.listRegressionCodebases(safeProjectId, safeApplicationId),
    enabled: Boolean(projectId) && Boolean(applicationId),
    placeholderData: [],
  });
}

export function useGenerateTestFlow() {
  const queryClient = useQueryClient();

  return useMutation<
    GenerateTestFlowResponse,
    Error,
    { projectId: string; applicationId: string; flowId: string; payload: GenerateTestFlowRequest }
  >({
    mutationFn: ({ projectId, applicationId, flowId, payload }) =>
      testFlowService.generateTestFlow(projectId, applicationId, flowId, payload),
    onSuccess: (_data, variables) => {
      toast.success("Test flow generation queued");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testFlows.lists(variables.projectId, variables.applicationId),
      });
    },
    onError: (error) => {
      toast.error("Failed to queue generation", error.message);
    },
  });
}
