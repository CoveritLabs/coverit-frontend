// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Circle, Workflow, CircleDot, Zap, ClipboardList, Blocks, Component, CircleCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type RegressionEventCategory =
  | "scenario"
  | "state"
  | "transition"
  | "assertion"
  | "designClass"
  | "hook"
  | "basic";
export type RegressionEventLevel = "info" | "debug" | "warn" | "error";
export type RegressionAssertionResult = "pass" | "warn" | "fail";

export interface RegressionSemanticDefinition {
  label: string;
  icon: LucideIcon;
  foregroundVar: string;
  backgroundVar: string;
}

export const REGRESSION_EVENT_CATEGORIES: Record<RegressionEventCategory, RegressionSemanticDefinition> = {
  scenario: {
    label: "Scenario",
    icon: ClipboardList,
    foregroundVar: "--regression-category-scenario",
    backgroundVar: "--regression-category-scenario-bg",
  },
  state: {
    label: "State",
    icon: Component,
    foregroundVar: "--regression-category-state",
    backgroundVar: "--regression-category-state-bg",
  },
  transition: {
    label: "Transition",
    icon: Workflow,
    foregroundVar: "--regression-category-transition",
    backgroundVar: "--regression-category-transition-bg",
  },
  assertion: {
    label: "Assertion",
    icon: CircleCheck,
    foregroundVar: "--regression-result-pass",
    backgroundVar: "--regression-result-pass-bg",
  },
  designClass: {
    label: "Design Class",
    icon: Blocks,
    foregroundVar: "--regression-category-design-class",
    backgroundVar: "--regression-category-design-class-bg",
  },
  hook: {
    label: "Hook",
    icon: Zap,
    foregroundVar: "--regression-category-hook",
    backgroundVar: "--regression-category-hook-bg",
  },
  basic: {
    label: "Log",
    icon: CircleDot,
    foregroundVar: "--regression-category-basic",
    backgroundVar: "--regression-category-basic-bg",
  },
};

export const REGRESSION_EVENT_LEVELS: Record<RegressionEventLevel, RegressionSemanticDefinition> = {
  info: {
    label: "INFO",
    icon: Circle,
    foregroundVar: "--regression-level-info",
    backgroundVar: "--regression-level-info-bg",
  },
  debug: {
    label: "DEBUG",
    icon: Circle,
    foregroundVar: "--regression-level-debug",
    backgroundVar: "--regression-level-debug-bg",
  },
  warn: {
    label: "WARN",
    icon: Circle,
    foregroundVar: "--regression-level-warn",
    backgroundVar: "--regression-level-warn-bg",
  },
  error: {
    label: "ERROR",
    icon: Circle,
    foregroundVar: "--regression-level-error",
    backgroundVar: "--regression-level-error-bg",
  },
};

export const REGRESSION_ASSERTION_RESULTS: Record<RegressionAssertionResult, RegressionSemanticDefinition> = {
  pass: {
    label: "Pass",
    icon: CircleCheck,
    foregroundVar: "--regression-result-pass",
    backgroundVar: "--regression-result-pass-bg",
  },
  warn: {
    label: "Warn",
    icon: CircleCheck,
    foregroundVar: "--regression-result-warn",
    backgroundVar: "--regression-result-warn-bg",
  },
  fail: {
    label: "Fail",
    icon: CircleCheck,
    foregroundVar: "--regression-result-fail",
    backgroundVar: "--regression-result-fail-bg",
  },
};

export const REGRESSION_EVENT_CATEGORY_ORDER: RegressionEventCategory[] = [
  "scenario",
  "state",
  "transition",
  "assertion",
  "basic",
];
