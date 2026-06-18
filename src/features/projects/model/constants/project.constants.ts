// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ProjectRole } from "../types/project.types";

export const PROJECT_ROLES: readonly ProjectRole[] = ["ADMIN", "MEMBER", "VIEWER"];

export const DEFAULT_PROJECT_ROLE: ProjectRole = "VIEWER";

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};
