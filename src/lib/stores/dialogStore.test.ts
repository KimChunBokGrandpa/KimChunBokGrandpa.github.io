import { afterEach, describe, expect, it } from 'vitest';

import { dialogStore, resetDialogStore } from './dialogStore.svelte';

afterEach(() => {
  resetDialogStore();
});

describe('dialogStore', () => {
  it('creates a confirm dialog and resolves true on confirm', async () => {
    const pending = dialogStore.requestConfirm({
      title: 'Delete Palette',
      message: 'confirm_delete_palette',
      confirmLabel: 'delete_palette',
      cancelLabel: 'cancel',
    });

    expect(dialogStore.currentDialog?.isConfirm).toBe(true);
    expect(dialogStore.currentDialog?.title).toBe('Delete Palette');

    dialogStore.confirmDialog();

    await expect(pending).resolves.toBe(true);
    expect(dialogStore.currentDialog).toBeNull();
  });

  it('resolves false when a confirm dialog is closed', async () => {
    const pending = dialogStore.requestConfirm({
      title: 'Unsaved Changes',
      message: 'unsaved_changes_confirm',
    });

    dialogStore.closeDialog();

    await expect(pending).resolves.toBe(false);
    expect(dialogStore.currentDialog).toBeNull();
  });
});
