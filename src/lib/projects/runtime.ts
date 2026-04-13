import {
  createInMemoryProjectStorageAdapter,
  type ProjectStorageAdapter,
} from '$lib/projects/storageAdapter';

let projectStorageAdapter: ProjectStorageAdapter = createInMemoryProjectStorageAdapter();

export function getProjectStorageAdapter(): ProjectStorageAdapter {
  return projectStorageAdapter;
}

export function setProjectStorageAdapter(nextAdapter: ProjectStorageAdapter) {
  projectStorageAdapter = nextAdapter;
}

export function resetProjectStorageAdapter() {
  projectStorageAdapter = createInMemoryProjectStorageAdapter();
}

