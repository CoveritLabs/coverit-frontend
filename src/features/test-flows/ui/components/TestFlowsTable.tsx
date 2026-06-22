// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { RefreshCw } from "lucide-react";
import { Badge, Button, Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@shared/ui";
import type { TestFlow } from "../../model/types/test-flows.types";
import styles from "../TestFlows.module.scss";

function formatFlowType(type: TestFlow["testFlowType"]) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatStatus(status: TestFlow["status"]) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function shortId(value: string) {
  return value.slice(0, 8);
}

export function TestFlowsTable({
  flows,
  formatDateTime,
  currentPage,
  hasPreviousPage,
  hasNextPage,
  isFetching,
  onPreviousPage,
  onNextPage,
  onGenerate,
  generatingFlowId,
}: {
  flows: TestFlow[];
  formatDateTime: (value?: string) => string;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isFetching: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onGenerate: (flow: TestFlow) => void;
  generatingFlowId?: string | null;
}) {
  const showEmptyState = flows.length === 0 && !hasPreviousPage && !hasNextPage;

  return (
    <Card className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>TestFlow</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Steps</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Crawl Session</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {showEmptyState ? (
              <TableRow className={styles.emptyRow}>
                <TableCell colSpan={8} className={styles.emptyCell}>
                  <div className={styles.tableEmpty}>
                    <h3>No test flows found</h3>
                    <p>Try a different application, version, flow type, or search query.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              flows.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell>
                    <div className={styles.flowIdCell} title={flow.id}>
                      <span>TestFlow #{shortId(flow.id)}</span>
                      <code>{shortId(flow.checkpointStateHash)}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={styles.typeBadge}>
                      {formatFlowType(flow.testFlowType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={styles.stepCount}>{flow.stepCount}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${styles.statusBadge} ${styles[`status${flow.status}`]}`}
                      title={
                        flow.generatedAt
                          ? `Generated ${formatDateTime(flow.generatedAt)}; modified ${formatDateTime(flow.modifiedAt)}`
                          : `Modified ${formatDateTime(flow.modifiedAt)}`
                      }
                    >
                      {formatStatus(flow.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={styles.versionText} title={flow.appVersionId}>
                      {flow.appVersionName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className={styles.sessionCell} title={flow.crawlSessionId}>
                      <code>{shortId(flow.crawlSessionId)}</code>
                      <span>
                        {flow.crawlSession.triggerType} / {flow.crawlSession.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={styles.dateText}>{formatDateTime(flow.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className={styles.generateButton}
                      onClick={() => onGenerate(flow)}
                      disabled={flow.status === "GENERATED" || generatingFlowId === flow.id}
                      title={
                        flow.status === "GENERATED"
                          ? "This flow is up to date"
                          : `Generate from ${flow.transitionRefs.length} transition(s)`
                      }
                    >
                      <RefreshCw size={14} />
                      Generate
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {flows.length > 0 || hasPreviousPage || hasNextPage ? (
        <div className={styles.tableFooter}>
          <span className={styles.paginationInfo}>
            Showing {flows.length} {flows.length === 1 ? "flow" : "flows"}
          </span>
          <div className={styles.paginationControls}>
            <Button
              size="sm"
              variant="ghost"
              className={styles.paginationButton}
              onClick={onPreviousPage}
              disabled={!hasPreviousPage || isFetching}
            >
              Prev
            </Button>
            <span className={styles.paginationPage}>Page {currentPage}</span>
            <Button
              size="sm"
              variant="ghost"
              className={styles.paginationButton}
              onClick={onNextPage}
              disabled={!hasNextPage || isFetching}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
