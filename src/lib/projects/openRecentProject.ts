import type { RecentProjectEntryV1 } from '$lib/projects/schema';
import type { WindowId } from '$lib/types';

interface OpenRecentProjectMessages {
  pixelLabProjectReopened: string;
  pixelLabProjectMissing: string;
  retroCamProjectReopened: string;
  retroCamProjectMissing: string;
  projectUnsupported: string;
}

interface OpenRecentProjectOptions {
  entry: RecentProjectEntryV1;
  loadPixelLabProject?: (projectId: string) => Promise<unknown | null>;
  loadRetroCamProject?: (projectId: string) => Promise<unknown | null>;
  openWindow: (id: WindowId) => void;
  notifySuccess?: (message: string) => void;
  notifyError?: (message: string) => void;
  messages: OpenRecentProjectMessages;
}

export async function openRecentProjectFromShell({
  entry,
  loadPixelLabProject,
  loadRetroCamProject,
  openWindow,
  notifySuccess,
  notifyError,
  messages,
}: OpenRecentProjectOptions): Promise<boolean> {
  if (entry.appId === 'pixel-lab') {
    const reopened = await loadPixelLabProject?.(entry.projectId);
    if (!reopened) {
      notifyError?.(messages.pixelLabProjectMissing);
      return false;
    }

    openWindow('settings');
    openWindow('preview');
    notifySuccess?.(messages.pixelLabProjectReopened);
    return true;
  }

  if (entry.appId === 'retrocam') {
    const reopened = await loadRetroCamProject?.(entry.projectId);
    if (!reopened) {
      notifyError?.(messages.retroCamProjectMissing);
      return false;
    }

    openWindow('retrocam');
    notifySuccess?.(messages.retroCamProjectReopened);
    return true;
  }

  notifyError?.(messages.projectUnsupported);
  return false;
}
