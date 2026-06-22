// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { TargetApplicationResponse } from "@coveritlabs/contracts";
import { AlertCircle, X } from "lucide-react";
import { useUIStore } from "@app/store";
import { useTargetApplications } from "@features/target-applications";
import { ContentErrorPanel } from "@shared/feedback/ContentErrorPanel";
import { ErrorBanner } from "@shared/feedback/ErrorBanner";
import { PageLoader } from "@shared/feedback/PageLoader/PageLoader";
import { Button, Card, Input, Label, Select } from "@shared/ui";
import { useGenerateTestFlow, useRegressionCodebases, useTestFlows } from "../model/queries/useTestFlows";
import type {
  GenerateTestFlowRequest,
  ListTestFlowsRequest,
  RegressionCodebaseOption,
  TestFlow,
  TestFlowTypeFilter,
} from "../model/types/test-flows.types";
import { TestFlowsFilters } from "./components/TestFlowsFilters";
import { TestFlowsHeader } from "./components/TestFlowsHeader";
import { TestFlowsTable } from "./components/TestFlowsTable";
import styles from "./TestFlows.module.scss";

const TYPE_VALUES = ["all", "MANUAL", "BUG_REPRODUCTION", "COVERAGE"] as const;
const TEST_FLOWS_PAGE_SIZE = 25;

function getTypeFilter(value: string | null): TestFlowTypeFilter {
  const normalized = value?.toUpperCase() ?? null;
  return normalized && TYPE_VALUES.includes(normalized as TestFlowTypeFilter)
    ? (normalized as TestFlowTypeFilter)
    : "all";
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

function GenerateFlowModal({
  flow,
  codebases,
  busy,
  onClose,
  onSubmit,
}: {
  flow: TestFlow;
  codebases: RegressionCodebaseOption[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: GenerateTestFlowRequest) => void;
}) {
  const [regressionCodebaseId, setRegressionCodebaseId] = useState(codebases[0]?.id ?? "");
  const [codegenBranch, setCodegenBranch] = useState("auto-tests");
  const [prTargetBranch, setPrTargetBranch] = useState("main");
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");
  const [prDraft, setPrDraft] = useState(true);

  useEffect(() => {
    if (!regressionCodebaseId && codebases[0]?.id) {
      setRegressionCodebaseId(codebases[0].id);
    }
  }, [codebases, regressionCodebaseId]);

  const canSubmit =
    regressionCodebaseId.trim().length > 0 &&
    codegenBranch.trim().length > 0 &&
    prTargetBranch.trim().length > 0 &&
    !busy;

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={onClose}>
      <Card className={styles.generateModal} role="dialog" aria-modal="true" aria-label="Generate test flow" onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h3>Generate TestFlow #{flow.id.slice(0, 8)}</h3>
            <p>{flow.stepCount} steps / {flow.testFlowType.toLowerCase().replace("_", " ")}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} disabled={busy}>
            <X size={16} />
          </Button>
        </div>

        <div className={styles.generateForm}>
          <div className={styles.modalField}>
            <Label>Regression codebase</Label>
            <Select
              options={codebases.map((codebase) => ({
                value: codebase.id,
                label: codebase.repositoryUrl,
              }))}
              value={regressionCodebaseId || null}
              onChange={(value) => setRegressionCodebaseId(value ?? "")}
              placeholder="Select codebase"
            />
          </div>

          <div className={styles.modalGridTwo}>
            <div className={styles.modalField}>
              <Label htmlFor="test-flow-codegen-branch">Codegen branch</Label>
              <Input id="test-flow-codegen-branch" value={codegenBranch} onChange={(event) => setCodegenBranch(event.target.value)} />
            </div>
            <div className={styles.modalField}>
              <Label htmlFor="test-flow-pr-target">PR target branch</Label>
              <Input id="test-flow-pr-target" value={prTargetBranch} onChange={(event) => setPrTargetBranch(event.target.value)} />
            </div>
          </div>

          <div className={styles.modalField}>
            <Label htmlFor="test-flow-pr-title">PR title</Label>
            <Input id="test-flow-pr-title" value={prTitle} onChange={(event) => setPrTitle(event.target.value)} />
          </div>

          <div className={styles.modalField}>
            <Label htmlFor="test-flow-pr-body">PR body</Label>
            <textarea id="test-flow-pr-body" className={styles.modalTextarea} value={prBody} onChange={(event) => setPrBody(event.target.value)} />
          </div>

          <label className={styles.modalCheckbox}>
            <input type="checkbox" checked={prDraft} onChange={(event) => setPrDraft(event.target.checked)} />
            <span>Create PR as draft</span>
          </label>
        </div>

        <div className={styles.modalActions}>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                regressionCodebaseId,
                codegenConfig: {
                  codegenBranch: codegenBranch.trim(),
                  prTargetBranch: prTargetBranch.trim(),
                  prTitle: prTitle.trim() || undefined,
                  prBody: prBody.trim() || undefined,
                  prDraft,
                },
              })
            }
            disabled={!canSubmit}
          >
            Generate
          </Button>
        </div>
      </Card>
    </div>
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
  const [generatingFlow, setGeneratingFlow] = useState<TestFlow | null>(null);

  const applicationId = searchParams.get("appId");
  const versionId = searchParams.get("versionId");
  const type = getTypeFilter(searchParams.get("type"));

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
        type: null,
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
          type: null,
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
      type: type === "all" ? undefined : type,
      cursor: cursor ?? undefined,
      limit: TEST_FLOWS_PAGE_SIZE,
    }),
    [cursor, type, versionId],
  );

  const flowsQuery = useTestFlows(selectedProject?.id ?? null, activeApplication?.id ?? null, filters);
  const regressionCodebasesQuery = useRegressionCodebases(selectedProject?.id ?? null, activeApplication?.id ?? null);
  const generateFlowMutation = useGenerateTestFlow();
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
        flow.appVersionName,
        flow.checkpointStateHash,
        flow.testFlowType,
        flow.status,
        flow.generatedAt ?? "",
        flow.modifiedAt,
        flow.crawlSession.status,
        flow.crawlSession.triggerType,
        flow.transitionRefs.join(" "),
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
        type: null,
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
        type={type}
        searchText={searchText}
        onApplicationChange={(value) => {
          resetPagination();
          updateSearchParams(
            searchParams,
            setSearchParams,
            {
              appId: value,
              versionId: null,
              type: null,
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
        onTypeChange={(value) => {
          resetPagination();
          updateSearchParams(
            searchParams,
            setSearchParams,
            {
              type: value === "all" ? null : value,
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
          generatingFlowId={generateFlowMutation.isPending ? generatingFlow?.id : null}
          onGenerate={(flow) => setGeneratingFlow(flow)}
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

      {generatingFlow ? (
        <GenerateFlowModal
          flow={generatingFlow}
          codebases={regressionCodebasesQuery.data ?? []}
          busy={generateFlowMutation.isPending}
          onClose={() => {
            if (!generateFlowMutation.isPending) setGeneratingFlow(null);
          }}
          onSubmit={(payload) => {
            if (!selectedProject || !activeApplication) return;
            generateFlowMutation.mutate(
              {
                projectId: selectedProject.id,
                applicationId: activeApplication.id,
                flowId: generatingFlow.id,
                payload,
              },
              {
                onSuccess: () => setGeneratingFlow(null),
              },
            );
          }}
        />
      ) : null}
    </div>
  );
}

export default TestFlows;
