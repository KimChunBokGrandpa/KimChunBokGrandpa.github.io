import { describe, expect, it, vi } from 'vitest';
import { openRecentProjectFromShell } from '$lib/projects/openRecentProject';
import type { RecentProjectEntryV1 } from '$lib/projects/schema';

function createRecentProjectEntry(
  overrides: Partial<RecentProjectEntryV1> = {},
): RecentProjectEntryV1 {
  return {
    projectId: 'project-pixel-1',
    appId: 'pixel-lab',
    name: 'Pixel Lab Draft',
    lastOpenedAt: '2026-04-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('openRecentProjectFromShell', () => {
  const messages = {
    pixelLabProjectReopened: 'pixel_lab_project_reopened',
    pixelLabProjectMissing: 'pixel_lab_project_missing',
    retroCamProjectReopened: 'retrocam_project_reopened',
    retroCamProjectMissing: 'retrocam_project_missing',
    projectUnsupported: 'project_unsupported',
  };

  it('opens a pixel lab project and notifies success', async () => {
    const openWindow = vi.fn();
    const loadPixelLabProject = vi.fn().mockResolvedValue({ projectId: 'project-pixel-1' });
    const notifySuccess = vi.fn();

    const result = await openRecentProjectFromShell({
      entry: createRecentProjectEntry({
        appId: 'pixel-lab',
        projectId: 'project-pixel-1',
        name: 'Pixel Lab Draft',
      }),
      loadPixelLabProject,
      loadRetroCamProject: vi.fn(),
      openWindow,
      notifySuccess,
      messages,
    });

    expect(result).toBe(true);
    expect(loadPixelLabProject).toHaveBeenCalledWith('project-pixel-1');
    expect(openWindow).toHaveBeenCalledWith('settings');
    expect(openWindow).toHaveBeenCalledWith('preview');
    expect(notifySuccess).toHaveBeenCalledWith('pixel_lab_project_reopened');
  });

  it('opens a retrocam project and notifies success', async () => {
    const openWindow = vi.fn();
    const loadRetroCamProject = vi.fn().mockResolvedValue({ projectId: 'project-retrocam-1' });
    const notifySuccess = vi.fn();

    const result = await openRecentProjectFromShell({
      entry: createRecentProjectEntry({
        appId: 'retrocam',
        projectId: 'project-retrocam-1',
        name: 'RetroCam Capture',
      }),
      loadPixelLabProject: vi.fn(),
      loadRetroCamProject,
      openWindow,
      notifySuccess,
      messages,
    });

    expect(result).toBe(true);
    expect(loadRetroCamProject).toHaveBeenCalledWith('project-retrocam-1');
    expect(openWindow).toHaveBeenCalledWith('retrocam');
    expect(notifySuccess).toHaveBeenCalledWith('retrocam_project_reopened');
  });

  it('rejects unsupported project types', async () => {
    const notifyError = vi.fn();

    const result = await openRecentProjectFromShell({
      entry: createRecentProjectEntry({
        appId: 'unsupported-app' as RecentProjectEntryV1['appId'],
        projectId: 'project-unsupported-1',
      }),
      loadPixelLabProject: vi.fn(),
      loadRetroCamProject: vi.fn(),
      openWindow: vi.fn(),
      notifyError,
      messages,
    });

    expect(result).toBe(false);
    expect(notifyError).toHaveBeenCalledWith('project_unsupported');
  });

  it('reports missing pixel lab projects', async () => {
    const notifyError = vi.fn();

    const result = await openRecentProjectFromShell({
      entry: createRecentProjectEntry({
        appId: 'pixel-lab',
        projectId: 'project-pixel-1',
      }),
      loadPixelLabProject: vi.fn().mockResolvedValue(null),
      loadRetroCamProject: vi.fn(),
      openWindow: vi.fn(),
      notifyError,
      messages,
    });

    expect(result).toBe(false);
    expect(notifyError).toHaveBeenCalledWith('pixel_lab_project_missing');
  });

  it('reports missing retrocam projects', async () => {
    const notifyError = vi.fn();

    const result = await openRecentProjectFromShell({
      entry: createRecentProjectEntry({
        appId: 'retrocam',
        projectId: 'project-retrocam-1',
      }),
      loadPixelLabProject: vi.fn(),
      loadRetroCamProject: vi.fn().mockResolvedValue(null),
      openWindow: vi.fn(),
      notifyError,
      messages,
    });

    expect(result).toBe(false);
    expect(notifyError).toHaveBeenCalledWith('retrocam_project_missing');
  });
});
