// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export { targetApplicationService } from "./api/targetApplicationService";
export { useTargetApplication, useTargetApplications } from "./model/queries/useTargetApplication";
export {
  useCreateTargetApplication,
  useCreateTargetApplicationVersion,
  useDeleteTargetApplication,
  useDeleteTargetApplicationVersion,
  useRotateTargetApplicationApiKey,
  useUpdateTargetApplication,
} from "./model/mutations/useTargetApplicationMutations";
