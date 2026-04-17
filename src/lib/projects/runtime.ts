import {
  createIndexedDbProjectStorageAdapter,
  createInMemoryProjectStorageAdapter,
  type ProjectStorageAdapter,
} from '$lib/projects/storageAdapter';

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
