// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

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
export type FlowEditorValueType = "string" | "number" | "integer" | "currency" | "boolean" | "date" | "json" | "array" | "object";
export type FlowEditorCodeLanguage = "typescript";

export type FlowEditorValueSpec =
  | { literal: unknown }
  | { from: string }
  | { source: "extract"; id: string }
  | { source: "element"; selector: string; token?: string; attribute?: string }
  | { source: "store" | "arg" | "context" | "env"; path: string }
  | { expressionId: string; args?: Record<string, FlowEditorValueSpec> }
  | { functionId: string; args?: Record<string, FlowEditorValueSpec> }
  | { code: FlowEditorInlineCodeBlock; args?: Record<string, FlowEditorValueSpec> }
  | { fields: Record<string, FlowEditorValueSpec> }
  | { list: FlowEditorValueSpec[] };

export interface FlowEditorInlineCodeBlock {
  language: FlowEditorCodeLanguage;
  body: string;
  imports?: string[];
  inputSchema?: unknown;
  outputSchema?: unknown;
}

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

export const ELEMENT_ATTRIBUTE_PRESETS = ["text", "value", "href", "src", "class", "id", "innerHTML"];

export const TARGET_TYPE_OPTIONS = [
  { value: "element", label: "Element" },
  { value: "variable", label: "Variable" },
  { value: "function", label: "Function" },
];

export const DESIGN_MODE_OPTIONS = [
  { value: "edit", label: "Edit" },
  { value: "function", label: "Function" },
];

export const DESIGN_VALUE_TYPE_OPTIONS = [
  { value: "literal", label: "Literal" },
  { value: "element", label: "Element" },
  { value: "variable", label: "Variable" },
];

export const OPERATIONS_REQUIRING_EXISTING = new Set<DesignOperation>(["remove", "pop", "delete", "clear"]);
export const OPERATIONS_WITHOUT_VALUE = new Set<DesignOperation>(["delete", "clear", "toggle", "pop"]);
