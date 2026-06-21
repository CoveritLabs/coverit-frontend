// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Filter, Search } from "lucide-react";
import { Button, Input, Select } from "@shared/ui";
import type { TestFlowClippedFilter } from "../../model/types/test-flows.types";
import styles from "../TestFlows.module.scss";

const CLIPPED_OPTIONS: Array<{ value: TestFlowClippedFilter; label: string }> = [
  { value: "all", label: "All flows" },
  { value: "complete", label: "Complete" },
  { value: "clipped", label: "Clipped" },
];

export function TestFlowsFilters({
  applicationOptions,
  versionOptions,
  applicationId,
  versionId,
  clipped,
  searchText,
  onApplicationChange,
  onVersionChange,
  onClippedChange,
  onSearchChange,
  onClear,
}: {
  applicationOptions: Array<{ value: string; label: string }>;
  versionOptions: Array<{ value: string; label: string }>;
  applicationId: string | null;
  versionId: string | null;
  clipped: TestFlowClippedFilter;
  searchText: string;
  onApplicationChange: (value: string | null) => void;
  onVersionChange: (value: string | null) => void;
  onClippedChange: (value: TestFlowClippedFilter) => void;
  onSearchChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className={styles.filtersCard}>
      <div className={styles.filtersRow}>
        <Select
          options={applicationOptions}
          value={applicationId}
          onChange={onApplicationChange}
          placeholder="Select application"
        />
        <Select
          options={versionOptions}
          value={versionId ?? "all"}
          onChange={onVersionChange}
          placeholder="All versions"
        />
        <Select
          options={CLIPPED_OPTIONS}
          value={clipped}
          onChange={(value) => onClippedChange((value ?? "all") as TestFlowClippedFilter)}
          placeholder="All flows"
        />
        <div className={styles.searchBox}>
          <Search size={14} />
          <Input
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search flows..."
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <Filter size={14} />
          Clear
        </Button>
      </div>
    </div>
  );
}
