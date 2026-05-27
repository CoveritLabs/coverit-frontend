// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...projectKeys.lists(), filters] as const,
  detail: (projectId: string) => [...projectKeys.all, "detail", projectId] as const,
};

const targetApplicationKeys = {
  all: ["target-applications"] as const,
  lists: (projectId: string) => [...targetApplicationKeys.all, "list", projectId] as const,
  detail: (projectId: string, applicationId: string) =>
    [...targetApplicationKeys.all, "detail", projectId, applicationId] as const,
};

export const queryKeys = {
  projects: projectKeys,
  targetApplications: targetApplicationKeys,
};
