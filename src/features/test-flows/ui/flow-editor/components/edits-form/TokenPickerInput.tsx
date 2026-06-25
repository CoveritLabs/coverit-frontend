// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { TokenPickerOption } from "@features/test-flows/lib/flow-editor-token-options";
import { Badge } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import styles from "./TokenPickerInput.module.scss";

type TokenPickerInputProps<TOption extends TokenPickerOption> = {
  options: TOption[];
  value: TOption | null;
  onChange: (value: TOption | null) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
};

function optionMatches(option: TokenPickerOption, query: string) {
  const normalized = query.trim().toLowerCase().replace(/[{}]/g, "");
  if (!normalized) return true;

  if (option.name.toLowerCase().includes(normalized)) return true;
  return option.kind === "element" && option.selector.toLowerCase().includes(normalized);
}

export function TokenPickerInput<TOption extends TokenPickerOption>({
  options,
  value,
  onChange,
  placeholder = "Pick token",
  emptyLabel = "No matches",
  disabled = false,
  className,
}: TokenPickerInputProps<TOption>) {
  const id = useId();
  const listboxId = `token-picker-${id}-listbox`;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filteredOptions = useMemo(() => options.filter((option) => optionMatches(option, query)), [options, query]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length, query]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        if (!value) setQuery("");
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [value]);

  const selectOption = (option: TOption) => {
    onChange(option);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const clearValue = () => {
    onChange(null);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (nextQuery: string) => {
    if (value) onChange(null);
    setQuery(nextQuery);
    setOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => (filteredOptions.length ? (current + 1) % filteredOptions.length : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) =>
        filteredOptions.length ? (current - 1 + filteredOptions.length) % filteredOptions.length : 0,
      );
      return;
    }

    if (event.key === "Enter") {
      if (!open) return;
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option) selectOption(option as TOption);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      if (!value) setQuery("");
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(styles.wrapper, open && styles.open, disabled && styles.disabled, className)}
    >
      <div className={cn(styles.control, value && styles.controlFilled)} onClick={() => inputRef.current?.focus()}>
        {value ? (
          <span
            className={cn(styles.tokenChip, value.kind === "element" ? styles.elementToken : styles.variableToken)}
          >
            {value.token}
            <button type="button" className={styles.clearButton} onClick={clearValue} disabled={disabled}>
              <X size={12} strokeWidth={1.8} />
            </button>
          </span>
        ) : null}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${listboxId}-option-${highlightedIndex}` : undefined}
          disabled={disabled}
          value={value ? "" : query}
          placeholder={value ? "" : placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open ? (
        <ul id={listboxId} className={styles.menu} role="listbox">
          {filteredOptions.length === 0 ? (
            <li className={styles.emptyOption}>{emptyLabel}</li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                id={`${listboxId}-option-${index}`}
                key={`${option.kind}:${option.name}:${option.token}`}
                role="option"
                aria-selected={value?.token === option.token}
                className={cn(
                  styles.option,
                  index === highlightedIndex && styles.optionHighlighted,
                  value?.token === option.token && styles.optionSelected,
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option as TOption);
                }}
              >
                <span className={styles.optionText}>
                  <strong>{option.name}</strong>
                  {option.kind === "element" ? <small>{option.selector}</small> : null}
                </span>
                {option.kind === "variable" ? (
                  <Badge variant="outline" className={styles.optionBadge}>
                    design class
                  </Badge>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
