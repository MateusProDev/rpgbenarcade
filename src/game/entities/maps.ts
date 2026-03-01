// ========================
// Map Configurations
// ========================
import type { MapConfig, MapId } from "../../types";

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  village: {
    id: "village",
    name: "Vila de Aldoria",
    width: 2400,
    height: 1800,
    tileSize: 32,
    spawnPoint: { x: 600, y: 500 },
    pvpEnabled: false,
    enemies: [],
    npcs: [
      {
        id: "elder",
        name: "Ancião Theron",
        x: 400,
        y: 300,
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
        x: 900,
        y: 350,
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
        x: 300,
        y: 700,
        dialogue: [
          "Que as estrelas guiem seu caminho.",
          "Posso curar suas feridas... por algumas moedas.",
        ],
      },
      {
        id: "guild_master",
        name: "Mestre da Guilda",
        x: 800,
        y: 750,
        dialogue: [
          "A Guilda dos Aventureiros sempre precisa de membros.",
          "Junte-se a uma guilda para ficar mais forte!",
        ],
      },
    ],
    portals: [
      { x: 2350, y: 800, width: 50, height: 120, targetMap: "fields", targetX: 80, targetY: 600 },
      { x: 1100, y: 0, width: 120, height: 50, targetMap: "forest", targetX: 600, targetY: 1750 },
      { x: 0, y: 600, width: 50, height: 120, targetMap: "arena", targetX: 1050, targetY: 600 },
    ],
  },

  fields: {
    id: "fields",
    name: "Campos de Valorheim",
    width: 3200,
    height: 2400,
    tileSize: 32,
    spawnPoint: { x: 150, y: 600 },
    pvpEnabled: false,
    enemies: [
      { type: "slime", x: 500, y: 400, respawnTime: 10000 },
      { type: "slime", x: 800, y: 600, respawnTime: 10000 },
      { type: "slime", x: 450, y: 900, respawnTime: 10000 },
      { type: "slime", x: 650, y: 350, respawnTime: 10000 },
      { type: "wolf", x: 1200, y: 500, respawnTime: 15000 },
      { type: "wolf", x: 1500, y: 800, respawnTime: 15000 },
      { type: "wolf", x: 1100, y: 1000, respawnTime: 15000 },
      { type: "goblin", x: 1800, y: 400, respawnTime: 15000 },
      { type: "goblin", x: 2100, y: 700, respawnTime: 15000 },
      { type: "goblin", x: 1900, y: 1100, respawnTime: 15000 },
      { type: "bandit", x: 2300, y: 1000, respawnTime: 20000 },
      { type: "bandit", x: 2600, y: 900, respawnTime: 20000 },
      { type: "bandit", x: 2500, y: 1400, respawnTime: 20000 },
      { type: "orc", x: 2800, y: 1600, respawnTime: 25000 },
      { type: "orc", x: 2700, y: 1900, respawnTime: 25000 },
    ],
    npcs: [
      {
        id: "wanderer",
        name: "Viajante Misterioso",
        x: 700, y: 1300,
        dialogue: [
          "Cuidado com os bandidos ao leste...",
          "Eles ficam mais fortes conforme você avança.",
        ],
        questId: "bandit_camp",
      },
    ],
    portals: [
      { x: 0, y: 550, width: 50, height: 120, targetMap: "village", targetX: 2300, targetY: 800 },
      { x: 3150, y: 800, width: 50, height: 120, targetMap: "dungeon", targetX: 80, targetY: 600 },
    ],
  },

  forest: {
    id: "forest",
    name: "Floresta Sombria",
    width: 2800,
    height: 2200,
    tileSize: 32,
    spawnPoint: { x: 600, y: 1750 },
    pvpEnabled: false,
    enemies: [
      { type: "wolf", x: 400, y: 1200, respawnTime: 12000 },
      { type: "wolf", x: 700, y: 900, respawnTime: 12000 },
      { type: "wolf", x: 1000, y: 1300, respawnTime: 12000 },
      { type: "wolf", x: 500, y: 600, respawnTime: 12000 },
      { type: "goblin", x: 1300, y: 700, respawnTime: 14000 },
      { type: "goblin", x: 1600, y: 1000, respawnTime: 14000 },
      { type: "goblin", x: 1400, y: 1400, respawnTime: 14000 },
      { type: "skeleton", x: 1900, y: 600, respawnTime: 16000 },
      { type: "skeleton", x: 2200, y: 900, respawnTime: 16000 },
      { type: "skeleton", x: 2100, y: 500, respawnTime: 16000 },
      { type: "orc", x: 2000, y: 300, respawnTime: 22000 },
      { type: "orc", x: 2400, y: 400, respawnTime: 22000 },
    ],
    npcs: [
      {
        id: "hermit",
        name: "Eremita da Floresta",
        x: 1200,
        y: 500,
        dialogue: [
          "Poucos se aventuram tão fundo na floresta.",
          "As masmorras ao norte escondem grandes tesouros...",
          "...e grandes perigos.",
        ],
        questId: "explore_forest",
      },
    ],
    portals: [
      { x: 550, y: 2150, width: 120, height: 50, targetMap: "village", targetX: 1100, targetY: 80 },
      { x: 2750, y: 300, width: 50, height: 120, targetMap: "dungeon", targetX: 80, targetY: 1200 },
    ],
  },

  dungeon: {
    id: "dungeon",
    name: "Masmorras de Drakthar",
    width: 2400,
    height: 1800,
    tileSize: 32,
    spawnPoint: { x: 150, y: 600 },
    pvpEnabled: false,
    enemies: [
      { type: "skeleton", x: 400, y: 400, respawnTime: 12000 },
      { type: "skeleton", x: 700, y: 700, respawnTime: 12000 },
      { type: "skeleton", x: 500, y: 1000, respawnTime: 12000 },
      { type: "skeleton", x: 600, y: 500, respawnTime: 12000 },
      { type: "orc", x: 1000, y: 600, respawnTime: 18000 },
      { type: "orc", x: 1300, y: 800, respawnTime: 18000 },
      { type: "orc", x: 1100, y: 1100, respawnTime: 18000 },
      { type: "dark_knight", x: 1600, y: 700, respawnTime: 30000 },
      { type: "dark_knight", x: 1900, y: 500, respawnTime: 30000 },
      { type: "dark_knight", x: 1800, y: 1000, respawnTime: 30000 },
      { type: "dragon", x: 2100, y: 1200, respawnTime: 60000 },
    ],
    npcs: [
      {
        id: "ghost",
        name: "Espírito Perdido",
        x: 300,
        y: 900,
        dialogue: [
          "Não vá mais fundo... o dragão espera...",
          "Muitos aventureiros pereceram aqui.",
        ],
        questId: "dark_knight_challenge",
      },
    ],
    portals: [
      { x: 0, y: 550, width: 50, height: 120, targetMap: "fields", targetX: 3100, targetY: 800 },
      { x: 0, y: 1150, width: 50, height: 120, targetMap: "forest", targetX: 2700, targetY: 300 },
    ],
  },

  arena: {
    id: "arena",
    name: "Arena de Sangue",
    width: 1200,
    height: 1200,
    tileSize: 32,
    spawnPoint: { x: 600, y: 1050 },
    pvpEnabled: true,
    enemies: [],
    npcs: [
      {
        id: "arena_master",
        name: "Mestre da Arena",
        x: 600,
        y: 1100,
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
      { x: 1150, y: 500, width: 50, height: 120, targetMap: "village", targetX: 80, targetY: 600 },
    ],
  },
};

export function getMapConfig(mapId: MapId): MapConfig {
  return MAP_CONFIGS[mapId];
}
