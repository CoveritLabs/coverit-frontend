// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the application root for full license information.

import { type MouseEvent, useState } from "react";
import { Check, Copy, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { Button, Input, Label, Select } from "@shared/ui";
import type {
  CreateCrawlSessionInput,
  CrawlSchedule,
  CrawlSessionTrigger,
  RegressionCodebaseConfig,
  ScheduleFrequency,
} from "@features/target-applications";
import styles from "./Applications.module.scss";

function closeOnBackdropMouseDown(event: MouseEvent<HTMLDivElement>, onClose: () => void) {
  if (event.target === event.currentTarget) {
    onClose();
  }
}

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
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
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
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
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
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
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
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
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
  <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
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
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
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
                Rotate the API key for <strong>{applicationName}</strong>? Existing regression frameworks using the old
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
  <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
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
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

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
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
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
            <div className={styles.secretField}>
              <Input
                id="regression-api-key"
                type={apiKeyVisible ? "text" : "password"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={initialConfig.id && !initialConfig.apiKey ? "Leave blank to keep saved key" : undefined}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={styles.iconButton}
                onClick={() => setApiKeyVisible((visible) => !visible)}
                aria-label={apiKeyVisible ? "Hide API key" : "Show API key"}
                title={apiKeyVisible ? "Hide API key" : "Show API key"}
              >
                {apiKeyVisible ? <EyeOff className={styles.iconSmall} /> : <Eye className={styles.iconSmall} />}
              </Button>
            </div>
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
  { value: "on_demand", label: "On Demand" },
  { value: "scheduled", label: "Scheduled" },
];

type SessionConfigMode = "form" | "json";

const DEFAULT_CREATE_SESSION_INPUT: CreateCrawlSessionInput = {
  trigger: "on_demand",
  crawlConfig: {
    maxStates: 1000,
    timeoutSeconds: 3600,
    generateTestFlows: true,
    generateTestCode: false,
    testFlowGeneration: {
      coveragePercentage: 100,
      numOfTf: 1,
      maxNumOfTf: 10000,
      numOfStates: 20,
      minNumOfStatesPerTf: 3,
    },
    crawlerSettings: {
      maxTransitions: 5000,
      maxElementsPerState: 50,
      maxActionRepeatsPerUrl: 10,
      useSemanticDiversity: true,
    },
  },
  codegenConfig: {
    codegenBranch: "auto-tests",
    prTargetBranch: "main",
    prTitle: "",
    prBody: "",
    prDraft: true,
  },
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parsePositiveInteger(value: unknown, label: string) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return numberValue;
}

function parseNonNegativeInteger(value: unknown, label: string) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return numberValue;
}

function parseCoveragePercentage(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0 || numberValue > 100) {
    throw new Error("Coverage Percentage must be between 0 and 100.");
  }
  return numberValue;
}

function normalizeInputDefaults(value: unknown): CreateCrawlSessionInput["crawlConfig"]["inputDefaults"] {
  if (value === undefined) return undefined;
  if (!isObjectRecord(value)) throw new Error("inputDefaults must be an object.");

  const fieldPatterns = value.fieldPatterns;
  const typeFallbacks = value.typeFallbacks;
  if (!isObjectRecord(fieldPatterns) || !isObjectRecord(typeFallbacks)) {
    throw new Error("inputDefaults must include fieldPatterns and typeFallbacks objects.");
  }

  return {
    fieldPatterns: Object.fromEntries(Object.entries(fieldPatterns).map(([key, item]) => [key, String(item)])),
    typeFallbacks: Object.fromEntries(Object.entries(typeFallbacks).map(([key, item]) => [key, String(item)])),
  };
}

function normalizeCreateSessionInput(raw: unknown): CreateCrawlSessionInput {
  if (!isObjectRecord(raw)) throw new Error("JSON must be an object.");
  if (!["manual", "on_demand", "scheduled"].includes(String(raw.trigger))) {
    throw new Error("trigger must be manual, on_demand, or scheduled.");
  }
  if (!isObjectRecord(raw.crawlConfig)) throw new Error("crawlConfig must be an object.");

  const crawlConfig = raw.crawlConfig;
  const testFlowGeneration = isObjectRecord(crawlConfig.testFlowGeneration) ? crawlConfig.testFlowGeneration : {};
  const crawlerSettings = isObjectRecord(crawlConfig.crawlerSettings) ? crawlConfig.crawlerSettings : {};
  const generateTestFlows = crawlConfig.generateTestFlows !== false;
  const generateTestCode = generateTestFlows && crawlConfig.generateTestCode === true;

  const normalized: CreateCrawlSessionInput = {
    trigger: raw.trigger as CrawlSessionTrigger,
    crawlConfig: {
      maxStates: parsePositiveInteger(crawlConfig.maxStates, "Max States"),
      timeoutSeconds: parsePositiveInteger(crawlConfig.timeoutSeconds, "Timeout Seconds"),
      generateTestFlows,
      generateTestCode,
      testFlowGeneration: {
        coveragePercentage: parseCoveragePercentage(testFlowGeneration.coveragePercentage ?? 100),
        numOfTf: parsePositiveInteger(testFlowGeneration.numOfTf ?? 1, "Minimum Test Flows"),
        maxNumOfTf: parsePositiveInteger(testFlowGeneration.maxNumOfTf ?? 10000, "Maximum Test Flows"),
        numOfStates: parsePositiveInteger(testFlowGeneration.numOfStates ?? 20, "States per Test Flow"),
        minNumOfStatesPerTf: parsePositiveInteger(
          testFlowGeneration.minNumOfStatesPerTf ?? 3,
          "Minimum States per Test Flow",
        ),
      },
      crawlerSettings: {
        maxTransitions: parsePositiveInteger(crawlerSettings.maxTransitions ?? 5000, "Max Transitions"),
        maxElementsPerState: parsePositiveInteger(crawlerSettings.maxElementsPerState ?? 50, "Max Elements per State"),
        maxActionRepeatsPerUrl: parseNonNegativeInteger(
          crawlerSettings.maxActionRepeatsPerUrl ?? 10,
          "Action Repeats per URL",
        ),
        useSemanticDiversity: crawlerSettings.useSemanticDiversity !== false,
      },
      inputDefaults: normalizeInputDefaults(crawlConfig.inputDefaults),
    },
  };

  if (generateTestCode) {
    if (!isObjectRecord(raw.codegenConfig)) {
      throw new Error("codegenConfig is required when generateTestCode is true.");
    }
    const codegenBranch = String(raw.codegenConfig.codegenBranch ?? "").trim();
    const prTargetBranch = String(raw.codegenConfig.prTargetBranch ?? "").trim();
    if (!codegenBranch || !prTargetBranch) {
      throw new Error("Codegen branch and PR target branch are required when generateTestCode is true.");
    }
    normalized.codegenConfig = {
      codegenBranch,
      prTargetBranch,
      prTitle: String(raw.codegenConfig.prTitle ?? "").trim(),
      prBody: String(raw.codegenConfig.prBody ?? "").trim(),
      prDraft: raw.codegenConfig.prDraft !== false,
    };
  }

  return normalized;
}

function parseCreateSessionJson(value: string): { data?: CreateCrawlSessionInput; error?: string } {
  try {
    return { data: normalizeCreateSessionInput(JSON.parse(value)) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid session config JSON." };
  }
}

type InputDefaultRow = {
  id: string;
  key: string;
  value: string;
};

function createInputDefaultRow(key = "", value = ""): InputDefaultRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    key,
    value,
  };
}

function inputDefaultRowsFromRecord(record: Record<string, string> | undefined): InputDefaultRow[] {
  const rows = Object.entries(record ?? {}).map(([key, value]) => createInputDefaultRow(key, value));
  return rows.length > 0 ? rows : [createInputDefaultRow()];
}

function inputDefaultRowsToRecord(rows: InputDefaultRow[]) {
  return rows.reduce<Record<string, string>>((acc, row) => {
    const key = row.key.trim();
    const value = row.value.trim();
    if (key && value) acc[key] = value;
    return acc;
  }, {});
}

function hasInvalidInputDefaultRows(rows: InputDefaultRow[]) {
  return rows.some((row) => {
    const key = row.key.trim();
    const value = row.value.trim();
    return (key && !value) || (!key && value);
  });
}

function hasDuplicateInputDefaultKeys(rows: InputDefaultRow[]) {
  const keys = rows.map((row) => row.key.trim()).filter(Boolean);
  return new Set(keys).size !== keys.length;
}

export const CreateCrawlSessionModal = ({ initialData, onConfirm, onClose }: CreateCrawlSessionModalProps) => {
  const sessionDefaults = initialData ?? DEFAULT_CREATE_SESSION_INPUT;
  const [configMode, setConfigMode] = useState<SessionConfigMode>("form");
  const [sessionJson, setSessionJson] = useState(() => JSON.stringify(sessionDefaults, null, 2));
  const [trigger, setTrigger] = useState<CrawlSessionTrigger>(initialData?.trigger ?? "on_demand");
  const [maxStates, setMaxStates] = useState(String(initialData?.crawlConfig.maxStates ?? 1000));
  const [timeoutSeconds, setTimeoutSeconds] = useState(String(initialData?.crawlConfig.timeoutSeconds ?? 3600));
  const [generateTestFlows, setGenerateTestFlows] = useState(initialData?.crawlConfig.generateTestFlows ?? true);
  const [generateTestCode, setGenerateTestCode] = useState(initialData?.crawlConfig.generateTestCode ?? false);
  const [coveragePercentage, setCoveragePercentage] = useState(
    String(initialData?.crawlConfig.testFlowGeneration?.coveragePercentage ?? 100),
  );
  const [numOfTf, setNumOfTf] = useState(String(initialData?.crawlConfig.testFlowGeneration?.numOfTf ?? 1));
  const [maxNumOfTf, setMaxNumOfTf] = useState(
    String(initialData?.crawlConfig.testFlowGeneration?.maxNumOfTf ?? 10000),
  );
  const [numOfStates, setNumOfStates] = useState(
    String(initialData?.crawlConfig.testFlowGeneration?.numOfStates ?? 20),
  );
  const [minNumOfStatesPerTf, setMinNumOfStatesPerTf] = useState(
    String(initialData?.crawlConfig.testFlowGeneration?.minNumOfStatesPerTf ?? 3),
  );
  const [maxTransitions, setMaxTransitions] = useState(
    String(initialData?.crawlConfig.crawlerSettings?.maxTransitions ?? 5000),
  );
  const [maxElementsPerState, setMaxElementsPerState] = useState(
    String(initialData?.crawlConfig.crawlerSettings?.maxElementsPerState ?? 50),
  );
  const [maxActionRepeatsPerUrl, setMaxActionRepeatsPerUrl] = useState(
    String(initialData?.crawlConfig.crawlerSettings?.maxActionRepeatsPerUrl ?? 10),
  );
  const [useSemanticDiversity, setUseSemanticDiversity] = useState(
    initialData?.crawlConfig.crawlerSettings?.useSemanticDiversity ?? true,
  );
  const [fieldPatternRows, setFieldPatternRows] = useState(() =>
    inputDefaultRowsFromRecord(initialData?.crawlConfig.inputDefaults?.fieldPatterns),
  );
  const [codegenBranch, setCodegenBranch] = useState(initialData?.codegenConfig?.codegenBranch ?? "auto-tests");
  const [prTargetBranch, setPrTargetBranch] = useState(initialData?.codegenConfig?.prTargetBranch ?? "main");
  const [prTitle, setPrTitle] = useState(initialData?.codegenConfig?.prTitle ?? "");
  const [prBody, setPrBody] = useState(initialData?.codegenConfig?.prBody ?? "");
  const [prDraft, setPrDraft] = useState(initialData?.codegenConfig?.prDraft ?? true);

  const parsedMaxStates = Number(maxStates);
  const parsedTimeoutSeconds = Number(timeoutSeconds);
  const parsedCoveragePercentage = Number(coveragePercentage);
  const parsedNumOfTf = Number(numOfTf);
  const parsedMaxNumOfTf = Number(maxNumOfTf);
  const parsedNumOfStates = Number(numOfStates);
  const parsedMinNumOfStatesPerTf = Number(minNumOfStatesPerTf);
  const parsedMaxTransitions = Number(maxTransitions);
  const parsedMaxElementsPerState = Number(maxElementsPerState);
  const parsedMaxActionRepeatsPerUrl = Number(maxActionRepeatsPerUrl);
  const inputDefaultsInvalid = hasInvalidInputDefaultRows(fieldPatternRows);
  const inputDefaultsDuplicated = hasDuplicateInputDefaultKeys(fieldPatternRows);
  const jsonResult = parseCreateSessionJson(sessionJson);
  const shouldGenerateTestCode = generateTestFlows && generateTestCode;
  const formCanSave =
    Number.isInteger(parsedMaxStates) &&
    parsedMaxStates > 0 &&
    Number.isInteger(parsedTimeoutSeconds) &&
    parsedTimeoutSeconds > 0 &&
    Number.isFinite(parsedCoveragePercentage) &&
    parsedCoveragePercentage >= 0 &&
    parsedCoveragePercentage <= 100 &&
    Number.isInteger(parsedNumOfTf) &&
    parsedNumOfTf > 0 &&
    Number.isInteger(parsedMaxNumOfTf) &&
    parsedMaxNumOfTf > 0 &&
    Number.isInteger(parsedNumOfStates) &&
    parsedNumOfStates > 0 &&
    Number.isInteger(parsedMinNumOfStatesPerTf) &&
    parsedMinNumOfStatesPerTf > 0 &&
    Number.isInteger(parsedMaxTransitions) &&
    parsedMaxTransitions > 0 &&
    Number.isInteger(parsedMaxElementsPerState) &&
    parsedMaxElementsPerState > 0 &&
    Number.isInteger(parsedMaxActionRepeatsPerUrl) &&
    parsedMaxActionRepeatsPerUrl >= 0 &&
    (!shouldGenerateTestCode || (codegenBranch.trim().length > 0 && prTargetBranch.trim().length > 0)) &&
    !inputDefaultsInvalid &&
    !inputDefaultsDuplicated;
  const canSave = configMode === "json" ? Boolean(jsonResult.data) : formCanSave;

  const buildFormInput = (): CreateCrawlSessionInput => {
    const fieldPatterns = inputDefaultRowsToRecord(fieldPatternRows);
    const inputDefaults = Object.keys(fieldPatterns).length > 0 ? { fieldPatterns, typeFallbacks: {} } : undefined;
    const codegenConfig =
      shouldGenerateTestCode && codegenBranch.trim().length > 0 && prTargetBranch.trim().length > 0
        ? {
            codegenBranch: codegenBranch.trim(),
            prTargetBranch: prTargetBranch.trim(),
            prTitle: prTitle.trim(),
            prBody: prBody.trim(),
            prDraft,
          }
        : undefined;

    return {
      trigger,
      crawlConfig: {
        maxStates: parsedMaxStates,
        timeoutSeconds: parsedTimeoutSeconds,
        generateTestFlows,
        generateTestCode: shouldGenerateTestCode,
        testFlowGeneration: {
          coveragePercentage: parsedCoveragePercentage,
          numOfTf: parsedNumOfTf,
          maxNumOfTf: parsedMaxNumOfTf,
          numOfStates: parsedNumOfStates,
          minNumOfStatesPerTf: parsedMinNumOfStatesPerTf,
        },
        crawlerSettings: {
          maxTransitions: parsedMaxTransitions,
          maxElementsPerState: parsedMaxElementsPerState,
          maxActionRepeatsPerUrl: parsedMaxActionRepeatsPerUrl,
          useSemanticDiversity,
        },
        inputDefaults,
      },
      codegenConfig,
    };
  };

  const switchConfigMode = (mode: SessionConfigMode) => {
    if (mode === "json") {
      setSessionJson(JSON.stringify(buildFormInput(), null, 2));
    }
    setConfigMode(mode);
  };

  const handleConfirm = () => {
    if (!canSave) return;
    onConfirm(configMode === "json" && jsonResult.data ? jsonResult.data : buildFormInput());
  };

  const renderInputDefaultRows = (
    label: string,
    rows: InputDefaultRow[],
    setRows: (rows: InputDefaultRow[]) => void,
  ) => (
    <div className={styles.inputDefaultsGroup}>
      <div className={styles.inputDefaultsHeader}>
        <Label>{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={styles.iconButton}
          onClick={() => setRows([...rows, createInputDefaultRow()])}
          aria-label={`Add ${label}`}
        >
          <Plus className={styles.iconSmall} />
        </Button>
      </div>
      <div className={styles.inputDefaultsRows}>
        {rows.map((row) => (
          <div className={styles.inputDefaultsRow} key={row.id}>
            <Input
              value={row.key}
              onChange={(event) =>
                setRows(rows.map((item) => (item.id === row.id ? { ...item, key: event.target.value } : item)))
              }
              placeholder="Key"
            />
            <Input
              value={row.value}
              onChange={(event) =>
                setRows(rows.map((item) => (item.id === row.id ? { ...item, value: event.target.value } : item)))
              }
              placeholder="Value"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={styles.iconButton}
              onClick={() =>
                setRows(rows.length > 1 ? rows.filter((item) => item.id !== row.id) : [createInputDefaultRow()])
              }
              aria-label={`Remove ${label}`}
            >
              <Trash2 className={styles.iconSmall} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
      <div className={styles.sessionModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create Crawl Session</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.configModeSwitch} role="group" aria-label="Session config mode">
            <button
              type="button"
              className={configMode === "form" ? styles.configModeButtonActive : styles.configModeButton}
              onClick={() => switchConfigMode("form")}
            >
              Form
            </button>
            <button
              type="button"
              className={configMode === "json" ? styles.configModeButtonActive : styles.configModeButton}
              onClick={() => switchConfigMode("json")}
            >
              JSON
            </button>
          </div>

          {configMode === "json" ? (
            <>
              <div className={styles.modalField}>
                <Label htmlFor="session-config-json">Session Config JSON</Label>
                <textarea
                  id="session-config-json"
                  className={styles.configJsonTextarea}
                  value={sessionJson}
                  onChange={(event) => setSessionJson(event.target.value)}
                  spellCheck={false}
                />
              </div>
              {jsonResult.error && <p className={styles.applicationError}>{jsonResult.error}</p>}
            </>
          ) : (
            <>
              <details className={styles.formSection} open>
                <summary className={styles.formSectionSummary}>Basics</summary>
                <div className={styles.formSectionBody}>
                  <div className={styles.modalGridTwo}>
                    <div className={styles.modalField}>
                      <Label>Trigger</Label>
                      <Select
                        options={TRIGGER_OPTIONS}
                        value={trigger}
                        onChange={(value) => value && setTrigger(value as CrawlSessionTrigger)}
                      />
                    </div>
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
                      <Label htmlFor="crawl-timeout">Timeout Seconds</Label>
                      <Input
                        id="crawl-timeout"
                        type="number"
                        min={1}
                        value={timeoutSeconds}
                        onChange={(event) => setTimeoutSeconds(event.target.value)}
                      />
                      <p className={styles.fieldHelp}>Stops crawling and continues with enabled follow-up steps.</p>
                    </div>
                  </div>

                  <label className={styles.modalCheckbox}>
                    <input
                      type="checkbox"
                      checked={generateTestFlows}
                      onChange={(event) => {
                        setGenerateTestFlows(event.target.checked);
                        if (!event.target.checked) setGenerateTestCode(false);
                      }}
                    />
                    <span>Create test flows after crawl</span>
                  </label>

                  <label className={styles.modalCheckbox}>
                    <input
                      type="checkbox"
                      checked={shouldGenerateTestCode}
                      disabled={!generateTestFlows}
                      onChange={(event) => setGenerateTestCode(event.target.checked)}
                    />
                    <span>Generate test code and open PR after flows are created</span>
                  </label>
                </div>
              </details>

              <details className={styles.formSection}>
                <summary className={styles.formSectionSummary}>Crawler Limits</summary>
                <div className={styles.formSectionBody}>
                  <div className={styles.modalGridThree}>
                    <div className={styles.modalField}>
                      <Label htmlFor="crawl-max-transitions">Max Transitions</Label>
                      <Input
                        id="crawl-max-transitions"
                        type="number"
                        min={1}
                        value={maxTransitions}
                        onChange={(event) => setMaxTransitions(event.target.value)}
                      />
                    </div>
                    <div className={styles.modalField}>
                      <Label htmlFor="crawl-max-elements">Max Elements per State</Label>
                      <Input
                        id="crawl-max-elements"
                        type="number"
                        min={1}
                        value={maxElementsPerState}
                        onChange={(event) => setMaxElementsPerState(event.target.value)}
                      />
                    </div>
                    <div className={styles.modalField}>
                      <Label htmlFor="crawl-action-repeats">Action Repeats per URL</Label>
                      <Input
                        id="crawl-action-repeats"
                        type="number"
                        min={0}
                        value={maxActionRepeatsPerUrl}
                        onChange={(event) => setMaxActionRepeatsPerUrl(event.target.value)}
                      />
                    </div>
                  </div>
                  <label className={styles.modalCheckbox}>
                    <input
                      type="checkbox"
                      checked={useSemanticDiversity}
                      onChange={(event) => setUseSemanticDiversity(event.target.checked)}
                    />
                    <span>Use semantic diversity</span>
                  </label>
                </div>
              </details>

              <details className={styles.formSection}>
                <summary className={styles.formSectionSummary}>Test Flow Selection</summary>
                <div className={styles.formSectionBody}>
                  <div className={styles.modalGridTwo}>
                    <div className={styles.modalField}>
                      <Label htmlFor="tf-coverage-percentage">Coverage Percentage</Label>
                      <Input
                        id="tf-coverage-percentage"
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={coveragePercentage}
                        onChange={(event) => setCoveragePercentage(event.target.value)}
                      />
                    </div>
                    <div className={styles.modalField}>
                      <Label htmlFor="tf-count">Minimum Test Flows</Label>
                      <Input
                        id="tf-count"
                        type="number"
                        min={1}
                        value={numOfTf}
                        onChange={(event) => setNumOfTf(event.target.value)}
                      />
                      <p className={styles.fieldHelp}>Try to select at least this many flows.</p>
                    </div>
                    <div className={styles.modalField}>
                      <Label htmlFor="tf-max-count">Maximum Test Flows</Label>
                      <Input
                        id="tf-max-count"
                        type="number"
                        min={1}
                        value={maxNumOfTf}
                        onChange={(event) => setMaxNumOfTf(event.target.value)}
                      />
                      <p className={styles.fieldHelp}>Stop selection once this many flows are selected.</p>
                    </div>
                    <div className={styles.modalField}>
                      <Label htmlFor="tf-num-states">States per Test Flow</Label>
                      <Input
                        id="tf-num-states"
                        type="number"
                        min={1}
                        value={numOfStates}
                        onChange={(event) => setNumOfStates(event.target.value)}
                      />
                    </div>
                    <div className={styles.modalField}>
                      <Label htmlFor="tf-min-states">Minimum States per Test Flow</Label>
                      <Input
                        id="tf-min-states"
                        type="number"
                        min={1}
                        value={minNumOfStatesPerTf}
                        onChange={(event) => setMinNumOfStatesPerTf(event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </details>

              <details className={styles.formSection}>
                <summary className={styles.formSectionSummary}>Input Defaults</summary>
                <div className={styles.formSectionBody}>
                  {renderInputDefaultRows("Field Patterns", fieldPatternRows, setFieldPatternRows)}
                  {inputDefaultsInvalid && (
                    <p className={styles.applicationError}>Each input default needs both a key and a value.</p>
                  )}
                  {inputDefaultsDuplicated && (
                    <p className={styles.applicationError}>Input default keys must be unique.</p>
                  )}
                </div>
              </details>

              <details
                className={`${styles.formSection} ${shouldGenerateTestCode ? "" : styles.disabledSection}`}
              >
                <summary className={styles.formSectionSummary}>Code Generation and PR</summary>
                <div className={styles.formSectionBody}>
                  <div className={styles.modalGridTwo}>
                    <div className={styles.modalField}>
                      <Label htmlFor="codegen-branch">Codegen Branch</Label>
                      <Input
                        id="codegen-branch"
                        value={codegenBranch}
                        disabled={!shouldGenerateTestCode}
                        onChange={(event) => setCodegenBranch(event.target.value)}
                      />
                    </div>
                    <div className={styles.modalField}>
                      <Label htmlFor="pr-target-branch">PR Target Branch</Label>
                      <Input
                        id="pr-target-branch"
                        value={prTargetBranch}
                        disabled={!shouldGenerateTestCode}
                        onChange={(event) => setPrTargetBranch(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.modalField}>
                    <Label htmlFor="pr-title">PR Title</Label>
                    <Input
                      id="pr-title"
                      value={prTitle}
                      disabled={!shouldGenerateTestCode}
                      onChange={(event) => setPrTitle(event.target.value)}
                    />
                  </div>
                  <div className={styles.modalField}>
                    <Label htmlFor="pr-body">PR Body</Label>
                    <textarea
                      id="pr-body"
                      className={styles.modalTextarea}
                      value={prBody}
                      disabled={!shouldGenerateTestCode}
                      onChange={(event) => setPrBody(event.target.value)}
                    />
                  </div>
                  <label className={styles.modalCheckbox}>
                    <input
                      type="checkbox"
                      checked={prDraft}
                      disabled={!shouldGenerateTestCode}
                      onChange={(event) => setPrDraft(event.target.checked)}
                    />
                    <span>Create PR as draft</span>
                  </label>
                </div>
              </details>
            </>
          )}

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

interface DeleteCrawlSessionModalProps {
  sessionId: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteCrawlSessionModal = ({
  sessionId,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteCrawlSessionModalProps) => (
  <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>Delete Crawl Session</h3>
        <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose} disabled={isDeleting}>
          <X className={styles.iconSmall} />
        </Button>
      </div>
      <div className={styles.modalBody}>
        <p className={styles.mutedText}>
          Delete crawl session <strong>{sessionId}</strong>? Active sessions will be aborted before they
          are removed.
        </p>
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Session"}
          </Button>
        </div>
      </div>
    </div>
  </div>
);

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
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
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
  <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
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
