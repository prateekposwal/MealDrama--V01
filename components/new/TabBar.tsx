import React from 'react';
import { Home, Calendar, ShoppingBasket, User as UserIcon } from 'lucide-react';
import { useHouseholdFeedStore, toNotifications, unreadCount } from '../../plan/store/householdFeedStore';

export const TABS = [
  { key: 'dashboard', label: 'Home', Icon: Home },
  { key: 'plan', label: 'Plan', Icon: Calendar },
  { key: 'pulse', label: 'Pantry', Icon: ShoppingBasket },
  { key: 'profile', label: 'Profile', Icon: UserIcon },
] as const;

export type Tab = typeof TABS[number]['key'];

export const TabBar: React.FC<{ activeTab: Tab; onTabChange: (tab: Tab) => void }> = ({ activeTab, onTabChange }) => {
  // Select STABLE store references (never a fresh object literal per render —
  // that made useSyncExternalStore loop "Maximum update depth exceeded").
  const requests = useHouseholdFeedStore(s => s.requests);
  const activity = useHouseholdFeedStore(s => s.activity);
  const lastSeen = useHouseholdFeedStore(s => s.lastSeen);
  const notifications = React.useMemo(() => toNotifications(requests, activity), [requests, activity]);
  // "Every dot connected": unread household events surface as dots on the
  // relevant tab — requests → Home/Plan, shared pantry purchases → Pantry.
  const unseen = unreadCount(notifications, lastSeen);
  const unreadRequests = notifications.filter(n => n.kind === 'request' && new Date(n.date).getTime() > lastSeen).length;
  const unreadPurchases = notifications.filter(n => n.kind === 'activity' && n.action === 'purchased' && new Date(n.date).getTime() > lastSeen).length;
  const hasHousehold = activity.length + requests.length > 0;
  const tabDot: Partial<Record<Tab, boolean>> = {
    dashboard: hasHousehold && unseen > 0,
    plan: hasHousehold && unreadRequests > 0,
    pulse: hasHousehold && unreadPurchases > 0,
  };
  return (
  <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50 pb-[env(safe-area-inset-bottom)]" role="navigation" aria-label="Main navigation">
    <div className="grid grid-cols-4 px-1 py-1">
      {TABS.map(({ key, label, Icon }) => {
        const active = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl transition-all duration-200"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-[#FF385C]/10' : ''}`}>
              <Icon
                size={22}
                className={`transition-colors duration-200 ${active ? 'text-[#FF385C]' : 'text-gray-400'}`}
                aria-hidden="true"
              />
              {tabDot[key] && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#FF385C] ring-2 ring-white" aria-label={`${label} has new updates`} />
              )}
            </div>
            <span className={`text-xs font-bold tracking-normal transition-colors duration-200 ${active ? 'text-[#FF385C]' : 'text-gray-400'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
  );
};
