// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useState, type CSSProperties } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { RegressionEvent as RegressionEventResponse } from "@coveritlabs/contracts";
import {
  REGRESSION_EVENT_CATEGORIES,
  REGRESSION_EVENT_CATEGORY_ORDER,
  REGRESSION_EVENT_LEVELS,
  type RegressionAssertionResult,
  type RegressionEventCategory,
  type RegressionEventLevel,
} from "../../../model/constants/regressionSemantics";
import { RegressionSemanticMarker } from "../../RegressionSemanticMarker";
import { Card } from "@shared/ui";
import { formatDateTime } from "../../../lib/formatters";
import styles from "../../RegressionRuns.module.scss";

interface TimelineEvent {
  id: string;
  category: RegressionEventCategory;
  level: RegressionEventLevel;
  assertionResult: RegressionAssertionResult;
  title: string;
  detail?: string;
  code?: string;
  timestamp: string;
  metadata: Array<{ key: string; value: string }>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function primitiveString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function normalizeCategory(value: unknown): RegressionEventCategory | undefined {
  const normalized = stringValue(value)?.toLowerCase();
  if (normalized === "designclass" || normalized === "design-class" || normalized === "design_class") return "designClass";
  if (normalized === "hook" || normalized === "actionhook" || normalized === "action-hook" || normalized === "action_hook") return "hook";
  if (normalized === "scenario" || normalized === "state" || normalized === "transition" || normalized === "assertion" || normalized === "basic") {
    return normalized;
  }
  return undefined;
}

function normalizeLevel(value: unknown): RegressionEventLevel | undefined {
  const normalized = stringValue(value)?.toLowerCase();
  if (normalized === "warning") return "warn";
  if (normalized === "info" || normalized === "debug" || normalized === "warn" || normalized === "error") return normalized;
  return undefined;
}

function deriveCategory(event: RegressionEventResponse, payload: Record<string, unknown>): RegressionEventCategory {
  const payloadCategory = normalizeCategory(payload.category);
  if (payloadCategory) return payloadCategory;

  const stepType = (event.stepType ?? stringValue(payload.stepType) ?? stringValue(asRecord(payload.report).stepType) ?? "").toUpperCase();
  if (event.type === "scenario.status") return "scenario";
  if (stepType === "ACTION_HOOK") return "hook";
  if (stepType === "DESIGN_CLASS") return "designClass";
  if (event.type === "assertion.result" || stepType === "ASSERTION") return "assertion";
  if (stepType === "STATE") return "state";
  if (stepType === "TRANSITION") return "transition";
  return "basic";
}

function deriveAssertionResult(event: RegressionEventResponse, payload: Record<string, unknown>): RegressionAssertionResult {
  const result = asRecord(payload.result);
  const severity = stringValue(result.severity)?.toLowerCase();
  const status = stringValue(payload.status)?.toLowerCase() ?? event.status?.toLowerCase();

  if (event.hasFailure || result.passed === false && severity !== "warning") return "fail";
  if (severity === "warning" || status === "warning" || status === "warn") return "warn";
  return "pass";
}

function deriveLevel(
  event: RegressionEventResponse,
  payload: Record<string, unknown>,
  category: RegressionEventCategory,
  assertionResult: RegressionAssertionResult,
): RegressionEventLevel {
  const explicit = normalizeLevel(payload.level) ?? normalizeLevel(event.logLevel);
  if (explicit) return explicit;
  if (event.hasFailure || assertionResult === "fail") return "error";
  if (assertionResult === "warn" || event.hasHealing) return "warn";
  if (category === "basic" && event.type === "log") return "info";
  return "info";
}

function titleFor(event: RegressionEventResponse, payload: Record<string, unknown>, category: RegressionEventCategory, assertionResult: RegressionAssertionResult): string {
  const explicit = stringValue(payload.title);
  if (explicit) return explicit;
  if (category === "scenario") return event.status ? `Scenario ${event.status}` : "Scenario event";
  if (category === "assertion") return assertionResult === "fail" ? "Assertion failed" : assertionResult === "warn" ? "Assertion warning" : "Assertion passed";
  if (category === "hook") return assertionResult === "fail" ? "Hook failed" : assertionResult === "warn" ? "Hook warning" : "Hook passed";
  if (category === "designClass") return assertionResult === "fail" ? "Design class failed" : assertionResult === "warn" ? "Design class warning" : "Design class passed";
  if (category === "state") return event.status === "running" ? "State started" : "State updated";
  if (category === "transition") return event.status === "running" ? "Transition started" : "Transition updated";
  if (event.type === "failure") return "Failure captured";
  if (event.type === "log") return "Log entry";
  return event.type;
}

function detailFor(event: RegressionEventResponse, payload: Record<string, unknown>): string | undefined {
  const result = asRecord(payload.result);
  return stringValue(payload.stepText)
    ?? stringValue(asRecord(payload.bddStep).text)
    ?? stringValue(payload.message)
    ?? stringValue(payload.error)
    ?? stringValue(payload.description)
    ?? stringValue(result.message)
    ?? event.stepLabel
    ?? event.scenarioName;
}

function codeFor(event: RegressionEventResponse, payload: Record<string, unknown>): string | undefined {
  return event.stepId
    ?? stringValue(payload.stepId)
    ?? stringValue(payload.stateId)
    ?? stringValue(payload.transitionId)
    ?? stringValue(payload.assertionId);
}

function addMetadata(entries: Map<string, string>, key: string, value: unknown): void {
  const primitive = primitiveString(value);
  if (primitive == null || primitive === "") return;
  entries.set(key, primitive);
}

function addRecordMetadata(entries: Map<string, string>, prefix: string, record: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(record)) {
    if (key === "category" || key === "level" || key === "title" || key === "message" || key === "description" || key === "error") continue;
    const primitive = primitiveString(value);
    if (primitive != null) entries.set(prefix ? `${prefix}.${key}` : key, primitive);
  }
}

function removeDuplicateMetadata(entries: Map<string, string>): void {
  const duplicateKeyPairs = [
    ["payload.status", "status"],
    ["payload.level", "level"],
    ["payload.stepId", "step.id"],
    ["payload.stepText", "step.text"],
    ["payload.stepType", "step.type"],
    ["payload.stepLabel", "step.label"],
    ["payload.stepKeyword", "step.keyword"],
    ["payload.parentStepId", "step.id"],
    ["payload.parentStepText", "step.text"],
    ["payload.parentStepType", "step.type"],
    ["payload.parentStepLabel", "step.label"],
    ["payload.parentStepKeyword", "step.keyword"],
  ] as const;

  duplicateKeyPairs.forEach(([duplicateKey, canonicalKey]) => {
    if (entries.get(duplicateKey) === entries.get(canonicalKey)) {
      entries.delete(duplicateKey);
    }
  });
}

function metadataFor(event: RegressionEventResponse, payload: Record<string, unknown>): Array<{ key: string; value: string }> {
  const entries = new Map<string, string>();
  addMetadata(entries, "event.type", event.type);
  addMetadata(entries, "feature", event.featureName);
  addMetadata(entries, "scenario", event.scenarioName);
  addMetadata(entries, "step.type", event.stepType);
  addMetadata(entries, "step.id", event.stepId);
  addMetadata(entries, "step.label", event.stepLabel);
  addMetadata(entries, "step.text", payload.stepText ?? asRecord(payload.bddStep).text);
  addMetadata(entries, "step.keyword", payload.stepKeyword ?? asRecord(payload.bddStep).keyword);
  addMetadata(entries, "status", event.status);
  addMetadata(entries, "level", event.logLevel);
  addMetadata(entries, "hasFailure", event.hasFailure || undefined);
  addMetadata(entries, "hasHealing", event.hasHealing || undefined);

  addRecordMetadata(entries, "payload", payload);
  const result = asRecord(payload.result);
  if (Object.keys(result).length > 0) addRecordMetadata(entries, "result", result);
  const healingInfo = asRecord(result.healingInfo);
  if (Object.keys(healingInfo).length > 0) addRecordMetadata(entries, "healing", healingInfo);
  const report = asRecord(payload.report);
  if (Object.keys(report).length > 0) addRecordMetadata(entries, "report", report);

  removeDuplicateMetadata(entries);

  return [...entries.entries()].map(([key, value]) => ({ key, value }));
}

function normalizeEvent(event: RegressionEventResponse): TimelineEvent {
  const payload = asRecord(event.payload);
  const category = deriveCategory(event, payload);
  const assertionResult = deriveAssertionResult(event, payload);
  const level = deriveLevel(event, payload, category, assertionResult);

  return {
    id: event.id,
    category,
    level,
    assertionResult,
    title: titleFor(event, payload, category, assertionResult),
    detail: detailFor(event, payload),
    code: codeFor(event, payload),
    timestamp: formatDateTime(event.timestamp),
    metadata: metadataFor(event, payload),
  };
}

function EventLegend() {
  return (
    <div className={styles.eventLegend} aria-label="Event category legend">
      {REGRESSION_EVENT_CATEGORY_ORDER.map((category) => (
        <span key={category}>
          <RegressionSemanticMarker category={category} size={12} />
          {REGRESSION_EVENT_CATEGORIES[category].label}
        </span>
      ))}
    </div>
  );
}

function EventLevelBadge({ level }: { level: RegressionEventLevel }) {
  const definition = REGRESSION_EVENT_LEVELS[level];
  return (
    <span
      className={styles.eventLevelBadge}
      style={{
        "--event-level-color": `var(${definition.foregroundVar})`,
        "--event-level-bg": `var(${definition.backgroundVar})`,
      } as CSSProperties}
    >
      {definition.label}
    </span>
  );
}

function EventTimelineRow({
  event,
  expanded,
  isLast,
  onToggle,
}: {
  event: TimelineEvent;
  expanded: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={styles.eventTimelineRow}>
      <div className={styles.eventTimelineRail}>
        <span className={styles.eventMarkerSocket}>
          <RegressionSemanticMarker category={event.category} assertionResult={event.assertionResult} size={event.category === "basic" ? 10 : 13} />
        </span>
        {!isLast && <span className={styles.eventTimelineLine} />}
      </div>

      <div className={styles.eventTimelineContent}>
        <button type="button" className={styles.eventTimelineButton} onClick={onToggle} aria-expanded={expanded}>
          <span className={styles.eventChevron}>{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
          <span className={styles.eventTimelineMain}>
            <span className={styles.eventTimelineTitleRow}>
              <strong title={event.title}>{event.title}</strong>
              {event.code && <code>{event.code}</code>}
            </span>
            {event.detail && <span className={styles.eventTimelineDetail}>{event.detail}</span>}
          </span>
          <span className={styles.eventLevelSlot}>
            <EventLevelBadge level={event.level} />
          </span>
          <span className={styles.eventTimestamp}>{event.timestamp}</span>
        </button>

        {expanded && (
          <div className={styles.eventMetadataPanel}>
            {event.metadata.length === 0 ? (
              <span className={styles.eventMetadataEmpty}>No metadata captured.</span>
            ) : (
              event.metadata.map((entry) => (
                <div key={entry.key} className={styles.eventMetadataRow}>
                  <code>{entry.key}</code>
                  <span>{entry.value}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function RegressionScenarioEvents({ events }: { events: RegressionEventResponse[] }) {
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(() => new Set());
  const timelineEvents = events.map(normalizeEvent);

  const toggleEvent = (eventId: string) => {
    setExpandedEventIds((current) => {
      const next = new Set(current);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  return (
    <Card className={`${styles.panel} ${styles.scenarioEventsPanel}`}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Scenario events</h3>
          <p>{events.length} loaded</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className={styles.panelEmpty}>No events captured for this scenario.</div>
      ) : (
        <>
          <EventLegend />
          <div className={styles.eventTimeline}>
            {timelineEvents.map((event, index) => (
              <EventTimelineRow
                key={event.id}
                event={event}
                expanded={expandedEventIds.has(event.id)}
                isLast={index === timelineEvents.length - 1}
                onToggle={() => toggleEvent(event.id)}
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
