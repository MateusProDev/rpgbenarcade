// ========================
// Firebase Player Service
// ========================
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import { db } from "./config";
import type { PlayerData, RemotePlayer, MapId, ChatMessage } from "../types";

// === Player Data ===
export async function savePlayerData(player: PlayerData): Promise<void> {
  const ref = doc(db, "players", player.uid);
  await setDoc(ref, { ...player, lastOnline: Date.now() }, { merge: true });
}

export async function loadPlayerData(uid: string): Promise<PlayerData | null> {
  const ref = doc(db, "players", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as PlayerData) : null;
}

export async function updatePlayerPosition(
  uid: string,
  x: number,
  y: number,
  direction: string,
  currentMap: MapId
): Promise<void> {
  const ref = doc(db, "presence", uid);
  await setDoc(
    ref,
    {
      position: { x, y },
      direction,
      currentMap,
      lastHeartbeat: Date.now(),
    },
    { merge: true }
  );
}

export async function updatePlayerPresence(uid: string, data: Partial<RemotePlayer>): Promise<void> {
  const ref = doc(db, "presence", uid);
  await setDoc(ref, { ...data, lastHeartbeat: Date.now() }, { merge: true });
}

export async function removePlayerPresence(uid: string): Promise<void> {
  const ref = doc(db, "presence", uid);
  await deleteDoc(ref);
}

// === Multiplayer Listeners ===
export function listenToPlayersOnMap(
  mapId: MapId,
  currentUid: string,
  callback: (players: RemotePlayer[]) => void
): Unsubscribe {
  const q = query(collection(db, "presence"), where("currentMap", "==", mapId));
  return onSnapshot(q, (snapshot) => {
    const players: RemotePlayer[] = [];
    snapshot.forEach((doc) => {
      if (doc.id !== currentUid) {
        players.push({ uid: doc.id, ...doc.data() } as RemotePlayer);
      }
    });
    callback(players);
  });
}

// === Heartbeat / Presence ===
export function startHeartbeat(uid: string): ReturnType<typeof setInterval> {
  return setInterval(async () => {
    const ref = doc(db, "presence", uid);
    await setDoc(ref, { lastHeartbeat: Date.now() }, { merge: true });
  }, 5000);
}

export async function cleanupOfflinePlayers(): Promise<void> {
  const threshold = Date.now() - 15000;
  const q = query(collection(db, "presence"), where("lastHeartbeat", "<", threshold));
  const snapshot = await getDocs(q);
  snapshot.forEach(async (docSnap) => {
    await deleteDoc(doc(db, "presence", docSnap.id));
  });
}

// === Chat ===
export function listenToChat(
  channel: "global" | "guild",
  callback: (messages: ChatMessage[]) => void,
  guildId?: string
): Unsubscribe {
  const colName = channel === "guild" ? `chat_guild_${guildId}` : "chat_global";
  const q = query(collection(db, colName));
  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push(doc.data() as ChatMessage);
    });
    messages.sort((a, b) => a.timestamp - b.timestamp);
    callback(messages.slice(-50));
  });
}

export async function sendChatMessage(message: ChatMessage): Promise<void> {
  const colName =
    message.channel === "guild" ? `chat_guild_global` : "chat_global";
  const ref = doc(db, colName, message.id);
  await setDoc(ref, message);
}

// === XP & Level ===
export async function updatePlayerXpAndGold(
  uid: string,
  xp: number,
  gold: number,
  level: number,
  xpToNext: number
): Promise<void> {
  const ref = doc(db, "players", uid);
  await updateDoc(ref, { xp, gold, level, xpToNext, lastOnline: Date.now() });
}

// === PvP ===
export async function savePvpResult(
  winnerId: string,
  loserId: string,
  ratingChange: number
): Promise<void> {
  const ref = doc(collection(db, "pvp_results"));
  await setDoc(ref, {
    winnerId,
    loserId,
    ratingChange,
    timestamp: Date.now(),
  });
}

// === Guild ===
export async function createGuild(
  guildId: string,
  name: string,
  tag: string,
  leaderId: string
): Promise<void> {
  const ref = doc(db, "guilds", guildId);
  await setDoc(ref, {
    id: guildId,
    name,
    tag,
    leaderId,
    members: [leaderId],
    level: 1,
    createdAt: Date.now(),
  });
}

export async function getGuild(guildId: string) {
  const ref = doc(db, "guilds", guildId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}
