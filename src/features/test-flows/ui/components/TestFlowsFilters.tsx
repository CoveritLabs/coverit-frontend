// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Filter, Search } from "lucide-react";
import { Button, Input, Select } from "@shared/ui";
import type { TestFlowTypeFilter } from "../../model/types/test-flows.types";
import styles from "../TestFlows.module.scss";

const TYPE_OPTIONS: Array<{ value: TestFlowTypeFilter; label: string }> = [
  { value: "all", label: "All flows" },
  { value: "MANUAL", label: "Manual" },
  { value: "BUG_REPRODUCTION", label: "Bug reproduction" },
  { value: "COVERAGE", label: "Coverage" },
];

export function TestFlowsFilters({
  applicationOptions,
  versionOptions,
  applicationId,
  versionId,
  type,
  searchText,
  onApplicationChange,
  onVersionChange,
  onTypeChange,
  onSearchChange,
  onClear,
}: {
  applicationOptions: Array<{ value: string; label: string }>;
  versionOptions: Array<{ value: string; label: string }>;
  applicationId: string | null;
  versionId: string | null;
  type: TestFlowTypeFilter;
  searchText: string;
  onApplicationChange: (value: string | null) => void;
  onVersionChange: (value: string | null) => void;
  onTypeChange: (value: TestFlowTypeFilter) => void;
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
          options={TYPE_OPTIONS}
          value={type}
          onChange={(value) => onTypeChange((value ?? "all") as TestFlowTypeFilter)}
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
