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
import { Button } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import { Check, Equal, Hexagon, LoaderCircle, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionHookEditPanel } from "./ActionHookEditPanel";
import { AssertionEditPanel } from "./AssertionEditPanel";
import { DesignClassEditPanel } from "./DesignClassEditPanel";
import {
  COMMANDS_WITH_ARGUMENT,
  OPERATIONS_REQUIRING_EXISTING,
  OPERATIONS_WITHOUT_VALUE,
  type AssertionTargetType,
  type DesignMode,
  type DesignOperation,
  type DesignValueType,
  type EditsTab,
  type FlowEditorValueSpec,
} from "./flow-editor-edit-types";
import {
  attachExpected,
  buildDesignFunctionCode,
  buildFunctionCode,
  cssLocator,
  defaultHookArgument,
  elementTokenLabel,
  elementValueSpec,
  formatLabel,
  literalValueSpec,
  makeId,
  optionForSelectedElement,
  positionLabel,
  safeFunctionIdentifier,
  textValueSpec,
  variableValueSpec,
} from "./flow-editor-form-utils";
import { renderLabelTokens } from "./flow-editor-labels";
import { buildEditsFormPreviewTokens } from "./flow-editor-preview-tokens";
import styles from "../../FlowEditor.module.scss";

const EDIT_TABS: Array<{ value: EditsTab; label: string; Icon: LucideIcon }> = [
  { value: "design-class", label: "Design Class", Icon: Hexagon },
  { value: "assertion", label: "Assertions", Icon: Equal },
  { value: "action-hook", label: "Action Hooks", Icon: Zap },
];

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
    const exists = designClassOptions.some((option) => option.name === name);
    if (exists) return null;
    return `"${name}" hasn't been defined in a prior step. Add a set step before this one to create it.`;
  }, [designMode, designVariableName, designOperation, designClassOptions]);

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
      actionSelector,
      assertionElementValue,
      assertionLiteralValue,
      assertionOperator,
      assertionTargetElement,
      assertionTargetType,
      assertionTargetVariable,
      assertionValueType,
      assertionVariableValue,
      designClassOptions,
      designElementAttribute,
      designElementValue,
      designFunctionName,
      designLiteralValue,
      designMode,
      designOperation,
      designValueType,
      designVariableName,
      designVariableValue,
      functionName,
      hookArgument,
      hookCommand,
    ],
  );

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
    if (!designNeedsValue) return { type: designOperation, key };

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
      if (designMode === "function") return Boolean(safeFunctionIdentifier(designFunctionName) && designFunctionBody.trim());
      if (!designVariableName.trim()) return false;
      if (!designNeedsValue) return true;
      if (designValueType === "element") return Boolean(designElementValue);
      if (designValueType === "variable") return Boolean(designVariableValue);
      return true;
    }

    if (activeTab === "assertion") {
      if (assertionTargetType === "function") return Boolean(safeFunctionIdentifier(functionName) && functionBody.trim());
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
    assertionOperator,
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

    onInsert({
      id: makeId(),
      kind: activeTab,
      position,
      order: Math.floor((now.getTime() - startOfDay.getTime()) / 1000),
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

      <div className={styles.stepLabelPreview}>{renderLabelTokens(previewTokens)}</div>

      {activeTab === "design-class" ? (
        <DesignClassEditPanel
          designMode={designMode}
          designVariableName={designVariableName}
          designOperation={designOperation}
          designOperationOptions={designOperationOptions}
          designValueType={designValueType}
          designLiteralValue={designLiteralValue}
          designElementValue={designElementValue}
          designElementAttribute={designElementAttribute}
          designVariableValue={designVariableValue}
          designFunctionName={designFunctionName}
          designFunctionBody={designFunctionBody}
          designNeedsValue={designNeedsValue}
          designVarExistenceWarning={designVarExistenceWarning}
          elementOptions={elementOptions}
          designClassOptions={designClassOptions}
          onDesignModeChange={setDesignMode}
          onDesignVariableNameChange={setDesignVariableName}
          onDesignOperationChange={setDesignOperation}
          onDesignValueTypeChange={setDesignValueType}
          onDesignLiteralValueChange={setDesignLiteralValue}
          onDesignElementValueChange={setDesignElementValue}
          onDesignElementAttributeChange={setDesignElementAttribute}
          onDesignVariableValueChange={setDesignVariableValue}
          onDesignFunctionNameChange={setDesignFunctionName}
          onDesignFunctionBodyChange={setDesignFunctionBody}
        />
      ) : null}

      {activeTab === "assertion" ? (
        <AssertionEditPanel
          assertionTargetType={assertionTargetType}
          assertionTargetElement={assertionTargetElement}
          assertionTargetVariable={assertionTargetVariable}
          assertionOperator={assertionOperator}
          assertionOperatorOptions={assertionOperatorOptions}
          assertionValueType={assertionValueType}
          assertionLiteralValue={assertionLiteralValue}
          assertionElementValue={assertionElementValue}
          assertionVariableValue={assertionVariableValue}
          functionName={functionName}
          functionBody={functionBody}
          elementOptions={elementOptions}
          designClassOptions={designClassOptions}
          onAssertionTargetTypeChange={setAssertionTargetType}
          onAssertionTargetElementChange={setAssertionTargetElement}
          onAssertionTargetVariableChange={setAssertionTargetVariable}
          onAssertionOperatorChange={setAssertionOperator}
          onAssertionValueTypeChange={setAssertionValueType}
          onAssertionLiteralValueChange={setAssertionLiteralValue}
          onAssertionElementValueChange={setAssertionElementValue}
          onAssertionVariableValueChange={setAssertionVariableValue}
          onFunctionNameChange={setFunctionName}
          onFunctionBodyChange={setFunctionBody}
        />
      ) : null}

      {activeTab === "action-hook" ? (
        <ActionHookEditPanel
          actionSelector={actionSelector}
          hookCommand={hookCommand}
          hookCommandOptions={hookCommandOptions}
          hookNeedsArgument={hookNeedsArgument}
          hookArgument={hookArgument}
          elementOptions={elementOptions}
          onActionSelectorChange={setActionSelector}
          onHookCommandChange={setHookCommand}
          onHookArgumentChange={setHookArgument}
        />
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
