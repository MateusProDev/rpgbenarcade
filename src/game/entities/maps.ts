// ========================
// Map Configurations (3x expanded)
// ========================
import type { MapConfig, MapId } from "../../types";

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  village: {
    id: "village",
    name: "Vila de Aldoria",
    width: 14400,
    height: 10800,
    tileSize: 32,
    spawnPoint: { x: 3600, y: 3000 },
    pvpEnabled: false,
    enemies: [],
    npcs: [
      {
        id: "elder",
        name: "Ancião Theron",
        x: 2400,
        y: 1800,
        dialogue: [
          "Bem-vindo a Aldoria, jovem aventureiro.",
          "Estas terras estão em perigo...",
          "Criaturas sombrias emergiram das masmorras.",
          "Precisamos de heróis como você!",
          "Vá aos Campos de Valorheim pelo portão leste para começar seu treinamento.",
        ],
        questId: "first_blood",
      },
      {
        id: "blacksmith",
        name: "Ferreiro Baldur",
        x: 5400,
        y: 2100,
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
        x: 1800,
        y: 4200,
        dialogue: [
          "Que as estrelas guiem seu caminho.",
          "Posso curar suas feridas... por algumas moedas.",
        ],
      },
      {
        id: "guild_master",
        name: "Mestre da Guilda",
        x: 4800,
        y: 4500,
        dialogue: [
          "A Guilda dos Aventureiros sempre precisa de membros.",
          "Junte-se a uma guilda para ficar mais forte!",
        ],
      },
      {
        id: "guard_captain",
        name: "Capitão da Guarda",
        x: 9600,
        y: 2400,
        dialogue: [
          "Mantenha-se alerta, aventureiro.",
          "Relatos de ataques nos campos estão aumentando.",
          "Se você é corajoso, ajude a patrulhar as fronteiras.",
        ],
        questId: "guard_patrol",
      },
      {
        id: "librarian",
        name: "Bibliotecária Iris",
        x: 10800,
        y: 7200,
        dialogue: [
          "O conhecimento é a arma mais poderosa.",
          "Nestes livros encontrará segredos antigos sobre as masmorras.",
        ],
      },
      {
        id: "farmer",
        name: "Fazendeiro Tomás",
        x: 7200,
        y: 8400,
        dialogue: [
          "Malditos slimes estão destruindo minhas plantações!",
          "Se puder eliminá-los nos campos, ficarei grato!",
        ],
        questId: "slime_hunt",
      },
    ],
    portals: [
      { x: 14350, y: 4800, width: 50, height: 120, targetMap: "fields", targetX: 240, targetY: 3600 },
      { x: 6600, y: 0, width: 120, height: 50, targetMap: "forest", targetX: 3600, targetY: 10500 },
      { x: 0, y: 3600, width: 50, height: 120, targetMap: "arena", targetX: 6300, targetY: 3600 },
    ],
  },

  fields: {
    id: "fields",
    name: "Campos de Valorheim",
    width: 19200,
    height: 14400,
    tileSize: 32,
    spawnPoint: { x: 450, y: 3600 },
    pvpEnabled: false,
    enemies: [
      // Slime valley (west)
      { type: "slime", x: 1800, y: 1800, respawnTime: 10000 },
      { type: "slime", x: 2700, y: 2400, respawnTime: 10000 },
      { type: "slime", x: 1500, y: 3000, respawnTime: 10000 },
      { type: "slime", x: 2250, y: 1500, respawnTime: 10000 },
      { type: "slime", x: 1200, y: 4200, respawnTime: 10000 },
      { type: "slime", x: 2400, y: 4500, respawnTime: 10000 },
      { type: "slime", x: 1800, y: 5400, respawnTime: 10000 },
      // Wolf territory (central west)
      { type: "wolf", x: 4800, y: 2400, respawnTime: 15000 },
      { type: "wolf", x: 6000, y: 3000, respawnTime: 15000 },
      { type: "wolf", x: 5400, y: 4200, respawnTime: 15000 },
      { type: "wolf", x: 4500, y: 4800, respawnTime: 15000 },
      { type: "wolf", x: 6600, y: 1800, respawnTime: 15000 },
      // Goblin camp (center)
      { type: "goblin", x: 8400, y: 3600, respawnTime: 15000 },
      { type: "goblin", x: 9600, y: 3000, respawnTime: 15000 },
      { type: "goblin", x: 9000, y: 4500, respawnTime: 15000 },
      { type: "goblin", x: 10200, y: 4200, respawnTime: 15000 },
      { type: "goblin", x: 7800, y: 4800, respawnTime: 15000 },
      // Bandit stronghold (east)
      { type: "bandit", x: 12600, y: 3600, respawnTime: 20000 },
      { type: "bandit", x: 13500, y: 3000, respawnTime: 20000 },
      { type: "bandit", x: 14400, y: 4200, respawnTime: 20000 },
      { type: "bandit", x: 13800, y: 5400, respawnTime: 20000 },
      { type: "bandit", x: 12900, y: 6000, respawnTime: 20000 },
      // Orc frontier (far east)
      { type: "orc", x: 16200, y: 4800, respawnTime: 25000 },
      { type: "orc", x: 16800, y: 6000, respawnTime: 25000 },
      { type: "orc", x: 15600, y: 7200, respawnTime: 25000 },
      { type: "orc", x: 17400, y: 8400, respawnTime: 25000 },
      // Southern slimes & wolves
      { type: "slime", x: 3000, y: 9600, respawnTime: 10000 },
      { type: "slime", x: 4200, y: 10800, respawnTime: 10000 },
      { type: "wolf", x: 6000, y: 9000, respawnTime: 15000 },
      { type: "wolf", x: 7200, y: 10200, respawnTime: 15000 },
      { type: "goblin", x: 9000, y: 9600, respawnTime: 15000 },
      { type: "goblin", x: 10800, y: 10800, respawnTime: 15000 },
      { type: "bandit", x: 12600, y: 9000, respawnTime: 20000 },
      { type: "bandit", x: 14400, y: 10200, respawnTime: 20000 },
      { type: "orc", x: 16200, y: 10800, respawnTime: 25000 },
    ],
    npcs: [
      {
        id: "wanderer",
        name: "Viajante Misterioso",
        x: 4200, y: 7800,
        dialogue: [
          "Cuidado com os bandidos ao leste...",
          "Eles ficam mais fortes conforme você avança.",
          "Ouvi dizer que existe um acampamento goblin ao norte.",
        ],
        questId: "bandit_camp",
      },
      {
        id: "merchant",
        name: "Mercador Ambulante",
        x: 7200, y: 2400,
        dialogue: [
          "Compre provisões antes de seguir viagem!",
          "Os campos são traiçoeiros à noite.",
        ],
        shopItems: ["health_potion", "mana_potion"],
      },
      {
        id: "scout",
        name: "Batedor Real",
        x: 12000, y: 1800,
        dialogue: [
          "Um grande exército Orc se forma nas fronteiras...",
          "Precisamos de guerreiros para defender Valorheim!",
        ],
        questId: "orc_invasion",
      },
    ],
    portals: [
      { x: 0, y: 3300, width: 50, height: 120, targetMap: "village", targetX: 14100, targetY: 4800 },
      { x: 19150, y: 4800, width: 50, height: 120, targetMap: "dungeon", targetX: 240, targetY: 3600 },
    ],
  },

  forest: {
    id: "forest",
    name: "Floresta Sombria",
    width: 16800,
    height: 13200,
    tileSize: 32,
    spawnPoint: { x: 3600, y: 10500 },
    pvpEnabled: false,
    enemies: [
      // Outer forest (wolves)
      { type: "wolf", x: 1800, y: 8400, respawnTime: 12000 },
      { type: "wolf", x: 3000, y: 7200, respawnTime: 12000 },
      { type: "wolf", x: 4200, y: 7800, respawnTime: 12000 },
      { type: "wolf", x: 2400, y: 4800, respawnTime: 12000 },
      { type: "wolf", x: 4800, y: 6000, respawnTime: 12000 },
      { type: "wolf", x: 1200, y: 9600, respawnTime: 12000 },
      // Goblin camps (mid forest)
      { type: "goblin", x: 6600, y: 5400, respawnTime: 14000 },
      { type: "goblin", x: 7800, y: 6600, respawnTime: 14000 },
      { type: "goblin", x: 7200, y: 4200, respawnTime: 14000 },
      { type: "goblin", x: 6000, y: 7800, respawnTime: 14000 },
      { type: "goblin", x: 8400, y: 4800, respawnTime: 14000 },
      // Skeleton ruins (deep)
      { type: "skeleton", x: 10800, y: 3600, respawnTime: 16000 },
      { type: "skeleton", x: 12000, y: 4800, respawnTime: 16000 },
      { type: "skeleton", x: 11400, y: 2400, respawnTime: 16000 },
      { type: "skeleton", x: 12600, y: 3000, respawnTime: 16000 },
      { type: "skeleton", x: 10200, y: 6000, respawnTime: 16000 },
      // Orc stronghold (far north)
      { type: "orc", x: 13200, y: 1800, respawnTime: 22000 },
      { type: "orc", x: 14400, y: 2400, respawnTime: 22000 },
      { type: "orc", x: 13800, y: 3600, respawnTime: 22000 },
      { type: "orc", x: 15000, y: 1200, respawnTime: 22000 },
      // Scattered deep creatures
      { type: "wolf", x: 9000, y: 9600, respawnTime: 12000 },
      { type: "goblin", x: 10800, y: 9000, respawnTime: 14000 },
      { type: "skeleton", x: 12600, y: 8400, respawnTime: 16000 },
    ],
    npcs: [
      {
        id: "hermit",
        name: "Eremita da Floresta",
        x: 7200,
        y: 3000,
        dialogue: [
          "Poucos se aventuram tão fundo na floresta.",
          "As masmorras ao norte escondem grandes tesouros...",
          "...e grandes perigos.",
          "Há ruínas antigas espalhadas entre estas árvores.",
        ],
        questId: "explore_forest",
      },
      {
        id: "druid",
        name: "Druida Ancião",
        x: 5400,
        y: 7200,
        dialogue: [
          "A floresta está doente... uma energia sombria a corrompe.",
          "Purifique os cristais corrompidos para restaurar o equilíbrio.",
        ],
        questId: "purify_forest",
      },
      {
        id: "ranger",
        name: "Vigília do Bosque",
        x: 9600,
        y: 7200,
        dialogue: [
          "Esqueletos estão emergindo das ruínas antigas!",
          "Temo que algo terrível despertou nas profundezas.",
        ],
      },
    ],
    portals: [
      { x: 3300, y: 13150, width: 120, height: 50, targetMap: "village", targetX: 6600, targetY: 240 },
      { x: 16750, y: 1800, width: 50, height: 120, targetMap: "dungeon", targetX: 240, targetY: 7200 },
    ],
  },

  dungeon: {
    id: "dungeon",
    name: "Masmorras de Drakthar",
    width: 14400,
    height: 10800,
    tileSize: 32,
    spawnPoint: { x: 450, y: 3600 },
    pvpEnabled: false,
    enemies: [
      // Entry hall (skeletons)
      { type: "skeleton", x: 1800, y: 2400, respawnTime: 12000 },
      { type: "skeleton", x: 2400, y: 3000, respawnTime: 12000 },
      { type: "skeleton", x: 1500, y: 4200, respawnTime: 12000 },
      { type: "skeleton", x: 2100, y: 4800, respawnTime: 12000 },
      { type: "skeleton", x: 2700, y: 1800, respawnTime: 12000 },
      // Mid dungeon (orcs)
      { type: "orc", x: 4800, y: 3000, respawnTime: 18000 },
      { type: "orc", x: 5400, y: 4200, respawnTime: 18000 },
      { type: "orc", x: 6000, y: 2400, respawnTime: 18000 },
      { type: "orc", x: 4200, y: 4800, respawnTime: 18000 },
      { type: "orc", x: 6600, y: 3600, respawnTime: 18000 },
      // Deep dungeon (dark knights)
      { type: "dark_knight", x: 8400, y: 3000, respawnTime: 30000 },
      { type: "dark_knight", x: 9600, y: 4200, respawnTime: 30000 },
      { type: "dark_knight", x: 9000, y: 5400, respawnTime: 30000 },
      { type: "dark_knight", x: 10200, y: 2400, respawnTime: 30000 },
      { type: "dark_knight", x: 10800, y: 4800, respawnTime: 30000 },
      // Boss chamber
      { type: "dragon", x: 12600, y: 5400, respawnTime: 60000 },
      // Scattered reinforcements
      { type: "skeleton", x: 3600, y: 7200, respawnTime: 12000 },
      { type: "skeleton", x: 1800, y: 8400, respawnTime: 12000 },
      { type: "orc", x: 7200, y: 7800, respawnTime: 18000 },
      { type: "orc", x: 8400, y: 8400, respawnTime: 18000 },
      { type: "dark_knight", x: 10800, y: 7800, respawnTime: 30000 },
    ],
    npcs: [
      {
        id: "ghost",
        name: "Espírito Perdido",
        x: 1800,
        y: 5400,
        dialogue: [
          "Não vá mais fundo... o dragão espera...",
          "Muitos aventureiros pereceram aqui.",
          "Se insistir, prepare-se nos corredores antes da câmara sul.",
        ],
        questId: "dark_knight_challenge",
      },
      {
        id: "prisoner",
        name: "Prisioneiro Libertado",
        x: 5400,
        y: 6600,
        dialogue: [
          "Obrigado por me encontrar!",
          "Os cavaleiros negros guardam chaves para os baús do tesouro.",
          "Há um segredo por trás do trono do dragão...",
        ],
      },
    ],
    portals: [
      { x: 0, y: 3300, width: 50, height: 120, targetMap: "fields", targetX: 18900, targetY: 4800 },
      { x: 0, y: 6900, width: 50, height: 120, targetMap: "forest", targetX: 16500, targetY: 1800 },
    ],
  },

  arena: {
    id: "arena",
    name: "Arena de Sangue",
    width: 7200,
    height: 7200,
    tileSize: 32,
    spawnPoint: { x: 3600, y: 6300 },
    pvpEnabled: true,
    enemies: [],
    npcs: [
      {
        id: "arena_master",
        name: "Mestre da Arena",
        x: 3600,
        y: 6600,
        dialogue: [
          "Bem-vindo à Arena de Sangue!",
          "Aqui, os guerreiros provam seu valor.",
          "PvP é permitido dentro destes muros.",
          "Que o melhor vença!",
        ],
        questId: "arena_champion",
      },
      {
        id: "arena_vendor",
        name: "Vendedor de Espólios",
        x: 1200,
        y: 6000,
        dialogue: [
          "Equipamentos forjados no calor da batalha!",
          "Só os melhores itens para gladiadores.",
        ],
        shopItems: ["health_potion", "mana_potion"],
      },
    ],
    portals: [
      { x: 7050, y: 3300, width: 50, height: 120, targetMap: "village", targetX: 240, targetY: 3600 },
    ],
  },
};

export function getMapConfig(mapId: MapId): MapConfig {
  return MAP_CONFIGS[mapId];
}
