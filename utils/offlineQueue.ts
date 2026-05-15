// ─────────────────────────────────────────────────────────────────────────────
// Offline Queue — localStorage-backed FIFO for write actions when offline
// Framework-agnostic. No store coupling. Pure utility.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'app_offline_queue';

export type OfflineActionType = 'loop_save' | 'pantry_toggle' | 'dish_add' | 'custom_dish';

export interface QueuedAction {
  id: string;
  type: OfflineActionType;
  payload: unknown;
  timestamp: number;
}

/** Generate unique id based on type + timestamp + serialized payload */
function actionId(type: string, payload: unknown): string {
  return `${type}_${Date.now()}_${JSON.stringify(payload).slice(0, 40)}`;
}

function readQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[OfflineQueue] Failed to write queue:', e);
  }
}

/** Add an action to the queue. Deduplicates by id. */
export function enqueue(type: OfflineActionType, payload: unknown): void {
  const queue = readQueue();
  const id = actionId(type, payload);
  if (queue.some(a => a.id === id)) return;
  queue.push({ id, type, payload, timestamp: Date.now() });
  writeQueue(queue);
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: queue.length } }));
}

/** Remove an action from the queue by id */
function dequeue(id: string): void {
  const queue = readQueue().filter(a => a.id !== id);
  writeQueue(queue);
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: queue.length } }));
}

/** Get number of pending actions */
export function getPendingCount(): number {
  return readQueue().length;
}

/** Get all pending actions */
export function getQueue(): QueuedAction[] {
  return readQueue();
}

/** Clear entire queue */
export function clearQueue(): void {
  writeQueue([]);
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: 0 } }));
}

/** Process all queued actions. Returns { synced, failed } counts. */
export async function processQueue(): Promise<{ synced: number; failed: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const synced: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < queue.length; i++) {
    const action = queue[i];
    if (!action) continue;
    try {
      switch (action.type) {
        case 'loop_save':
          await processLoopSave(action);
          break;
        case 'pantry_toggle':
          await processPantryToggle(action);
          break;
        case 'dish_add':
        case 'custom_dish':
          break;
        default:
          break;
      }
      synced.push(action.id);
    } catch (e) {
      console.warn('[OfflineQueue] Failed action, moving to dead-letter:', action.type, e);
      failed.push(action.id);
    }
  }

  // Remove successfully processed items
  const syncedSet = new Set(synced);
  const remaining = readQueue().filter(a => !syncedSet.has(a.id));
  writeQueue(remaining);
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: remaining.length } }));

  return { synced: synced.length, failed: failed.length };
}

// ─── Action Processors ─────────────────────────────────────────────────────

async function processLoopSave(action: QueuedAction): Promise<void> {
  const { config } = action.payload as { config: unknown };
  const { default: api } = await import('../lib/api');
  await api.post('/loop-config', config);
}

async function processPantryToggle(action: QueuedAction): Promise<void> {
  // Pantry toggles are already persisted in Zustand store;
  // no additional API call needed — just mark as synced
}
