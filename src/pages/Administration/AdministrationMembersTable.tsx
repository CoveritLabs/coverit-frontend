// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useState } from "react";
import { Mail, Edit2, Search, Trash2, X } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@shared/ui";
import { cn } from "@shared/utils/cn";
import { getInitials } from "@shared/utils/text";
import type { ProjectRole } from "@features/projects";
import { PROJECT_ROLES } from "@features/projects";
import { formatProjectRole, normalizeProjectRole } from "@features/projects";
import type { Member } from "@coveritlabs/contracts";
import styles from "./Administration.module.scss";

interface MembersTableProps {
  members: Member[];
  searchQuery: string;
  editingMemberId: string | null;
  canManage: boolean;
  currentUserId?: string;
  disableSelfRoleEdit?: boolean;
  onSearchChange: (value: string) => void;
  onStartEdit: (memberId: string) => void;
  onCancelEdit: () => void;
  onUpdateRole: (memberId: string, role: ProjectRole) => void;
  onRemoveMember: (email?: string) => void;
}

const roleClassMap: Record<ProjectRole, string> = {
  ADMIN: styles.roleAdmin,
  MEMBER: styles.roleMember,
  VIEWER: styles.roleViewer,
};

const roleAvatarMap: Record<ProjectRole, string> = {
  ADMIN: styles.roleAvatarAdmin,
  MEMBER: styles.roleAvatarMember,
  VIEWER: styles.roleAvatarViewer,
};

export function AdministrationMembersTable({
  members,
  searchQuery,
  editingMemberId,
  canManage,
  currentUserId,
  disableSelfRoleEdit = false,
  onSearchChange,
  onStartEdit,
  onCancelEdit,
  onUpdateRole,
  onRemoveMember,
}: MembersTableProps) {
  const displayMembers = useMemo(
    () =>
      (members || []).sort((a, b) => {
        const roleA = normalizeProjectRole(a.role);
        const roleB = normalizeProjectRole(b.role);
        if (roleA !== roleB) {
          return PROJECT_ROLES.indexOf(roleA) - PROJECT_ROLES.indexOf(roleB);
        }
        const nameA = a.user?.name || "";
        const nameB = b.user?.name || "";
        return nameA.localeCompare(nameB);
      }),
    [members],
  );
  const pageSize = 25;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(displayMembers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, displayMembers.length);
  const pageMembers = displayMembers.slice(startIndex, endIndex);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [members.length]);

  return (
    <div className={styles.tableSection}>
      <div className={styles.memberSearchBar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <Input
            type="text"
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>
      <Card className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Member</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                {canManage && <TableHeaderCell className={styles.tableHeaderCellCenter}>Actions</TableHeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {pageMembers.map((member, index) => {
                const normalizedRole = normalizeProjectRole(member.role);
                const memberId = member.user?.id ?? "";
                const memberName = member.user?.name || "Unknown";
                const memberEmail = member.user?.email;
                const isSelf = Boolean(currentUserId && memberId) && currentUserId === memberId;
                const selfEditDisabled = disableSelfRoleEdit && isSelf;
                const isEditing = canManage && !selfEditDisabled && Boolean(memberId) && editingMemberId === memberId;

                return (
                  <TableRow key={`${memberId || memberEmail || normalizedRole}-${startIndex + index}`}>
                    <TableCell>
                      <div className={styles.memberRow}>
                        <div className={cn(styles.memberAvatar, roleAvatarMap[normalizedRole])} aria-hidden="true">
                          {getInitials(memberName)}
                        </div>
                        <div className={styles.memberInfo}>
                          <p className={styles.memberName}>{memberName}</p>
                          <div className={styles.memberEmail}>
                            <Mail className={styles.iconTinyMuted} />
                            <span>{memberEmail || "No email"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <div className={styles.roleEditRow}>
                          <select
                            value={normalizedRole}
                            onChange={(event) => onUpdateRole(memberId, event.target.value as ProjectRole)}
                            className={styles.roleSelect}
                          >
                            {PROJECT_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {formatProjectRole(role)}
                              </option>
                            ))}
                          </select>
                          <Button size="sm" variant="ghost" className={styles.iconButton} onClick={onCancelEdit}>
                            <X className={styles.iconSmall} />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline" className={cn(styles.roleBadge, roleClassMap[normalizedRole])}>
                          {formatProjectRole(normalizedRole)}
                        </Badge>
                      )}
                    </TableCell>

                    {canManage && (
                      <TableCell className={styles.tableCellCenter}>
                        <div className={styles.actionButtons}>
                          {!isEditing && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={styles.iconButton}
                                onClick={() => onStartEdit(memberId)}
                                disabled={!memberId || selfEditDisabled}
                                title={selfEditDisabled ? "You are the only admin" : "Edit role"}
                              >
                                <Edit2 className={styles.iconLarge} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={cn(styles.iconButton, styles.dangerButton)}
                                onClick={() => onRemoveMember(memberEmail)}
                                disabled={!memberEmail}
                              >
                                <Trash2 className={styles.iconLarge} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {displayMembers.length > 0 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Showing {displayMembers.length ? startIndex + 1 : 0}-{endIndex} of {displayMembers.length}
            </span>
            <div className={styles.paginationControls}>
              <Button
                size="sm"
                variant="ghost"
                className={styles.paginationButton}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <span className={styles.paginationPage}>
                {currentPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className={styles.paginationButton}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
