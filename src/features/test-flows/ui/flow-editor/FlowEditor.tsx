// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useUIStore } from "@app/store";
import {
  useConnectFlowEditor,
  useFlowEditor,
  useSaveFlowEditorSteps,
} from "@features/test-flows/model/queries/useTestFlows";
import type { FlowEditorDraftStep, FlowEditorElementRef } from "@features/test-flows/model/types/test-flows.types";
import { ROUTES } from "@shared/config/routes";
import { formatElapsed, statusLabel } from "@shared/lib/live-session-formatters";
import { LiveSessionHeader } from "@shared/ui";
import type { MouseEvent, WheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  buildDesignClassTokenOptions,
  buildElementTokenOptions,
  mergeElementCatalog,
} from "../../lib/flow-editor-token-options";
import { ElementInfoDrawer } from "./components/ElementInfoDrawer";
import { FlowEditorSidebar } from "./components/FlowEditorSidebar";
import { FlowEditorViewport } from "./components/FlowEditorViewport";
import { FlowStepList } from "./components/FlowStepList";
import {
  ASSERTION_OPERATORS,
  DESIGN_CLASS_OPERATION_TYPES,
  ELEMENT_HOOK_COMMANDS,
  HOOK_COMMANDS,
} from "./components/edits-form/flow-editor-edit-types";
import { FlowEditorEditsForm } from "./components/edits-form/FlowEditorEditsForm";
import type { EditorPosition, FlowEditorPanelTab, WsPayload } from "./flow-editor.types";
import { buildWsUrl, compactId, computePriorKeys, DEFAULT_VIEWPORT, positionKey } from "./flow-editor-utils";
import styles from "./FlowEditor.module.scss";

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

  const [activeTab, setActiveTab] = useState<FlowEditorPanelTab>("flow");
  const [draftSteps, setDraftSteps] = useState<FlowEditorDraftStep[]>([]);
  const [activePosition, setActivePosition] = useState<EditorPosition | null>(null);
  const [selectedElement, setSelectedElement] = useState<FlowEditorElementRef | null>(null);
  const [hoveredElement, setHoveredElement] = useState<FlowEditorElementRef | null>(null);
  const [inspectorElements, setInspectorElements] = useState<FlowEditorElementRef[]>([]);
  const [inspectorEnabled, setInspectorEnabled] = useState(true);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);
  const [positionLoading, setPositionLoading] = useState(false);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [hasFrame, setHasFrame] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");

  const transitionSteps = useMemo(() => editorQuery.data?.transitionSteps ?? [], [editorQuery.data?.transitionSteps]);
  const flow = editorQuery.data?.flow ?? null;
  const goBack = useCallback(
    () => navigate(`${ROUTES.TEST_FLOWS}?appId=${encodeURIComponent(applicationId)}`),
    [applicationId, navigate],
  );

  useEffect(() => {
    if (!editorQuery.data) return;
    setDraftSteps(editorQuery.data.editorSteps);
    setInspectorElements(mergeElementCatalog(editorQuery.data.editorSteps.map((step) => step.element)));
  }, [editorQuery.data]);

  useEffect(() => {
    if (!inspectorEnabled) setHoveredElement(null);
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

  const rememberElement = useCallback((element: FlowEditorElementRef | null | undefined) => {
    if (!element) return;
    setInspectorElements((current) => mergeElementCatalog([...current, element]));
  }, []);

  const updateViewport = useCallback((nextViewport: WsPayload["viewport"]) => {
    const width = Number(nextViewport?.width);
    const height = Number(nextViewport?.height);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      setViewport({ width, height });
    }
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
        if (pending) send({ type: "editor.open_position", position: pending });
      }

      if (payload.type === "position.ready") {
        setStatus("position.ready");
        setPositionLoading(false);
        setCurrentUrl(payload.pageUrl ?? "");
        setCurrentTitle(payload.title ?? "");
        if (payload.position) setActivePosition(payload.position);
        updateViewport(payload.viewport);
      }

      if (payload.type === "browser.frame" && payload.dataUrl) {
        setPositionLoading(false);
        updateViewport(payload.viewport);
        drawFrame(payload.dataUrl);
      }

      if (payload.type === "inspector.hovered") {
        setHoveredElement(payload.element ?? null);
        rememberElement(payload.element);
      }

      if (payload.type === "inspector.selected") {
        setSelectedElement(payload.element ?? null);
        rememberElement(payload.element);
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
    [drawFrame, rememberElement, send, updateViewport],
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
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "session.disconnect" }));
      ws?.close(1000, "Flow editor page left");
    },
    [],
  );

  const hasDirtyDrafts = useMemo(() => {
    const source = editorQuery.data?.editorSteps ?? [];
    return JSON.stringify(source) !== JSON.stringify(draftSteps);
  }, [draftSteps, editorQuery.data?.editorSteps]);

  const elementOptions = useMemo(
    () =>
      buildElementTokenOptions([
        ...inspectorElements,
        ...draftSteps.map((step) => step.element),
        selectedElement,
        hoveredElement,
      ]),
    [draftSteps, hoveredElement, inspectorElements, selectedElement],
  );
  const designClassOptions = useMemo(() => buildDesignClassTokenOptions(draftSteps), [draftSteps]);

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

  const priorKeysMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const step of draftSteps) map.set(step.id, computePriorKeys(step, draftsByPosition, transitionSteps));
    return map;
  }, [draftSteps, draftsByPosition, transitionSteps]);

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
    send({ type: "viewport.scroll", scroll: { deltaX: event.deltaX, deltaY: event.deltaY } });
  };

  const insertDraft = (step: FlowEditorDraftStep) => {
    if (step.element) setInspectorElements((current) => mergeElementCatalog([...current, step.element]));
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
      <LiveSessionHeader
        title="Flow Editor"
        detail={`${flow ? `TestFlow #${compactId(flow.id)}` : "Loading TestFlow"}${
          flow?.appVersionName ? ` / ${flow.appVersionName}` : ""
        }${flowId ? ` / ${flowId}` : ""}`}
        sessionId={flowId}
        currentUrl={currentUrl}
        currentTitle={currentTitle}
        isLive={status === "ready" || status === "position.ready"}
        statusLabel={statusLabel(error ? "failed" : status)}
        elapsedLabel={formatElapsed(0)}
        backLabel="Back to TestFlows"
        onBack={goBack}
      />

      <section className={styles.body}>
        <FlowEditorViewport
          canvasRef={canvasRef}
          viewport={viewport}
          hasFrame={hasFrame}
          error={error}
          editorLoading={editorQuery.isLoading}
          connecting={connectMutation.isPending}
          activePosition={activePosition}
          positionLoading={positionLoading}
          inspectorEnabled={inspectorEnabled}
          selectedElement={selectedElement}
          hoveredElement={hoveredElement}
          transitionSteps={transitionSteps}
          onMouseMove={handleCanvasMove}
          onMouseDown={handleCanvasClick}
          onWheel={handleCanvasWheel}
        />

        <FlowEditorSidebar
          flow={flow}
          activeTab={activeTab}
          transitionCount={transitionSteps.length}
          draftCount={draftSteps.length}
          hasDirtyDrafts={hasDirtyDrafts}
          inspectorEnabled={inspectorEnabled}
          saving={saveMutation.isPending}
          onTabChange={setActiveTab}
          onToggleInspector={() => setInspectorEnabled((enabled) => !enabled)}
          onSave={saveDrafts}
          onBack={goBack}
          flowContent={
            <div className={styles.tabContent}>
              <div className={styles.stepsHeader}>
                <span>Flow Steps</span>
                <span className={styles.stepCount}>{transitionSteps.length + draftSteps.length}</span>
              </div>
              <FlowStepList
                transitionSteps={transitionSteps}
                draftSteps={draftSteps}
                activePosition={activePosition}
                positionLoading={positionLoading}
                priorKeysMap={priorKeysMap}
                onOpenPosition={openPosition}
                onRemoveDraft={removeDraft}
              />
            </div>
          }
          editorContent={
            <div className={`${styles.tabContent} ${styles.editorTabContent}`}>
              <div className={styles.editorTabScroll}>
                <FlowEditorEditsForm
                  position={activePosition}
                  transitionSteps={transitionSteps}
                  selectedElement={selectedElement}
                  positionLoading={positionLoading}
                  elementOptions={elementOptions}
                  designClassOptions={designClassOptions}
                  designOperationTypes={DESIGN_CLASS_OPERATION_TYPES}
                  assertionOperators={ASSERTION_OPERATORS}
                  hookCommands={HOOK_COMMANDS}
                  elementHookCommands={ELEMENT_HOOK_COMMANDS}
                  onInsert={insertDraft}
                />
              </div>
              <ElementInfoDrawer
                selectedElement={selectedElement}
                isOpen={inspectorDrawerOpen}
                onToggle={() => setInspectorDrawerOpen((current) => !current)}
              />
            </div>
          }
        />
      </section>
    </main>
  );
}
