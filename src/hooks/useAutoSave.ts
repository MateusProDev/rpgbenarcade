// ========================
// Game Save Hook
// ========================
import { useEffect, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { savePlayerData } from "../firebase/playerService";

export function useAutoSave() {
  const player = useGameStore((s) => s.player);

  const save = useCallback(async () => {
    if (player) {
      await savePlayerData(player);
    }
  }, [player]);

  useEffect(() => {
    const interval = setInterval(save, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [save]);

  // Save on unload
  useEffect(() => {
    const handleUnload = () => {
      if (player) {
        // Use sendBeacon for reliability
        const data = JSON.stringify(player);
        navigator.sendBeacon?.("/api/save", data);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [player]);

  return { save };
}
