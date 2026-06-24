// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useUIStore } from "@app/store";
import {
  useConnectFlowEditor,
  useFlowEditor,
  useSaveFlowEditorSteps,
} from "@features/test-flows/model/queries/useTestFlows";
import type {
  FlowEditorDraftStep,
  FlowEditorElementRef,
  FlowEditorPositionEdge,
  FlowEditorStepKind,
  FlowEditorTransitionStep,
  FlowEditorValueSpec,
} from "@features/test-flows/model/types/test-flows.types";
import { env } from "@shared/config/env";
import { ROUTES } from "@shared/config/routes";
import { Button } from "@shared/ui";
import {
  AlertCircle,
  Braces,
  Check,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Equal,
  Hexagon,
  ListChecks,
  LoaderCircle,
  PencilLine,
  Plus,
  Save,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type { ComponentType, JSX, MouseEvent, WheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ManualSessionHeader } from "./components/ManualSessionHeader";
import styles from "./FlowEditor.module.scss";

type Tab = "flow" | "editor";

type EditorPosition = {
  edge: FlowEditorPositionEdge;
  transitionId: string;
};

type WsPayload = {
  type?: string;
  message?: string;
  dataUrl?: string;
  pageUrl?: string;
  title?: string;
  stateHash?: string;
  position?: EditorPosition | null;
  element?: FlowEditorElementRef | null;
  viewport?: {
    width?: number;
    height?: number;
  };
};

type FormValues = {
  variableName: string;
  selector: string;
  extractSource: string;
  assertionOperator: string;
  expectedValue: string;
  expectedValueMode: ValueInputMode;
  hookCommand: string;
  hookArgument: string;
  hookValueMode: ValueInputMode;
  operationType: DesignOperationInputType;
  valueInput: string;
  valueMode: ValueInputMode;
  sourcePath: string;
  functionId: string;
  expressionId: string;
  assignTo: string;
};

const DEFAULT_VIEWPORT = { width: 1365, height: 768 };
const EXTRACT_SOURCES = ["text", "innerText", "html", "attribute", "property", "value", "checked", "visible", "count", "list"];
const ASSERTION_OPERATORS = [
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
];
const HOOK_COMMANDS = [
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
];
const ELEMENT_HOOK_COMMANDS = new Set(["click", "dblclick", "fill", "clear", "hover", "select", "check", "uncheck", "press", "focus", "blur"]);
const DESIGN_OPERATION_TYPES = ["set", "append", "merge", "delete", "clear", "call-function", "extract"] as const;
const STEP_KINDS = ["design-operation", "assertion", "action-hook", "group"] as const;

type DesignOperationInputType = (typeof DESIGN_OPERATION_TYPES)[number];
type ValueInputMode = "literal" | "store" | "function" | "expression";

const DEFAULT_FORM_VALUES: FormValues = {
  variableName: "SELECTED_VALUE",
  selector: "",
  extractSource: "text",
  assertionOperator: "visibility",
  expectedValue: "",
  expectedValueMode: "literal",
  hookCommand: "wait",
  hookArgument: "500",
  hookValueMode: "literal",
  operationType: "set",
  valueInput: "",
  valueMode: "literal",
  sourcePath: "",
  functionId: "",
  expressionId: "",
  assignTo: "",
};

function buildWsUrl(editorSessionId: string, ticket: string) {
  const base = env.wsUrl?.replace(/\/$/, "");
  if (!base) return "";
  return `${base}/ws/flow-editors/${encodeURIComponent(editorSessionId)}?ticket=${encodeURIComponent(ticket)}`;
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function positionKey(position: EditorPosition) {
  return `${position.edge}:${position.transitionId}`;
}

function kindMeta(kind: FlowEditorStepKind): {
  label: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
} {
  if (kind === "design-class" || kind === "design-operation") {
    return { label: "Design", description: "Set variables or call design functions", Icon: Hexagon };
  }
  if (kind === "action-hook") {
    return { label: "Action-Hook", description: "Run a utility or element command", Icon: Zap };
  }
  if (kind === "group") {
    return { label: "Group", description: "Bundle variable or function steps", Icon: Braces };
  }
  return { label: "Assertion", description: "Validate an element or stored value", Icon: Equal };
}

function positionLabel(position: EditorPosition | null, steps: FlowEditorTransitionStep[]) {
  if (!position) return "No insertion point selected";
  const step = steps.find((item) => item.transitionId === position.transitionId);
  const index = step?.index ?? "?";
  return `${position.edge === "before" ? "Before" : "After"} transition ${index}`;
}

function compactId(value: string) {
  return value.length > 10 ? value.slice(0, 10) : value;
}

function labelingStatusLabel(status: FlowEditorTransitionStep["labelingStatus"]) {
  if (status === "COMPLETED") return "Labeled";
  if (status === "QUEUED") return "Queued";
  if (status === "PENDING") return "Pending";
  return "Missing";
}

function elementName(element: FlowEditorElementRef | null) {
  if (!element) return "No element selected";
  return element.accessibleName || element.text || element.selector || element.tag || "Selected element";
}

function elementSelector(element: FlowEditorElementRef | null, fallback: string) {
  return element?.selector || fallback.trim();
}

function cssLocator(selector: string) {
  return selector ? { cssSelector: selector } : undefined;
}

function coerceLiteral(value: string) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return value;
}

function valueSpec(mode: ValueInputMode, rawValue: string, values: FormValues): FlowEditorValueSpec {
  if (mode === "store") {
    return { source: "store", path: values.sourcePath.trim() || rawValue.trim() || values.variableName.trim() };
  }
  if (mode === "function") {
    return { functionId: values.functionId.trim() || rawValue.trim() || "userFunction" };
  }
  if (mode === "expression") {
    return { expressionId: values.expressionId.trim() || rawValue.trim() || "userExpression" };
  }
  return { literal: coerceLiteral(rawValue) };
}

function withLocator(selector: string) {
  const locator = cssLocator(selector);
  return locator ? { locator } : {};
}

function buildDefinition(kind: FlowEditorStepKind, values: FormValues, selectedElement: FlowEditorElementRef | null) {
  const selector = elementSelector(selectedElement, values.selector);
  if (kind === "design-class" || kind === "design-operation") {
    if (values.operationType === "extract") {
      return {
        type: "extract",
        storeKey: values.variableName.trim() || "SELECTED_VALUE",
        selector,
        source: values.extractSource,
      };
    }
    if (values.operationType === "call-function") {
      return {
        type: "call-function",
        functionId: values.functionId.trim() || "userFunction",
        assignTo: values.assignTo.trim() || values.variableName.trim() || undefined,
        args: values.valueInput.trim()
          ? { value: valueSpec(values.valueMode, values.valueInput, values) }
          : undefined,
      };
    }
    if (values.operationType === "delete" || values.operationType === "clear") {
      return {
        type: values.operationType,
        key: values.variableName.trim() || undefined,
      };
    }
    return {
      type: values.operationType,
      key: values.variableName.trim() || "SELECTED_VALUE",
      value: valueSpec(values.valueMode, values.valueInput, values),
    };
  }
  if (kind === "assertion") {
    if (!selector) {
      return {
        type: "expression",
        expressionId: values.expressionId.trim() || undefined,
        functionId: values.functionId.trim() || undefined,
        expected: valueSpec(values.expectedValueMode, values.expectedValue || "true", values),
      };
    }
    const expected = valueSpec(values.expectedValueMode, values.expectedValue, values);
    const base = {
      type: "element",
      assertion: values.assertionOperator,
      ...withLocator(selector),
    };
    if (["text", "text-exact", "text-matches"].includes(values.assertionOperator)) {
      return { ...base, expectedText: expected };
    }
    if (["value", "attribute"].includes(values.assertionOperator)) {
      return { ...base, expectedValue: expected };
    }
    if (values.assertionOperator === "count") {
      return { ...base, expectedCount: expected };
    }
    if (values.assertionOperator === "visibility") {
      return { ...base, visible: true };
    }
    return base;
  }
  if (kind === "group") {
    return {
      type: "group",
      operations: [
        {
          type: "set",
          key: values.variableName.trim() || "GROUP_VALUE",
          value: valueSpec(values.valueMode, values.valueInput, values),
        },
      ],
    };
  }
  if (!ELEMENT_HOOK_COMMANDS.has(values.hookCommand)) {
    const utility: Record<string, unknown> = {
      type: "utility",
      action: values.hookCommand,
    };
    if (values.hookCommand === "wait") {
      utility.durationMs = valueSpec(values.hookValueMode, values.hookArgument, values);
    } else if (values.hookCommand === "wait-for-url") {
      utility.url = valueSpec(values.hookValueMode, values.hookArgument, values);
    } else if (values.hookCommand === "wait-for-load-state") {
      utility.loadState = values.hookArgument.trim() || "networkidle";
    }
    return utility;
  }
  return {
    type: "element-interaction",
    action: values.hookCommand,
    ...withLocator(selector),
    value: values.hookArgument.trim() ? valueSpec(values.hookValueMode, values.hookArgument, values) : undefined,
  };
}

function buildDraftLabel(kind: FlowEditorStepKind, values: FormValues, selectedElement: FlowEditorElementRef | null) {
  const target = elementName(selectedElement);
  if (kind === "design-class" || kind === "design-operation") {
    if (values.operationType === "call-function") return `Call ${values.functionId || "function"}`;
    if (values.operationType === "extract") return `Extract ${values.variableName || "value"} from ${target}`;
    return `${values.operationType} ${values.variableName || "value"}`;
  }
  if (kind === "assertion") return `Assert ${target} ${values.assertionOperator}`;
  if (kind === "group") return `Group ${values.variableName || "values"}`;
  return `${values.hookCommand} ${target}`;
}

function elementBoxStyle(element: FlowEditorElementRef | null, viewport: { width: number; height: number }) {
  if (!element?.box || viewport.width <= 0 || viewport.height <= 0) return undefined;
  return {
    left: `${(element.box.x / viewport.width) * 100}%`,
    top: `${(element.box.y / viewport.height) * 100}%`,
    width: `${(element.box.width / viewport.width) * 100}%`,
    height: `${(element.box.height / viewport.height) * 100}%`,
  };
}

function isSameElement(left: FlowEditorElementRef | null, right: FlowEditorElementRef | null) {
  if (!left || !right) return false;
  if (left.selector && left.selector === right.selector) return true;
  if (!left.box || !right.box) return false;
  return (
    left.tag === right.tag &&
    left.box.x === right.box.x &&
    left.box.y === right.box.y &&
    left.box.width === right.box.width &&
    left.box.height === right.box.height
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function addString(set: Set<string>, value: unknown) {
  if (typeof value === "string" && value.trim()) set.add(value.trim());
}

function collectStoreKeysFromDefinition(definition: unknown, keys: Set<string>) {
  const record = asRecord(definition);
  addString(keys, record.storeKey);
  addString(keys, record.key);
  addString(keys, record.assignTo);
  const operations = Array.isArray(record.operations) ? record.operations : [];
  operations.forEach((operation) => collectStoreKeysFromDefinition(operation, keys));
}

function designSymbolsFromDrafts(draftSteps: FlowEditorDraftStep[]) {
  const storeKeys = new Set<string>();
  const functionIds = new Set<string>();
  const expressionIds = new Set<string>();

  draftSteps.forEach((step) => {
    const definition = asRecord(step.definition);
    collectStoreKeysFromDefinition(definition, storeKeys);
    addString(functionIds, definition.functionId);
    addString(expressionIds, definition.expressionId);
  });

  return {
    storeKeys: [...storeKeys].sort(),
    functionIds: [...functionIds].sort(),
    expressionIds: [...expressionIds].sort(),
  };
}

function formatBox(box: FlowEditorElementRef["box"]) {
  if (!box) return "Unavailable";
  return `${box.width} x ${box.height} at ${box.x}, ${box.y}`;
}

function formatViewport(viewport: FlowEditorElementRef["viewport"]) {
  if (!viewport) return "Unavailable";
  return `${viewport.width} x ${viewport.height}`;
}

function metadataText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Unavailable";
}

function MetadataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className={styles.metadataRow}>
      <span>{label}</span>
      <strong className={mono ? styles.metadataMono : undefined}>{metadataText(value)}</strong>
    </div>
  );
}

function ElementInfoDrawer({
  selectedElement,
  isOpen,
  onToggle,
}: {
  selectedElement: FlowEditorElementRef | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const selectorCandidates = selectedElement?.selectorCandidates?.filter(Boolean) ?? [];
  const attributes = Object.entries(selectedElement?.attributes ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return (
    <section className={`${styles.inspectorDrawer} ${isOpen ? styles.inspectorDrawerOpen : ""}`}>
      <button
        type="button"
        className={styles.inspectorDrawerToggle}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.inspectorDrawerTitle}>
          <Crosshair className={styles.inspectorDrawerIcon} />
          <span>Selected Element</span>
          <strong>{elementName(selectedElement)}</strong>
        </span>
        {isOpen ? <ChevronDown className={styles.drawerChevron} /> : <ChevronUp className={styles.drawerChevron} />}
      </button>

      {isOpen && (
        <div className={styles.inspectorDrawerBody}>
          <section className={styles.metadataGroup}>
            <h3>Selector</h3>
            <code className={styles.metadataPrimary}>{selectedElement?.selector ?? "Unavailable"}</code>
            {selectorCandidates.length > 0 && (
              <div className={styles.selectorCandidateList}>
                {selectorCandidates.map((selector) => (
                  <code key={selector}>{selector}</code>
                ))}
              </div>
            )}
          </section>

          <section className={styles.metadataGroup}>
            <h3>Identity</h3>
            <MetadataRow label="Tag" value={selectedElement?.tag ?? undefined} mono />
            <MetadataRow label="Name" value={selectedElement?.accessibleName} />
            <MetadataRow label="Text" value={selectedElement?.text} />
          </section>

          <section className={styles.metadataGroup}>
            <h3>Attributes</h3>
            {attributes.length > 0 ? (
              <div className={styles.attributeList}>
                {attributes.map(([name, value]) => (
                  <div key={name} className={styles.attributeRow}>
                    <code>{name}</code>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className={styles.metadataEmpty}>Unavailable</span>
            )}
          </section>

          <section className={styles.metadataGroup}>
            <h3>Page</h3>
            <MetadataRow label="URL" value={selectedElement?.pageUrl} mono />
            <MetadataRow label="State" value={selectedElement?.stateHash} mono />
          </section>

          <section className={styles.metadataGroup}>
            <h3>Geometry</h3>
            <MetadataRow label="Box" value={formatBox(selectedElement?.box)} mono />
            <MetadataRow label="Viewport" value={formatViewport(selectedElement?.viewport)} mono />
          </section>
        </div>
      )}
    </section>
  );
}

function FlowBlock({ step, onRemove }: { step: FlowEditorDraftStep; onRemove: (id: string) => void }) {
  const meta = kindMeta(step.kind);
  const accentClass = styles[`blockAccent_${step.kind}`] ?? "";
  return (
    <li className={`${styles.block} ${styles[`block_${step.kind}`]} ${accentClass}`}>
      <meta.Icon className={styles.blockIcon} />
      <div className={styles.blockBody}>
        <span className={styles.blockKind}>{meta.label}</span>
        <span className={styles.blockLabel}>{step.label}</span>
        <code className={styles.blockSelector}>{step.element?.selector ?? "No element needed"}</code>
      </div>
      <button
        type="button"
        className={styles.blockRemove}
        onClick={() => onRemove(step.id)}
        aria-label="Remove draft step"
      >
        <Trash2 className={styles.blockRemoveIcon} />
      </button>
    </li>
  );
}

function InjectorRow({
  label,
  active = false,
  replaying = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  replaying?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`${styles.injector} ${active ? styles.injectorActive : ""} ${
        replaying ? styles.injectorReplaying : ""
      }`}
    >
      <button type="button" className={styles.injectorButton} onClick={onClick} aria-label={label}>
        <Plus className={styles.injectorIcon} />
      </button>
      <span className={styles.injectorLine} />
    </div>
  );
}

function TransitionItem({
  step,
  activeEdge,
  replaying,
  onBefore,
  onAfter,
}: {
  step: FlowEditorTransitionStep;
  activeEdge: FlowEditorPositionEdge | null;
  replaying: boolean;
  onBefore: () => void;
  onAfter: () => void;
}) {
  const active = activeEdge !== null;
  const sourceLabel = step.fromState?.label;
  const targetLabel = step.toState?.label;
  const labelingStatus = step.labelingStatus ?? "MISSING";

  return (
    <li className={styles.transitionGroup}>
      <InjectorRow
        label={`Insert before transition ${step.index}`}
        active={activeEdge === "before"}
        replaying={activeEdge === "before" && replaying}
        onClick={onBefore}
      />
      <div className={`${styles.step} ${active ? styles.stepActive : ""} ${replaying ? styles.stepReplaying : ""}`}>
        <span className={styles.stepIndex}>{step.index}</span>
        <div className={styles.stepBody}>
          <strong>{step.label}</strong>
          <span className={styles.stepDetail}>{step.action || step.transitionId}</span>
          <span className={styles.stepUrl}>
            {sourceLabel && targetLabel ? `${sourceLabel} -> ${targetLabel}` : `transition #${compactId(step.transitionId)}`}
          </span>
        </div>
        <span className={`${styles.stepStatus} ${styles[`stepStatus_${labelingStatus.toLowerCase()}`]}`}>
          {labelingStatusLabel(labelingStatus)}
        </span>
      </div>
      <InjectorRow
        label={`Insert after transition ${step.index}`}
        active={activeEdge === "after"}
        replaying={activeEdge === "after" && replaying}
        onClick={onAfter}
      />
    </li>
  );
}

function EditorForm({
  position,
  transitionSteps,
  selectedElement,
  positionLoading,
  designSymbols,
  onInsert,
}: {
  position: EditorPosition | null;
  transitionSteps: FlowEditorTransitionStep[];
  selectedElement: FlowEditorElementRef | null;
  positionLoading: boolean;
  designSymbols: ReturnType<typeof designSymbolsFromDrafts>;
  onInsert: (step: FlowEditorDraftStep) => void;
}) {
  const [kind, setKind] = useState<FlowEditorStepKind>("assertion");
  const [values, setValues] = useState<FormValues>(DEFAULT_FORM_VALUES);

  useEffect(() => {
    if (!selectedElement?.selector) return;
    const selector = selectedElement.selector;
    setValues((current) => ({ ...current, selector }));
  }, [selectedElement]);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const renderValueInput = (
    label: string,
    modeKey: "valueMode" | "expectedValueMode" | "hookValueMode",
    valueKey: "valueInput" | "expectedValue" | "hookArgument",
  ) => (
    <>
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span>{label} Source</span>
          <select
            value={values[modeKey]}
            onChange={(event) => update(modeKey, event.target.value as ValueInputMode)}
          >
            <option value="literal">literal</option>
            <option value="store">store</option>
            <option value="function">function</option>
            <option value="expression">expression</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>{label}</span>
          <input
            value={values[valueKey]}
            onChange={(event) => update(valueKey, event.target.value)}
            placeholder={values[modeKey] === "store" ? "cart.total" : "value"}
          />
        </label>
      </div>
      {values[modeKey] === "store" && (
        <label className={styles.field}>
          <span>Store Path</span>
          <select
            value={values.sourcePath}
            onChange={(event) => update("sourcePath", event.target.value)}
          >
            <option value="">Use typed value</option>
            {designSymbols.storeKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
      )}
      {values[modeKey] === "function" && (
        <label className={styles.field}>
          <span>Function</span>
          <input
            value={values.functionId}
            onChange={(event) => update("functionId", event.target.value)}
            list="flow-editor-functions"
            placeholder="calculateTotal"
          />
        </label>
      )}
      {values[modeKey] === "expression" && (
        <label className={styles.field}>
          <span>Expression</span>
          <input
            value={values.expressionId}
            onChange={(event) => update("expressionId", event.target.value)}
            list="flow-editor-expressions"
            placeholder="cartHasTotal"
          />
        </label>
      )}
    </>
  );

  const handleInsert = () => {
    if (!position) return;
    const now = new Date().toISOString();
    onInsert({
      id: makeId(),
      kind,
      position,
      order: Date.now(),
      label: buildDraftLabel(kind, values, selectedElement),
      element: selectedElement ?? undefined,
      definition: buildDefinition(kind, values, selectedElement),
      createdAt: now,
      updatedAt: now,
    });
  };

  return (
    <div className={styles.editor}>
      <header className={styles.editorHeader}>
        <div className={styles.editorHeading}>
          <span className={styles.editorEyebrow}>Insert Step</span>
          <strong>{positionLabel(position, transitionSteps)}</strong>
          {positionLoading && (
            <span className={styles.positionStatus}>
              <LoaderCircle className={styles.spinnerIcon} />
              Replaying position
            </span>
          )}
        </div>
      </header>

      <datalist id="flow-editor-functions">
        {designSymbols.functionIds.map((id) => (
          <option key={id} value={id} />
        ))}
      </datalist>
      <datalist id="flow-editor-expressions">
        {designSymbols.expressionIds.map((id) => (
          <option key={id} value={id} />
        ))}
      </datalist>

      <section className={styles.editorSection}>
        <span className={styles.editorLabel}>Step Type</span>
        <div className={styles.typeGrid} role="radiogroup" aria-label="Step type">
          {STEP_KINDS.map((candidate) => {
            const meta = kindMeta(candidate);
            const selected = kind === candidate;
            return (
              <button
                key={candidate}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${styles.typeCard} ${selected ? styles.typeCardActive : ""}`}
                onClick={() => setKind(candidate)}
              >
                <span className={styles.typeCardIconWrap}>
                  <meta.Icon className={styles.typeCardIcon} />
                </span>
                <span className={styles.typeCardText}>
                  <span className={styles.typeCardLabel}>{meta.label}</span>
                  <span className={styles.typeCardDesc}>{meta.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.editorSection}>
        <label className={styles.field}>
          <span>Selector</span>
          <input
            value={values.selector}
            onChange={(event) => update("selector", event.target.value)}
            placeholder={kind === "design-operation" || kind === "group" ? "optional" : "[data-testid='submit']"}
          />
        </label>

        {(kind === "design-operation" || kind === "design-class") && (
          <>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>Operation</span>
                <select
                  value={values.operationType}
                  onChange={(event) => update("operationType", event.target.value as DesignOperationInputType)}
                >
                  {DESIGN_OPERATION_TYPES.map((operation) => (
                    <option key={operation} value={operation}>
                      {operation}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>{values.operationType === "call-function" ? "Assign To" : "Store Key"}</span>
                <input
                  value={values.operationType === "call-function" ? values.assignTo : values.variableName}
                  onChange={(event) =>
                    values.operationType === "call-function"
                      ? update("assignTo", event.target.value)
                      : update("variableName", event.target.value)
                  }
                  placeholder="cartTotal"
                />
              </label>
            </div>
            {values.operationType === "extract" && (
              <label className={styles.field}>
                <span>Extract</span>
                <select value={values.extractSource} onChange={(event) => update("extractSource", event.target.value)}>
                  {EXTRACT_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {values.operationType === "call-function" && (
              <label className={styles.field}>
                <span>Function</span>
                <input
                  value={values.functionId}
                  onChange={(event) => update("functionId", event.target.value)}
                  list="flow-editor-functions"
                  placeholder="normalizeCurrency"
                />
              </label>
            )}
            {!["delete", "clear", "extract"].includes(values.operationType) &&
              renderValueInput("Value", "valueMode", "valueInput")}
          </>
        )}

        {kind === "assertion" && (
          <>
            <label className={styles.field}>
              <span>Matcher</span>
              <select
                value={values.assertionOperator}
                onChange={(event) => update("assertionOperator", event.target.value)}
              >
                {ASSERTION_OPERATORS.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
            </label>
            {["text", "text-exact", "text-matches", "attribute", "value", "count"].includes(values.assertionOperator) &&
              renderValueInput("Expected", "expectedValueMode", "expectedValue")}
          </>
        )}

        {kind === "action-hook" && (
          <>
            <label className={styles.field}>
              <span>Command</span>
              <select value={values.hookCommand} onChange={(event) => update("hookCommand", event.target.value)}>
                {HOOK_COMMANDS.map((command) => (
                  <option key={command} value={command}>
                    {command}
                  </option>
                ))}
              </select>
            </label>
            {(ELEMENT_HOOK_COMMANDS.has(values.hookCommand) ||
              ["wait", "wait-for-url", "wait-for-load-state"].includes(values.hookCommand)) &&
              renderValueInput("Argument", "hookValueMode", "hookArgument")}
          </>
        )}

        {kind === "group" && (
          <>
            <label className={styles.field}>
              <span>Group Store Key</span>
              <input
                value={values.variableName}
                onChange={(event) => update("variableName", event.target.value)}
                placeholder="scenarioPayload"
              />
            </label>
            {renderValueInput("Grouped Value", "valueMode", "valueInput")}
          </>
        )}
      </section>

      <div className={styles.editorActions}>
        <button type="button" className={styles.primaryButton} onClick={handleInsert} disabled={!position}>
          <Check className={styles.buttonIcon} />
          Insert Draft
        </button>
      </div>
    </div>
  );
}

export default function FlowEditor() {
  const { flowId = "" } = useParams<{ flowId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedProject = useUIStore((state) => state.selectedProject);
  const applicationId = searchParams.get("appId") ?? "";
  const projectId = selectedProject?.id ?? null;
  const editorQuery = useFlowEditor(projectId, applicationId || null, flowId || null);
  const saveMutation = useSaveFlowEditorSteps();
  const connectMutation = useConnectFlowEditor();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingPositionRef = useRef<EditorPosition | null>(null);
  const lastHoverAtRef = useRef(0);
  const [activeTab, setActiveTab] = useState<Tab>("flow");
  const [draftSteps, setDraftSteps] = useState<FlowEditorDraftStep[]>([]);
  const [activePosition, setActivePosition] = useState<EditorPosition | null>(null);
  const [selectedElement, setSelectedElement] = useState<FlowEditorElementRef | null>(null);
  const [hoveredElement, setHoveredElement] = useState<FlowEditorElementRef | null>(null);
  const [inspectorEnabled, setInspectorEnabled] = useState(true);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);
  const [positionLoading, setPositionLoading] = useState(false);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [hasFrame, setHasFrame] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");

  useEffect(() => {
    if (!editorQuery.data) return;
    setDraftSteps(editorQuery.data.editorSteps);
  }, [editorQuery.data]);

  useEffect(() => {
    if (!inspectorEnabled) {
      setHoveredElement(null);
    }
  }, [inspectorEnabled]);

  const drawFrame = useCallback((dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new Image();
    image.onload = () => {
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setHasFrame(true);
    };
    image.src = dataUrl;
  }, []);

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  const openPosition = useCallback(
    (position: EditorPosition) => {
      pendingPositionRef.current = position;
      setActivePosition(position);
      setActiveTab("editor");
      setInspectorDrawerOpen(false);
      setPositionLoading(true);
      setHoveredElement(null);
      setSelectedElement(null);
      setError(null);
      send({ type: "editor.open_position", position });
    },
    [send],
  );

  const handlePayload = useCallback(
    (payload: WsPayload) => {
      if (payload.type === "editor.ready") {
        setStatus("ready");
        const pending = pendingPositionRef.current;
        if (pending) {
          send({ type: "editor.open_position", position: pending });
        }
      }

      if (payload.type === "position.ready") {
        setStatus("position.ready");
        setPositionLoading(false);
        setCurrentUrl(payload.pageUrl ?? "");
        setCurrentTitle(payload.title ?? "");
        if (payload.position) {
          setActivePosition(payload.position);
        }
        const width = Number(payload.viewport?.width);
        const height = Number(payload.viewport?.height);
        if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
          setViewport({ width, height });
        }
      }

      if (payload.type === "browser.frame" && payload.dataUrl) {
        setPositionLoading(false);
        const width = Number(payload.viewport?.width);
        const height = Number(payload.viewport?.height);
        if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
          setViewport({ width, height });
        }
        drawFrame(payload.dataUrl);
      }

      if (payload.type === "inspector.hovered") {
        setHoveredElement(payload.element ?? null);
      }

      if (payload.type === "inspector.selected") {
        setSelectedElement(payload.element ?? null);
        setActiveTab("editor");
        setInspectorDrawerOpen(true);
      }

      if (payload.type === "session.closed") {
        setStatus("closed");
        setPositionLoading(false);
      }

      if (payload.type === "error") {
        setPositionLoading(false);
        setError(payload.message ?? "Flow editor websocket error");
      }
    },
    [drawFrame, send],
  );

  useEffect(() => {
    if (!projectId || !applicationId || !flowId || wsRef.current || connectMutation.isPending) return;
    connectMutation.mutate(
      { projectId, applicationId, flowId },
      {
        onSuccess: ({ editorSessionId, wsTicket }) => {
          const wsUrl = buildWsUrl(editorSessionId, wsTicket);
          if (!wsUrl) {
            setStatus("failed");
            setError("Flow editor websocket URL is not configured.");
            return;
          }
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;
          setStatus("connecting");
          ws.onopen = () => {
            setStatus("connected");
            setError(null);
          };
          ws.onmessage = (event) => {
            try {
              handlePayload(JSON.parse(event.data) as WsPayload);
            } catch {
              setError("Invalid websocket message received.");
            }
          };
          ws.onerror = () => {
            setStatus("failed");
            setPositionLoading(false);
            setError("Flow editor websocket failed.");
          };
          ws.onclose = () => {
            wsRef.current = null;
            setPositionLoading(false);
            setStatus((current) => (current === "failed" ? current : "closed"));
          };
        },
      },
    );
  }, [applicationId, connectMutation, flowId, handlePayload, projectId]);

  useEffect(
    () => () => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "session.disconnect" }));
      }
      ws?.close(1000, "Flow editor page left");
    },
    [],
  );

  const transitionSteps = editorQuery.data?.transitionSteps ?? [];
  const flow = editorQuery.data?.flow ?? null;
  const hasDirtyDrafts = useMemo(() => {
    const source = editorQuery.data?.editorSteps ?? [];
    return JSON.stringify(source) !== JSON.stringify(draftSteps);
  }, [draftSteps, editorQuery.data?.editorSteps]);
  const designSymbols = useMemo(() => designSymbolsFromDrafts(draftSteps), [draftSteps]);

  const draftsByPosition = useMemo(() => {
    const groups = new Map<string, FlowEditorDraftStep[]>();
    draftSteps.forEach((step) => {
      const key = positionKey(step.position);
      groups.set(key, [...(groups.get(key) ?? []), step]);
    });
    groups.forEach((steps, key) => {
      groups.set(
        key,
        [...steps].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id)),
      );
    });
    return groups;
  }, [draftSteps]);

  const canvasPoint = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: ((event.clientX - rect.left) / rect.width) * viewport.width,
        y: ((event.clientY - rect.top) / rect.height) * viewport.height,
      };
    },
    [viewport.height, viewport.width],
  );

  const handleCanvasMove = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!inspectorEnabled || !activePosition || positionLoading) return;
    const now = Date.now();
    if (now - lastHoverAtRef.current < 100) return;
    lastHoverAtRef.current = now;
    send({ type: "inspector.hover", point: canvasPoint(event) });
  };

  const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!inspectorEnabled || !activePosition || positionLoading) return;
    event.preventDefault();
    send({ type: "inspector.pick", point: canvasPoint(event) });
  };

  const handleCanvasWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    if (!activePosition || positionLoading) return;
    event.preventDefault();
    send({
      type: "viewport.scroll",
      scroll: {
        deltaX: event.deltaX,
        deltaY: event.deltaY,
      },
    });
  };

  const insertDraft = (step: FlowEditorDraftStep) => {
    setDraftSteps((current) => [...current, step]);
    setActiveTab("flow");
  };

  const removeDraft = (id: string) => {
    setDraftSteps((current) => current.filter((step) => step.id !== id));
  };

  const saveDrafts = () => {
    if (!projectId || !applicationId || !flowId) return;
    saveMutation.mutate(
      { projectId, applicationId, flowId, editorSteps: draftSteps },
      {
        onSuccess: ({ response }) => {
          setDraftSteps(response.editorSteps);
        },
      },
    );
  };

  const renderFlow = () => {
    const items: JSX.Element[] = [];
    transitionSteps.forEach((step) => {
      const before: EditorPosition = { edge: "before", transitionId: step.transitionId };
      const after: EditorPosition = { edge: "after", transitionId: step.transitionId };
      (draftsByPosition.get(positionKey(before)) ?? []).forEach((draft) => {
        items.push(<FlowBlock key={draft.id} step={draft} onRemove={removeDraft} />);
      });
      items.push(
        <TransitionItem
          key={step.transitionId}
          step={step}
          activeEdge={activePosition?.transitionId === step.transitionId ? activePosition.edge : null}
          replaying={positionLoading && activePosition?.transitionId === step.transitionId}
          onBefore={() => openPosition(before)}
          onAfter={() => openPosition(after)}
        />,
      );
      (draftsByPosition.get(positionKey(after)) ?? []).forEach((draft) => {
        items.push(<FlowBlock key={draft.id} step={draft} onRemove={removeDraft} />);
      });
    });
    return items;
  };

  const selectedOverlayStyle = elementBoxStyle(selectedElement, viewport);
  const activeHoveredElement = inspectorEnabled ? hoveredElement : null;
  const hoveredOverlayStyle = elementBoxStyle(activeHoveredElement, viewport);
  const hoverMatchesSelected = isSameElement(activeHoveredElement, selectedElement);
  const hasInspectorOverlay = selectedOverlayStyle || hoveredOverlayStyle;
  const replayOverlayMessage = error && hasFrame ? error : "Updating replay position";

  if (!selectedProject) {
    return (
      <main className={styles.shell}>
        <div className={styles.centerState}>Select a project to edit TestFlows.</div>
      </main>
    );
  }

  if (!applicationId) {
    return (
      <main className={styles.shell}>
        <div className={styles.centerState}>Open the editor from a TestFlow row.</div>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <ManualSessionHeader
        appName={flow ? `TestFlow #${compactId(flow.id)}` : "Flow Editor"}
        versionName={flow?.appVersionName ?? ""}
        sessionId={flowId}
        currentUrl={currentUrl}
        currentTitle={currentTitle}
        isLive={status === "ready" || status === "position.ready"}
        status={error ? "failed" : status}
        ttlRemainingSeconds={null}
        elapsedSeconds={0}
        onBack={() => navigate(`${ROUTES.TEST_FLOWS}?appId=${encodeURIComponent(applicationId)}`)}
      />

      <section className={styles.body}>
        <div className={styles.editorViewportWrapper}>
          <div className={styles.editorViewportFrame}>
            {!hasFrame && (
              <div className={styles.viewportEmpty}>
                {editorQuery.isLoading || connectMutation.isPending ? (
                  <LoaderCircle className={styles.spinnerIcon} />
                ) : error ? (
                  <AlertCircle className={styles.emptyIcon} />
                ) : (
                  <Crosshair className={styles.emptyIcon} />
                )}
                <span>{error ?? (editorQuery.isLoading ? "Loading editor..." : "Opening replay session...")}</span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={viewport.width}
              height={viewport.height}
              className={`${styles.editorCanvas} ${hasFrame && activePosition && inspectorEnabled ? styles.editorCanvasInspecting : ""}`}
              onMouseMove={handleCanvasMove}
              onMouseDown={handleCanvasClick}
              onWheel={handleCanvasWheel}
              onContextMenu={(event) => event.preventDefault()}
            />
            {(positionLoading || (error && hasFrame)) && (
              <div className={`${styles.positionLoadingOverlay} ${error && hasFrame ? styles.positionErrorOverlay : ""}`}>
                {error && hasFrame ? (
                  <AlertCircle className={styles.emptyIcon} />
                ) : (
                  <LoaderCircle className={styles.spinnerIcon} />
                )}
                <span>{replayOverlayMessage}</span>
                {activePosition && <strong>{positionLabel(activePosition, transitionSteps)}</strong>}
              </div>
            )}
            {hasInspectorOverlay && (
              <div className={styles.canvasOverlay} aria-hidden="true">
                {selectedOverlayStyle && !hoverMatchesSelected && (
                  <span className={`${styles.inspectBox} ${styles.inspectBoxSelected}`} style={selectedOverlayStyle} />
                )}
                {hoveredOverlayStyle && (
                  <>
                    <span
                      className={`${styles.inspectBox} ${styles.inspectBoxHovered} ${
                        hoverMatchesSelected ? styles.inspectBoxCombined : ""
                      }`}
                      style={hoveredOverlayStyle}
                    />
                    <span
                      className={styles.inspectPopup}
                      style={{ left: hoveredOverlayStyle.left, top: hoveredOverlayStyle.top }}
                    >
                      {activeHoveredElement?.tag ?? "element"} {elementName(activeHoveredElement)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className={styles.panel}>
          <section className={styles.sidebarContext}>
            <div className={styles.sidebarContextHeader}>
              <span className={styles.contextEyebrow}>Flow Editor</span>
              <strong>{flow ? `TestFlow #${compactId(flow.id)}` : "Loading TestFlow"}</strong>
              <span className={styles.targetSummary}>
                {transitionSteps.length} transitions / {draftSteps.length} draft steps
                {hasDirtyDrafts ? " / unsaved" : ""}
              </span>
            </div>
            <div className={styles.panelActions}>
              <button
                type="button"
                className={`${styles.iconButton} ${inspectorEnabled ? styles.iconButtonActive : ""}`}
                onClick={() => setInspectorEnabled((enabled) => !enabled)}
                aria-pressed={inspectorEnabled}
                title={inspectorEnabled ? "Disable inspector" : "Enable inspector"}
              >
                <Crosshair className={styles.buttonIcon} />
              </button>
              <Button
                size="sm"
                variant="outline"
                onClick={saveDrafts}
                disabled={!hasDirtyDrafts || saveMutation.isPending}
              >
                {saveMutation.isPending ? <LoaderCircle className={styles.spinnerIcon} /> : <Save size={14} />}
                Save
              </Button>
              {hasDirtyDrafts && <span className={styles.dirtyBadge}>Unsaved</span>}
            </div>
          </section>

          <div className={styles.tabBar}>
            <button
              type="button"
              className={activeTab === "flow" ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab("flow")}
            >
              <ListChecks className={styles.tabIcon} />
              Flow
            </button>
            <button
              type="button"
              className={activeTab === "editor" ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab("editor")}
            >
              <PencilLine className={styles.tabIcon} />
              Editor
            </button>
          </div>

          {activeTab === "flow" && (
            <div className={styles.tabContent}>
              <div className={styles.stepsHeader}>
                <span>Flow Steps</span>
                <span className={styles.stepCount}>{transitionSteps.length + draftSteps.length}</span>
              </div>
              <ol className={styles.flowList}>{renderFlow()}</ol>
            </div>
          )}

          {activeTab === "editor" && (
            <div className={`${styles.tabContent} ${styles.editorTabContent}`}>
              <div className={styles.editorTabScroll}>
                <EditorForm
                  position={activePosition}
                  transitionSteps={transitionSteps}
                  selectedElement={selectedElement}
                  positionLoading={positionLoading}
                  designSymbols={designSymbols}
                  onInsert={insertDraft}
                />
              </div>
              <ElementInfoDrawer
                selectedElement={selectedElement}
                isOpen={inspectorDrawerOpen}
                onToggle={() => setInspectorDrawerOpen((current) => !current)}
              />
            </div>
          )}

          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate(`${ROUTES.TEST_FLOWS}?appId=${encodeURIComponent(applicationId)}`)}
          >
            <X className={styles.buttonIcon} />
            Back to TestFlows
          </button>
        </aside>
      </section>
    </main>
  );
}
