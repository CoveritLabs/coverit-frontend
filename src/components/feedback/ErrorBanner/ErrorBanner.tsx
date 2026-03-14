// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import styles from "./ErrorBanner.module.scss";

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={styles.banner}>
      <AlertCircle className={styles.icon} />
      <p className={styles.message}>{message}</p>
    </motion.div>
  );
}
