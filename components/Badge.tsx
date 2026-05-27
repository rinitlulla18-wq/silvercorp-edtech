import React from 'react';

export type BadgeColor = 'blue' | 'red' | 'green' | 'yellow' | 'gray' | 'purple' | 'indigo' | 'orange' | 'teal' | 'lime' | 'emerald' | 'cyan' | 'pink';

interface BadgeProps {
  text: string;
  color: BadgeColor;
}

export const Badge: React.FC<BadgeProps> = ({ text, color }) => {
  const colorClasses: Record<BadgeColor, string> = {
    blue: 'bg-blue-900/30 text-blue-400 border border-blue-800/50',
    red: 'bg-red-900/30 text-red-400 border border-red-800/50',
    green: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50',
    yellow: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50',
    gray: 'bg-slate-800 text-slate-400 border border-slate-700',
    purple: 'bg-purple-900/30 text-purple-400 border border-purple-800/50',
    indigo: 'bg-indigo-900/30 text-indigo-400 border border-indigo-800/50',
    orange: 'bg-orange-900/30 text-orange-400 border border-orange-800/50',
    teal: 'bg-teal-900/30 text-teal-400 border border-teal-800/50',
    lime: 'bg-lime-900/30 text-lime-400 border border-lime-800/50',
    emerald: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50',
    cyan: 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50',
    pink: 'bg-pink-900/30 text-pink-400 border border-pink-800/50',
  };

  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${colorClasses[color] || colorClasses.gray}`}>
      {text}
    </span>
  );
};