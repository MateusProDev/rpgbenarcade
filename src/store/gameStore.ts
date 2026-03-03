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

/* ---- Skill cooldown tracking ---- */
interface SkillCooldown {
  skillId: string;
  readyAt: number; // timestamp
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
  })),
);
