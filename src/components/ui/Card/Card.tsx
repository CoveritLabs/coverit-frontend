// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { HTMLAttributes } from "react";
import styles from "./Card.module.scss";
import { cn } from "@utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return <div className={cn(styles.card, className)} {...props} />;
}
