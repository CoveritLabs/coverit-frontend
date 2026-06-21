// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Badge, Button, Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@shared/ui";
import type { TestFlow } from "../../model/types/test-flows.types";
import styles from "../TestFlows.module.scss";

export function TestFlowsTable({
  flows,
  formatDateTime,
  currentPage,
  hasPreviousPage,
  hasNextPage,
  isFetching,
  onPreviousPage,
  onNextPage,
}: {
  flows: TestFlow[];
  formatDateTime: (value?: string) => string;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isFetching: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  const showEmptyState = flows.length === 0 && !hasPreviousPage && !hasNextPage;

  return (
    <Card className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Checkpoint URL</TableHeaderCell>
              <TableHeaderCell>Checkpoint Hash</TableHeaderCell>
              <TableHeaderCell>Target Hash</TableHeaderCell>
              <TableHeaderCell>Steps</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Crawl Session</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {showEmptyState ? (
              <TableRow className={styles.emptyRow}>
                <TableCell colSpan={7} className={styles.emptyCell}>
                  <div className={styles.tableEmpty}>
                    <h3>No test flows found</h3>
                    <p>Try a different application, version, clipped status, or search query.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              flows.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell>
                    <span className={styles.urlText} title={flow.checkpointUrl || "No checkpoint URL"}>
                      {flow.checkpointUrl || "No checkpoint URL"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code className={styles.hashText} title={flow.checkpointStateHash}>
                      {flow.checkpointStateHash}
                    </code>
                  </TableCell>
                  <TableCell>
                    <code className={styles.hashText} title={flow.targetStateHash}>
                      {flow.targetStateHash}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className={styles.stepCount}>{flow.stepCount}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={flow.isClipped ? styles.clippedBadge : styles.completeBadge}
                    >
                      {flow.isClipped ? "Clipped" : "Complete"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className={styles.hashText} title={flow.crawlSessionId}>
                      {flow.crawlSessionId}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className={styles.dateText}>{formatDateTime(flow.createdAt)}</span>
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
