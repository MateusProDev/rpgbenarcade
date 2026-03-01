// ========================
// App — Main Application
// Landing page, pause menu, fullscreen, smooth transitions
// ========================
import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "./store/gameStore";
import { useAuth } from "./hooks/useAuth";
import { useAutoSave } from "./hooks/useAutoSave";
import { LandingPage } from "./ui/LandingPage";
import { LoginScreen } from "./ui/LoginScreen";
import { CharacterCreation } from "./ui/CharacterCreation";
import { GameCanvas } from "./ui/GameCanvas";
import { HUD } from "./ui/HUD";
import { InventoryPanel } from "./ui/InventoryPanel";
import { SkillsPanel } from "./ui/SkillsPanel";
import { TalentPanel } from "./ui/TalentPanel";
import { QuestPanel } from "./ui/QuestPanel";
import { ChatPanel } from "./ui/ChatPanel";
import { ShopPanel } from "./ui/ShopPanel";
import { DialoguePanel } from "./ui/DialoguePanel";
import { PauseMenu } from "./ui/PauseMenu";
import { TutorialOverlay } from "./ui/TutorialOverlay";
import "./ui/styles.css";

const LOADING_TIPS = [
  "💡 Use WASD ou clique no mapa para mover seu herói",
  "💡 Pressione E perto de NPCs para interagir",
  "💡 Distribua atributos ao subir de nível (I para inventário)",
  "💡 O mundo muda entre dia e noite — esteja preparado",
  "💡 Explore masmorras para encontrar loot raro",
];

function App() {
  const isAuthenticated = useGameStore((s) => s.isAuthenticated);
  const isLoading = useGameStore((s) => s.isLoading);
  const player = useGameStore((s) => s.player);
  const [showLanding, setShowLanding] = useState(true);
  const [showPause, setShowPause] = useState(false);
  const [enteredGame, setEnteredGame] = useState(false);

  useAuth();
  useAutoSave();

  // Request fullscreen when entering the game for the first time
  useEffect(() => {
    if (isAuthenticated && player && !enteredGame) {
      setEnteredGame(true);
      // Small delay to let the DOM render the game wrapper first
      setTimeout(() => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {
            // Silently fail — some browsers require user gesture
          });
        }
      }, 300);
    }
  }, [isAuthenticated, player, enteredGame]);

  // ESC key handler for pause menu (only when in game)
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthenticated && player) {
        // Don't toggle if user is in an input field
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        setShowPause((prev) => !prev);
      }
    },
    [isAuthenticated, player]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  // Exit to landing page handler
  const handleExitToHome = useCallback(() => {
    setShowPause(false);
    setShowLanding(true);
    setEnteredGame(false);
  }, []);

  // Landing page (home)
  if (showLanding && !isAuthenticated) {
    return <LandingPage onPlay={() => setShowLanding(false)} />;
  }

  // Cinematic loading screen
  if (isLoading) {
    const tip = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
    return (
      <div className="loading-screen">
        <div className="loading-bg-anim" />
        <div className="loading-content">
          <div className="loading-logo-frame">
            <span className="loading-logo-icon">⚔️</span>
          </div>
          <h1 className="loading-title">RPG Ben Arcade</h1>
          <p className="loading-subtitle">Era das Sombras</p>
          <div className="loading-bar-container">
            <div className="loading-bar">
              <div className="loading-bar-fill" />
            </div>
            <p className="loading-status">Preparando o mundo medieval...</p>
          </div>
          <div className="loading-tips">{tip}</div>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Character creation
  if (!player) {
    return <CharacterCreation />;
  }

  // Main game
  return (
    <div className="game-wrapper">
      <GameCanvas />
      <HUD />
      <InventoryPanel />
      <SkillsPanel />
      <TalentPanel />
      <QuestPanel />
      <ChatPanel />
      <ShopPanel />
      <DialoguePanel />
      <TutorialOverlay />
      {showPause && (
        <PauseMenu
          onResume={() => setShowPause(false)}
          onExitToHome={handleExitToHome}
        />
      )}
    </div>
  );
}

export default App;
