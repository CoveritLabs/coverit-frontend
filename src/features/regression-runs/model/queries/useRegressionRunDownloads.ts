// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useCallback, useState } from "react";
import { regressionRunService } from "../../api/regressionRunService";

interface ArtifactIdentity {
  projectId: string;
  applicationId: string;
  runId: string;
  artifactId: string;
  fileName: string;
}

export function useRegressionRunDownloads() {
  const [downloadingArtifactId, setDownloadingArtifactId] = useState<string | null>(null);
  const [previewArtifactId, setPreviewArtifactId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const downloadArtifact = useCallback(async ({ projectId, applicationId, runId, artifactId, fileName }: ArtifactIdentity) => {
    setDownloadingArtifactId(artifactId);
    setDownloadError(null);
    try {
      const artifact = await regressionRunService.downloadArtifact(projectId, applicationId, runId, artifactId);
      const url = URL.createObjectURL(artifact.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = artifact.fileName ?? fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError("Download failed. Try again.");
      throw error;
    } finally {
      setDownloadingArtifactId((current) => (current === artifactId ? null : current));
    }
  }, []);

  const loadArtifactPreview = useCallback(async ({ projectId, applicationId, runId, artifactId }: Omit<ArtifactIdentity, "fileName">) => {
    setPreviewArtifactId(artifactId);
    setPreviewError(null);
    try {
      const artifact = await regressionRunService.downloadArtifact(projectId, applicationId, runId, artifactId);
      return artifact.blob;
    } catch (error) {
      setPreviewError("Preview failed to load. Download the artifact to view it.");
      throw error;
    } finally {
      setPreviewArtifactId((current) => (current === artifactId ? null : current));
    }
  }, []);

  return {
    downloadingArtifactId,
    previewArtifactId,
    downloadError,
    previewError,
    downloadArtifact,
    loadArtifactPreview,
  };
}
