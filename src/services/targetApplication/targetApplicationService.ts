// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@services/api/client";
import type {
  CreateTargetApplicationRequest,
  UpdateTargetApplicationRequest,
  CreateTargetApplicationResponse,
  TargetApplicationResponse,
  CreateTargetApplicationVersionRequest,
  MessageResponse,
  RotateTargetApplicationApiKeyResponse,
} from "@coveritlabs/contracts";
import { Payload } from "@/types/common";

export const targetApplicationService = {
  async createTargetApplication(
    projectId: string,
    data: Payload<CreateTargetApplicationRequest>,
  ): Promise<CreateTargetApplicationResponse> {
    const res = await apiClient.post<CreateTargetApplicationResponse>(
      `projects/${projectId}/target-applications`,
      data,
    );
    return res.data;
  },

  async updateTargetApplication(
    projectId: string,
    applicationId: string,
    data: Payload<UpdateTargetApplicationRequest>,
  ): Promise<MessageResponse> {
    const res = await apiClient.put<MessageResponse>(
      `projects/${projectId}/target-applications/${applicationId}`,
      data,
    );
    return res.data;
  },

  async deleteTargetApplication(projectId: string, applicationId: string): Promise<MessageResponse> {
    const res = await apiClient.delete<MessageResponse>(`projects/${projectId}/target-applications/${applicationId}`);
    return res.data;
  },

  async getTargetApplications(projectId: string): Promise<TargetApplicationResponse[]> {
    const res = await apiClient.get<TargetApplicationResponse[]>(`projects/${projectId}/target-applications`);
    return res.data;
  },

  async getTargetApplication(projectId: string, applicationId: string): Promise<TargetApplicationResponse> {
    const res = await apiClient.get<TargetApplicationResponse>(
      `projects/${projectId}/target-applications/${applicationId}`,
    );
    return res.data;
  },

  async createVersion(
    projectId: string,
    applicationId: string,
    data: Payload<CreateTargetApplicationVersionRequest>,
  ): Promise<CreateTargetApplicationResponse> {
    const res = await apiClient.post<CreateTargetApplicationResponse>(
      `projects/${projectId}/target-applications/${applicationId}/versions`,
      data,
    );
    return res.data;
  },

  async deleteVersion(projectId: string, applicationId: string, versionId: string): Promise<MessageResponse> {
    const res = await apiClient.delete<MessageResponse>(
      `projects/${projectId}/target-applications/${applicationId}/versions/${versionId}`,
    );
    return res.data;
  },

  async rotateApiKey(projectId: string, applicationId: string): Promise<RotateTargetApplicationApiKeyResponse> {
    const res = await apiClient.post<RotateTargetApplicationApiKeyResponse>(
      `projects/${projectId}/target-applications/${applicationId}/api-key/rotate`,
    );
    return res.data;
  },
};
