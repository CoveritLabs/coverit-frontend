// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { FlowEditorDraftStep } from "@features/test-flows/model/types/test-flows.types";
import { cn } from "@shared/utils/cn";
import type { FlowEditorValueSpec } from "./flow-editor-edit-types";
import styles from "../../FlowEditor.module.scss";

export type LabelToken =
  | { kind: "op"; text: string }
  | { kind: "var"; text: string; flagged?: boolean }
  | { kind: "lit"; text: string }
  | { kind: "sel"; text: string }
  | { kind: "txt"; text: string }
  | { kind: "brace"; text: string };

export function renderLabelTokens(tokens: LabelToken[], className?: string) {
  return (
    <span className={cn(styles.labelTokens, className)}>
      {tokens.map((token, index) => {
        const key = `${index}-${token.kind}`;
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

export function isVariableFlagged(variableName: string, priorKeys: ReadonlySet<string>): boolean {
  const name = variableName.trim();
  if (!name) return false;
  return !priorKeys.has(name);
}

function hasLiteral(value: FlowEditorValueSpec): value is Extract<FlowEditorValueSpec, { literal: unknown }> {
  return "literal" in value;
}

function isStoreValue(value: FlowEditorValueSpec): value is { source: "store"; path: string } {
  return "source" in value && value.source === "store";
}

function isElementValue(value: FlowEditorValueSpec): value is Extract<FlowEditorValueSpec, { source: "element" }> {
  return "source" in value && value.source === "element";
}

export function buildLabelTokens(step: FlowEditorDraftStep, priorKeys: ReadonlySet<string>): LabelToken[] {
  const definition = step.definition as Record<string, unknown> | undefined;
  if (!definition) return [{ kind: "txt", text: step.label }];

  const type = definition.type as string | undefined;

  if (step.kind === "design-class" || step.kind === "design-operation") {
    if (type === "function") {
      const fnId = (definition.functionId as string) || "function";
      return [
        { kind: "op", text: "Run" },
        { kind: "brace", text: " {{" },
        { kind: "var", text: fnId, flagged: false },
        { kind: "brace", text: "}} " },
      ];
    }

    const op = type || "set";
    const key = (definition.key as string) || "value";
    const flagged = isVariableFlagged(key, priorKeys);
    const tokens: LabelToken[] = [
      { kind: "op", text: op },
      { kind: "brace", text: " {{" },
      { kind: "var", text: key, flagged },
      { kind: "brace", text: "}} " },
    ];

    const value = definition.value as FlowEditorValueSpec | undefined;
    if (value) {
      if (hasLiteral(value) && value.literal !== undefined) {
        tokens.push({ kind: "op", text: "= " }, { kind: "lit", text: String(value.literal) });
      } else if (isStoreValue(value)) {
        const path = (value.path as string) || "variable";
        tokens.push(
          { kind: "op", text: "<- " },
          { kind: "brace", text: "{{" },
          { kind: "var", text: path, flagged: isVariableFlagged(path, priorKeys) },
          { kind: "brace", text: "}}" },
        );
      } else if (isElementValue(value)) {
        const selector = (value.selector as string) || "element";
        const token = (value.token as string) || selector;
        const attr = value.attribute as string;
        tokens.push({ kind: "op", text: "= " }, { kind: "sel", text: token });
        if (attr) tokens.push({ kind: "txt", text: "." }, { kind: "sel", text: attr });
      }
    }

    return tokens;
  }

  if (step.kind === "assertion") {
    if (type === "function") {
      const fnId = (definition.functionId as string) || "function";
      return [
        { kind: "op", text: "Run" },
        { kind: "brace", text: " {{" },
        { kind: "var", text: fnId, flagged: false },
        { kind: "brace", text: "}} " },
      ];
    }

    const assertion = (definition.assertion as string) || "visibility";
    const target = definition.target as FlowEditorValueSpec | undefined;
    const locator = definition.locator as { cssSelector?: string } | undefined;
    const selector = locator?.cssSelector || step.element?.selector || "";
    const tokens: LabelToken[] = [{ kind: "op", text: "Assert" }];

    if (target && isStoreValue(target)) {
      const path = (target.path as string) || "variable";
      tokens.push(
        { kind: "brace", text: " {{" },
        { kind: "var", text: path, flagged: isVariableFlagged(path, priorKeys) },
        { kind: "brace", text: "}} " },
      );
    } else if (selector) {
      tokens.push({ kind: "sel", text: selector });
    }

    tokens.push({ kind: "op", text: ` ${assertion}` });

    const expected = (definition.expected ??
      definition.expectedText ??
      definition.expectedValue ??
      definition.expectedCount) as FlowEditorValueSpec | undefined;
    if (expected) {
      if (hasLiteral(expected) && expected.literal !== undefined) {
        tokens.push({ kind: "op", text: " -> " }, { kind: "lit", text: String(expected.literal) });
      } else if (isStoreValue(expected)) {
        const path = (expected.path as string) || "variable";
        tokens.push(
          { kind: "op", text: " -> " },
          { kind: "brace", text: "{{" },
          { kind: "var", text: path, flagged: isVariableFlagged(path, priorKeys) },
          { kind: "brace", text: "}}" },
        );
      }
    }

    return tokens;
  }

  if (step.kind === "action-hook") {
    const action = (definition.action as string) || "wait";
    const locator = definition.locator as { cssSelector?: string } | undefined;
    const selector = locator?.cssSelector || step.element?.selector || "";
    const value = definition.value as FlowEditorValueSpec | undefined;
    const tokens: LabelToken[] = [{ kind: "op", text: action }];

    if (selector) tokens.push({ kind: "txt", text: " " }, { kind: "sel", text: selector });
    if (value && hasLiteral(value) && value.literal !== undefined) {
      tokens.push({ kind: "txt", text: " " }, { kind: "lit", text: String(value.literal) });
    }

    if (type === "utility") {
      const duration = definition.durationMs as FlowEditorValueSpec | undefined;
      if (duration && hasLiteral(duration) && duration.literal !== undefined) {
        tokens.push(
          { kind: "txt", text: " " },
          { kind: "lit", text: String(duration.literal) },
          { kind: "txt", text: "ms" },
        );
      }
      if (definition.loadState) tokens.push({ kind: "txt", text: " " }, { kind: "lit", text: String(definition.loadState) });
    }

    return tokens;
  }

  return [{ kind: "txt", text: step.label }];
}
