// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useUIStore } from "@app/store";
import { useConnectManualSession, useTargetApplications } from "@features/target-applications";
import { env } from "@shared/config/env";
import { ROUTES } from "@shared/config/routes";
import {
  AlertCircle,
  ArrowLeft,
  Bug,
  CheckCircle2,
  CircleStop,
  CornerDownRight,
  ListChecks,
  LoaderCircle,
  MousePointerClick,
  Play,
  Power,
  RotateCcw,
  Wifi,
  WifiOff,
} from "lucide-react";
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
import styles from "./ManualSession.module.scss";

const DEFAULT_VIEWPORT = { width: 1365, height: 768 };
const CLOSE_DELAY_MS = 300;

type SharedConnection = {
  ws: WebSocket;
  closeTimer?: number;
};

const sharedConnections = new Map<string, SharedConnection>();

type RouteParams = {
  projectId: string;
  applicationId: string;
  versionId: string;
  sessionId: string;
};

type LocationState = {
  applicationName?: string;
  applicationBaseUrl?: string;
  versionName?: string;
};

type ApplicationVersionView = {
  id: string;
  version: string;
};

type ApplicationView = {
  id: string;
  name: string;
  baseUrl?: string | null;
  versions?: ApplicationVersionView[];
};

type RecordedEvent = {
  id?: string;
  timestamp?: string;
  action?: string;
  selector?: string;
  tag?: string | null;
  text?: string;
  accessibleName?: string;
  pageUrl?: string;
  value?: string | null;
  inputType?: string;
  key?: string;
  fromUrl?: string;
  x?: number;
  y?: number;
};

type RecordedAction = {
  id?: string;
  type?: string;
  selector?: string;
  value?: string;
  description?: string;
};

type RecordedStep = {
  id?: string;
  stepId?: string;
  index?: number;
  flowRevision?: number;
  transitionId?: string;
  sourceStateHash?: string;
  targetStateHash?: string;
  sourceUrl?: string;
  targetUrl?: string;
  pageUrl?: string;
  title?: string;
  timestamp?: string;
  description?: string;
  action?: string;
  selector?: string;
  value?: string;
  events?: RecordedEvent[];
  actions?: RecordedAction[];
};

type VisibleStepItem = {
  key: string;
  index: string;
  label: string;
  detail: string;
  pending: boolean;
  finalizedEvent: boolean;
  canContinue: boolean;
  step: RecordedStep | null;
};

type ManualAction = "start" | "reset" | "continue" | "finish" | "bug" | "disconnect";

type ActionFeedback = {
  kind: "pending" | "success" | "error";
  message: string;
};

type WsPayload = {
  type?: string;
  status?: string;
  message?: string;
  dataUrl?: string;
  url?: string;
  pageUrl?: string;
  title?: string;
  timestamp?: string;
  flowId?: string;
  checkpointHash?: string;
  transitionIds?: string[];
  testFlowType?: string;
  stepCount?: number;
  flowRevision?: number;
  steps?: RecordedStep[];
  step?: RecordedStep;
  keptStepIds?: string[];
  removedStepIds?: string[];
  stateHash?: string;
  viewport?: {
    width?: number;
    height?: number;
  };
  event?: RecordedEvent;
};

function acquireConnection(key: string, url: string) {
  const existing = sharedConnections.get(key);
  if (existing && existing.ws.readyState !== WebSocket.CLOSING && existing.ws.readyState !== WebSocket.CLOSED) {
    if (existing.closeTimer) {
      window.clearTimeout(existing.closeTimer);
      existing.closeTimer = undefined;
    }
    return existing.ws;
  }

  const ws = new WebSocket(url);
  sharedConnections.set(key, { ws });
  return ws;
}

function releaseConnection(key: string, closeNow = false) {
  const entry = sharedConnections.get(key);
  if (!entry) return;

  if (entry.closeTimer) {
    window.clearTimeout(entry.closeTimer);
    entry.closeTimer = undefined;
  }

  if (closeNow) {
    entry.ws.close(1000, "Manual recording closed");
    sharedConnections.delete(key);
    return;
  }

  entry.closeTimer = window.setTimeout(() => {
    entry.ws.close(1000, "Manual recording page left");
    sharedConnections.delete(key);
  }, CLOSE_DELAY_MS);
}

function forgetConnection(key: string, ws: WebSocket) {
  const entry = sharedConnections.get(key);
  if (entry?.ws === ws) {
    sharedConnections.delete(key);
  }
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function statusLabel(status: string) {
  if (status === "crawler_connected") return "Crawler Connected";
  if (status === "frontend_connected") return "Frontend Connected";
  if (status === "starting_browser") return "Starting Browser";
  if (status === "running") return "Live";
  if (status === "crawler_disconnected") return "Crawler Disconnected";
  if (status === "disconnect_pending") return "Disconnect Pending";
  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function buildWsUrl(sessionId: string, ticket: string) {
  const base = env.wsUrl?.replace(/\/$/, "");
  if (!base) return "";
  return `${base}/ws/manual-recordings/${encodeURIComponent(sessionId)}?ticket=${encodeURIComponent(ticket)}`;
}

function stepLabel(step: RecordedStep) {
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

function eventKey(event: RecordedEvent) {
  return event.id ?? `${event.timestamp ?? ""}:${event.action ?? ""}:${event.selector ?? ""}:${event.key ?? ""}`;
}

function eventLabel(event: RecordedEvent) {
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

function stepEventKeys(step: RecordedStep) {
  return new Set((step.events ?? []).map(eventKey).filter(Boolean));
}

function stepKey(step: RecordedStep) {
  return step.id ?? step.stepId ?? "";
}

function numericRevision(value: unknown) {
  const revision = Number(value);
  return Number.isFinite(revision) ? revision : null;
}

function manualSessionRoute(projectId: string, applicationId: string, versionId: string, sessionId: string) {
  return ROUTES.MANUAL_RECORDING.replace(":projectId", projectId)
    .replace(":applicationId", applicationId)
    .replace(":versionId", versionId)
    .replace(":sessionId", sessionId);
}

function ManualSession() {
  const params = useParams<RouteParams>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const selectedProject = useUIStore((state) => state.selectedProject);
  const { data: applications = [] } = useTargetApplications(selectedProject?.id ?? null);
  const connectManualSession = useConnectManualSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const disconnectedByUserRef = useRef(false);
  const disconnectNavigateRef = useRef<"start" | "applications" | null>(null);
  const flowRevisionRef = useRef(0);
  const pendingActionRef = useRef<ManualAction | null>(null);
  const state = (location.state ?? {}) as LocationState;
  const typedApplications = useMemo(() => applications as ApplicationView[], [applications]);

  const sessionId = params.sessionId ?? "";
  const ticket = searchParams.get("ticket") ?? "";
  const connectionKey = `${sessionId}:${ticket}`;
  const wsUrl = useMemo(() => (sessionId && ticket ? buildWsUrl(sessionId, ticket) : ""), [sessionId, ticket]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(params.applicationId ?? null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(params.versionId ?? null);

  const [activeTab, setActiveTab] = useState<"record" | "bug">("record");
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [currentUrl, setCurrentUrl] = useState(state.applicationBaseUrl ?? "");
  const [currentTitle, setCurrentTitle] = useState("");
  const [hasFrame, setHasFrame] = useState(false);
  const [flowStarted, setFlowStarted] = useState(false);
  const [flowMarker, setFlowMarker] = useState<string | null>(null);
  const [lastFlowMessage, setLastFlowMessage] = useState<string | null>(null);
  const [steps, setSteps] = useState<RecordedStep[]>([]);
  const [pendingEvents, setPendingEvents] = useState<RecordedEvent[]>([]);
  const [bugSummary, setBugSummary] = useState("");
  const [bugSeverity, setBugSeverity] = useState("medium");
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [pendingAction, setPendingActionState] = useState<ManualAction | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

  const selectedApplication = typedApplications.find((application) => application.id === selectedApplicationId) ?? null;
  const availableVersions = selectedApplication?.versions ?? [];
  const selectedVersion = availableVersions.find((version) => version.id === selectedVersionId) ?? null;
  const hasLiveSession = Boolean(sessionId);
  const appName = state.applicationName || selectedApplication?.name || params.applicationId || "Select application";
  const versionName = state.versionName || selectedVersion?.version || params.versionId || "Select version";
  const isLive = status === "running" || status === "crawler.ready" || Boolean(connectedAt && status !== "closed");
  const canSend = wsRef.current?.readyState === WebSocket.OPEN;
  const canConnect = Boolean(selectedProject?.id && selectedApplication?.id && selectedVersion?.id);
  const hasRecordedSteps = steps.length > 0;
  const canFinishFlow = Boolean(canSend && flowStarted && hasRecordedSteps);
  const hasPendingAction = pendingAction !== null;
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
        step: null,
      })),
    ],
    [currentUrl, pendingEvents, steps],
  );

  useEffect(() => {
    if (params.applicationId) {
      setSelectedApplicationId(params.applicationId);
      return;
    }

    if (!typedApplications.length) {
      setSelectedApplicationId(null);
      return;
    }

    if (!selectedApplicationId || !typedApplications.some((application) => application.id === selectedApplicationId)) {
      setSelectedApplicationId(typedApplications[0].id);
    }
  }, [params.applicationId, selectedApplicationId, typedApplications]);

  useEffect(() => {
    if (params.versionId) {
      setSelectedVersionId(params.versionId);
      return;
    }

    if (!availableVersions.length) {
      setSelectedVersionId(null);
      return;
    }

    if (!selectedVersionId || !availableVersions.some((version) => version.id === selectedVersionId)) {
      setSelectedVersionId(availableVersions[0].id);
    }
  }, [availableVersions, params.versionId, selectedVersionId]);

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
      setPendingAction(null);
      setActionFeedback({ kind: "success", message });
    },
    [setPendingAction],
  );

  const failAction = useCallback(
    (message: string) => {
      setPendingAction(null);
      setActionFeedback({ kind: "error", message });
    },
    [setPendingAction],
  );

  const resetSessionState = useCallback(() => {
    wsRef.current = null;
    setConnectedAt(null);
    setElapsedSeconds(0);
    setFlowStarted(false);
    setFlowMarker(null);
    setLastFlowMessage(null);
    setSteps([]);
    setPendingEvents([]);
    setHasFrame(false);
    setCurrentTitle("");
    setError(null);
    setConfirmLeaveOpen(false);
    setStatus("closed");
  }, []);

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
          const nextEvent = payload.event as RecordedEvent;
          const nextEventKey = eventKey(nextEvent);
          if (nextEventKey && current.some((event) => eventKey(event) === nextEventKey)) return current;
          return [...current, nextEvent];
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
          const finalizedEventKeys = stepEventKeys(payload.step as RecordedStep);
          if (finalizedEventKeys.size === 0) return current;
          return current.filter((event) => !finalizedEventKeys.has(eventKey(event)));
        });
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
        completeAction(pendingActionRef.current === "continue" ? "Continued from selected step." : "Returned to checkpoint.");
      }

      if (payload.type === "flow.completed") {
        setFlowStarted(false);
        setPendingEvents([]);
        const count = payload.stepCount ?? payload.transitionIds?.length ?? 0;
        const message = `Manual flow queued with ${count} ${count === 1 ? "step" : "steps"}.`;
        setLastFlowMessage(message);
        completeAction(message);
      }

      if (payload.type === "bug.reported") {
        setFlowStarted(false);
        setPendingEvents([]);
        const count = payload.stepCount ?? payload.transitionIds?.length ?? 0;
        const message = `Bug flow queued with ${count} ${count === 1 ? "step" : "steps"}.`;
        setLastFlowMessage(message);
        completeAction(message);
      }

      if (payload.type === "session.closed") {
        setStatus(payload.status ?? "closed");
        setPendingEvents([]);
        finishDisconnect();
      }

      if (payload.type === "error") {
        const message = payload.message ?? "Manual recording websocket error";
        setError(message);
        failAction(message);
      }
    },
    [completeAction, drawFrame, failAction, finishDisconnect, updateViewport],
  );

  useEffect(() => {
    if (!sessionId) {
      flowRevisionRef.current = 0;
      setSteps([]);
      setPendingEvents([]);
      setPendingAction(null);
      setActionFeedback(null);
      setStatus("idle");
      setError(null);
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
  }, [connectionKey, failAction, finishDisconnect, handlePayload, sessionId, setPendingAction, ticket, wsUrl]);

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
    (event: MouseEvent<HTMLCanvasElement>, action: "move" | "down" | "up") => {
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
    if (!send({ type: "flow.start" })) {
      failAction("Crawler connection is not ready.");
    }
  };

  const handleFinishFlow = () => {
    if (hasPendingAction) return;
    startAction("finish", "Finishing flow...");
    setPendingEvents([]);
    if (!send({ type: "flow.finish" })) {
      failAction("Crawler connection is not ready.");
    }
  };

  const handleRewindToCheckpoint = () => {
    if (hasPendingAction) return;
    startAction("reset", "Resetting to checkpoint...");
    setPendingEvents([]);
    if (!send({
      type: "flow.rewind",
      rewind: {
        stepId: null,
      },
    })) {
      failAction("Crawler connection is not ready.");
    }
  };

  const handleContinueFromStep = (step: RecordedStep) => {
    if (hasPendingAction) return;
    const stepId = step.id ?? step.stepId;
    if (!stepId) return;
    startAction("continue", "Continuing from selected step...");
    if (!send({
      type: "flow.rewind",
      rewind: {
        stepId,
      },
    })) {
      failAction("Crawler connection is not ready.");
    }
  };

  const handleReportBug = () => {
    if (!bugSummary.trim() || hasPendingAction) return;
    startAction("bug", "Queueing bug flow...");
    setPendingEvents([]);
    if (!send({
      type: "bug.report",
      bug: {
        summary: bugSummary.trim(),
        severity: bugSeverity,
        includeScreenshot: false,
        includeSteps: true,
      },
    })) {
      failAction("Crawler connection is not ready.");
    }
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
    if (!sent) {
      finishDisconnect();
    }
  };

  const handleBack = () => {
    if (hasLiveSession && status !== "closed") {
      setConfirmLeaveOpen(true);
      return;
    }
    navigate(ROUTES.APPLICATIONS);
  };

  const handleConfirmLeave = () => {
    handleDisconnect("applications");
  };

  const handleConnectionAction = () => {
    if (hasLiveSession && status !== "closed") {
      handleDisconnect();
      return;
    }
    handleConnect();
  };

  return (
    <main className={styles.shell}>
      <header className={styles.statusBar}>
        <div className={styles.headerIdentity}>
          <button type="button" className={styles.headerBackButton} onClick={handleBack} aria-label="Back to applications">
            <ArrowLeft className={styles.buttonIcon} />
          </button>
          <div className={styles.recordingTitle}>
            <strong>Manual Recording</strong>
            <span>
              {appName} / {versionName}
              {sessionId ? ` / ${sessionId}` : ""}
            </span>
          </div>
        </div>

        <div className={styles.statusCluster}>
          <span className={styles.urlText} title={currentUrl}>
            {currentTitle || currentUrl || sessionId}
          </span>
          <span className={styles.statusGroup}>
            {isLive ? <Wifi className={styles.statusIcon} /> : <WifiOff className={styles.statusIcon} />}
            <span className={isLive ? styles.statusDotLive : styles.statusDotIdle} />
            <span className={styles.statusText}>{statusLabel(status)}</span>
          </span>
          <span className={styles.timer}>{formatElapsed(elapsedSeconds)}</span>
        </div>
      </header>

      <section className={styles.body}>
        <div className={styles.viewportWrapper}>
          <div className={styles.viewportFrame}>
            {!hasFrame && (
              <div className={styles.viewportEmpty}>
                {error ? (
                  <AlertCircle className={styles.emptyIcon} />
                ) : (
                  <MousePointerClick className={styles.emptyIcon} />
                )}
                <span>
                  {error ?? (hasLiveSession ? statusLabel(status) : "Select an application and version, then connect.")}
                </span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={viewport.width}
              height={viewport.height}
              tabIndex={0}
              className={styles.browserCanvas}
              onContextMenu={(event) => event.preventDefault()}
              onMouseMove={(event) => sendMouse(event, "move")}
              onMouseDown={(event) => {
                event.preventDefault();
                canvasRef.current?.focus();
                sendMouse(event, "down");
              }}
              onMouseUp={(event) => {
                event.preventDefault();
                sendMouse(event, "up");
              }}
              onWheel={handleWheel}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <aside className={styles.panel}>
          <section className={styles.sidebarContext}>
            <div className={styles.sidebarContextHeader}>
              <span className={styles.contextEyebrow}>Session Filters</span>
              <strong>Recording Target</strong>
              <span className={styles.targetSummary}>
                {appName} / {versionName}
              </span>
            </div>

            <label className={styles.selectGroup}>
              <span className={styles.selectLabel}>Application</span>
              <select
                value={selectedApplicationId ?? ""}
                disabled={hasLiveSession || typedApplications.length === 0}
                onChange={(event) => setSelectedApplicationId(event.target.value || null)}
              >
                {typedApplications.length === 0 && <option value="">No applications</option>}
                {typedApplications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.selectGroup}>
              <span className={styles.selectLabel}>Version</span>
              <select
                value={selectedVersionId ?? ""}
                disabled={hasLiveSession || availableVersions.length === 0}
                onChange={(event) => setSelectedVersionId(event.target.value || null)}
              >
                {availableVersions.length === 0 && <option value="">No versions</option>}
                {availableVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.version}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className={hasLiveSession && status !== "closed" ? styles.dangerButton : styles.connectButton}
              onClick={handleConnectionAction}
              disabled={(!hasLiveSession && !canConnect) || connectManualSession.isPending || hasPendingAction}
            >
              {connectManualSession.isPending || pendingAction === "disconnect" ? (
                <LoaderCircle className={styles.spinnerIcon} />
              ) : hasLiveSession && status !== "closed" ? (
                <Power className={styles.buttonIcon} />
              ) : (
                <Play className={styles.buttonIcon} />
              )}
              {hasLiveSession && status !== "closed"
                ? pendingAction === "disconnect"
                  ? "Disconnecting..."
                  : "Disconnect"
                : connectManualSession.isPending
                  ? "Connecting..."
                  : "Connect"}
            </button>

            <div className={styles.currentPage}>
              <span className={styles.selectLabel}>Current Page</span>
              <span title={currentUrl}>{currentTitle || currentUrl || "Waiting for browser..."}</span>
            </div>
          </section>

          <div className={styles.tabBar}>
            <button
              type="button"
              className={activeTab === "record" ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab("record")}
            >
              <ListChecks className={styles.tabIcon} />
              Record
            </button>
            <button
              type="button"
              className={activeTab === "bug" ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab("bug")}
            >
              <Bug className={styles.tabIcon} />
              Report Bug
            </button>
          </div>

          {actionFeedback && (
            <div
              className={
                actionFeedback.kind === "error"
                  ? styles.actionFeedbackError
                  : actionFeedback.kind === "success"
                    ? styles.actionFeedbackSuccess
                    : styles.actionFeedbackPending
              }
            >
              {actionFeedback.kind === "pending" ? (
                <LoaderCircle className={styles.spinnerIcon} />
              ) : actionFeedback.kind === "error" ? (
                <AlertCircle className={styles.feedbackIcon} />
              ) : (
                <CheckCircle2 className={styles.feedbackIcon} />
              )}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          {activeTab === "record" ? (
            <div className={styles.tabContent}>
              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleRewindToCheckpoint}
                  disabled={!canSend || !flowStarted || hasPendingAction}
                >
                  {pendingAction === "reset" ? (
                    <LoaderCircle className={styles.spinnerIcon} />
                  ) : (
                    <RotateCcw className={styles.buttonIcon} />
                  )}
                  {pendingAction === "reset" ? "Resetting..." : "Reset"}
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleStartFlow}
                  disabled={!canSend || flowStarted || hasPendingAction}
                >
                  {pendingAction === "start" ? (
                    <LoaderCircle className={styles.spinnerIcon} />
                  ) : (
                    <Play className={styles.buttonIcon} />
                  )}
                  {pendingAction === "start" ? "Starting..." : flowStarted ? "Started" : "Start"}
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleFinishFlow}
                  disabled={!canFinishFlow || hasPendingAction}
                >
                  {pendingAction === "finish" ? (
                    <LoaderCircle className={styles.spinnerIcon} />
                  ) : (
                    <CheckCircle2 className={styles.buttonIcon} />
                  )}
                  {pendingAction === "finish" ? "Finishing..." : "Finish"}
                </button>
              </div>

              <div className={styles.stepsHeader}>
                <span>Recorded Steps</span>
                <span className={styles.stepCount}>{visibleSteps.length}</span>
              </div>

              {flowMarker && (
                <div className={styles.flowMarker}>
                  <CircleStop className={styles.markerIcon} />
                  <span>{new Date(flowMarker).toLocaleTimeString()}</span>
                </div>
              )}

              {lastFlowMessage && (
                <div className={styles.flowMarker}>
                  <CheckCircle2 className={styles.markerIcon} />
                  <span>{lastFlowMessage}</span>
                </div>
              )}

              <ol className={styles.stepList}>
                {visibleSteps.map((item) => (
                  <li
                    key={item.key}
                    className={item.pending ? styles.stepPending : item.finalizedEvent ? styles.stepEvent : styles.step}
                  >
                    <span className={styles.stepIndex}>{item.index}</span>
                    <span className={styles.stepBody}>
                      <strong>{item.label}</strong>
                      <span>
                        {item.detail}
                        {item.pending ? " / pending" : ""}
                      </span>
                    </span>
                    {item.canContinue && item.step ? (
                      <button
                        type="button"
                        className={styles.stepActionButton}
                        onClick={() => handleContinueFromStep(item.step as RecordedStep)}
                        disabled={!canSend || !flowStarted || hasPendingAction}
                      >
                        {pendingAction === "continue" ? (
                          <LoaderCircle className={styles.spinnerIcon} />
                        ) : (
                          <CornerDownRight className={styles.stepActionIcon} />
                        )}
                        {pendingAction === "continue" ? "Continuing..." : "Continue"}
                      </button>
                    ) : (
                      <span className={item.pending ? styles.pendingBadge : styles.recordedBadge}>
                        {item.pending ? "Pending" : "Recorded"}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <form className={styles.tabContent} onSubmit={(event) => event.preventDefault()}>
              <label className={styles.field}>
                <span>Summary</span>
                <textarea value={bugSummary} onChange={(event) => setBugSummary(event.target.value)} rows={5} />
              </label>

              <label className={styles.field}>
                <span>Severity</span>
                <select value={bugSeverity} onChange={(event) => setBugSeverity(event.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>

              <button
                type="button"
                className={styles.reportButton}
                disabled={!bugSummary.trim() || !canFinishFlow || hasPendingAction}
                onClick={handleReportBug}
              >
                {pendingAction === "bug" && <LoaderCircle className={styles.spinnerIcon} />}
                {pendingAction === "bug" ? "Queueing..." : "Queue Bug Flow"}
              </button>
            </form>
          )}

          <button type="button" className={styles.backButton} onClick={handleBack}>
            Back to Applications
          </button>
        </aside>
      </section>

      {confirmLeaveOpen && (
        <div className={styles.dialogOverlay} onMouseDown={() => setConfirmLeaveOpen(false)}>
          <section
            className={styles.confirmDialog}
            role="dialog"
            aria-modal="true"
            aria-label="Disconnect manual session"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.confirmHeader}>
              <AlertCircle className={styles.confirmIcon} />
              <div>
                <strong>Disconnect this session?</strong>
                <span>The browser session will be closed before returning to Applications.</span>
              </div>
            </div>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setConfirmLeaveOpen(false)}
                disabled={hasPendingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleConfirmLeave}
                disabled={hasPendingAction}
              >
                {pendingAction === "disconnect" && <LoaderCircle className={styles.spinnerIcon} />}
                {pendingAction === "disconnect" ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default ManualSession;
