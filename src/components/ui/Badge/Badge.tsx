// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { HTMLAttributes } from "react";
import styles from "./Badge.module.scss";
import { cn } from "@utils/cn";

type Variant = "default" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn(styles.badge, styles[variant], className)} {...props} />;
}
