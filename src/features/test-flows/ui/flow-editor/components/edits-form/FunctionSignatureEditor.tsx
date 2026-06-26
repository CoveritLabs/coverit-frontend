// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  FUNCTION_RUNTIME_HELPERS,
  type FlowEditorFunctionKind,
  type FunctionValidationDiagnostic,
  validateFunctionCode,
} from "./flow-editor-function-validation";
import styles from "../../FlowEditor.module.scss";

type FunctionSignatureEditorProps = {
  name: string;
  body: string;
  functionKind: FlowEditorFunctionKind;
  parameters: string[];
  returnType: string;
  availableStoreKeys: string[];
  onNameChange: (value: string) => void;
  onBodyChange: (value: string) => void;
};

export function FunctionSignatureEditor({
  name,
  body,
  functionKind,
  parameters,
  returnType,
  availableStoreKeys,
  onNameChange,
  onBodyChange,
}: FunctionSignatureEditorProps) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [nameWidth, setNameWidth] = useState(75);
  const [validating, setValidating] = useState(false);
  const [diagnostics, setDiagnostics] = useState<FunctionValidationDiagnostic[]>([]);
  const helperGroups = useMemo(() => Object.entries(FUNCTION_RUNTIME_HELPERS[functionKind]), [functionKind]);
  const storeKeySignature = useMemo(() => [...new Set(availableStoreKeys)].sort().join("\n"), [availableStoreKeys]);
  const normalizedStoreKeys = useMemo(() => (storeKeySignature ? storeKeySignature.split("\n") : []), [storeKeySignature]);

  useLayoutEffect(() => {
    if (measureRef.current) setNameWidth(measureRef.current.offsetWidth + 2);
  }, [name]);

  useEffect(() => {
    let cancelled = false;
    setValidating(true);

    const timeout = window.setTimeout(() => {
      validateFunctionCode({
        kind: functionKind,
        name,
        body,
        storeKeys: normalizedStoreKeys,
      })
        .then((nextDiagnostics) => {
          if (cancelled) return;
          setDiagnostics(nextDiagnostics);
        })
        .catch(() => {
          if (cancelled) return;
          setDiagnostics([
            {
              severity: "warning",
              message: "Function validation could not run in this browser session.",
            },
          ]);
        })
        .finally(() => {
          if (!cancelled) setValidating(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [body, functionKind, name, normalizedStoreKeys]);

  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === "warning");

  return (
    <>
      <div className={styles.functionSignature} aria-label="Function signature">
        <span className={styles.keyword}>function</span>
        <span className={styles.functionNameToken}>
          <span>{"{{"}</span>
          <span ref={measureRef} className={styles.hiddenMeasure}>
            {name || " "}
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            style={{ width: `${nameWidth}px` }}
            className={styles.functionInput}
          />
          <span>{"}}"}</span>
        </span>
        <span className={styles.punctuation}>(</span>
        {parameters.map((parameter, index) => (
          <span key={parameter}>
            <span className={styles.parameter}>{parameter}</span>
            {index < parameters.length - 1 ? <span className={styles.punctuation}>, </span> : null}
          </span>
        ))}
        <span className={styles.punctuation}>): </span>
        <span className={styles.type}>{returnType}</span>
        <span className={styles.brace}>{" {"}</span>
      </div>
      <textarea
        className={styles.editsCodeEditor}
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        spellCheck={false}
      />
      <code className={styles.brace}>{"}"}</code>
      <section className={styles.functionValidationPanel} aria-live="polite">
        <div className={styles.functionValidationHeader}>
          {errors.length > 0 || warnings.length > 0 ? (
            <AlertTriangle className={styles.functionValidationIconWarning} />
          ) : (
            <CheckCircle2 className={styles.functionValidationIconSuccess} />
          )}
          <span>
            {validating
              ? "Validating function..."
              : errors.length > 0
                ? `${errors.length} error${errors.length === 1 ? "" : "s"} found. Insert Draft is still available.`
                : warnings.length > 0
                  ? `${warnings.length} warning${warnings.length === 1 ? "" : "s"} found. Insert Draft is still available.`
                  : "No obvious function issues found."}
          </span>
        </div>
        {diagnostics.length > 0 ? (
          <ul className={styles.functionDiagnosticList}>
            {diagnostics.map((diagnostic, index) => (
              <li
                key={`${diagnostic.severity}-${diagnostic.line ?? "global"}-${diagnostic.column ?? "global"}-${index}`}
                className={
                  diagnostic.severity === "error"
                    ? styles.functionDiagnosticError
                    : styles.functionDiagnosticWarning
                }
              >
                <span className={styles.functionDiagnosticLocation}>
                  {diagnostic.line ? `Line ${diagnostic.line}${diagnostic.column ? `:${diagnostic.column}` : ""}` : "Function"}
                </span>
                <span>{diagnostic.message}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className={styles.functionHelperPanel}>
        <div className={styles.functionHelperHeading}>
          <Info className={styles.functionHelperIcon} />
          Available generated runtime helpers
        </div>
        {helperGroups.map(([group, helpers]) => (
          <div key={group} className={styles.functionHelperGroup}>
            <span className={styles.functionHelperGroupName}>{group}</span>
            <div className={styles.functionHelperList}>
              {helpers.map((helper) => (
                <span key={helper.signature} className={styles.functionHelperChip} title={helper.description}>
                  {helper.signature}
                </span>
              ))}
            </div>
          </div>
        ))}
        {normalizedStoreKeys.length > 0 ? (
          <div className={styles.functionHelperGroup}>
            <span className={styles.functionHelperGroupName}>store keys</span>
            <div className={styles.functionHelperList}>
              {normalizedStoreKeys.map((key) => (
                <span key={key} className={styles.functionHelperChip}>
                  {key}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
