// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Badge, Button, Card, RichSelect, SegmentedProgress, TerminalPanel } from "@shared/ui";
import type { RichSelectOption } from "@shared/ui";
import {
  useGenerateUserGuide,
  useUserGuideApplications,
  useUserGuideStates,
  useUserGuideVersions,
} from "../model/queries/useUserGuides";
import type {
  GenerateGuideParams,
  UserGuideApplication,
  UserGuideState,
  UserGuideStateKind,
  UserGuideVersion,
} from "../model/types/user-guides.types";
import { useGuideTypewriter } from "./hooks/useGuideTypewriter";
import styles from "./UserGuides.module.scss";

type StateOption = RichSelectOption & {
  path: string;
  displayLabel: string;
  displayPath: string;
  kind?: UserGuideStateKind;
};

const GUIDE_DESCRIPTION =
  "Coverit will generate a step-by-step navigation guide for the selected path, automatically typed in real time.";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProgressValue({
  applicationId,
  versionId,
  startStateId,
  endStateId,
}: {
  applicationId: string | null;
  versionId: string | null;
  startStateId: string | null;
  endStateId: string | null;
}) {
  return [applicationId, versionId, startStateId, endStateId].filter(Boolean).length;
}

function getEmptyStateMessage({
  applicationId,
  versionId,
  startStateId,
}: {
  applicationId: string | null;
  versionId: string | null;
  startStateId: string | null;
}) {
  if (!applicationId || !versionId) return "Select an application to get started";
  if (!startStateId) return "Pick a start state from the left";
  return "Pick an end state from the right";
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

function PageHeader() {
  return (
    <header className={styles.header}>
      <div>
        <h1>User Guides</h1>
        <p>
          Select an application and version to generate a step-by-step navigation guide between any two discovered
          states.
        </p>
      </div>
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

function findById<TItem extends { id: string }>(items: TItem[], id: string | null) {
  return id ? (items.find((item) => item.id === id) ?? null) : null;
}

function findStateByHash(items: UserGuideState[], stateHash: string | null) {
  return stateHash ? (items.find((item) => item.stateHash === stateHash) ?? null) : null;
}

function UserGuides() {
  const selectedProject = useUIStore((state) => state.selectedProject);
  const projectId = selectedProject?.id ?? null;
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedStartStateId, setSelectedStartStateId] = useState<string | null>(null);
  const [selectedEndStateId, setSelectedEndStateId] = useState<string | null>(null);
  const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null);
  const [guideResult, setGuideResult] = useState<{ lines: string[] } | null>(null);

  const applicationsQuery = useUserGuideApplications(projectId);
  const versionsQuery = useUserGuideVersions(projectId, selectedApplicationId);
  const statesQuery = useUserGuideStates(projectId, selectedApplicationId, selectedVersionId);
  const {
    mutate: generateGuide,
    reset: resetGenerateGuide,
    isPending: isGuideGenerating,
  } = useGenerateUserGuide();

  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const versions = useMemo(() => versionsQuery.data ?? [], [versionsQuery.data]);
  const states = useMemo(() => statesQuery.data ?? [], [statesQuery.data]);

  const selectedApplication = findById<UserGuideApplication>(applications, selectedApplicationId);
  const selectedVersion = findById<UserGuideVersion>(versions, selectedVersionId);
  const selectedStartState = findStateByHash(states, selectedStartStateId);
  const selectedEndState = findStateByHash(states, selectedEndStateId);
  const contextComplete = Boolean(selectedApplication && selectedVersion);
  const pathComplete = Boolean(
    selectedStartState && selectedEndState && selectedStartState.stateHash !== selectedEndState.stateHash,
  );
  const progressValue = getProgressValue({
    applicationId: selectedApplicationId,
    versionId: selectedVersionId,
    startStateId: selectedStartStateId,
    endStateId: selectedEndStateId,
  });

  const resetGuideOutput = useCallback(() => {
    setActiveGuideKey(null);
    setGuideResult(null);
    resetGenerateGuide();
  }, [resetGenerateGuide]);

  const resetFromApplication = useCallback(() => {
    setSelectedVersionId(null);
    setSelectedStartStateId(null);
    setSelectedEndStateId(null);
    resetGuideOutput();
  }, [resetGuideOutput]);

  const resetFromVersion = useCallback(() => {
    setSelectedStartStateId(null);
    setSelectedEndStateId(null);
    resetGuideOutput();
  }, [resetGuideOutput]);

  useEffect(() => {
    setSelectedApplicationId(null);
    resetFromApplication();
  }, [projectId, resetFromApplication]);

  useEffect(() => {
    if (!selectedApplicationId || applicationsQuery.isFetching || applications.length === 0) return;
    if (!applications.some((application) => application.id === selectedApplicationId)) {
      setSelectedApplicationId(null);
      resetFromApplication();
    }
  }, [applications, applicationsQuery.isFetching, resetFromApplication, selectedApplicationId]);

  useEffect(() => {
    if (!selectedVersionId || versionsQuery.isFetching || versions.length === 0) return;
    if (!versions.some((version) => version.id === selectedVersionId)) {
      setSelectedVersionId(null);
      resetFromVersion();
    }
  }, [resetFromVersion, selectedVersionId, versions, versionsQuery.isFetching]);

  useEffect(() => {
    if (!selectedStartStateId || statesQuery.isFetching || states.length === 0) return;
    if (!states.some((state) => state.stateHash === selectedStartStateId)) {
      setSelectedStartStateId(null);
      setSelectedEndStateId(null);
      resetGuideOutput();
    }
  }, [resetGuideOutput, selectedStartStateId, states, statesQuery.isFetching]);

  useEffect(() => {
    if (!selectedEndStateId || statesQuery.isFetching || states.length === 0) return;
    if (!states.some((state) => state.stateHash === selectedEndStateId)) {
      setSelectedEndStateId(null);
      resetGuideOutput();
    }
  }, [resetGuideOutput, selectedEndStateId, states, statesQuery.isFetching]);

  const applicationOptions = useMemo<RichSelectOption[]>(
    () => applications.map((application) => ({ value: application.id, label: application.name })),
    [applications],
  );

  const versionOptions = useMemo<RichSelectOption[]>(
    () => versions.map((version) => ({ value: version.id, label: version.name })),
    [versions],
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
    if (!projectId || !selectedApplicationId || !selectedVersionId || !pathComplete) return null;

    return {
      projectId,
      applicationId: selectedApplicationId,
      versionId: selectedVersionId,
      startStateHash: selectedStartStateId ?? "",
      endStateHash: selectedEndStateId ?? "",
    };
  }, [
    pathComplete,
    projectId,
    selectedApplicationId,
    selectedEndStateId,
    selectedStartStateId,
    selectedVersionId,
  ]);

  const guideRequestKey = useMemo(() => {
    if (!guideRequest) return null;
    return [
      guideRequest.projectId,
      guideRequest.applicationId,
      guideRequest.versionId,
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
    return `coverit generate-guide --app ${slugify(selectedApplication.name)} --from "${selectedStartState.label}" --to "${selectedEndState.label}"`;
  }, [selectedApplication, selectedEndState, selectedStartState]);

  const emptyStateMessage = getEmptyStateMessage({
    applicationId: selectedApplicationId,
    versionId: selectedVersionId,
    startStateId: selectedStartStateId,
  });

  return (
    <div className={styles.page}>
      <PageHeader />

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
                      setSelectedApplicationId(value);
                      resetFromApplication();
                    }}
                    disabled={applicationsQuery.isFetching || applicationsQuery.isError}
                    emptyLabel="No applications found"
                  />
                </FieldBlock>

                <FieldBlock label="VERSION / BRANCH">
                  <RichSelect
                    options={versionOptions}
                    value={selectedVersionId}
                    placeholder={versionsQuery.isFetching ? "Loading versions..." : "Choose version..."}
                    leadingIcon={<Tag />}
                    onChange={(value) => {
                      setSelectedVersionId(value);
                      resetFromVersion();
                    }}
                    disabled={!selectedApplicationId || versionsQuery.isFetching || versionsQuery.isError}
                    emptyLabel="No versions found"
                  />
                </FieldBlock>

              </div>

              <SegmentedProgress className={styles.progress} value={progressValue} total={4} />
            </Card>

            {contextComplete ? (
              <Card className={styles.pathCard}>
                <SectionHeading title="DEFINE PATH" helper={`${states.length} states discovered for this version`} />

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
                        setSelectedStartStateId(value);
                        setSelectedEndStateId(null);
                        resetGuideOutput();
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
                        setSelectedEndStateId(value);
                        resetGuideOutput();
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
                    coverit guide · {selectedApplication?.name} · {selectedVersion?.name} · {selectedStartState?.label}{" "}
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
                footerRight={`${selectedApplication?.name} · ${selectedVersion?.name}`}
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
