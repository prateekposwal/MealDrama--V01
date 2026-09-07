import { useStore } from '../app/store/useStore';
import { useTrayStore } from '../plan/store/useTrayStore';
import { useLoopStore } from '../plan/store/useLoopStore';

// Shared Toast-with-Undo pattern (Toast.tsx action slot) for the two tested
// undo actions — one canonical copy, no per-screen drift.
export function notifySwapUndo(newName: string) {
  useStore.getState().setToast({
    message: `Swapped to ${newName}`,
    type: 'success',
    action: { label: 'Undo', onClick: () => useTrayStore.getState().undoSwap() },
  });
}

export function notifyLoopUndo() {
  useStore.getState().setToast({
    message: 'Meal loop updated',
    type: 'success',
    action: { label: 'Undo', onClick: () => useLoopStore.getState().undoLoopChange() },
  });
}
