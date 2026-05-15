import {
  createIndexedDbProjectStorageAdapter,
  createInMemoryProjectStorageAdapter,
  type ProjectStorageAdapter,
} from '$lib/projects/storageAdapter';
import type { RetroProjectManifestV1, RecentProjectEntryV1 } from '$lib/projects/schema';
import type { ListRecentProjectsOptions } from '$lib/projects/storageAdapter';

/**
 * Only these appIds are supported in the current schema (v1).
 * Legacy records (e.g. poster-maker) remain in storage but are
 * filtered out at the runtime layer — no destructive deletion.
 */
export const supportedAppIds: readonly string[] = ['pixel-lab', 'retrocam'];

function createDefaultProjectStorageAdapter(): ProjectStorageAdapter {
  if (typeof indexedDB !== 'undefined') {
    return createIndexedDbProjectStorageAdapter(indexedDB);
  }
  return createInMemoryProjectStorageAdapter();
}

let projectStorageAdapter: ProjectStorageAdapter = createDefaultProjectStorageAdapter();

export function getProjectStorageAdapter(): ProjectStorageAdapter {
  return projectStorageAdapter;
}

export function setProjectStorageAdapter(nextAdapter: ProjectStorageAdapter) {
  projectStorageAdapter = nextAdapter;
}

export function resetProjectStorageAdapter() {
  projectStorageAdapter = createDefaultProjectStorageAdapter();
}

/**
 * Lists recent projects, filtering out unsupported appIds (e.g. legacy poster-maker).
 */
export async function listRecentProjects(
  options?: ListRecentProjectsOptions,
): Promise<RecentProjectEntryV1[]> {
  const all = await projectStorageAdapter.listRecentProjects(options);
  return all.filter((entry) => supportedAppIds.includes(entry.appId as string));
}

/**
 * Loads a project by id. Returns null (without throwing) if the project
 * has an unsupported appId or a legacy programState.kind like 'poster-maker'.
 */
export async function loadProject(
  projectId: string,
): Promise<RetroProjectManifestV1 | null> {
  const raw = await projectStorageAdapter.loadProject(projectId);
  if (!raw) return null;
  if (!supportedAppIds.includes(raw.appId as string)) return null;
  if (raw.programState && (raw.programState as { kind: string }).kind === 'poster-maker') return null;
  return raw;
}
