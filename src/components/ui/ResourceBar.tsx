import React from 'react';
import type { Resources } from '../../types';

const ICONS: Record<keyof Resources, string> = {
  food:  '🌾',
  wood:  '🪵',
  stone: '🪨',
  iron:  '⚙️',
};

interface ResourceBarProps {
  resources: Resources;
  compact?: boolean;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.floor(n));
}

export const ResourceBar: React.FC<ResourceBarProps> = ({ resources, compact = false }) => (
  <div className={`flex items-center gap-${compact ? '3' : '5'} flex-wrap`}>
    {(Object.keys(ICONS) as (keyof Resources)[]).map((res) => (
      <div key={res} className="flex items-center gap-1">
        <span className={compact ? 'text-sm' : 'text-base'}>{ICONS[res]}</span>
        <span className={`text-parchment-200 font-bold ${compact ? 'text-xs' : 'text-sm'}`}>
          {fmt(resources[res])}
        </span>
      </div>
    ))}
  </div>
);
