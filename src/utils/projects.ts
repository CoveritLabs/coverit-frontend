// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ProjectResponse } from "@coveritlabs/contracts";
import type { ProjectRole } from "@constants/projectRoles";

export const getProjectUserRole = (project: ProjectResponse | null, userId?: string | null): ProjectRole | null => {
  if (!project || !userId) return null;

  const member = project.members?.find((m) => m.user?.id === userId);
  return member ? (member.role as ProjectRole) : null;
};
