// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { AlertCircle, MousePointerClick } from "lucide-react";
import type { KeyboardEvent, MouseEvent, RefObject, WheelEvent } from "react";
import { statusLabel } from "../../lib/manual-session-formatters";
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
  onHover: (event: MouseEvent<HTMLCanvasElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (event: MouseEvent<HTMLCanvasElement>) => void;
  onWheel: (event: WheelEvent<HTMLCanvasElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLCanvasElement>) => void;
};

export function ManualSessionViewport({
  canvasRef,
  viewport,
  hasFrame,
  error,
  hasLiveSession,
  status,
  onHover,
  onMouseDown,
  onMouseUp,
  onWheel,
  onKeyDown,
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
          onMouseDown={(event) => {
            event.preventDefault();
            canvasRef.current?.focus();
            if (event.button === 2) {
              onHover(event);
              return;
            }
            onMouseDown(event);
          }}
          onMouseUp={(event) => {
            event.preventDefault();
            if (event.button === 2) return;
            onMouseUp(event);
          }}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
