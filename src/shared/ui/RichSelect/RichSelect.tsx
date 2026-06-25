// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import * as React from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@shared/utils/cn";
import styles from "./RichSelect.module.scss";

export type RichSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

interface RichSelectProps<TOption extends RichSelectOption> {
  options?: TOption[];
  value?: string | null;
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  onChange?: (value: string | null) => void;
  renderOption?: (option: TOption) => React.ReactNode;
  renderValue?: (option: TOption) => React.ReactNode;
  emptyLabel?: string;
  clearLabel?: string;
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
  clearable?: boolean;
}

function getNextEnabledIndex<TOption extends RichSelectOption>(
  options: TOption[],
  startIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) return -1;

  for (let offset = 0; offset < options.length; offset += 1) {
    const index = (startIndex + offset * direction + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }

  return -1;
}

export function RichSelect<TOption extends RichSelectOption>({
  options = [],
  value = null,
  placeholder = "Select...",
  leadingIcon,
  onChange,
  renderOption,
  renderValue,
  emptyLabel = "No options available",
  clearLabel = "Clear selection",
  className,
  menuClassName,
  disabled = false,
  clearable = true,
}: RichSelectProps<TOption>) {
  const id = React.useId();
  const listboxId = `rich-select-${id}-listbox`;
  const triggerId = `rich-select-${id}-trigger`;
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const hasValue = Boolean(selectedOption);
  const [open, setOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(() =>
    selectedIndex >= 0 ? selectedIndex : getNextEnabledIndex(options, 0, 1),
  );

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  React.useEffect(() => {
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : getNextEnabledIndex(options, 0, 1));
  }, [options, selectedIndex]);

  React.useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const focusOption = (index: number) => {
    if (index < 0) return;
    setHighlightedIndex(index);
    requestAnimationFrame(() =>
      document.getElementById(`${listboxId}-option-${index}`)?.scrollIntoView({ block: "nearest" }),
    );
  };

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
    const nextIndex = highlightedIndex >= 0 ? highlightedIndex : getNextEnabledIndex(options, 0, 1);
    focusOption(nextIndex);
    requestAnimationFrame(() => listRef.current?.focus());
  };

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectIndex = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveHighlight = (direction: 1 | -1) => {
    const startIndex = highlightedIndex >= 0 ? highlightedIndex + direction : direction > 0 ? 0 : options.length - 1;
    focusOption(getNextEnabledIndex(options, startIndex, direction));
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      moveHighlight(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      moveHighlight(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) selectIndex(highlightedIndex);
      else openMenu();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectIndex(highlightedIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(styles.wrapper, className, open && styles.open, hasValue && styles.filled)}
      data-disabled={disabled || undefined}
    >
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
      >
        <span className={styles.valueGroup}>
          {leadingIcon ? <span className={styles.leadingIcon}>{leadingIcon}</span> : null}
          <span className={cn(styles.value, !selectedOption && styles.placeholder)}>
            {selectedOption ? (renderValue?.(selectedOption) ?? selectedOption.label) : placeholder}
          </span>
        </span>
        <span className={styles.actions}>
          {clearable && selectedOption ? (
            <span
              role="button"
              tabIndex={-1}
              className={styles.clearButton}
              aria-label={clearLabel}
              onClick={(event) => {
                event.stopPropagation();
                onChange?.(null);
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <X size={14} strokeWidth={1.8} />
            </span>
          ) : null}
          <ChevronDown className={styles.chevron} size={15} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </button>

      {open && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className={cn(styles.menu, menuClassName)}
          aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
          aria-labelledby={triggerId}
          onKeyDown={handleListKeyDown}
        >
          {options.length === 0 ? (
            <li className={styles.emptyOption}>{emptyLabel}</li>
          ) : (
            options.map((option, index) => (
              <li
                id={`${listboxId}-option-${index}`}
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                className={cn(
                  styles.option,
                  index === highlightedIndex && styles.highlighted,
                  option.value === value && styles.selected,
                  option.disabled && styles.disabledOption,
                )}
                onClick={() => selectIndex(index)}
                onMouseEnter={() => {
                  if (!option.disabled) setHighlightedIndex(index);
                }}
              >
                {renderOption?.(option) ?? option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
