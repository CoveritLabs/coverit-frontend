// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { ArrowDownToLine, FileText, Image as ImageIcon } from "lucide-react";
import type { RegressionArtifact } from "@coveritlabs/contracts";
import { Button, Card } from "@shared/ui";
import { formatArtifactKind, formatBytes, getArtifactPreviewKind, safeJson } from "../../../lib/formatters";
import styles from "../../RegressionRuns.module.scss";

export function RegressionArtifactPreviewCard({
  artifact,
  previewUrl,
  previewText,
  previewLoading,
  previewError,
  downloading,
  downloadError,
  onDownload,
}: {
  artifact: RegressionArtifact | null;
  previewUrl: string | null;
  previewText: string | null;
  previewLoading: boolean;
  previewError: string | null;
  downloading: boolean;
  downloadError: string | null;
  onDownload: (artifact: RegressionArtifact) => void;
}) {
  if (!artifact) {
    return (
      <Card className={`${styles.panel} ${styles.artifactPreviewPanel}`}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Artifact preview</h3>
            <p>Select an artifact to inspect it.</p>
          </div>
        </div>
        <div className={styles.panelEmpty}>No artifact selected.</div>
      </Card>
    );
  }

  const previewKind = getArtifactPreviewKind(artifact);
  const isPreviewable = previewKind === "image" || previewKind === "video" || previewKind === "text";
  const previewIcon = previewKind === "image" || previewKind === "video" ? <ImageIcon size={18} /> : <FileText size={18} />;

  return (
    <Card className={`${styles.panel} ${styles.artifactPreviewPanel}`}>
      <div className={styles.panelHeader}>
        <div>
          <h3>{artifact.name}</h3>
          <p>
            {formatArtifactKind(artifact.kind)} . {artifact.contentType ?? "unknown content type"}
          </p>
          {downloadError && <p className={styles.panelError}>{downloadError}</p>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDownload(artifact)}
          disabled={downloading}
          className={styles.artifactPreviewDownloadButton}
        >
          <ArrowDownToLine size={14} />
          {downloading ? "Downloading" : "Download"}
        </Button>
      </div>

      <div className={styles.previewCard}>
        {previewLoading ? (
          <div className={styles.panelEmpty}>Loading preview...</div>
        ) : previewKind === "image" && previewUrl ? (
          <img src={previewUrl} alt={artifact.name} className={styles.previewImage} />
        ) : previewKind === "video" && previewUrl ? (
          <video src={previewUrl} controls className={styles.previewVideo} />
        ) : previewKind === "text" && previewText != null ? (
          <pre className={`${styles.codeBlock} ${styles.previewText}`}>{previewText}</pre>
        ) : isPreviewable && previewError ? (
          <div className={styles.previewFallback}>
            {previewIcon}
            <p>{previewError}</p>
            <span>{formatBytes(artifact.sizeBytes)}</span>
          </div>
        ) : isPreviewable ? (
          <div className={styles.previewFallback}>
            {previewIcon}
            <p>Preparing preview...</p>
            <span>{formatBytes(artifact.sizeBytes)}</span>
          </div>
        ) : (
          <div className={styles.previewFallback}>
            <FileText size={18} />
            <p>Inline preview is not available for this artifact.</p>
            <span>{formatBytes(artifact.sizeBytes)}</span>
          </div>
        )}
      </div>

      <p className={styles.artifactMetadataTitle}>Artifact metadata</p>
      <pre className={`${styles.codeBlock} ${styles.artifactMetadataBlock}`}>{safeJson(artifact.metadata ?? artifact.data)}</pre>
    </Card>
  );
}
