// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { cn } from "@shared/utils/cn";
import styles from "./PasswordStrength.module.scss";

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  if (!password) return null;
  const strength =
    password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colorClass = ["", styles.strengthWeak, styles.strengthFair, styles.strengthGood, styles.strengthStrong];
  return (
    <div className={styles.wrapper}>
      <div className={styles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn(styles.bar, i <= strength && colorClass[strength])} />
        ))}
      </div>
      <p className={cn(styles.label, colorClass[strength])}>{labels[strength]}</p>
    </div>
  );
};

export default PasswordStrength;
