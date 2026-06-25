// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { FlowEditorElementRef, FlowEditorTransitionStep } from "@features/test-flows/model/types/test-flows.types";
import { LiveCanvasFrame } from "@shared/ui";
import { AlertCircle, Crosshair, LoaderCircle } from "lucide-react";
import type { MouseEvent, RefObject, WheelEvent } from "react";
import { positionLabel } from "./edits-form/flow-editor-form-utils";
import type { EditorPosition, FlowEditorViewportSize } from "../flow-editor.types";
import { elementBoxStyle, isSameElement } from "../flow-editor-utils";
import { elementName } from "./edits-form/flow-editor-form-utils";
import styles from "../FlowEditor.module.scss";

type FlowEditorViewportProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  viewport: FlowEditorViewportSize;
  hasFrame: boolean;
  error: string | null;
  editorLoading: boolean;
  connecting: boolean;
  activePosition: EditorPosition | null;
  positionLoading: boolean;
  inspectorEnabled: boolean;
  selectedElement: FlowEditorElementRef | null;
  hoveredElement: FlowEditorElementRef | null;
  transitionSteps: FlowEditorTransitionStep[];
  onMouseMove: (event: MouseEvent<HTMLCanvasElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLCanvasElement>) => void;
  onWheel: (event: WheelEvent<HTMLCanvasElement>) => void;
};

export function FlowEditorViewport({
  canvasRef,
  viewport,
  hasFrame,
  error,
  editorLoading,
  connecting,
  activePosition,
  positionLoading,
  inspectorEnabled,
  selectedElement,
  hoveredElement,
  transitionSteps,
  onMouseMove,
  onMouseDown,
  onWheel,
}: FlowEditorViewportProps) {
  const selectedOverlayStyle = elementBoxStyle(selectedElement, viewport);
  const activeHoveredElement = inspectorEnabled ? hoveredElement : null;
  const hoveredOverlayStyle = elementBoxStyle(activeHoveredElement, viewport);
  const hoverMatchesSelected = isSameElement(activeHoveredElement, selectedElement);
  const hasInspectorOverlay = selectedOverlayStyle || hoveredOverlayStyle;
  const replayOverlayMessage = error && hasFrame ? error : "Updating replay position";

  return (
    <LiveCanvasFrame
      canvasRef={canvasRef}
      viewport={viewport}
      hasFrame={hasFrame}
      canvasClassName={hasFrame && activePosition && inspectorEnabled ? styles.editorCanvasInspecting : undefined}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onWheel={onWheel}
      emptyState={
        <>
          {editorLoading || connecting ? (
            <LoaderCircle className={styles.spinnerIcon} />
          ) : error ? (
            <AlertCircle className={styles.emptyIcon} />
          ) : (
            <Crosshair className={styles.emptyIcon} />
          )}
          <span>{error ?? (editorLoading ? "Loading editor..." : "Opening replay session...")}</span>
        </>
      }
    >
        {(positionLoading || (error && hasFrame)) && (
          <div className={`${styles.positionLoadingOverlay} ${error && hasFrame ? styles.positionErrorOverlay : ""}`}>
            {error && hasFrame ? (
              <AlertCircle className={styles.emptyIcon} />
            ) : (
              <LoaderCircle className={styles.spinnerIcon} />
            )}
            <span>{replayOverlayMessage}</span>
            {activePosition && <strong>{positionLabel(activePosition, transitionSteps)}</strong>}
          </div>
        )}
        {hasInspectorOverlay && (
          <div className={styles.canvasOverlay} aria-hidden="true">
            {selectedOverlayStyle && !hoverMatchesSelected && (
              <span className={`${styles.inspectBox} ${styles.inspectBoxSelected}`} style={selectedOverlayStyle} />
            )}
            {hoveredOverlayStyle && (
              <>
                <span
                  className={`${styles.inspectBox} ${styles.inspectBoxHovered} ${
                    hoverMatchesSelected ? styles.inspectBoxCombined : ""
                  }`}
                  style={hoveredOverlayStyle}
                />
                <span
                  className={styles.inspectPopup}
                  style={{ left: hoveredOverlayStyle.left, top: hoveredOverlayStyle.top }}
                >
                  {activeHoveredElement?.tag ?? "element"} {elementName(activeHoveredElement)}
                </span>
              </>
            )}
          </div>
        )}
    </LiveCanvasFrame>
  );
}
