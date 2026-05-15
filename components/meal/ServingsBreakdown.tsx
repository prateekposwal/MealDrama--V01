import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Users, Pizza, Wheat, GlassWater, Utensils } from 'lucide-react';
import type { TrayItem } from '../../store/useTrayStore';

interface ComponentCount {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface ServingsBreakdownProps {
  items: TrayItem[];
  /** Optional label override */
  title?: string;
  /** Default expanded state */
  defaultExpanded?: boolean;
}

export const ServingsBreakdown: React.FC<ServingsBreakdownProps> = ({
  items,
  title = 'Total Servings',
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const breakdown = useMemo(() => {
    const totalServings = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

    const counts: Record<string, number> = {
      'Main Dish': totalServings,
    };

    const breadCount = items.reduce((sum, i) => sum + (i.roti ? (i.quantity || 1) : 0), 0);
    if (breadCount > 0) counts['Bread'] = breadCount;

    const riceCount = items.reduce((sum, i) => sum + (i.rice ? (i.quantity || 1) : 0), 0);
    if (riceCount > 0) counts['Rice'] = riceCount;

    const sideCount = items.reduce((sum, i) => sum + ((i.sides?.length || 0) * (i.quantity || 1)), 0);
    if (sideCount > 0) counts['Sides'] = sideCount;

    const bevCount = items.reduce((sum, i) => sum + ((i.beverages?.length || 0) * (i.quantity || 1)), 0);
    if (bevCount > 0) counts['Beverages'] = bevCount;

    const gravyCount = items.reduce((sum, i) => sum + (i.gravy ? (i.quantity || 1) : 0), 0);
    if (gravyCount > 0) counts['Gravy'] = gravyCount;

    return counts;
  }, [items]);

  const componentList: ComponentCount[] = useMemo(() => [
    { label: 'Main Dish', count: breakdown['Main Dish'] || 0, icon: <Utensils size={14} />, color: 'text-[#FF385C]' },
    { label: 'Gravy', count: breakdown['Gravy'] || 0, icon: <Pizza size={14} />, color: 'text-orange-500' },
    { label: 'Bread', count: breakdown['Bread'] || 0, icon: <Wheat size={14} />, color: 'text-amber-600' },
    { label: 'Rice', count: breakdown['Rice'] || 0, icon: <Wheat size={14} />, color: 'text-blue-600' },
    { label: 'Sides', count: breakdown['Sides'] || 0, icon: <Utensils size={14} />, color: 'text-green-600' },
    { label: 'Beverages', count: breakdown['Beverages'] || 0, icon: <GlassWater size={14} />, color: 'text-cyan-600' },
  ].filter(c => c.count > 0), [breakdown]);

  const total = breakdown['Main Dish'] || 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors active:scale-[0.99]"
        aria-expanded={expanded}
        aria-label={`${title}: ${total}`}
      >
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[#FF385C]" />
          <span className="text-xs font-bold text-gray-700">{title}</span>
          <span className="text-lg font-black text-gray-900">{total}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-medium">{componentList.length} components</span>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 animate-in slide-in-from-top-1 duration-200">
          <div className="h-px bg-gray-100 my-1.5" />
          {componentList.map(c => {
            const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
            return (
              <div key={c.label} className="flex items-center gap-3 py-1">
                <span className={c.color}>{c.icon}</span>
                <span className="text-[11px] font-medium text-gray-600 w-16">{c.label}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: c.color.replace('text-', '').replace('orange-500', '#f97316').replace('amber-600', '#d97706').replace('blue-600', '#2563eb').replace('green-600', '#16a34a').replace('cyan-600', '#0891b2').replace('[#FF385C]', '#FF385C'),
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-500 w-12 text-right">{c.count}×</span>
                <span className="text-[9px] text-gray-400 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServingsBreakdown;
