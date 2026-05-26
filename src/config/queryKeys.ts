// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...projectKeys.lists(), filters] as const,
  detail: (projectId: string) => [...projectKeys.all, "detail", projectId] as const,
};

export const queryKeys = {
  projects: projectKeys,
};
