// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  AppWindow,
  Sun,
  Moon,
  User,
  ShieldCheck,
  LogOut,
  ListChecks,
  MonitorPlay,
  Workflow,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logoImage from "@/assets/logo-sidebar.png";
import { preloadRoute, type LazyRouteKey } from "@app/router/LazyRouter";
import { useTheme } from "@shared/hooks/useTheme";
import { useProjects } from "@features/projects";
import { ROUTES } from "@shared/config/routes";
import styles from "./Sidebar.module.scss";
import { getInitials } from "@shared/utils/text";
import { getProjectUserRole } from "@features/projects";
import { useEffect, useRef, useState } from "react";
import { useAuthStore, useUIStore } from "@app/store";
import { Select } from "@shared/ui";
import { motion } from "motion/react";

const NAV_ITEMS = [
  { label: "Dashboard", to: ROUTES.DASHBOARD, icon: LayoutDashboard, routeKey: "dashboard" },
  { label: "Applications", to: ROUTES.APPLICATIONS, icon: AppWindow, routeKey: "applications" },
  { label: "Test Flows", to: ROUTES.TEST_FLOWS, icon: Workflow, routeKey: "testFlows" },
  { label: "Manual Recording", to: ROUTES.MANUAL_RECORDINGS, icon: MonitorPlay, routeKey: "manualSession" },
  { label: "Regression Runs", to: ROUTES.REGRESSION_RUNS, icon: ListChecks, routeKey: "regressionRuns" },
  { label: "User Guides", to: ROUTES.USER_GUIDES, icon: BookOpen, routeKey: "userGuides" },
] satisfies Array<{ label: string; to: string; icon: LucideIcon; routeKey: LazyRouteKey }>;

const PROFILE_ITEMS = [
  { label: "Profile", to: ROUTES.PROFILE, icon: User, description: "View and edit your profile" },
  { label: "Administrate", to: ROUTES.ADMINISTRATE, icon: ShieldCheck, description: "Manage team & workspace" },
];

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const projectPopoverRef = useRef<HTMLDivElement>(null);

  const { data: projects = [], isLoading, isError, isPlaceholderData } = useProjects();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const selectedProject = useUIStore((s) => s.selectedProject);
  const userRole = useUIStore((s) => s.userRole);
  const setUserRole = useUIStore((s) => s.setUserRole);
  const setSelectedProject = useUIStore((s) => s.setSelectedProject);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  // Auto-select first project if none selected
  useEffect(() => {
    if (isLoading || isPlaceholderData) return;
    if (!projects.length) {
      if (selectedProject) {
        setSelectedProject(null);
        setUserRole(null);
      }
      return;
    }
    const selectedExists = selectedProject ? projects.some((project) => project.id === selectedProject.id) : false;
    if (!selectedExists) {
      setSelectedProject({ id: projects[0].id, name: projects[0].name });
      setUserRole(getProjectUserRole(projects[0], user?.id));
    }
  }, [isLoading, isPlaceholderData, projects, selectedProject, setSelectedProject, setUserRole, user?.id]);

  useEffect(() => {
    if (!projectPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (projectPopoverRef.current && !projectPopoverRef.current.contains(e.target as Node)) {
        setProjectPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [projectPopoverOpen]);

  const selectPlaceholder = isLoading || isPlaceholderData
    ? "Loading projects..."
    : isError
      ? "Failed to load projects"
      : projects.length
        ? "Select project"
        : "No projects yet";
  const selectDisabled = isLoading || isPlaceholderData || isError || projects.length === 0;

  const handleProjectChange = (id: string | null) => {
    const proj = id ? (projects.find((p) => p.id === id) ?? null) : null;
    setSelectedProject(proj);
    setUserRole(getProjectUserRole(proj, user?.id));
    setProjectPopoverOpen(false);
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      {/* Collapse toggle */}
      <button
        className={styles.collapseToggle}
        onClick={() => {
          setIsCollapsed((c) => !c);
          setProfileOpen(false);
          setProjectPopoverOpen(false);
        }}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={1.75} /> : <ChevronLeft size={14} strokeWidth={1.75} />}
      </button>

      {/* Brand */}
      <div className={styles.brand}>
        <img src={logoImage} alt="cover it" className={styles.brandLogo} />
        {!isCollapsed && (
          <motion.div
            key="brand-text"
            className={styles.animatedText}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className={styles.brandName}>CoverIt</p>
            <p className={styles.brandSub}>QA Test Automation</p>
          </motion.div>
        )}
      </div>

      {/* Project selector */}
      <div className={styles.projectSection}>
        {isCollapsed ? (
          <div ref={projectPopoverRef} className={styles.projectAvatarWrap}>
            <button
              className={styles.projectAvatar}
              onClick={() => setProjectPopoverOpen((o) => !o)}
              aria-label={selectedProject?.name ?? "Select project"}
              data-tooltip={selectedProject?.name ?? "Select project"}
            >
              {selectedProject ? getInitials(selectedProject.name) : <Layers size={15} strokeWidth={1.75} />}
            </button>

            {projectPopoverOpen && (
              <motion.div
                className={styles.projectPopover}
                initial={{ opacity: 0, x: -8, scaleX: 0.9 }}
                animate={{ opacity: 1, x: 0, scaleX: 1 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className={styles.projectPopoverLabel}>Switch project</p>
                <Select
                  options={projects.map((p) => ({ value: p.id, label: p.name }))}
                  value={selectedProject?.id ?? null}
                  onChange={handleProjectChange}
                  placeholder={selectPlaceholder}
                  disabled={selectDisabled}
                />
                {!isLoading && !isPlaceholderData && !isError && projects.length === 0 && (
                  <button
                    type="button"
                    className={styles.createProject}
                    onClick={() => {
                      setProjectPopoverOpen(false);
                      navigate(ROUTES.ADMINISTRATE);
                    }}
                  >
                    Create project
                  </button>
                )}
              </motion.div>
            )}
          </div>
        ) : (
          <div className={styles.projectSelect}>
            <Select
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              value={selectedProject?.id ?? null}
              onChange={handleProjectChange}
              placeholder={selectPlaceholder}
              disabled={selectDisabled}
            />
            {!isLoading && !isPlaceholderData && !isError && projects.length === 0 && (
              <button type="button" className={styles.createProject} onClick={() => navigate(ROUTES.ADMINISTRATE)}>
                Create project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ label, to, icon: Icon, routeKey }) => (
          <NavLink
            key={to}
            to={to}
            onMouseEnter={() => preloadRoute(routeKey)}
            onFocus={() => preloadRoute(routeKey)}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""} ${isCollapsed ? styles.navItemCollapsed : ""}`
            }
            data-tooltip={label}
          >
            <Icon size={18} strokeWidth={1.75} className={styles.navIcon} />
            {!isCollapsed && (
              <motion.span
                key="label"
                className={styles.animatedText}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                {label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={`${styles.footer} ${isCollapsed ? styles.footerCollapsed : ""}`}>
        {/* Theme toggle */}
        <button
          className={`${styles.themeToggle} ${isCollapsed ? styles.themeToggleCollapsed : ""}`}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          data-tooltip={isDark ? "Light Mode" : "Dark Mode"}
        >
          {isDark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
          {!isCollapsed && (
            <motion.span
              key="theme-label"
              className={styles.animatedText}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {isDark ? "Light Mode" : "Dark Mode"}
            </motion.span>
          )}
        </button>

        {/* User profile */}
        <div
          className={`${styles.profile} ${isCollapsed ? styles.profileCollapsed : ""}`}
          onClick={() => setProfileOpen((open) => !open)}
          data-tooltip={isCollapsed ? user?.name || "Account" : undefined}
        >
          <div className={styles.avatar} aria-hidden="true">
            {getInitials(user?.name || "U")}
          </div>
          {!isCollapsed && (
            <motion.div
              key="profile-info"
              className={`${styles.profileInfo} ${styles.animatedText}`}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className={styles.profileName}>{user?.name || "Unknown User"}</p>
              <p className={styles.profileRole}>
                {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase() : "-"}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Profile menu */}
      <div ref={menuRef} className={styles.profileMenu} onClick={(e) => e.stopPropagation()}>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, scaleX: 0.8 }}
            animate={{ opacity: 1, x: 0, scaleX: 1 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={styles.menuPanel}
          >
            <div className={styles.menuItems}>
              {PROFILE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      navigate(item.to);
                      setProfileOpen(false);
                    }}
                    className={styles.menuItem}
                  >
                    <div className={styles.menuItemIcon}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className={styles.menuItemLabel}>{item.label}</p>
                      <p className={styles.menuItemDesc}>{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={styles.logoutSection}>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout().then(() => navigate(ROUTES.LOGIN));
                }}
                className={styles.menuItem}
              >
                <div className={styles.menuItemIcon}>
                  <LogOut size={14} />
                </div>
                <div>
                  <p className={styles.menuItemLabel}>Logout</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </aside>
  );
}
