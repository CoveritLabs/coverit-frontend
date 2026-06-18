// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@shared/api/client";
import type { RegressionArtifactDownloadResponse } from "../model/types/artifact-download.types";
import { getHeaderValue, parseContentDispositionFileName } from "./httpHeaders";

export async function downloadArtifact(
  projectId: string,
  applicationId: string,
  runId: string,
  artifactId: string,
): Promise<RegressionArtifactDownloadResponse> {
  const res = await apiClient.get<Blob>(
    `projects/${projectId}/target-applications/${applicationId}/runs/${runId}/artifacts/${artifactId}/download`,
    {
      responseType: "blob",
      headers: {
        Accept: "*/*",
      },
    },
  );
  const contentType = getHeaderValue(res.headers, "content-type");
  const fileName = parseContentDispositionFileName(getHeaderValue(res.headers, "content-disposition"));

  return {
    blob: contentType && res.data.type !== contentType ? new Blob([res.data], { type: contentType }) : res.data,
    contentType,
    fileName,
  };
}
