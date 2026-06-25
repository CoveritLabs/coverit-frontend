// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useLayoutEffect, useRef, useState } from "react";
import styles from "../../FlowEditor.module.scss";

type FunctionSignatureEditorProps = {
  name: string;
  body: string;
  parameters: string[];
  returnType: string;
  onNameChange: (value: string) => void;
  onBodyChange: (value: string) => void;
};

export function FunctionSignatureEditor({
  name,
  body,
  parameters,
  returnType,
  onNameChange,
  onBodyChange,
}: FunctionSignatureEditorProps) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [nameWidth, setNameWidth] = useState(75);

  useLayoutEffect(() => {
    if (measureRef.current) setNameWidth(measureRef.current.offsetWidth + 2);
  }, [name]);

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
    </>
  );
}
