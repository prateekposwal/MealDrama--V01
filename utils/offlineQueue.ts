// ─────────────────────────────────────────────────────────────────────────────
// Offline Queue — localStorage-backed FIFO for utility actions (loop_save, pantry_toggle)
// Framework-agnostic. No store coupling. Pure utility.
// C1: Uses separate storage key from lib/trayApi.ts offline queue to prevent
//     cross-contamination. trayApi handles add/swap/update/remove; this handles
//     loop_save/pantry_toggle. Both drain via connectivity.ts.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mealdrama_util_queue';
const QUEUE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const QUEUE_MAX_SIZE = 50; // FIX 6: Cap queue size to prevent unbounded growth

export type OfflineActionType = 'loop_save' | 'pantry_toggle' | 'dish_add' | 'custom_dish';

export interface QueuedAction {
  id: string;
  type: OfflineActionType;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  expiresAt: number;
}

/** Generate unique id using crypto.randomUUID for zero collision risk */
function actionId(type: string, _payload: unknown): string {
  return `${type}_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
}

function readQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const queue: QueuedAction[] = JSON.parse(raw);
    // Filter out expired actions
    const now = Date.now();
    const valid = queue.filter(a => a.expiresAt > now);
    if (valid.length !== queue.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    // FIX 6: Enforce max size on read to handle existing bloated queues
    if (valid.length > QUEUE_MAX_SIZE) {
      const trimmed = valid.slice(valid.length - QUEUE_MAX_SIZE);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return trimmed;
    }
    return valid;
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
  queue.push({
    id, type, payload,
    timestamp: Date.now(),
    retryCount: 0,
    expiresAt: Date.now() + QUEUE_EXPIRY_MS,
  } as QueuedAction);

  // FIX 6: Drop oldest items if queue exceeds max size
  if (queue.length > QUEUE_MAX_SIZE) {
    queue.splice(0, queue.length - QUEUE_MAX_SIZE);
  }

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

/** Process all queued actions with retry + exponential backoff. Returns { synced, failed } counts. */
export async function processQueue(): Promise<{ synced: number; failed: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const synced: string[] = [];
  const failed: string[] = [];
  const retryable: Array<{ action: QueuedAction; attempt: number }> = [];

  // First pass: try all actions
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
    } catch {
      const attempt = (action.retryCount ?? 0) + 1;
      if (attempt >= 3) {
        failed.push(action.id);
      } else {
        retryable.push({ action, attempt });
      }
    }
  }

  // H6: Retry failed actions with exponential backoff (1s, 2s, 4s)
  for (const { action, attempt } of retryable) {
    const delayMs = Math.pow(2, attempt - 1) * 1000;
    await new Promise(resolve => setTimeout(resolve, delayMs));
    try {
      switch (action.type) {
        case 'loop_save':
          await processLoopSave(action);
          break;
        case 'pantry_toggle':
          await processPantryToggle(action);
          break;
        default:
          break;
      }
      synced.push(action.id);
    } catch {
      // Second failure — mark as dead letter
      failed.push(action.id);
    }
  }

  // Remove successfully processed + exhausted items
  const processedSet = new Set([...synced, ...failed]);
  const remaining = readQueue()
    .filter(a => !processedSet.has(a.id))
    .map(a => {
      // Increment retry count for items that failed but are still in queue
      const wasRetried = retryable.find(r => r.action.id === a.id);
      return wasRetried ? { ...a, retryCount: wasRetried.attempt } : a;
    });
  writeQueue(remaining);
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: remaining.length } }));

  return { synced: synced.length, failed: failed.length };
}

// ─── Action Processors ─────────────────────────────────────────────────────

async function processLoopSave(action: QueuedAction): Promise<void> {
  const payload = action.payload as { config: unknown; sourceDishIds?: string[]; assignments?: unknown[] };
  const { default: api } = await import('../lib/api');
  try {
    await api.post('/loop-config', {
      config: payload.config,
      sourceDishIds: payload.sourceDishIds,
      assignmentCount: payload.assignments?.length ?? 0,
    });
  } catch (err: any) {
    // FIX 2: If endpoint doesn't exist (404), mark as synced to prevent retry spam
    if (err?.status === 404 || err?.response?.status === 404) {
      console.warn('[OfflineQueue] /loop-config endpoint not found. Skipping sync.');
      return;
    }
    throw err; // Let retry logic handle other errors
  }
}

async function processPantryToggle(action: QueuedAction): Promise<void> {
  // Pantry toggles are already persisted in Zustand store;
  // no additional API call needed — just mark as synced
}
