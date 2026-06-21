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
} from "lucide-react";
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
  { label: "Dashboard", to: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Applications", to: ROUTES.APPLICATIONS, icon: AppWindow },
  { label: "Test Flows", to: ROUTES.TEST_FLOWS, icon: Workflow },
  { label: "Manual Recording", to: ROUTES.MANUAL_RECORDINGS, icon: MonitorPlay },
  { label: "Regression Runs", to: ROUTES.REGRESSION_RUNS, icon: ListChecks },
];

const PROFILE_ITEMS = [
  { label: "Profile", to: ROUTES.PROFILE, icon: User, description: "View and edit your profile" },
  { label: "Administrate", to: ROUTES.ADMINISTRATE, icon: ShieldCheck, description: "Manage team & workspace" },
];

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: projects = [], isLoading, isError } = useProjects();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const selectedProject = useUIStore((s) => s.selectedProject);
  const userRole = useUIStore((s) => s.userRole);
  const setUserRole = useUIStore((s) => s.setUserRole);
  const setSelectedProject = useUIStore((s) => s.setSelectedProject);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!projects.length) return;
    const selectedExists = selectedProject ? projects.some((project) => project.id === selectedProject.id) : false;
    if (!selectedExists) {
      setSelectedProject({ id: projects[0].id, name: projects[0].name });
      setUserRole(getProjectUserRole(projects[0], user?.id));
    }
  }, [projects, selectedProject, setSelectedProject]);

  const selectPlaceholder = isLoading
    ? "Loading projects..."
    : isError
      ? "Failed to load projects"
      : projects.length
        ? "Select project"
        : "No projects yet";
  const selectDisabled = isLoading || isError || projects.length === 0;

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        {/* TODO: Use logo */}
        <span className={styles.brandMark}>CI</span>
        <div>
          <p className={styles.brandName}>CoverIt</p>
          <p className={styles.brandSub}>QA Test Automation</p>
        </div>
      </div>

      {/* Project selector */}
      <div className={styles.projectSelect}>
        <Select
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
          value={selectedProject?.id ?? null}
          onChange={(id) => {
            const proj = projects.find((p) => p.id === id) ?? null;
            setSelectedProject(proj);
            setUserRole(getProjectUserRole(proj, user?.id));
          }}
          placeholder={selectPlaceholder}
          disabled={selectDisabled}
        />
        {!isLoading && !isError && projects.length === 0 && (
          <button type="button" className={styles.createProject} onClick={() => navigate(ROUTES.ADMINISTRATE)}>
            Create project
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        {/* Theme toggle */}
        <button
          className={styles.themeToggle}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* User profile */}
        <div className={styles.profile} onClick={() => setProfileOpen((open) => !open)}>
          <div className={styles.avatar} aria-hidden="true">
            {getInitials(user?.name || "U")}
          </div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{user?.name || "Unknown User"}</p>
            <p className={styles.profileRole}>
              {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase() : "-"}
            </p>
          </div>
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
            style={{ transformOrigin: "left center" }}
          >
            {/* Menu items */}
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

            {/* Logout */}
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
