// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { AlertCircle, MousePointerClick } from "lucide-react";
import type { CSSProperties, KeyboardEvent, MouseEvent, RefObject, WheelEvent } from "react";
import { statusLabel } from "../../lib/manual-session-formatters";
import type { BrowserSelectOption, BrowserSelectPayload } from "../../model/types/manual-session.types";
import styles from "../ManualSession.module.scss";

type ManualSessionViewportProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  viewport: {
    width: number;
    height: number;
  };
  hasFrame: boolean;
  error: string | null;
  hasLiveSession: boolean;
  status: string;
  selectOverlay: BrowserSelectPayload | null;
  onMouseMove: (event: MouseEvent<HTMLCanvasElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (event: MouseEvent<HTMLCanvasElement>) => void;
  onWheel: (event: WheelEvent<HTMLCanvasElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLCanvasElement>) => void;
  onDismissSelect: () => void;
  onSelectOption: (option: BrowserSelectOption) => void;
};

function selectMenuStyle(selectOverlay: BrowserSelectPayload, viewport: { width: number; height: number }): CSSProperties {
  const box = selectOverlay.elementBox ?? {};
  const overlayViewport = selectOverlay.viewport ?? viewport;
  const viewportWidth = overlayViewport.width || viewport.width || 1;
  const viewportHeight = overlayViewport.height || viewport.height || 1;
  const left = ((box.x ?? 0) / viewportWidth) * 100;
  const top = (((box.y ?? 0) + (box.height ?? 0)) / viewportHeight) * 100;
  const width = Math.max(140, box.width ?? 0);

  return {
    left: `${Math.min(Math.max(left, 0), 98)}%`,
    top: `${Math.min(Math.max(top, 0), 92)}%`,
    minWidth: `${width}px`,
  };
}

export function ManualSessionViewport({
  canvasRef,
  viewport,
  hasFrame,
  error,
  hasLiveSession,
  status,
  selectOverlay,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  onWheel,
  onKeyDown,
  onDismissSelect,
  onSelectOption,
}: ManualSessionViewportProps) {
  return (
    <div className={styles.viewportWrapper}>
      <div className={styles.viewportFrame}>
        {!hasFrame && (
          <div className={styles.viewportEmpty}>
            {error ? <AlertCircle className={styles.emptyIcon} /> : <MousePointerClick className={styles.emptyIcon} />}
            <span>{error ?? (hasLiveSession ? statusLabel(status) : "Select an application and version, then connect.")}</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={viewport.width}
          height={viewport.height}
          tabIndex={0}
          className={styles.browserCanvas}
          onContextMenu={(event) => event.preventDefault()}
          onMouseMove={onMouseMove}
          onMouseDown={(event) => {
            event.preventDefault();
            canvasRef.current?.focus();
            onMouseDown(event);
          }}
          onMouseUp={(event) => {
            event.preventDefault();
            onMouseUp(event);
          }}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        />
        {selectOverlay && (
          <>
            <button
              type="button"
              className={styles.selectOverlayDismiss}
              aria-label="Close select menu"
              onClick={onDismissSelect}
              tabIndex={-1}
            />
            <div
              className={styles.selectOverlayMenu}
              style={selectMenuStyle(selectOverlay, viewport)}
              role="listbox"
            >
              {selectOverlay.options.map((option, index) => {
                const selected = option.value === (selectOverlay.value ?? "");
                return (
                  <button
                    key={`${option.value}-${index}`}
                    type="button"
                    className={selected ? styles.selectOverlayOptionSelected : styles.selectOverlayOption}
                    disabled={option.disabled}
                    role="option"
                    aria-selected={selected}
                    onClick={() => onSelectOption(option)}
                  >
                    {option.text || option.value}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
