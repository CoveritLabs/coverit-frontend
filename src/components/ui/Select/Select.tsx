// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import * as React from "react";
import styles from "./Select.module.scss";
import { cn } from "@utils/cn";

type Option = { value: string; label: string };

interface SelectProps {
  options?: Option[];
  value?: string | null;
  placeholder?: string;
  onChange?: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export function Select({
  options = [],
  value = null,
  placeholder = "Select...",
  onChange,
  className,
  disabled = false,
}: SelectProps) {
  const id = React.useId();
  const listboxId = `select-${id}-listbox`;
  const triggerId = `select-${id}-trigger`;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const [open, setOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(selectedIndex >= 0 ? selectedIndex : 0);

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  React.useEffect(() => {
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [selectedIndex, options]);

  React.useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
    // focus list next tick
    requestAnimationFrame(() => listRef.current?.focus());
  };

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const toggleMenu = () => (open ? closeMenu() : openMenu());

  const selectIndex = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    onChange?.(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = highlightedIndex + 1 < options.length ? highlightedIndex + 1 : 0;
      setHighlightedIndex(next);
      setOpen(true);
      requestAnimationFrame(() =>
        document.getElementById(`${listboxId}-option-${next}`)?.scrollIntoView({ block: "nearest" }),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = highlightedIndex - 1 >= 0 ? highlightedIndex - 1 : options.length - 1;
      setHighlightedIndex(next);
      setOpen(true);
      requestAnimationFrame(() =>
        document.getElementById(`${listboxId}-option-${next}`)?.scrollIntoView({ block: "nearest" }),
      );
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) selectIndex(highlightedIndex);
      else openMenu();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % options.length);
      requestAnimationFrame(() =>
        document
          .getElementById(`${listboxId}-option-${(highlightedIndex + 1) % options.length}`)
          ?.scrollIntoView({ block: "nearest" }),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i - 1 + options.length) % options.length);
      requestAnimationFrame(() =>
        document
          .getElementById(`${listboxId}-option-${(highlightedIndex - 1 + options.length) % options.length}`)
          ?.scrollIntoView({ block: "nearest" }),
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectIndex(highlightedIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    }
  };

  const displayLabel = selectedIndex >= 0 ? options[selectedIndex].label : placeholder;
  const hasValue = selectedIndex >= 0;

  return (
    <div ref={wrapperRef} className={cn(styles.wrapper, className, open && styles.open, hasValue && styles.filled)}>
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={toggleMenu}
        onKeyDown={onTriggerKeyDown}
        disabled={disabled}
      >
        <span className={cn(styles.value, selectedIndex < 0 && styles.placeholder)}>{displayLabel}</span>
        <span className={styles.caret} aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          className={styles.menu}
          aria-activedescendant={`${listboxId}-option-${highlightedIndex}`}
          aria-labelledby={triggerId}
          onKeyDown={onListKeyDown}
        >
          {options.map((opt, i) => (
            <li
              id={`${listboxId}-option-${i}`}
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              data-index={i}
              className={cn(
                styles.option,
                i === highlightedIndex && styles.highlighted,
                value === opt.value && styles.selected,
              )}
              onClick={() => selectIndex(i)}
              onMouseEnter={() => setHighlightedIndex(i)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
