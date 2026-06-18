// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { CSSProperties } from "react";
import {
  REGRESSION_ASSERTION_RESULTS,
  REGRESSION_EVENT_CATEGORIES,
  type RegressionAssertionResult,
  type RegressionEventCategory,
} from "../model/constants/regressionSemantics";
import { cn } from "@shared/utils/cn";
import styles from "./RegressionSemanticMarker.module.scss";

export function RegressionSemanticMarker({
  category,
  assertionResult = "pass",
  size,
  className,
}: {
  category: RegressionEventCategory;
  assertionResult?: RegressionAssertionResult;
  size?: number;
  className?: string;
}) {
  const categoryDefinition = REGRESSION_EVENT_CATEGORIES[category];
  const definition = category === "assertion" ? REGRESSION_ASSERTION_RESULTS[assertionResult] : categoryDefinition;
  const Icon = categoryDefinition.icon;
  const style = {
    "--regression-semantic-foreground": `var(${definition.foregroundVar})`,
    "--marker-size": size ? `${size}px` : undefined,
  } as CSSProperties;

  return (
    <span className={cn(styles.marker, category === "basic" && styles.basic, className)} style={style} aria-hidden="true">
      <Icon />
    </span>
  );
}
