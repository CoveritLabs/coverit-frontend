// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { ROUTES } from "@shared/config/routes";

export function manualSessionRoute(projectId: string, applicationId: string, versionId: string, sessionId: string) {
  return ROUTES.MANUAL_RECORDING.replace(":projectId", projectId)
    .replace(":applicationId", applicationId)
    .replace(":versionId", versionId)
    .replace(":sessionId", sessionId);
}
