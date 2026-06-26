// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  ElementTokenOption,
  VariableTokenOption,
} from "@features/test-flows/lib/flow-editor-token-options";
import { Field, Input, Select } from "@shared/ui";
import { TokenPickerInput } from "./TokenPickerInput";
import { FunctionSignatureEditor } from "./FunctionSignatureEditor";
import {
  DESIGN_VALUE_TYPE_OPTIONS,
  TARGET_TYPE_OPTIONS,
  type AssertionTargetType,
  type DesignValueType,
} from "./flow-editor-edit-types";
import styles from "../../FlowEditor.module.scss";

type SelectOption = {
  value: string;
  label: string;
};

type AssertionEditPanelProps = {
  assertionTargetType: AssertionTargetType;
  assertionTargetElement: ElementTokenOption | null;
  assertionTargetVariable: VariableTokenOption | null;
  assertionOperator: string;
  assertionOperatorOptions: SelectOption[];
  assertionValueType: DesignValueType;
  assertionLiteralValue: string;
  assertionElementValue: ElementTokenOption | null;
  assertionVariableValue: VariableTokenOption | null;
  functionName: string;
  functionBody: string;
  elementOptions: ElementTokenOption[];
  designClassOptions: VariableTokenOption[];
  onAssertionTargetTypeChange: (value: AssertionTargetType) => void;
  onAssertionTargetElementChange: (value: ElementTokenOption | null) => void;
  onAssertionTargetVariableChange: (value: VariableTokenOption | null) => void;
  onAssertionOperatorChange: (value: string) => void;
  onAssertionValueTypeChange: (value: DesignValueType) => void;
  onAssertionLiteralValueChange: (value: string) => void;
  onAssertionElementValueChange: (value: ElementTokenOption | null) => void;
  onAssertionVariableValueChange: (value: VariableTokenOption | null) => void;
  onFunctionNameChange: (value: string) => void;
  onFunctionBodyChange: (value: string) => void;
};

export function AssertionEditPanel({
  assertionTargetType,
  assertionTargetElement,
  assertionTargetVariable,
  assertionOperator,
  assertionOperatorOptions,
  assertionValueType,
  assertionLiteralValue,
  assertionElementValue,
  assertionVariableValue,
  functionName,
  functionBody,
  elementOptions,
  designClassOptions,
  onAssertionTargetTypeChange,
  onAssertionTargetElementChange,
  onAssertionTargetVariableChange,
  onAssertionOperatorChange,
  onAssertionValueTypeChange,
  onAssertionLiteralValueChange,
  onAssertionElementValueChange,
  onAssertionVariableValueChange,
  onFunctionNameChange,
  onFunctionBodyChange,
}: AssertionEditPanelProps) {
  return (
    <section className={styles.editsFormSection}>
      <Field label="Target Type">
        <Select
          options={TARGET_TYPE_OPTIONS}
          value={assertionTargetType}
          onChange={(value) => onAssertionTargetTypeChange((value as AssertionTargetType | null) ?? "element")}
        />
      </Field>

      {assertionTargetType === "function" ? (
        <FunctionSignatureEditor
          name={functionName}
          body={functionBody}
          functionKind="assertion"
          parameters={["store", "page", "extracts", "args"]}
          returnType="boolean | AssertionFunctionResult"
          availableStoreKeys={designClassOptions.map((option) => option.name)}
          onNameChange={onFunctionNameChange}
          onBodyChange={onFunctionBodyChange}
        />
      ) : (
        <>
          {assertionTargetType === "element" ? (
            <Field label="Target">
              <TokenPickerInput
                options={elementOptions}
                value={assertionTargetElement}
                onChange={onAssertionTargetElementChange}
                placeholder="Type element name"
                emptyLabel="No elements available"
              />
            </Field>
          ) : (
            <Field label="Target">
              <TokenPickerInput
                options={designClassOptions}
                value={assertionTargetVariable}
                onChange={onAssertionTargetVariableChange}
                placeholder="Type design class name"
                emptyLabel="No design classes available"
              />
            </Field>
          )}

          <Field label="Operation type">
            <Select
              options={assertionOperatorOptions}
              value={assertionOperator}
              onChange={(value) => onAssertionOperatorChange(value ?? "visibility")}
            />
          </Field>
          {assertionOperator !== "visibility" ? (
            <>
              <Field label="Value type">
                <Select
                  options={DESIGN_VALUE_TYPE_OPTIONS}
                  value={assertionValueType}
                  onChange={(value) => onAssertionValueTypeChange((value as DesignValueType | null) ?? "literal")}
                />
              </Field>
              {assertionValueType === "element" ? (
                <Field label="Value">
                  <TokenPickerInput
                    options={elementOptions}
                    value={assertionElementValue}
                    onChange={onAssertionElementValueChange}
                    placeholder="Type element name"
                    emptyLabel="No elements available"
                  />
                </Field>
              ) : assertionValueType === "variable" ? (
                <Field label="Value">
                  <TokenPickerInput
                    options={designClassOptions}
                    value={assertionVariableValue}
                    onChange={onAssertionVariableValueChange}
                    placeholder="Type design class name"
                    emptyLabel="No design classes available"
                  />
                </Field>
              ) : (
                <Field label="Value">
                  <Input
                    value={assertionLiteralValue}
                    onChange={(event) => onAssertionLiteralValueChange(event.target.value)}
                  />
                </Field>
              )}
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
