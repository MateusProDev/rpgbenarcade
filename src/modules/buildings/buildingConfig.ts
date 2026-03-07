import type { BuildingConfig, BuildingType, Resources } from '../../types';

function scaleCost(base: Resources, factor: number): Resources {
  return {
    food:  Math.floor(base.food  * factor),
    wood:  Math.floor(base.wood  * factor),
    stone: Math.floor(base.stone * factor),
    iron:  Math.floor(base.iron  * factor),
  };
}

// Tempo de construção: nível 1→2 = 60s, cresce 2.5x por nível
export function buildTime(level: number): number {
  return Math.floor(60 * Math.pow(2.5, level - 1));
}

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  sawmill: {
    name:        'Serraria',
    description: 'Produz madeira por hora.',
    icon:        'sawmill',
    maxLevel:    20,
    costPerLevel: (l) => scaleCost({ food: 0, wood: 100, stone: 50, iron: 20 }, Math.pow(1.6, l - 1)),
    timePerLevel: buildTime,
    productionPerLevel: (l) => ({ wood: 20 * l }),
  },
  quarry: {
    name:        'Pedreira',
    description: 'Produz pedra por hora.',
    icon:        'quarry',
    maxLevel:    20,
    costPerLevel: (l) => scaleCost({ food: 0, wood: 80, stone: 120, iron: 20 }, Math.pow(1.6, l - 1)),
    timePerLevel: buildTime,
    productionPerLevel: (l) => ({ stone: 20 * l }),
  },
  ironMine: {
    name:        'Mina de Ferro',
    description: 'Produz ferro por hora.',
    icon:        'ironMine',
    maxLevel:    20,
    costPerLevel: (l) => scaleCost({ food: 0, wood: 60, stone: 80, iron: 150 }, Math.pow(1.6, l - 1)),
    timePerLevel: buildTime,
    productionPerLevel: (l) => ({ iron: 15 * l }),
  },
  farm: {
    name:        'Fazenda',
    description: 'Produz comida por hora.',
    icon:        'farm',
    maxLevel:    20,
    costPerLevel: (l) => scaleCost({ food: 50, wood: 80, stone: 30, iron: 10 }, Math.pow(1.6, l - 1)),
    timePerLevel: buildTime,
    productionPerLevel: (l) => ({ food: 30 * l }),
  },
  barracks: {
    name:        'Quartel',
    description: 'Treina tropas de combate.',
    icon:        'barracks',
    maxLevel:    20,
    costPerLevel: (l) => scaleCost({ food: 100, wood: 200, stone: 150, iron: 80 }, Math.pow(1.8, l - 1)),
    timePerLevel: buildTime,
  },
  academy: {
    name:        'Academia',
    description: 'Pesquisa melhorias e desbloqueia tropas.',
    icon:        'academy',
    maxLevel:    20,
    costPerLevel: (l) => scaleCost({ food: 80, wood: 150, stone: 200, iron: 100 }, Math.pow(1.8, l - 1)),
    timePerLevel: buildTime,
  },
  warehouse: {
    name:        'Armazém',
    description: 'Aumenta a capacidade de armazenamento.',
    icon:        'warehouse',
    maxLevel:    20,
    costPerLevel: (l) => scaleCost({ food: 60, wood: 100, stone: 200, iron: 50 }, Math.pow(1.5, l - 1)),
    timePerLevel: buildTime,
    productionPerLevel: (l) => ({
      food:  1000 * l,
      wood:  1000 * l,
      stone: 1000 * l,
      iron:  1000 * l,
    }),
  },
};

// Requisitos do castelo por nível
export const CASTLE_REQUIREMENTS: Record<number, {
  buildings: Partial<Record<BuildingType, number>>;
  resources: Resources;
  time: number;
}> = {
  2:  { buildings: { sawmill: 2, academy: 2 },             resources: { food: 500,  wood: 800,   stone: 400,  iron: 200  }, time: 300   },
  3:  { buildings: { sawmill: 3, quarry: 2, academy: 3 },  resources: { food: 1200, wood: 2000,  stone: 1500, iron: 800  }, time: 900   },
  4:  { buildings: { farm: 3, ironMine: 2, barracks: 2 },  resources: { food: 3000, wood: 4000,  stone: 3000, iron: 2000 }, time: 2700  },
  5:  { buildings: { barracks: 5, academy: 5 },            resources: { food: 8000, wood: 10000, stone: 8000, iron: 5000 }, time: 7200  },
};

export function canUpgradeBuilding(
  currentResources: Resources,
  buildingType: BuildingType,
  currentLevel: number,
): { canUpgrade: boolean; reason?: string } {
  const config = BUILDINGS[buildingType];
  if (currentLevel >= config.maxLevel) return { canUpgrade: false, reason: 'Nível máximo atingido' };

  const cost = config.costPerLevel(currentLevel + 1);
  const missing = (Object.keys(cost) as (keyof Resources)[]).filter(
    (r) => currentResources[r] < cost[r],
  );

  if (missing.length > 0) {
    return { canUpgrade: false, reason: `Recursos insuficientes: ${missing.join(', ')}` };
  }
  return { canUpgrade: true };
}
