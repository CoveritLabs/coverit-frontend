// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ElementTokenOption, VariableTokenOption } from "@features/manual-session/lib/flow-editor-token-options";
import type {
  FlowEditorDraftStep,
  FlowEditorElementRef,
  FlowEditorTransitionStep,
  FlowEditorValueSpec,
} from "@features/test-flows/model/types/test-flows.types";
import { Button, Field, Input, Select } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import { AlertTriangle, Check, Equal, Hexagon, LoaderCircle, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import styles from "../FlowEditor.module.scss";
import { TokenPickerInput } from "./TokenPickerInput";

/* ─── Shared types (source of truth for FlowEditor) ────────────────────────── */

export type EditsTab = "design-class" | "assertion" | "action-hook";
export type DesignOperation =
  | "set"
  | "append"
  | "prepend"
  | "remove"
  | "pop"
  | "merge"
  | "increment"
  | "decrement"
  | "toggle"
  | "delete"
  | "clear";
export type DesignMode = "edit" | "function";
export type DesignValueType = "literal" | "element" | "variable";
export type AssertionTargetType = "element" | "variable" | "function";

/* ─── Shared constants (source of truth for FlowEditor) ────────────────────── */

export const ASSERTION_OPERATORS = [
  "visibility",
  "text",
  "text-exact",
  "text-matches",
  "attribute",
  "value",
  "count",
  "enabled",
  "disabled",
  "checked",
  "unchecked",
  "editable",
  "focused",
  "exists",
] as const;

export const HOOK_COMMANDS = [
  "wait",
  "refresh",
  "reload",
  "go-back",
  "go-forward",
  "wait-for-url",
  "wait-for-load-state",
  "click",
  "dblclick",
  "fill",
  "clear",
  "hover",
  "select",
  "check",
  "uncheck",
  "press",
  "focus",
  "blur",
] as const;

export const ELEMENT_HOOK_COMMANDS = new Set([
  "click",
  "dblclick",
  "fill",
  "clear",
  "hover",
  "select",
  "check",
  "uncheck",
  "press",
  "focus",
  "blur",
]);

export const DESIGN_CLASS_OPERATION_TYPES = [
  "set",
  "append",
  "prepend",
  "remove",
  "pop",
  "merge",
  "increment",
  "decrement",
  "toggle",
  "delete",
  "clear",
] as const;

export const COMMANDS_WITH_ARGUMENT = new Set([
  "wait",
  "wait-for-url",
  "wait-for-load-state",
  "fill",
  "select",
  "press",
]);

/* ─── Internal constants ──────────────────────────────────────────────────── */

const EDIT_TABS: Array<{ value: EditsTab; label: string; Icon: LucideIcon }> = [
  { value: "design-class", label: "Design Class", Icon: Hexagon },
  { value: "assertion", label: "Assertions", Icon: Equal },
  { value: "action-hook", label: "Action Hooks", Icon: Zap },
];

const TARGET_TYPE_OPTIONS = [
  { value: "element", label: "Element" },
  { value: "variable", label: "Variable" },
  { value: "function", label: "Function" },
];

const DESIGN_MODE_OPTIONS = [
  { value: "edit", label: "Edit" },
  { value: "function", label: "Function" },
];

const DESIGN_VALUE_TYPE_OPTIONS = [
  { value: "literal", label: "Literal" },
  { value: "element", label: "Element" },
  { value: "variable", label: "Variable" },
];

const ELEMENT_ATTRIBUTE_PRESETS = ["text", "value", "href", "src", "class", "id", "innerHTML"];

// Operations that mutate a value that must already exist.
// append/prepend/merge/increment/decrement/toggle all initialise gracefully on first use.
const OPERATIONS_REQUIRING_EXISTING = new Set<DesignOperation>(["remove", "pop", "delete", "clear"]);

// Operations that consume a value argument.
const OPERATIONS_WITHOUT_VALUE = new Set<DesignOperation>(["delete", "clear", "toggle", "pop"]);

/* ─── Shared helpers (source of truth for FlowEditor) ─────────────────────── */

function makeId() {
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

export function elementSelector(element: FlowEditorElementRef | null, fallback: string) {
  return element?.selector || fallback.trim();
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

/* ─── Step label token renderer (shared with FlowEditor) ──────────────────── */

export type LabelToken =
  | { kind: "op"; text: string }
  | { kind: "var"; text: string; flagged?: boolean }
  | { kind: "lit"; text: string }
  | { kind: "sel"; text: string }
  | { kind: "txt"; text: string }
  | { kind: "brace"; text: string };

/**
 * Renders an array of label tokens with syntax highlighting.
 * Used by both FlowBlock (in the flow list) and the edits form preview.
 */
export function renderLabelTokens(tokens: LabelToken[], className?: string) {
  return (
    <span className={cn(styles.labelTokens, className)}>
      {tokens.map((token, i) => {
        const key = `${i}-${token.kind}`;
        switch (token.kind) {
          case "op":
            return (
              <span key={key} className={styles.labelToken_op}>
                {token.text}
              </span>
            );
          case "var":
            return (
              <span
                key={key}
                className={cn(styles.labelToken, token.flagged ? styles.labelToken_varFlagged : styles.labelToken_var)}
              >
                {token.text}
              </span>
            );
          case "lit":
            return (
              <span key={key} className={cn(styles.labelToken, styles.labelToken_lit)}>
                {token.text}
              </span>
            );
          case "sel":
            return (
              <span key={key} className={cn(styles.labelToken, styles.labelToken_sel)}>
                {token.text}
              </span>
            );
          case "brace":
            return (
              <span key={key} className={cn(styles.labelToken, styles.labelToken_brace)}>
                {token.text}
              </span>
            );
          default:
            return (
              <span key={key} className={styles.labelToken_txt}>
                {token.text}
              </span>
            );
        }
      })}
    </span>
  );
}

/**
 * Check if a variable name is "flagged" (not set in a prior design step).
 * The `priorKeys` set should contain all variable names established by
 * `set` / `append` / `prepend` / `merge` steps that appear BEFORE the
 * step being rendered in the flow order.
 */
export function isVariableFlagged(variableName: string, priorKeys: ReadonlySet<string>): boolean {
  const name = variableName.trim();
  if (!name) return false;
  return !priorKeys.has(name);
}

/**
 * Build syntax-highlighted label tokens for a draft step.
 * `priorKeys` is the set of variable names defined before this step.
 */
export function buildLabelTokens(step: FlowEditorDraftStep, priorKeys: ReadonlySet<string>): LabelToken[] {
  const def = step.definition as Record<string, unknown> | undefined;
  if (!def) return [{ kind: "txt", text: step.label }];

  const type = def.type as string | undefined;

  // Design class / design operation
  if (step.kind === "design-class" || step.kind === "design-operation") {
    if (type === "function") {
      const fnId = (def.functionId as string) || "function";
      return [
        { kind: "op", text: "Run" },
        { kind: "brace", text: " {{" },
        { kind: "var", text: fnId, flagged: false },
        { kind: "brace", text: "}} " },
      ];
    }

    const op = type || "set";
    const key = (def.key as string) || "value";
    const flagged = isVariableFlagged(key, priorKeys);
    const tokens: LabelToken[] = [
      { kind: "op", text: op },
      { kind: "brace", text: " {{" },
      { kind: "var", text: key, flagged },
      { kind: "brace", text: "}} " },
    ];

    const value = def.value as FlowEditorValueSpec | undefined;
    if (value) {
      if (value.literal !== undefined) {
        const litStr = String(value.literal);
        tokens.push({ kind: "op", text: "= " });
        tokens.push({ kind: "lit", text: litStr });
      } else if (value.source === "store") {
        const path = (value.path as string) || "variable";
        const pathFlagged = isVariableFlagged(path, priorKeys);
        tokens.push({ kind: "op", text: "← " });
        tokens.push({ kind: "brace", text: "{{" });
        tokens.push({ kind: "var", text: path, flagged: pathFlagged });
        tokens.push({ kind: "brace", text: "}}" });
      } else if (value.source === "element") {
        const selector = (value.selector as string) || "element";
        const token = (value.token as string) || selector;
        const attr = value.attribute as string;
        tokens.push({ kind: "op", text: "= " });
        tokens.push({ kind: "sel", text: token });
        if (attr) {
          tokens.push({ kind: "txt", text: "." });
          tokens.push({ kind: "sel", text: attr });
        }
      }
    }

    return tokens;
  }

  // Assertion
  if (step.kind === "assertion") {
    if (type === "function") {
      const fnId = (def.functionId as string) || "function";
      return [
        { kind: "op", text: "Run" },
        { kind: "brace", text: " {{" },
        { kind: "var", text: fnId, flagged: false },
        { kind: "brace", text: "}} " },
      ];
    }

    const assertion = (def.assertion as string) || "visibility";
    const target = def.target as FlowEditorValueSpec | undefined;
    const locator = def.locator as { cssSelector?: string } | undefined;
    const selector = locator?.cssSelector || step.element?.selector || "";

    const tokens: LabelToken[] = [{ kind: "op", text: "Assert" }];

    if (target?.source === "store") {
      const path = (target.path as string) || "variable";
      const pathFlagged = isVariableFlagged(path, priorKeys);
      tokens.push({ kind: "brace", text: " {{" });
      tokens.push({ kind: "var", text: path, flagged: pathFlagged });
      tokens.push({ kind: "brace", text: "}} " });
    } else if (selector) {
      tokens.push({ kind: "sel", text: selector });
    }

    tokens.push({ kind: "op", text: ` ${assertion}` });

    // Show expected value if present
    const expected = (def.expected ?? def.expectedText ?? def.expectedValue ?? def.expectedCount) as
      | FlowEditorValueSpec
      | undefined;
    if (expected) {
      if (expected.literal !== undefined) {
        tokens.push({ kind: "op", text: " → " });
        tokens.push({ kind: "lit", text: String(expected.literal) });
      } else if (expected.source === "store") {
        const path = (expected.path as string) || "variable";
        const pathFlagged = isVariableFlagged(path, priorKeys);
        tokens.push({ kind: "op", text: " → " });
        tokens.push({ kind: "brace", text: "{{" });
        tokens.push({ kind: "var", text: path, flagged: pathFlagged });
        tokens.push({ kind: "brace", text: "}}" });
      }
    }

    return tokens;
  }

  // Action hook
  if (step.kind === "action-hook") {
    const action = (def.action as string) || "wait";
    const locator = def.locator as { cssSelector?: string } | undefined;
    const selector = locator?.cssSelector || step.element?.selector || "";
    const value = def.value as FlowEditorValueSpec | undefined;

    const tokens: LabelToken[] = [{ kind: "op", text: action }];

    if (selector) {
      tokens.push({ kind: "txt", text: " " });
      tokens.push({ kind: "sel", text: selector });
    }

    if (value?.literal !== undefined) {
      tokens.push({ kind: "txt", text: " " });
      tokens.push({ kind: "lit", text: String(value.literal) });
    }

    // Utility commands with special values
    if (type === "utility") {
      if (def.durationMs && (def.durationMs as FlowEditorValueSpec).literal !== undefined) {
        tokens.push({ kind: "txt", text: " " });
        tokens.push({ kind: "lit", text: String((def.durationMs as FlowEditorValueSpec).literal) });
        tokens.push({ kind: "txt", text: "ms" });
      }
      if (def.loadState) {
        tokens.push({ kind: "txt", text: " " });
        tokens.push({ kind: "lit", text: String(def.loadState) });
      }
    }

    return tokens;
  }

  // Fallback
  return [{ kind: "txt", text: step.label }];
}

/* ─── Local helpers ────────────────────────────────────────────────────────── */

function literalValueSpec(value: string): FlowEditorValueSpec {
  return { literal: coerceLiteral(value) };
}

function textValueSpec(value: string): FlowEditorValueSpec {
  return { literal: value };
}

function elementValueSpec(option: ElementTokenOption, attribute?: string): FlowEditorValueSpec {
  return {
    source: "element",
    selector: option.selector,
    token: option.token,
    ...(attribute ? { attribute } : {}),
  };
}

function variableValueSpec(option: VariableTokenOption): FlowEditorValueSpec {
  return { source: "store", path: option.name };
}

function buildFunctionCode(name: string, body: string) {
  return `function ${safeFunctionIdentifier(name)} (designClass, html): Boolean {
${body.trimEnd()}
}`;
}

function buildDesignFunctionCode(name: string, body: string) {
  return `function ${safeFunctionIdentifier(name)} (store, html): void {
${body.trimEnd()}
}`;
}

function defaultHookArgument(command: string) {
  if (command === "wait") return "500";
  if (command === "wait-for-load-state") return "networkidle";
  return "";
}

function attachExpected(base: Record<string, unknown>, operator: string, expected: FlowEditorValueSpec) {
  const definition: Record<string, unknown> = { ...base, expected };
  if (["text", "text-exact", "text-matches"].includes(operator)) definition.expectedText = expected;
  if (["value", "attribute"].includes(operator)) definition.expectedValue = expected;
  if (operator === "count") definition.expectedCount = expected;
  if (operator === "visibility") definition.visible = true;
  return definition;
}

function optionForSelectedElement(elementOptions: ElementTokenOption[], selectedElement: FlowEditorElementRef | null) {
  const selector = selectedElement?.selector || selectedElement?.selectorCandidates?.find(Boolean);
  if (!selector) return null;
  return elementOptions.find((option) => option.selector === selector) ?? null;
}

function elementTokenLabel(option: ElementTokenOption, attribute: string) {
  const attr = attribute.trim();
  return attr ? `${option.token}.${attr}` : option.token;
}

/**
 * Build label tokens for the current edits form state (preview in form).
 */
function buildEditsFormPreviewTokens(
  activeTab: EditsTab,
  designMode: DesignMode,
  designOperation: DesignOperation,
  designVariableName: string,
  designValueType: DesignValueType,
  designLiteralValue: string,
  designElementValue: ElementTokenOption | null,
  designElementAttribute: string,
  designVariableValue: VariableTokenOption | null,
  designFunctionName: string,
  assertionTargetType: AssertionTargetType,
  assertionTargetElement: ElementTokenOption | null,
  assertionTargetVariable: VariableTokenOption | null,
  assertionOperator: string,
  assertionValueType: DesignValueType,
  assertionLiteralValue: string,
  assertionElementValue: ElementTokenOption | null,
  assertionVariableValue: VariableTokenOption | null,
  functionName: string,
  hookCommand: string,
  hookArgument: string,
  actionSelector: ElementTokenOption | null,
  designClassOptions: VariableTokenOption[],
): LabelToken[] {
  if (activeTab === "design-class") {
    if (designMode === "function") {
      return [
        { kind: "op", text: "Run" },
        { kind: "brace", text: " {{" },
        { kind: "var", text: safeFunctionIdentifier(designFunctionName) || "function", flagged: false },
        { kind: "brace", text: "}} " },
      ];
    }
    const key = designVariableName || "value";
    const priorKeys = new Set(designClassOptions.map((o) => o.name));
    const flagged = isVariableFlagged(key, priorKeys);
    const tokens: LabelToken[] = [
      { kind: "op", text: designOperation },
      { kind: "brace", text: " {{" },
      { kind: "var", text: key, flagged },
      { kind: "brace", text: "}} " },
    ];
    if (designValueType === "element" && designElementValue) {
      const attr = designElementAttribute.trim();
      tokens.push({ kind: "op", text: "= " });
      tokens.push({ kind: "sel", text: elementTokenLabel(designElementValue, attr) });
    } else if (designValueType === "variable" && designVariableValue) {
      const path = designVariableValue.name;
      const pathFlagged = isVariableFlagged(path, priorKeys);
      tokens.push({ kind: "op", text: "← " });
      tokens.push({ kind: "brace", text: "{{" });
      tokens.push({ kind: "var", text: path, flagged: pathFlagged });
      tokens.push({ kind: "brace", text: "}}" });
    } else if (designLiteralValue) {
      tokens.push({ kind: "op", text: "= " });
      tokens.push({ kind: "lit", text: designLiteralValue });
    }
    return tokens;
  }

  if (activeTab === "action-hook") {
    const tokens: LabelToken[] = [{ kind: "op", text: hookCommand }];
    if (actionSelector) {
      tokens.push({ kind: "txt", text: " " });
      tokens.push({ kind: "sel", text: actionSelector.token });
    }
    if (hookArgument) {
      tokens.push({ kind: "txt", text: " " });
      tokens.push({ kind: "lit", text: hookArgument });
    }
    return tokens;
  }

  // Assertion
  if (assertionTargetType === "function") {
    return [
      { kind: "op", text: "Run" },
      { kind: "brace", text: " {{" },
      { kind: "var", text: safeFunctionIdentifier(functionName) || "function", flagged: false },
      { kind: "brace", text: "}} " },
    ];
  }

  const priorKeys = new Set(designClassOptions.map((o) => o.name));
  const tokens: LabelToken[] = [{ kind: "op", text: "Assert" }];

  if (assertionTargetType === "variable" && assertionTargetVariable) {
    const path = assertionTargetVariable.name;
    const pathFlagged = isVariableFlagged(path, priorKeys);
    tokens.push({ kind: "brace", text: " {{" });
    tokens.push({ kind: "var", text: path, flagged: pathFlagged });
    tokens.push({ kind: "brace", text: "}} " });
  } else if (assertionTargetElement) {
    tokens.push({ kind: "sel", text: assertionTargetElement.token });
  }

  tokens.push({ kind: "op", text: ` ${assertionOperator}` });

  if (assertionOperator !== "visibility") {
    if (assertionValueType === "element" && assertionElementValue) {
      tokens.push({ kind: "op", text: " → " });
      tokens.push({ kind: "sel", text: assertionElementValue.token });
    } else if (assertionValueType === "variable" && assertionVariableValue) {
      const path = assertionVariableValue.name;
      const pathFlagged = isVariableFlagged(path, priorKeys);
      tokens.push({ kind: "op", text: " → " });
      tokens.push({ kind: "brace", text: "{{" });
      tokens.push({ kind: "var", text: path, flagged: pathFlagged });
      tokens.push({ kind: "brace", text: "}}" });
    } else if (assertionLiteralValue) {
      tokens.push({ kind: "op", text: " → " });
      tokens.push({ kind: "lit", text: assertionLiteralValue });
    }
  }

  return tokens;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

type FlowEditorEditsFormProps = {
  position: FlowEditorDraftStep["position"] | null;
  transitionSteps: FlowEditorTransitionStep[];
  selectedElement: FlowEditorElementRef | null;
  positionLoading: boolean;
  elementOptions: ElementTokenOption[];
  designClassOptions: VariableTokenOption[];
  designOperationTypes: readonly DesignOperation[];
  assertionOperators: readonly string[];
  hookCommands: readonly string[];
  elementHookCommands: ReadonlySet<string>;
  onInsert: (step: FlowEditorDraftStep) => void;
};

export function FlowEditorEditsForm({
  position,
  transitionSteps,
  selectedElement,
  positionLoading,
  elementOptions,
  designClassOptions,
  designOperationTypes,
  assertionOperators,
  hookCommands,
  elementHookCommands,
  onInsert,
}: FlowEditorEditsFormProps) {
  const [activeTab, setActiveTab] = useState<EditsTab>("design-class");

  const [designMode, setDesignMode] = useState<DesignMode>("edit");
  const [designVariableName, setDesignVariableName] = useState("SELECTED_VALUE");
  const [designOperation, setDesignOperation] = useState<DesignOperation>(designOperationTypes[0] ?? "set");
  const [designValueType, setDesignValueType] = useState<DesignValueType>("literal");
  const [designLiteralValue, setDesignLiteralValue] = useState("");
  const [designElementValue, setDesignElementValue] = useState<ElementTokenOption | null>(null);
  const [designElementAttribute, setDesignElementAttribute] = useState("");
  const [designVariableValue, setDesignVariableValue] = useState<VariableTokenOption | null>(null);
  const [designFunctionName, setDesignFunctionName] = useState("function_name");
  const [designFunctionBody, setDesignFunctionBody] = useState("  // Write your custom design class logic");

  const [assertionTargetType, setAssertionTargetType] = useState<AssertionTargetType>("element");
  const [assertionTargetElement, setAssertionTargetElement] = useState<ElementTokenOption | null>(null);
  const [assertionTargetVariable, setAssertionTargetVariable] = useState<VariableTokenOption | null>(null);
  const [assertionOperator, setAssertionOperator] = useState(assertionOperators[0] ?? "visibility");
  const [assertionValueType, setAssertionValueType] = useState<DesignValueType>("literal");
  const [assertionLiteralValue, setAssertionLiteralValue] = useState("");
  const [assertionElementValue, setAssertionElementValue] = useState<ElementTokenOption | null>(null);
  const [assertionVariableValue, setAssertionVariableValue] = useState<VariableTokenOption | null>(null);
  const [functionName, setFunctionName] = useState("function_name");
  const [functionBody, setFunctionBody] = useState("  // Write your custom assertions");

  const [actionSelector, setActionSelector] = useState<ElementTokenOption | null>(null);
  const [hookCommand, setHookCommand] = useState(hookCommands[0] ?? "wait");
  const [hookArgument, setHookArgument] = useState(defaultHookArgument(hookCommands[0] ?? "wait"));

  const assertionSpanRef = useRef<HTMLSpanElement>(null);
  const [assertionFnWidth, setAssertionFnWidth] = useState(75);

  const designFnSpanRef = useRef<HTMLSpanElement>(null);
  const [designFnWidth, setDesignFnWidth] = useState(75);

  useLayoutEffect(() => {
    if (assertionSpanRef.current) {
      setAssertionFnWidth(assertionSpanRef.current.offsetWidth + 2);
    }
  }, [functionName]);

  useLayoutEffect(() => {
    if (designFnSpanRef.current) {
      setDesignFnWidth(designFnSpanRef.current.offsetWidth + 2);
    }
  }, [designFunctionName]);

  const assertionOperatorOptions = useMemo(
    () => assertionOperators.map((operator) => ({ value: operator, label: formatLabel(operator) })),
    [assertionOperators],
  );
  const hookCommandOptions = useMemo(
    () => hookCommands.map((command) => ({ value: command, label: formatLabel(command) })),
    [hookCommands],
  );
  const designOperationOptions = useMemo(
    () => designOperationTypes.map((operation) => ({ value: operation, label: formatLabel(operation) })),
    [designOperationTypes],
  );
  const selectedElementOption = useMemo(
    () => optionForSelectedElement(elementOptions, selectedElement),
    [elementOptions, selectedElement],
  );

  useEffect(() => {
    if (!selectedElementOption) return;
    setAssertionTargetElement((current) => current ?? selectedElementOption);
    setActionSelector((current) => current ?? selectedElementOption);
  }, [selectedElementOption]);

  useEffect(() => {
    setHookArgument(defaultHookArgument(hookCommand));
  }, [hookCommand]);

  // Reset attribute when element changes.
  useEffect(() => {
    setDesignElementAttribute("");
  }, [designElementValue]);

  const designNeedsValue = !OPERATIONS_WITHOUT_VALUE.has(designOperation);
  const hookNeedsArgument = COMMANDS_WITH_ARGUMENT.has(hookCommand);

  const designVarExistenceWarning = useMemo(() => {
    if (designMode === "function") return null;
    const name = designVariableName.trim();
    if (!name) return null;
    if (!OPERATIONS_REQUIRING_EXISTING.has(designOperation)) return null;
    const exists = designClassOptions.some((opt) => opt.name === name);
    if (exists) return null;
    return `"${name}" hasn't been defined in a prior step. Add a set step before this one to create it.`;
  }, [designMode, designVariableName, designOperation, designClassOptions]);

  /* ── Label preview for the edits form ─────────────────────────────────── */

  const previewTokens = useMemo(
    () =>
      buildEditsFormPreviewTokens(
        activeTab,
        designMode,
        designOperation,
        designVariableName,
        designValueType,
        designLiteralValue,
        designElementValue,
        designElementAttribute,
        designVariableValue,
        designFunctionName,
        assertionTargetType,
        assertionTargetElement,
        assertionTargetVariable,
        assertionOperator,
        assertionValueType,
        assertionLiteralValue,
        assertionElementValue,
        assertionVariableValue,
        functionName,
        hookCommand,
        hookArgument,
        actionSelector,
        designClassOptions,
      ),
    [
      activeTab,
      assertionElementValue,
      assertionLiteralValue,
      assertionOperator,
      assertionTargetElement,
      assertionTargetType,
      assertionTargetVariable,
      assertionValueType,
      assertionVariableValue,
      designElementAttribute,
      designElementValue,
      designFunctionName,
      designMode,
      designLiteralValue,
      designOperation,
      designVariableName,
      designVariableValue,
      designValueType,
      functionName,
      hookArgument,
      hookCommand,
      actionSelector,
      designClassOptions,
    ],
  );

  /* ── Definition builders ──────────────────────────────────────────────── */

  const buildDesignDefinition = () => {
    if (designMode === "function") {
      return {
        type: "function",
        functionId: safeFunctionIdentifier(designFunctionName),
        code: {
          language: "typescript",
          body: buildDesignFunctionCode(designFunctionName, designFunctionBody),
        },
      };
    }

    const key = designVariableName.trim() || "SELECTED_VALUE";

    if (!designNeedsValue) {
      return { type: designOperation, key };
    }

    let value: FlowEditorValueSpec;

    if (designValueType === "element" && designElementValue) {
      value = elementValueSpec(designElementValue, designElementAttribute.trim() || undefined);
    } else if (designValueType === "variable" && designVariableValue) {
      value = variableValueSpec(designVariableValue);
    } else {
      value = literalValueSpec(designLiteralValue);
    }

    return { type: designOperation, key, value };
  };

  const buildAssertionDefinition = () => {
    if (assertionTargetType === "function") {
      return {
        type: "function",
        functionId: safeFunctionIdentifier(functionName),
        code: {
          language: "typescript",
          body: buildFunctionCode(functionName, functionBody),
        },
      };
    }

    let expected: FlowEditorValueSpec;
    if (assertionValueType === "element" && assertionElementValue) {
      expected = elementValueSpec(assertionElementValue);
    } else if (assertionValueType === "variable" && assertionVariableValue) {
      expected = variableValueSpec(assertionVariableValue);
    } else {
      expected = textValueSpec(assertionLiteralValue);
    }

    if (assertionTargetType === "variable" && assertionTargetVariable) {
      return attachExpected(
        {
          type: "variable",
          assertion: assertionOperator,
          target: variableValueSpec(assertionTargetVariable),
        },
        assertionOperator,
        expected,
      );
    }

    const selector = assertionTargetElement?.selector ?? "";
    return attachExpected(
      {
        type: "element",
        assertion: assertionOperator,
        ...cssLocator(selector),
      },
      assertionOperator,
      expected,
    );
  };

  const buildActionHookDefinition = () => {
    if (!elementHookCommands.has(hookCommand)) {
      const utility: Record<string, unknown> = {
        type: "utility",
        action: hookCommand,
      };

      if (hookCommand === "wait") utility.durationMs = literalValueSpec(hookArgument);
      if (hookCommand === "wait-for-url") utility.url = literalValueSpec(hookArgument);
      if (hookCommand === "wait-for-load-state") utility.loadState = hookArgument.trim() || "networkidle";

      return utility;
    }

    return {
      type: "element-interaction",
      action: hookCommand,
      ...cssLocator(actionSelector?.selector ?? ""),
      value: hookNeedsArgument ? literalValueSpec(hookArgument) : undefined,
    };
  };

  const canInsert = useMemo(() => {
    if (!position) return false;

    if (activeTab === "design-class") {
      if (designMode === "function") {
        return Boolean(safeFunctionIdentifier(designFunctionName) && designFunctionBody.trim());
      }
      if (!designVariableName.trim()) return false;
      if (!designNeedsValue) return true;
      if (designValueType === "element") return Boolean(designElementValue);
      if (designValueType === "variable") return Boolean(designVariableValue);
      return true;
    }

    if (activeTab === "assertion") {
      if (assertionTargetType === "function")
        return Boolean(safeFunctionIdentifier(functionName) && functionBody.trim());
      if (assertionTargetType === "element" && !assertionTargetElement) return false;
      if (assertionTargetType === "variable" && !assertionTargetVariable) return false;
      if (assertionOperator !== "visibility") {
        if (assertionValueType === "element" && !assertionElementValue) return false;
        if (assertionValueType === "variable" && !assertionVariableValue) return false;
      }
      return true;
    }

    if (!hookCommand) return false;
    return !hookNeedsArgument || hookArgument.trim().length > 0;
  }, [
    activeTab,
    assertionElementValue,
    assertionTargetElement,
    assertionTargetType,
    assertionTargetVariable,
    assertionValueType,
    assertionVariableValue,
    designElementValue,
    designFunctionBody,
    designFunctionName,
    designMode,
    designNeedsValue,
    designValueType,
    designVariableName,
    designVariableValue,
    functionBody,
    functionName,
    hookArgument,
    hookCommand,
    hookNeedsArgument,
    position,
  ]);

  const stepLabel = () => {
    if (activeTab === "design-class") {
      if (designMode === "function") return `Run ${safeFunctionIdentifier(designFunctionName)}`;
      const key = designVariableName || "value";
      if (designValueType === "element" && designElementValue) {
        return `${designOperation} ${key} = ${elementTokenLabel(designElementValue, designElementAttribute)}`;
      }
      if (designValueType === "variable") {
        return `${designOperation} ${key} from ${designVariableValue?.token ?? "variable"}`;
      }
      return `${designOperation} ${key}`;
    }
    if (activeTab === "action-hook") return `${hookCommand} ${actionSelector?.token ?? "page"}`;
    if (assertionTargetType === "function") return `Run ${safeFunctionIdentifier(functionName)}`;
    const target = assertionTargetType === "variable" ? assertionTargetVariable?.token : assertionTargetElement?.token;
    return `Assert ${target ?? "target"} ${assertionOperator}`;
  };

  const primaryElement = () => {
    if (activeTab === "design-class" && designMode === "edit" && designValueType === "element") {
      return designElementValue?.element ?? null;
    }
    if (activeTab === "assertion" && assertionTargetType === "element") return assertionTargetElement?.element ?? null;
    if (activeTab === "action-hook") return actionSelector?.element ?? null;
    return selectedElement;
  };

  const buildDefinition = () => {
    if (activeTab === "design-class") return buildDesignDefinition();
    if (activeTab === "assertion") return buildAssertionDefinition();
    return buildActionHookDefinition();
  };

  const handleInsert = () => {
    if (!position || !canInsert) return;

    const now = new Date();
    const isoNow = now.toISOString();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const order = Math.floor((now.getTime() - startOfDay.getTime()) / 1000);

    onInsert({
      id: makeId(),
      kind: activeTab,
      position,
      order,
      label: stepLabel(),
      element: primaryElement() ?? undefined,
      definition: buildDefinition(),
      createdAt: isoNow,
      updatedAt: isoNow,
    });
  };

  return (
    <div className={styles.editor}>
      <header className={styles.editorHeader}>
        <div className={styles.editorHeading}>
          <span className={styles.editorEyebrow}>Insert Edit</span>
          <strong>{positionLabel(position, transitionSteps)}</strong>
          {positionLoading ? (
            <span className={styles.positionStatus}>
              <LoaderCircle className={styles.spinnerIcon} />
              Replaying position
            </span>
          ) : null}
        </div>
      </header>

      <section className={styles.editsTypeTabs} role="tablist" aria-label="Edit type">
        {EDIT_TABS.map(({ value, label, Icon }) => {
          const selected = activeTab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(styles.editsTypeTab, selected && styles.editsTypeTabActive)}
              onClick={() => setActiveTab(value)}
            >
              <Icon className={styles.editsTypeIcon} />
              {label}
            </button>
          );
        })}
      </section>

      {/* ── Label preview ──────────────────────────────────────────────────── */}
      <div className={styles.stepLabelPreview}>{renderLabelTokens(previewTokens)}</div>

      {activeTab === "design-class" ? (
        <section className={styles.editsFormSection}>
          <Field label="Mode">
            <Select
              options={DESIGN_MODE_OPTIONS}
              value={designMode}
              onChange={(value) => setDesignMode((value as DesignMode | null) ?? "edit")}
            />
          </Field>

          {designMode === "function" ? (
            <>
              <div className={styles.functionSignature} aria-label="Function signature">
                <span className={styles.keyword}>function</span>

                <span className={styles.functionNameToken}>
                  <span>{"{{"}</span>

                  <span ref={designFnSpanRef} className={styles.hiddenMeasure}>
                    {designFunctionName || " "}
                  </span>

                  <input
                    type="text"
                    value={designFunctionName}
                    onChange={(e) => setDesignFunctionName(e.target.value)}
                    style={{ width: `${designFnWidth}px` }}
                    className={styles.functionInput}
                  />

                  <span>{"}}"}</span>
                </span>

                <span className={styles.punctuation}>(</span>
                <span className={styles.parameter}>store</span>
                <span className={styles.punctuation}>, </span>
                <span className={styles.parameter}>html</span>
                <span className={styles.punctuation}>): </span>
                <span className={styles.type}>void</span>
                <span className={styles.brace}>{" {"}</span>
              </div>

              <textarea
                className={styles.editsCodeEditor}
                value={designFunctionBody}
                onChange={(event) => setDesignFunctionBody(event.target.value)}
                spellCheck={false}
              />

              <code className={styles.brace}>{"}"}</code>
            </>
          ) : (
            <>
              <Field label="Variable name">
                <Input value={designVariableName} onChange={(event) => setDesignVariableName(event.target.value)} />
                {designVarExistenceWarning ? (
                  <span className={styles.fieldWarning}>
                    <AlertTriangle className={styles.fieldWarningIcon} />
                    {designVarExistenceWarning}
                  </span>
                ) : null}
              </Field>
              <Field label="Operation">
                <Select
                  options={designOperationOptions}
                  value={designOperation}
                  onChange={(value) => setDesignOperation((value as DesignOperation | null) ?? "set")}
                  placeholder="Select operation"
                />
              </Field>
              {designNeedsValue ? (
                <>
                  <Field label="Value type">
                    <Select
                      options={DESIGN_VALUE_TYPE_OPTIONS}
                      value={designValueType}
                      onChange={(value) => setDesignValueType((value as DesignValueType | null) ?? "literal")}
                    />
                  </Field>

                  {designValueType === "literal" ? (
                    <Field label="Value">
                      <Input
                        value={designLiteralValue}
                        onChange={(event) => setDesignLiteralValue(event.target.value)}
                      />
                    </Field>
                  ) : designValueType === "element" ? (
                    <>
                      <Field label="Element">
                        <TokenPickerInput
                          options={elementOptions}
                          value={designElementValue}
                          onChange={setDesignElementValue}
                          placeholder="Type element name"
                          emptyLabel="No elements available"
                        />
                      </Field>
                      {designElementValue ? (
                        <Field label="Attribute (optional)">
                          <Input
                            value={designElementAttribute}
                            onChange={(event) => setDesignElementAttribute(event.target.value)}
                            placeholder="e.g. text, value, href"
                          />
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                            {ELEMENT_ATTRIBUTE_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontFamily: "monospace",
                                  cursor: "pointer",
                                  border: "1px solid",
                                  borderColor:
                                    designElementAttribute === preset
                                      ? "var(--color-accent, #6366f1)"
                                      : "var(--color-border, #3f3f46)",
                                  background:
                                    designElementAttribute === preset
                                      ? "var(--color-accent-subtle, #312e81)"
                                      : "transparent",
                                  color:
                                    designElementAttribute === preset
                                      ? "var(--color-accent, #6366f1)"
                                      : "var(--color-text-muted, #a1a1aa)",
                                }}
                                onClick={() =>
                                  setDesignElementAttribute((current) => (current === preset ? "" : preset))
                                }
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                          <span
                            style={{
                              marginTop: "6px",
                              display: "block",
                              fontFamily: "monospace",
                              fontSize: "12px",
                              color: "var(--color-text-muted, #a1a1aa)",
                            }}
                          >
                            {elementTokenLabel(designElementValue, designElementAttribute)}
                          </span>
                        </Field>
                      ) : null}
                    </>
                  ) : (
                    <Field label="Variable">
                      <TokenPickerInput
                        options={designClassOptions}
                        value={designVariableValue}
                        onChange={setDesignVariableValue}
                        placeholder="Type design class name"
                        emptyLabel="No design classes available"
                      />
                    </Field>
                  )}
                </>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {activeTab === "assertion" ? (
        <section className={styles.editsFormSection}>
          <Field label="Target Type">
            <Select
              options={TARGET_TYPE_OPTIONS}
              value={assertionTargetType}
              onChange={(value) => setAssertionTargetType((value as AssertionTargetType | null) ?? "element")}
            />
          </Field>

          {assertionTargetType === "function" ? (
            <>
              <div className={styles.functionSignature} aria-label="Function signature">
                <span className={styles.keyword}>function</span>

                <span className={styles.functionNameToken}>
                  <span>{"{{"}</span>

                  <span ref={assertionSpanRef} className={styles.hiddenMeasure}>
                    {functionName || " "}
                  </span>

                  <input
                    type="text"
                    value={functionName}
                    onChange={(e) => setFunctionName(e.target.value)}
                    style={{ width: `${assertionFnWidth}px` }}
                    className={styles.functionInput}
                  />

                  <span>{"}}"}</span>
                </span>

                <span className={styles.punctuation}>(</span>
                <span className={styles.parameter}>designClass</span>
                <span className={styles.punctuation}>, </span>
                <span className={styles.parameter}>html</span>
                <span className={styles.punctuation}>): </span>

                <span className={styles.type}>Boolean</span>

                <span className={styles.brace}>{" {"}</span>
              </div>

              <textarea
                className={styles.editsCodeEditor}
                value={functionBody}
                onChange={(event) => setFunctionBody(event.target.value)}
                spellCheck={false}
              />

              <code className={styles.brace}>{"}"}</code>
            </>
          ) : (
            <>
              {assertionTargetType === "element" ? (
                <Field label="Target">
                  <TokenPickerInput
                    options={elementOptions}
                    value={assertionTargetElement}
                    onChange={setAssertionTargetElement}
                    placeholder="Type element name"
                    emptyLabel="No elements available"
                  />
                </Field>
              ) : (
                <Field label="Target">
                  <TokenPickerInput
                    options={designClassOptions}
                    value={assertionTargetVariable}
                    onChange={setAssertionTargetVariable}
                    placeholder="Type design class name"
                    emptyLabel="No design classes available"
                  />
                </Field>
              )}

              <Field label="Operation type">
                <Select
                  options={assertionOperatorOptions}
                  value={assertionOperator}
                  onChange={(value) => setAssertionOperator(value ?? "visibility")}
                />
              </Field>
              {assertionOperator !== "visibility" ? (
                <>
                  <Field label="Value type">
                    <Select
                      options={DESIGN_VALUE_TYPE_OPTIONS}
                      value={assertionValueType}
                      onChange={(value) => setAssertionValueType((value as DesignValueType | null) ?? "literal")}
                    />
                  </Field>
                  {assertionValueType === "element" ? (
                    <Field label="Value">
                      <TokenPickerInput
                        options={elementOptions}
                        value={assertionElementValue}
                        onChange={setAssertionElementValue}
                        placeholder="Type element name"
                        emptyLabel="No elements available"
                      />
                    </Field>
                  ) : assertionValueType === "variable" ? (
                    <Field label="Value">
                      <TokenPickerInput
                        options={designClassOptions}
                        value={assertionVariableValue}
                        onChange={setAssertionVariableValue}
                        placeholder="Type design class name"
                        emptyLabel="No design classes available"
                      />
                    </Field>
                  ) : (
                    <Field label="Value">
                      <Input
                        value={assertionLiteralValue}
                        onChange={(event) => setAssertionLiteralValue(event.target.value)}
                      />
                    </Field>
                  )}
                </>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {activeTab === "action-hook" ? (
        <section className={styles.editsFormSection}>
          <Field label="Selector">
            <TokenPickerInput
              options={elementOptions}
              value={actionSelector}
              onChange={setActionSelector}
              placeholder="Optional element"
              emptyLabel="No elements available"
            />
          </Field>
          <Field label="Command">
            <Select
              options={hookCommandOptions}
              value={hookCommand}
              onChange={(value) => setHookCommand(value ?? "wait")}
            />
          </Field>
          {hookNeedsArgument ? (
            <Field label="Arguments">
              <Input value={hookArgument} onChange={(event) => setHookArgument(event.target.value)} />
            </Field>
          ) : null}
        </section>
      ) : null}

      <div className={styles.editorActions}>
        <Button className={styles.primaryButton} onClick={handleInsert} disabled={!canInsert}>
          <Check className={styles.buttonIcon} />
          Insert Draft
        </Button>
      </div>
    </div>
  );
}
