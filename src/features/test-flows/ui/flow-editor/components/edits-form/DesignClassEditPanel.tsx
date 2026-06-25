// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  ElementTokenOption,
  VariableTokenOption,
} from "@features/test-flows/lib/flow-editor-token-options";
import { Field, Input, Select } from "@shared/ui";
import { AlertTriangle } from "lucide-react";
import { TokenPickerInput } from "./TokenPickerInput";
import { FunctionSignatureEditor } from "./FunctionSignatureEditor";
import {
  DESIGN_MODE_OPTIONS,
  DESIGN_VALUE_TYPE_OPTIONS,
  ELEMENT_ATTRIBUTE_PRESETS,
  type DesignMode,
  type DesignOperation,
  type DesignValueType,
} from "./flow-editor-edit-types";
import { elementTokenLabel } from "./flow-editor-form-utils";
import styles from "../../FlowEditor.module.scss";

type SelectOption = {
  value: string;
  label: string;
};

type DesignClassEditPanelProps = {
  designMode: DesignMode;
  designVariableName: string;
  designOperation: DesignOperation;
  designOperationOptions: SelectOption[];
  designValueType: DesignValueType;
  designLiteralValue: string;
  designElementValue: ElementTokenOption | null;
  designElementAttribute: string;
  designVariableValue: VariableTokenOption | null;
  designFunctionName: string;
  designFunctionBody: string;
  designNeedsValue: boolean;
  designVarExistenceWarning: string | null;
  elementOptions: ElementTokenOption[];
  designClassOptions: VariableTokenOption[];
  onDesignModeChange: (value: DesignMode) => void;
  onDesignVariableNameChange: (value: string) => void;
  onDesignOperationChange: (value: DesignOperation) => void;
  onDesignValueTypeChange: (value: DesignValueType) => void;
  onDesignLiteralValueChange: (value: string) => void;
  onDesignElementValueChange: (value: ElementTokenOption | null) => void;
  onDesignElementAttributeChange: (value: string | ((current: string) => string)) => void;
  onDesignVariableValueChange: (value: VariableTokenOption | null) => void;
  onDesignFunctionNameChange: (value: string) => void;
  onDesignFunctionBodyChange: (value: string) => void;
};

export function DesignClassEditPanel({
  designMode,
  designVariableName,
  designOperation,
  designOperationOptions,
  designValueType,
  designLiteralValue,
  designElementValue,
  designElementAttribute,
  designVariableValue,
  designFunctionName,
  designFunctionBody,
  designNeedsValue,
  designVarExistenceWarning,
  elementOptions,
  designClassOptions,
  onDesignModeChange,
  onDesignVariableNameChange,
  onDesignOperationChange,
  onDesignValueTypeChange,
  onDesignLiteralValueChange,
  onDesignElementValueChange,
  onDesignElementAttributeChange,
  onDesignVariableValueChange,
  onDesignFunctionNameChange,
  onDesignFunctionBodyChange,
}: DesignClassEditPanelProps) {
  return (
    <section className={styles.editsFormSection}>
      <Field label="Mode">
        <Select
          options={DESIGN_MODE_OPTIONS}
          value={designMode}
          onChange={(value) => onDesignModeChange((value as DesignMode | null) ?? "edit")}
        />
      </Field>

      {designMode === "function" ? (
        <FunctionSignatureEditor
          name={designFunctionName}
          body={designFunctionBody}
          parameters={["store", "html"]}
          returnType="void"
          onNameChange={onDesignFunctionNameChange}
          onBodyChange={onDesignFunctionBodyChange}
        />
      ) : (
        <>
          <Field label="Variable name">
            <Input value={designVariableName} onChange={(event) => onDesignVariableNameChange(event.target.value)} />
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
              onChange={(value) => onDesignOperationChange((value as DesignOperation | null) ?? "set")}
              placeholder="Select operation"
            />
          </Field>
          {designNeedsValue ? (
            <>
              <Field label="Value type">
                <Select
                  options={DESIGN_VALUE_TYPE_OPTIONS}
                  value={designValueType}
                  onChange={(value) => onDesignValueTypeChange((value as DesignValueType | null) ?? "literal")}
                />
              </Field>

              {designValueType === "literal" ? (
                <Field label="Value">
                  <Input value={designLiteralValue} onChange={(event) => onDesignLiteralValueChange(event.target.value)} />
                </Field>
              ) : designValueType === "element" ? (
                <>
                  <Field label="Element">
                    <TokenPickerInput
                      options={elementOptions}
                      value={designElementValue}
                      onChange={onDesignElementValueChange}
                      placeholder="Type element name"
                      emptyLabel="No elements available"
                    />
                  </Field>
                  {designElementValue ? (
                    <Field label="Attribute (optional)">
                      <Input
                        value={designElementAttribute}
                        onChange={(event) => onDesignElementAttributeChange(event.target.value)}
                        placeholder="e.g. text, value, href"
                      />
                      <div className={styles.attributePresetList}>
                        {ELEMENT_ATTRIBUTE_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            className={
                              designElementAttribute === preset
                                ? styles.attributePresetButtonActive
                                : styles.attributePresetButton
                            }
                            onClick={() =>
                              onDesignElementAttributeChange((current) => (current === preset ? "" : preset))
                            }
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <span className={styles.attributeTokenPreview}>
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
                    onChange={onDesignVariableValueChange}
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
  );
}
