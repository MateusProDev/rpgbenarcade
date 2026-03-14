/** Building definitions — data-driven configuration */

import type { BuildingDefinition } from '../../types/buildings';

export const BUILDING_DEFINITIONS: Record<string, BuildingDefinition> = {
  castle: {
    type: 'castle',
    name: 'Castelo',
    description: 'Estrutura principal. Suba de nível para desbloquear novos edifícios.',
    maxLevel: 20,
    modelKey: 'castle',
    levels: [
      { level: 1, cost: { wood: 0, stone: 0, iron: 0, food: 0, gold: 0 }, buildTimeSeconds: 0, requiredCastleLevel: 0 },
      { level: 2, cost: { wood: 200, stone: 200, iron: 50, food: 100, gold: 50 }, buildTimeSeconds: 120, requiredCastleLevel: 1 },
      { level: 3, cost: { wood: 500, stone: 500, iron: 150, food: 250, gold: 120 }, buildTimeSeconds: 300, requiredCastleLevel: 2 },
      { level: 4, cost: { wood: 1200, stone: 1200, iron: 400, food: 600, gold: 300 }, buildTimeSeconds: 600, requiredCastleLevel: 3 },
      { level: 5, cost: { wood: 3000, stone: 3000, iron: 1000, food: 1500, gold: 750 }, buildTimeSeconds: 1200, requiredCastleLevel: 4 },
    ],
  },

  farm: {
    type: 'farm',
    name: 'Fazenda',
    description: 'Produz comida para suas tropas.',
    maxLevel: 10,
    modelKey: 'farm',
    levels: [
      { level: 1, cost: { wood: 100, stone: 50, iron: 0, food: 0, gold: 20 }, buildTimeSeconds: 60, production: { food: 50 }, requiredCastleLevel: 1 },
      { level: 2, cost: { wood: 200, stone: 100, iron: 20, food: 0, gold: 40 }, buildTimeSeconds: 120, production: { food: 110 }, requiredCastleLevel: 1 },
      { level: 3, cost: { wood: 400, stone: 200, iron: 50, food: 0, gold: 80 }, buildTimeSeconds: 240, production: { food: 200 }, requiredCastleLevel: 2 },
    ],
  },

  lumbermill: {
    type: 'lumbermill',
    name: 'Serraria',
    description: 'Produz madeira.',
    maxLevel: 10,
    modelKey: 'house',
    levels: [
      { level: 1, cost: { wood: 50, stone: 80, iron: 10, food: 0, gold: 20 }, buildTimeSeconds: 60, production: { wood: 60 }, requiredCastleLevel: 1 },
      { level: 2, cost: { wood: 100, stone: 160, iron: 30, food: 0, gold: 40 }, buildTimeSeconds: 120, production: { wood: 130 }, requiredCastleLevel: 1 },
      { level: 3, cost: { wood: 250, stone: 350, iron: 70, food: 0, gold: 90 }, buildTimeSeconds: 240, production: { wood: 230 }, requiredCastleLevel: 2 },
    ],
  },

  quarry: {
    type: 'quarry',
    name: 'Pedreira',
    description: 'Produz pedra.',
    maxLevel: 10,
    modelKey: 'house',
    levels: [
      { level: 1, cost: { wood: 80, stone: 50, iron: 10, food: 0, gold: 20 }, buildTimeSeconds: 60, production: { stone: 50 }, requiredCastleLevel: 1 },
      { level: 2, cost: { wood: 160, stone: 100, iron: 30, food: 0, gold: 40 }, buildTimeSeconds: 120, production: { stone: 110 }, requiredCastleLevel: 1 },
    ],
  },

  ironmine: {
    type: 'ironmine',
    name: 'Mina de Ferro',
    description: 'Produz ferro.',
    maxLevel: 10,
    modelKey: 'house',
    levels: [
      { level: 1, cost: { wood: 120, stone: 120, iron: 0, food: 0, gold: 30 }, buildTimeSeconds: 90, production: { iron: 20 }, requiredCastleLevel: 2 },
      { level: 2, cost: { wood: 250, stone: 250, iron: 50, food: 0, gold: 60 }, buildTimeSeconds: 180, production: { iron: 45 }, requiredCastleLevel: 2 },
    ],
  },

  barracks: {
    type: 'barracks',
    name: 'Quartel',
    description: 'Treina tropas de infantaria.',
    maxLevel: 10,
    modelKey: 'barracks',
    levels: [
      { level: 1, cost: { wood: 200, stone: 150, iron: 50, food: 0, gold: 50 }, buildTimeSeconds: 120, requiredCastleLevel: 2 },
      { level: 2, cost: { wood: 400, stone: 300, iron: 120, food: 0, gold: 100 }, buildTimeSeconds: 240, requiredCastleLevel: 3 },
    ],
  },

  stable: {
    type: 'stable',
    name: 'Estábulo',
    description: 'Treina cavalaria.',
    maxLevel: 10,
    modelKey: 'house',
    levels: [
      { level: 1, cost: { wood: 300, stone: 250, iron: 100, food: 100, gold: 80 }, buildTimeSeconds: 180, requiredCastleLevel: 3 },
    ],
  },

  warehouse: {
    type: 'warehouse',
    name: 'Armazém',
    description: 'Aumenta a capacidade de armazenamento de recursos.',
    maxLevel: 10,
    modelKey: 'house',
    levels: [
      { level: 1, cost: { wood: 150, stone: 100, iron: 20, food: 0, gold: 30 }, buildTimeSeconds: 90, storageBonus: { wood: 2000, stone: 2000, iron: 1000, food: 2000, gold: 1000 }, requiredCastleLevel: 1 },
      { level: 2, cost: { wood: 300, stone: 200, iron: 50, food: 0, gold: 60 }, buildTimeSeconds: 180, storageBonus: { wood: 5000, stone: 5000, iron: 2500, food: 5000, gold: 2500 }, requiredCastleLevel: 2 },
    ],
  },

  wall: {
    type: 'wall',
    name: 'Muralha',
    description: 'Aumenta a defesa da cidade.',
    maxLevel: 10,
    modelKey: 'house',
    levels: [
      { level: 1, cost: { wood: 100, stone: 300, iron: 50, food: 0, gold: 50 }, buildTimeSeconds: 150, requiredCastleLevel: 2 },
      { level: 2, cost: { wood: 200, stone: 600, iron: 120, food: 0, gold: 100 }, buildTimeSeconds: 300, requiredCastleLevel: 3 },
    ],
  },

  market: {
    type: 'market',
    name: 'Mercado',
    description: 'Permite trocar recursos com outros jogadores.',
    maxLevel: 5,
    modelKey: 'house',
    levels: [
      { level: 1, cost: { wood: 200, stone: 200, iron: 50, food: 0, gold: 100 }, buildTimeSeconds: 120, requiredCastleLevel: 3 },
    ],
  },
};
