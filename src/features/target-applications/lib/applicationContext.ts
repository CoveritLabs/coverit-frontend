// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import type { SelectedApplicationContext } from "@app/store/uiStore";

export interface ApplicationContextVersion {
  id: string;
  name?: string;
  version?: string;
}

export interface ApplicationContextApplication<TVersion extends ApplicationContextVersion = ApplicationContextVersion> {
  id: string;
  name: string;
  versions?: TVersion[];
}

interface ResolveApplicationParams<TApplication extends ApplicationContextApplication> {
  applications: TApplication[];
  projectId: string | null;
  requestedApplicationId?: string | null;
  storedContext?: SelectedApplicationContext | null;
}

interface ResolveVersionParams<TVersion extends ApplicationContextVersion> {
  versions: TVersion[];
  projectId: string | null;
  applicationId: string | null;
  requestedVersionId?: string | null;
  storedContext?: SelectedApplicationContext | null;
  requireVersion?: boolean;
}

export function getVersionLabel(version: ApplicationContextVersion | null | undefined) {
  return version?.version ?? version?.name ?? null;
}

export function getContextVersionId(context: SelectedApplicationContext | null, projectId: string | null) {
  return context?.projectId === projectId ? context.versionId : null;
}

export function resolveApplicationSelection<TApplication extends ApplicationContextApplication>({
  applications,
  projectId,
  requestedApplicationId,
  storedContext,
}: ResolveApplicationParams<TApplication>) {
  if (!projectId || applications.length === 0) return null;

  const requestedApplication = requestedApplicationId
    ? applications.find((application) => application.id === requestedApplicationId)
    : null;
  if (requestedApplication) return requestedApplication;

  const storedApplication =
    storedContext?.projectId === projectId
      ? applications.find((application) => application.id === storedContext.applicationId)
      : null;
  return storedApplication ?? applications[0] ?? null;
}

export function resolveVersionSelection<TVersion extends ApplicationContextVersion>({
  versions,
  projectId,
  applicationId,
  requestedVersionId,
  storedContext,
  requireVersion = false,
}: ResolveVersionParams<TVersion>) {
  if (!projectId || !applicationId || versions.length === 0) return null;

  const requestedVersion = requestedVersionId ? versions.find((version) => version.id === requestedVersionId) : null;
  if (requestedVersion) return requestedVersion;

  const storedVersion =
    storedContext?.projectId === projectId && storedContext.applicationId === applicationId && storedContext.versionId
      ? versions.find((version) => version.id === storedContext.versionId)
      : null;
  if (storedVersion) return storedVersion;

  return requireVersion ? (versions[0] ?? null) : null;
}

export function buildApplicationContext(
  projectId: string,
  application: ApplicationContextApplication,
  version?: ApplicationContextVersion | null,
): SelectedApplicationContext {
  return {
    projectId,
    applicationId: application.id,
    applicationName: application.name,
    versionId: version?.id ?? null,
    versionName: getVersionLabel(version),
  };
}

export function applicationContextEquals(
  left: SelectedApplicationContext | null,
  right: SelectedApplicationContext | null,
) {
  return (
    left?.projectId === right?.projectId &&
    left?.applicationId === right?.applicationId &&
    left?.applicationName === right?.applicationName &&
    left?.versionId === right?.versionId &&
    left?.versionName === right?.versionName
  );
}
