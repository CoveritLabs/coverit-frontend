// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the application root for full license information.

import { useState } from "react";
import { X } from "lucide-react";
import { Button, Input, Label } from "@components/ui";
import styles from "./Applications.module.scss";

interface AddApplicationModalProps {
  isNameDuplicate: (name: string) => boolean;
  onConfirm: (name: string, baseUrl: string) => void;
  onClose: () => void;
}

export const AddApplicationModal = ({ isNameDuplicate, onConfirm, onClose }: AddApplicationModalProps) => {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const isDuplicate = isNameDuplicate(name);
  const isValid = name.trim().length > 0 && !isDuplicate;

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
