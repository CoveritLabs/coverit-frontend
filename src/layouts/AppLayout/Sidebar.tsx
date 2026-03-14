// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Sun, Moon, User, ShieldCheck, LogOut } from "lucide-react";
import { useTheme } from "@hooks/useTheme";
import { ROUTES } from "@config/routes";
import styles from "./Sidebar.module.scss";
import { getInitials } from "@utils/text";
import { useRef, useState } from "react";
import { useAuthStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";

const NAV_ITEMS = [{ label: "Dashboard", to: ROUTES.DASHBOARD, icon: LayoutDashboard }];

const PROFILE_ITEMS = [
  { label: "Profile", to: ROUTES.PROFILE, icon: User, description: "View and edit your profile" },
  { label: "Administrate", to: ROUTES.ADMINISTRATE, icon: ShieldCheck, description: "Manage team & workspace" },
];

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const isDark = theme === "dark";

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
            <p className={styles.profileRole}>Admin</p> {/* TODO: Use real role */}
          </div>
        </div>
      </div>

      {/* Profile menu */}
      <div ref={menuRef} className={styles.profileMenu} onClick={(e) => e.stopPropagation()}>
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20, scaleX: 0.8 }}
              animate={{ opacity: 1, x: 0, scaleX: 1 }}
              exit={{ opacity: 0, x: -20, scaleX: 0.8 }}
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
        </AnimatePresence>
      </div>
    </aside>
  );
}
