// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import React, { forwardRef } from "react";
import styles from "./Button.module.scss";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "link"
  | "default";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, className, variant = "default", size = "md", ...props },
    ref,
  ) => {
    const classes = [
      styles.button,
      styles[variant] || styles.default,
      styles[size] || styles.md,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} data-slot="button" className={classes} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
