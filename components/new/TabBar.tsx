import React from 'react';
import { Home, Calendar, ShoppingBasket, User as UserIcon } from 'lucide-react';

export const TABS = [
  { key: 'dashboard', label: 'Home', Icon: Home },
  { key: 'plan', label: 'Plan', Icon: Calendar },
  { key: 'pulse', label: 'Pantry', Icon: ShoppingBasket },
  { key: 'profile', label: 'Profile', Icon: UserIcon },
] as const;

export type Tab = typeof TABS[number]['key'];

export const TabBar: React.FC<{ activeTab: Tab; onTabChange: (tab: Tab) => void }> = ({ activeTab, onTabChange }) => (
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
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-[#FF385C]/10' : ''}`}>
              <Icon
                size={22}
                className={`transition-colors duration-200 ${active ? 'text-[#FF385C]' : 'text-gray-400'}`}
                aria-hidden="true"
              />
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
