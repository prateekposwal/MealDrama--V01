import React, { useCallback, useEffect, useState } from 'react';
import { dietApi } from '../../app/utils/dietApi';
import type { DietMemberView } from '../../types/household';

/**
 * Member Diets — the admin-visible diet board. Data comes from
 * GET /api/v1/households/:householdId/diets (REAL DietPreference rows — the
 * server enforces the policy: admin sees every member, a non-admin sees only
 * their own row). A member who never PUT a diet renders "Not set yet" — never
 * a fabricated default.
 *
 * Auto-refresh: refetches when `diet_updated` (a member saved their diet) or
 * `household:refresh` fires, so an admin's board updates live after an edit.
 */
const DIET_LABELS: Record<string, string> = {
  veg: '🥬 Veg', 'non-veg': '🍗 Non-Veg', eggitarian: '🥚 Eggitarian', vegan: '🌱 Vegan',
};
const REGION_LABELS: Record<string, string> = {
  north: 'North India', south: 'South India', east: 'East India',
  west: 'West India', central: 'Central India', northeast: 'Northeast India',
};
const SPICE_LABELS: Record<string, string> = { mild: 'Mild 🌿', medium: 'Medium 🌶️', hot: 'Hot 🔥' };

function dietChips(d: DietMemberView['diet']): string[] {
  if (!d) return [];
  const chips: string[] = [
    DIET_LABELS[d.dietType] ?? d.dietType,
    REGION_LABELS[d.region] ?? d.region,
    SPICE_LABELS[d.spiceLevel] ?? d.spiceLevel,
  ];
  if (d.healthGoal) chips.push(`🎯 ${d.healthGoal}`);
  if (d.allergies.length) chips.push(`⚠️ ${d.allergies.join(', ')}`);
  if (d.dislikedItems.length) chips.push(`🚫 ${d.dislikedItems.join(', ')}`);
  return chips;
}

export const FamilyDiets: React.FC<{ householdId: string }> = ({ householdId }) => {
  const [members, setMembers] = useState<DietMemberView[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!householdId) return;
    setFailed(false);
    try {
      const view = await dietApi.listHouseholdDiets(householdId);
      setMembers(view.members);
    } catch {
      setFailed(true);
    }
  }, [householdId]);

  useEffect(() => { void load(); }, [load]);

  // Auto-refresh when a member edits their diet or the household refreshes.
  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener('diet_updated', refresh);
    window.addEventListener('household:refresh', refresh);
    return () => {
      window.removeEventListener('diet_updated', refresh);
      window.removeEventListener('household:refresh', refresh);
    };
  }, [load]);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Member Diets</p>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {members === null ? 'loading…' : `${members.length} shown`}
        </span>
      </div>
      {failed ? (
        <p className="text-xs text-gray-400 py-1">Couldn't load diets — pull the household refresh to retry.</p>
      ) : members === null ? (
        <p className="text-xs text-gray-300 py-1">Loading…</p>
      ) : members.length === 0 ? (
        <p className="text-xs text-gray-400 py-1">No member rows returned.</p>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.memberId} className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                {m.memberName}
                {m.role === 'admin' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">admin</span>}
              </p>
              {m.diet ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {dietChips(m.diet).map((chip, i) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                      {chip}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 mt-0.5">Not set yet — nothing fabricated, their real picker is empty.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyDiets;
