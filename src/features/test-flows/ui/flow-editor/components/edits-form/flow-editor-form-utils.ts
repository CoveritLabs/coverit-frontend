// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  ElementTokenOption,
  VariableTokenOption,
} from "@features/test-flows/lib/flow-editor-token-options";
import type {
  FlowEditorDraftStep,
  FlowEditorElementRef,
  FlowEditorTransitionStep,
} from "@features/test-flows/model/types/test-flows.types";
import type { FlowEditorValueSpec } from "./flow-editor-edit-types";

export function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function positionLabel(position: FlowEditorDraftStep["position"] | null, steps: FlowEditorTransitionStep[]) {
  if (!position) return "No insertion point selected";
  const step = steps.find((item) => item.transitionId === position.transitionId);
  const index = step?.index ?? "?";
  return `${position.edge === "before" ? "Before" : "After"} transition ${index}`;
}

export function elementName(element: FlowEditorElementRef | null) {
  if (!element) return "No element selected";
  return element.accessibleName || element.text || element.selector || element.tag || "Selected element";
}

export function cssLocator(selector: string) {
  return selector ? { cssSelector: selector } : undefined;
}

export function coerceLiteral(value: string) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return value;
}

export function formatLabel(value: string) {
  if (value === "visibility") return "Visible";
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function safeFunctionIdentifier(value: string) {
  const compact = value.trim().replace(/[^A-Za-z0-9_$]/g, "");
  if (!compact) return "customFunction";
  return /^[A-Za-z_$]/.test(compact) ? compact : `custom${compact}`;
}

export function literalValueSpec(value: string): FlowEditorValueSpec {
  return { literal: coerceLiteral(value) };
}

export function textValueSpec(value: string): FlowEditorValueSpec {
  return { literal: value };
}

export function elementValueSpec(option: ElementTokenOption, attribute?: string): FlowEditorValueSpec {
  return {
    source: "element",
    selector: option.selector,
    token: option.token,
    ...(attribute ? { attribute } : {}),
  };
}

export function variableValueSpec(option: VariableTokenOption): FlowEditorValueSpec {
  return { source: "store", path: option.name };
}

export function buildFunctionCode(name: string, body: string) {
  return `function ${safeFunctionIdentifier(name)} (designClass, html): Boolean {
${body.trimEnd()}
}`;
}

export function buildDesignFunctionCode(name: string, body: string) {
  return `function ${safeFunctionIdentifier(name)} (store, html): void {
${body.trimEnd()}
}`;
}

export function defaultHookArgument(command: string) {
  if (command === "wait") return "500";
  if (command === "wait-for-load-state") return "networkidle";
  return "";
}

export function attachExpected(base: Record<string, unknown>, operator: string, expected: FlowEditorValueSpec) {
  const definition: Record<string, unknown> = { ...base, expected };
  if (["text", "text-exact", "text-matches"].includes(operator)) definition.expectedText = expected;
  if (["value", "attribute"].includes(operator)) definition.expectedValue = expected;
  if (operator === "count") definition.expectedCount = expected;
  if (operator === "visibility") definition.visible = true;
  return definition;
}

export function optionForSelectedElement(elementOptions: ElementTokenOption[], selectedElement: FlowEditorElementRef | null) {
  const selector = selectedElement?.selector || selectedElement?.selectorCandidates?.find(Boolean);
  if (!selector) return null;
  return elementOptions.find((option) => option.selector === selector) ?? null;
}

export function elementTokenLabel(option: ElementTokenOption, attribute: string) {
  const attr = attribute.trim();
  return attr ? `${option.token}.${attr}` : option.token;
}
