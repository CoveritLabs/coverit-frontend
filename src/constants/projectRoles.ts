// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export const PROJECT_ROLES = ["ADMIN", "MEMBER", "VIEWER"] as const;

export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const DEFAULT_PROJECT_ROLE: ProjectRole = "VIEWER";

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export const formatProjectRole = (role: ProjectRole): string => PROJECT_ROLE_LABELS[role];

export const normalizeProjectRole = (role?: string): ProjectRole => {
  const normalized = (role ?? DEFAULT_PROJECT_ROLE).toUpperCase();
  return PROJECT_ROLES.includes(normalized as ProjectRole) ? (normalized as ProjectRole) : DEFAULT_PROJECT_ROLE;
};
