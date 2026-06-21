// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { TargetApplicationResponse } from "@coveritlabs/contracts";
import { AlertCircle } from "lucide-react";
import { useUIStore } from "@app/store";
import { useTargetApplications } from "@features/target-applications";
import { ContentErrorPanel } from "@shared/feedback/ContentErrorPanel";
import { ErrorBanner } from "@shared/feedback/ErrorBanner";
import { PageLoader } from "@shared/feedback/PageLoader/PageLoader";
import { Card } from "@shared/ui";
import { useTestFlows } from "../model/queries/useTestFlows";
import type { ListTestFlowsRequest, TestFlow, TestFlowClippedFilter } from "../model/types/test-flows.types";
import { TestFlowsFilters } from "./components/TestFlowsFilters";
import { TestFlowsHeader } from "./components/TestFlowsHeader";
import { TestFlowsTable } from "./components/TestFlowsTable";
import styles from "./TestFlows.module.scss";

const CLIPPED_VALUES = ["all", "complete", "clipped"] as const;
const TEST_FLOWS_PAGE_SIZE = 25;

function getClippedFilter(value: string | null): TestFlowClippedFilter {
  return value && CLIPPED_VALUES.includes(value as TestFlowClippedFilter) ? (value as TestFlowClippedFilter) : "all";
}

function formatDateTime(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function updateSearchParams(
  searchParams: URLSearchParams,
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  updates: Record<string, string | null>,
  replace = true,
) {
  const next = new URLSearchParams(searchParams);
  Object.entries(updates).forEach(([key, value]) => {
    if (!value) next.delete(key);
    else next.set(key, value);
  });
  setSearchParams(next, { replace });
}

function getLatestFlowAt(flows: TestFlow[]) {
  return flows.reduce<string | undefined>((latest, flow) => {
    if (!latest) return flow.createdAt;
    return new Date(flow.createdAt).getTime() > new Date(latest).getTime() ? flow.createdAt : latest;
  }, undefined);
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <AlertCircle size={20} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </Card>
  );
}

function TestFlows() {
  const selectedProject = useUIStore((state) => state.selectedProject);
  const {
    data: applications = [],
    isLoading: applicationsLoading,
    isError: applicationsError,
  } = useTargetApplications(selectedProject?.id ?? null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);

  const applicationId = searchParams.get("appId");
  const versionId = searchParams.get("versionId");
  const clipped = getClippedFilter(searchParams.get("clipped"));

  const activeApplication = useMemo(
    () => applications.find((application) => application.id === applicationId) ?? null,
    [applicationId, applications],
  );

  useEffect(() => {
    if (applicationsLoading) return;
    if (applications.length === 0) {
      setCursor(null);
      setCursorStack([]);
      updateSearchParams(searchParams, setSearchParams, {
        appId: null,
        versionId: null,
        clipped: null,
      });
      return;
    }

    if (!applicationId || !applications.some((application) => application.id === applicationId)) {
      setCursor(null);
      setCursorStack([]);
      updateSearchParams(
        searchParams,
        setSearchParams,
        {
          appId: applications[0].id,
          versionId: null,
          clipped: null,
        },
        false,
      );
    }
  }, [applicationId, applications, applicationsLoading, searchParams, setSearchParams]);

  useEffect(() => {
    if (!activeApplication || !versionId) return;
    const versionExists = activeApplication.versions?.some((version: { id: string }) => version.id === versionId);
    if (!versionExists) {
      setCursor(null);
      setCursorStack([]);
      updateSearchParams(searchParams, setSearchParams, { versionId: null }, false);
    }
  }, [activeApplication, searchParams, setSearchParams, versionId]);

  const filters = useMemo<ListTestFlowsRequest>(
    () => ({
      versionId: versionId ?? undefined,
      clipped: clipped === "all" ? undefined : clipped === "clipped",
      cursor: cursor ?? undefined,
      limit: TEST_FLOWS_PAGE_SIZE,
    }),
    [clipped, cursor, versionId],
  );

  const flowsQuery = useTestFlows(selectedProject?.id ?? null, activeApplication?.id ?? null, filters);
  const flows = useMemo(() => flowsQuery.data?.flows ?? [], [flowsQuery.data?.flows]);
  const filteredFlows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const sortedFlows = [...flows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (!query) return sortedFlows;

    return sortedFlows.filter((flow) =>
      [
        flow.id,
        flow.crawlSessionId,
        flow.appVersionId,
        flow.targetStateHash,
        flow.checkpointStateHash,
        flow.checkpointUrl,
        flow.isClipped ? "clipped" : "complete",
        String(flow.stepCount),
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [flows, searchText]);

  const applicationOptions = useMemo(
    () =>
      applications.map((application: TargetApplicationResponse) => ({
        value: application.id,
        label: application.name,
      })),
    [applications],
  );

  const versionOptions = useMemo(
    () => [
      { value: "all", label: "All versions" },
      ...((activeApplication?.versions ?? []).map((version: { id: string; version: string }) => ({
        value: version.id,
        label: version.version,
      })) as Array<{ value: string; label: string }>),
    ],
    [activeApplication],
  );

  const latestFlowAt = getLatestFlowAt(filteredFlows);
  const nextCursor = flowsQuery.data?.nextCursor ?? null;
  const currentPage = cursorStack.length + 1;

  const resetPagination = () => {
    setCursor(null);
    setCursorStack([]);
  };

  const clearFilters = () => {
    setSearchText("");
    resetPagination();
    updateSearchParams(
      searchParams,
      setSearchParams,
      {
        versionId: null,
        clipped: null,
      },
      false,
    );
  };

  if (!selectedProject) {
    return (
      <EmptyState title="Choose a project" description="Select a project from the sidebar to inspect test flows." />
    );
  }

  if (applicationsLoading) {
    return <PageLoader />;
  }

  if (applicationsError) {
    return <ErrorBanner message="Failed to load target applications for this project." />;
  }

  if (applications.length === 0) {
    return (
      <EmptyState title="No applications yet" description="Create a target application before viewing test flows." />
    );
  }

  return (
    <div className={styles.page}>
      <TestFlowsHeader
        applicationName={activeApplication?.name ?? null}
        flowCount={filteredFlows.length}
        latestFlowAt={latestFlowAt ? formatDateTime(latestFlowAt) : undefined}
      />

      <TestFlowsFilters
        applicationOptions={applicationOptions}
        versionOptions={versionOptions}
        applicationId={activeApplication?.id ?? null}
        versionId={versionId}
        clipped={clipped}
        searchText={searchText}
        onApplicationChange={(value) => {
          resetPagination();
          updateSearchParams(
            searchParams,
            setSearchParams,
            {
              appId: value,
              versionId: null,
              clipped: null,
            },
            false,
          );
        }}
        onVersionChange={(value) => {
          resetPagination();
          updateSearchParams(
            searchParams,
            setSearchParams,
            {
              versionId: value === "all" ? null : value,
            },
            false,
          );
        }}
        onClippedChange={(value) => {
          resetPagination();
          updateSearchParams(
            searchParams,
            setSearchParams,
            {
              clipped: value === "all" ? null : value,
            },
            false,
          );
        }}
        onSearchChange={setSearchText}
        onClear={clearFilters}
      />

      {flowsQuery.isError ? (
        <ContentErrorPanel
          title="Failed to load test flows"
          message="The selected filters could not be loaded. Retry the request or adjust the filters."
          error={flowsQuery.error}
          onRetry={() => void flowsQuery.refetch()}
          className={styles.contentErrorPanel}
        />
      ) : (
        <TestFlowsTable
          flows={filteredFlows}
          formatDateTime={formatDateTime}
          currentPage={currentPage}
          hasPreviousPage={cursorStack.length > 0}
          hasNextPage={Boolean(nextCursor)}
          isFetching={flowsQuery.isFetching}
          onPreviousPage={() => {
            const previousCursor = cursorStack[cursorStack.length - 1] ?? null;
            setCursor(previousCursor);
            setCursorStack((stack) => stack.slice(0, -1));
          }}
          onNextPage={() => {
            if (!nextCursor) return;
            setCursorStack((stack) => [...stack, cursor]);
            setCursor(nextCursor);
          }}
        />
      )}
    </div>
  );
}

export default TestFlows;
