// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the application root for full license information.

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { Button, Input, Label, Select } from "@shared/ui";
import type {
  CreateCrawlSessionInput,
  CrawlSchedule,
  CrawlSessionTrigger,
  RegressionCodebaseConfig,
  ScheduleFrequency,
} from "@features/target-applications";
import styles from "./Applications.module.scss";

function getRepositoryPath(repositoryUrl: string) {
  try {
    const url = new URL(repositoryUrl);
    return url.pathname.replace(/^\/|\.git$/g, "") || repositoryUrl;
  } catch {
    return repositoryUrl.replace(/^https?:\/\/[^/]+\//, "").replace(/\.git$/, "");
  }
}

interface AddApplicationModalProps {
  isNameDuplicate: (name: string) => boolean;
  newApplicationName?: string;
  apiKey?: string | null;
  onConfirm: (name: string, baseUrl: string) => void;
  onClose: () => void;
}

export const AddApplicationModal = ({
  isNameDuplicate,
  apiKey = null,
  onConfirm,
  onClose,
}: AddApplicationModalProps) => {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const isDuplicate = isNameDuplicate(name);
  const isValid = name.trim().length > 0 && !isDuplicate;

  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(name.trim(), baseUrl.trim());
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create New Application</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          {apiKey ? (
            <>
              <p className={styles.mutedText}>
                Application <strong>{name}</strong> created successfully. Store the API key below; it will not be shown
                again.
              </p>
              <div className={styles.apiKeyReveal}>
                <code>{apiKey}</code>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className={styles.iconSmall} /> : <Copy className={styles.iconSmall} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className={styles.modalActions}>
                <Button onClick={onClose}>Done</Button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.modalField}>
                <Label htmlFor="application-name">Application Name</Label>
                <Input
                  id="application-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="New Application"
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                />
                {isDuplicate && <p className={styles.applicationError}>This application name already exists.</p>}
              </div>
              <div className={styles.modalField}>
                <Label htmlFor="application-base-url">Base URL</Label>
                <Input
                  id="application-base-url"
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="Application base URL"
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                  maxLength={200}
                />
              </div>
              <div className={styles.modalActions}>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={!isValid}>
                  Create Application
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface EditApplicationModalProps {
  initialName: string;
  initialBaseUrl: string;
  isNameDuplicate: (name: string) => boolean;
  onConfirm: (name: string, baseUrl: string) => void;
  onClose: () => void;
}

export const EditApplicationModal = ({
  initialName,
  initialBaseUrl,
  isNameDuplicate,
  onConfirm,
  onClose,
}: EditApplicationModalProps) => {
  const [name, setName] = useState(initialName);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);

  const isDuplicate = isNameDuplicate(name);
  const hasChanges = name.trim() !== initialName || baseUrl.trim() !== initialBaseUrl;
  const isValid = name.trim().length > 0 && !isDuplicate && hasChanges;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(name.trim(), baseUrl.trim());
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edit Application</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalField}>
            <Label htmlFor="edit-application-name">Application Name</Label>
            <Input
              id="edit-application-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Application name"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
            {isDuplicate && <p className={styles.applicationError}>This application name already exists.</p>}
          </div>
          <div className={styles.modalField}>
            <Label htmlFor="edit-application-base-url">Base URL</Label>
            <Input
              id="edit-application-base-url"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="Application base URL"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              maxLength={200}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!isValid}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DeleteApplicationModalProps {
  applicationName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteApplicationModal = ({ applicationName, onConfirm, onClose }: DeleteApplicationModalProps) => {
  const [confirmName, setConfirmName] = useState("");
  const deleteMatches = confirmName === applicationName;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Delete Application</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.mutedText}>This will permanently delete {applicationName} and remove its members.</p>
          <div className={styles.modalField}>
            <Label htmlFor="delete-application-confirm">
              Type <strong>{applicationName}</strong> to confirm
            </Label>
            <Input
              id="delete-application-confirm"
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={applicationName}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={!deleteMatches}>
              Delete Application
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AddVersionModalProps {
  isNameDuplicate: (name: string) => boolean;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export const AddVersionModal = ({ isNameDuplicate, onConfirm, onClose }: AddVersionModalProps) => {
  const [name, setName] = useState("");

  const isDuplicate = isNameDuplicate(name);
  const isValid = name.trim().length > 0 && !isDuplicate;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(name.trim());
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create New Application Version</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalField}>
            <Label htmlFor="application-name">Version Name</Label>
            <Input
              id="application-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Application"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
            {isDuplicate && <p className={styles.applicationError}>This version name already exists.</p>}
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!isValid}>
              Create Version
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DeleteVersionModalProps {
  versionName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteVersionModal = ({ versionName, onConfirm, onClose }: DeleteVersionModalProps) => (
  <div className={styles.modalOverlay} onClick={onClose}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>Delete Version</h3>
        <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
          <X className={styles.iconSmall} />
        </Button>
      </div>
      <div className={styles.modalBody}>
        <p className={styles.mutedText}>
          This will permanently delete version <strong>{versionName}</strong>.
        </p>
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Version
          </Button>
        </div>
      </div>
    </div>
  </div>
);

interface RotateApiKeyModalProps {
  applicationName: string;
  apiKey: string | null;
  isRotating: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const RotateApiKeyModal = ({
  applicationName,
  apiKey,
  isRotating,
  onConfirm,
  onClose,
}: RotateApiKeyModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Rotate API Key</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          {apiKey ? (
            <>
              <p className={styles.mutedText}>
                New key for <strong>{applicationName}</strong>. Store it now; it will not be shown again.
              </p>
              <div className={styles.apiKeyReveal}>
                <code>{apiKey}</code>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className={styles.iconSmall} /> : <Copy className={styles.iconSmall} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className={styles.modalActions}>
                <Button onClick={onClose}>Done</Button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.mutedText}>
                Rotate the API key for <strong>{applicationName}</strong>? Existing integrations using the old
                key will need to update to the new key to continue working.
              </p>
              <div className={styles.modalActions}>
                <Button variant="outline" onClick={onClose} disabled={isRotating}>
                  Cancel
                </Button>
                <Button onClick={onConfirm} disabled={isRotating}>
                  {isRotating ? "Rotating..." : "Rotate Key"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface LeaveApplicationModalProps {
  isOnlyMember: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const LeaveApplicationModal = ({ isOnlyMember, onConfirm, onClose }: LeaveApplicationModalProps) => (
  <div className={styles.modalOverlay} onClick={onClose}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>Leave Application</h3>
        <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
          <X className={styles.iconSmall} />
        </Button>
      </div>
      <div className={styles.modalBody}>
        <p className={styles.mutedText}>
          {isOnlyMember
            ? "You are the only member. Leaving will delete this application."
            : "You will lose access to this application and its members."}
        </p>
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {isOnlyMember ? "Leave and delete" : "Leave application"}
          </Button>
        </div>
      </div>
    </div>
  </div>
);

interface RegressionCodebaseConfigModalProps {
  applicationName: string;
  initialConfig: RegressionCodebaseConfig;
  onConfirm: (config: RegressionCodebaseConfig) => void;
  onClose: () => void;
}

export const RegressionCodebaseConfigModal = ({
  applicationName,
  initialConfig,
  onConfirm,
  onClose,
}: RegressionCodebaseConfigModalProps) => {
  const [repositoryUrl, setRepositoryUrl] = useState(initialConfig.repositoryUrl);
  const [apiKey, setApiKey] = useState(initialConfig.apiKey ?? "");

  const canSave = repositoryUrl.trim().length > 0;

  const handleConfirm = () => {
    if (!canSave) return;
    onConfirm({
      id: initialConfig.id,
      repositoryUrl: repositoryUrl.trim(),
      repositoryPath: getRepositoryPath(repositoryUrl.trim()),
      apiKey: apiKey.trim() || undefined,
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.regressionModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Regression Codebase Configuration</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.modalDescription}>
            Configure the repository used for generated tests. Session-specific branches and PR details are set when
            creating a crawl session for {applicationName}.
          </p>

          <div className={styles.modalField}>
            <Label htmlFor="regression-repository-url">Repository URL</Label>
            <Input
              id="regression-repository-url"
              type="text"
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.target.value)}
            />
          </div>

          <div className={styles.modalField}>
            <Label htmlFor="regression-api-key">API Key (optional)</Label>
            <Input
              id="regression-api-key"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <p className={styles.fieldHelp}>GitHub token or other auth credential for pushing generated tests</p>
          </div>

          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!canSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CreateCrawlSessionModalProps {
  initialData?: CreateCrawlSessionInput;
  onConfirm: (data: CreateCrawlSessionInput) => void;
  onClose: () => void;
}

const TRIGGER_OPTIONS: Array<{ value: CrawlSessionTrigger; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "scheduled", label: "Scheduled" },
];

function splitPatterns(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export const CreateCrawlSessionModal = ({
  initialData,
  onConfirm,
  onClose,
}: CreateCrawlSessionModalProps) => {
  const [trigger, setTrigger] = useState<CrawlSessionTrigger>(initialData?.trigger ?? "manual");
  const [maxStates, setMaxStates] = useState(String(initialData?.crawlConfig.maxStates ?? 1000));
  const [maxDepth, setMaxDepth] = useState(String(initialData?.crawlConfig.maxDepth ?? 10));
  const [includeUrlPatterns, setIncludeUrlPatterns] = useState(
    initialData?.crawlConfig.includeUrlPatterns.join("\n") ?? "",
  );
  const [excludeUrlPatterns, setExcludeUrlPatterns] = useState(
    initialData?.crawlConfig.excludeUrlPatterns.join("\n") ?? "",
  );
  const [enableSemanticDecisions, setEnableSemanticDecisions] = useState(
    initialData?.crawlConfig.enableSemanticDecisions ?? false,
  );
  const [timeoutSeconds, setTimeoutSeconds] = useState(String(initialData?.crawlConfig.timeoutSeconds ?? 3600));
  const [codegenBranch, setCodegenBranch] = useState(initialData?.codegenConfig.codegenBranch ?? "auto-tests");
  const [prTargetBranch, setPrTargetBranch] = useState(initialData?.codegenConfig.prTargetBranch ?? "main");
  const [prTitle, setPrTitle] = useState(initialData?.codegenConfig.prTitle ?? "");
  const [prBody, setPrBody] = useState(initialData?.codegenConfig.prBody ?? "");
  const [prDraft, setPrDraft] = useState(initialData?.codegenConfig.prDraft ?? true);

  const parsedMaxStates = Number(maxStates);
  const parsedMaxDepth = Number(maxDepth);
  const parsedTimeoutSeconds = Number(timeoutSeconds);
  const canSave =
    Number.isInteger(parsedMaxStates) &&
    parsedMaxStates > 0 &&
    Number.isInteger(parsedMaxDepth) &&
    parsedMaxDepth > 0 &&
    Number.isInteger(parsedTimeoutSeconds) &&
    parsedTimeoutSeconds > 0 &&
    codegenBranch.trim().length > 0 &&
    prTargetBranch.trim().length > 0;

  const handleConfirm = () => {
    if (!canSave) return;
    onConfirm({
      trigger,
      crawlConfig: {
        maxStates: parsedMaxStates,
        maxDepth: parsedMaxDepth,
        includeUrlPatterns: splitPatterns(includeUrlPatterns),
        excludeUrlPatterns: splitPatterns(excludeUrlPatterns),
        enableSemanticDecisions,
        timeoutSeconds: parsedTimeoutSeconds,
      },
      codegenConfig: {
        codegenBranch: codegenBranch.trim(),
        prTargetBranch: prTargetBranch.trim(),
        prTitle: prTitle.trim(),
        prBody: prBody.trim(),
        prDraft,
      },
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.sessionModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create Crawl Session</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalField}>
            <Label>Trigger</Label>
            <Select
              options={TRIGGER_OPTIONS}
              value={trigger}
              onChange={(value) => value && setTrigger(value as CrawlSessionTrigger)}
            />
          </div>

          <div className={styles.modalSectionTitle}>Crawl Config</div>
          <div className={styles.modalGridThree}>
            <div className={styles.modalField}>
              <Label htmlFor="crawl-max-states">Max States</Label>
              <Input
                id="crawl-max-states"
                type="number"
                min={1}
                value={maxStates}
                onChange={(event) => setMaxStates(event.target.value)}
              />
            </div>
            <div className={styles.modalField}>
              <Label htmlFor="crawl-max-depth">Max Depth</Label>
              <Input
                id="crawl-max-depth"
                type="number"
                min={1}
                value={maxDepth}
                onChange={(event) => setMaxDepth(event.target.value)}
              />
            </div>
            <div className={styles.modalField}>
              <Label htmlFor="crawl-timeout">Timeout Seconds</Label>
              <Input
                id="crawl-timeout"
                type="number"
                min={1}
                value={timeoutSeconds}
                onChange={(event) => setTimeoutSeconds(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalGridTwo}>
            <div className={styles.modalField}>
              <Label htmlFor="crawl-include-patterns">Include URL Patterns</Label>
              <textarea
                id="crawl-include-patterns"
                className={styles.modalTextarea}
                value={includeUrlPatterns}
                onChange={(event) => setIncludeUrlPatterns(event.target.value)}
                placeholder="One pattern per line"
              />
            </div>
            <div className={styles.modalField}>
              <Label htmlFor="crawl-exclude-patterns">Exclude URL Patterns</Label>
              <textarea
                id="crawl-exclude-patterns"
                className={styles.modalTextarea}
                value={excludeUrlPatterns}
                onChange={(event) => setExcludeUrlPatterns(event.target.value)}
                placeholder="One pattern per line"
              />
            </div>
          </div>

          <label className={styles.modalCheckbox}>
            <input
              type="checkbox"
              checked={enableSemanticDecisions}
              onChange={(event) => setEnableSemanticDecisions(event.target.checked)}
            />
            <span>Enable Semantic Decisions</span>
          </label>

          <div className={styles.modalSectionTitle}>Codegen Config</div>
          <div className={styles.modalGridTwo}>
            <div className={styles.modalField}>
              <Label htmlFor="codegen-branch">Codegen Branch</Label>
              <Input
                id="codegen-branch"
                value={codegenBranch}
                onChange={(event) => setCodegenBranch(event.target.value)}
              />
            </div>
            <div className={styles.modalField}>
              <Label htmlFor="pr-target-branch">PR Target Branch</Label>
              <Input
                id="pr-target-branch"
                value={prTargetBranch}
                onChange={(event) => setPrTargetBranch(event.target.value)}
              />
            </div>
          </div>
          <div className={styles.modalField}>
            <Label htmlFor="pr-title">PR Title</Label>
            <Input id="pr-title" value={prTitle} onChange={(event) => setPrTitle(event.target.value)} />
          </div>
          <div className={styles.modalField}>
            <Label htmlFor="pr-body">PR Body</Label>
            <textarea
              id="pr-body"
              className={styles.modalTextarea}
              value={prBody}
              onChange={(event) => setPrBody(event.target.value)}
            />
          </div>
          <label className={styles.modalCheckbox}>
            <input type="checkbox" checked={prDraft} onChange={(event) => setPrDraft(event.target.checked)} />
            <span>Create PR as draft</span>
          </label>

          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!canSave}>
              Create Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ScheduleConfigModalProps {
  initialSchedule?: CrawlSchedule | null;
  onConfirm: (frequency: ScheduleFrequency, runTimeUtc: string) => void;
  onClose: () => void;
}

const SCHEDULE_FREQUENCY_OPTIONS: Array<{ value: ScheduleFrequency; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const ScheduleConfigModal = ({ initialSchedule = null, onConfirm, onClose }: ScheduleConfigModalProps) => {
  const [frequency, setFrequency] = useState<ScheduleFrequency>(initialSchedule?.frequency ?? "daily");
  const [runTimeUtc, setRunTimeUtc] = useState(initialSchedule?.runTimeUtc ?? "02:00 AM");
  const canSave = runTimeUtc.trim().length > 0;

  const handleConfirm = () => {
    if (!canSave) return;
    onConfirm(frequency, runTimeUtc.trim());
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.scheduleModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalBody}>
          <div className={styles.modalField}>
            <Label>Frequency</Label>
            <Select
              options={SCHEDULE_FREQUENCY_OPTIONS}
              value={frequency}
              onChange={(value) => value && setFrequency(value as ScheduleFrequency)}
            />
          </div>
          <div className={styles.modalField}>
            <Label htmlFor="schedule-run-time">Run Time (UTC)</Label>
            <Input
              id="schedule-run-time"
              type="text"
              value={runTimeUtc}
              onChange={(event) => setRunTimeUtc(event.target.value)}
              placeholder="02:00 AM"
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!canSave}>
              {initialSchedule ? "Save Schedule" : "Add Schedule"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DeleteScheduleModalProps {
  scheduleTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteScheduleModal = ({ scheduleTitle, onConfirm, onClose }: DeleteScheduleModalProps) => (
  <div className={styles.modalOverlay} onClick={onClose}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>Delete Schedule</h3>
        <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
          <X className={styles.iconSmall} />
        </Button>
      </div>
      <div className={styles.modalBody}>
        <p className={styles.mutedText}>
          Delete <strong>{scheduleTitle}</strong>? Future scheduled crawls for this schedule will stop.
        </p>
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Schedule
          </Button>
        </div>
      </div>
    </div>
  </div>
);
