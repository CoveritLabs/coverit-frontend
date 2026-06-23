// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { PendingRecordedEvent, RecordedEvent, RecordedStep } from "../model/types/manual-session.types";

export function stepLabel(step: RecordedStep) {
  if (step.description?.trim()) return step.description.trim();

  const action = step.action || step.actions?.[0]?.type || "step";
  const firstEvent = step.events?.[0];
  const target =
    firstEvent?.accessibleName ||
    firstEvent?.text ||
    step.selector ||
    step.actions?.[0]?.selector ||
    "page";

  if (action === "type" || action === "input" || action === "change") {
    const value = step.value ? `: ${step.value}` : "";
    return `type: ${target}${value}`;
  }
  if (action === "press") return `press: ${step.value || firstEvent?.key || target}`;
  if (action === "navigate") return `navigate: ${step.targetUrl || step.pageUrl || target}`;
  return `${action}: ${target}`;
}

export function eventKey(event: RecordedEvent) {
  return event.id ?? `${event.timestamp ?? ""}:${event.action ?? ""}:${event.selector ?? ""}:${event.key ?? ""}`;
}

function eventAction(event: RecordedEvent) {
  return event.action ?? "";
}

function addSelector(selectors: Set<string>, value: unknown) {
  if (typeof value !== "string") return;
  const selector = value.trim();
  if (selector) selectors.add(selector);
}

function eventSelectors(event: RecordedEvent) {
  const selectors = new Set<string>();
  const selectorCandidates = event.selectorCandidates ?? event.selector_candidates ?? [];
  if (Array.isArray(selectorCandidates)) {
    selectorCandidates.forEach((selector) => addSelector(selectors, selector));
  }

  addSelector(selectors, event.interactiveSelector);
  addSelector(selectors, event.interactive_selector);
  addSelector(selectors, event.element);
  addSelector(selectors, event.selector);
  addSelector(selectors, event.targetSelector);
  addSelector(selectors, event.target_selector);

  return selectors;
}

function isInputEvent(event: RecordedEvent) {
  return ["input", "change"].includes(eventAction(event));
}

function selectorSetsIntersect(left: Set<string>, right: Set<string>) {
  for (const selector of left) {
    if (right.has(selector)) return true;
  }
  return false;
}

function stepSelectors(step: RecordedStep) {
  const selectors = new Set<string>();
  addSelector(selectors, step.selector);
  step.actions?.forEach((action) => addSelector(selectors, action.selector));
  step.events?.forEach((event) => eventSelectors(event).forEach((selector) => selectors.add(selector)));
  return selectors;
}

export function isGroupedPendingEvent(event: RecordedEvent, step: RecordedStep) {
  if (!["type", "select"].includes(step.action ?? step.actions?.[0]?.type ?? "")) return false;

  const selectors = eventSelectors(event);
  const finalizedSelectors = stepSelectors(step);
  if (!selectors.size || !finalizedSelectors.size) return false;
  if (!selectorSetsIntersect(selectors, finalizedSelectors)) return false;

  return isInputEvent(event) || eventAction(event) === "click";
}

export function clearPendingEventsForStep(current: PendingRecordedEvent[], finalizedStep: RecordedStep) {
  const finalizedEventKeys = stepEventKeys(finalizedStep);
  return current.filter((event) => {
    const key = eventKey(event);
    if (key && finalizedEventKeys.has(key)) return false;
    if (isGroupedPendingEvent(event, finalizedStep)) return false;
    return true;
  });
}

export function discardPendingEvents(
  current: PendingRecordedEvent[],
  eventIds: string[] = [],
  discardedEvents: RecordedEvent[] = [],
) {
  const discardedKeys = new Set(eventIds.filter(Boolean));
  discardedEvents.forEach((event) => {
    const key = eventKey(event);
    if (key) discardedKeys.add(key);
  });

  if (!discardedKeys.size) return current;

  return current.filter((event) => {
    const key = eventKey(event);
    return !key || !discardedKeys.has(key);
  });
}

export function mergePendingEvent<T extends RecordedEvent>(current: T[], nextEvent: T): T[] {
  if (!isInputEvent(nextEvent)) return [...current, nextEvent];

  const nextSelectors = eventSelectors(nextEvent);
  if (!nextSelectors.size) return [...current, nextEvent];

  let replaced = false;
  const next = current.flatMap((event) => {
    if (!selectorSetsIntersect(eventSelectors(event), nextSelectors)) return [event];
    if (eventAction(event) === "click") return [];
    if (isInputEvent(event)) {
      if (replaced) return [];
      replaced = true;
      return [nextEvent];
    }
    return [event];
  });

  if (!replaced) next.push(nextEvent);
  return next;
}

export function eventLabel(event: RecordedEvent) {
  const action = event.action || "event";
  const target = event.accessibleName || event.text || event.selector || event.tag || "page";

  if (action === "type" || action === "input" || action === "change") {
    const value = event.value ? `: ${event.value}` : "";
    return `type: ${target}${value}`;
  }

  if (action === "press") return `press: ${event.key || target}`;
  if (action === "navigate") return `navigate: ${event.pageUrl || target}`;
  return `${action}: ${target}`;
}

export function stepEventKeys(step: RecordedStep) {
  return new Set((step.events ?? []).map(eventKey).filter(Boolean));
}

export function stepKey(step: RecordedStep) {
  return step.id ?? step.stepId ?? "";
}

export function numericRevision(value: unknown) {
  const revision = Number(value);
  return Number.isFinite(revision) ? revision : null;
}
