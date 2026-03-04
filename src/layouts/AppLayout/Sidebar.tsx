// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Sun, Moon } from 'lucide-react'
import { useTheme } from '@hooks/useTheme'
import { ROUTES } from '@config/routes'
import styles from './Sidebar.module.scss'

const NAV_ITEMS = [
    { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
]

export function Sidebar() {
    const { theme, setTheme } = useTheme()
    const isDark = theme === 'dark'

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
                        className={({ isActive }) =>
                            `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                        }
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
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark
                        ? <Sun size={16} strokeWidth={1.75} />
                        : <Moon size={16} strokeWidth={1.75} />
                    }
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                {/* User profile */}
                <div className={styles.profile}>
                    {/* TODO: Use real user data */}
                    <div className={styles.avatar} aria-hidden="true">JD</div>
                    <div className={styles.profileInfo}>
                        <p className={styles.profileName}>John Doe</p>
                        <p className={styles.profileRole}>Admin</p>
                    </div>
                </div>

            </div>
        </aside>
    )
}
