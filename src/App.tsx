// ========================
// App - Main Application
// ========================
import { useGameStore } from "./store/gameStore";
import { useAuth } from "./hooks/useAuth";
import { useAutoSave } from "./hooks/useAutoSave";
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
import "./ui/styles.css";

function App() {
  const isAuthenticated = useGameStore((s) => s.isAuthenticated);
  const isLoading = useGameStore((s) => s.isLoading);
  const player = useGameStore((s) => s.player);

  // Initialize auth listener
  useAuth();

  // Auto-save
  useAutoSave();

  // Loading screen
  if (isLoading) {
    return (
      <div className="loading-screen">
        <h1>⚔️ RPG Ben Arcade ⚔️</h1>
        <p style={{ color: "#888899", fontFamily: "Georgia, serif" }}>
          Carregando o mundo...
        </p>
        <div className="loading-spinner" />
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
    </div>
  );
}

export default App;export default App
