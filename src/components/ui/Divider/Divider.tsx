// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import styles from "./Divider.module.scss";

interface DividerProps {
  text?: string;
}

export function Divider({ text }: DividerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.line} />
      {text ? <span className={styles.text}>{text}</span> : null}
      <div className={styles.line} />
    </div>
  );
}
