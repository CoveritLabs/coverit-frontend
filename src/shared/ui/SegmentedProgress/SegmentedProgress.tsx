// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { cn } from "@shared/utils/cn";
import styles from "./SegmentedProgress.module.scss";

interface SegmentedProgressProps {
  value: number;
  total?: number;
  className?: string;
}

export function SegmentedProgress({ value, total = 5, className }: SegmentedProgressProps) {
  const safeTotal = Math.max(1, total);
  const filled = Math.min(Math.max(0, value), safeTotal);

  return (
    <div className={cn(styles.progress, className)} aria-label={`${filled} of ${safeTotal} steps completed`}>
      <div className={styles.segments} aria-hidden="true">
        {Array.from({ length: safeTotal }, (_, index) => (
          <span key={index} className={cn(styles.segment, index < filled && styles.segmentFilled)} />
        ))}
      </div>
      <span className={styles.counter}>
        {filled}/{safeTotal}
      </span>
    </div>
  );
}
