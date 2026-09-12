// ─────────────────────────────────────────────────────────────────────────────
// FAMILY PLANS — every member's REAL generated plan, from the persisted
// HouseholdPlanItem table (0 rows = honest empty).
//
// Product rule (honest household): a member WITHOUT a persisted plan is shown
// as "No plan generated this week" — we never fabricate a client-side mirror plan
// for them (the old buildMemberWeek auto-generation could invent a plan for
// every member and persist it). The HouseholdPlanItem table holds EXACTLY what
// each member last generated (upserted replace-all on tray/plan generation);
// a member with rows is rendered from THOSE rows. A member with zero rows is
// an honest empty — and is never used as a duplication constraint downstream
// (the pipeline's household-diversity set only contains persisted rows).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Household, HouseholdMember } from '../../types/household';
import { householdPlanApi, type HouseholdPlanRow } from '../../app/utils/householdPlanApi';
import { DISH_LIBRARY } from '../../meal/constants/dishLibrary';
import { useStore } from '../../app/store/useStore';

const SLOT_META: Array<{ key: 'breakfast' | 'lunch' | 'snacks' | 'dinner'; label: string; icon: string }> = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '☀️' },
  { key: 'snacks', label: 'Snacks', icon: '🥜' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
];

/** Group persisted HouseholdPlanItem rows by the authoring USER id. Members
 *  with zero rows are simply absent — never guessed (pure, tested). */
export function groupHouseholdPlanRowsByAuthor(rows: HouseholdPlanRow[]): Record<string, HouseholdPlanRow[]> {
  const grouped: Record<string, HouseholdPlanRow[]> = {};
  for (const r of rows ?? []) {
    if (!r.authorUserId) continue;
    (grouped[r.authorUserId] ??= []).push(r);
  }
  return grouped;
}

/** Resolve a row's dish name from the library — a dead/unresolvable dishId
 *  renders as null (the UI shows an empty dash, NEVER a plausible meal). */
export function resolveHouseholdPlanDishName(dishId: string | undefined): string | null {
  if (!dishId) return null;
  return DISH_LIBRARY.find(d => d.id === dishId)?.name ?? null;
}

export const FamilyPlans: React.FC<{ household: Household }> = ({ household }) => {
  const selfId = useStore(s => s.user?.id);
  const updateHouseholdMember = useStore(s => s.updateHouseholdMember);
  const isAdmin = household.members.find(m => m.id === selfId)?.role === 'admin'
    || household.members.find(m => m.userId === selfId)?.role === 'admin';

  const [rowsByAuthor, setRowsByAuthor] = useState<Record<string, HouseholdPlanRow[]> | null>(null);

  // The REAL server rows — the only source of truth for "does this member
  // have a plan". 0 rows = honest empty; no client-side generation.
  const load = useCallback(async () => {
    if (!household.id) return;
    try {
      const res = await householdPlanApi.get(household.id);
      setRowsByAuthor(groupHouseholdPlanRowsByAuthor(res.dishes));
    } catch {
      // offline/unauthenticated — keep last good state, never fabricate
    }
  }, [household.id]);

  useEffect(() => { void load(); }, [load]);

  // Auto-refresh when the household refreshes (a member regenerated).
  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener('household:refresh', refresh);
    return () => window.removeEventListener('household:refresh', refresh);
  }, [load]);

  const lanes = useMemo(
    () => household.members.map((member) => {
      const rows = (rowsByAuthor ?? {})[member.userId ?? ''] ?? [];
      // Group rows by planned day (dayIndex 0..6) → per-slot dishId.
      const byDay = new Map<number, Partial<Record<'breakfast' | 'lunch' | 'snacks' | 'dinner', string>>>();
      for (const r of rows) {
        const day = byDay.get(r.dayIndex ?? 0) ?? {};
        if (r.mealSlot === 'breakfast' || r.mealSlot === 'lunch' || r.mealSlot === 'snacks' || r.mealSlot === 'dinner') {
          day[r.mealSlot] = r.dishId;
        }
        byDay.set(r.dayIndex ?? 0, day);
      }
      const days = [...byDay.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([dayIndex, slots]) => ({ dayIndex, slots }));
      return { member, rows, days };
    }),
    [household, rowsByAuthor],
  );

  const toggle = (member: HouseholdMember, patch: { autoPlanEnabled?: boolean; canEditPlan?: boolean }) => {
    void updateHouseholdMember(member.id, patch);
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Family Plans</p>
        {isAdmin && (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">You can change permissions</span>
        )}
      </div>
      {lanes.map(({ member, rows, days }) => (
        <div key={member.id} className="rounded-2xl bg-white border border-gray-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
                {member.name}
                {member.role === 'admin' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">admin</span>}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {(member.profile?.dietType ?? 'not set')} · {(member.profile?.region ?? 'not set')}
                {!member.autoPlanEnabled && ' · paused'}
              </p>
            </div>
            {isAdmin && member.id !== selfId && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggle(member, { autoPlanEnabled: !member.autoPlanEnabled })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold active:scale-95 transition-all ${member.autoPlanEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {member.autoPlanEnabled ? 'Auto-plan ON' : 'Auto-plan OFF'}
                </button>
                <button
                  onClick={() => toggle(member, { canEditPlan: !member.canEditPlan })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold active:scale-95 transition-all ${member.canEditPlan ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {member.canEditPlan ? 'Can edit' : 'View-only'}
                </button>
              </div>
            )}
          </div>
          {rows.length === 0 ? (
            <div role="status" data-testid="household-no-plan" className="py-1">
              <p className="text-xs text-gray-400">No plan generated this week</p>
              <p className="text-[10px] text-gray-300 mt-0.5">This member's meals appear here once they generate a plan.</p>
            </div>
          ) : days.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">Rows exist but no slot dishes resolved — nothing to show honestly.</p>
          ) : (
            days.map(({ dayIndex, slots }) => (
              <div key={dayIndex}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {dayIndex === 0 ? 'Current plan' : `Day ${dayIndex + 1}`}
                  </span>
                  <span className="text-[10px] font-bold text-gray-300">·</span>
                  <span className="text-[10px] font-bold text-indigo-400">generated plan</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SLOT_META.map(({ key, label, icon }) => {
                    const dishId = slots[key];
                    const dishName = resolveHouseholdPlanDishName(dishId);
                    return (
                      <div key={key} className="flex items-center gap-2 rounded-xl bg-gray-50 px-2 py-1.5 min-h-[34px]">
                        <span className="text-sm">{icon}</span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none">{label}</p>
                          {dishId && dishName ? (
                            <p className="text-xs font-bold text-gray-800 truncate leading-tight">{dishName}</p>
                          ) : (
                            <p className="text-xs text-gray-300 leading-tight">—</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
};

export default FamilyPlans;
