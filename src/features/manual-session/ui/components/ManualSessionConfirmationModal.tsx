// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { Button, Card } from "@shared/ui";
import type { ManualAction } from "../../model/types/manual-session.types";
import styles from "../ManualSession.module.scss";

export type ManualSessionConfirmationKind = "exit" | "finish" | "bug";

type ManualSessionConfirmationModalProps = {
  kind: ManualSessionConfirmationKind;
  pendingAction: ManualAction | null;
  onCancel: () => void;
  onConfirm: () => void;
};

const modalContent: Record<
  ManualSessionConfirmationKind,
  {
    title: string;
    description: string;
    confirmLabel: string;
    pendingLabel: string;
    ariaLabel: string;
    action: ManualAction;
    destructive: boolean;
  }
> = {
  exit: {
    title: "Exit manual session?",
    description: "This will close the current browser session.",
    confirmLabel: "Close session",
    pendingLabel: "Closing...",
    ariaLabel: "Exit manual session",
    action: "disconnect",
    destructive: true,
  },
  finish: {
    title: "Finish manual flow?",
    description: "This will create a manual TestFlow and end the current session.",
    confirmLabel: "Create TestFlow",
    pendingLabel: "Creating...",
    ariaLabel: "Finish manual flow",
    action: "finish",
    destructive: false,
  },
  bug: {
    title: "Queue bug report?",
    description: "This will create a bug reproduction TestFlow, queue the bug report, and end the current session.",
    confirmLabel: "Queue bug report",
    pendingLabel: "Queueing...",
    ariaLabel: "Queue bug report",
    action: "bug",
    destructive: false,
  },
};

export function ManualSessionConfirmationModal({
  kind,
  pendingAction,
  onCancel,
  onConfirm,
}: ManualSessionConfirmationModalProps) {
  const content = modalContent[kind];
  const busy = pendingAction === content.action;
  const disabled = pendingAction !== null;
  const Icon = content.destructive ? AlertCircle : CheckCircle2;
  const handleCancel = () => {
    if (disabled) return;
    onCancel();
  };

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={handleCancel}>
      <Card
        className={styles.confirmationModal}
        role="dialog"
        aria-modal="true"
        aria-label={content.ariaLabel}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.confirmationTitleGroup}>
            <Icon className={content.destructive ? styles.confirmationIconDanger : styles.confirmationIcon} />
            <div>
              <h3 className={styles.modalTitle}>{content.title}</h3>
              <p className={styles.modalDescription}>{content.description}</p>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={handleCancel} disabled={disabled} aria-label="Close modal">
            <X className={styles.iconSmall} />
          </Button>
        </div>

        <div className={styles.modalActions}>
          <Button variant="outline" onClick={handleCancel} disabled={disabled}>
            Cancel
          </Button>
          <Button variant={content.destructive ? "destructive" : "primary"} onClick={onConfirm} disabled={disabled}>
            {busy && <LoaderCircle className={styles.spinnerIcon} />}
            {busy ? content.pendingLabel : content.confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
