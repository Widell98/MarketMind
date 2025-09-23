import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const usePersistentDialogOpenState = (storageKey: string, dialogId: string) => {
  const [activeDialog, setActiveDialog, resetActiveDialog] = useLocalStorage<string | null>(storageKey, null);

  const isOpen = useMemo(() => activeDialog === dialogId, [activeDialog, dialogId]);

  const open = useCallback(() => {
    setActiveDialog(dialogId);
  }, [dialogId, setActiveDialog]);

  const close = useCallback(() => {
    if (activeDialog === dialogId) {
      resetActiveDialog();
    }
  }, [activeDialog, dialogId, resetActiveDialog]);

  const forceClose = useCallback(() => {
    resetActiveDialog();
  }, [resetActiveDialog]);

  return { isOpen, open, close, forceClose };
};
