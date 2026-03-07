import type { MapTile, TileType } from '../types';

const MAP_SIZE = 50; // 50x50 tiles

/** Gera o mapa de um mundo. Chamado apenas 1x pelo serverless ao criar o mundo. */
export function generateWorldMap(): MapTile[] {
  const tiles: MapTile[] = [];
  const center = MAP_SIZE / 2;

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      const maxDist = center * Math.SQRT2;
      const level = Math.max(1, Math.round(10 - (dist / maxDist) * 9));

      let type: TileType = 'grass';

      // Castelo central
      if (x === center && y === center) {
        type = 'castle_central';
      }
      // 4 bases estratégicas
      else if (
        (x === 10 && y === 10) ||
        (x === 40 && y === 10) ||
        (x === 10 && y === 40) ||
        (x === 40 && y === 40)
      ) {
        type = 'base';
      }
      // Recursos aleatórios mas distribuídos
      else if (Math.random() < 0.12) {
        type = 'resource';
      }
      // Terreno variado
      else if (Math.random() < 0.08) {
        type = 'forest';
      } else if (Math.random() < 0.05) {
        type = 'mountain';
      } else if (Math.random() < 0.03 && dist > center * 0.3) {
        type = 'water';
      }

      tiles.push({
        x, y, type,
        level,
        ownerId: null,
        resourceType: type === 'resource'
          ? (['food', 'wood', 'stone', 'iron'] as const)[Math.floor(Math.random() * 4)]
          : undefined,
        resourceAmount: type === 'resource' ? level * 500 : 0,
      });
    }
  }

  return tiles;
}

/** Encontra uma posição livre no mapa para novo castelo */
export function findSpawnPosition(
  occupied: Array<{ x: number; y: number }>,
  mapSize = MAP_SIZE,
): { x: number; y: number } {
  const occupiedSet = new Set(occupied.map((p) => `${p.x},${p.y}`));
  const center = mapSize / 2;

  for (let attempt = 0; attempt < 500; attempt++) {
    const x = Math.floor(Math.random() * mapSize);
    const y = Math.floor(Math.random() * mapSize);

    // Longe do centro (castelo central) e de outras bases
    const distCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
    if (distCenter < 5) continue;
    if (occupiedSet.has(`${x},${y}`)) continue;

    return { x, y };
  }

  // Fallback
  return { x: Math.floor(Math.random() * mapSize), y: Math.floor(Math.random() * mapSize) };
}

export { MAP_SIZE };
