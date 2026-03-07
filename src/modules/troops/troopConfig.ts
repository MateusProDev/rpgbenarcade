import type { TroopConfig, TroopType } from '../../types';

export const TROOPS: Record<TroopType, TroopConfig> = {
  infantry: {
    name:      'Infantaria',
    attack:    40,
    hp:        200,
    speed:     1.0,
    cost:      { food: 50, wood: 30,  stone: 0,  iron: 20  },
    trainTime: 30,
  },
  archer: {
    name:      'Arqueiro',
    attack:    60,
    hp:        120,
    speed:     0.8,
    cost:      { food: 40, wood: 80,  stone: 0,  iron: 10  },
    trainTime: 45,
  },
  cavalry: {
    name:      'Cavalaria',
    attack:    90,
    hp:        300,
    speed:     2.0,
    cost:      { food: 100, wood: 60, stone: 0,  iron: 80  },
    trainTime: 120,
  },
};

/** Retorna o tempo total de viagem em ms dado distância em tiles e tipo de tropa mais lenta */
export function marchDuration(
  troops: Partial<Record<TroopType, number>>,
  distanceTiles: number,
): number {
  const types = Object.keys(troops) as TroopType[];
  if (types.length === 0) return 0;
  const minSpeed = Math.min(...types.map((t) => TROOPS[t].speed));
  // Base: 10 segundo por tile com speed 1.0
  return Math.floor((distanceTiles * 10_000) / minSpeed);
}
