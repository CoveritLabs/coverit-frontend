// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ReactNode } from "react";
import { Button, LiveSessionTabBar } from "@shared/ui";
import { Crosshair, ListChecks, LoaderCircle, PencilLine, Save, X } from "lucide-react";
import type { FlowEditorPanelTab } from "../flow-editor.types";
import type { TestFlow } from "@features/test-flows/model/types/test-flows.types";
import { compactId } from "../flow-editor-utils";
import styles from "../FlowEditor.module.scss";

const FLOW_EDITOR_TABS = [
  { value: "flow", label: "Flow", Icon: ListChecks },
  { value: "editor", label: "Edits", Icon: PencilLine },
] satisfies Array<{ value: FlowEditorPanelTab; label: string; Icon: typeof ListChecks }>;

type FlowEditorSidebarProps = {
  flow: TestFlow | null;
  activeTab: FlowEditorPanelTab;
  transitionCount: number;
  draftCount: number;
  hasDirtyDrafts: boolean;
  inspectorEnabled: boolean;
  saving: boolean;
  flowContent: ReactNode;
  editorContent: ReactNode;
  onTabChange: (tab: FlowEditorPanelTab) => void;
  onToggleInspector: () => void;
  onSave: () => void;
  onBack: () => void;
};

export function FlowEditorSidebar({
  flow,
  activeTab,
  transitionCount,
  draftCount,
  hasDirtyDrafts,
  inspectorEnabled,
  saving,
  flowContent,
  editorContent,
  onTabChange,
  onToggleInspector,
  onSave,
  onBack,
}: FlowEditorSidebarProps) {
  return (
    <aside className={styles.panel}>
      <section className={styles.sidebarContext}>
        <div className={styles.sidebarContextHeader}>
          <span className={styles.contextEyebrow}>Flow Editor</span>
          <strong>{flow ? `TestFlow #${compactId(flow.id)}` : "Loading TestFlow"}</strong>
          <span className={styles.targetSummary}>
            {transitionCount} transitions / {draftCount} draft steps
            {hasDirtyDrafts ? " / unsaved" : ""}
          </span>
        </div>
        <div className={styles.panelActions}>
          <button
            type="button"
            className={`${styles.iconButton} ${inspectorEnabled ? styles.iconButtonActive : ""}`}
            onClick={onToggleInspector}
            aria-pressed={inspectorEnabled}
            title={inspectorEnabled ? "Disable inspector" : "Enable inspector"}
          >
            <Crosshair className={styles.buttonIcon} />
          </button>
          <Button size="sm" variant="outline" onClick={onSave} disabled={!hasDirtyDrafts || saving}>
            {saving ? <LoaderCircle className={styles.spinnerIcon} /> : <Save size={14} />}
            Save
          </Button>
          {hasDirtyDrafts && <span className={styles.dirtyBadge}>Unsaved</span>}
        </div>
      </section>

      <LiveSessionTabBar
        tabs={FLOW_EDITOR_TABS}
        activeTab={activeTab}
        onTabChange={onTabChange}
        ariaLabel="Flow editor sections"
      />

      {activeTab === "flow" ? flowContent : editorContent}

      <button type="button" className={styles.backButton} onClick={onBack}>
        <X className={styles.buttonIcon} />
        Back to TestFlows
      </button>
    </aside>
  );
}
