// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@services/api/client";
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  ProjectResponse,
  AddMembersRequest,
  RemoveMembersRequest,
  UpdateMemberRequest,
  MessageResponse,
} from "@coveritlabs/contracts";
import { Payload } from "@/types/common";

export const projectService = {
  async createProject(data: Payload<CreateProjectRequest>): Promise<CreateProjectResponse> {
    const res = await apiClient.post<CreateProjectResponse>("projects", data);
    return res.data;
  },

  async updateProject(projectId: string, data: Payload<UpdateProjectRequest>): Promise<MessageResponse> {
    const res = await apiClient.put<MessageResponse>(`projects/${projectId}`, data);
    return res.data;
  },

  async deleteProject(projectId: string): Promise<MessageResponse> {
    const res = await apiClient.delete<MessageResponse>(`projects/${projectId}`);
    return res.data;
  },

  async getProjects(): Promise<ProjectResponse[]> {
    const res = await apiClient.get<ProjectResponse[]>("projects");
    return res.data;
  },

  async getProject(projectId: string): Promise<ProjectResponse> {
    const res = await apiClient.get<ProjectResponse>(`projects/${projectId}`);
    return res.data;
  },

  async addMembers(projectId: string, data: Payload<AddMembersRequest>): Promise<MessageResponse> {
    const res = await apiClient.post<MessageResponse>(`projects/${projectId}/members`, data);
    return res.data;
  },

  async updateMember(projectId: string, data: Payload<UpdateMemberRequest>): Promise<MessageResponse> {
    const res = await apiClient.put<MessageResponse>(`projects/${projectId}/members`, data);
    return res.data;
  },

  async removeMembers(projectId: string, data: Payload<RemoveMembersRequest>): Promise<MessageResponse> {
    const res = await apiClient.delete<MessageResponse>(`projects/${projectId}/members`, { data });
    return res.data;
  },

  async leaveProject(projectId: string): Promise<MessageResponse> {
    const res = await apiClient.post<MessageResponse>(`projects/${projectId}/leave`);
    return res.data;
  },
};
