// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { safeFunctionIdentifier } from "./flow-editor-form-utils";

export type FlowEditorFunctionKind = "design" | "assertion";

export type FunctionValidationSeverity = "error" | "warning";

export type FunctionValidationDiagnostic = {
  severity: FunctionValidationSeverity;
  message: string;
  line?: number;
  column?: number;
};

export type FunctionRuntimeHelper = {
  name: string;
  signature: string;
  description: string;
};

type TypeScriptModule = typeof import("typescript");

const COMMON_PAGE_HELPERS: FunctionRuntimeHelper[] = [
  { name: "locator", signature: "page.locator(selector)", description: "Find elements by CSS, text, role, or XPath locators." },
  { name: "getByText", signature: "page.getByText(text)", description: "Find visible content by text." },
  { name: "getByRole", signature: "page.getByRole(role, options)", description: "Find accessible elements by role." },
  { name: "waitForLoadState", signature: "page.waitForLoadState(state)", description: "Wait for load, domcontentloaded, or networkidle." },
  { name: "waitForURL", signature: "page.waitForURL(url)", description: "Wait until the page URL matches." },
  { name: "url", signature: "page.url()", description: "Read the current URL." },
  { name: "title", signature: "page.title()", description: "Read the page title." },
];

const LOCATOR_HELPERS: FunctionRuntimeHelper[] = [
  { name: "fill", signature: "page.locator(selector).fill(value)", description: "Fill an input-like element." },
  { name: "click", signature: "page.locator(selector).click()", description: "Click the first matching element." },
  { name: "textContent", signature: "page.locator(selector).textContent()", description: "Read element text." },
  { name: "inputValue", signature: "page.locator(selector).inputValue()", description: "Read input value." },
  { name: "getAttribute", signature: "page.locator(selector).getAttribute(name)", description: "Read an attribute." },
  { name: "isVisible", signature: "page.locator(selector).isVisible()", description: "Check visibility." },
  { name: "count", signature: "page.locator(selector).count()", description: "Count matches." },
];

const DESIGN_STORE_HELPERS: FunctionRuntimeHelper[] = [
  { name: "get", signature: "store.get(key)", description: "Read a value from the design store." },
  { name: "set", signature: "store.set(key, value)", description: "Write a value into the design store." },
  { name: "snapshot", signature: "store.snapshot()", description: "Read all current store values." },
];

const ASSERTION_STORE_HELPERS: FunctionRuntimeHelper[] = [
  { name: "get", signature: "store.get(key)", description: "Read a value from the design store." },
  { name: "snapshot", signature: "store.snapshot()", description: "Read all current store values." },
];

export const FUNCTION_RUNTIME_HELPERS: Record<FlowEditorFunctionKind, Record<string, FunctionRuntimeHelper[]>> = {
  design: {
    store: DESIGN_STORE_HELPERS,
    page: COMMON_PAGE_HELPERS,
    locator: LOCATOR_HELPERS,
    extracts: [
      { name: "property", signature: "extracts.extractId", description: "Read generated extraction values by key." },
    ],
    args: [{ name: "property", signature: "args?.name", description: "Read optional function arguments." }],
  },
  assertion: {
    store: ASSERTION_STORE_HELPERS,
    page: COMMON_PAGE_HELPERS,
    locator: LOCATOR_HELPERS,
    extracts: [
      { name: "property", signature: "extracts.extractId", description: "Read generated extraction values by key." },
    ],
    args: [{ name: "property", signature: "args?.name", description: "Read optional function arguments." }],
  },
};

const PAGE_METHODS = new Set(COMMON_PAGE_HELPERS.map((helper) => helper.name));
const LOCATOR_METHODS = new Set(LOCATOR_HELPERS.map((helper) => helper.name));
const DESIGN_STORE_METHODS = new Set(DESIGN_STORE_HELPERS.map((helper) => helper.name));
const ASSERTION_STORE_METHODS = new Set(ASSERTION_STORE_HELPERS.map((helper) => helper.name));

export async function validateFunctionCode(options: {
  kind: FlowEditorFunctionKind;
  name: string;
  body: string;
  storeKeys: string[];
}): Promise<FunctionValidationDiagnostic[]> {
  const diagnostics: FunctionValidationDiagnostic[] = [];
  const functionName = safeFunctionIdentifier(options.name);
  const storeKeySet = new Set(options.storeKeys);

  if (options.name.trim() && options.name.trim() !== functionName) {
    diagnostics.push({
      severity: "warning",
      message: `Function will be saved as "${functionName}" because TypeScript identifiers cannot include spaces or punctuation.`,
    });
  }

  const ts = await import("typescript");
  const source = buildValidationSource(options.kind, functionName, options.body);
  diagnostics.push(...typescriptDiagnostics(ts, source, options.kind));

  const sourceFile = ts.createSourceFile("flow-editor-function.ts", source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS);
  const functionDeclaration = sourceFile.statements.find(ts.isFunctionDeclaration);

  if (functionDeclaration) {
    if (options.kind === "assertion" && !hasReturnStatement(ts, functionDeclaration)) {
      diagnostics.push({
        severity: "warning",
        message: "Assertion functions should return true, false, or an object with a passed field.",
      });
    }

    walkFunctionBody(ts, functionDeclaration, (diagnostic) => diagnostics.push(diagnostic), options.kind, storeKeySet);
  }

  return diagnostics;
}

function buildValidationSource(kind: FlowEditorFunctionKind, name: string, body: string) {
  const returnType = kind === "assertion" ? "boolean | AssertionFunctionResult" : "unknown";
  return `${validationPrelude(kind)}
function ${name}(store: StoreLike, page: PageLike, extracts: Record<string, unknown>, args?: Record<string, unknown>): ${returnType} {
${body.trimEnd()}
}`;
}

function validationPrelude(kind: FlowEditorFunctionKind) {
  const setter = kind === "design" ? "\n  set(key: string, value: unknown): void;" : "";
  return `type AssertionFunctionResult = { passed: boolean; message?: string; severity?: "blocking" | "warning" | "info"; details?: unknown };
type LocatorLike = {
  click(): Promise<void>;
  dblclick(): Promise<void>;
  fill(value: string): Promise<void>;
  clear(): Promise<void>;
  hover(): Promise<void>;
  selectOption(value: string): Promise<void>;
  check(): Promise<void>;
  uncheck(): Promise<void>;
  press(key: string): Promise<void>;
  focus(): Promise<void>;
  blur(): Promise<void>;
  textContent(): Promise<string | null>;
  inputValue(): Promise<string>;
  getAttribute(name: string): Promise<string | null>;
  count(): Promise<number>;
  isVisible(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  isChecked(): Promise<boolean>;
  waitFor(options?: Record<string, unknown>): Promise<void>;
};
type PageLike = {
  locator(selector: string): LocatorLike;
  getByText(text: string | RegExp): LocatorLike;
  getByRole(role: string, options?: Record<string, unknown>): LocatorLike;
  getByLabel(text: string | RegExp): LocatorLike;
  getByPlaceholder(text: string | RegExp): LocatorLike;
  getByTestId(testId: string | RegExp): LocatorLike;
  getByTitle(text: string | RegExp): LocatorLike;
  waitForURL(url: string | RegExp): Promise<void>;
  waitForLoadState(state?: "load" | "domcontentloaded" | "networkidle"): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  reload(): Promise<unknown>;
  goBack(): Promise<unknown>;
  goForward(): Promise<unknown>;
  url(): string;
  title(): Promise<string>;
};
type StoreLike = {
  get(key: string): unknown;${setter}
  snapshot(): Record<string, unknown>;
};`;
}

function typescriptDiagnostics(
  ts: TypeScriptModule,
  source: string,
  kind: FlowEditorFunctionKind,
): FunctionValidationDiagnostic[] {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      strict: true,
    },
    reportDiagnostics: true,
  });

  return (result.diagnostics ?? []).map((diagnostic) => {
    const position = diagnostic.file && diagnostic.start !== undefined
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      : null;
    return {
      severity: "error",
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
      line: position ? Math.max(1, position.line - preludeLineCount(kind) + 1) : undefined,
      column: position ? position.character + 1 : undefined,
    };
  });
}

function hasReturnStatement(ts: TypeScriptModule, declaration: import("typescript").FunctionDeclaration) {
  let hasReturn = false;
  const visit = (node: import("typescript").Node) => {
    if (ts.isReturnStatement(node)) hasReturn = true;
    if (!hasReturn) ts.forEachChild(node, visit);
  };
  declaration.body?.forEachChild(visit);
  return hasReturn;
}

function walkFunctionBody(
  ts: TypeScriptModule,
  declaration: import("typescript").FunctionDeclaration,
  addDiagnostic: (diagnostic: FunctionValidationDiagnostic) => void,
  kind: FlowEditorFunctionKind,
  storeKeys: ReadonlySet<string>,
) {
  const body = declaration.body;
  if (!body) return;

  const visit = (node: import("typescript").Node) => {
    if (ts.isPropertyAccessExpression(node)) {
      validatePropertyAccess(ts, node, addDiagnostic, kind);
    }

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      validateStoreKeyCall(ts, node, addDiagnostic, kind, storeKeys);
    }

    ts.forEachChild(node, visit);
  };

  body.forEachChild(visit);
}

function validatePropertyAccess(
  ts: TypeScriptModule,
  node: import("typescript").PropertyAccessExpression,
  addDiagnostic: (diagnostic: FunctionValidationDiagnostic) => void,
  kind: FlowEditorFunctionKind,
) {
  const expression = node.expression;
  const method = node.name.text;

  if (ts.isIdentifier(expression) && expression.text === "store") {
    const allowedMethods = kind === "design" ? DESIGN_STORE_METHODS : ASSERTION_STORE_METHODS;
    if (!allowedMethods.has(method)) {
      addDiagnostic({
        severity: "error",
        message: `store.${method} is not available in ${kind} functions.`,
        ...nodeLocation(node, kind),
      });
    }
  }

  if (ts.isIdentifier(expression) && expression.text === "page" && !PAGE_METHODS.has(method)) {
    addDiagnostic({
      severity: "warning",
      message: `page.${method} is not in the common generated helper list. It may still work if Playwright Page supports it.`,
      ...nodeLocation(node, kind),
    });
  }

  if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression)) {
    const base = expression.expression;
    if (ts.isIdentifier(base.expression) && base.expression.text === "page" && !LOCATOR_METHODS.has(method)) {
      addDiagnostic({
        severity: "warning",
        message: `locator.${method} is not in the common generated helper list. It may still work if Playwright Locator supports it.`,
        ...nodeLocation(node, kind),
      });
    }
  }
}

function validateStoreKeyCall(
  ts: TypeScriptModule,
  node: import("typescript").CallExpression,
  addDiagnostic: (diagnostic: FunctionValidationDiagnostic) => void,
  kind: FlowEditorFunctionKind,
  storeKeys: ReadonlySet<string>,
) {
  const expression = node.expression;
  if (!ts.isPropertyAccessExpression(expression)) return;
  if (!ts.isIdentifier(expression.expression) || expression.expression.text !== "store") return;
  if (expression.name.text !== "get") return;

  const firstArg = node.arguments[0];
  if (!firstArg || !ts.isStringLiteral(firstArg)) {
    addDiagnostic({
      severity: "warning",
      message: "store.get keys that are not string literals cannot be checked against prior store values.",
      ...nodeLocation(node, kind),
    });
    return;
  }

  if (storeKeys.size > 0 && !storeKeys.has(firstArg.text)) {
    addDiagnostic({
      severity: "warning",
      message: `"${firstArg.text}" is not currently listed in prior design store values.`,
      ...nodeLocation(node, kind),
    });
  }
}

function nodeLocation(node: import("typescript").Node, kind: FlowEditorFunctionKind) {
  const sourceFile = node.getSourceFile();
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    line: Math.max(1, position.line - preludeLineCount(kind) + 1),
    column: position.character + 1,
  };
}

function preludeLineCount(kind: FlowEditorFunctionKind) {
  return validationPrelude(kind).split("\n").length;
}
