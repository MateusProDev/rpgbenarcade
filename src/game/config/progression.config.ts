/** Castle progression — what each castle level unlocks */

export interface CastleLevelUnlock {
  level: number;
  unlockedBuildings: string[];
  maxBuildingSlots: number;
  description: string;
}

export const CASTLE_PROGRESSION: CastleLevelUnlock[] = [
  { level: 1, unlockedBuildings: ['farm', 'lumbermill', 'quarry', 'warehouse'], maxBuildingSlots: 5, description: 'Início: edifícios básicos de recursos.' },
  { level: 2, unlockedBuildings: ['ironmine', 'barracks', 'wall'], maxBuildingSlots: 8, description: 'Mineração e treinamento militar básico.' },
  { level: 3, unlockedBuildings: ['stable', 'market'], maxBuildingSlots: 12, description: 'Cavalaria e comércio.' },
  { level: 4, unlockedBuildings: ['tower'], maxBuildingSlots: 15, description: 'Torres de defesa avançadas.' },
  { level: 5, unlockedBuildings: [], maxBuildingSlots: 20, description: 'Capacidade máxima de construções.' },
];

/** Returns the progression data for a given castle level */
export function getProgressionForLevel(level: number): CastleLevelUnlock | undefined {
  return CASTLE_PROGRESSION.find((p) => p.level === level);
}

/** Returns all building types unlocked up to and including the given castle level */
export function getUnlockedBuildings(castleLevel: number): string[] {
  const unlocked = new Set<string>();
  for (const entry of CASTLE_PROGRESSION) {
    if (entry.level > castleLevel) break;
    for (const b of entry.unlockedBuildings) unlocked.add(b);
  }
  return [...unlocked];
}
