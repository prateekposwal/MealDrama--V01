import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { expenseApi } from '../../app/utils/expenseApi';
import type { ActivityEntry } from '../../types/household';

const ACTION_EMOJI: Record<string, string> = {
  'added': '➕',
  'added expense': '💰',
  'swapped': '🔄',
  'removed': '🗑️',
  'completed': '✅',
};

interface Props {
  householdId: string;
}

export default function ActivityFeed({ householdId }: Props) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await expenseApi.activity(householdId);
      setActivities(data);
    } catch (e) {
      console.error('Failed to load activity:', e);
    }
  }, [householdId]);

  useEffect(() => { if (expanded) load(); }, [expanded, load]);

  const formatDate = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="border-b border-gray-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">Activity</span>
          {!expanded && activities.length > 0 && (
            <span className="text-[9px] font-bold text-gray-400">{activities.length} events</span>
          )}
        </div>
        {expanded ? <ChevronDown size={14} className="text-gray-300" /> : <ChevronRight size={14} className="text-gray-300" />}
      </button>

      {expanded && (
        <div className="px-5 pb-4">
          {activities.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {activities.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50">
                  <span className="text-sm mt-0.5">{ACTION_EMOJI[a.action] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700">
                      <span className="font-bold">{a.memberName}</span> {a.action} {a.detail}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{formatDate(a.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
