export interface DialogRequest {
  message: string;
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirm: boolean;
}

function createDialogStore() {
  let currentDialog = $state<DialogRequest | null>(null);
  let pendingConfirmResolver: ((value: boolean) => void) | null = null;

  function settlePendingConfirm(result: boolean) {
    const resolver = pendingConfirmResolver;
    pendingConfirmResolver = null;
    resolver?.(result);
  }

  function showNotice(message: string, title = 'Desktop Notice') {
    settlePendingConfirm(false);
    currentDialog = {
      message,
      title,
      isConfirm: false,
    };
  }

  function showError(message: string, title = 'Desktop Alert') {
    settlePendingConfirm(false);
    currentDialog = {
      message,
      title,
      isConfirm: false,
    };
  }

  function requestConfirm({
    message,
    title,
    confirmLabel,
    cancelLabel,
  }: {
    message: string;
    title: string;
    confirmLabel?: string;
    cancelLabel?: string;
  }) {
    settlePendingConfirm(false);
    currentDialog = {
      message,
      title,
      confirmLabel,
      cancelLabel,
      isConfirm: true,
    };
    return new Promise<boolean>((resolve) => {
      pendingConfirmResolver = resolve;
    });
  }

  function confirmDialog() {
    const isConfirm = currentDialog?.isConfirm ?? false;
    currentDialog = null;
    if (isConfirm) {
      settlePendingConfirm(true);
    }
  }

  function closeDialog() {
    const isConfirm = currentDialog?.isConfirm ?? false;
    currentDialog = null;
    if (isConfirm) {
      settlePendingConfirm(false);
    }
  }

  function reset() {
    currentDialog = null;
    pendingConfirmResolver = null;
  }

  return {
    get currentDialog() {
      return currentDialog;
    },
    showNotice,
    showError,
    requestConfirm,
    confirmDialog,
    closeDialog,
    reset,
  };
}

export const dialogStore = createDialogStore();

export function resetDialogStore() {
  dialogStore.reset();
}
