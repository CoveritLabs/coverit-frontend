// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  FlowEditorDraftStep,
  FlowEditorTransitionStep,
} from "@features/test-flows/model/types/test-flows.types";
import type { EditorPosition } from "../flow-editor.types";
import { TransitionItem } from "./TransitionItem";
import styles from "../FlowEditor.module.scss";

type FlowStepListProps = {
  transitionSteps: FlowEditorTransitionStep[];
  draftSteps: FlowEditorDraftStep[];
  activePosition: EditorPosition | null;
  positionLoading: boolean;
  priorKeysMap: Map<string, Set<string>>;
  onOpenPosition: (position: EditorPosition) => void;
  onRemoveDraft: (id: string) => void;
};

export function FlowStepList({
  transitionSteps,
  draftSteps,
  activePosition,
  positionLoading,
  priorKeysMap,
  onOpenPosition,
  onRemoveDraft,
}: FlowStepListProps) {
  return (
    <ol className={styles.flowList}>
      {transitionSteps.map((step) => {
        const before: EditorPosition = { edge: "before", transitionId: step.transitionId };
        const after: EditorPosition = { edge: "after", transitionId: step.transitionId };
        const currentPosition = activePosition?.transitionId === step.transitionId ? activePosition : null;
        return (
          <TransitionItem
            key={step.transitionId}
            step={step}
            activeEdge={currentPosition?.edge ?? null}
            replaying={positionLoading && Boolean(currentPosition)}
            allDraftSteps={draftSteps}
            priorKeysMap={priorKeysMap}
            onBefore={() => onOpenPosition(before)}
            onAfter={() => onOpenPosition(after)}
            onRemoveDraft={onRemoveDraft}
          />
        );
      })}
    </ol>
  );
}
