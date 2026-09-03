import React, { useEffect, useState } from 'react';
import { fetchAIScore } from '../../utils/aiEngine';
import { useStore } from '../../app/store/useStore';
import { useTrayStore } from '../../plan/store/useTrayStore';

export default function ProfileAIInsights() {
  const user = useStore(s => s.user);
  const tray = useStore(s => s.trayLibrary);
  const planDays = useTrayStore(s => s.plan.days);
  const pantry = useStore(s => s.user?.pantryStaples) || [];
  const diet = user?.diet || 'vegetarian';
  const prefs = user?.preferredRegions || ['north_indian'];
  const healthGoal = user?.goal;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIScore({
      trayLibrary: tray || {}, planDays: planDays || {},
      pantryStaples: pantry, diet, preferredRegions: prefs, healthGoal,
    }).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [diet, healthGoal]);

  if (loading) return null;
  if (!data) return null;

  const top = (data.metrics || []).filter((m: any) =>
    ['diet_match', 'discoverability', 'region_diversity'].includes(m.key)
  );

  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {top.map((m: any) => {
        const colors: Record<string, string> = { diet_match: '#22c55e', discoverability: '#3b82f6', region_diversity: '#eab308' };
        return (
          <div key={m.key} className="rounded-xl bg-white border border-gray-100 p-3.5 text-center shadow-sm">
            <p className="text-lg font-bold" style={{ color: colors[m.key] || '#FF385C' }}>{m.pct}%</p>
            <p className="text-xs text-gray-500 mt-1 leading-snug">{m.label}</p>
          </div>
        );
      })}
    </div>
  );
}
