// ─────────────────────────────────────────────────────────────────────────────
// ESTIMATED MACRO LABEL — the ONE shared macro display primitive.
//
// Product rule (honest-product trust): macros are ESTIMATES. Every macro that
// surfaces in the UI (kcal, protein, fiber, fat) must be labeled "estimated" —
// never "exactly 450 kcal"-style precision claims. The label is DRIVEN by the
// `estimated` flag that `estimateDishMacros` / `getDishCalorieInfo` already
// carry, so when per-dish lab nutrition arrives later the flag flips to false
// and the UI upgrades without churn (no surface hardcodes the prefix/pill).
//
// Usage:
//   <EstimatedMacroLabel value="1240" unit="kcal" estimated={m.estimated} />
//   →  ~1240 kcal est.           (estimated: true)
//   →  1240 kcal                 (estimated: false — future lab values)
//
// The pure helpers `estimatedMacroParts` / `formatEstimatedMacro` are exported
// so non-React surfaces (tests, string builders) share the SAME copy.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

/** The canonical "estimated" wording — one source, reused by every surface. */
export const ESTIMATED_MACRO_HINT = 'Estimated — typical serving data & standard references, not a lab measurement';

/** Pure label parts driven by the flag: prefix "~", suffix " · est.". */
export function estimatedMacroParts(estimated: boolean): { prefix: string; suffix: string } {
  return estimated ? { prefix: '~', suffix: ' · est.' } : { prefix: '', suffix: '' };
}

/** Build a plain-text macro label (tests + non-React callers share the copy). */
export function formatEstimatedMacro(value: string | number, unit: string, estimated: boolean): string {
  const { prefix, suffix } = estimatedMacroParts(estimated);
  return `${prefix}${value} ${unit}${suffix}`;
}

interface EstimatedMacroLabelProps {
  value: string | number;
  unit: string;
  /** THE flag — must come from the estimator/calorie-info, never hardcoded. */
  estimated: boolean;
  className?: string;
  /** When true, hides the value/unit and renders ONLY the est. marker —
   *  for totals where the value is already displayed alongside. */
  markerOnly?: boolean;
}

/** The shared macro display: adds a "~" prefix and an "est." pill whenever
 *  `estimated` is true, plus an accessible hint. When `estimated` is false the
 *  value renders bare — the future per-dish nutrition upgrade path. */
export const EstimatedMacroLabel: React.FC<EstimatedMacroLabelProps> = ({
  value,
  unit,
  estimated,
  className = '',
  markerOnly = false,
}) => {
  if (markerOnly) {
    if (!estimated) return null;
    return (
      <span className={`inline-block ${className}`} title={ESTIMATED_MACRO_HINT} aria-label="estimated">
        <span className="align-super text-[0.6em] font-bold text-gray-400">est.</span>
      </span>
    );
  }
  const { prefix } = estimatedMacroParts(estimated);
  return (
    <span className={className} title={estimated ? ESTIMATED_MACRO_HINT : undefined}>
      {prefix}{value} {unit}
      {estimated && (
        <span className="align-super text-[0.6em] font-bold text-gray-400 ml-0.5">est.</span>
      )}
    </span>
  );
};

export default EstimatedMacroLabel;
