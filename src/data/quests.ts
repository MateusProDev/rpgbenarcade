// ============================================
// Tutorial / Quest System — guided onboarding + missions
// ============================================

export type QuestStatus = 'locked' | 'available' | 'active' | 'completed';
export type QuestObjectiveType = 'gather' | 'craft' | 'kill' | 'visit' | 'interact' | 'equip';

export interface QuestObjective {
  type: QuestObjectiveType;
  targetId: string;      // item/npc/zone id
  targetName: string;    // display name
  amount: number;
  icon: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;         // display/unlock order
  isTutorial: boolean;
  zone: string;
  prerequisites: string[]; // quest ids
  objectives: QuestObjective[];
  rewards: {
    xp: number;
    gold: number;
    items?: { itemId: string; quantity: number }[];
  };
  dialogueStart: string;
  dialogueEnd: string;
}

/* ---- Tutorial Quests ---- */
export const QUEST_DEFS: Record<string, QuestDefinition> = {
  tut_welcome: {
    id: 'tut_welcome',
    title: 'Bem-vindo ao Mundo!',
    description: 'Fale com o Capitão Rael para receber suas primeiras instruções.',
    icon: '📜',
    order: 1,
    isTutorial: true,
    zone: 'town',
    prerequisites: [],
    objectives: [
      { type: 'interact', targetId: 'guard_captain', targetName: 'Capitão Rael', amount: 1, icon: '💬' },
    ],
    rewards: { xp: 10, gold: 5 },
    dialogueStart: 'Aventureiro! Bem-vindo à Vila Inicial. Temos muito trabalho pela frente!',
    dialogueEnd: 'Excelente! Agora que está aqui, vamos preparar você para a jornada.',
  },

  tut_gather_wood: {
    id: 'tut_gather_wood',
    title: 'Coletando Madeira',
    description: 'Colete madeira das árvores ao redor da vila. Clique na árvore para colher.',
    icon: '🌳',
    order: 2,
    isTutorial: true,
    zone: 'town',
    prerequisites: ['tut_welcome'],
    objectives: [
      { type: 'gather', targetId: 'wood_log', targetName: 'Tora de Madeira', amount: 5, icon: '🪵' },
    ],
    rewards: { xp: 15, gold: 10 },
    dialogueStart: 'Comece coletando madeira das árvores. Você vai precisar para criar ferramentas.',
    dialogueEnd: 'Bom trabalho! Madeira é essencial para sobreviver neste mundo.',
  },

  tut_gather_stone: {
    id: 'tut_gather_stone',
    title: 'Pedras e Minerais',
    description: 'Colete pedras dos depósitos de pedra na vila.',
    icon: '🪨',
    order: 3,
    isTutorial: true,
    zone: 'town',
    prerequisites: ['tut_gather_wood'],
    objectives: [
      { type: 'gather', targetId: 'stone', targetName: 'Pedra', amount: 3, icon: '🪨' },
    ],
    rewards: { xp: 15, gold: 10 },
    dialogueStart: 'Agora colete algumas pedras. Elas serão usadas para forjar ferramentas.',
    dialogueEnd: 'Perfeito! Com madeira e pedra você já pode criar suas primeiras ferramentas.',
  },

  tut_craft_axe: {
    id: 'tut_craft_axe',
    title: 'Sua Primeira Ferramenta',
    description: 'Vá até a Bancada de Trabalho e crie um Machado Básico.',
    icon: '🪓',
    order: 4,
    isTutorial: true,
    zone: 'town',
    prerequisites: ['tut_gather_stone'],
    objectives: [
      { type: 'craft', targetId: 'tool_axe', targetName: 'Machado Básico', amount: 1, icon: '🪓' },
    ],
    rewards: { xp: 25, gold: 15 },
    dialogueStart: 'Procure a Bancada de Trabalho na vila e crie um machado.',
    dialogueEnd: 'Agora você tem uma ferramenta! Com ela, colher madeira será mais rápido.',
  },

  tut_gather_herbs: {
    id: 'tut_gather_herbs',
    title: 'Ervas Curativas',
    description: 'Colete ervas verdes para aprender sobre alquimia.',
    icon: '🌿',
    order: 5,
    isTutorial: true,
    zone: 'town',
    prerequisites: ['tut_craft_axe'],
    objectives: [
      { type: 'gather', targetId: 'herb_green', targetName: 'Erva Verde', amount: 3, icon: '🌿' },
      { type: 'gather', targetId: 'berries', targetName: 'Frutas', amount: 2, icon: '🫐' },
    ],
    rewards: { xp: 20, gold: 10 },
    dialogueStart: 'Colete ervas e frutas. Com elas você poderá criar poções.',
    dialogueEnd: 'Ótimo! Agora visite a Mesa de Alquimia para criar poções.',
  },

  tut_craft_potion: {
    id: 'tut_craft_potion',
    title: 'Primeira Poção',
    description: 'Crie uma Poção de Vida na Mesa de Alquimia.',
    icon: '🧪',
    order: 6,
    isTutorial: true,
    zone: 'town',
    prerequisites: ['tut_gather_herbs'],
    objectives: [
      { type: 'craft', targetId: 'potion_hp_small', targetName: 'Poção de Vida (P)', amount: 1, icon: '🧪' },
    ],
    rewards: {
      xp: 30,
      gold: 20,
      items: [{ itemId: 'potion_hp_small', quantity: 3 }],
    },
    dialogueStart: 'Use as ervas na Mesa de Alquimia para criar poções curativas.',
    dialogueEnd: 'Excelente! Poções são essenciais para sobreviver em combate.',
  },

  tut_first_combat: {
    id: 'tut_first_combat',
    title: 'Primeiro Combate',
    description: 'Viagem até as Planícies e derrote um Slime Verde.',
    icon: '⚔️',
    order: 7,
    isTutorial: true,
    zone: 'plains',
    prerequisites: ['tut_craft_potion'],
    objectives: [
      { type: 'visit', targetId: 'plains', targetName: 'Planícies Verdejantes', amount: 1, icon: '🗺️' },
      { type: 'kill', targetId: 'slime_green', targetName: 'Slime Verde', amount: 2, icon: '💀' },
    ],
    rewards: {
      xp: 40,
      gold: 30,
      items: [{ itemId: 'potion_hp_small', quantity: 2 }],
    },
    dialogueStart: 'Hora de testar suas habilidades! Vá às Planícies e enfrente alguns slimes.',
    dialogueEnd: 'Impressionante! Você está se tornando um verdadeiro aventureiro!',
  },

  tut_craft_weapon: {
    id: 'tut_craft_weapon',
    title: 'Sua Primeira Arma',
    description: 'Colete minério de ferro e forje uma arma na Forja.',
    icon: '⚔️',
    order: 8,
    isTutorial: true,
    zone: 'town',
    prerequisites: ['tut_first_combat'],
    objectives: [
      { type: 'gather', targetId: 'iron_ore', targetName: 'Minério de Ferro', amount: 5, icon: '⛏️' },
      { type: 'craft', targetId: 'sword_iron', targetName: 'Espada de Ferro', amount: 1, icon: '⚔️' },
    ],
    rewards: {
      xp: 50,
      gold: 40,
      items: [{ itemId: 'potion_hp_small', quantity: 3 }],
    },
    dialogueStart: 'É hora de forjar uma arma de verdade. Colete ferro das Planícies e use a Forja.',
    dialogueEnd: 'Uma arma forjada por suas mãos! O mundo está à sua espera, aventureiro.',
  },

  /* ---- Post-tutorial quests ---- */
  quest_wolf_hunter: {
    id: 'quest_wolf_hunter',
    title: 'Caçador de Lobos',
    description: 'Elimine o Lobo Alfa nas planícies.',
    icon: '🐺',
    order: 10,
    isTutorial: false,
    zone: 'plains',
    prerequisites: ['tut_craft_weapon'],
    objectives: [
      { type: 'kill', targetId: 'wolf_alpha', targetName: 'Lobo Alfa', amount: 1, icon: '💀' },
    ],
    rewards: { xp: 60, gold: 50, items: [{ itemId: 'leather_scrap', quantity: 5 }] },
    dialogueStart: 'Um Lobo Alfa tem aterrorizado os viajantes. Cuide disso.',
    dialogueEnd: 'A estrada está segura novamente. Obrigado, aventureiro.',
  },

  quest_dark_forest_explore: {
    id: 'quest_dark_forest_explore',
    title: 'Floresta Sombria',
    description: 'Explore a Floresta Sombria e colete cogumelos.',
    icon: '🌲',
    order: 11,
    isTutorial: false,
    zone: 'dark_forest',
    prerequisites: ['quest_wolf_hunter'],
    objectives: [
      { type: 'visit', targetId: 'dark_forest', targetName: 'Floresta Sombria', amount: 1, icon: '🗺️' },
      { type: 'gather', targetId: 'herb_dark', targetName: 'Cogumelo Sombrio', amount: 3, icon: '🍄' },
    ],
    rewards: { xp: 80, gold: 60, items: [{ itemId: 'shadow_essence', quantity: 2 }] },
    dialogueStart: 'A Floresta Sombria guarda segredos perigosos. Investigue.',
    dialogueEnd: 'Essas essências sombrias são valiosas. Bem feito.',
  },

  quest_dungeon_dive: {
    id: 'quest_dungeon_dive',
    title: 'Mergulho na Masmorra',
    description: 'Entre na masmorra e derrote esqueletos.',
    icon: '💀',
    order: 12,
    isTutorial: false,
    zone: 'dungeon_entrance',
    prerequisites: ['quest_dark_forest_explore'],
    objectives: [
      { type: 'kill', targetId: 'skeleton', targetName: 'Esqueleto', amount: 3, icon: '💀' },
      { type: 'kill', targetId: 'skeleton_archer', targetName: 'Esqueleto Arqueiro', amount: 2, icon: '💀' },
    ],
    rewards: { xp: 120, gold: 80, items: [{ itemId: 'potion_hp_medium', quantity: 3 }] },
    dialogueStart: 'A masmorra está cheia de mortos-vivos. Limpe o caminho!',
    dialogueEnd: 'O mundo dos mortos recua diante de sua força!',
  },

  quest_dragon_slayer: {
    id: 'quest_dragon_slayer',
    title: 'Caça ao Dragão',
    description: 'Derrote Ignaroth, o Dragão Ancião.',
    icon: '🐉',
    order: 15,
    isTutorial: false,
    zone: 'boss_lair',
    prerequisites: ['quest_dungeon_dive'],
    objectives: [
      { type: 'kill', targetId: 'dragon_boss', targetName: 'Ignaroth', amount: 1, icon: '🐉' },
    ],
    rewards: { xp: 500, gold: 300, items: [{ itemId: 'dragon_scale', quantity: 2 }] },
    dialogueStart: 'O dragão ameaça destruir tudo. Só um herói pode deter essa fera.',
    dialogueEnd: 'LENDÁRIO! Você derrotou o dragão! Seu nome será lembrado para sempre!',
  },
};

/** Get tutorial quests in order */
export function getTutorialQuests(): QuestDefinition[] {
  return Object.values(QUEST_DEFS)
    .filter((q) => q.isTutorial)
    .sort((a, b) => a.order - b.order);
}

/** Get all quests, sorted by order */
export function getAllQuests(): QuestDefinition[] {
  return Object.values(QUEST_DEFS).sort((a, b) => a.order - b.order);
}
