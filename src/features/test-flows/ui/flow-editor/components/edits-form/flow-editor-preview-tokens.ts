// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  ElementTokenOption,
  VariableTokenOption,
} from "@features/test-flows/lib/flow-editor-token-options";
import type {
  AssertionTargetType,
  DesignMode,
  DesignOperation,
  DesignValueType,
  EditsTab,
} from "./flow-editor-edit-types";
import { elementTokenLabel, safeFunctionIdentifier } from "./flow-editor-form-utils";
import { isVariableFlagged, type LabelToken } from "./flow-editor-labels";

export function buildEditsFormPreviewTokens(
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
    const priorKeys = new Set(designClassOptions.map((option) => option.name));
    const tokens: LabelToken[] = [
      { kind: "op", text: designOperation },
      { kind: "brace", text: " {{" },
      { kind: "var", text: key, flagged: isVariableFlagged(key, priorKeys) },
      { kind: "brace", text: "}} " },
    ];

    if (designValueType === "element" && designElementValue) {
      tokens.push({ kind: "op", text: "= " }, { kind: "sel", text: elementTokenLabel(designElementValue, designElementAttribute.trim()) });
    } else if (designValueType === "variable" && designVariableValue) {
      const path = designVariableValue.name;
      tokens.push(
        { kind: "op", text: "<- " },
        { kind: "brace", text: "{{" },
        { kind: "var", text: path, flagged: isVariableFlagged(path, priorKeys) },
        { kind: "brace", text: "}}" },
      );
    } else if (designLiteralValue) {
      tokens.push({ kind: "op", text: "= " }, { kind: "lit", text: designLiteralValue });
    }

    return tokens;
  }

  if (activeTab === "action-hook") {
    const tokens: LabelToken[] = [{ kind: "op", text: hookCommand }];
    if (actionSelector) tokens.push({ kind: "txt", text: " " }, { kind: "sel", text: actionSelector.token });
    if (hookArgument) tokens.push({ kind: "txt", text: " " }, { kind: "lit", text: hookArgument });
    return tokens;
  }

  if (assertionTargetType === "function") {
    return [
      { kind: "op", text: "Run" },
      { kind: "brace", text: " {{" },
      { kind: "var", text: safeFunctionIdentifier(functionName) || "function", flagged: false },
      { kind: "brace", text: "}} " },
    ];
  }

  const priorKeys = new Set(designClassOptions.map((option) => option.name));
  const tokens: LabelToken[] = [{ kind: "op", text: "Assert" }];

  if (assertionTargetType === "variable" && assertionTargetVariable) {
    const path = assertionTargetVariable.name;
    tokens.push(
      { kind: "brace", text: " {{" },
      { kind: "var", text: path, flagged: isVariableFlagged(path, priorKeys) },
      { kind: "brace", text: "}} " },
    );
  } else if (assertionTargetElement) {
    tokens.push({ kind: "sel", text: assertionTargetElement.token });
  }

  tokens.push({ kind: "op", text: ` ${assertionOperator}` });

  if (assertionOperator !== "visibility") {
    if (assertionValueType === "element" && assertionElementValue) {
      tokens.push({ kind: "op", text: " -> " }, { kind: "sel", text: assertionElementValue.token });
    } else if (assertionValueType === "variable" && assertionVariableValue) {
      const path = assertionVariableValue.name;
      tokens.push(
        { kind: "op", text: " -> " },
        { kind: "brace", text: "{{" },
        { kind: "var", text: path, flagged: isVariableFlagged(path, priorKeys) },
        { kind: "brace", text: "}}" },
      );
    } else if (assertionLiteralValue) {
      tokens.push({ kind: "op", text: " -> " }, { kind: "lit", text: assertionLiteralValue });
    }
  }

  return tokens;
}
