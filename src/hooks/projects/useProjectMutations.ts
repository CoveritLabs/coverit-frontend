// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@config/queryKeys";
import { projectService } from "@services/project/projectService";
import { toast } from "@components/ui";
import type {
  AddMembersRequest,
  CreateProjectRequest,
  CreateProjectResponse,
  MessageResponse,
  RemoveMembersRequest,
  UpdateMemberRequest,
  UpdateProjectRequest,
} from "@coveritlabs/contracts";
import type { Payload } from "@/types/common";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<CreateProjectResponse, Error, Payload<CreateProjectRequest>>({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      toast.error("Failed to create project", error.message);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, { projectId: string; data: Payload<UpdateProjectRequest> }>({
    mutationFn: ({ projectId, data }) => projectService.updateProject(projectId, data),
    onSuccess: (_data, variables) => {
      toast.success("Project updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      toast.error("Failed to update project", error.message);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, { projectId: string }>({
    mutationFn: ({ projectId }) => projectService.deleteProject(projectId),
    onSuccess: (_data, variables) => {
      toast.success("Project deleted");
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      toast.error("Failed to delete project", error.message);
    },
  });
}

export function useAddProjectMembers() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, { projectId: string; data: Payload<AddMembersRequest> }>({
    mutationFn: ({ projectId, data }) => projectService.addMembers(projectId, data),
    onSuccess: (_data, variables) => {
      toast.success("Members added");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      toast.error("Failed to add members", error.message);
    },
  });
}

export function useUpdateProjectMember() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, { projectId: string; data: Payload<UpdateMemberRequest> }>({
    mutationFn: ({ projectId, data }) => projectService.updateMember(projectId, data),
    onSuccess: (_data, variables) => {
      toast.success("Member updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      toast.error("Failed to update member", error.message);
    },
  });
}

export function useRemoveProjectMembers() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, { projectId: string; data: Payload<RemoveMembersRequest> }>({
    mutationFn: ({ projectId, data }) => projectService.removeMembers(projectId, data),
    onSuccess: (_data, variables) => {
      toast.success("Members removed");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      toast.error("Failed to remove members", error.message);
    },
  });
}

export function useLeaveProject() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, { projectId: string }>({
    mutationFn: ({ projectId }) => projectService.leaveProject(projectId),
    onSuccess: (data, variables) => {
      toast.success(data.message || "Left project");
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      toast.error("Failed to leave project", error.message);
    },
  });
}
