// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useReducer, useState } from "react";
import { Package, Plus, ChevronRight, FolderKanban, Edit2, Trash2, Globe, KeyRound, X } from "lucide-react";
import { Button } from "@shared/ui";
import { cn } from "@shared/utils/cn";
import { useTargetApplications } from "@features/target-applications";
import {
  useCreateTargetApplication,
  useUpdateTargetApplication,
  useDeleteTargetApplication,
  useCreateTargetApplicationVersion,
  useDeleteTargetApplicationVersion,
  useRotateTargetApplicationApiKey,
} from "@features/target-applications";
import { getProjectUserRole } from "@features/projects";
import { GRADIENTS } from "@shared/constants/gradients";
import styles from "./Applications.module.scss";
import { useAuthStore, useUIStore } from "@app/store";
import { ProjectResponse } from "@coveritlabs/contracts";
import {
  AddApplicationModal,
  AddVersionModal,
  DeleteVersionModal,
  DeleteApplicationModal,
  EditApplicationModal,
  RotateApiKeyModal,
} from "./ApplicationsModals";

type ModalState =
  | { type: "none" }
  | { type: "addApplication" }
  | { type: "editApplication" }
  | { type: "deleteApplication" }
  | { type: "addVersion" }
  | { type: "deleteVersion" }
  | { type: "rotateApiKey" };

type ModalAction = { type: ModalState["type"] };

const modalReducer = (_: ModalState, action: ModalAction): ModalState =>
  action.type === "none" ? { type: "none" } : { type: action.type };

const Applications = () => {
  const selectedProject = useUIStore((s) => s.selectedProject);
  const { data: applications = [], isLoading, isError } = useTargetApplications(selectedProject?.id ?? null);
  const createTargetApplication = useCreateTargetApplication();
  const updateTargetApplication = useUpdateTargetApplication();
  const deleteTargetApplication = useDeleteTargetApplication();
  const createTargetApplicationVersion = useCreateTargetApplicationVersion();
  const deleteTargetApplicationVersion = useDeleteTargetApplicationVersion();
  const rotateTargetApplicationApiKey = useRotateTargetApplicationApiKey();
  const user = useAuthStore((state) => state.user);

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [rotatedApiKey, setRotatedApiKey] = useState<string | null>(null);
  const [modal, dispatchModal] = useReducer(modalReducer, { type: "none" });

  const closeModal = () => dispatchModal({ type: "none" });

  const applicationCards = useMemo(
    () =>
      applications.map((application, index) => ({
        application,
        gradient: GRADIENTS[index % GRADIENTS.length],
        versionCount: application.versions?.length ?? 0,
        baseUrl: application.baseUrl?.trim() || "No description",
      })),
    [applications],
  );

  const selectedApplicationCard = useMemo(
    () => applicationCards.find((card) => card.application.id === selectedApplicationId) ?? null,
    [applicationCards, selectedApplicationId],
  );
  const selectedApplication = selectedApplicationCard?.application ?? null;
  const currentVersions = selectedApplication?.versions ?? [];
  const selectedVersion = currentVersions.find((version) => version.id === selectedVersionId) ?? null;
  const userRole = useMemo(
    () => getProjectUserRole(selectedProject as ProjectResponse | null, user?.id),
    [selectedProject, user?.id],
  );
  const isAdmin = userRole === "ADMIN";
  const isMember = userRole === "ADMIN" || userRole === "MEMBER";

  useEffect(() => {
    if (!applicationCards.length) {
      setSelectedApplicationId(null);
      return;
    }
    if (!selectedApplicationId || !applicationCards.some((card) => card.application.id === selectedApplicationId)) {
      setSelectedApplicationId(applicationCards[0].application.id);
    }
  }, [applicationCards, selectedApplicationId]);

  useEffect(() => {
    if (!currentVersions.length) {
      setSelectedVersionId(null);
      return;
    }

    if (!selectedVersionId || !currentVersions.some((version) => version.id === selectedVersionId)) {
      setSelectedVersionId(currentVersions[0].id);
    }
  }, [currentVersions, selectedVersionId]);

  const isApplicationNameDuplicate = (name: string, ignoreId?: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return false;
    return applications.some((a) => a.id !== ignoreId && a.name.trim().toLowerCase() === normalized);
  };

  const isVersionNameDuplicate = (version: string, ignoreId?: string) => {
    const normalized = version.trim().toLowerCase();
    if (!normalized) return false;
    return currentVersions.some((v) => v.id !== ignoreId && v.version.trim().toLowerCase() === normalized);
  };

  const handleAddApplication = (name: string, baseUrl: string) => {
    createTargetApplication.mutate(
      { projectId: selectedProject!.id, data: { name, baseUrl } },
      {
        onSuccess: (data) => {
          setSelectedApplicationId(data.id);
          setRotatedApiKey(data.apiKey || null);
        },
      },
    );
  };

  const handleUpdateApplication = (name: string, baseUrl: string) => {
    if (!selectedApplication) return;
    updateTargetApplication.mutate(
      {
        projectId: selectedProject!.id,
        applicationId: selectedApplication.id,
        data: { name, baseUrl },
      },
      { onSuccess: closeModal },
    );
  };

  const handleDeleteApplication = () => {
    if (!selectedApplication) return;
    deleteTargetApplication.mutate(
      { projectId: selectedProject!.id, applicationId: selectedApplication.id },
      {
        onSuccess: () => {
          closeModal();
          setSelectedApplicationId(null);
        },
      },
    );
  };

  const handleAddVersion = (version: string) => {
    if (!selectedApplication) return;
    createTargetApplicationVersion.mutate(
      {
        projectId: selectedProject!.id,
        applicationId: selectedApplication.id,
        data: { version },
      },
      {
        onSuccess: () => {
          closeModal();
        },
      },
    );
  };

  const handleDeleteVersion = (versionId: string) => {
    if (!selectedApplication) return;
    const remainingVersions = currentVersions.filter((version) => version.id !== versionId);
    deleteTargetApplicationVersion.mutate(
      {
        projectId: selectedProject!.id,
        applicationId: selectedApplication.id,
        versionId,
      },
      {
        onSuccess: () => {
          closeModal();
          setSelectedVersionId(remainingVersions[0]?.id ?? null);
        },
      },
    );
  };

  const handleRotateApiKey = () => {
    if (!selectedApplication) return;
    rotateTargetApplicationApiKey.mutate(
      { projectId: selectedProject!.id, applicationId: selectedApplication.id },
      {
        onSuccess: (data) => {
          setRotatedApiKey(data.apiKey);
        },
      },
    );
  };

  return (
    <div className={styles.container}>
      {/* Left Panel - Applications List */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitleRow}>
            <div className={styles.sidebarTitle}>
              <h2 className={styles.sidebarHeading}>Applications</h2>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                className={styles.iconButton}
                onClick={() => dispatchModal({ type: "addApplication" })}
              >
                <Plus className={styles.iconSmall} />
              </Button>
            )}
          </div>
        </div>

        <div className={styles.projectSection}>
          <h3 className={styles.projectSectionTitle}>Applications ({applicationCards.length})</h3>
          <div className={styles.projectList}>
            {isLoading && <p className={styles.projectMeta}>Loading applications...</p>}
            {isError && !isLoading && <p className={styles.projectError}>Failed to load applications.</p>}
            {!isLoading && !isError && applicationCards.length === 0 && (
              <p className={styles.projectMeta}>No Applications yet.</p>
            )}
            {applicationCards.map((card) => (
              <button
                key={card.application.id}
                onClick={() => setSelectedApplicationId(card.application.id)}
                className={cn(
                  styles.projectItem,
                  selectedApplication?.id === card.application.id && styles.projectItemActive,
                )}
              >
                <div className={styles.projectIcon} style={{ background: card.gradient }}>
                  <FolderKanban className={styles.iconSmall} />
                </div>
                <div className={styles.projectInfo}>
                  <p className={styles.projectName}>{card.application.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{card.application.baseUrl}</p>
                  <div className={styles.projectMetaRow}>
                    <div className={styles.projectMetaGroup}>
                      <Package className={styles.iconTinyMuted} />
                      <span>{card.versionCount}</span>
                    </div>
                  </div>
                </div>
                {selectedApplication?.id === card.application.id && <ChevronRight className={styles.projectChevron} />}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right Panel - Versions Management */}
      <main className={styles.main}>
        {selectedApplication ? (
          <>
            <div className={styles.applicationHeader}>
              <div className={styles.applicationHeaderTop}>
                <div className={styles.applicationHeaderInfo}>
                  <div
                    className={styles.applicationHeaderIcon}
                    style={{ background: selectedApplicationCard?.gradient }}
                  >
                    <FolderKanban className={styles.iconMedium} />
                  </div>

                  <div>
                    <h1 className={styles.applicationTitle}>{selectedApplication.name}</h1>
                    <p className={styles.applicationSubtitle}>{selectedApplication.baseUrl}</p>
                  </div>
                </div>

                {isAdmin ? (
                  <div className={styles.applicationActions}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={styles.actionIconButton}
                      onClick={() => dispatchModal({ type: "rotateApiKey" })}
                      aria-label="Rotate API key"
                      title="Rotate API key"
                    >
                      <KeyRound className={styles.iconLarge} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={styles.actionIconButton}
                      onClick={() => dispatchModal({ type: "editApplication" })}
                      aria-label="Edit application"
                      title="Edit application"
                    >
                      <Edit2 className={styles.iconLarge} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(styles.actionIconButton, styles.dangerButton)}
                      onClick={() => dispatchModal({ type: "deleteApplication" })}
                      aria-label="Delete Application"
                      title="Delete Application"
                    >
                      <Trash2 className={styles.iconLarge} />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => dispatchModal({ type: "addVersion" })}
                      aria-label="Add application version"
                      title="Add application version"
                    >
                      <Plus className={styles.iconLarge} />
                      Add Version
                    </Button>
                  </div>
                ) : isMember ? (
                  <div className={styles.applicationActions}>
                    <Button
                      size="sm"
                      onClick={() => dispatchModal({ type: "addVersion" })}
                      aria-label="Add application version"
                      title="Add application version"
                    >
                      <Plus className={styles.iconLarge} />
                      Add Version
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            {currentVersions.length > 0 ? (
              <>
                <div className={styles.versionBar}>
                  <div className={styles.versionBarContent}>
                    <span className={styles.versionLabel}>Versions</span>

                    <div className={styles.versionList}>
                      {currentVersions.map((version) => {
                        const isSelected = selectedVersionId === version.id;

                        return (
                          <button
                            key={version.id}
                            onClick={() => {
                              setSelectedVersionId(version.id);
                            }}
                            className={cn(styles.versionChip, isSelected && styles.versionChipActive)}
                          >
                            <span className={styles.versionChipMain}>
                              <Package className={styles.versionChipIcon} />
                              <span>{version.version}</span>
                            </span>
                            {isSelected && isAdmin && (
                              <span
                                role="button"
                                tabIndex={0}
                                className={styles.versionChipDelete}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  dispatchModal({ type: "deleteVersion" });
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    dispatchModal({ type: "deleteVersion" });
                                  }
                                }}
                                aria-label={`Delete version ${version.version}`}
                                title="Delete version"
                              >
                                <X className={styles.versionChipDeleteIcon} />
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {isMember && (
                        <button
                          className={styles.versionAddButton}
                          onClick={() => {
                            dispatchModal({ type: "addVersion" });
                          }}
                        >
                          <Plus className={styles.versionChipIcon} />
                          <span>Add Version</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.applicationContent}>{/* sessions/schedules content */}</div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyCard}>
                  <div className={styles.emptyIcon}>
                    <Package className={styles.iconMediumMuted} />
                  </div>

                  <h3 className={styles.emptyTitle}>No Versions Yet</h3>

                  {isMember ? (
                    <>
                      <p className={styles.emptyText}>Create your first application version to start crawl sessions.</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          dispatchModal({ type: "addVersion" });
                        }}
                      >
                        <Plus className={styles.iconSmall} />
                        Add Version
                      </Button>
                    </>
                  ) : (
                    <p className={styles.emptyText}>
                      Contact a project admin or member to create your first application version.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>
                <Globe className={styles.iconMediumMuted} />
              </div>

              <h3 className={styles.emptyTitle}>Select an Application</h3>

              <p className={styles.emptyText}>
                Choose an application from the left to view versions and crawl sessions.
              </p>
            </div>
          </div>
        )}
      </main>

      {modal.type === "addApplication" && isAdmin && (
        <AddApplicationModal
          isNameDuplicate={isApplicationNameDuplicate}
          apiKey={rotatedApiKey}
          onConfirm={handleAddApplication}
          onClose={() => {
            setRotatedApiKey(null);
            closeModal();
          }}
        />
      )}

      {modal.type === "editApplication" && selectedApplication && isAdmin && (
        <EditApplicationModal
          initialName={selectedApplication.name}
          initialBaseUrl={selectedApplication.baseUrl ?? ""}
          isNameDuplicate={(name) => isApplicationNameDuplicate(name, selectedApplication.id)}
          onConfirm={handleUpdateApplication}
          onClose={closeModal}
        />
      )}

      {modal.type === "deleteApplication" && selectedApplication && isAdmin && (
        <DeleteApplicationModal
          applicationName={selectedApplication.name}
          onConfirm={handleDeleteApplication}
          onClose={closeModal}
        />
      )}

      {modal.type === "addVersion" && selectedApplication && (
        <AddVersionModal isNameDuplicate={isVersionNameDuplicate} onConfirm={handleAddVersion} onClose={closeModal} />
      )}

      {modal.type === "deleteVersion" && selectedApplication && selectedVersion && isAdmin && (
        <DeleteVersionModal
          versionName={selectedVersion.version}
          onConfirm={() => handleDeleteVersion(selectedVersion.id)}
          onClose={closeModal}
        />
      )}

      {modal.type === "rotateApiKey" && selectedApplication && isAdmin && (
        <RotateApiKeyModal
          applicationName={selectedApplication.name}
          apiKey={rotatedApiKey}
          isRotating={rotateTargetApplicationApiKey.isPending}
          onConfirm={handleRotateApiKey}
          onClose={() => {
            setRotatedApiKey(null);
            closeModal();
          }}
        />
      )}
    </div>
  );
};

export default Applications;
