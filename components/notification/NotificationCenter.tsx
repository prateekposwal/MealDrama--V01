// ─────────────────────────────────────────────────────────────────────────────
// NotificationCenter — Bell icon with badge + slide-up notification panel
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, X, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationStore, type AppNotification } from '../../app/notifications/notificationStore';

const TYPE_ICONS: Record<string, string> = {
  meal_reminder: '⏰',
  swap_reminder: '🔄',
  new_user_guide: '💡',
  plan_ending: '📅',
  meal_changed: '🍽️',
  cook_share: '📤',
  tip: '💡',
  pantry_reminder: '🥦',
  pantry_low: '⚠️',
  pantry_expired: '🗑️',
};

function isPantry(type: string): boolean {
  return type.startsWith('pantry_');
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

export default function NotificationCenter({ defaultTab: initialTab }: { defaultTab?: 'plan' | 'pantry' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'plan' | 'pantry'>(initialTab || 'plan');
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, enabled, unreadCount, markRead, markAllRead, clearNotification, clearAll, setEnabled } = useNotificationStore();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    setTimeout(() => document.addEventListener('click', handler), 100);
    return () => document.removeEventListener('click', handler);
  }, [isOpen]);

  const count = unreadCount();

  return (
    <>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all"
        aria-label="Notifications"
      >
        {enabled ? <Bell size={22} className="text-gray-400" /> : <BellOff size={22} className="text-gray-300" />}
        {count > 0 && enabled && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed inset-x-4 top-20 mx-auto max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] max-h-[70vh] flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-sm font-medium text-[#FF385C] hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 pt-3 pb-3 border-b border-gray-100">
            {(['plan', 'pantry'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setIsOpen(true); }}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${tab === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}
              >{t === 'plan' ? '📋 Plan' : '🥦 Pantry'}</button>
            ))}
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => setEnabled(!enabled)}
                className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-[#FF385C]' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter by tab */}
          {(() => {
            const filtered = notifications.filter(n => tab === 'pantry' ? isPantry(n.type) : !isPantry(n.type));
            const valid = enabled ? filtered : [];
            return (
              <>
              {valid.length === 0 ? (
                <div className="px-5 py-12 text-center flex-1 overflow-y-auto">
                  <Bell size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">No {tab} notifications</p>
                  <p className="text-xs text-gray-300 mt-1">{tab === 'pantry' ? 'Pantry updates will appear here' : 'Meal reminders and updates will appear here'}</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {filtered.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={() => markRead(n.id)}
                      onClear={() => clearNotification(n.id)}
                    />
                  ))}
                </div>
              )}
              {/* Footer */}
              {filtered.length > 0 && (
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} /> Clear all
                  </button>
                  <span className="text-xs text-gray-300">
                    {filtered.filter((n) => !n.read).length} unread
                  </span>
                </div>
              )}
              </>
            );
          })()}
        </div>
      )}
    </>
  );
}

function NotificationItem({
  notification: n,
  onMarkRead,
  onClear,
}: {
  notification: AppNotification;
  onMarkRead: () => void;
  onClear: () => void;
}) {
  const handleClick = () => {
    onMarkRead();
    if (n.action?.route) {
      window.dispatchEvent(new CustomEvent('navigate-to', { detail: { tab: n.action.route } }));
    }
  };
  return (
    <div
      className={`px-5 py-4 flex items-start gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer group ${!n.read ? 'bg-[#FF385C]/[0.03]' : ''}`}
      onClick={handleClick}
    >
      <span className="text-lg mt-0.5 flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!n.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-gray-400">{formatTime(n.timestamp)}</span>
          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#FF385C]" />}
          {n.action && (
            <span className="text-xs font-bold text-[#FF385C]">{n.action.label} →</span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClear(); }}
        className="p-1.5 rounded-full hover:bg-gray-100 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 active:scale-90"
        aria-label="Clear notification"
      >
        <X size={14} className="text-gray-400" />
      </button>
    </div>
  );
}
