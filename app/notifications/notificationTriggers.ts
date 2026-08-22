// ─────────────────────────────────────────────────────────────────────────────
// Notification Triggers — Timed and event-based notification logic
// Each trigger checks conditions and fires via the notification store.
// ─────────────────────────────────────────────────────────────────────────────

import { useNotificationStore, type NotificationType } from './notificationStore';
import { getISODate, daysBetweenISO, getISTDayOfWeek } from '../../utils/dateUTC';
import type { MealType } from '../../types/tray';
import type { Dish } from '../../meal/constants/dishLibrary';

// ─── Meal Reminder ──────────────────────────────────────────────────────────

const SLOT_TIMES: Record<string, { start: number; end: number }> = {
  breakfast: { start: 7, end: 10 },
  lunch: { start: 12, end: 15 },
  snacks: { start: 16, end: 18 },
  dinner: { start: 19, end: 22 },
};

const SLOT_REMINDER_OFFSET = 1; // hours before slot to send reminder

const SLOT_LABELS: Record<string, string> = {
  breakfast: '☀️ Breakfast', lunch: '🌤️ Lunch', snacks: '🍪 Snacks', dinner: '🌙 Dinner',
};

/**
 * Check if current time is within a slot window and fire a reminder once.
 * Uses a recent-by-type check to avoid duplicate reminders.
 */
export function checkMealReminder(
  today: string,
  getMeals: (date: string, mealType: MealType) => { name?: string; title?: string }[],
) {
  const store = useNotificationStore.getState();
  if (!store.enabled) return;

  const hour = new Date().getHours();
  const slots: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

  for (const slot of slots) {
    const slotTimes = SLOT_TIMES[slot];
    if (!slotTimes) continue;
    const { start, end } = slotTimes;
    // Fire reminder 1 hour before the slot starts
    const remindAt = start - SLOT_REMINDER_OFFSET;
    if (hour < remindAt || hour >= remindAt + 1) continue;

    const meals = getMeals(today, slot);
    if (meals.length === 0) continue;

    // Avoid duplicate — check if we already fired one in the last 23 hours
    const slotLabel = SLOT_LABELS[slot];
    if (!slotLabel) continue;
    const recent = store.recentByType('meal_reminder', 23 * 3600000);
    if (recent.some((r) => r.message.includes(slotLabel))) continue;

    const dishName = meals[0]?.name || meals[0]?.title || 'your meal';
    store.addNotification({
      type: 'meal_reminder',
      title: slotLabel,
      message: `Time for ${slot}! Your ${dishName} is waiting.`,
      action: { label: 'View Plan' },
    });
  }
}

// ─── Swap/Lunch Change Notification ─────────────────────────────────────────

/**
 * Fire a notification when the user swaps a meal. Integrate with swap actions.
 */
export function fireMealChanged(
  date: string,
  mealType: MealType,
  oldName: string,
  newName: string,
) {
  const store = useNotificationStore.getState();
  if (!store.enabled) return;

  const dateLabel = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  store.addNotification({
    type: 'meal_changed',
    title: '🍽️ Meal Updated',
    message: `${oldName} → ${newName} for ${SLOT_LABELS[mealType]} on ${dateLabel}`,
  });
}

// ─── New User Guide ─────────────────────────────────────────────────────────

const GUIDE_STEPS = [
  {
    message: '💡 Tap any meal to swap it with another dish from your tray.',
    delayMs: 30000, // 30s after first login
  },
  {
    message: '📋 You can add dishes to your tray from the Profile tab under "Your Tray".',
    delayMs: 120000, // 2 min after first login
  },
  {
    message: '🔄 The meal loop auto-rotates your tray dishes so you never repeat the same meal daily.',
    delayMs: 300000, // 5 min after first login
  },
  {
    message: '👨‍🍳 Your cook gets the full week\'s plan on WhatsApp — no app needed on their end.',
    delayMs: 600000, // 10 min after first login
  },
];

let _guideTimer: ReturnType<typeof setTimeout> | null = null;
let _guideIndex = 0;

/**
 * Start the new-user guide sequence. Call once on first login.
 */
export function startNewUserGuide() {
  const store = useNotificationStore.getState();
  if (!store.enabled) return;

  // Mark as seen immediately so it doesn't repeat
  store.lastSeenGuide = Date.now();

  // Don't re-show if user has seen guides recently (within 7 days)
  if (Date.now() - store.lastSeenGuide < 7 * 86400000 && store.lastSeenGuide > 0) return;

  _guideIndex = 0;
  scheduleNextGuide();
}

function scheduleNextGuide() {
  if (_guideIndex >= GUIDE_STEPS.length) {
    // Mark as seen
    useNotificationStore.getState().lastSeenGuide = Date.now();
    return;
  }

  _guideTimer = setTimeout(() => {
    const store = useNotificationStore.getState();
    if (!store.enabled) return;

    const step = GUIDE_STEPS[_guideIndex];
    if (!step) { _guideIndex++; scheduleNextGuide(); return; }
    store.addNotification({
      type: 'new_user_guide',
      title: '💡 Pro Tip',
      message: step.message,
    });
    _guideIndex++;
    scheduleNextGuide();
  }, GUIDE_STEPS[_guideIndex]?.delayMs ?? 60000);
}

/**
 * Cancel the guide sequence (e.g., on logout).
 */
export function cancelGuide() {
  if (_guideTimer) clearTimeout(_guideTimer);
  _guideIndex = GUIDE_STEPS.length;
}

// ─── Plan Ending Notification ───────────────────────────────────────────────

/**
 * Check if the meal plan is ending within 3 days and fire a notification once.
 */
export function checkPlanEnding(planStartDate: string, cycleLength: number) {
  const store = useNotificationStore.getState();
  if (!store.enabled) return;

  // Calculate plan end date
  const endDate = (() => {
    const d = new Date(planStartDate);
    d.setDate(d.getDate() + cycleLength * 7);
    return d.toISOString().slice(0, 10);
  })();

  const daysLeft = daysBetweenISO(getISODate(), endDate);
  if (daysLeft < 0 || daysLeft > 3) return;

  // Avoid duplicate
  const recent = store.recentByType('plan_ending', 24 * 3600000);
  if (recent.length > 0) return;

  if (daysLeft === 0) {
    store.addNotification({
      type: 'plan_ending',
      title: '📅 Plan Ends Today',
      message: 'Your meal plan ends today! Extend the cycle in Profile to keep going.',
      action: { label: 'Extend' },
    });
  } else {
    store.addNotification({
      type: 'plan_ending',
      title: '📅 Plan Ending Soon',
      message: `Your meal plan ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Extend now to avoid gaps.`,
      action: { label: 'Extend' },
    });
  }
}

// ─── Cook Share Notification ────────────────────────────────────────────────

/**
 * Fire a notification after the plan is shared via WhatsApp.
 */
export function fireCookShare(cookName: string) {
  const store = useNotificationStore.getState();
  if (!store.enabled) return;

  store.addNotification({
    type: 'cook_share',
    title: '📤 Plan Shared',
    message: `Your meal plan was sent to ${cookName} on WhatsApp.`,
  });
}

// ─── End-of-Day Grocery Reminder ─────────────────────────────────────────────

/**
 * Check after dinner time if there are unchecked pantry items for tomorrow.
 * Fires once per day (avoids duplicate within 12 hours).
 */
export function checkPantryNeeds(uncheckedCount: number) {
  const store = useNotificationStore.getState();
  if (!store.enabled) return;
  if (uncheckedCount === 0) return;

  const hour = new Date().getHours();
  // Fire after dinner (22:00 = 10 PM) up until midnight
  if (hour < 22 || hour >= 24) return;

  // Avoid duplicate — check if already fired in last 12 hours
  const recent = store.recentByType('pantry_reminder', 12 * 3600000);
  if (recent.length > 0) return;

  store.addNotification({
    type: 'pantry_reminder',
    title: '🥦 Groceries Needed Tomorrow',
    message: `You have ${uncheckedCount} item${uncheckedCount !== 1 ? 's' : ''} on your shopping list. Add them before tomorrow's cook.`,
    action: { label: 'View Pantry' },
  });
}
