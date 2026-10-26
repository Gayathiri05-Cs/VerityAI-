import React from 'react';
import { ReviewPriority } from '../../types';

interface Props {
  score: number;
  level: ReviewPriority;
  showScore?: boolean;
}

export const RiskBadge: React.FC<Props> = ({ score, level, showScore = true }) => {
  let badgeClasses = '';
  let dotClasses = '';
  let label = '';

  switch (level) {
    case 'critical':
      badgeClasses = 'bg-rose-100 text-rose-800 border-rose-300';
      dotClasses = 'bg-rose-500 animate-pulse';
      label = 'Critical Priority';
      break;
    case 'high':
      badgeClasses = 'bg-amber-100 text-amber-900 border-amber-300';
      dotClasses = 'bg-amber-500';
      label = 'High Priority';
      break;
    case 'medium':
      badgeClasses = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      dotClasses = 'bg-indigo-500';
      label = 'Medium Priority';
      break;
    case 'low':
    default:
      badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotClasses = 'bg-emerald-500';
      label = 'Low Priority';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${dotClasses}`} />
      <span>{label}</span>
      {showScore && (
        <span className="font-mono bg-white/70 px-1.5 py-0.2 rounded text-[11px] font-bold">
          {score}/100
        </span>
      )}
    </span>
  );
};
