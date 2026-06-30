import { useCallback, useState } from 'react';

export type ConfirmDialogType = 'danger' | 'warning' | 'info';

export interface ConfirmDialogState {
  isOpen: boolean;
  type: ConfirmDialogType;
  title: string;
  message: string;
  onConfirm: () => void;
}

// Confirm-dialog state + helpers shared by the marketplace and deployment
// detail pages. showDialog auto-closes after the caller's onConfirm runs.
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showDialog = useCallback(
    (type: ConfirmDialogType, title: string, message: string, onConfirm: () => void) => {
      setDialogState({
        isOpen: true,
        type,
        title,
        message,
        onConfirm: () => {
          onConfirm();
          closeDialog();
        },
      });
    },
    [closeDialog],
  );

  return { dialogState, showDialog, closeDialog };
}
