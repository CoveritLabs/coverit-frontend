// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ProjectRole } from "@features/projects";
import type { Theme } from "@shared/types/common";

interface SelectedProject {
  id: string;
  name: string;
}

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  selectedProject: SelectedProject | null;
  setSelectedProject: (project: SelectedProject | null) => void;
  userRole: ProjectRole | null;
  setUserRole: (role: ProjectRole | null) => void;
}

function applyThemeToDOM(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
}

/** UI Store for managing global UI state */
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        theme: "system",
        selectedProject: null,
        userRole: null,
        setTheme: (theme) => {
          set({ theme }, false, "ui/setTheme");
        },
        setSelectedProject: (project) => {
          set({ selectedProject: project }, false, "ui/setSelectedProject");
        },
        setUserRole: (role) => {
          set({ userRole: role }, false, "ui/setUserRole");
        },
      }),
      {
        name: "coverit-ui",
      },
    ),
    { name: "UIStore" },
  ),
);

useUIStore.subscribe((state, prev) => {
  if (state.theme !== prev.theme) applyThemeToDOM(state.theme);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (useUIStore.getState().theme === "system") applyThemeToDOM("system");
});
