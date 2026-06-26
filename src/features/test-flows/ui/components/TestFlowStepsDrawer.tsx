// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Equal, Hexagon, LoaderCircle, X, Zap } from "lucide-react";
import type { ComponentType } from "react";
import { Fragment, useEffect, useMemo } from "react";
import { ContentErrorPanel } from "@shared/feedback/ContentErrorPanel";
import { Button } from "@shared/ui";
import type {
  FlowEditorDetailResponse,
  FlowEditorDraftStep,
  FlowEditorStepKind,
  FlowEditorTransitionStep,
  TestFlow,
} from "../../model/types/test-flows.types";
import { compactId, positionKey } from "../flow-editor/flow-editor-utils";
import flowStyles from "../flow-editor/FlowEditor.module.scss";
import styles from "../TestFlows.module.scss";

type TestFlowStepsDrawerProps = {
  flow: TestFlow;
  detail?: FlowEditorDetailResponse;
  loading: boolean;
  error?: Error | null;
  onClose: () => void;
  onRetry: () => void;
};

function kindMeta(kind: FlowEditorStepKind): {
  label: string;
  Icon: ComponentType<{ className?: string }>;
} {
  if (kind === "design-class" || kind === "design-operation") return { label: "Design", Icon: Hexagon };
  if (kind === "action-hook") return { label: "Action-Hook", Icon: Zap };
  return { label: "Assertion", Icon: Equal };
}

function getTextValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getStepDescription(step: Record<string, unknown>) {
  return (
    getTextValue(step.description) ??
    getTextValue(step.action) ??
    getTextValue(step.label) ??
    getTextValue(step.transitionId) ??
    "No description available"
  );
}

function groupDraftSteps(draftSteps: FlowEditorDraftStep[]) {
  const groups = new Map<string, FlowEditorDraftStep[]>();

  draftSteps.forEach((step) => {
    const key = positionKey(step.position);
    groups.set(key, [...(groups.get(key) ?? []), step]);
  });

  groups.forEach((steps, key) => {
    groups.set(
      key,
      [...steps].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id)),
    );
  });

  return groups;
}

function ReadonlyEditorStepBlock({ step }: { step: FlowEditorDraftStep }) {
  const meta = kindMeta(step.kind);
  const accentClass = flowStyles[`blockAccent_${step.kind}`] ?? "";
  const selector = step.element?.selector ?? null;

  return (
    <li
      className={`${flowStyles.block} ${flowStyles[`block_${step.kind}`]} ${accentClass} ${styles.stepsDrawerEditorBlock}`}
    >
      <meta.Icon className={flowStyles.blockIcon} />
      <div className={flowStyles.blockBody}>
        <span className={flowStyles.blockKind}>{meta.label}</span>
        <span className={`${flowStyles.blockLabel} ${styles.stepsDrawerBlockDescription}`}>
          {getStepDescription(step as unknown as Record<string, unknown>)}
        </span>
        {selector ? <code className={flowStyles.blockSelector}>{selector}</code> : null}
      </div>
    </li>
  );
}

function TransitionStepBlock({ step }: { step: FlowEditorTransitionStep }) {
  const sourceLabel = step.fromState?.label;
  const targetLabel = step.toState?.label;

  return (
    <li className={styles.stepsDrawerTransitionBlock}>
      <span className={styles.stepsDrawerStepIndex}>{step.index}</span>
      <div className={styles.stepsDrawerTransitionBody}>
        <p className={styles.stepsDrawerBlockDescription}>
          {getStepDescription(step as unknown as Record<string, unknown>)}
        </p>
        <span className={styles.stepsDrawerTransitionMeta}>
          {sourceLabel && targetLabel
            ? `${sourceLabel} -> ${targetLabel}`
            : `transition #${compactId(step.transitionId)}`}
        </span>
      </div>
    </li>
  );
}

export function TestFlowStepsDrawer({
  flow,
  detail,
  loading,
  error,
  onClose,
  onRetry,
}: TestFlowStepsDrawerProps) {
  const transitionSteps = useMemo(() => detail?.transitionSteps ?? [], [detail?.transitionSteps]);
  const draftSteps = useMemo(() => detail?.editorSteps ?? [], [detail?.editorSteps]);
  const draftGroups = useMemo(() => groupDraftSteps(draftSteps), [draftSteps]);
  const attachedDraftIds = useMemo(() => {
    const ids = new Set<string>();

    transitionSteps.forEach((step) => {
      for (const draft of draftGroups.get(`before:${step.transitionId}`) ?? []) ids.add(draft.id);
      for (const draft of draftGroups.get(`after:${step.transitionId}`) ?? []) ids.add(draft.id);
    });

    return ids;
  }, [draftGroups, transitionSteps]);
  const orphanDrafts = useMemo(
    () => draftSteps.filter((draft) => !attachedDraftIds.has(draft.id)),
    [attachedDraftIds, draftSteps],
  );
  const totalSteps = transitionSteps.length + draftSteps.length;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.stepsDrawerOverlay} role="presentation" onMouseDown={onClose}>
      <aside
        className={styles.stepsDrawerPanel}
        role="dialog"
        aria-modal="true"
        aria-label="TestFlow steps"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.stepsDrawerHeader}>
          <div>
            <span className={styles.stepsDrawerEyebrow}>TestFlow Steps</span>
            <h2>TestFlow #{compactId(flow.id)}</h2>
            <p>
              {totalSteps > 0 ? `${totalSteps} ordered steps` : `${flow.stepCount} steps`} /{" "}
              {flow.appVersionName}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close steps panel" title="Close">
            <X size={16} />
          </Button>
        </header>

        <div className={styles.stepsDrawerBody}>
          {loading ? (
            <div className={styles.stepsDrawerState}>
              <LoaderCircle className={styles.spinIcon} size={18} />
              <span>Loading steps...</span>
            </div>
          ) : error ? (
            <ContentErrorPanel
              title="Failed to load steps"
              message="The selected TestFlow steps could not be loaded."
              error={error}
              onRetry={onRetry}
            />
          ) : transitionSteps.length === 0 && draftSteps.length === 0 ? (
            <div className={styles.stepsDrawerState}>
              <span>No steps found for this TestFlow.</span>
            </div>
          ) : (
            <ol className={styles.stepsDrawerList}>
              {transitionSteps.map((step) => {
                const beforeDrafts = draftGroups.get(`before:${step.transitionId}`) ?? [];
                const afterDrafts = draftGroups.get(`after:${step.transitionId}`) ?? [];

                return (
                  <Fragment key={step.transitionId}>
                    {beforeDrafts.map((draft) => (
                      <ReadonlyEditorStepBlock key={draft.id} step={draft} />
                    ))}
                    <TransitionStepBlock step={step} />
                    {afterDrafts.map((draft) => (
                      <ReadonlyEditorStepBlock key={draft.id} step={draft} />
                    ))}
                  </Fragment>
                );
              })}
              {orphanDrafts.map((draft) => (
                <ReadonlyEditorStepBlock key={draft.id} step={draft} />
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}
