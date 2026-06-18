// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the application root for full license information.

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { Button, Input, Label } from "@shared/ui";
import styles from "./Applications.module.scss";

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
