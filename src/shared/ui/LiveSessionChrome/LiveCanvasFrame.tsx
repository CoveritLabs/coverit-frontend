// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { KeyboardEvent, MouseEvent, ReactNode, RefObject, WheelEvent } from "react";
import { cn } from "@shared/utils/cn";
import styles from "./LiveSessionChrome.module.scss";

type LiveCanvasFrameProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  viewport: {
    width: number;
    height: number;
  };
  hasFrame: boolean;
  emptyState: ReactNode;
  children?: ReactNode;
  canvasClassName?: string;
  tabIndex?: number;
  onMouseMove?: (event: MouseEvent<HTMLCanvasElement>) => void;
  onMouseDown?: (event: MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: (event: MouseEvent<HTMLCanvasElement>) => void;
  onWheel?: (event: WheelEvent<HTMLCanvasElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLCanvasElement>) => void;
};

export function LiveCanvasFrame({
  canvasRef,
  viewport,
  hasFrame,
  emptyState,
  children,
  canvasClassName,
  tabIndex,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  onWheel,
  onKeyDown,
}: LiveCanvasFrameProps) {
  return (
    <div className={styles.viewportWrapper}>
      <div className={styles.viewportFrame}>
        {!hasFrame ? <div className={styles.viewportEmpty}>{emptyState}</div> : null}
        <canvas
          ref={canvasRef}
          width={viewport.width}
          height={viewport.height}
          tabIndex={tabIndex}
          className={cn(styles.browserCanvas, canvasClassName)}
          onContextMenu={(event) => event.preventDefault()}
          onMouseMove={onMouseMove}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        />
        {children}
      </div>
    </div>
  );
}
