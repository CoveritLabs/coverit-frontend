// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { Filter, Search } from "lucide-react";
import { Button, Input, Select } from "@shared/ui";
import type { SearchParamStatus } from "../../../model/types/regression-runs.types";
import styles from "../../RegressionRuns.module.scss";

const RUN_STATUS_OPTIONS: Array<{ value: SearchParamStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "running", label: "Running" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
];

export function RegressionRunsFilters({
  applicationOptions,
  versionOptions,
  applicationId,
  versionId,
  status,
  searchText,
  onApplicationChange,
  onVersionChange,
  onStatusChange,
  onSearchChange,
  onClear,
}: {
  applicationOptions: Array<{ value: string; label: string }>;
  versionOptions: Array<{ value: string; label: string }>;
  applicationId: string | null;
  versionId: string | null;
  status: SearchParamStatus;
  searchText: string;
  onApplicationChange: (value: string | null) => void;
  onVersionChange: (value: string | null) => void;
  onStatusChange: (value: string | null) => void;
  onSearchChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className={styles.filtersCard}>
      <div className={styles.filtersRow}>
        <Select options={applicationOptions} value={applicationId} onChange={onApplicationChange} placeholder="Select application" />
        <Select options={versionOptions} value={versionId ?? "all"} onChange={onVersionChange} placeholder="All versions" />
        <Select options={RUN_STATUS_OPTIONS} value={status} onChange={onStatusChange} placeholder="All statuses" />
        <div className={styles.searchBox}>
          <Search size={14} />
          <Input value={searchText} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search runs..." />
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <Filter size={14} />
          Clear
        </Button>
      </div>
    </div>
  );
}
