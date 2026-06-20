// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { Member, ProjectResponse } from "@coveritlabs/contracts";
import type { ProjectRole } from "../types/project.types";
import { DEFAULT_PROJECT_ROLE, PROJECT_ROLE_LABELS, PROJECT_ROLES } from "../constants/project.constants";

export const getProjectUserRole = (project: ProjectResponse | null, userId?: string | null): ProjectRole | null => {
  if (!project || !userId) return null;

  const member = project.members?.find((m: Member) => m.user?.id === userId);
  return member ? (member.role as ProjectRole) : null;
};

export const formatProjectRole = (role: ProjectRole): string => PROJECT_ROLE_LABELS[role];

export const normalizeProjectRole = (role?: string): ProjectRole => {
  const normalized = (role ?? DEFAULT_PROJECT_ROLE).toUpperCase();
  return PROJECT_ROLES.includes(normalized as ProjectRole) ? (normalized as ProjectRole) : DEFAULT_PROJECT_ROLE;
};
