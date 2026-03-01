// ========================
// Phaser Game Component
// ========================
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BootScene } from "../game/scenes/BootScene";
import { WorldScene } from "../game/scenes/WorldScene";
import { useGameStore } from "../store/gameStore";

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const setPhaserGame = useGameStore((s) => s.setPhaserGame);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const toggleSkills = useGameStore((s) => s.toggleSkills);
  const toggleTalents = useGameStore((s) => s.toggleTalents);
  const toggleQuests = useGameStore((s) => s.toggleQuests);
  const toggleChat = useGameStore((s) => s.toggleChat);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#0d0d12",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [BootScene, WorldScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: true,
        antialias: false,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;
    setPhaserGame(game);

    // Handle resize
    const handleResize = () => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      game.destroy(true);
      gameRef.current = null;
      setPhaserGame(null);
    };
  }, []);

  // Global keyboard shortcuts for UI panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if an input is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "i":
          toggleInventory();
          break;
        case "k":
          toggleSkills();
          break;
        case "t":
          toggleTalents();
          break;
        case "q":
          toggleQuests();
          break;
        case "c":
          toggleChat();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <div ref={containerRef} className="game-container" />;
}
