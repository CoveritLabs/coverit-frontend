// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { FlowEditorElementRef } from "@features/test-flows/model/types/test-flows.types";
import { ChevronDown, ChevronUp, Crosshair } from "lucide-react";
import { elementName } from "./edits-form/flow-editor-form-utils";
import styles from "../FlowEditor.module.scss";

function formatBox(box: FlowEditorElementRef["box"]) {
  if (!box) return "Unavailable";
  return `${box.width} x ${box.height} at ${box.x}, ${box.y}`;
}

function formatViewport(viewport: FlowEditorElementRef["viewport"]) {
  if (!viewport) return "Unavailable";
  return `${viewport.width} x ${viewport.height}`;
}

function metadataText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Unavailable";
}

function MetadataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className={styles.metadataRow}>
      <span>{label}</span>
      <strong className={mono ? styles.metadataMono : undefined}>{metadataText(value)}</strong>
    </div>
  );
}

type ElementInfoDrawerProps = {
  selectedElement: FlowEditorElementRef | null;
  isOpen: boolean;
  onToggle: () => void;
};

export function ElementInfoDrawer({ selectedElement, isOpen, onToggle }: ElementInfoDrawerProps) {
  const selectorCandidates = selectedElement?.selectorCandidates?.filter(Boolean) ?? [];
  const attributes = Object.entries(selectedElement?.attributes ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return (
    <section className={`${styles.inspectorDrawer} ${isOpen ? styles.inspectorDrawerOpen : ""}`}>
      <button type="button" className={styles.inspectorDrawerToggle} onClick={onToggle} aria-expanded={isOpen}>
        <span className={styles.inspectorDrawerTitle}>
          <Crosshair className={styles.inspectorDrawerIcon} />
          <span>Selected Element</span>
          <strong>{elementName(selectedElement)}</strong>
        </span>
        {isOpen ? <ChevronDown className={styles.drawerChevron} /> : <ChevronUp className={styles.drawerChevron} />}
      </button>

      {isOpen && (
        <div className={styles.inspectorDrawerBody}>
          <section className={styles.metadataGroup}>
            <h3>Selector</h3>
            <code className={styles.metadataPrimary}>{selectedElement?.selector ?? "Unavailable"}</code>
            {selectorCandidates.length > 0 && (
              <div className={styles.selectorCandidateList}>
                {selectorCandidates.map((selector) => (
                  <code key={selector}>{selector}</code>
                ))}
              </div>
            )}
          </section>

          <section className={styles.metadataGroup}>
            <h3>Identity</h3>
            <MetadataRow label="Tag" value={selectedElement?.tag ?? undefined} mono />
            <MetadataRow label="Name" value={selectedElement?.accessibleName} />
            <MetadataRow label="Text" value={selectedElement?.text} />
          </section>

          <section className={styles.metadataGroup}>
            <h3>Attributes</h3>
            {attributes.length > 0 ? (
              <div className={styles.attributeList}>
                {attributes.map(([name, value]) => (
                  <div key={name} className={styles.attributeRow}>
                    <code>{name}</code>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className={styles.metadataEmpty}>Unavailable</span>
            )}
          </section>

          <section className={styles.metadataGroup}>
            <h3>Page</h3>
            <MetadataRow label="URL" value={selectedElement?.pageUrl} mono />
            <MetadataRow label="State" value={selectedElement?.stateHash} mono />
          </section>

          <section className={styles.metadataGroup}>
            <h3>Geometry</h3>
            <MetadataRow label="Box" value={formatBox(selectedElement?.box)} mono />
            <MetadataRow label="Viewport" value={formatViewport(selectedElement?.viewport)} mono />
          </section>
        </div>
      )}
    </section>
  );
}
