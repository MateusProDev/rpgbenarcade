// ============================================
// GameView — main game container with PixiJS canvas + HUD overlay
// ============================================
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { loadPlayer } from '@/services/firebase/firestore';
import { GameEngine, setEngine } from '@/engine/GameEngine';
import { CharacterCreation } from './CharacterCreation';
import { HUD } from './HUD';
import { SkillBar } from './SkillBar';
import { ChatPanel } from './ChatPanel';
import { InventoryPanel } from './InventoryPanel';
import { PauseMenu } from './PauseMenu';
import { TutorialPanel } from './TutorialPanel';
import { CraftingPanel } from './CraftingPanel';
import { input } from '@/engine/InputManager';

export function GameView() {
  const user = useAuthStore((s) => s.user);
  const player = useGameStore((s) => s.player);
  const setPlayer = useGameStore((s) => s.setPlayer);
  const engineReady = useGameStore((s) => s.engineReady);
  const openPanel = useGameStore((s) => s.ui.openPanel);

  // Boolean-only selector: doesn't change reference on every position/stat update
  const hasPlayer = useGameStore((s) => s.player !== null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [needsCreation, setNeedsCreation] = useState(false);
  const [showPause, setShowPause] = useState(false);

  // Load player data
  useEffect(() => {
    if (!user) return;
    loadPlayer(user.uid).then((data) => {
      if (data) {
        setPlayer(data);
      } else {
        setNeedsCreation(true);
      }
      setLoading(false);
    });
  }, [user, setPlayer]);

  // Init engine after player loaded AND canvas is in DOM.
  // CRITICAL: Use `hasPlayer` (boolean) NOT `player` (object) as dep.
  // The player object reference changes on every position/stat update
  // (Zustand spread). If we used `player`, the effect would destroy &
  // recreate the engine on every frame → permanent black screen.
  useEffect(() => {
    if (!hasPlayer || needsCreation) return;
    // Canvas ref is only available after the game div renders
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Don't re-init if already running (handles StrictMode double mount)
    if (useGameStore.getState().engineReady) return;

    let cancelled = false;
    const engine = new GameEngine();
    setEngine(engine);

    engine.init(canvas).then(() => {
      if (cancelled || engine.isDestroyed) return;
      console.log('[GameView] Engine initialised ✓');
    }).catch((err) => {
      if (!cancelled) console.error('[GameView] Engine init failed:', err);
    });

    return () => {
      cancelled = true;
      engine.destroy();
      setEngine(null);
    };
  }, [hasPlayer, needsCreation]);

  // Handle keyboard shortcuts for UI
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setShowPause((v) => !v);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  // Disable game input when panels are open
  useEffect(() => {
    input.enabled = !showPause && openPanel === null;
  }, [showPause, openPanel]);

  const handleCreationComplete = useCallback(() => {
    setNeedsCreation(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-bg-dark">
        <div className="text-gold-accent text-lg animate-pulse">
          Carregando dados do personagem...
        </div>
      </div>
    );
  }

  if (needsCreation) {
    return <CharacterCreation onComplete={handleCreationComplete} />;
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* PixiJS Canvas */}
      <div ref={canvasRef} className="absolute inset-0" />

      {/* HUD Overlay */}
      {engineReady && player && (
        <>
          <HUD />
          <SkillBar />
          <ChatPanel />
          <TutorialPanel />

          {/* Panels */}
          {openPanel === 'inventory' && <InventoryPanel />}
          {openPanel === 'crafting' && <CraftingPanel />}

          {/* Pause menu */}
          {showPause && <PauseMenu onClose={() => setShowPause(false)} />}
        </>
      )}
    </div>
  );
}
