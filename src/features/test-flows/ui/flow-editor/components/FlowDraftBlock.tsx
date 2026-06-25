// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { FlowEditorDraftStep, FlowEditorStepKind } from "@features/test-flows/model/types/test-flows.types";
import { Equal, Hexagon, Trash2, Zap } from "lucide-react";
import type { ComponentType } from "react";
import { useMemo } from "react";
import { buildLabelTokens, renderLabelTokens } from "./edits-form/flow-editor-labels";
import styles from "../FlowEditor.module.scss";

function kindMeta(kind: FlowEditorStepKind): {
  label: string;
  Icon: ComponentType<{ className?: string }>;
} {
  if (kind === "design-class" || kind === "design-operation") return { label: "Design", Icon: Hexagon };
  if (kind === "action-hook") return { label: "Action-Hook", Icon: Zap };
  return { label: "Assertion", Icon: Equal };
}

type FlowDraftBlockProps = {
  step: FlowEditorDraftStep;
  priorKeys: ReadonlySet<string>;
  onRemove: (id: string) => void;
};

export function FlowDraftBlock({ step, priorKeys, onRemove }: FlowDraftBlockProps) {
  const meta = kindMeta(step.kind);
  const accentClass = styles[`blockAccent_${step.kind}`] ?? "";
  const tokens = useMemo(() => buildLabelTokens(step, priorKeys), [step, priorKeys]);

  return (
    <li className={`${styles.block} ${styles[`block_${step.kind}`]} ${accentClass}`}>
      <meta.Icon className={styles.blockIcon} />
      <div className={styles.blockBody}>
        <span className={styles.blockKind}>{meta.label}</span>
        <span className={styles.blockLabel}>{renderLabelTokens(tokens)}</span>
        <code className={styles.blockSelector}>{step.element?.selector ?? "No element needed"}</code>
      </div>
      <button
        type="button"
        className={styles.blockRemove}
        onClick={() => onRemove(step.id)}
        aria-label="Remove draft step"
      >
        <Trash2 className={styles.blockRemoveIcon} />
      </button>
    </li>
  );
}
