// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

declare module "motion/react" {
  import type { ComponentType, ReactNode } from "react";

  export const motion: Record<string, ComponentType<Record<string, unknown>>>;
  export const AnimatePresence: ComponentType<{
    children?: ReactNode;
    custom?: unknown;
    initial?: boolean;
    mode?: "sync" | "popLayout" | "wait";
    onExitComplete?: () => void;
    presenceAffectsLayout?: boolean;
    propagate?: boolean;
  }>;
}
