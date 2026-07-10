const STORAGE_KEY = 'mealdrama_util_queue';
const QUEUE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const QUEUE_MAX_SIZE = 50;

export type OfflineActionType = 'loop_save' | 'pantry_toggle' | 'dish_add' | 'custom_dish';

export interface QueuedAction {
  id: string;
  type: OfflineActionType;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  expiresAt: number;
}

function actionId(type: string, _payload: unknown): string {
  return `${type}_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
}

function readQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const queue: QueuedAction[] = JSON.parse(raw);
    const now = Date.now();
    const valid = queue.filter(a => a.expiresAt > now);
    if (valid.length !== queue.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
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

const _pending = new Map<string, QueuedAction>();
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (_flushTimer) return;
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    if (_pending.size === 0) return;
    const queue = readQueue();
    const existingIds = new Set(queue.map(a => a.id));
    for (const action of _pending.values()) {
      if (!existingIds.has(action.id)) {
        if (queue.length >= QUEUE_MAX_SIZE) {
          queue.splice(0, queue.length - QUEUE_MAX_SIZE + 1);
        }
        queue.push(action);
        existingIds.add(action.id);
      }
    }
    _pending.clear();
    writeQueue(queue);
    window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: queue.length } }));
  }, 0);
}

export function enqueue(type: OfflineActionType, payload: unknown): void {
  const id = actionId(type, payload);
  if (_pending.has(id)) return;
  _pending.set(id, {
    id, type, payload,
    timestamp: Date.now(),
    retryCount: 0,
    expiresAt: Date.now() + QUEUE_EXPIRY_MS,
  } as QueuedAction);
  scheduleFlush();
}

export function flushNow(): void {
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  const queue = readQueue();
  const existingIds = new Set(queue.map(a => a.id));
  for (const action of _pending.values()) {
    if (!existingIds.has(action.id)) {
      if (queue.length >= QUEUE_MAX_SIZE) {
        queue.splice(0, queue.length - QUEUE_MAX_SIZE + 1);
      }
      queue.push(action);
    }
  }
  _pending.clear();
  writeQueue(queue);
}

function dequeue(id: string): void {
  const queue = readQueue().filter(a => a.id !== id);
  writeQueue(queue);
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: queue.length } }));
}

export function getPendingCount(): number {
  return readQueue().length + _pending.size;
}

export function getQueue(): QueuedAction[] {
  return readQueue();
}

export function clearQueue(): void {
  writeQueue([]);
  _pending.clear();
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: 0 } }));
}

export async function processQueue(): Promise<{ synced: number; failed: number }> {
  flushNow();
  const queue = readQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const synced: string[] = [];
  const failed: string[] = [];
  const retryable: Array<{ action: QueuedAction; attempt: number }> = [];

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
      failed.push(action.id);
    }
  }

  const processedSet = new Set([...synced, ...failed]);
  const remaining = readQueue()
    .filter(a => !processedSet.has(a.id))
    .map(a => {
      const wasRetried = retryable.find(r => r.action.id === a.id);
      return wasRetried ? { ...a, retryCount: wasRetried.attempt } : a;
    });
  writeQueue(remaining);
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: remaining.length } }));

  return { synced: synced.length, failed: failed.length };
}

async function processLoopSave(action: QueuedAction): Promise<void> {
  const payload = action.payload as { config: unknown; sourceDishIds?: string[]; assignments?: unknown[] };
  const { default: api } = await import('../../lib/api');
  try {
    await api.post('/loop-config', {
      config: payload.config,
      sourceDishIds: payload.sourceDishIds,
      assignmentCount: payload.assignments?.length ?? 0,
    });
  } catch (err: any) {
    if (err?.status === 404 || err?.response?.status === 404) {
      console.warn('[OfflineQueue] /loop-config endpoint not found. Skipping sync.');
      return;
    }
    throw err;
  }
}

async function processPantryToggle(action: QueuedAction): Promise<void> {
}
