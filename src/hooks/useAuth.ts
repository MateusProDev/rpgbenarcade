// ========================
// Auth Hook
// ========================
import { useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { loadPlayerData, savePlayerData } from "../firebase/playerService";
import { useGameStore } from "../store/gameStore";
import type { PlayerData, ClassType } from "../types";

export function useAuth() {
  const { setAuthenticated, setPlayer, setLoading } = useGameStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthenticated(true);
        const data = await loadPlayerData(user.uid);
        if (data) {
          setPlayer(data);
        }
      } else {
        setAuthenticated(false);
        setPlayer(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const data = await loadPlayerData(cred.user.uid);
    if (data) {
      setPlayer(data);
    }
    return cred.user;
  };

  const register = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setPlayer(null);
    setAuthenticated(false);
  };

  const createCharacter = async (
    uid: string,
    name: string,
    classType: ClassType
  ) => {
    const { getClassConfig } = await import("../game/entities/classes");
    const config = getClassConfig(classType);

    const newPlayer: PlayerData = {
      uid,
      name,
      classType,
      level: 1,
      xp: 0,
      xpToNext: 100,
      gold: 50,
      hp: config.baseHp,
      maxHp: config.baseHp,
      mana: config.baseMana,
      maxMana: config.baseMana,
      attributes: { ...config.baseAttributes },
      attributePoints: 0,
      skills: config.skills.map((s) => s.id),
      talents: [],
      inventory: [],
      equipment: {},
      position: { x: 400, y: 300 },
      currentMap: "village",
      pvpRating: 1000,
      pvpWins: 0,
      pvpLosses: 0,
      quests: [],
      lastOnline: Date.now(),
      createdAt: Date.now(),
    };

    await savePlayerData(newPlayer);
    setPlayer(newPlayer);
    return newPlayer;
  };

  return { login, register, logout, createCharacter };
}
