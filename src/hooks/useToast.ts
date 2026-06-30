import { useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  open: boolean;
  message: string;
  type: ToastType;
}

// Toast state + helpers shared by the marketplace and deployment detail pages.
export function useToast() {
  const [toast, setToast] = useState<ToastState>({ open: false, message: '', type: 'info' });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ open: true, message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  return { toast, showToast, closeToast };
}
