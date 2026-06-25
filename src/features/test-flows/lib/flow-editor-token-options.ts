// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type {
  FlowEditorDraftStep,
  FlowEditorElementRef,
} from "@features/test-flows/model/types/test-flows.types";

export type ElementTokenOption = {
  kind: "element";
  name: string;
  token: string;
  selector: string;
  element: FlowEditorElementRef;
};

export type VariableTokenOption = {
  kind: "variable";
  name: string;
  token: string;
};

export type TokenPickerOption = ElementTokenOption | VariableTokenOption;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function addString(set: Set<string>, value: unknown) {
  if (typeof value === "string" && value.trim()) set.add(value.trim());
}

function primarySelector(element: FlowEditorElementRef) {
  return element.selector || element.selectorCandidates?.find((selector) => selector.trim()) || "";
}

function normalizeTag(tag: string | null | undefined) {
  const normalized = (tag ?? "element").toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized || "element";
}

function elementIdentity(element: FlowEditorElementRef) {
  const selector = primarySelector(element);
  if (selector) return `selector:${selector}`;
  if (!element.box) return "";
  return [
    "box",
    normalizeTag(element.tag),
    element.box.x,
    element.box.y,
    element.box.width,
    element.box.height,
  ].join(":");
}

function mergeElement(left: FlowEditorElementRef, right: FlowEditorElementRef): FlowEditorElementRef {
  return {
    ...left,
    ...right,
    selector: right.selector || left.selector,
    selectorCandidates: [...new Set([...(left.selectorCandidates ?? []), ...(right.selectorCandidates ?? [])])],
    attributes: { ...(left.attributes ?? {}), ...(right.attributes ?? {}) },
    box: right.box ?? left.box,
    viewport: right.viewport ?? left.viewport,
  };
}

export function mergeElementCatalog(elements: Array<FlowEditorElementRef | null | undefined>) {
  const map = new Map<string, FlowEditorElementRef>();

  elements.forEach((element) => {
    if (!element) return;
    const key = elementIdentity(element);
    if (!key) return;
    const current = map.get(key);
    map.set(key, current ? mergeElement(current, element) : element);
  });

  return [...map.values()];
}

export function buildElementTokenOptions(elements: Array<FlowEditorElementRef | null | undefined>) {
  const counters = new Map<string, number>();

  return mergeElementCatalog(elements)
    .map<ElementTokenOption | null>((element) => {
      const selector = primarySelector(element);
      if (!selector) return null;

      const tag = normalizeTag(element.tag);
      const nextCount = (counters.get(tag) ?? 0) + 1;
      counters.set(tag, nextCount);
      const name = `${tag}${nextCount}`;

      return {
        kind: "element",
        name,
        token: `{{${name}}}`,
        selector,
        element,
      };
    })
    .filter((option): option is ElementTokenOption => option !== null);
}

function collectDesignKeys(definition: unknown, keys: Set<string>) {
  const record = asRecord(definition);
  addString(keys, record.storeKey);
  addString(keys, record.key);
  addString(keys, record.assignTo);

  const operations = Array.isArray(record.operations) ? record.operations : [];
  operations.forEach((operation) => collectDesignKeys(operation, keys));
}

export function buildDesignClassTokenOptions(draftSteps: FlowEditorDraftStep[]) {
  const names = new Set<string>();

  draftSteps.forEach((step) => {
    if (step.kind !== "design-class" && step.kind !== "design-operation") return;
    collectDesignKeys(step.definition, names);
  });

  return [...names].sort().map<VariableTokenOption>((name) => ({
    kind: "variable",
    name,
    token: `{{${name}}}`,
  }));
}
