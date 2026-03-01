// ========================
// Zustand Game Store
// ========================
import { create } from "zustand";
import type {
  PlayerData,
  RemotePlayer,
  ChatMessage,
  MapId,
  TimeOfDay,
  Item,
  Equipment,
  GameEvent,
} from "../types";

interface GameState {
  // Auth
  isAuthenticated: boolean;
  isLoading: boolean;

  // Player
  player: PlayerData | null;
  remotePlayers: RemotePlayer[];

  // UI State
  showInventory: boolean;
  showSkills: boolean;
  showTalents: boolean;
  showQuests: boolean;
  showChat: boolean;
  showMap: boolean;
  showGuild: boolean;
  showShop: boolean;
  currentNpcDialogue: { npcName: string; lines: string[] } | null;

  // Chat
  chatMessages: ChatMessage[];

  // World
  timeOfDay: TimeOfDay;
  currentMap: MapId;

  // Combat
  cooldowns: Record<string, number>;
  targetEnemy: string | null;

  // Events
  events: GameEvent[];
  notifications: string[];

  // Game instance
  phaserGame: Phaser.Game | null;

  // Actions
  setAuthenticated: (val: boolean) => void;
  setLoading: (val: boolean) => void;
  setPlayer: (player: PlayerData | null) => void;
  updatePlayer: (partial: Partial<PlayerData>) => void;
  setRemotePlayers: (players: RemotePlayer[]) => void;
  toggleInventory: () => void;
  toggleSkills: () => void;
  toggleTalents: () => void;
  toggleQuests: () => void;
  toggleChat: () => void;
  toggleMap: () => void;
  toggleGuild: () => void;
  setShowShop: (val: boolean) => void;
  setNpcDialogue: (dialogue: { npcName: string; lines: string[] } | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  setCurrentMap: (map: MapId) => void;
  setCooldown: (skillId: string, endsAt: number) => void;
  clearCooldown: (skillId: string) => void;
  setTargetEnemy: (id: string | null) => void;
  addEvent: (event: GameEvent) => void;
  addNotification: (msg: string) => void;
  removeNotification: (index: number) => void;
  setPhaserGame: (game: Phaser.Game | null) => void;
  addXp: (amount: number) => void;
  addGold: (amount: number) => void;
  addItem: (item: Item) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  equipItem: (item: Item) => void;
  unequipItem: (slot: keyof Equipment) => void;
  distributeAttribute: (attr: keyof PlayerData["attributes"]) => void;
  updateQuest: (questId: string, progress: number) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  restoreMana: (amount: number) => void;
  respawn: () => void;
}

function calculateXpToNext(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function calculateMaxHp(vitality: number, level: number): number {
  return 100 + vitality * 10 + level * 5;
}

function calculateMaxMana(intelligence: number, level: number): number {
  return 50 + intelligence * 8 + level * 3;
}

export const useGameStore = create<GameState>((set, _get) => ({
  isAuthenticated: false,
  isLoading: true,
  player: null,
  remotePlayers: [],
  showInventory: false,
  showSkills: false,
  showTalents: false,
  showQuests: false,
  showChat: false,
  showMap: false,
  showGuild: false,
  showShop: false,
  currentNpcDialogue: null,
  chatMessages: [],
  timeOfDay: "day",
  currentMap: "village",
  cooldowns: {},
  targetEnemy: null,
  events: [],
  notifications: [],
  phaserGame: null,

  setAuthenticated: (val) => set({ isAuthenticated: val }),
  setLoading: (val) => set({ isLoading: val }),
  setPlayer: (player) => set({ player }),
  updatePlayer: (partial) =>
    set((s) => ({
      player: s.player ? { ...s.player, ...partial } : null,
    })),
  setRemotePlayers: (players) => set({ remotePlayers: players }),
  toggleInventory: () => set((s) => ({ showInventory: !s.showInventory })),
  toggleSkills: () => set((s) => ({ showSkills: !s.showSkills })),
  toggleTalents: () => set((s) => ({ showTalents: !s.showTalents })),
  toggleQuests: () => set((s) => ({ showQuests: !s.showQuests })),
  toggleChat: () => set((s) => ({ showChat: !s.showChat })),
  toggleMap: () => set((s) => ({ showMap: !s.showMap })),
  toggleGuild: () => set((s) => ({ showGuild: !s.showGuild })),
  setShowShop: (val) => set({ showShop: val }),
  setNpcDialogue: (dialogue) => set({ currentNpcDialogue: dialogue }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages.slice(-49), msg] })),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  setTimeOfDay: (t) => set({ timeOfDay: t }),
  setCurrentMap: (map) => set({ currentMap: map }),
  setCooldown: (skillId, endsAt) =>
    set((s) => ({ cooldowns: { ...s.cooldowns, [skillId]: endsAt } })),
  clearCooldown: (skillId) =>
    set((s) => {
      const cd = { ...s.cooldowns };
      delete cd[skillId];
      return { cooldowns: cd };
    }),
  setTargetEnemy: (id) => set({ targetEnemy: id }),
  addEvent: (event) => set((s) => ({ events: [...s.events.slice(-20), event] })),
  addNotification: (msg) =>
    set((s) => ({ notifications: [...s.notifications.slice(-4), msg] })),
  removeNotification: (index) =>
    set((s) => ({
      notifications: s.notifications.filter((_, i) => i !== index),
    })),
  setPhaserGame: (game) => set({ phaserGame: game }),

  addXp: (amount) =>
    set((s) => {
      if (!s.player) return {};
      let xp = s.player.xp + amount;
      let level = s.player.level;
      let xpToNext = s.player.xpToNext;
      let attributePoints = s.player.attributePoints;

      while (xp >= xpToNext) {
        xp -= xpToNext;
        level++;
        attributePoints += 3;
        xpToNext = calculateXpToNext(level);
      }

      const maxHp = calculateMaxHp(s.player.attributes.vitality, level);
      const maxMana = calculateMaxMana(s.player.attributes.intelligence, level);

      return {
        player: {
          ...s.player,
          xp,
          level,
          xpToNext,
          attributePoints,
          maxHp,
          maxMana,
          hp: level > s.player.level ? maxHp : s.player.hp,
          mana: level > s.player.level ? maxMana : s.player.mana,
        },
        notifications:
          level > s.player.level
            ? [...s.notifications, `Level Up! Nível ${level}!`]
            : s.notifications,
      };
    }),

  addGold: (amount) =>
    set((s) => ({
      player: s.player
        ? { ...s.player, gold: s.player.gold + amount }
        : null,
    })),

  addItem: (item) =>
    set((s) => {
      if (!s.player) return {};
      const inv = [...s.player.inventory];
      const existing = inv.find((slot) => slot.item.id === item.id);
      if (existing && item.type === "consumable") {
        existing.quantity++;
      } else {
        inv.push({ item, quantity: 1 });
      }
      return { player: { ...s.player, inventory: inv } };
    }),

  removeItem: (itemId, quantity = 1) =>
    set((s) => {
      if (!s.player) return {};
      const inv = s.player.inventory
        .map((slot) => {
          if (slot.item.id === itemId) {
            return { ...slot, quantity: slot.quantity - quantity };
          }
          return slot;
        })
        .filter((slot) => slot.quantity > 0);
      return { player: { ...s.player, inventory: inv } };
    }),

  equipItem: (item) =>
    set((s) => {
      if (!s.player || !item.equipSlot) return {};
      const equipment = { ...s.player.equipment };
      const currentEquipped = equipment[item.equipSlot as keyof Equipment];
      equipment[item.equipSlot as keyof Equipment] = item;

      let inv = s.player.inventory.filter((slot) => slot.item.id !== item.id);
      if (currentEquipped) {
        inv = [...inv, { item: currentEquipped, quantity: 1 }];
      }

      return { player: { ...s.player, equipment, inventory: inv } };
    }),

  unequipItem: (slot) =>
    set((s) => {
      if (!s.player) return {};
      const equipment = { ...s.player.equipment };
      const item = equipment[slot];
      if (!item) return {};
      equipment[slot] = undefined;
      return {
        player: {
          ...s.player,
          equipment,
          inventory: [...s.player.inventory, { item, quantity: 1 }],
        },
      };
    }),

  distributeAttribute: (attr) =>
    set((s) => {
      if (!s.player || s.player.attributePoints <= 0) return {};
      const attributes = {
        ...s.player.attributes,
        [attr]: s.player.attributes[attr] + 1,
      };
      const maxHp = calculateMaxHp(attributes.vitality, s.player.level);
      const maxMana = calculateMaxMana(attributes.intelligence, s.player.level);
      return {
        player: {
          ...s.player,
          attributes,
          attributePoints: s.player.attributePoints - 1,
          maxHp,
          maxMana,
        },
      };
    }),

  updateQuest: (questId, progress) =>
    set((s) => {
      if (!s.player) return {};
      const quests = s.player.quests.map((q) =>
        q.questId === questId ? { ...q, progress } : q
      );
      return { player: { ...s.player, quests } };
    }),

  takeDamage: (amount) =>
    set((s) => {
      if (!s.player) return {};
      const hp = Math.max(0, s.player.hp - amount);
      return { player: { ...s.player, hp } };
    }),

  heal: (amount) =>
    set((s) => {
      if (!s.player) return {};
      const hp = Math.min(s.player.maxHp, s.player.hp + amount);
      return { player: { ...s.player, hp } };
    }),

  restoreMana: (amount) =>
    set((s) => {
      if (!s.player) return {};
      const mana = Math.min(s.player.maxMana, s.player.mana + amount);
      return { player: { ...s.player, mana } };
    }),

  respawn: () =>
    set((s) => {
      if (!s.player) return {};
      return {
        player: {
          ...s.player,
          hp: s.player.maxHp,
          mana: s.player.maxMana,
          position: { x: 400, y: 300 },
          currentMap: "village" as MapId,
        },
        currentMap: "village" as MapId,
      };
    }),
}));
