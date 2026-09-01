import React from 'react';
import { X } from 'lucide-react';
import { useHouseholdFeedStore, toNotifications, unreadCount } from '../../plan/store/householdFeedStore';

const KIND_META: Record<string, { icon: string; color: string }> = {
  request: { icon: '🙋', color: 'text-indigo-600' },
  purchased: { icon: '🛒', color: 'text-teal-600' },
  accepted: { icon: '✅', color: 'text-emerald-600' },
  completed: { icon: '✔️', color: 'text-gray-500' },
  permission: { icon: '🔐', color: 'text-amber-600' },
  added: { icon: '➕', color: 'text-sky-600' },
  removed: { icon: '➖', color: 'text-gray-400' },
  requested: { icon: '🙋', color: 'text-indigo-600' },
};

export const NotificationsSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const requests = useHouseholdFeedStore(s => s.requests);
  const activity = useHouseholdFeedStore(s => s.activity);
  const lastSeen = useHouseholdFeedStore(s => s.lastSeen);
  const markSeen = useHouseholdFeedStore(s => s.markSeen);

  const notifications = React.useMemo(() => toNotifications(requests, activity), [requests, activity]);
  const unseen = unreadCount(notifications, lastSeen);

  // Opening the center marks everything read — the dots stay connected to
  // what you've actually SEEN, not just what fired.
  React.useEffect(() => {
    if (open) markSeen();
  }, [open, markSeen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative max-w-lg w-full bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-[max(24px,env(safe-area-inset-bottom))] max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-black text-gray-900">🔔 Household · {unseen > 0 ? `${unseen} new` : 'all caught up'}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-all" aria-label="Close">
            <X size={14} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {notifications.length === 0 ? (
            <p className="text-sm font-bold text-gray-400 py-10 text-center">No household activity yet.</p>
          ) : (
            notifications.map(n => {
              const meta = KIND_META[n.action ?? n.kind] ?? KIND_META.activity ?? { icon: '🔔', color: 'text-gray-500' };
              return (
                <div key={n.id} className={`flex items-start gap-2 px-3 py-2 rounded-xl ${new Date(n.date).getTime() <= lastSeen ? '' : 'bg-orange-50'}`}>
                  <span className="text-base">{meta.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${new Date(n.date).getTime() <= lastSeen ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 truncate">{n.detail}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};