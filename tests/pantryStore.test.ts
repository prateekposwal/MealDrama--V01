import { describe, it, expect, beforeEach } from 'vitest';
import { usePantryStore } from '../app/store/pantryStore';

// U11: the checked map is day-scoped — auto (meal-derived) "have it" marks
// from a previous IST day's grocery view must not persist into today's list.
// Auto vs user-set cannot be told apart in the persisted flat map, so the
// safe rule wipes ALL of yesterday's checks exactly once per IST day.
describe('pantryStore — U11 day-scoped auto-check reset', () => {
  beforeEach(() => {
    usePantryStore.setState({ checkedItems: {}, lastResetDay: '' });
  });

  it('clears yesterday\'s checks once when the IST day changes', () => {
    usePantryStore.setState({ checkedItems: { Milk: true, Onion: false }, lastResetDay: '2026-08-21' });
    usePantryStore.getState().resetChecksForDay('2026-08-22');
    const s = usePantryStore.getState();
    expect(s.checkedItems).toEqual({});
    expect(s.lastResetDay).toBe('2026-08-22');
  });

  it('keeps today\'s checks — same-day calls are a no-op', () => {
    usePantryStore.setState({ lastResetDay: '2026-08-22' });
    usePantryStore.getState().setChecked('Milk', true);
    usePantryStore.getState().resetChecksForDay('2026-08-22');
    expect(usePantryStore.getState().checkedItems).toEqual({ Milk: true });
  });

  it('fresh store (no stamp) clears once on first call and stamps the day', () => {
    usePantryStore.setState({ checkedItems: { Milk: true }, lastResetDay: '' });
    usePantryStore.getState().resetChecksForDay('2026-08-22');
    const s = usePantryStore.getState();
    expect(s.checkedItems).toEqual({});
    expect(s.lastResetDay).toBe('2026-08-22');
  });

  it('no-op on an empty date string — never clears blindly', () => {
    usePantryStore.setState({ checkedItems: { Milk: true }, lastResetDay: '2026-08-22' });
    usePantryStore.getState().resetChecksForDay('');
    expect(usePantryStore.getState().checkedItems).toEqual({ Milk: true });
    expect(usePantryStore.getState().lastResetDay).toBe('2026-08-22');
  });

  it('clearChecked remains the raw primitive (works directly)', () => {
    usePantryStore.getState().setChecked('Milk', true);
    usePantryStore.getState().clearChecked();
    expect(usePantryStore.getState().checkedItems).toEqual({});
  });
});
