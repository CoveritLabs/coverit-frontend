// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export { projectService } from "./api/projectService";
export { useProject, useProjects } from "./model/queries/useProjects";
export {
  DEFAULT_PROJECT_ROLE,
  PROJECT_ROLE_LABELS,
  PROJECT_ROLES,
} from "./model/constants/project.constants";
export {
  useAddProjectMembers,
  useCreateProject,
  useDeleteProject,
  useLeaveProject,
  useRemoveProjectMembers,
  useUpdateProjectMember,
  useUpdateProject,
} from "./model/mutations/useProjectMutations";
export { formatProjectRole, getProjectUserRole, normalizeProjectRole } from "./model/mappers/project";
export type { ProjectRole } from "./model/types/project.types";
