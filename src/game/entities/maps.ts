// ========================
// Map Configurations
// ========================
import type { MapConfig, MapId } from "../../types";

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  village: {
    id: "village",
    name: "Vila de Aldoria",
    width: 1600,
    height: 1200,
    tileSize: 32,
    spawnPoint: { x: 400, y: 300 },
    pvpEnabled: false,
    enemies: [],
    npcs: [
      {
        id: "elder",
        name: "Ancião Theron",
        x: 300,
        y: 200,
        dialogue: [
          "Bem-vindo a Aldoria, jovem aventureiro.",
          "Estas terras estão em perigo...",
          "Criaturas sombrias emergiram das masmorras.",
          "Precisamos de heróis como você!",
        ],
        questId: "first_blood",
      },
      {
        id: "blacksmith",
        name: "Ferreiro Baldur",
        x: 600,
        y: 250,
        dialogue: [
          "Ho ho! Precisa de equipamentos?",
          "Trago as melhores armas de Aldoria!",
          "Confira minha loja.",
        ],
        shopItems: [
          "rusty_sword",
          "wooden_bow",
          "apprentice_staff",
          "iron_lance",
          "cloth_armor",
          "iron_helm",
          "leather_boots",
          "health_potion",
          "mana_potion",
        ],
      },
      {
        id: "healer",
        name: "Curandeira Lyra",
        x: 200,
        y: 400,
        dialogue: [
          "Que as estrelas guiem seu caminho.",
          "Posso curar suas feridas... por algumas moedas.",
        ],
      },
      {
        id: "guild_master",
        name: "Mestre da Guilda",
        x: 500,
        y: 450,
        dialogue: [
          "A Guilda dos Aventureiros sempre precisa de membros.",
          "Junte-se a uma guilda para ficar mais forte!",
        ],
      },
    ],
    portals: [
      { x: 1550, y: 600, width: 50, height: 100, targetMap: "fields", targetX: 50, targetY: 400 },
      { x: 800, y: 0, width: 100, height: 50, targetMap: "forest", targetX: 400, targetY: 1150 },
      { x: 0, y: 400, width: 50, height: 100, targetMap: "arena", targetX: 750, targetY: 400 },
    ],
  },

  fields: {
    id: "fields",
    name: "Campos de Valorheim",
    width: 2000,
    height: 1500,
    tileSize: 32,
    spawnPoint: { x: 100, y: 400 },
    pvpEnabled: false,
    enemies: [
      { type: "slime", x: 400, y: 300, respawnTime: 10000 },
      { type: "slime", x: 600, y: 500, respawnTime: 10000 },
      { type: "slime", x: 350, y: 700, respawnTime: 10000 },
      { type: "wolf", x: 900, y: 400, respawnTime: 15000 },
      { type: "wolf", x: 1100, y: 600, respawnTime: 15000 },
      { type: "goblin", x: 1300, y: 300, respawnTime: 15000 },
      { type: "goblin", x: 1500, y: 500, respawnTime: 15000 },
      { type: "bandit", x: 1600, y: 800, respawnTime: 20000 },
      { type: "bandit", x: 1800, y: 700, respawnTime: 20000 },
      { type: "orc", x: 1700, y: 1100, respawnTime: 25000 },
    ],
    npcs: [
      {
        id: "wanderer",
        name: "Viajante Misterioso",
        x: 500, y: 900,
        dialogue: [
          "Cuidado com os bandidos ao leste...",
          "Eles ficam mais fortes conforme você avança.",
        ],
        questId: "bandit_camp",
      },
    ],
    portals: [
      { x: 0, y: 350, width: 50, height: 100, targetMap: "village", targetX: 1500, targetY: 600 },
      { x: 1950, y: 600, width: 50, height: 100, targetMap: "dungeon", targetX: 50, targetY: 400 },
    ],
  },

  forest: {
    id: "forest",
    name: "Floresta Sombria",
    width: 1800,
    height: 1400,
    tileSize: 32,
    spawnPoint: { x: 400, y: 1150 },
    pvpEnabled: false,
    enemies: [
      { type: "wolf", x: 300, y: 800, respawnTime: 12000 },
      { type: "wolf", x: 500, y: 600, respawnTime: 12000 },
      { type: "wolf", x: 700, y: 900, respawnTime: 12000 },
      { type: "goblin", x: 900, y: 500, respawnTime: 14000 },
      { type: "goblin", x: 1100, y: 700, respawnTime: 14000 },
      { type: "skeleton", x: 1300, y: 400, respawnTime: 16000 },
      { type: "skeleton", x: 1500, y: 600, respawnTime: 16000 },
      { type: "orc", x: 1200, y: 200, respawnTime: 22000 },
    ],
    npcs: [
      {
        id: "hermit",
        name: "Eremita da Floresta",
        x: 800,
        y: 300,
        dialogue: [
          "Poucos se aventuram tão fundo na floresta.",
          "As masmorras ao norte escondem grandes tesouros...",
          "...e grandes perigos.",
        ],
        questId: "explore_forest",
      },
    ],
    portals: [
      { x: 350, y: 1350, width: 100, height: 50, targetMap: "village", targetX: 800, targetY: 50 },
      { x: 1750, y: 200, width: 50, height: 100, targetMap: "dungeon", targetX: 50, targetY: 800 },
    ],
  },

  dungeon: {
    id: "dungeon",
    name: "Masmorras de Drakthar",
    width: 1600,
    height: 1200,
    tileSize: 32,
    spawnPoint: { x: 100, y: 400 },
    pvpEnabled: false,
    enemies: [
      { type: "skeleton", x: 300, y: 300, respawnTime: 12000 },
      { type: "skeleton", x: 500, y: 500, respawnTime: 12000 },
      { type: "skeleton", x: 400, y: 700, respawnTime: 12000 },
      { type: "orc", x: 700, y: 400, respawnTime: 18000 },
      { type: "orc", x: 900, y: 600, respawnTime: 18000 },
      { type: "dark_knight", x: 1100, y: 500, respawnTime: 30000 },
      { type: "dark_knight", x: 1300, y: 300, respawnTime: 30000 },
      { type: "dragon", x: 1400, y: 800, respawnTime: 60000 },
    ],
    npcs: [
      {
        id: "ghost",
        name: "Espírito Perdido",
        x: 200,
        y: 600,
        dialogue: [
          "Não vá mais fundo... o dragão espera...",
          "Muitos aventureiros pereceram aqui.",
        ],
        questId: "dark_knight_challenge",
      },
    ],
    portals: [
      { x: 0, y: 350, width: 50, height: 100, targetMap: "fields", targetX: 1900, targetY: 600 },
      { x: 0, y: 750, width: 50, height: 100, targetMap: "forest", targetX: 1700, targetY: 200 },
    ],
  },

  arena: {
    id: "arena",
    name: "Arena de Sangue",
    width: 800,
    height: 800,
    tileSize: 32,
    spawnPoint: { x: 400, y: 700 },
    pvpEnabled: true,
    enemies: [],
    npcs: [
      {
        id: "arena_master",
        name: "Mestre da Arena",
        x: 400,
        y: 750,
        dialogue: [
          "Bem-vindo à Arena de Sangue!",
          "Aqui, os guerreiros provam seu valor.",
          "PvP é permitido dentro destes muros.",
          "Que o melhor vença!",
        ],
        questId: "arena_champion",
      },
    ],
    portals: [
      { x: 750, y: 350, width: 50, height: 100, targetMap: "village", targetX: 50, targetY: 400 },
    ],
  },
};

export function getMapConfig(mapId: MapId): MapConfig {
  return MAP_CONFIGS[mapId];
}
