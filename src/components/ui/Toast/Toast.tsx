// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { toast as sonnerToast } from "sonner";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@utils/cn";
import styles from "./Toast.module.scss";

interface ToastProps {
  id: string | number;
  title: string;
  description?: string;
  variant: "success" | "error" | "warning";
}

const variants = {
  success: {
    Icon: CheckCircle2,
  },
  error: {
    Icon: XCircle,
  },
  warning: {
    Icon: AlertTriangle,
  },
} as const;

function ToastItem({ id, title, description, variant }: ToastProps) {
  const { Icon } = variants[variant];
  const toastClassName = cn(styles.toast, styles[variant]);

  return (
    <div className={toastClassName}>
      <Icon className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <button onClick={() => sonnerToast.dismiss(id)} className={styles.closeButton}>
        <X className={styles.closeIcon} />
      </button>
    </div>
  );
}

export const toast = {
  success: (title: string, description?: string) =>
    sonnerToast.custom((id) => <ToastItem id={id} title={title} description={description} variant="success" />),

  error: (title: string, description?: string) =>
    sonnerToast.custom((id) => <ToastItem id={id} title={title} description={description} variant="error" />),

  warning: (title: string, description?: string) =>
    sonnerToast.custom((id) => <ToastItem id={id} title={title} description={description} variant="warning" />),
};
