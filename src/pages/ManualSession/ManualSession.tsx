// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useUIStore } from "@app/store";
import { useConnectManualSession, useTargetApplications } from "@features/target-applications";
import { env } from "@shared/config/env";
import { ROUTES } from "@shared/config/routes";
import { AlertCircle, Bug, CircleStop, ListChecks, MousePointerClick, Play, Power, Wifi, WifiOff } from "lucide-react";
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
  x?: number;
  y?: number;
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

function stepLabel(event: RecordedEvent) {
  const action = event.action || "event";
  const target = event.accessibleName || event.text || event.selector || event.tag || "page";
  return `${action}: ${target}`;
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
  const [steps, setSteps] = useState<RecordedEvent[]>([]);
  const [bugSummary, setBugSummary] = useState("");
  const [bugSeverity, setBugSeverity] = useState("medium");
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [includeSteps, setIncludeSteps] = useState(true);

  const selectedApplication = typedApplications.find((application) => application.id === selectedApplicationId) ?? null;
  const availableVersions = selectedApplication?.versions ?? [];
  const selectedVersion = availableVersions.find((version) => version.id === selectedVersionId) ?? null;
  const hasLiveSession = Boolean(sessionId);
  const appName = state.applicationName || selectedApplication?.name || params.applicationId || "Select application";
  const versionName = state.versionName || selectedVersion?.version || params.versionId || "Select version";
  const isLive = status === "running" || status === "crawler.ready" || Boolean(connectedAt && status !== "closed");
  const canSend = wsRef.current?.readyState === WebSocket.OPEN;
  const canConnect = Boolean(selectedProject?.id && selectedApplication?.id && selectedVersion?.id);

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

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
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
        setFlowStarted(true);
        setFlowMarker(payload.timestamp ?? new Date().toISOString());
        setCurrentUrl((value) => payload.pageUrl ?? payload.url ?? value);
        setCurrentTitle((value) => payload.title ?? value);
      }

      if (payload.type === "recorded.event" && payload.event) {
        setSteps((current) => [payload.event as RecordedEvent, ...current]);
      }

      if (payload.type === "session.closed") {
        setStatus(payload.status ?? "closed");
      }

      if (payload.type === "error") {
        setError(payload.message ?? "Manual recording websocket error");
      }
    },
    [drawFrame, updateViewport],
  );

  useEffect(() => {
    if (!sessionId) {
      setStatus("idle");
      setError(null);
      return;
    }

    if (!ticket || !wsUrl) {
      setStatus("failed");
      setError("Manual recording ticket is missing or invalid.");
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
        setError("Invalid websocket message received.");
      }
    };

    ws.onerror = () => {
      setStatus("failed");
      setError("Manual recording websocket failed.");
    };

    ws.onclose = () => {
      forgetConnection(connectionKey, ws);
      wsRef.current = null;
      setConnectedAt(null);
      setStatus((current) =>
        disconnectedByUserRef.current ? "closed" : current === "failed" ? current : "disconnected",
      );
    };

    return () => {
      releaseConnection(connectionKey);
    };
  }, [connectionKey, handlePayload, sessionId, ticket, wsUrl]);

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
    send({ type: "flow.start" });
  };

  const handleConnect = () => {
    if (!selectedProject?.id || !selectedApplication?.id || !selectedVersion?.id) return;

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

  const handleDisconnect = () => {
    disconnectedByUserRef.current = true;
    send({ type: "session.disconnect" });
    releaseConnection(connectionKey, true);
    setStatus("closed");
  };

  const handleBack = () => {
    navigate(ROUTES.APPLICATIONS);
  };

  return (
    <main className={styles.shell}>
      <header className={styles.statusBar}>
        <div className={styles.recordingTitle}>
          <strong>Manual Recording</strong>
          <span>{sessionId}</span>
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

            {!hasLiveSession && (
              <button
                type="button"
                className={styles.connectButton}
                onClick={handleConnect}
                disabled={!canConnect || connectManualSession.isPending}
              >
                <Play className={styles.buttonIcon} />
                {connectManualSession.isPending ? "Connecting..." : "Connect"}
              </button>
            )}

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

          {activeTab === "record" ? (
            <div className={styles.tabContent}>
              <div className={styles.controls}>
                <button type="button" className={styles.dangerButton} onClick={handleDisconnect}>
                  <Power className={styles.buttonIcon} />
                  Disconnect
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleStartFlow}
                  disabled={!canSend || flowStarted}
                >
                  <Play className={styles.buttonIcon} />
                  {flowStarted ? "Flow Started" : "Start Flow"}
                </button>
              </div>

              <div className={styles.stepsHeader}>
                <span>Recorded Steps</span>
                <span className={styles.stepCount}>{steps.length}</span>
              </div>

              {flowMarker && (
                <div className={styles.flowMarker}>
                  <CircleStop className={styles.markerIcon} />
                  <span>{new Date(flowMarker).toLocaleTimeString()}</span>
                </div>
              )}

              <ol className={styles.stepList}>
                {steps.map((event, index) => (
                  <li key={event.id ?? `${event.timestamp}-${index}`} className={styles.step}>
                    <span className={styles.stepIndex}>{steps.length - index}</span>
                    <span className={styles.stepBody}>
                      <strong>{stepLabel(event)}</strong>
                      <span>
                        {event.pageUrl || currentUrl}
                        {typeof event.x === "number" && typeof event.y === "number"
                          ? ` at ${Math.round(event.x)}, ${Math.round(event.y)}`
                          : ""}
                      </span>
                    </span>
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

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={includeScreenshot}
                  onChange={(event) => setIncludeScreenshot(event.target.checked)}
                />
                <span>Screenshot</span>
              </label>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={includeSteps}
                  onChange={(event) => setIncludeSteps(event.target.checked)}
                />
                <span>Recorded steps</span>
              </label>

              <button type="button" className={styles.reportButton} disabled={!bugSummary.trim()}>
                Save Local Draft
              </button>
            </form>
          )}

          <button type="button" className={styles.backButton} onClick={handleBack}>
            Back to Applications
          </button>
        </aside>
      </section>
    </main>
  );
}

export default ManualSession;
