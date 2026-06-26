// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Copy,
  Flag,
  Layers,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  Sparkles,
  Tag,
} from "lucide-react";
import { useUIStore } from "@app/store";
import {
  applicationContextEquals,
  buildApplicationContext,
  resolveApplicationSelection,
  resolveVersionSelection,
} from "@features/target-applications";
import { Badge, Button, Card, RichSelect, SegmentedProgress, TerminalPanel } from "@shared/ui";
import type { RichSelectOption } from "@shared/ui";
import {
  useGenerateUserGuide,
  useUserGuideApplications,
  useUserGuideManualSessions,
  useUserGuideStates,
  useUserGuideVersions,
} from "../model/queries/useUserGuides";
import { cn } from "@shared/utils/cn";
import type {
  GenerateGuideParams,
  UserGuideManualSession,
  UserGuideMode,
  UserGuideState,
  UserGuideStateKind,
} from "../model/types/user-guides.types";
import { useGuideTypewriter } from "./hooks/useGuideTypewriter";
import styles from "./UserGuides.module.scss";

type StateOption = RichSelectOption & {
  path: string;
  displayLabel: string;
  displayPath: string;
  kind?: UserGuideStateKind;
};

type ManualSessionOption = RichSelectOption & {
  createdAt: string;
  versionName: string;
  status: string;
};

const GUIDE_DESCRIPTION =
  "Coverit will generate a step-by-step navigation guide for the selected path, automatically typed in real time.";

const MODE_OPTIONS: RichSelectOption[] = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProgressValue({
  applicationId,
  sourceId,
  startStateId,
  endStateId,
}: {
  applicationId: string | null;
  sourceId: string | null;
  startStateId: string | null;
  endStateId: string | null;
}) {
  return [applicationId, sourceId, startStateId, endStateId].filter(Boolean).length;
}

function getEmptyStateMessage({
  applicationId,
  sourceId,
  startStateId,
  mode,
}: {
  applicationId: string | null;
  sourceId: string | null;
  startStateId: string | null;
  mode: UserGuideMode;
}) {
  if (!applicationId || !sourceId) {
    return mode === "manual" ? "Select an application and manual session" : "Select an application to get started";
  }
  if (!startStateId) return "Pick a start state from the left";
  return "Pick an end state from the right";
}

function getGuideMode(value: string | null): UserGuideMode {
  return value === "manual" ? "manual" : "automatic";
}

function FieldBlock({
  label,
  children,
  meta,
}: {
  label: string;
  children: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className={styles.fieldBlock}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {meta ? <div className={styles.fieldMeta}>{meta}</div> : null}
    </div>
  );
}

function StatePath({ state }: { state: UserGuideState | null }) {
  if (!state) return null;

  const copyValue = state.copyUrl || state.url || state.path;

  return (
    <span className={styles.statePathLine}>
      {state.kind ? <Badge className={styles.kindBadge}>{state.kind}</Badge> : null}
      <code title={copyValue}>{state.displayPath}</code>
      <Button
        size="icon"
        variant="ghost"
        className={styles.copyPathButton}
        aria-label="Copy state URL"
        title="Copy state URL"
        onClick={() => {
          void navigator.clipboard?.writeText(copyValue);
        }}
      >
        <Copy size={12} strokeWidth={1.8} />
      </Button>
    </span>
  );
}

function StateOptionRow({ option }: { option: StateOption }) {
  return (
    <span className={styles.stateOption}>
      <span className={styles.stateOptionMain}>
        <Navigation size={13} strokeWidth={1.75} />
        <strong title={option.label}>{option.displayLabel}</strong>
      </span>
      <code title={option.path}>{option.displayPath}</code>
    </span>
  );
}

function ManualSessionOptionRow({ option }: { option: ManualSessionOption }) {
  return (
    <span className={styles.manualSessionOption}>
      <strong>{option.label}</strong>
      <span>
        {option.versionName} / {option.status}
      </span>
    </span>
  );
}

function PageHeader({ isRefreshing, onRefresh }: { isRefreshing: boolean; onRefresh: () => void }) {
  return (
    <header className={styles.header}>
      <div>
        <h1>User Guides</h1>
        <p>
          Select an application and version to generate a step-by-step navigation guide between any two discovered
          states.
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className={styles.headerRefreshButton}
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Refresh user guide data"
        title="Refresh"
      >
        <RefreshCw className={cn(styles.headerRefreshIcon, isRefreshing && styles.spinIcon)} size={14} />
      </Button>
    </header>
  );
}

function SectionHeading({ title, helper }: { title: string; helper?: ReactNode }) {
  return (
    <div className={styles.cardHeader}>
      <span className={styles.cardTitle}>{title}</span>
      {helper ? <span className={styles.cardHelper}>{helper}</span> : null}
    </div>
  );
}

function CenterEmptyState({ message }: { message: string }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <BookOpen size={27} strokeWidth={1.65} />
      </div>
      <h2>{message}</h2>
      <p>{GUIDE_DESCRIPTION}</p>
    </div>
  );
}

function ProjectEmptyState() {
  return (
    <Card className={styles.projectEmptyState}>
      <div className={styles.emptyIcon}>
        <BookOpen size={27} strokeWidth={1.65} />
      </div>
      <h2>Select a project from the sidebar</h2>
      <p>{GUIDE_DESCRIPTION}</p>
    </Card>
  );
}

function findStateByHash(items: UserGuideState[], stateHash: string | null) {
  return stateHash ? (items.find((item) => item.stateHash === stateHash) ?? null) : null;
}

function findManualSessionById(items: UserGuideManualSession[], sessionId: string | null) {
  return sessionId ? (items.find((item) => item.id === sessionId) ?? null) : null;
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

function UserGuides() {
  const selectedProject = useUIStore((state) => state.selectedProject);
  const selectedApplicationContext = useUIStore((state) => state.selectedApplicationContext);
  const setSelectedApplicationContext = useUIStore((state) => state.setSelectedApplicationContext);
  const projectId = selectedProject?.id ?? null;
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null);
  const [guideResult, setGuideResult] = useState<{ lines: string[] } | null>(null);
  const requestedApplicationId = searchParams.get("appId");
  const requestedVersionId = searchParams.get("versionId");
  const requestedMode = searchParams.get("mode");
  const requestedSessionId = searchParams.get("sessionId");
  const requestedStartStateId = searchParams.get("startState");
  const requestedEndStateId = searchParams.get("endState");
  const guideMode = getGuideMode(requestedMode);

  const applicationsQuery = useUserGuideApplications(projectId);
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const selectedApplication = resolveApplicationSelection({
    applications,
    projectId,
    requestedApplicationId,
    storedContext: selectedApplicationContext,
  });
  const selectedApplicationId = selectedApplication?.id ?? null;
  const versionsQuery = useUserGuideVersions(projectId, selectedApplicationId);
  const versions = useMemo(() => versionsQuery.data ?? [], [versionsQuery.data]);
  const selectedVersion = resolveVersionSelection({
    versions,
    projectId,
    applicationId: selectedApplicationId,
    requestedVersionId,
    storedContext: selectedApplicationContext,
    requireVersion: true,
  });
  const selectedVersionId = selectedVersion?.id ?? null;
  const manualSessionsQuery = useUserGuideManualSessions(projectId, selectedApplication);
  const manualSessions = useMemo(() => manualSessionsQuery.data ?? [], [manualSessionsQuery.data]);
  const selectedManualSession =
    guideMode === "manual" ? (findManualSessionById(manualSessions, requestedSessionId) ?? manualSessions[0] ?? null) : null;
  const selectedManualSessionId = selectedManualSession?.id ?? null;
  const guideSourceId = guideMode === "manual" ? selectedManualSessionId : selectedVersionId;
  const guideSourceLabel =
    guideMode === "manual"
      ? selectedManualSessionId
        ? `Session#${manualSessions.findIndex((session) => session.id === selectedManualSessionId) + 1}`
        : null
      : selectedVersion?.name ?? null;
  const statesQuery = useUserGuideStates(projectId, selectedApplicationId, guideSourceId, guideMode);
  const {
    mutate: generateGuide,
    reset: resetGenerateGuide,
    isPending: isGuideGenerating,
  } = useGenerateUserGuide();

  const states = useMemo(() => statesQuery.data ?? [], [statesQuery.data]);
  const isRefreshing =
    applicationsQuery.isFetching ||
    versionsQuery.isFetching ||
    manualSessionsQuery.isFetching ||
    statesQuery.isFetching;

  const handleRefresh = () => {
    void Promise.all([
      applicationsQuery.refetch(),
      versionsQuery.refetch(),
      manualSessionsQuery.refetch(),
      statesQuery.refetch(),
    ]);
  };

  const selectedStartStateId = states.some((state) => state.stateHash === requestedStartStateId)
    ? requestedStartStateId
    : null;
  const selectedEndStateId =
    requestedEndStateId && requestedEndStateId !== selectedStartStateId
      ? states.some((state) => state.stateHash === requestedEndStateId)
        ? requestedEndStateId
        : null
      : null;
  const selectedStartState = findStateByHash(states, selectedStartStateId);
  const selectedEndState = findStateByHash(states, selectedEndStateId);
  const contextComplete = Boolean(selectedApplication && guideSourceId);
  const pathComplete = Boolean(
    selectedStartState && selectedEndState && selectedStartState.stateHash !== selectedEndState.stateHash,
  );
  const progressValue = getProgressValue({
    applicationId: selectedApplicationId,
    sourceId: guideSourceId,
    startStateId: selectedStartStateId,
    endStateId: selectedEndStateId,
  });

  const resetGuideOutput = useCallback(() => {
    setActiveGuideKey(null);
    setGuideResult(null);
    resetGenerateGuide();
  }, [resetGenerateGuide]);

  useEffect(() => {
    resetGuideOutput();
  }, [guideMode, guideSourceId, projectId, resetGuideOutput, selectedApplicationId, selectedEndStateId, selectedStartStateId]);

  useEffect(() => {
    if (!projectId) return;

    if (!applicationsQuery.isLoading && !applicationsQuery.isPlaceholderData && applications.length === 0) {
      if (selectedApplicationContext?.projectId === projectId) {
        setSelectedApplicationContext(null);
      }
      if (
        requestedApplicationId ||
        requestedVersionId ||
        requestedSessionId ||
        requestedMode ||
        requestedStartStateId ||
        requestedEndStateId
      ) {
        updateSearchParams(searchParams, setSearchParams, {
          appId: null,
          versionId: null,
          sessionId: null,
          mode: null,
          startState: null,
          endState: null,
        });
      }
      return;
    }

    if (!selectedApplication) return;

    const updates: Record<string, string | null> = {};
    if (requestedApplicationId !== selectedApplication.id) updates.appId = selectedApplication.id;
    if (guideMode === "automatic") {
      if (requestedMode) updates.mode = null;
      if (requestedSessionId) updates.sessionId = null;
      if (selectedVersionId && requestedVersionId !== selectedVersionId) updates.versionId = selectedVersionId;
      if (!selectedVersionId && requestedVersionId && !versionsQuery.isFetching) updates.versionId = null;
    } else {
      if (requestedVersionId) updates.versionId = null;
      if (selectedManualSessionId && requestedSessionId !== selectedManualSessionId) {
        updates.sessionId = selectedManualSessionId;
      }
      if (!selectedManualSessionId && requestedSessionId && !manualSessionsQuery.isFetching) {
        updates.sessionId = null;
      }
    }

    if (requestedStartStateId && !selectedStartStateId && !statesQuery.isFetching) {
      updates.startState = null;
      updates.endState = null;
    } else if (requestedEndStateId && !selectedEndStateId && !statesQuery.isFetching) {
      updates.endState = null;
    }

    const nextContext = buildApplicationContext(
      projectId,
      selectedApplication,
      guideMode === "automatic" ? selectedVersion : null,
    );
    if (!applicationContextEquals(selectedApplicationContext, nextContext)) {
      setSelectedApplicationContext(nextContext);
    }

    if (Object.keys(updates).length > 0) {
      updateSearchParams(searchParams, setSearchParams, updates);
    }
  }, [
    applications.length,
    applicationsQuery.isLoading,
    applicationsQuery.isPlaceholderData,
    guideMode,
    manualSessionsQuery.isFetching,
    projectId,
    requestedApplicationId,
    requestedEndStateId,
    requestedMode,
    requestedSessionId,
    requestedStartStateId,
    requestedVersionId,
    searchParams,
    selectedApplication,
    selectedApplicationContext,
    selectedEndStateId,
    selectedManualSessionId,
    selectedStartStateId,
    selectedVersion,
    selectedVersionId,
    setSearchParams,
    setSelectedApplicationContext,
    statesQuery.isFetching,
    versionsQuery.isFetching,
  ]);

  const applicationOptions = useMemo<RichSelectOption[]>(
    () => applications.map((application) => ({ value: application.id, label: application.name })),
    [applications],
  );

  const versionOptions = useMemo<RichSelectOption[]>(
    () => versions.map((version) => ({ value: version.id, label: version.name })),
    [versions],
  );

  const manualSessionOptions = useMemo<ManualSessionOption[]>(
    () =>
      manualSessions.map((session, index) => ({
        value: session.id,
        label: `Session#${index + 1}`,
        createdAt: session.createdAt,
        versionName: session.versionName,
        status: session.status,
      })),
    [manualSessions],
  );

  const startStateOptions = useMemo<StateOption[]>(
    () =>
      states.map((state) => ({
        value: state.stateHash,
        label: state.label,
        path: state.path,
        displayLabel: state.displayLabel,
        displayPath: state.displayPath,
        kind: state.kind,
        disabled: state.stateHash === selectedEndStateId,
      })),
    [selectedEndStateId, states],
  );

  const endStateOptions = useMemo<StateOption[]>(
    () =>
      states.map((state) => ({
        value: state.stateHash,
        label: state.label,
        path: state.path,
        displayLabel: state.displayLabel,
        displayPath: state.displayPath,
        kind: state.kind,
        disabled: state.stateHash === selectedStartStateId,
      })),
    [selectedStartStateId, states],
  );

  const guideRequest = useMemo<GenerateGuideParams | null>(() => {
    if (!projectId || !selectedApplicationId || !guideSourceId || !pathComplete) return null;

    return {
      projectId,
      applicationId: selectedApplicationId,
      mode: guideMode,
      versionId: guideMode === "automatic" ? guideSourceId : undefined,
      sessionId: guideMode === "manual" ? guideSourceId : undefined,
      startStateHash: selectedStartStateId ?? "",
      endStateHash: selectedEndStateId ?? "",
    };
  }, [
    guideMode,
    guideSourceId,
    pathComplete,
    projectId,
    selectedApplicationId,
    selectedEndStateId,
    selectedStartStateId,
  ]);

  const guideRequestKey = useMemo(() => {
    if (!guideRequest) return null;
    return [
      guideRequest.projectId,
      guideRequest.applicationId,
      guideRequest.mode,
      guideRequest.versionId ?? guideRequest.sessionId,
      guideRequest.startStateHash,
      guideRequest.endStateHash,
    ].join(":");
  }, [guideRequest]);

  const startGuideGeneration = useCallback(() => {
    if (!guideRequest || !guideRequestKey) return;

    setActiveGuideKey(guideRequestKey);
    setGuideResult(null);
    resetGenerateGuide();
    generateGuide(guideRequest, {
      onSuccess: setGuideResult,
    });
  }, [generateGuide, guideRequest, guideRequestKey, resetGenerateGuide]);

  useEffect(() => {
    if (!guideRequestKey || activeGuideKey === guideRequestKey) return;
    startGuideGeneration();
  }, [activeGuideKey, guideRequestKey, startGuideGeneration]);

  const guideLines = useMemo(() => guideResult?.lines ?? [], [guideResult]);
  const { typedText, currentLine, totalLines, isTyping } = useGuideTypewriter(guideLines, Boolean(guideResult));
  const terminalGenerating = isGuideGenerating || isTyping;
  const terminalCommand = useMemo(() => {
    if (!selectedApplication || !selectedStartState || !selectedEndState) return "";
    const sourceFlag =
      guideMode === "manual"
        ? `--session "${guideSourceLabel ?? selectedManualSessionId ?? "manual"}"`
        : `--version "${guideSourceLabel ?? selectedVersionId ?? "version"}"`;
    return `coverit generate-guide --app ${slugify(selectedApplication.name)} ${sourceFlag} --from "${selectedStartState.label}" --to "${selectedEndState.label}"`;
  }, [
    guideMode,
    guideSourceLabel,
    selectedApplication,
    selectedEndState,
    selectedManualSessionId,
    selectedStartState,
    selectedVersionId,
  ]);

  const emptyStateMessage = getEmptyStateMessage({
    applicationId: selectedApplicationId,
    sourceId: guideSourceId,
    startStateId: selectedStartStateId,
    mode: guideMode,
  });

  return (
    <div className={styles.page}>
      <PageHeader isRefreshing={isRefreshing} onRefresh={handleRefresh} />

      <main className={styles.content}>
        {!selectedProject ? (
          <ProjectEmptyState />
        ) : (
          <>
            <Card className={styles.contextCard}>
              <SectionHeading title="SELECT CONTEXT" />

              <div className={styles.contextGrid}>
                <FieldBlock label="APPLICATION">
                  <RichSelect
                    options={applicationOptions}
                    value={selectedApplicationId}
                    placeholder={applicationsQuery.isFetching ? "Loading apps..." : "Choose an app..."}
                    leadingIcon={<Layers />}
                    onChange={(value) => {
                      updateSearchParams(
                        searchParams,
                        setSearchParams,
                        {
                          appId: value,
                          versionId: null,
                          sessionId: null,
                          startState: null,
                          endState: null,
                        },
                        false,
                      );
                    }}
                    disabled={applicationsQuery.isFetching || applicationsQuery.isError}
                    emptyLabel="No applications found"
                  />
                </FieldBlock>

                <FieldBlock label="MODE">
                  <RichSelect
                    options={MODE_OPTIONS}
                    value={guideMode}
                    placeholder="Choose mode..."
                    leadingIcon={<Sparkles />}
                    onChange={(value) => {
                      const nextMode = getGuideMode(value);
                      updateSearchParams(
                        searchParams,
                        setSearchParams,
                        {
                          mode: nextMode === "manual" ? "manual" : null,
                          versionId: null,
                          sessionId: null,
                          startState: null,
                          endState: null,
                        },
                        false,
                      );
                    }}
                    clearable={false}
                  />
                </FieldBlock>

                {guideMode === "automatic" ? (
                  <FieldBlock label="VERSION / BRANCH">
                    <RichSelect
                      options={versionOptions}
                      value={selectedVersionId}
                      placeholder={versionsQuery.isFetching ? "Loading versions..." : "Choose version..."}
                      leadingIcon={<Tag />}
                      onChange={(value) => {
                        updateSearchParams(
                          searchParams,
                          setSearchParams,
                          {
                            versionId: value,
                            sessionId: null,
                            startState: null,
                            endState: null,
                          },
                          false,
                        );
                      }}
                      disabled={!selectedApplicationId || versionsQuery.isFetching || versionsQuery.isError}
                      emptyLabel="No versions found"
                    />
                  </FieldBlock>
                ) : (
                  <FieldBlock label="MANUAL SESSION">
                    <RichSelect
                      options={manualSessionOptions}
                      value={selectedManualSessionId}
                      placeholder={manualSessionsQuery.isFetching ? "Loading sessions..." : "Choose session..."}
                      leadingIcon={<Navigation />}
                      renderOption={(option) => <ManualSessionOptionRow option={option} />}
                      onChange={(value) => {
                        updateSearchParams(
                          searchParams,
                          setSearchParams,
                          {
                            sessionId: value,
                            versionId: null,
                            startState: null,
                            endState: null,
                          },
                          false,
                        );
                      }}
                      disabled={!selectedApplicationId || manualSessionsQuery.isFetching || manualSessionsQuery.isError}
                      emptyLabel="No manual sessions found"
                    />
                  </FieldBlock>
                )}
              </div>

              <SegmentedProgress className={styles.progress} value={progressValue} total={4} />
            </Card>

            {contextComplete ? (
              <Card className={styles.pathCard}>
                <SectionHeading
                  title="DEFINE PATH"
                  helper={`${states.length} states discovered for this ${
                    guideMode === "manual" ? "session" : "version"
                  }`}
                />

                <div className={styles.pathGrid}>
                  <FieldBlock label="START STATE" meta={<StatePath state={selectedStartState} />}>
                    <RichSelect
                      options={startStateOptions}
                      value={selectedStartStateId}
                      placeholder={statesQuery.isFetching ? "Loading states..." : "Pick start state..."}
                      leadingIcon={<MapPin className={styles.startIcon} />}
                      renderOption={(option) => <StateOptionRow option={option} />}
                      menuClassName={styles.stateMenu}
                      onChange={(value) => {
                        updateSearchParams(
                          searchParams,
                          setSearchParams,
                          {
                            startState: value,
                            endState: null,
                          },
                          false,
                        );
                      }}
                      disabled={!contextComplete || statesQuery.isFetching || statesQuery.isError}
                      emptyLabel="No states discovered"
                    />
                  </FieldBlock>

                  <div className={styles.connector} aria-hidden="true">
                    {pathComplete ? (
                      <>
                        <Badge className={styles.readyBadge}>
                          <Sparkles size={12} strokeWidth={1.8} />
                          guide ready
                        </Badge>
                        <span className={styles.connectorSummary}>
                          {selectedStartState?.label} <ArrowRight size={11} /> {selectedEndState?.label}
                        </span>
                      </>
                    ) : (
                      <span className={styles.connectorTrack}>
                        <span />
                        <ArrowRight size={16} strokeWidth={1.5} />
                        <span />
                      </span>
                    )}
                  </div>

                  <FieldBlock label="END STATE" meta={<StatePath state={selectedEndState} />}>
                    <RichSelect
                      options={endStateOptions}
                      value={selectedEndStateId}
                      placeholder="Pick end state..."
                      leadingIcon={<Flag className={styles.endIcon} />}
                      renderOption={(option) => <StateOptionRow option={option} />}
                      menuClassName={styles.stateMenu}
                      onChange={(value) => {
                        updateSearchParams(searchParams, setSearchParams, { endState: value }, false);
                      }}
                      disabled={!selectedStartStateId || statesQuery.isFetching || statesQuery.isError}
                      emptyLabel="No states discovered"
                    />
                  </FieldBlock>
                </div>
              </Card>
            ) : null}

            {!pathComplete ? <CenterEmptyState message={emptyStateMessage} /> : null}

            {pathComplete ? (
              <TerminalPanel
                className={styles.terminal}
                title={
                  <span>
                    coverit guide · {selectedApplication?.name} · {guideSourceLabel} · {selectedStartState?.label}{" "}
                    → {selectedEndState?.label}
                  </span>
                }
                status={
                  terminalGenerating ? (
                    <>
                      <LoaderCircle className={styles.spinIcon} size={13} strokeWidth={1.9} />
                      generating...
                    </>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={styles.refreshButton}
                      onClick={startGuideGeneration}
                      aria-label="Regenerate guide"
                      title="Regenerate guide"
                    >
                      <RefreshCw size={14} strokeWidth={1.8} />
                    </Button>
                  )
                }
                footerLeft={`${currentLine}/${totalLines} lines`}
                footerRight={`${selectedApplication?.name} · ${guideSourceLabel}`}
              >
                <div className={styles.commandLine}>
                  <span>&gt;</span> {terminalCommand}
                </div>
                <div className={styles.typedOutput}>
                  {typedText}
                  {terminalGenerating ? <span className={styles.cursor} /> : null}
                </div>
              </TerminalPanel>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

export default UserGuides;
