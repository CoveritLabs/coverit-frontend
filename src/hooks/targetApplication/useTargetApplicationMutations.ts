// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@config/queryKeys";
import { targetApplicationService } from "@services/targetApplication/targetApplicationService";
import { toast } from "@components/ui";
import type {
  CreateTargetApplicationRequest,
  CreateTargetApplicationResponse,
  CreateTargetApplicationVersionRequest,
  MessageResponse,
  RotateTargetApplicationApiKeyResponse,
  UpdateTargetApplicationRequest,
} from "@coveritlabs/contracts";
import type { Payload } from "@/types/common";

export function useCreateTargetApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateTargetApplicationResponse,
    Error,
    { projectId: string; data: Payload<CreateTargetApplicationRequest> }
  >({
    mutationFn: ({ projectId, data }) => targetApplicationService.createTargetApplication(projectId, data),
    onSuccess: (_data, variables) => {
      toast.success("Target application created");
      queryClient.invalidateQueries({ queryKey: queryKeys.targetApplications.lists(variables.projectId) });
    },
    onError: (error) => {
      toast.error("Failed to create target application", error.message);
    },
  });
}

export function useUpdateTargetApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    MessageResponse,
    Error,
    { projectId: string; applicationId: string; data: Payload<UpdateTargetApplicationRequest> }
  >({
    mutationFn: ({ projectId, applicationId, data }) =>
      targetApplicationService.updateTargetApplication(projectId, applicationId, data),
    onSuccess: (_data, variables) => {
      toast.success("Target application updated");
      queryClient.invalidateQueries({
        queryKey: queryKeys.targetApplications.detail(variables.projectId, variables.applicationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.targetApplications.lists(variables.projectId) });
    },
    onError: (error) => {
      toast.error("Failed to update target application", error.message);
    },
  });
}

export function useDeleteTargetApplication() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, { projectId: string; applicationId: string }>({
    mutationFn: ({ projectId, applicationId }) =>
      targetApplicationService.deleteTargetApplication(projectId, applicationId),
    onSuccess: (_data, variables) => {
      toast.success("Target application deleted");
      queryClient.removeQueries({
        queryKey: queryKeys.targetApplications.detail(variables.projectId, variables.applicationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.targetApplications.lists(variables.projectId) });
    },
    onError: (error) => {
      toast.error("Failed to delete target application", error.message);
    },
  });
}

export function useCreateTargetApplicationVersion() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateTargetApplicationResponse,
    Error,
    { projectId: string; applicationId: string; data: Payload<CreateTargetApplicationVersionRequest> }
  >({
    mutationFn: ({ projectId, applicationId, data }) =>
      targetApplicationService.createVersion(projectId, applicationId, data),
    onSuccess: (_data, variables) => {
      toast.success("Version created");
      queryClient.invalidateQueries({
        queryKey: queryKeys.targetApplications.detail(variables.projectId, variables.applicationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.targetApplications.lists(variables.projectId) });
    },
    onError: (error) => {
      toast.error("Failed to create version", error.message);
    },
  });
}

export function useDeleteTargetApplicationVersion() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, { projectId: string; applicationId: string; versionId: string }>({
    mutationFn: ({ projectId, applicationId, versionId }) =>
      targetApplicationService.deleteVersion(projectId, applicationId, versionId),
    onSuccess: (_data, variables) => {
      toast.success("Version deleted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.targetApplications.detail(variables.projectId, variables.applicationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.targetApplications.lists(variables.projectId) });
    },
    onError: (error) => {
      toast.error("Failed to delete version", error.message);
    },
  });
}

export function useRotateTargetApplicationApiKey() {
  const queryClient = useQueryClient();

  return useMutation<RotateTargetApplicationApiKeyResponse, Error, { projectId: string; applicationId: string }>({
    mutationFn: ({ projectId, applicationId }) => targetApplicationService.rotateApiKey(projectId, applicationId),
    onSuccess: (_data, variables) => {
      toast.success("API key rotated");
      queryClient.invalidateQueries({
        queryKey: queryKeys.targetApplications.detail(variables.projectId, variables.applicationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.targetApplications.lists(variables.projectId) });
    },
    onError: (error) => {
      toast.error("Failed to rotate API key", error.message);
    },
  });
}
