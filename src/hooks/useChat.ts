// ========================
// Chat Hook
// ========================
import { useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { useGameStore } from "../store/gameStore";
import { listenToChat, sendChatMessage } from "../firebase/playerService";
import type { ChatMessage } from "../types";

export function useChat() {
  const player = useGameStore((s) => s.player);
  const setChatMessages = useGameStore((s) => s.setChatMessages);

  useEffect(() => {
    const unsub = listenToChat("global", (messages) => {
      setChatMessages(messages);
    });
    return () => unsub();
  }, []);

  const send = useCallback(
    async (message: string) => {
      if (!player || !message.trim()) return;

      const msg: ChatMessage = {
        id: nanoid(),
        senderId: player.uid,
        senderName: player.name,
        message: message.trim(),
        timestamp: Date.now(),
        channel: "global",
      };

      await sendChatMessage(msg);
    },
    [player]
  );

  return { send };
}
