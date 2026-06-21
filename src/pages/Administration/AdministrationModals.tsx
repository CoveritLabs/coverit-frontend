// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { type MouseEvent, useState } from "react";
import { X } from "lucide-react";
import { Button, Input, Label } from "@shared/ui";
import type { ProjectRole } from "@features/projects";
import { PROJECT_ROLES } from "@features/projects";
import { formatProjectRole } from "@features/projects";
import styles from "./Administration.module.scss";

function closeOnBackdropMouseDown(event: MouseEvent<HTMLDivElement>, onClose: () => void) {
  if (event.target === event.currentTarget) {
    onClose();
  }
}

interface AddProjectModalProps {
  isNameDuplicate: (name: string) => boolean;
  onConfirm: (name: string, description: string) => void;
  onClose: () => void;
}

export const AddProjectModal = ({ isNameDuplicate, onConfirm, onClose }: AddProjectModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const isDuplicate = isNameDuplicate(name);
  const isValid = name.trim().length > 0 && !isDuplicate;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(name.trim(), description.trim());
    }
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create New Project</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalField}>
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Project"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
            {isDuplicate && <p className={styles.projectError}>This project name already exists.</p>}
          </div>
          <div className={styles.modalField}>
            <Label htmlFor="project-description">Description (optional)</Label>
            <Input
              id="project-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description about the project"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              maxLength={200}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!isValid}>
              Create Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EditProjectModalProps {
  initialName: string;
  initialDescription: string;
  isNameDuplicate: (name: string) => boolean;
  onConfirm: (name: string, description: string) => void;
  onClose: () => void;
}

export const EditProjectModal = ({
  initialName,
  initialDescription,
  isNameDuplicate,
  onConfirm,
  onClose,
}: EditProjectModalProps) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const isDuplicate = isNameDuplicate(name);
  const hasChanges = name.trim() !== initialName || description.trim() !== initialDescription;
  const isValid = name.trim().length > 0 && !isDuplicate && hasChanges;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(name.trim(), description.trim());
    }
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edit Project</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalField}>
            <Label htmlFor="edit-project-name">Project Name</Label>
            <Input
              id="edit-project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
            {isDuplicate && <p className={styles.projectError}>This project name already exists.</p>}
          </div>
          <div className={styles.modalField}>
            <Label htmlFor="edit-project-description">Description</Label>
            <Input
              id="edit-project-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
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

interface DeleteProjectModalProps {
  projectName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteProjectModal = ({ projectName, onConfirm, onClose }: DeleteProjectModalProps) => {
  const [confirmName, setConfirmName] = useState("");
  const deleteMatches = confirmName === projectName;

  return (
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Delete Project</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.mutedText}>This will permanently delete {projectName} and remove its members.</p>
          <div className={styles.modalField}>
            <Label htmlFor="delete-project-confirm">
              Type <strong>{projectName}</strong> to confirm
            </Label>
            <Input
              id="delete-project-confirm"
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={projectName}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={!deleteMatches}>
              Delete Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AddMemberModalProps {
  defaultRole: ProjectRole;
  onConfirm: (email: string, role: ProjectRole) => void;
  onClose: () => void;
}

export const AddMemberModal = ({ defaultRole, onConfirm, onClose }: AddMemberModalProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>(defaultRole);

  const isValid = email.trim().length > 0;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(email.trim(), role);
    }
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add Team Member</h3>
          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
            <X className={styles.iconSmall} />
          </Button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalField}>
            <Label htmlFor="member-email">Email Address</Label>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
          </div>
          <div className={styles.modalField}>
            <Label htmlFor="member-role">Role</Label>
            <select
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
              className={styles.roleSelect}
            >
              {PROJECT_ROLES.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {formatProjectRole(roleOption)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!isValid}>
              Add Member
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LeaveProjectModalProps {
  isOnlyMember: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const LeaveProjectModal = ({ isOnlyMember, onConfirm, onClose }: LeaveProjectModalProps) => (
  <div className={styles.modalOverlay} onMouseDown={(event) => closeOnBackdropMouseDown(event, onClose)}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>Leave Project</h3>
        <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onClose}>
          <X className={styles.iconSmall} />
        </Button>
      </div>
      <div className={styles.modalBody}>
        <p className={styles.mutedText}>
          {isOnlyMember
            ? "You are the only member. Leaving will delete this project."
            : "You will lose access to this project and its members."}
        </p>
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {isOnlyMember ? "Leave and delete" : "Leave project"}
          </Button>
        </div>
      </div>
    </div>
  </div>
);
