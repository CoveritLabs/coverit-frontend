// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  FlowEditorDraftStep,
  FlowEditorPositionEdge,
  FlowEditorTransitionStep,
} from "@features/test-flows/model/types/test-flows.types";
import { Plus } from "lucide-react";
import { compactId, labelingStatusLabel, positionKey } from "../flow-editor-utils";
import { FlowDraftBlock } from "./FlowDraftBlock";
import styles from "../FlowEditor.module.scss";

type InjectorRowProps = {
  label: string;
  active?: boolean;
  replaying?: boolean;
  onClick: () => void;
};

function InjectorRow({ label, active = false, replaying = false, onClick }: InjectorRowProps) {
  return (
    <div
      className={`${styles.injector} ${active ? styles.injectorActive : ""} ${
        replaying ? styles.injectorReplaying : ""
      }`}
    >
      <button type="button" className={styles.injectorButton} onClick={onClick} aria-label={label}>
        <Plus className={styles.injectorIcon} />
      </button>
      <span className={styles.injectorLine} />
    </div>
  );
}

type TransitionItemProps = {
  step: FlowEditorTransitionStep;
  activeEdge: FlowEditorPositionEdge | null;
  replaying: boolean;
  allDraftSteps: FlowEditorDraftStep[];
  priorKeysMap: Map<string, Set<string>>;
  onBefore: () => void;
  onAfter: () => void;
  onRemoveDraft: (id: string) => void;
};

export function TransitionItem({
  step,
  activeEdge,
  replaying,
  allDraftSteps,
  priorKeysMap,
  onBefore,
  onAfter,
  onRemoveDraft,
}: TransitionItemProps) {
  const active = activeEdge !== null;
  const sourceLabel = step.fromState?.label;
  const targetLabel = step.toState?.label;
  const labelingStatus = step.labelingStatus ?? "MISSING";
  const beforeKey = `before:${step.transitionId}`;
  const afterKey = `after:${step.transitionId}`;
  const beforeDrafts = allDraftSteps.filter((draft) => positionKey(draft.position) === beforeKey);
  const afterDrafts = allDraftSteps.filter((draft) => positionKey(draft.position) === afterKey);

  return (
    <li className={styles.transitionGroup}>
      <InjectorRow
        label={`Insert before transition ${step.index}`}
        active={activeEdge === "before"}
        replaying={activeEdge === "before" && replaying}
        onClick={onBefore}
      />

      {beforeDrafts.map((draft) => (
        <FlowDraftBlock
          key={draft.id}
          step={draft}
          priorKeys={priorKeysMap.get(draft.id) ?? new Set()}
          onRemove={onRemoveDraft}
        />
      ))}

      <div className={`${styles.step} ${active ? styles.stepActive : ""} ${replaying ? styles.stepReplaying : ""}`}>
        <span className={styles.stepIndex}>{step.index}</span>
        <div className={styles.stepBody}>
          <strong>{step.label}</strong>
          <span className={styles.stepDetail}>{step.action || step.transitionId}</span>
          <span className={styles.stepUrl}>
            {sourceLabel && targetLabel
              ? `${sourceLabel} -> ${targetLabel}`
              : `transition #${compactId(step.transitionId)}`}
          </span>
        </div>
        <span className={`${styles.stepStatus} ${styles[`stepStatus_${labelingStatus.toLowerCase()}`]}`}>
          {labelingStatusLabel(labelingStatus)}
        </span>
      </div>

      {afterDrafts.map((draft) => (
        <FlowDraftBlock
          key={draft.id}
          step={draft}
          priorKeys={priorKeysMap.get(draft.id) ?? new Set()}
          onRemove={onRemoveDraft}
        />
      ))}

      <InjectorRow
        label={`Insert after transition ${step.index}`}
        active={activeEdge === "after"}
        replaying={activeEdge === "after" && replaying}
        onClick={onAfter}
      />
    </li>
  );
}
