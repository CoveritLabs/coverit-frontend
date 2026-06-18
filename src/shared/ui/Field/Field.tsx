// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import React from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "../Label";
import styles from "./Field.module.scss";

interface FieldProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className={styles.container}>
      {label && <Label className={styles.label}>{label}</Label>}
      {children}
      {error && (
        <p className={styles.error}>
          <AlertCircle className={styles.errorIcon} />
          {error}
        </p>
      )}
    </div>
  );
}
