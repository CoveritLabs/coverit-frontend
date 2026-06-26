// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useUIStore } from "@app/store";
import { useIntegrationStatus } from "@features/integrations";
import {
  applicationContextEquals,
  buildApplicationContext,
  resolveApplicationSelection,
  resolveVersionSelection,
  useConnectManualSession,
  useTargetApplications,
} from "@features/target-applications";
import { env } from "@shared/config/env";
import { ROUTES } from "@shared/config/routes";
import { formatElapsed, statusLabel } from "@shared/lib/live-session-formatters";
import { LiveSessionHeader, toast } from "@shared/ui";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type WheelEvent,
} from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { manualSessionRoute } from "../lib/manual-session-route";
import { acquireConnection, forgetConnection, releaseConnection } from "../lib/manual-session-connection";
import {
  eventKey,
  eventLabel,
  isGroupedPendingEvent,
  isPublishablePendingEvent,
  mergePendingEvent,
  numericRevision,
  stepEventKeys,
  stepKey,
  stepLabel,
} from "../lib/recorded-step-utils";
import {
  ACTION_TIMEOUT_MS,
  DEFAULT_VIEWPORT,
  PENDING_EVENT_BLOCK_MS,
  REWIND_ACTION_TIMEOUT_MS,
} from "../model/constants/manual-session.constants";
import type {
  ActionFeedback,
  ApplicationView,
  LocationState,
  ManualAction,
  PendingRecordedEvent,
  RecordedEvent,
  RecordedStep,
  RouteParams,
  VisibleStepItem,
  WsPayload,
} from "../model/types/manual-session.types";
import {
  ManualSessionConfirmationModal,
  type ManualSessionConfirmationKind,
} from "./components/ManualSessionConfirmationModal";
import { ManualSessionPanel } from "./components/ManualSessionPanel";
import { ManualSessionViewport } from "./components/ManualSessionViewport";
import styles from "./ManualSession.module.scss";

type ConfirmationState =
  | { kind: "exit"; target: "start" | "applications" }
  | { kind: Exclude<ManualSessionConfirmationKind, "exit"> };

function buildWsUrl(sessionId: string, ticket: string) {
  const base = env.wsUrl?.replace(/\/$/, "");
  if (!base) return "";
  return `${base}/ws/manual-recordings/${encodeURIComponent(sessionId)}?ticket=${encodeURIComponent(ticket)}`;
}

function updateSearchParams(
  searchParams: URLSearchParams,
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  updates: Record<string, string | null>,
  replace = true,
) {
  const next = new URLSearchParams(searchParams);
  Object.entries(updates).forEach(([key, value]) => {
    if (!value) next.delete(key);
    else next.set(key, value);
  });
  setSearchParams(next, { replace });
}

function ManualSession() {
  const params = useParams<RouteParams>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProject = useUIStore((state) => state.selectedProject);
  const selectedApplicationContext = useUIStore((state) => state.selectedApplicationContext);
  const setSelectedApplicationContext = useUIStore((state) => state.setSelectedApplicationContext);
  const { data: applications = [], isPlaceholderData: applicationsPlaceholderData } = useTargetApplications(
    selectedProject?.id ?? null,
  );
  const connectManualSession = useConnectManualSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const disconnectedByUserRef = useRef(false);
  const disconnectNavigateRef = useRef<"start" | "applications" | null>(null);
  const flowRevisionRef = useRef(0);
  const pendingActionRef = useRef<ManualAction | null>(null);
  const actionTimeoutRef = useRef<number | null>(null);
  const initialCanvasUrlRef = useRef("");
  const state = (location.state ?? {}) as LocationState;
  const typedApplications = useMemo(() => applications as ApplicationView[], [applications]);

  const sessionId = params.sessionId ?? "";
  const ticket = searchParams.get("ticket") ?? "";
  const connectionKey = `${sessionId}:${ticket}`;
  const wsUrl = useMemo(() => (sessionId && ticket ? buildWsUrl(sessionId, ticket) : ""), [sessionId, ticket]);
  const routeApplicationId = params.applicationId ?? null;
  const routeVersionId = params.versionId ?? null;
  const requestedApplicationId = routeApplicationId ?? searchParams.get("appId");
  const requestedVersionId = routeVersionId ?? searchParams.get("versionId");
  const projectId = selectedProject?.id ?? null;
  const contextProjectId = params.projectId ?? projectId;

  const [activeTab, setActiveTab] = useState<"record" | "bug">("record");
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ttlRemainingSeconds, setTtlRemainingSeconds] = useState<number | null>(null);
  const [ttlExpiresAt, setTtlExpiresAt] = useState<number | null>(null);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [currentUrl, setCurrentUrl] = useState(state.applicationBaseUrl ?? "");
  const [currentTitle, setCurrentTitle] = useState("");
  const [hasFrame, setHasFrame] = useState(false);
  const [flowStarted, setFlowStarted] = useState(false);
  const [flowMarker, setFlowMarker] = useState<string | null>(null);
  const [lastFlowMessage, setLastFlowMessage] = useState<string | null>(null);
  const [steps, setSteps] = useState<RecordedStep[]>([]);
  const [pendingEvents, setPendingEvents] = useState<PendingRecordedEvent[]>([]);
  const [pendingEventClock, setPendingEventClock] = useState(() => Date.now());
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugSeverity, setBugSeverity] = useState("medium");
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [pendingAction, setPendingActionState] = useState<ManualAction | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

  const selectedApplication = useMemo(
    () =>
      routeApplicationId
        ? (typedApplications.find((application) => application.id === routeApplicationId) ?? null)
        : resolveApplicationSelection({
            applications: typedApplications,
            projectId,
            requestedApplicationId,
            storedContext: selectedApplicationContext,
          }),
    [projectId, requestedApplicationId, routeApplicationId, selectedApplicationContext, typedApplications],
  );
  const selectedApplicationId = routeApplicationId ?? selectedApplication?.id ?? null;
  const jiraStatusQuery = useIntegrationStatus(selectedProject?.id ?? null, "jira");
  const availableVersions = useMemo(() => selectedApplication?.versions ?? [], [selectedApplication]);
  const selectedVersion = useMemo(
    () =>
      routeVersionId
        ? (availableVersions.find((version) => version.id === routeVersionId) ?? null)
        : resolveVersionSelection({
            versions: availableVersions,
            projectId,
            applicationId: selectedApplicationId,
            requestedVersionId,
            storedContext: selectedApplicationContext,
            requireVersion: true,
          }),
    [availableVersions, projectId, requestedVersionId, routeVersionId, selectedApplicationContext, selectedApplicationId],
  );
  const selectedVersionId = routeVersionId ?? selectedVersion?.id ?? null;
  const initialCanvasUrl = state.applicationBaseUrl ?? selectedApplication?.baseUrl ?? "";
  initialCanvasUrlRef.current = initialCanvasUrl;
  const hasLiveSession = Boolean(sessionId);
  const appName = state.applicationName || selectedApplication?.name || params.applicationId || "Select application";
  const versionName = state.versionName || selectedVersion?.version || params.versionId || "Select version";
  const isLive = status === "running" || status === "crawler.ready" || Boolean(connectedAt && status !== "closed");
  const canSend = wsRef.current?.readyState === WebSocket.OPEN;
  const canConnect = Boolean(selectedProject?.id && selectedApplication?.id && selectedVersion?.id);
  const hasRecordedSteps = steps.length > 0;
  const hasPendingAction = pendingAction !== null;
  const hasStalePendingEvents = useMemo(
    () => pendingEvents.some((event) => pendingEventClock - event.receivedAt >= PENDING_EVENT_BLOCK_MS),
    [pendingEventClock, pendingEvents],
  );
  const hasPublishablePendingEvents = useMemo(
    () => pendingEvents.some(isPublishablePendingEvent),
    [pendingEvents],
  );
  const pendingEventBlockerMessage = hasStalePendingEvents
    ? hasPublishablePendingEvents
      ? "Publish the pending typing step before creating a TestFlow."
      : "Waiting for pending browser events to finalize before creating a TestFlow."
    : null;
  const canFinishFlow = Boolean(canSend && flowStarted && hasRecordedSteps && !hasStalePendingEvents);
  const jiraReportingEnabled =
    jiraStatusQuery.data?.reportingConfig?.case === "jiraReportingConfig" &&
    jiraStatusQuery.data.reportingConfig.value.enabled;
  const jiraReportingMessage = jiraStatusQuery.isLoading
    ? "Checking Jira reporting status..."
    : jiraStatusQuery.isError
      ? "Jira reporting status could not be loaded."
      : "Enable Jira reporting in project integrations to queue bug flows.";
  const canReportBug = Boolean(jiraReportingEnabled && bugTitle.trim() && canFinishFlow && !hasPendingAction);
  const visibleSteps = useMemo<VisibleStepItem[]>(
    () => [
      ...steps.flatMap((step, index) => {
        const finalizedEvents = step.events ?? [];
        const baseStepId = step.id ?? step.stepId ?? `${step.timestamp}-${index}`;
        const baseIndex = step.index ?? index + 1;
        const detail = `${step.targetUrl || step.pageUrl || currentUrl}${
          step.transitionId ? ` / ${step.transitionId.slice(0, 8)}` : ""
        }`;

        if (finalizedEvents.length <= 1) {
          return [
            {
              key: baseStepId,
              index: String(baseIndex),
              label: stepLabel(step),
              detail,
              pending: false,
              finalizedEvent: false,
              canContinue: true,
              canPublish: false,
              step,
            },
          ];
        }

        return finalizedEvents.map((event, eventIndex) => ({
          key: `${baseStepId}-event-${eventKey(event) || eventIndex}`,
          index: `${baseIndex}.${eventIndex + 1}`,
          label: eventLabel(event),
          detail: event.pageUrl || detail,
          pending: false,
          finalizedEvent: true,
          canContinue: eventIndex === finalizedEvents.length - 1,
          canPublish: false,
          step: eventIndex === finalizedEvents.length - 1 ? step : null,
        }));
      }),
      ...pendingEvents.map((event, index) => ({
        key: `pending-${eventKey(event) || index}`,
        index: String(steps.length + index + 1),
        label: eventLabel(event),
        detail: event.pageUrl || currentUrl || "Waiting for finalized step...",
        pending: true,
        finalizedEvent: false,
        canContinue: false,
        canPublish: isPublishablePendingEvent(event),
        step: null,
      })),
    ],
    [currentUrl, pendingEvents, steps],
  );

  useEffect(() => {
    if (!pendingEvents.length) return;

    const timer = window.setInterval(() => {
      setPendingEventClock(Date.now());
    }, 500);

    return () => window.clearInterval(timer);
  }, [pendingEvents.length]);

  useEffect(() => {
    if (!contextProjectId) return;

    if (routeApplicationId || routeVersionId) {
      const nextContext = {
        projectId: contextProjectId,
        applicationId: routeApplicationId ?? selectedApplication?.id ?? "",
        applicationName: state.applicationName || selectedApplication?.name || routeApplicationId || "Select application",
        versionId: routeVersionId,
        versionName: state.versionName || selectedVersion?.version || routeVersionId,
      };

      if (nextContext.applicationId && !applicationContextEquals(selectedApplicationContext, nextContext)) {
        setSelectedApplicationContext(nextContext);
      }
      return;
    }

    if (applicationsPlaceholderData) return;

    if (!typedApplications.length) {
      if (selectedApplicationContext?.projectId === contextProjectId) setSelectedApplicationContext(null);
      if (requestedApplicationId || requestedVersionId) {
        updateSearchParams(searchParams, setSearchParams, { appId: null, versionId: null });
      }
      return;
    }

    if (!selectedApplication) return;

    const nextContext = buildApplicationContext(contextProjectId, selectedApplication, selectedVersion);
    if (!applicationContextEquals(selectedApplicationContext, nextContext)) {
      setSelectedApplicationContext(nextContext);
    }

    const updates: Record<string, string | null> = {};
    if (requestedApplicationId !== selectedApplication.id) updates.appId = selectedApplication.id;
    if (selectedVersionId && requestedVersionId !== selectedVersionId) updates.versionId = selectedVersionId;
    if (!selectedVersionId && requestedVersionId) updates.versionId = null;

    if (Object.keys(updates).length > 0) {
      updateSearchParams(searchParams, setSearchParams, updates);
    }
  }, [
    applicationsPlaceholderData,
    contextProjectId,
    requestedApplicationId,
    requestedVersionId,
    routeApplicationId,
    routeVersionId,
    searchParams,
    selectedApplication,
    selectedApplicationContext,
    selectedVersion,
    selectedVersionId,
    setSearchParams,
    setSelectedApplicationContext,
    state.applicationName,
    state.versionName,
    typedApplications.length,
  ]);

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

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    setViewport(DEFAULT_VIEWPORT);
    setHasFrame(false);
  }, []);

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current === null) return;
    window.clearTimeout(actionTimeoutRef.current);
    actionTimeoutRef.current = null;
  }, []);

  const setPendingAction = useCallback((action: ManualAction | null) => {
    pendingActionRef.current = action;
    setPendingActionState(action);
  }, []);

  const startAction = useCallback(
    (action: ManualAction, message: string) => {
      setPendingAction(action);
      setActionFeedback({ kind: "pending", message });
      setError(null);
    },
    [setPendingAction],
  );

  const completeAction = useCallback(
    (message: string) => {
      clearActionTimeout();
      setPendingAction(null);
      setActionFeedback({ kind: "success", message });
    },
    [clearActionTimeout, setPendingAction],
  );

  const failAction = useCallback(
    (message: string) => {
      clearActionTimeout();
      setPendingAction(null);
      setActionFeedback({ kind: "error", message });
    },
    [clearActionTimeout, setPendingAction],
  );

  const cancelActionSilently = useCallback(() => {
    clearActionTimeout();
    setPendingAction(null);
    setActionFeedback(null);
  }, [clearActionTimeout, setPendingAction]);

  const startActionTimeout = useCallback(
    (action: ManualAction, message: string, timeoutMs = ACTION_TIMEOUT_MS) => {
      clearActionTimeout();
      actionTimeoutRef.current = window.setTimeout(() => {
        actionTimeoutRef.current = null;
        if (pendingActionRef.current !== action) return;
        setPendingAction(null);
        setActionFeedback({ kind: "error", message });
      }, timeoutMs);
    },
    [clearActionTimeout, setPendingAction],
  );

  const resetSessionState = useCallback(() => {
    clearActionTimeout();
    wsRef.current = null;
    clearCanvas();
    setConnectedAt(null);
    setElapsedSeconds(0);
    setTtlRemainingSeconds(null);
    setTtlExpiresAt(null);
    setFlowStarted(false);
    setFlowMarker(null);
    setLastFlowMessage(null);
    setSteps([]);
    setPendingEvents([]);
    setPendingAction(null);
    setActionFeedback(null);
    setCurrentUrl(initialCanvasUrlRef.current);
    setCurrentTitle("");
    setError(null);
    setConfirmation(null);
    setStatus("closed");
  }, [clearActionTimeout, clearCanvas, setPendingAction]);

  const finishDisconnect = useCallback(() => {
    const target = disconnectNavigateRef.current;
    if (!target) return;

    disconnectNavigateRef.current = null;
    resetSessionState();
    completeAction("Session disconnected.");
    navigate(target === "applications" ? ROUTES.APPLICATIONS : ROUTES.MANUAL_RECORDINGS, { replace: true });
  }, [completeAction, navigate, resetSessionState]);

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  const closeSessionAfterCompletion = useCallback(
    (message: string) => {
      clearActionTimeout();
      setPendingAction(null);
      setActionFeedback({ kind: "success", message });
      toast.success(message);
      disconnectNavigateRef.current = "start";
      disconnectedByUserRef.current = true;
      const sent = send({ type: "session.disconnect" });
      releaseConnection(connectionKey, true);
      resetSessionState();
      if (!sent) {
        finishDisconnect();
      }
    },
    [clearActionTimeout, connectionKey, finishDisconnect, resetSessionState, send, setPendingAction],
  );

  const updateViewport = useCallback((payload: WsPayload) => {
    const width = Number(payload.viewport?.width);
    const height = Number(payload.viewport?.height);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      setViewport({ width, height });
    }
  }, []);

  const handlePayload = useCallback(
    (payload: WsPayload) => {
      if (payload.type === "session.status" && payload.status) {
        setStatus(payload.status);
      }

      if (payload.type === "session.ttl") {
        const remainingSeconds = Number(payload.remainingSeconds);
        setTtlRemainingSeconds(Number.isFinite(remainingSeconds) ? Math.max(0, remainingSeconds) : null);

        const expiresAt = payload.expiresAt ? Date.parse(payload.expiresAt) : NaN;
        setTtlExpiresAt(Number.isFinite(expiresAt) ? expiresAt : null);
      }

      if (payload.type === "crawler.ready") {
        setStatus("running");
        updateViewport(payload);
        setCurrentUrl((value) => payload.url ?? value);
        setCurrentTitle(payload.title ?? "");
      }

      if (payload.type === "browser.frame" && payload.dataUrl) {
        updateViewport(payload);
        drawFrame(payload.dataUrl);
      }

      if (payload.type === "browser.navigation") {
        setCurrentUrl(payload.url ?? "");
        setCurrentTitle(payload.title ?? "");
      }

      if (payload.type === "flow.started") {
        const revision = numericRevision(payload.flowRevision) ?? flowRevisionRef.current + 1;
        flowRevisionRef.current = revision;
        setFlowStarted(true);
        setFlowMarker(payload.timestamp ?? new Date().toISOString());
        setLastFlowMessage(null);
        completeAction("Flow started.");
        setPendingEvents([]);
        setSteps((payload.steps ?? []).map((step) => ({ ...step, flowRevision: step.flowRevision ?? revision })));
        setCurrentUrl((value) => payload.pageUrl ?? payload.url ?? value);
        setCurrentTitle((value) => payload.title ?? value);
      }

      if (payload.type === "recorded.event" && payload.event) {
        setPendingEvents((current) => {
          const nextEvent = { ...(payload.event as RecordedEvent), receivedAt: Date.now() };
          const nextEventKey = eventKey(nextEvent);
          if (nextEventKey && current.some((event) => eventKey(event) === nextEventKey)) return current;
          return mergePendingEvent(current, nextEvent);
        });
      }

      if (payload.type === "recorded.step" && payload.step) {
        const incomingRevision =
          numericRevision(payload.step.flowRevision) ?? numericRevision(payload.flowRevision) ?? flowRevisionRef.current;
        if (incomingRevision < flowRevisionRef.current) return;
        if (incomingRevision > flowRevisionRef.current) {
          flowRevisionRef.current = incomingRevision;
        }

        setSteps((current) => {
          const nextStep = {
            ...(payload.step as RecordedStep),
            flowRevision: incomingRevision,
          };
          const nextStepId = stepKey(nextStep);
          if (!nextStepId) return [...current, nextStep];
          if (current.some((step) => stepKey(step) === nextStepId)) {
            return current.map((step) => (stepKey(step) === nextStepId ? nextStep : step));
          }
          return [...current, nextStep];
        });
        setPendingEvents((current) => {
          const finalizedStep = payload.step as RecordedStep;
          const finalizedEventKeys = stepEventKeys(finalizedStep);
          return current.filter((event) => {
            const key = eventKey(event);
            if (key && finalizedEventKeys.has(key)) return false;
            if (isGroupedPendingEvent(event, finalizedStep)) return false;
            return true;
          });
        });
        if (pendingActionRef.current === "publish") {
          completeAction("Typing step published.");
        }
      }

      if (payload.type === "flow.pending_published") {
        const count = Number(payload.stepCount);
        if (pendingActionRef.current === "publish") {
          completeAction(
            Number.isFinite(count) && count > 0
              ? "Typing step published."
              : "No pending typing step to publish.",
          );
        }
      }

      if (payload.type === "flow.rewind_progress") {
        const action = pendingActionRef.current;
        if (action === "continue" || action === "reset") {
          setActionFeedback({
            kind: "pending",
            message:
              payload.message ??
              (action === "continue"
                ? "Continuing from selected step..."
                : "Resetting to checkpoint..."),
          });
          startActionTimeout(
            action,
            action === "continue"
              ? "Continue timed out. The session is still connected."
              : "Reset timed out. The session is still connected.",
            REWIND_ACTION_TIMEOUT_MS,
          );
        }
      }

      if (payload.type === "flow.rewound") {
        const revision = numericRevision(payload.flowRevision) ?? flowRevisionRef.current + 1;
        if (revision < flowRevisionRef.current) return;
        flowRevisionRef.current = revision;
        if (payload.steps) {
          setSteps(payload.steps.map((step) => ({ ...step, flowRevision: step.flowRevision ?? revision })));
        } else {
          const kept = new Set(payload.keptStepIds ?? []);
          setSteps((current) =>
            payload.keptStepIds ? current.filter((step) => kept.has(stepKey(step))) : current,
          );
        }
        setPendingEvents([]);
        setCurrentUrl((value) => payload.pageUrl ?? payload.url ?? value);
        setCurrentTitle((value) => payload.title ?? value);
        const removedCount = payload.removedStepIds?.length ?? 0;
        setLastFlowMessage(
          removedCount > 0
            ? `Continued from earlier step; removed ${removedCount} ${removedCount === 1 ? "step" : "steps"}.`
            : "Returned to the selected step.",
        );
        const action = pendingActionRef.current;
        const stateChanged = payload.stateMatched === false;
        completeAction(
          action === "continue"
            ? stateChanged
              ? "Continued from selected step. Page state changed during replay."
              : "Continued from selected step."
            : stateChanged
              ? "Returned to checkpoint. Page state changed during replay."
              : "Returned to checkpoint.",
        );
      }

      if (payload.type === "flow.completed") {
        setFlowStarted(false);
        setPendingEvents([]);
        const count = payload.stepCount ?? payload.transitionIds?.length ?? 0;
        const message = `Manual flow queued with ${count} ${count === 1 ? "step" : "steps"}.`;
        closeSessionAfterCompletion(message);
      }

      if (payload.type === "bug.reported") {
        setFlowStarted(false);
        setPendingEvents([]);
        const count = payload.stepCount ?? payload.transitionIds?.length ?? 0;
        const message = `Bug flow queued with ${count} ${count === 1 ? "step" : "steps"}.`;
        closeSessionAfterCompletion(message);
      }

      if (payload.type === "session.closed") {
        setStatus(payload.status ?? "closed");
        setPendingEvents([]);
        setTtlRemainingSeconds(null);
        setTtlExpiresAt(null);
        finishDisconnect();
      }

      if (payload.type === "error") {
        const message = payload.message ?? "Manual recording websocket error";
        setError(message);
        failAction(message);
      }
    },
    [
      closeSessionAfterCompletion,
      completeAction,
      drawFrame,
      failAction,
      finishDisconnect,
      startActionTimeout,
      updateViewport,
    ],
  );

  useEffect(() => {
    if (!sessionId) {
      clearActionTimeout();
      flowRevisionRef.current = 0;
      setSteps([]);
      setPendingEvents([]);
      setPendingAction(null);
      setActionFeedback(null);
      setStatus("idle");
      setError(null);
      setTtlRemainingSeconds(null);
      setTtlExpiresAt(null);
      return;
    }

    if (!ticket || !wsUrl) {
      const message = "Manual recording ticket is missing or invalid.";
      setStatus("failed");
      setError(message);
      failAction(message);
      return;
    }

    const ws = acquireConnection(connectionKey, wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectedAt(Date.now());
      setStatus("connected");
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        handlePayload(JSON.parse(event.data) as WsPayload);
      } catch {
        const message = "Invalid websocket message received.";
        setError(message);
        failAction(message);
      }
    };

    ws.onerror = () => {
      const message = "Manual recording websocket failed.";
      setStatus("failed");
      setError(message);
      failAction(message);
    };

    ws.onclose = () => {
      forgetConnection(connectionKey, ws);
      wsRef.current = null;
      clearCanvas();
      setConnectedAt(null);
      setStatus((current) =>
        disconnectedByUserRef.current ? "closed" : current === "failed" ? current : "disconnected",
      );
      if (disconnectNavigateRef.current) {
        finishDisconnect();
        return;
      }
      if (pendingActionRef.current) {
        failAction("Manual recording websocket disconnected.");
      }
    };

    return () => {
      releaseConnection(connectionKey);
    };
  }, [
    clearActionTimeout,
    clearCanvas,
    connectionKey,
    failAction,
    finishDisconnect,
    handlePayload,
    sessionId,
    setPendingAction,
    ticket,
    wsUrl,
  ]);

  useEffect(() => () => clearActionTimeout(), [clearActionTimeout]);

  useEffect(() => {
    if (!connectedAt) {
      setElapsedSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - connectedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [connectedAt]);

  useEffect(() => {
    if (!ttlExpiresAt) return;

    const updateRemaining = () => {
      setTtlRemainingSeconds(Math.max(0, Math.ceil((ttlExpiresAt - Date.now()) / 1000)));
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [ttlExpiresAt]);

  const canvasPoint = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: ((event.clientX - rect.left) / rect.width) * viewport.width,
        y: ((event.clientY - rect.top) / rect.height) * viewport.height,
      };
    },
    [viewport.height, viewport.width],
  );

  const sendMouse = useCallback(
    (event: MouseEvent<HTMLCanvasElement>, action: "down" | "up") => {
      if (!canSend) return;
      const point = canvasPoint(event);
      send({
        type: "browser.input",
        input: {
          kind: "mouse",
          action,
          x: point.x,
          y: point.y,
          button: event.button,
        },
      });
    },
    [canSend, canvasPoint, send],
  );

  const sendHover = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (!canSend) return;
      const point = canvasPoint(event);
      send({
        type: "browser.input",
        input: {
          kind: "mouse",
          action: "hover",
          x: point.x,
          y: point.y,
          button: event.button,
        },
      });
    },
    [canSend, canvasPoint, send],
  );

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLCanvasElement>) => {
      if (!canSend) return;
      event.preventDefault();
      send({
        type: "browser.input",
        input: {
          kind: "mouse",
          action: "wheel",
          deltaX: event.deltaX,
          deltaY: event.deltaY,
        },
      });
    },
    [canSend, send],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLCanvasElement>) => {
      if (!canSend) return;
      if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(event.key)) return;

      event.preventDefault();
      send({
        type: "browser.input",
        input: {
          kind: "keyboard",
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          altKey: event.altKey,
          shiftKey: event.shiftKey,
        },
      });
    },
    [canSend, send],
  );

  const handleStartFlow = () => {
    if (hasPendingAction) return;
    startAction("start", "Starting flow...");
    setPendingEvents([]);
    const sent = send({ type: "flow.start" });
    if (!sent) {
      cancelActionSilently();
      return;
    }
    startActionTimeout("start", "Start timed out. The session is still connected.");
  };

  const handleFinishFlow = () => {
    if (!canFinishFlow || hasPendingAction || hasStalePendingEvents) return;
    startAction("finish", "Finishing flow...");
    setPendingEvents([]);
    const sent = send({ type: "flow.finish" });
    if (!sent) {
      cancelActionSilently();
      return;
    }
    startActionTimeout("finish", "Finish timed out. The session is still connected.");
  };

  const handleRewindToCheckpoint = () => {
    if (hasPendingAction) return;
    startAction("reset", "Resetting to checkpoint...");
    setPendingEvents([]);
    const sent = send({
      type: "flow.rewind",
      rewind: {
        stepId: null,
      },
    });
    if (!sent) {
      cancelActionSilently();
      return;
    }
    startActionTimeout("reset", "Reset timed out. The session is still connected.", REWIND_ACTION_TIMEOUT_MS);
  };

  const handleContinueFromStep = (step: RecordedStep) => {
    if (hasPendingAction) return;
    const stepId = step.id ?? step.stepId;
    if (!stepId) return;
    startAction("continue", "Continuing from selected step...");
    const sent = send({
      type: "flow.rewind",
      rewind: {
        stepId,
      },
    });
    if (!sent) {
      cancelActionSilently();
      return;
    }
    startActionTimeout("continue", "Continue timed out. The session is still connected.", REWIND_ACTION_TIMEOUT_MS);
  };

  const handlePublishPendingStep = () => {
    if (!canSend || !flowStarted || hasPendingAction) return;
    startAction("publish", "Publishing typing step...");
    const sent = send({ type: "flow.publish_pending" });
    if (!sent) {
      cancelActionSilently();
      return;
    }
    startActionTimeout("publish", "Publish timed out. The session is still connected.");
  };

  const handleReportBug = () => {
    if (!jiraReportingEnabled || !bugTitle.trim() || !canFinishFlow || hasPendingAction || hasStalePendingEvents) return;
    startAction("bug", "Queueing bug flow...");
    setPendingEvents([]);
    const summary = [bugTitle.trim(), bugDescription.trim()].filter(Boolean).join("\n\n");
    const sent = send({
      type: "bug.report",
      bug: {
        summary,
        severity: bugSeverity,
        includeScreenshot: false,
        includeSteps: true,
      },
    });
    if (!sent) {
      cancelActionSilently();
      return;
    }
    startActionTimeout("bug", "Bug report timed out. The session is still connected.");
  };

  const handleConnect = () => {
    if (!selectedProject?.id || !selectedApplication?.id || !selectedVersion?.id) return;
    disconnectedByUserRef.current = false;

    connectManualSession.mutate(
      {
        projectId: selectedProject.id,
        applicationId: selectedApplication.id,
        versionId: selectedVersion.id,
      },
      {
        onSuccess: ({ sessionId: newSessionId, wsTicket }) => {
          navigate(
            `${manualSessionRoute(selectedProject.id, selectedApplication.id, selectedVersion.id, newSessionId)}?ticket=${encodeURIComponent(wsTicket)}`,
            {
              state: {
                applicationName: selectedApplication.name,
                applicationBaseUrl: selectedApplication.baseUrl ?? "",
                versionName: selectedVersion.version,
              },
            },
          );
        },
      },
    );
  };

  const handleDisconnect = (target: "start" | "applications" = "start") => {
    if (hasPendingAction && pendingAction !== "disconnect") return;
    startAction("disconnect", "Disconnecting session...");
    disconnectNavigateRef.current = target;
    disconnectedByUserRef.current = true;
    const sent = send({ type: "session.disconnect" });
    releaseConnection(connectionKey, true);
    resetSessionState();
    if (!sent) {
      finishDisconnect();
    }
  };

  const handleBack = () => {
    if (hasLiveSession && status !== "closed") {
      setConfirmation({ kind: "exit", target: "applications" });
      return;
    }
    navigate(ROUTES.APPLICATIONS);
  };

  const handleConfirmLeave = () => {
    if (confirmation?.kind !== "exit") return;
    handleDisconnect(confirmation.target);
  };

  const handleConnectionAction = () => {
    if (hasLiveSession && status !== "closed") {
      setConfirmation({ kind: "exit", target: "start" });
      return;
    }
    handleConnect();
  };

  const openFinishConfirmation = () => {
    if (!canFinishFlow || hasPendingAction) return;
    setConfirmation({ kind: "finish" });
  };

  const openBugConfirmation = () => {
    if (!canReportBug) return;
    setConfirmation({ kind: "bug" });
  };

  const handleConfirmModalAction = () => {
    if (!confirmation) return;
    if (confirmation.kind === "exit") {
      handleConfirmLeave();
      return;
    }
    if (confirmation.kind === "finish") {
      handleFinishFlow();
      return;
    }
    handleReportBug();
  };

  const handleApplicationChange = (applicationId: string | null) => {
    const application = applicationId ? (typedApplications.find((item) => item.id === applicationId) ?? null) : null;
    const version = application?.versions?.[0] ?? null;

    updateSearchParams(
      searchParams,
      setSearchParams,
      {
        appId: application?.id ?? null,
        versionId: version?.id ?? null,
      },
      false,
    );

    if (contextProjectId && application) {
      setSelectedApplicationContext(buildApplicationContext(contextProjectId, application, version));
    } else {
      setSelectedApplicationContext(null);
    }
  };

  const handleVersionChange = (versionId: string | null) => {
    const version = versionId ? (availableVersions.find((item) => item.id === versionId) ?? null) : null;
    updateSearchParams(searchParams, setSearchParams, { versionId: version?.id ?? null }, false);

    if (contextProjectId && selectedApplication) {
      setSelectedApplicationContext(buildApplicationContext(contextProjectId, selectedApplication, version));
    }
  };

  return (
    <main className={styles.shell}>
      <LiveSessionHeader
        title="Manual Recording"
        detail={`${appName} / ${versionName}${sessionId ? ` / ${sessionId}` : ""}`}
        sessionId={sessionId}
        currentUrl={currentUrl}
        currentTitle={currentTitle}
        isLive={isLive}
        statusLabel={statusLabel(status)}
        ttlRemainingLabel={ttlRemainingSeconds !== null ? `Idle ${formatElapsed(ttlRemainingSeconds)}` : null}
        elapsedLabel={formatElapsed(elapsedSeconds)}
        backLabel="Back to applications"
        onBack={handleBack}
      />

      <section className={styles.body}>
        <ManualSessionViewport
          canvasRef={canvasRef}
          viewport={viewport}
          hasFrame={hasFrame}
          error={error}
          hasLiveSession={hasLiveSession}
          status={status}
          onHover={sendHover}
          onMouseDown={(event) => sendMouse(event, "down")}
          onMouseUp={(event) => sendMouse(event, "up")}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
        />

        <ManualSessionPanel
          appName={appName}
          versionName={versionName}
          applications={typedApplications}
          selectedApplicationId={selectedApplicationId}
          versions={availableVersions}
          selectedVersionId={selectedVersionId}
          hasLiveSession={hasLiveSession}
          status={status}
          isConnecting={connectManualSession.isPending}
          hasPendingAction={hasPendingAction}
          pendingAction={pendingAction}
          canConnect={canConnect}
          currentUrl={currentUrl}
          currentTitle={currentTitle}
          activeTab={activeTab}
          actionFeedback={actionFeedback}
          canSend={canSend}
          flowStarted={flowStarted}
          canFinishFlow={canFinishFlow}
          pendingEventBlockerMessage={pendingEventBlockerMessage}
          flowMarker={flowMarker}
          lastFlowMessage={lastFlowMessage}
          visibleSteps={visibleSteps}
          jiraReportingEnabled={jiraReportingEnabled}
          jiraReportingMessage={jiraReportingMessage}
          bugTitle={bugTitle}
          bugDescription={bugDescription}
          bugSeverity={bugSeverity}
          canReportBug={canReportBug}
          onApplicationChange={handleApplicationChange}
          onVersionChange={handleVersionChange}
          onConnectionAction={handleConnectionAction}
          onTabChange={setActiveTab}
          onRewindToCheckpoint={handleRewindToCheckpoint}
          onStartFlow={handleStartFlow}
          onFinishFlow={openFinishConfirmation}
          onContinueFromStep={handleContinueFromStep}
          onPublishPendingStep={handlePublishPendingStep}
          onBugTitleChange={setBugTitle}
          onBugDescriptionChange={setBugDescription}
          onBugSeverityChange={setBugSeverity}
          onReportBug={openBugConfirmation}
          onBack={handleBack}
        />
      </section>

      {confirmation && (
        <ManualSessionConfirmationModal
          kind={confirmation.kind}
          pendingAction={pendingAction}
          onCancel={() => setConfirmation(null)}
          onConfirm={handleConfirmModalAction}
        />
      )}
    </main>
  );
}

export default ManualSession;
