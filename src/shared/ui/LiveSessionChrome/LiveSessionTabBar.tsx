// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { ComponentType, CSSProperties } from "react";
import styles from "./LiveSessionChrome.module.scss";

export type LiveSessionTab<TValue extends string> = {
  value: TValue;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

type LiveSessionTabBarProps<TValue extends string> = {
  tabs: Array<LiveSessionTab<TValue>>;
  activeTab: TValue;
  onTabChange: (tab: TValue) => void;
  ariaLabel: string;
};

export function LiveSessionTabBar<TValue extends string>({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
}: LiveSessionTabBarProps<TValue>) {
  return (
    <div
      className={styles.tabBar}
      role="tablist"
      aria-label={ariaLabel}
      style={{ "--live-session-tab-count": tabs.length } as CSSProperties}
    >
      {tabs.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={activeTab === value}
          className={activeTab === value ? styles.tabButtonActive : styles.tabButton}
          onClick={() => onTabChange(value)}
        >
          <Icon className={styles.tabIcon} />
          {label}
        </button>
      ))}
    </div>
  );
}
