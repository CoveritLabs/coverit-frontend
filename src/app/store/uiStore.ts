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

export interface SelectedApplicationContext {
  projectId: string;
  applicationId: string;
  applicationName: string;
  versionId: string | null;
  versionName: string | null;
}

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  selectedProject: SelectedProject | null;
  setSelectedProject: (project: SelectedProject | null) => void;
  selectedApplicationContext: SelectedApplicationContext | null;
  setSelectedApplicationContext: (context: SelectedApplicationContext | null) => void;
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
        selectedApplicationContext: null,
        userRole: null,
        setTheme: (theme) => {
          set({ theme }, false, "ui/setTheme");
        },
        setSelectedProject: (project) => {
          set(
            (state) => ({
              selectedProject: project,
              selectedApplicationContext:
                state.selectedApplicationContext?.projectId === project?.id
                  ? state.selectedApplicationContext
                  : null,
            }),
            false,
            "ui/setSelectedProject",
          );
        },
        setSelectedApplicationContext: (context) => {
          set({ selectedApplicationContext: context }, false, "ui/setSelectedApplicationContext");
        },
        setUserRole: (role) => {
          set({ userRole: role }, false, "ui/setUserRole");
        },
      }),
      {
        name: "coverit-ui",
        partialize: (state) => ({
          theme: state.theme,
          selectedProject: state.selectedProject,
          selectedApplicationContext: state.selectedApplicationContext,
          userRole: state.userRole,
        }),
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
