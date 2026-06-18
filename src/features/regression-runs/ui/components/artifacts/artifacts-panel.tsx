// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import type { RegressionArtifact, RegressionArtifactTreeNode } from "@coveritlabs/contracts";
import { Card } from "@shared/ui";
import { useRegressionRunDownloads } from "../../../model/queries/useRegressionRunDownloads";
import { RegressionArtifactPreviewCard } from "./artifact-preview-card";
import { formatArtifactKind, formatBytes, formatTextArtifactPreview, getArtifactPreviewKind } from "../../../lib/formatters";
import styles from "../../RegressionRuns.module.scss";

const TEXT_PREVIEW_MAX_BYTES = 1024 * 1024;

export function RegressionArtifactsPanel({
  title,
  artifacts,
  artifactTree,
  projectId,
  applicationId,
  runId,
}: {
  title: string;
  artifacts: RegressionArtifact[];
  artifactTree: RegressionArtifactTreeNode[];
  projectId: string;
  applicationId: string;
  runId: string;
}) {
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => new Set());
  const [artifactPreviewUrl, setArtifactPreviewUrl] = useState<string | null>(null);
  const [artifactPreviewText, setArtifactPreviewText] = useState<string | null>(null);
  const [activePreviewError, setActivePreviewError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const { downloadArtifact, downloadingArtifactId, downloadError, loadArtifactPreview, previewArtifactId } =
    useRegressionRunDownloads();

  const displayTree = useMemo(
    () => (artifactTree.length > 0 ? artifactTree : artifacts.map(toFileNode)),
    [artifactTree, artifacts],
  );
  const treeArtifacts = useMemo(() => flattenArtifactTree(displayTree), [displayTree]);

  const activeArtifact = useMemo(
    () => treeArtifacts.find((artifact) => artifact.id === activeArtifactId) ?? null,
    [activeArtifactId, treeArtifacts],
  );

  useEffect(() => {
    setExpandedNodeIds(new Set(collectFolderNodeIds(displayTree)));
  }, [displayTree]);

  useEffect(() => {
    if (treeArtifacts.length === 0) {
      setActiveArtifactId(null);
      return;
    }
    if (!activeArtifactId || !treeArtifacts.some((artifact) => artifact.id === activeArtifactId)) {
      const preferredArtifact = treeArtifacts.find((artifact) => getArtifactPreviewKind(artifact) !== "none") ?? treeArtifacts[0];
      setActiveArtifactId(preferredArtifact.id);
    }
  }, [activeArtifactId, treeArtifacts]);

  useEffect(() => {
    let cancelled = false;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setArtifactPreviewUrl(null);
    }
    setArtifactPreviewText(null);
    setActivePreviewError(null);

    if (!activeArtifact) return;
    const previewKind = getArtifactPreviewKind(activeArtifact);
    if (previewKind === "none") return;
    if (previewKind === "text" && activeArtifact.sizeBytes && activeArtifact.sizeBytes > TEXT_PREVIEW_MAX_BYTES) {
      setActivePreviewError("This artifact is too large to preview inline. Download it to view it.");
      return;
    }

    loadArtifactPreview({
      projectId,
      applicationId,
      runId,
      artifactId: activeArtifact.id,
    })
      .then((blob) => {
        if (cancelled) return;
        if (previewKind === "text") {
          return blob.text().then((text) => {
            if (cancelled) return;
            setArtifactPreviewText(formatTextArtifactPreview(activeArtifact, text));
          });
        }
        const nextUrl = URL.createObjectURL(blob);
        previewUrlRef.current = nextUrl;
        setArtifactPreviewUrl(nextUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setArtifactPreviewUrl(null);
          setActivePreviewError("Preview failed to load. Download the artifact to view it.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeArtifact, applicationId, loadArtifactPreview, projectId, runId]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleDownloadArtifact = async (artifact: RegressionArtifact) => {
    try {
      await downloadArtifact({
        projectId,
        applicationId,
        runId,
        artifactId: artifact.id,
        fileName: artifact.name,
      });
    } catch {
      // The hook owns the visible error state.
    }
  };

  const toggleFolder = (nodeId: string) => {
    setExpandedNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const renderTreeNode = (node: RegressionArtifactTreeNode, depth = 0): ReactNode => {
    if (node.type === "folder") {
      const expanded = expandedNodeIds.has(node.id);
      return (
        <div key={node.id} className={styles.artifactTreeGroup}>
          <div className={`${styles.artifactItem} ${styles.artifactItemFolder}`}>
            <button
              type="button"
              className={styles.artifactSelect}
              style={{ paddingLeft: `${depth * 0.85}rem` }}
              onClick={() => toggleFolder(node.id)}
            >
              <div className={styles.artifactNodeLabel}>
                {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                {expanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                <div>
                  <span className={styles.artifactName}>{node.name}</span>
                  <span className={styles.artifactMeta}>
                    {node.artifactCount} artifact{node.artifactCount === 1 ? "" : "s"} . {formatBytes(node.sizeBytes)}
                  </span>
                </div>
              </div>
            </button>
          </div>
          {expanded && <div className={styles.artifactTreeChildren}>{node.children?.map((child) => renderTreeNode(child, depth + 1))}</div>}
        </div>
      );
    }

    if (!node.artifact) return null;
    const artifact = node.artifact;

    return (
      <div
        key={node.id}
        className={artifact.id === activeArtifactId ? `${styles.artifactItem} ${styles.artifactItemActive}` : styles.artifactItem}
      >
        <button
          type="button"
          className={styles.artifactSelect}
          style={{ paddingLeft: `${depth * 0.85}rem` }}
          onClick={() => setActiveArtifactId(artifact.id)}
        >
          <div className={styles.artifactNodeLabel}>
            <FileText size={16} />
            <div>
              <span className={styles.artifactName}>{node.name}</span>
              <span className={styles.artifactMeta}>
                {formatArtifactKind(artifact.kind)} . {formatBytes(artifact.sizeBytes)}
              </span>
            </div>
          </div>
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className={styles.artifactWorkspace}>
      <Card className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>{title}</h3>
            <p>{artifacts.length} artifact{artifacts.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {treeArtifacts.length === 0 ? (
          <div className={styles.panelEmpty}>No artifacts available.</div>
        ) : (
          <div className={styles.artifactList}>
            {displayTree.map((node) => renderTreeNode(node))}
          </div>
        )}
      </Card>

      <RegressionArtifactPreviewCard
        artifact={activeArtifact}
        previewUrl={artifactPreviewUrl}
        previewText={artifactPreviewText}
        previewLoading={previewArtifactId === activeArtifact?.id}
        previewError={activePreviewError}
        downloading={downloadingArtifactId === activeArtifact?.id}
        downloadError={downloadError}
        onDownload={(artifact) => void handleDownloadArtifact(artifact)}
      />
    </div>
  );
}

function toFileNode(artifact: RegressionArtifact): RegressionArtifactTreeNode {
  return {
    id: `artifact:${artifact.id}`,
    name: artifact.name,
    path: artifact.name,
    type: "file",
    artifact,
    artifactCount: 1,
    sizeBytes: artifact.sizeBytes,
  };
}

function flattenArtifactTree(nodes: RegressionArtifactTreeNode[]): RegressionArtifact[] {
  return nodes.flatMap((node) => {
    if (node.type === "file") return node.artifact ? [node.artifact] : [];
    return flattenArtifactTree(node.children ?? []);
  });
}

function collectFolderNodeIds(nodes: RegressionArtifactTreeNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type !== "folder") return [];
    return [node.id, ...collectFolderNodeIds(node.children ?? [])];
  });
}
