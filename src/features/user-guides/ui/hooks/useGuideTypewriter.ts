// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useState } from "react";

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useGuideTypewriter(lines: string[], enabled: boolean) {
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function typeLines() {
      setTypedLines([]);
      setCurrentLine(0);
      setIsTyping(false);

      if (!enabled || lines.length === 0) return;

      setIsTyping(true);

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        if (cancelled) return;

        const line = lines[lineIndex] ?? "";
        setCurrentLine(lineIndex + 1);
        setTypedLines((previousLines) => {
          const nextLines = previousLines.slice(0, lineIndex);
          nextLines[lineIndex] = "";
          return nextLines;
        });

        for (let charIndex = 1; charIndex <= line.length; charIndex += 1) {
          if (cancelled) return;
          setTypedLines((previousLines) => {
            const nextLines = previousLines.slice(0, lineIndex + 1);
            nextLines[lineIndex] = line.slice(0, charIndex);
            return nextLines;
          });
          await wait(charIndex === line.length ? 120 : 15);
        }
      }

      if (!cancelled) {
        setCurrentLine(lines.length);
        setIsTyping(false);
      }
    }

    void typeLines();

    return () => {
      cancelled = true;
    };
  }, [enabled, lines]);

  const typedText = useMemo(() => typedLines.join("\n"), [typedLines]);

  return {
    typedText,
    currentLine,
    totalLines: lines.length,
    isTyping,
  };
}
