export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'preferences_saved'
  | 'first_plan_created'
  | 'meal_added_to_slot'
  | 'meal_variant_changed'
  | 'guest_mode_toggled'
  | 'guest_mode_enabled'
  | 'guest_mode_disabled'
  | 'meal_loop_set'
  | 'pantry_staple_updated'
  | 'roommate_link_generated'
  | 'roommate_pref_submitted'
  | 'app_load_time_ms'
  | 'slot_save_time_ms'
  | 'offline_action_queued'
  | 'offline_action_synced'
  | 'swap_completed'
  | 'meal_removed'
  | 'tray_edited'
  | 'custom_dish_created';

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

let _userId: string | null = null;
let _queue: AnalyticsPayload[] = [];
let _flushing = false;

export function setAnalyticsUserId(id: string | null) {
  _userId = id;
}

export function logEvent(
  event: AnalyticsEvent,
  metadata?: Record<string, unknown>,
) {
  const payload: AnalyticsPayload = {
    event,
    timestamp: Date.now(),
    userId: _userId || undefined,
    metadata,
  };

  _queue.push(payload);

  if (typeof window !== 'undefined') {
    localStorage.setItem(
      'mealdrama-analytics-queue',
      JSON.stringify(_queue),
    );
  }

  void flushAnalytics();
}

export async function flushAnalytics() {
  if (_flushing || _queue.length === 0) return;
  _flushing = true;

  try {
    const batch = _queue.splice(0, _queue.length);

    if (typeof window !== 'undefined' && navigator.onLine) {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      }).catch(() => {
        _queue.unshift(...batch);
      });
    }
  } finally {
    _flushing = false;

    if (_queue.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'mealdrama-analytics-queue',
          JSON.stringify(_queue),
        );
      }
    }
  }
}

export function loadQueuedAnalytics() {
  try {
    const raw =
      typeof window !== 'undefined'
        ? localStorage.getItem('mealdrama-analytics-queue')
        : null;
    if (raw) {
      _queue = JSON.parse(raw);
    }
  } catch {
    _queue = [];
  }
}

export function measureTime(
  event: AnalyticsEvent,
  fn: () => Promise<void> | void,
): Promise<void> {
  const start = performance.now();
  const result = fn();

  if (result instanceof Promise) {
    return result.then(() => {
      const duration = Math.round(performance.now() - start);
      logEvent(event, { duration_ms: duration });
    });
  }

  const duration = Math.round(performance.now() - start);
  logEvent(event, { duration_ms: duration });
  return Promise.resolve();
}
