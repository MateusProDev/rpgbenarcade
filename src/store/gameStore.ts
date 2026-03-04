// ============================================
// Game Store — Core game state via Zustand
// ============================================
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  PlayerData, RemotePlayerState, CombatEvent,
  ChatMessage, InventoryItem, UIState, PanelType,
  Vec2, Direction, TerritoryData,
} from './types';
import type { CraftingStation } from '@/data/crafting';
import type { QuestStatus } from '@/data/quests';

/* ---- Skill cooldown tracking ---- */
interface SkillCooldown {
  skillId: string;
  readyAt: number; // timestamp
}

/* ---- Quest tracking ---- */
interface QuestProgress {
  questId: string;
  status: QuestStatus;
  progress: Record<string, number>; // objectiveTargetId -> current count
  startedAt: number;
}

/* ---- Game State Shape ---- */
interface GameState {
  // Player
  player: PlayerData | null;
  setPlayer: (p: PlayerData | null) => void;
  updatePlayerPos: (pos: Vec2, dir: Direction) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  useMana: (amount: number) => boolean;
  addXp: (amount: number) => void;
  addGold: (amount: number) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string, qty?: number) => void;

  // Zone
  currentZone: string;
  setCurrentZone: (zone: string) => void;

  // Remote players
  remotePlayers: Record<string, RemotePlayerState>;
  setRemotePlayers: (players: Record<string, RemotePlayerState>) => void;

  // Combat
  combatEvents: CombatEvent[];
  addCombatEvent: (e: CombatEvent) => void;
  clearOldEvents: () => void;

  // Skills
  skillCooldowns: SkillCooldown[];
  setSkillCooldown: (skillId: string, duration: number) => void;
  isSkillReady: (skillId: string) => boolean;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;

  // Territory
  territories: TerritoryData[];
  setTerritories: (t: TerritoryData[]) => void;

  // UI state
  ui: UIState;
  openPanel: (p: PanelType) => void;
  toggleChat: () => void;
  toggleMinimap: () => void;

  // Engine reference (set after PixiJS boots)
  engineReady: boolean;
  setEngineReady: (v: boolean) => void;

  // Quests
  quests: QuestProgress[];
  startQuest: (questId: string) => void;
  updateQuestProgress: (questId: string, targetId: string, amount?: number) => void;
  completeQuest: (questId: string) => void;
  isQuestComplete: (questId: string) => boolean;
  getQuestProgress: (questId: string) => QuestProgress | undefined;

  // Crafting
  activeCraftingStation: CraftingStation | null;
  openCraftingStation: (station: CraftingStation) => void;
  closeCraftingStation: () => void;

  // Tutorial
  tutorialStep: number;
  setTutorialStep: (step: number) => void;
  tutorialDismissed: boolean;
  dismissTutorial: () => void;
}

/* ---- Level XP curve ---- */
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // ---- Player ----
    player: null,
    setPlayer: (player) => set({ player }),
    updatePlayerPos: (pos, dir) => {
      const p = get().player;
      if (!p) return;
      set({ player: { ...p, position: pos, direction: dir } });
    },
    takeDamage: (amount) => {
      const p = get().player;
      if (!p) return;
      const hp = Math.max(0, p.stats.hp - amount);
      set({ player: { ...p, stats: { ...p.stats, hp } } });
    },
    heal: (amount) => {
      const p = get().player;
      if (!p) return;
      const hp = Math.min(p.stats.maxHp, p.stats.hp + amount);
      set({ player: { ...p, stats: { ...p.stats, hp } } });
    },
    useMana: (amount) => {
      const p = get().player;
      if (!p || p.stats.mana < amount) return false;
      set({ player: { ...p, stats: { ...p.stats, mana: p.stats.mana - amount } } });
      return true;
    },
    addXp: (amount) => {
      const p = get().player;
      if (!p) return;
      let xp = p.xp + amount;
      let level = p.level;
      let xpToNext = p.xpToNext;
      while (xp >= xpToNext) {
        xp -= xpToNext;
        level++;
        xpToNext = xpForLevel(level);
      }
      set({ player: { ...p, xp, level, xpToNext } });
    },
    addGold: (amount) => {
      const p = get().player;
      if (!p) return;
      set({ player: { ...p, gold: p.gold + amount } });
    },
    addItem: (item) => {
      const p = get().player;
      if (!p) return;
      const existing = p.inventory.find((i) => i.templateId === item.templateId && !i.equipped);
      if (existing && item.slot === 'consumable') {
        existing.quantity += item.quantity;
        set({ player: { ...p, inventory: [...p.inventory] } });
      } else {
        set({ player: { ...p, inventory: [...p.inventory, item] } });
      }
    },
    removeItem: (itemId, qty = 1) => {
      const p = get().player;
      if (!p) return;
      const inv = p.inventory.map((i) => {
        if (i.id === itemId) return { ...i, quantity: i.quantity - qty };
        return i;
      }).filter((i) => i.quantity > 0);
      set({ player: { ...p, inventory: inv } });
    },

    // ---- Zone ----
    currentZone: 'town',
    setCurrentZone: (zone) => set({ currentZone: zone }),

    // ---- Remote Players ----
    remotePlayers: {},
    setRemotePlayers: (remotePlayers) => set({ remotePlayers }),

    // ---- Combat Events ----
    combatEvents: [],
    addCombatEvent: (e) => set((s) => ({ combatEvents: [...s.combatEvents, e].slice(-50) })),
    clearOldEvents: () => {
      const cutoff = Date.now() - 5000;
      set((s) => ({
        combatEvents: s.combatEvents.filter((e) => e.timestamp > cutoff),
      }));
    },

    // ---- Skills ----
    skillCooldowns: [],
    setSkillCooldown: (skillId, duration) => {
      const cd: SkillCooldown = { skillId, readyAt: Date.now() + duration * 1000 };
      set((s) => ({
        skillCooldowns: [...s.skillCooldowns.filter((c) => c.skillId !== skillId), cd],
      }));
    },
    isSkillReady: (skillId) => {
      const cd = get().skillCooldowns.find((c) => c.skillId === skillId);
      return !cd || Date.now() >= cd.readyAt;
    },

    // ---- Chat ----
    chatMessages: [],
    addChatMessage: (msg) => set((s) => ({
      chatMessages: [...s.chatMessages, msg].slice(-200),
    })),

    // ---- Territories ----
    territories: [],
    setTerritories: (territories) => set({ territories }),

    // ---- UI ----
    ui: {
      openPanel: null,
      chatOpen: false,
      minimapExpanded: false,
      showDamageNumbers: true,
      showNames: true,
      screenShake: true,
    },
    openPanel: (p) => set((s) => ({
      ui: { ...s.ui, openPanel: s.ui.openPanel === p ? null : p },
    })),
    toggleChat: () => set((s) => ({
      ui: { ...s.ui, chatOpen: !s.ui.chatOpen },
    })),
    toggleMinimap: () => set((s) => ({
      ui: { ...s.ui, minimapExpanded: !s.ui.minimapExpanded },
    })),

    // ---- Engine ----
    engineReady: false,
    setEngineReady: (engineReady) => set({ engineReady }),

    // ---- Quests ----
    quests: [],
    startQuest: (questId) => {
      const existing = get().quests.find((q) => q.questId === questId);
      if (existing) return;
      set((s) => ({
        quests: [...s.quests, {
          questId,
          status: 'active' as QuestStatus,
          progress: {},
          startedAt: Date.now(),
        }],
      }));
    },
    updateQuestProgress: (questId, targetId, amount = 1) => {
      set((s) => ({
        quests: s.quests.map((q) => {
          if (q.questId !== questId || q.status !== 'active') return q;
          const cur = q.progress[targetId] || 0;
          return { ...q, progress: { ...q.progress, [targetId]: cur + amount } };
        }),
      }));
    },
    completeQuest: (questId) => {
      set((s) => ({
        quests: s.quests.map((q) =>
          q.questId === questId ? { ...q, status: 'completed' as QuestStatus } : q
        ),
      }));
    },
    isQuestComplete: (questId) => {
      return get().quests.some((q) => q.questId === questId && q.status === 'completed');
    },
    getQuestProgress: (questId) => {
      return get().quests.find((q) => q.questId === questId);
    },

    // ---- Crafting ----
    activeCraftingStation: null,
    openCraftingStation: (station) => set({
      activeCraftingStation: station,
      ui: { ...get().ui, openPanel: 'crafting' },
    }),
    closeCraftingStation: () => set({
      activeCraftingStation: null,
      ui: { ...get().ui, openPanel: null },
    }),

    // ---- Tutorial ----
    tutorialStep: 0,
    setTutorialStep: (tutorialStep) => set({ tutorialStep }),
    tutorialDismissed: false,
    dismissTutorial: () => set({ tutorialDismissed: true }),
  })),
);
