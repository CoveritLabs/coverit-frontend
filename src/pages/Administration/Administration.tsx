// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useReducer, useState } from "react";
import {
  Users,
  Plus,
  Settings,
  ChevronRight,
  UserPlus,
  FolderKanban,
  Search,
  Edit2,
  Trash2,
  LogOut,
} from "lucide-react";
import { Button, Input } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import { useProjects } from "@features/projects";
import {
  useAddProjectMembers,
  useCreateProject,
  useDeleteProject,
  useLeaveProject,
  useRemoveProjectMembers,
  useUpdateProject,
  useUpdateProjectMember,
} from "@features/projects";
import type { ProjectRole } from "@features/projects";
import { DEFAULT_PROJECT_ROLE } from "@features/projects";
import { getProjectUserRole, normalizeProjectRole } from "@features/projects";
import { GRADIENTS } from "@shared/constants/gradients";
import styles from "./Administration.module.scss";
import { AdministrationMembersTable } from "./AdministrationMembersTable";
import {
  AddProjectModal,
  EditProjectModal,
  DeleteProjectModal,
  AddMemberModal,
  LeaveProjectModal,
} from "./AdministrationModals";
import { useAuthStore, useUIStore } from "@app/store";

type ModalState =
  | { type: "none" }
  | { type: "addProject" }
  | { type: "editProject" }
  | { type: "deleteProject" }
  | { type: "addMember" }
  | { type: "leaveProject" };

type ModalAction = { type: ModalState["type"] };

const modalReducer = (_: ModalState, action: ModalAction): ModalState =>
  action.type === "none" ? { type: "none" } : { type: action.type };

const Administration = () => {
  const { data: projects = [], isLoading, isError } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const leaveProject = useLeaveProject();
  const addMembers = useAddProjectMembers();
  const updateMember = useUpdateProjectMember();
  const removeMembers = useRemoveProjectMembers();
  const user = useAuthStore((state) => state.user);

  const storeSelectedProject = useUIStore((s) => s.selectedProject);
  const setUserRole = useUIStore((s) => s.setUserRole);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, dispatchModal] = useReducer(modalReducer, { type: "none" });

  const closeModal = () => dispatchModal({ type: "none" });

  const projectCards = useMemo(
    () =>
      projects.map((project, index) => ({
        project,
        gradient: GRADIENTS[index % GRADIENTS.length],
        memberCount: project.members?.length ?? 0,
        description: project.description?.trim() || "No description",
      })),
    [projects],
  );

  const selectedProjectCard = useMemo(
    () => projectCards.find((card) => card.project.id === selectedProjectId) ?? null,
    [projectCards, selectedProjectId],
  );
  const selectedProject = selectedProjectCard?.project ?? null;
  const currentMembers = selectedProject?.members ?? [];
  const userRole = useMemo(() => getProjectUserRole(selectedProject, user?.id), [selectedProject, user?.id]);
  const isAdmin = userRole === "ADMIN";
  const canLeaveProject = Boolean(selectedProject && userRole && user?.email);
  const adminCount = useMemo(
    () => currentMembers.filter((member) => normalizeProjectRole(member.role) === "ADMIN").length,
    [currentMembers],
  );
  const isOnlyAdmin = Boolean(user?.id && isAdmin && adminCount === 1);
  const isOnlyMember =
    Boolean(selectedProject) && currentMembers.length === 1 && currentMembers[0]?.user?.id === user?.id;

  useEffect(() => {
    if (!projectCards.length) {
      setSelectedProjectId(null);
      return;
    }
    if (!selectedProjectId || !projectCards.some((card) => card.project.id === selectedProjectId)) {
      setSelectedProjectId(projectCards[0].project.id);
    }
  }, [projectCards, selectedProjectId]);

  const filteredMembers = useMemo(
    () =>
      currentMembers.filter((member) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          (member.user?.name ?? "").toLowerCase().includes(query) ||
          (member.user?.email ?? "").toLowerCase().includes(query)
        );
      }),
    [currentMembers, searchQuery],
  );

  const isProjectNameDuplicate = (name: string, ignoreId?: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return false;
    return projects.some((p) => p.id !== ignoreId && p.name.trim().toLowerCase() === normalized);
  };

  const handleAddProject = (name: string, description: string) => {
    createProject.mutate(
      { name, ...(description && { description }) },
      {
        onSuccess: (data) => {
          closeModal();
          setSelectedProjectId(data.id);
        },
      },
    );
  };

  const handleUpdateProject = (name: string, description: string) => {
    if (!selectedProject) return;
    updateProject.mutate({ projectId: selectedProject.id, data: { name, description } }, { onSuccess: closeModal });
  };

  const handleDeleteProject = () => {
    if (!selectedProject) return;
    deleteProject.mutate(
      { projectId: selectedProject.id },
      {
        onSuccess: () => {
          closeModal();
          setSelectedProjectId(null);
        },
      },
    );
  };

  const handleAddMember = (email: string, role: ProjectRole) => {
    if (!selectedProjectId) return;
    addMembers.mutate(
      { projectId: selectedProjectId, data: { members: [{ email, role }] } },
      { onSuccess: closeModal },
    );
  };

  const handleUpdateRole = (memberId: string, newRole: ProjectRole) => {
    if (!isAdmin || !selectedProjectId) return;
    if (isOnlyAdmin && memberId === user?.id) return;
    updateMember.mutate(
      { projectId: selectedProjectId, data: { id: memberId, role: newRole } },
      {
        onSuccess: () => {
          setEditingMemberId(null);
          if (memberId === user?.id && storeSelectedProject?.id === selectedProjectId) {
            setUserRole(newRole);
          }
        },
      },
    );
  };

  const handleRemoveMember = (email: string | undefined) => {
    if (!isAdmin || !selectedProjectId || !email) return;
    removeMembers.mutate({ projectId: selectedProjectId, data: { emails: [email] } });
  };

  const handleLeaveProject = () => {
    if (!selectedProject || !canLeaveProject) return;
    leaveProject.mutate(
      { projectId: selectedProject.id },
      {
        onSuccess: () => {
          closeModal();
          setSelectedProjectId(null);
        },
      },
    );
  };

  return (
    <div className={styles.container}>
      {/* Left Panel - Projects List */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitleRow}>
            <div className={styles.sidebarTitle}>
              <Settings className={styles.iconPrimary} />
              <h2 className={styles.sidebarHeading}>Administration</h2>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className={styles.iconButton}
              onClick={() => dispatchModal({ type: "addProject" })}
            >
              <Plus className={styles.iconSmall} />
            </Button>
          </div>
          <p className={styles.sidebarSubtitle}>Manage projects and team members</p>
        </div>

        <div className={styles.projectSection}>
          <h3 className={styles.projectSectionTitle}>Projects ({projectCards.length})</h3>
          <div className={styles.projectList}>
            {isLoading && <p className={styles.projectMeta}>Loading projects...</p>}
            {isError && !isLoading && <p className={styles.projectError}>Failed to load projects.</p>}
            {!isLoading && !isError && projectCards.length === 0 && (
              <p className={styles.projectMeta}>No projects yet.</p>
            )}
            {projectCards.map((card) => (
              <button
                key={card.project.id}
                onClick={() => setSelectedProjectId(card.project.id)}
                className={cn(styles.projectItem, selectedProject?.id === card.project.id && styles.projectItemActive)}
              >
                <div className={styles.projectIcon} style={{ background: card.gradient }}>
                  <FolderKanban className={styles.iconSmall} />
                </div>
                <div className={styles.projectInfo}>
                  <p className={styles.projectName}>{card.project.name}</p>
                  <div className={styles.projectMetaRow}>
                    <div className={styles.projectMetaGroup}>
                      <Users className={styles.iconTinyMuted} />
                      <span>{card.memberCount}</span>
                    </div>
                    <span className={styles.projectMetaDivider}>•</span>
                    <span className={styles.projectDescription}>{card.description}</span>
                  </div>
                </div>
                {selectedProject?.id === card.project.id && <ChevronRight className={styles.projectChevron} />}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right Panel - Members Management */}
      <main className={styles.main}>
        {selectedProject ? (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerInfo}>
                  <div
                    className={styles.headerIcon}
                    style={{ background: selectedProjectCard?.gradient ?? GRADIENTS[0] }}
                  >
                    <FolderKanban className={styles.iconMedium} />
                  </div>
                  <div>
                    <h1 className={styles.headerTitle}>{selectedProject.name}</h1>
                    <p className={styles.headerSubtitle}>
                      {currentMembers.length} {currentMembers.length === 1 ? "member" : "members"}
                    </p>
                  </div>
                </div>
                {(isAdmin || canLeaveProject) && (
                  <div className={styles.headerActions}>
                    {isAdmin && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={styles.actionIconButton}
                          onClick={() => dispatchModal({ type: "addMember" })}
                          aria-label="Add member"
                          title="Add member"
                        >
                          <UserPlus className={styles.iconLarge} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={styles.actionIconButton}
                          onClick={() => dispatchModal({ type: "editProject" })}
                          aria-label="Edit project"
                          title="Edit project"
                        >
                          <Edit2 className={styles.iconLarge} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(styles.actionIconButton, styles.dangerButton)}
                          onClick={() => dispatchModal({ type: "deleteProject" })}
                          aria-label="Delete project"
                          title="Delete project"
                        >
                          <Trash2 className={styles.iconLarge} />
                        </Button>
                      </>
                    )}
                    {canLeaveProject && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className={styles.actionIconButton}
                        onClick={() => dispatchModal({ type: "leaveProject" })}
                        aria-label="Leave project"
                        title="Leave project"
                      >
                        <LogOut className={styles.iconLarge} />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Search */}
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} />
                <Input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            {/* Members Table */}
            <AdministrationMembersTable
              members={filteredMembers}
              editingMemberId={editingMemberId}
              canManage={isAdmin}
              currentUserId={user?.id}
              disableSelfRoleEdit={isOnlyAdmin}
              onStartEdit={setEditingMemberId}
              onCancelEdit={() => setEditingMemberId(null)}
              onUpdateRole={handleUpdateRole}
              onRemoveMember={handleRemoveMember}
            />
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>
                <Users className={styles.iconMediumMuted} />
              </div>
              <h3 className={styles.emptyTitle}>Select a Project</h3>
              <p className={styles.emptyText}>Choose a project from the left to view and manage its members</p>
            </div>
          </div>
        )}
      </main>

      {modal.type === "addProject" && (
        <AddProjectModal isNameDuplicate={isProjectNameDuplicate} onConfirm={handleAddProject} onClose={closeModal} />
      )}

      {modal.type === "editProject" && selectedProject && isAdmin && (
        <EditProjectModal
          initialName={selectedProject.name}
          initialDescription={selectedProject.description ?? ""}
          isNameDuplicate={(name) => isProjectNameDuplicate(name, selectedProject.id)}
          onConfirm={handleUpdateProject}
          onClose={closeModal}
        />
      )}

      {modal.type === "deleteProject" && selectedProject && isAdmin && (
        <DeleteProjectModal projectName={selectedProject.name} onConfirm={handleDeleteProject} onClose={closeModal} />
      )}

      {modal.type === "addMember" && isAdmin && (
        <AddMemberModal defaultRole={DEFAULT_PROJECT_ROLE} onConfirm={handleAddMember} onClose={closeModal} />
      )}

      {modal.type === "leaveProject" && selectedProject && canLeaveProject && (
        <LeaveProjectModal isOnlyMember={isOnlyMember} onConfirm={handleLeaveProject} onClose={closeModal} />
      )}
    </div>
  );
};

export default Administration;
