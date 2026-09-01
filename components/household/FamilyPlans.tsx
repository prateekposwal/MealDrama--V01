import React, { useMemo, useEffect } from 'react';
import type { Household, HouseholdMember } from '../../types/household';
import { buildMemberWeek, MemberPlanPrefs } from '../../utils/memberPlan';
import { useStore } from '../../app/store/useStore';
import { useHouseholdKitchenStore } from '../../plan/store/householdKitchenStore';

const SLOT_META: Array<{ key: 'breakfast' | 'lunch' | 'snacks' | 'dinner'; label: string; icon: string }> = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '☀️' },
  { key: 'snacks', label: 'Snacks', icon: '🥜' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
];

function prefsFor(member: HouseholdMember): MemberPlanPrefs {
  return {
    dietType: member.profile?.dietType ?? 'veg',
    region: member.profile?.region ?? 'north',
    plannedSlots: member.profile?.plannedSlots ?? [],
    healthGoal: member.profile?.healthGoal ?? '',
  };
}

export const FamilyPlans: React.FC<{ household: Household }> = ({ household }) => {
  const selfId = useStore(s => s.user?.id);
  const updateHouseholdMember = useStore(s => s.updateHouseholdMember);
  const isAdmin = household.members.find(m => m.id === selfId)?.role === 'admin'
    || household.members.find(m => m.userId === selfId)?.role === 'admin';

  const lanes = useMemo(
    () => household.members.map(member => ({
      member,
      plan: buildMemberWeek(prefsFor(member), member.autoPlanEnabled, 2),
    })),
    [household],
  );

  // Persist generated lanes to the server (so a fresh device shows the same
  // Family Plans — the generation is deterministic, this makes it durable).
  useEffect(() => {
    const hhId = household.id;
    if (!hhId) return;
    for (const { member, plan } of lanes) {
      if (!member.id || plan.length === 0) continue;
      const snapshot = plan.map(({ date, day }) => ({
        date,
        slots: Object.fromEntries(Object.entries(day).map(([k, v]) => [k, v ? { id: (v as any).id, name: (v as any).name, icon: (v as any).icon } : null])),
      }));
      void useHouseholdKitchenStore.getState().saveLane(hhId, member.id, snapshot);
    }
  }, [lanes, household.id]);

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
      {lanes.map(({ member, plan }) => (
        <div key={member.id} className="rounded-2xl bg-white border border-gray-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
                {member.name}
                {member.role === 'admin' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">admin</span>}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {member.profile?.dietType ?? 'veg'} · {member.profile?.region ?? 'north'}
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
          {plan.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">Auto-plan is paused — nothing generated.</p>
          ) : (
            plan.map(({ date, day }) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[10px] font-bold text-gray-300">·</span>
                  <span className="text-[10px] font-bold text-indigo-400">auto from {member.profile?.region ?? 'region'} {member.profile?.dietType ?? 'diet'}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SLOT_META.map(({ key, label, icon }) => {
                    const dish = day[key];
                    return (
                      <div key={key} className="flex items-center gap-2 rounded-xl bg-gray-50 px-2 py-1.5 min-h-[34px]">
                        <span className="text-sm">{icon}</span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none">{label}</p>
                          {dish ? (
                            <p className="text-xs font-bold text-gray-800 truncate leading-tight">{dish.name}</p>
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