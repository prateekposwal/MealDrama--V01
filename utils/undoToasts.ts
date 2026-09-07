import { useStore } from '../app/store/useStore';
import { useTrayStore } from '../plan/store/useTrayStore';
import { useLoopStore } from '../plan/store/useLoopStore';
import { track } from './analytics';

// Shared Toast-with-Undo pattern (Toast.tsx action slot) for the two tested
// undo actions — one canonical copy, no per-screen drift. Analytics events are
// side-effect-only — they never alter toast or undo-store state.
export function notifySwapUndo(newName: string) {
  track('undo_toast_shown', { kind: 'swap', target: newName });
  useStore.getState().setToast({
    message: `Swapped to ${newName}`,
    type: 'success',
    action: {
      label: 'Undo',
      onClick: () => {
        track('undo_started', { kind: 'swap' });
        const before = useTrayStore.getState().swapHistory.length;
        useTrayStore.getState().undoSwap();
        const after = useTrayStore.getState().swapHistory.length;
        if (before > 0 && after < before) {
          track('undo_succeeded', { kind: 'swap' });
        } else {
          track('undo_failed', { kind: 'swap' });
        }
      },
    },
  });
}

export function notifyLoopUndo() {
  track('undo_toast_shown', { kind: 'loop' });
  useStore.getState().setToast({
    message: 'Meal loop updated',
    type: 'success',
    action: {
      label: 'Undo',
      onClick: () => {
        track('undo_started', { kind: 'loop' });
        const before = useLoopStore.getState().mealLoop.undoStack.length;
        useLoopStore.getState().undoLoopChange();
        const after = useLoopStore.getState().mealLoop.undoStack.length;
        if (before > 0 && after < before) {
          track('undo_succeeded', { kind: 'loop' });
        } else {
          track('undo_failed', { kind: 'loop' });
        }
      },
    },
  });
}
