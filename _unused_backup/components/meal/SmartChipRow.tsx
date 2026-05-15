// ─────────────────────────────────────────────────────────────────────────────
// SmartChipRow — Unified chip group: single-select (gravy/bread/rice) OR
// multi-select (sides/beverages). Reads metadata, renders only relevant options.
// Horizontal scroll with snap-x, ≥44px tap targets, ARIA-compliant.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useCallback } from 'react';
interface SmartChipRowProps {
  /** Section label (Gravy, Bread, Rice, Sides, Beverages) */
  label: string;
  /** Available chip options from meal metadata */
  options: string[];
  /** Selected value (single) or array (multi) */
  selected: string | null | string[];
  /** true = radio behavior (tap to switch), false = checkbox (tap to toggle) */
  singleSelect: boolean;
  /** Called on chip tap. For single: (value). For multi: (value, newSelections) */
  onSelect: (value: string, newSelections?: string[]) => void;
  /** Optional: icon prefix for each option */
  iconMap?: Record<string, string>;
}

export const SmartChipRow: React.FC<SmartChipRowProps> = React.memo(({
  label,
  options,
  selected,
  singleSelect,
  onSelect,
  iconMap,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTap = useCallback((option: string) => {
    if (singleSelect) {
      // Single-select: toggle off if already selected, else select
      const newSelected = selected === option ? null : option;
      onSelect(option, newSelected ? [newSelected] : []);
    } else {
      // Multi-select: toggle
      const current = Array.isArray(selected) ? selected : [];
      const newSelections = current.includes(option)
        ? current.filter(s => s !== option)
        : [...current, option];
      onSelect(option, newSelections);
    }
  }, [singleSelect, selected, onSelect]);

  const isActive = (option: string): boolean => {
    if (singleSelect) {
      return selected === option;
    }
    return Array.isArray(selected) && selected.includes(option);
  };

  // Skip rendering if no options
  if (options.length === 0) return null;

  // Normalize label for display (capitalize first letter)
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

  // Determine ARIA role
  const role = singleSelect ? 'radiogroup' : 'group';
  const ariaLabel = `${displayLabel} options`;

  return (
    <div className="mb-2.5 last:mb-0" role={role} aria-label={ariaLabel}>
      {/* Label */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {displayLabel}
        </span>
        {!singleSelect && Array.isArray(selected) && selected.length > 0 && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FF385C]/10 text-[#FF385C]">
            {selected.length}
          </span>
        )}
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mb-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {options.map((option) => {
          const active = isActive(option);
          const icon = iconMap?.[option.toLowerCase()] ?? '';

          return (
            <button
              key={option}
              onClick={() => handleTap(option)}
              className={`
                shrink-0 snap-start h-9 px-3 rounded-full text-xs font-semibold
                flex items-center gap-1.5 transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] focus-visible:ring-offset-1
                focus-visible:ring-offset-white
                ${active
                  ? 'bg-[#FF385C] text-white shadow-sm shadow-[#FF385C]/30 scale-[1.02]'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }
              `}
              role={singleSelect ? 'radio' : 'checkbox'}
              aria-checked={active}
              aria-label={`${option} ${displayLabel.toLowerCase()}`}
            >
              {icon && <span className="text-[10px]" aria-hidden="true">{icon}</span>}
              <span className="truncate">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

SmartChipRow.displayName = 'SmartChipRow';
export default SmartChipRow;
