// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import * as React from "react";
import styles from "./Label.module.scss";
import { cn } from "@shared/utils/cn";

function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      data-slot="label"
      className={cn(styles.label, className)}
      {...props}
    />
  );
}

export { Label };
