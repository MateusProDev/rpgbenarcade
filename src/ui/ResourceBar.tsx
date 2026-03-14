/**
 * ResourceBar — displays current resources and production rates.
 * Pure presentational component — no game logic.
 */

import type { ResourceStorage, ResourceType } from '../types/resources';

const RESOURCE_ICONS: Record<ResourceType, string> = {
  wood: '🪵',
  stone: '🪨',
  iron: '⚙️',
  food: '🌾',
  gold: '🪙',
};

const RESOURCE_LABELS: Record<ResourceType, string> = {
  wood: 'Madeira',
  stone: 'Pedra',
  iron: 'Ferro',
  food: 'Comida',
  gold: 'Ouro',
};

interface ResourceBarProps {
  resources: ResourceStorage;
}

export function ResourceBar({ resources }: ResourceBarProps) {
  const keys: ResourceType[] = ['wood', 'stone', 'iron', 'food', 'gold'];

  return (
    <div className="flex gap-4 p-2 bg-castle-dark/80 rounded-lg border border-castle-wall/30">
      {keys.map((key) => (
        <div key={key} className="flex items-center gap-1 text-sm">
          <span title={RESOURCE_LABELS[key]}>{RESOURCE_ICONS[key]}</span>
          <span className="text-parchment-100 font-medieval">
            {Math.floor(resources.current[key])}
          </span>
          <span className="text-parchment-400 text-xs">
            +{resources.production[key]}/h
          </span>
        </div>
      ))}
    </div>
  );
}
