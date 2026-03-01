// ========================
// Map Configurations
// ========================
import type { MapConfig, MapId } from "../../types";

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  village: {
    id: "village",
    name: "Vila de Aldoria",
    width: 4800,
    height: 3600,
    tileSize: 32,
    spawnPoint: { x: 1200, y: 1000 },
    pvpEnabled: false,
    enemies: [],
    npcs: [
      {
        id: "elder",
        name: "Ancião Theron",
        x: 800,
        y: 600,
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
        x: 1800,
        y: 700,
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
        x: 600,
        y: 1400,
        dialogue: [
          "Que as estrelas guiem seu caminho.",
          "Posso curar suas feridas... por algumas moedas.",
        ],
      },
      {
        id: "guild_master",
        name: "Mestre da Guilda",
        x: 1600,
        y: 1500,
        dialogue: [
          "A Guilda dos Aventureiros sempre precisa de membros.",
          "Junte-se a uma guilda para ficar mais forte!",
        ],
      },
      {
        id: "guard_captain",
        name: "Capitão da Guarda",
        x: 3200,
        y: 800,
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
        x: 3600,
        y: 2400,
        dialogue: [
          "O conhecimento é a arma mais poderosa.",
          "Nestes livros encontrará segredos antigos sobre as masmorras.",
        ],
      },
      {
        id: "farmer",
        name: "Fazendeiro Tomás",
        x: 2400,
        y: 2800,
        dialogue: [
          "Malditos slimes estão destruindo minhas plantações!",
          "Se puder eliminá-los nos campos, ficarei grato!",
        ],
        questId: "slime_hunt",
      },
    ],
    portals: [
      { x: 4750, y: 1600, width: 50, height: 120, targetMap: "fields", targetX: 80, targetY: 1200 },
      { x: 2200, y: 0, width: 120, height: 50, targetMap: "forest", targetX: 1200, targetY: 3500 },
      { x: 0, y: 1200, width: 50, height: 120, targetMap: "arena", targetX: 2100, targetY: 1200 },
    ],
  },

  fields: {
    id: "fields",
    name: "Campos de Valorheim",
    width: 6400,
    height: 4800,
    tileSize: 32,
    spawnPoint: { x: 150, y: 1200 },
    pvpEnabled: false,
    enemies: [
      // Slime valley (west)
      { type: "slime", x: 600, y: 600, respawnTime: 10000 },
      { type: "slime", x: 900, y: 800, respawnTime: 10000 },
      { type: "slime", x: 500, y: 1000, respawnTime: 10000 },
      { type: "slime", x: 750, y: 500, respawnTime: 10000 },
      { type: "slime", x: 400, y: 1400, respawnTime: 10000 },
      { type: "slime", x: 800, y: 1500, respawnTime: 10000 },
      { type: "slime", x: 600, y: 1800, respawnTime: 10000 },
      // Wolf territory (central west)
      { type: "wolf", x: 1600, y: 800, respawnTime: 15000 },
      { type: "wolf", x: 2000, y: 1000, respawnTime: 15000 },
      { type: "wolf", x: 1800, y: 1400, respawnTime: 15000 },
      { type: "wolf", x: 1500, y: 1600, respawnTime: 15000 },
      { type: "wolf", x: 2200, y: 600, respawnTime: 15000 },
      // Goblin camp (center)
      { type: "goblin", x: 2800, y: 1200, respawnTime: 15000 },
      { type: "goblin", x: 3200, y: 1000, respawnTime: 15000 },
      { type: "goblin", x: 3000, y: 1500, respawnTime: 15000 },
      { type: "goblin", x: 3400, y: 1400, respawnTime: 15000 },
      { type: "goblin", x: 2600, y: 1600, respawnTime: 15000 },
      // Bandit stronghold (east)
      { type: "bandit", x: 4200, y: 1200, respawnTime: 20000 },
      { type: "bandit", x: 4500, y: 1000, respawnTime: 20000 },
      { type: "bandit", x: 4800, y: 1400, respawnTime: 20000 },
      { type: "bandit", x: 4600, y: 1800, respawnTime: 20000 },
      { type: "bandit", x: 4300, y: 2000, respawnTime: 20000 },
      // Orc frontier (far east)
      { type: "orc", x: 5400, y: 1600, respawnTime: 25000 },
      { type: "orc", x: 5600, y: 2000, respawnTime: 25000 },
      { type: "orc", x: 5200, y: 2400, respawnTime: 25000 },
      { type: "orc", x: 5800, y: 2800, respawnTime: 25000 },
      // Southern slimes & wolves
      { type: "slime", x: 1000, y: 3200, respawnTime: 10000 },
      { type: "slime", x: 1400, y: 3600, respawnTime: 10000 },
      { type: "wolf", x: 2000, y: 3000, respawnTime: 15000 },
      { type: "wolf", x: 2400, y: 3400, respawnTime: 15000 },
      { type: "goblin", x: 3000, y: 3200, respawnTime: 15000 },
      { type: "goblin", x: 3600, y: 3600, respawnTime: 15000 },
      { type: "bandit", x: 4200, y: 3000, respawnTime: 20000 },
      { type: "bandit", x: 4800, y: 3400, respawnTime: 20000 },
      { type: "orc", x: 5400, y: 3600, respawnTime: 25000 },
    ],
    npcs: [
      {
        id: "wanderer",
        name: "Viajante Misterioso",
        x: 1400, y: 2600,
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
        x: 2400, y: 800,
        dialogue: [
          "Compre provisões antes de seguir viagem!",
          "Os campos são traiçoeiros à noite.",
        ],
        shopItems: ["health_potion", "mana_potion"],
      },
      {
        id: "scout",
        name: "Batedor Real",
        x: 4000, y: 600,
        dialogue: [
          "Um grande exército Orc se forma nas fronteiras...",
          "Precisamos de guerreiros para defender Valorheim!",
        ],
        questId: "orc_invasion",
      },
    ],
    portals: [
      { x: 0, y: 1100, width: 50, height: 120, targetMap: "village", targetX: 4700, targetY: 1600 },
      { x: 6350, y: 1600, width: 50, height: 120, targetMap: "dungeon", targetX: 80, targetY: 1200 },
    ],
  },

  forest: {
    id: "forest",
    name: "Floresta Sombria",
    width: 5600,
    height: 4400,
    tileSize: 32,
    spawnPoint: { x: 1200, y: 3500 },
    pvpEnabled: false,
    enemies: [
      // Outer forest (wolves)
      { type: "wolf", x: 600, y: 2800, respawnTime: 12000 },
      { type: "wolf", x: 1000, y: 2400, respawnTime: 12000 },
      { type: "wolf", x: 1400, y: 2600, respawnTime: 12000 },
      { type: "wolf", x: 800, y: 1600, respawnTime: 12000 },
      { type: "wolf", x: 1600, y: 2000, respawnTime: 12000 },
      { type: "wolf", x: 400, y: 3200, respawnTime: 12000 },
      // Goblin camps (mid forest)
      { type: "goblin", x: 2200, y: 1800, respawnTime: 14000 },
      { type: "goblin", x: 2600, y: 2200, respawnTime: 14000 },
      { type: "goblin", x: 2400, y: 1400, respawnTime: 14000 },
      { type: "goblin", x: 2000, y: 2600, respawnTime: 14000 },
      { type: "goblin", x: 2800, y: 1600, respawnTime: 14000 },
      // Skeleton ruins (deep)
      { type: "skeleton", x: 3600, y: 1200, respawnTime: 16000 },
      { type: "skeleton", x: 4000, y: 1600, respawnTime: 16000 },
      { type: "skeleton", x: 3800, y: 800, respawnTime: 16000 },
      { type: "skeleton", x: 4200, y: 1000, respawnTime: 16000 },
      { type: "skeleton", x: 3400, y: 2000, respawnTime: 16000 },
      // Orc stronghold (far north)
      { type: "orc", x: 4400, y: 600, respawnTime: 22000 },
      { type: "orc", x: 4800, y: 800, respawnTime: 22000 },
      { type: "orc", x: 4600, y: 1200, respawnTime: 22000 },
      { type: "orc", x: 5000, y: 400, respawnTime: 22000 },
      // Scattered deep creatures
      { type: "wolf", x: 3000, y: 3200, respawnTime: 12000 },
      { type: "goblin", x: 3600, y: 3000, respawnTime: 14000 },
      { type: "skeleton", x: 4200, y: 2800, respawnTime: 16000 },
    ],
    npcs: [
      {
        id: "hermit",
        name: "Eremita da Floresta",
        x: 2400,
        y: 1000,
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
        x: 1800,
        y: 2400,
        dialogue: [
          "A floresta está doente... uma energia sombria a corrompe.",
          "Purifique os cristais corrompidos para restaurar o equilíbrio.",
        ],
        questId: "purify_forest",
      },
      {
        id: "ranger",
        name: "Vigília do Bosque",
        x: 3200,
        y: 2400,
        dialogue: [
          "Esqueletos estão emergindo das ruínas antigas!",
          "Temo que algo terrível despertou nas profundezas.",
        ],
      },
    ],
    portals: [
      { x: 1100, y: 4350, width: 120, height: 50, targetMap: "village", targetX: 2200, targetY: 80 },
      { x: 5550, y: 600, width: 50, height: 120, targetMap: "dungeon", targetX: 80, targetY: 2400 },
    ],
  },

  dungeon: {
    id: "dungeon",
    name: "Masmorras de Drakthar",
    width: 4800,
    height: 3600,
    tileSize: 32,
    spawnPoint: { x: 150, y: 1200 },
    pvpEnabled: false,
    enemies: [
      // Entry hall (skeletons)
      { type: "skeleton", x: 600, y: 800, respawnTime: 12000 },
      { type: "skeleton", x: 800, y: 1000, respawnTime: 12000 },
      { type: "skeleton", x: 500, y: 1400, respawnTime: 12000 },
      { type: "skeleton", x: 700, y: 1600, respawnTime: 12000 },
      { type: "skeleton", x: 900, y: 600, respawnTime: 12000 },
      // Mid dungeon (orcs)
      { type: "orc", x: 1600, y: 1000, respawnTime: 18000 },
      { type: "orc", x: 1800, y: 1400, respawnTime: 18000 },
      { type: "orc", x: 2000, y: 800, respawnTime: 18000 },
      { type: "orc", x: 1400, y: 1600, respawnTime: 18000 },
      { type: "orc", x: 2200, y: 1200, respawnTime: 18000 },
      // Deep dungeon (dark knights)
      { type: "dark_knight", x: 2800, y: 1000, respawnTime: 30000 },
      { type: "dark_knight", x: 3200, y: 1400, respawnTime: 30000 },
      { type: "dark_knight", x: 3000, y: 1800, respawnTime: 30000 },
      { type: "dark_knight", x: 3400, y: 800, respawnTime: 30000 },
      { type: "dark_knight", x: 3600, y: 1600, respawnTime: 30000 },
      // Boss chamber
      { type: "dragon", x: 4200, y: 1800, respawnTime: 60000 },
      // Scattered reinforcements
      { type: "skeleton", x: 1200, y: 2400, respawnTime: 12000 },
      { type: "skeleton", x: 600, y: 2800, respawnTime: 12000 },
      { type: "orc", x: 2400, y: 2600, respawnTime: 18000 },
      { type: "orc", x: 2800, y: 2800, respawnTime: 18000 },
      { type: "dark_knight", x: 3600, y: 2600, respawnTime: 30000 },
    ],
    npcs: [
      {
        id: "ghost",
        name: "Espírito Perdido",
        x: 600,
        y: 1800,
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
        x: 1800,
        y: 2200,
        dialogue: [
          "Obrigado por me encontrar!",
          "Os cavaleiros negros guardam chaves para os baús do tesouro.",
          "Há um segredo por trás do trono do dragão...",
        ],
      },
    ],
    portals: [
      { x: 0, y: 1100, width: 50, height: 120, targetMap: "fields", targetX: 6300, targetY: 1600 },
      { x: 0, y: 2300, width: 50, height: 120, targetMap: "forest", targetX: 5500, targetY: 600 },
    ],
  },

  arena: {
    id: "arena",
    name: "Arena de Sangue",
    width: 2400,
    height: 2400,
    tileSize: 32,
    spawnPoint: { x: 1200, y: 2100 },
    pvpEnabled: true,
    enemies: [],
    npcs: [
      {
        id: "arena_master",
        name: "Mestre da Arena",
        x: 1200,
        y: 2200,
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
        x: 400,
        y: 2000,
        dialogue: [
          "Equipamentos forjados no calor da batalha!",
          "Só os melhores itens para gladiadores.",
        ],
        shopItems: ["health_potion", "mana_potion"],
      },
    ],
    portals: [
      { x: 2350, y: 1100, width: 50, height: 120, targetMap: "village", targetX: 80, targetY: 1200 },
    ],
  },
};

export function getMapConfig(mapId: MapId): MapConfig {
  return MAP_CONFIGS[mapId];
}
