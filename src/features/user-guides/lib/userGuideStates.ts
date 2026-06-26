// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { UserGuideState } from "../model/types/user-guides.types";

function normalizeKeyPart(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function dedupeUserGuideStates(states: UserGuideState[]) {
  const seen = new Set<string>();

  return states.filter((state) => {
    const key = `${normalizeKeyPart(state.label)}::${normalizeKeyPart(state.url ?? state.copyUrl ?? state.path)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
