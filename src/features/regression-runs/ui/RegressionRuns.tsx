// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { TargetApplicationResponse } from "@coveritlabs/contracts";
import { ErrorBanner } from "@shared/feedback/ErrorBanner";
import { PageLoader } from "@shared/feedback/PageLoader/PageLoader";
import {
  useRegressionRun,
  useRegressionRunArtifacts,
  useRegressionRuns,
  useRegressionScenario,
  useRegressionScenarioArtifacts,
  useRegressionScenarioEvents,
  useRegressionScenarios,
} from "../model/queries/useRegressionRuns";
import { useIntegrationStatus } from "@features/integrations";
import {
  applicationContextEquals,
  buildApplicationContext,
  resolveApplicationSelection,
  resolveVersionSelection,
  useTargetApplications,
} from "@features/target-applications";
import type {
  SearchParamStatus,
  RegressionRunsView,
  RegressionRunTab,
  RegressionScenarioTab,
  RegressionScenarioWithReports,
} from "../model/types/regression-runs.types";
import { EmptyState, TabButton } from "./components/common/common";
import { RegressionRunsFilters } from "./components/filters/filters";
import { RegressionRunsHeader } from "./components/filters/header";
import { RegressionRunsList } from "./components/runs/runs-list";
import { RegressionRunWorkspace } from "./components/runs/run-workspace";
import { updateSearchParams } from "../lib/formatters";
import { buildVersionNameMap, enrichRegressionRun, enrichRegressionRuns } from "../model/mappers/run-view-model";
import styles from "./RegressionRuns.module.scss";
import { useUIStore } from "@app/store";

function getSearchParamValue<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

const VIEW_OPTIONS = ["overview", "statistics"] as const;
const RUN_TAB_OPTIONS = ["scenarios", "artifacts"] as const;
const SCENARIO_TAB_OPTIONS = ["events", "artifacts"] as const;
const LazyRegressionStatsTab = lazy(() =>
  import("./components/stats/stats-tab").then((module) => ({ default: module.RegressionStatsTab })),
);

function RegressionRuns() {
  const selectedProject = useUIStore((state) => state.selectedProject);
  const selectedApplicationContext = useUIStore((state) => state.selectedApplicationContext);
  const setSelectedApplicationContext = useUIStore((state) => state.setSelectedApplicationContext);
  const {
    data: applications = [],
    isLoading: applicationsLoading,
    isError: applicationsError,
    isFetching: applicationsFetching,
    isPlaceholderData: applicationsPlaceholderData,
    refetch: refetchApplications,
  } = useTargetApplications(selectedProject?.id ?? null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState("");

  const requestedApplicationId = searchParams.get("appId");
  const requestedVersionId = searchParams.get("versionId");
  const projectId = selectedProject?.id ?? null;
  const status = (searchParams.get("status") as SearchParamStatus | null) ?? "all";
  const view = getSearchParamValue<RegressionRunsView>(searchParams.get("view"), VIEW_OPTIONS, "overview");
  const runId = searchParams.get("runId");
  const runTab = getSearchParamValue<RegressionRunTab>(searchParams.get("runTab"), RUN_TAB_OPTIONS, "scenarios");
  const scenarioId = searchParams.get("scenarioId");
  const scenarioTab = getSearchParamValue<RegressionScenarioTab>(
    searchParams.get("scenarioTab"),
    SCENARIO_TAB_OPTIONS,
    "events",
  );

  const activeApplication = useMemo(
    () =>
      resolveApplicationSelection({
        applications,
        projectId,
        requestedApplicationId,
        storedContext: selectedApplicationContext,
      }),
    [applications, projectId, requestedApplicationId, selectedApplicationContext],
  );
  const applicationId = activeApplication?.id ?? null;
  const selectedVersion = useMemo(
    () =>
      resolveVersionSelection({
        versions: activeApplication?.versions ?? [],
        projectId,
        applicationId,
        requestedVersionId,
        storedContext: selectedApplicationContext,
      }),
    [activeApplication?.versions, applicationId, projectId, requestedVersionId, selectedApplicationContext],
  );
  const versionId = selectedVersion?.id ?? null;

  const versionNameById = useMemo(
    () => buildVersionNameMap(activeApplication?.versions ?? []),
    [activeApplication?.versions],
  );

  useEffect(() => {
    if (applicationsLoading || applicationsPlaceholderData) return;
    if (applications.length === 0) {
      if (selectedApplicationContext?.projectId === projectId) setSelectedApplicationContext(null);
      updateSearchParams(searchParams, setSearchParams, {
        appId: null,
        versionId: null,
        runId: null,
        runTab: null,
        scenarioId: null,
        scenarioTab: null,
      });
      return;
    }

    if (!activeApplication) return;

    const nextContext = buildApplicationContext(selectedProject!.id, activeApplication, selectedVersion);
    if (!applicationContextEquals(selectedApplicationContext, nextContext)) {
      setSelectedApplicationContext(nextContext);
    }

    const updates: Record<string, string | null> = {};
    if (requestedApplicationId !== activeApplication.id) updates.appId = activeApplication.id;
    if (versionId && requestedVersionId !== versionId) updates.versionId = versionId;
    if (!versionId && requestedVersionId) updates.versionId = null;

    if (Object.keys(updates).length > 0) {
      updateSearchParams(searchParams, setSearchParams, {
        ...updates,
        runId: null,
        runTab: "scenarios",
        scenarioId: null,
        scenarioTab: "events",
      });
    }
  }, [
    activeApplication,
    applications.length,
    applicationsLoading,
    applicationsPlaceholderData,
    projectId,
    requestedApplicationId,
    requestedVersionId,
    searchParams,
    selectedApplicationContext,
    selectedProject,
    selectedVersion,
    setSearchParams,
    setSelectedApplicationContext,
    versionId,
  ]);

  const runFilters = useMemo(
    () => ({
      versionId: versionId ?? undefined,
      status: status === "all" ? undefined : status,
    }),
    [status, versionId],
  );

  const runsQuery = useRegressionRuns(selectedProject?.id ?? null, activeApplication?.id ?? null, runFilters);
  const runDetailsQuery = useRegressionRun(selectedProject?.id ?? null, activeApplication?.id ?? null, runId);
  const scenariosQuery = useRegressionScenarios(selectedProject?.id ?? null, activeApplication?.id ?? null, runId);
  const scenarioQuery = useRegressionScenario(
    selectedProject?.id ?? null,
    activeApplication?.id ?? null,
    runId,
    scenarioId,
  );
  const runArtifactsQuery = useRegressionRunArtifacts(
    selectedProject?.id ?? null,
    activeApplication?.id ?? null,
    runId,
  );
  const scenarioEventsQuery = useRegressionScenarioEvents(
    selectedProject?.id ?? null,
    activeApplication?.id ?? null,
    runId,
    scenarioId,
  );
  const scenarioArtifactsQuery = useRegressionScenarioArtifacts(
    selectedProject?.id ?? null,
    activeApplication?.id ?? null,
    runId,
    scenarioId,
  );
  const jiraStatusQuery = useIntegrationStatus(selectedProject?.id ?? null, "jira");

  const runs = useMemo(
    () => enrichRegressionRuns(runsQuery.data?.runs ?? [], versionNameById),
    [runsQuery.data?.runs, versionNameById],
  );
  const filteredRuns = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return runs;
    return runs.filter((run) =>
      [run.runId, run.versionName, run.versionId, run.status].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [runs, searchText]);

  const selectedRun =
    (runDetailsQuery.data ? enrichRegressionRun(runDetailsQuery.data, versionNameById) : null) ??
    filteredRuns.find((run) => run.runId === runId) ??
    runs.find((run) => run.runId === runId) ??
    null;
  const scenarios = useMemo<RegressionScenarioWithReports[]>(
    () => scenariosQuery.data?.scenarios ?? [],
    [scenariosQuery.data?.scenarios],
  );
  const selectedScenario =
    scenarioQuery.data ??
    scenarios.find((scenario: RegressionScenarioWithReports) => scenario.id === scenarioId) ??
    null;
  const runArtifacts = useMemo(() => runArtifactsQuery.data?.artifacts ?? [], [runArtifactsQuery.data?.artifacts]);
  const runArtifactTree = useMemo(
    () => runArtifactsQuery.data?.artifactTree ?? [],
    [runArtifactsQuery.data?.artifactTree],
  );
  const scenarioArtifacts = useMemo(
    () => scenarioArtifactsQuery.data?.artifacts ?? [],
    [scenarioArtifactsQuery.data?.artifacts],
  );
  const scenarioArtifactTree = useMemo(
    () => scenarioArtifactsQuery.data?.artifactTree ?? [],
    [scenarioArtifactsQuery.data?.artifactTree],
  );
  const scenarioEvents = useMemo(() => scenarioEventsQuery.data?.events ?? [], [scenarioEventsQuery.data?.events]);
  const jiraReportingEnabled =
    jiraStatusQuery.data?.reportingConfig?.case === "jiraReportingConfig" &&
    jiraStatusQuery.data.reportingConfig.value.enabled;

  const overviewContentError = useMemo(() => {
    const contentQueries = [
      {
        isError: runsQuery.isError,
        error: runsQuery.error,
        refetch: runsQuery.refetch,
      },
      {
        isError: Boolean(runId) && runDetailsQuery.isError,
        error: runDetailsQuery.error,
        refetch: runDetailsQuery.refetch,
      },
      {
        isError: Boolean(runId) && scenariosQuery.isError,
        error: scenariosQuery.error,
        refetch: scenariosQuery.refetch,
      },
      {
        isError: Boolean(scenarioId) && scenarioQuery.isError,
        error: scenarioQuery.error,
        refetch: scenarioQuery.refetch,
      },
      {
        isError: Boolean(runId) && runTab === "artifacts" && runArtifactsQuery.isError,
        error: runArtifactsQuery.error,
        refetch: runArtifactsQuery.refetch,
      },
      {
        isError:
          Boolean(runId) &&
          Boolean(scenarioId) &&
          runTab === "scenarios" &&
          scenarioTab === "events" &&
          scenarioEventsQuery.isError,
        error: scenarioEventsQuery.error,
        refetch: scenarioEventsQuery.refetch,
      },
      {
        isError:
          Boolean(runId) &&
          Boolean(scenarioId) &&
          runTab === "scenarios" &&
          scenarioTab === "artifacts" &&
          scenarioArtifactsQuery.isError,
        error: scenarioArtifactsQuery.error,
        refetch: scenarioArtifactsQuery.refetch,
      },
    ];
    const failedQueries = contentQueries.filter((query) => query.isError);

    if (failedQueries.length === 0) return null;

    return {
      error: failedQueries[0].error,
      retry: () => {
        void Promise.all(failedQueries.map((query) => query.refetch()));
      },
    };
  }, [
    runArtifactsQuery.error,
    runArtifactsQuery.isError,
    runArtifactsQuery.refetch,
    runDetailsQuery.error,
    runDetailsQuery.isError,
    runDetailsQuery.refetch,
    runId,
    runTab,
    runsQuery.error,
    runsQuery.isError,
    runsQuery.refetch,
    scenarioArtifactsQuery.error,
    scenarioArtifactsQuery.isError,
    scenarioArtifactsQuery.refetch,
    scenarioEventsQuery.error,
    scenarioEventsQuery.isError,
    scenarioEventsQuery.refetch,
    scenarioId,
    scenarioQuery.error,
    scenarioQuery.isError,
    scenarioQuery.refetch,
    scenarioTab,
    scenariosQuery.error,
    scenariosQuery.isError,
    scenariosQuery.refetch,
  ]);
  void overviewContentError;

  useEffect(() => {
    if (!runId) return;
    const runStillVisible = filteredRuns.some((run) => run.runId === runId);
    if (!runStillVisible) {
      const fallbackRun = filteredRuns[0] ?? null;
      updateSearchParams(searchParams, setSearchParams, {
        runId: fallbackRun?.runId ?? null,
        runTab: fallbackRun ? "scenarios" : null,
        scenarioId: null,
        scenarioTab: null,
      });
    }
  }, [filteredRuns, runId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!runId || scenarios.length === 0 || runTab !== "scenarios") return;
    const scenarioExists = scenarioId
      ? scenarios.some((scenario: RegressionScenarioWithReports) => scenario.id === scenarioId)
      : false;
    if (!scenarioExists) {
      const preferredScenario =
        scenarios.find((scenario: RegressionScenarioWithReports) => scenario.status === "failed") ?? scenarios[0];
      updateSearchParams(searchParams, setSearchParams, {
        scenarioId: preferredScenario.id,
        scenarioTab: "events",
      });
    }
  }, [runId, runTab, scenarioId, scenarios, searchParams, setSearchParams]);

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

  const applicationOptions = useMemo(
    () =>
      applications.map((application: TargetApplicationResponse) => ({
        value: application.id,
        label: application.name,
      })),
    [applications],
  );

  const latestRunAt = runs[0]?.createdAt;
  const isRefreshing =
    applicationsFetching ||
    runsQuery.isFetching ||
    runDetailsQuery.isFetching ||
    scenariosQuery.isFetching ||
    scenarioQuery.isFetching ||
    runArtifactsQuery.isFetching ||
    scenarioEventsQuery.isFetching ||
    scenarioArtifactsQuery.isFetching ||
    jiraStatusQuery.isFetching;

  const handleRefresh = () => {
    const refreshes: Array<Promise<unknown>> = [refetchApplications(), runsQuery.refetch(), jiraStatusQuery.refetch()];

    if (runId) {
      refreshes.push(runDetailsQuery.refetch(), scenariosQuery.refetch());
      if (runTab === "artifacts") refreshes.push(runArtifactsQuery.refetch());
    }

    if (runId && scenarioId && runTab === "scenarios") {
      refreshes.push(scenarioQuery.refetch());
      if (scenarioTab === "events") refreshes.push(scenarioEventsQuery.refetch());
      if (scenarioTab === "artifacts") refreshes.push(scenarioArtifactsQuery.refetch());
    }

    void Promise.all(refreshes);
  };

  const clearFilters = () => {
    setSearchText("");
    updateSearchParams(
      searchParams,
      setSearchParams,
      {
        versionId: null,
        status: null,
        runId: null,
        runTab: "scenarios",
        scenarioId: null,
        scenarioTab: "events",
      },
      false,
    );
  };

  if (!selectedProject) {
    return (
      <EmptyState
        title="Choose a project"
        description="Select a project from the sidebar to inspect regression runs."
      />
    );
  }

  if (applicationsLoading || applicationsPlaceholderData) {
    return <PageLoader />;
  }

  if (applicationsError) {
    return <ErrorBanner message="Failed to load target applications for this project." />;
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        description="Create a target application before viewing regression runs."
      />
    );
  }

  return (
    <div className={styles.page}>
      <RegressionRunsHeader
        applicationName={activeApplication?.name ?? null}
        latestRunAt={latestRunAt}
        runCount={filteredRuns.length}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      <div className={styles.topLevelTabs}>
        <TabButton
          active={view === "overview"}
          onClick={() => updateSearchParams(searchParams, setSearchParams, { view: "overview" }, false)}
        >
          Overview
        </TabButton>
        <TabButton
          active={view === "statistics"}
          onClick={() => updateSearchParams(searchParams, setSearchParams, { view: "statistics" }, false)}
        >
          Statistics
        </TabButton>
      </div>

      <RegressionRunsFilters
        applicationOptions={applicationOptions}
        versionOptions={versionOptions}
        applicationId={activeApplication?.id ?? null}
        versionId={versionId}
        status={status}
        searchText={searchText}
        onApplicationChange={(value) => {
          const application = applications.find((item) => item.id === value) ?? null;
          if (projectId && application) {
            setSelectedApplicationContext(buildApplicationContext(projectId, application, null));
          }
          updateSearchParams(
            searchParams,
            setSearchParams,
            {
              appId: value,
              versionId: null,
              runId: null,
              runTab: "scenarios",
              scenarioId: null,
              scenarioTab: "events",
            },
            false,
          );
        }}
        onVersionChange={(value) => {
          const version =
            value && value !== "all"
              ? ((activeApplication?.versions ?? []) as Array<{ id: string; version: string }>).find(
                  (item) => item.id === value,
                )
              : null;
          if (projectId && activeApplication) {
            setSelectedApplicationContext(buildApplicationContext(projectId, activeApplication, version));
          }
          updateSearchParams(
            searchParams,
            setSearchParams,
            {
              versionId: value === "all" ? null : value,
              runId: null,
              runTab: "scenarios",
              scenarioId: null,
              scenarioTab: "events",
            },
            false,
          );
        }}
        onStatusChange={(value) => {
          updateSearchParams(
            searchParams,
            setSearchParams,
            {
              status: !value || value === "all" ? null : value,
              runId: null,
              runTab: "scenarios",
              scenarioId: null,
              scenarioTab: "events",
            },
            false,
          );
        }}
        onSearchChange={setSearchText}
        onClear={clearFilters}
      />

      {view === "statistics" ? (
        <Suspense fallback={<PageLoader />}>
          <LazyRegressionStatsTab runs={filteredRuns} />
        </Suspense>
      ) : (
        <div className={styles.overviewGrid}>
          <div className={styles.overviewSidebar}>
            {runsQuery.isError ? (
              <ErrorBanner message="Failed to load regression runs." />
            ) : (
              <RegressionRunsList
                runs={filteredRuns}
                selectedRunId={runId}
                onSelectRun={(nextRunId) =>
                  updateSearchParams(
                    searchParams,
                    setSearchParams,
                    {
                      runId: nextRunId,
                      runTab: "scenarios",
                      scenarioId: null,
                      scenarioTab: "events",
                    },
                    false,
                  )
                }
              />
            )}
          </div>

          <div className={styles.overviewWorkspace}>
            <RegressionRunWorkspace
              run={selectedRun}
              runTab={runTab}
              onRunTabChange={(nextTab) =>
                updateSearchParams(
                  searchParams,
                  setSearchParams,
                  {
                    runTab: nextTab,
                    scenarioId: nextTab === "scenarios" ? scenarioId : null,
                    scenarioTab: nextTab === "scenarios" ? scenarioTab : null,
                  },
                  false,
                )
              }
              scenarios={scenarios}
              selectedScenario={selectedScenario}
              selectedScenarioId={scenarioId}
              onSelectScenario={(nextScenarioId) =>
                updateSearchParams(
                  searchParams,
                  setSearchParams,
                  { scenarioId: nextScenarioId, scenarioTab: "events" },
                  false,
                )
              }
              scenarioTab={scenarioTab}
              onScenarioTabChange={(nextTab) =>
                updateSearchParams(searchParams, setSearchParams, { scenarioTab: nextTab }, false)
              }
              scenarioEvents={scenarioEvents}
              scenarioArtifacts={scenarioArtifacts}
              scenarioArtifactsLoading={
                scenarioArtifactsQuery.isLoading ||
                (scenarioArtifactsQuery.isFetching && scenarioArtifacts.length === 0)
              }
              scenarioArtifactsError={scenarioArtifactsQuery.isError}
              onRetryScenarioArtifacts={() => void scenarioArtifactsQuery.refetch()}
              scenarioArtifactTree={scenarioArtifactTree}
              runArtifacts={runArtifacts}
              runArtifactTree={runArtifactTree}
              projectId={selectedProject.id}
              applicationId={activeApplication?.id ?? ""}
              jiraReportingEnabled={Boolean(jiraReportingEnabled)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default RegressionRuns;
