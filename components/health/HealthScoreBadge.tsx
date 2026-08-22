import React from 'react';
import { getHealthLabel, getHealthIcon } from '../../utils/nutritionScore';

interface HealthScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
  lg: 'text-xs px-3 py-1.5 gap-2',
};

export const HealthScoreBadge: React.FC<HealthScoreBadgeProps> = React.memo(({ score, size = 'sm' }) => {
  const { label, color, bg } = getHealthLabel(score);
  const icon = getHealthIcon(score);

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border ${bg} ${color} ${sizeClasses[size]}`}
      aria-label={label}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
});

HealthScoreBadge.displayName = 'HealthScoreBadge';
