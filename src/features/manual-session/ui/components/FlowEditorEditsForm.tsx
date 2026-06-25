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
import { Check, Equal, Hexagon, LoaderCircle, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import styles from "../FlowEditor.module.scss";
import { TokenPickerInput } from "./TokenPickerInput";

type EditsTab = "design-class" | "assertion" | "action-hook";
type DesignOperation = "set" | "append" | "merge" | "delete" | "clear";
type DesignValueType = "literal" | "element";
type AssertionTargetType = "element" | "variable" | "function";

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

const DESIGN_VALUE_TYPE_OPTIONS = [
  { value: "literal", label: "Literal" },
  { value: "element", label: "Element (selector)" },
];

const COMMANDS_WITH_ARGUMENT = new Set(["wait", "wait-for-url", "wait-for-load-state", "fill", "select", "press"]);

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function positionLabel(position: FlowEditorDraftStep["position"] | null, steps: FlowEditorTransitionStep[]) {
  if (!position) return "No insertion point selected";
  const step = steps.find((item) => item.transitionId === position.transitionId);
  const index = step?.index ?? "?";
  return `${position.edge === "before" ? "Before" : "After"} transition ${index}`;
}

function coerceLiteral(value: string) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return value;
}

function literalValueSpec(value: string): FlowEditorValueSpec {
  return { literal: coerceLiteral(value) };
}

function textValueSpec(value: string): FlowEditorValueSpec {
  return { literal: value };
}

function elementValueSpec(option: ElementTokenOption): FlowEditorValueSpec {
  return { source: "element", selector: option.selector, token: option.token };
}

function variableValueSpec(option: VariableTokenOption): FlowEditorValueSpec {
  return { source: "store", path: option.name };
}

function cssLocator(selector: string) {
  return selector ? { locator: { cssSelector: selector } } : {};
}

function formatLabel(value: string) {
  if (value === "visibility") return "Visible";
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function safeFunctionIdentifier(value: string) {
  const compact = value.trim().replace(/[^A-Za-z0-9_$]/g, "");
  if (!compact) return "customAssertion";
  return /^[A-Za-z_$]/.test(compact) ? compact : `custom${compact}`;
}

function buildFunctionCode(name: string, body: string) {
  return `function ${safeFunctionIdentifier(name)} (designClass, html): Boolean {
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

  const [designVariableName, setDesignVariableName] = useState("SELECTED_VALUE");
  const [designOperation, setDesignOperation] = useState<DesignOperation>(designOperationTypes[0] ?? "set");
  const [designValueType, setDesignValueType] = useState<DesignValueType>("literal");
  const [designLiteralValue, setDesignLiteralValue] = useState("");
  const [designElementValue, setDesignElementValue] = useState<ElementTokenOption | null>(null);

  const [assertionTargetType, setAssertionTargetType] = useState<AssertionTargetType>("element");
  const [assertionTargetElement, setAssertionTargetElement] = useState<ElementTokenOption | null>(null);
  const [assertionTargetVariable, setAssertionTargetVariable] = useState<VariableTokenOption | null>(null);
  const [assertionOperator, setAssertionOperator] = useState(assertionOperators[0] ?? "visibility");
  const [assertionLiteralValue, setAssertionLiteralValue] = useState("");
  const [functionName, setFunctionName] = useState("function_name");
  const [functionBody, setFunctionBody] = useState("  // Write your custom assertions");

  const [actionSelector, setActionSelector] = useState<ElementTokenOption | null>(null);
  const [hookCommand, setHookCommand] = useState(hookCommands[0] ?? "wait");
  const [hookArgument, setHookArgument] = useState(defaultHookArgument(hookCommands[0] ?? "wait"));
  const spanRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(75);

  useLayoutEffect(() => {
    if (spanRef.current) {
      setWidth(spanRef.current.offsetWidth + 2);
    }
  }, [functionName]);

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

  const designNeedsValue = designOperation !== "delete" && designOperation !== "clear";
  const hookNeedsArgument = COMMANDS_WITH_ARGUMENT.has(hookCommand);

  const buildDesignDefinition = () => {
    const key = designVariableName.trim() || "SELECTED_VALUE";
    if (designOperation === "delete" || designOperation === "clear") {
      return { type: designOperation, key };
    }

    return {
      type: designOperation,
      key,
      value:
        designValueType === "element" && designElementValue
          ? elementValueSpec(designElementValue)
          : literalValueSpec(designLiteralValue),
    };
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

    const expected = textValueSpec(assertionLiteralValue);
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
      if (!designVariableName.trim()) return false;
      if (!designNeedsValue) return true;
      return designValueType === "literal" || Boolean(designElementValue);
    }

    if (activeTab === "assertion") {
      if (assertionTargetType === "function")
        return Boolean(safeFunctionIdentifier(functionName) && functionBody.trim());
      if (assertionTargetType === "element" && !assertionTargetElement) return false;
      if (assertionTargetType === "variable" && !assertionTargetVariable) return false;
      return true;
    }

    if (!hookCommand) return false;
    return !hookNeedsArgument || hookArgument.trim().length > 0;
  }, [
    activeTab,
    assertionTargetElement,
    assertionTargetType,
    assertionTargetVariable,
    designElementValue,
    designNeedsValue,
    designValueType,
    designVariableName,
    functionBody,
    functionName,
    hookArgument,
    hookCommand,
    hookNeedsArgument,
    position,
  ]);

  const stepLabel = () => {
    if (activeTab === "design-class") return `${designOperation} ${designVariableName || "value"}`;
    if (activeTab === "action-hook") return `${hookCommand} ${actionSelector?.token ?? "page"}`;
    if (assertionTargetType === "function") return `Run ${safeFunctionIdentifier(functionName)}`;
    const target = assertionTargetType === "variable" ? assertionTargetVariable?.token : assertionTargetElement?.token;
    return `Assert ${target ?? "target"} ${assertionOperator}`;
  };

  const primaryElement = () => {
    if (activeTab === "design-class" && designValueType === "element") return designElementValue?.element ?? null;
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

      {activeTab === "design-class" ? (
        <section className={styles.editsFormSection}>
          <Field label="Variable name">
            <Input value={designVariableName} onChange={(event) => setDesignVariableName(event.target.value)} />
          </Field>
          <Field label="Operation type">
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
                  <Input value={designLiteralValue} onChange={(event) => setDesignLiteralValue(event.target.value)} />
                </Field>
              ) : (
                <Field label="Value">
                  <TokenPickerInput
                    options={elementOptions}
                    value={designElementValue}
                    onChange={setDesignElementValue}
                    placeholder="Type element name"
                    emptyLabel="No elements available"
                  />
                </Field>
              )}
            </>
          ) : null}
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

                  <span ref={spanRef} className={styles.hiddenMeasure}>
                    {functionName || " "}
                  </span>

                  <input
                    type="text"
                    value={functionName}
                    onChange={(e) => setFunctionName(e.target.value)}
                    style={{ width: `${width}px` }}
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
              <Field label="Value">
                <Input
                  value={assertionLiteralValue}
                  onChange={(event) => setAssertionLiteralValue(event.target.value)}
                />
              </Field>
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
