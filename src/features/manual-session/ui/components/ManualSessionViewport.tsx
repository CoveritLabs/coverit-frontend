// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { AlertCircle, MousePointerClick } from "lucide-react";
import type { KeyboardEvent, MouseEvent, RefObject, WheelEvent } from "react";
import { statusLabel } from "@shared/lib/live-session-formatters";
import { LiveCanvasFrame } from "@shared/ui";
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
    <LiveCanvasFrame
      canvasRef={canvasRef}
      viewport={viewport}
      hasFrame={hasFrame}
      tabIndex={0}
      emptyState={
        <>
          {error ? <AlertCircle className={styles.emptyIcon} /> : <MousePointerClick className={styles.emptyIcon} />}
          <span>{error ?? (hasLiveSession ? statusLabel(status) : "Select an application and version, then connect.")}</span>
        </>
      }
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
  );
}
