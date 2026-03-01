// ========================
// TutorialOverlay — Step-by-step tutorial for new players
// Guides through movement, interaction, combat, quests
// ========================
import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import "./tutorialOverlay.css";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  position: "center" | "top-left" | "top-right" | "bottom-center";
  highlight?: string; // CSS selector to highlight
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao RPG Ben Arcade!",
    description:
      "Você acaba de entrar no mundo medieval de Era das Sombras. Este tutorial vai guiá-lo pelos primeiros passos. Clique em 'Próximo' para continuar.",
    icon: "⚔️",
    position: "center",
  },
  {
    id: "movement",
    title: "Movimentação",
    description:
      "Use as teclas W, A, S, D para mover seu personagem pelo mapa. W = cima, S = baixo, A = esquerda, D = direita. Seu herói se move na direção pressionada.",
    icon: "🎮",
    position: "center",
  },
  {
    id: "camera",
    title: "Câmera & Mundo",
    description:
      "A câmera segue seu personagem automaticamente. Explore o mapa livremente — cada área é vasta e cheia de segredos! Pressione M para ver o minimapa.",
    icon: "🗺️",
    position: "center",
  },
  {
    id: "npc",
    title: "Interagir com NPCs",
    description:
      "Aproxime-se de NPCs (personagens com nomes amarelos) e pressione E para conversar. Eles oferecem missões, vendem itens e contam a história do mundo.",
    icon: "💬",
    position: "center",
  },
  {
    id: "combat",
    title: "Combate",
    description:
      "Ao se aproximar de inimigos (nomes vermelhos), pressione ESPAÇO ou clique neles para atacar. Cuidado com a barra de vida! Use habilidades na barra inferior com as teclas numéricas 1-5.",
    icon: "⚔️",
    position: "center",
  },
  {
    id: "inventory",
    title: "Inventário & Equipamento",
    description:
      "Pressione I para abrir o inventário. Derrote inimigos para ganhar ouro e itens. Equipe armas e armaduras melhores para ficar mais forte!",
    icon: "🎒",
    position: "center",
  },
  {
    id: "quests",
    title: "Missões",
    description:
      "Pressione Q para ver suas missões ativas. Complete-as para ganhar recompensas de XP e ouro. Fale com NPCs para aceitar novas missões.",
    icon: "📜",
    position: "center",
  },
  {
    id: "skills",
    title: "Habilidades & Talentos",
    description:
      "Pressione K para ver habilidades e T para talentos. Ao subir de nível, você ganha pontos para distribuir e se especializar no seu estilo de jogo.",
    icon: "✨",
    position: "center",
  },
  {
    id: "maps",
    title: "Exploração",
    description:
      "O mundo possui 5 áreas: Vila, Campos, Floresta, Masmorra e Arena. Portais brilhantes nas bordas dos mapas levam a novas áreas. Explore com cuidado — inimigos ficam mais fortes!",
    icon: "🌍",
    position: "center",
  },
  {
    id: "pause",
    title: "Menu de Pausa",
    description:
      "Pressione ESC a qualquer momento para pausar o jogo. De lá, você pode ajustar opções ou voltar à tela inicial. Seu progresso é salvo automaticamente!",
    icon: "⏸️",
    position: "center",
  },
  {
    id: "ready",
    title: "Pronto para a Aventura!",
    description:
      "Você está preparado! Comece explorando a Vila — fale com os NPCs, aceite missões e se aventure nos Campos quando estiver pronto. Boa sorte, herói!",
    icon: "🏰",
    position: "center",
  },
];

const STORAGE_KEY = "rpgben_tutorial_done";

export function TutorialOverlay() {
  const player = useGameStore((s) => s.player);
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Show tutorial only for new players (level 1, first time)
  useEffect(() => {
    if (!player) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done && player.level <= 1) {
      setVisible(true);
      setCurrentStep(0);
    }
  }, [player]);

  const handleNext = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Tutorial complete
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, "true");
      }, 400);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(STORAGE_KEY, "true");
    }, 400);
  }, []);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Keyboard support
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible, handleNext, handlePrev, handleSkip]);

  if (!visible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className={`tutorial-overlay ${fadeOut ? "tutorial-fade-out" : ""}`}>
      <div className="tutorial-backdrop" />
      <div className={`tutorial-card tutorial-pos-${step.position}`}>
        {/* Progress bar */}
        <div className="tutorial-progress-bar">
          <div className="tutorial-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Step counter */}
        <div className="tutorial-step-counter">
          {currentStep + 1} / {TUTORIAL_STEPS.length}
        </div>

        {/* Icon */}
        <div className="tutorial-icon">{step.icon}</div>

        {/* Content */}
        <h2 className="tutorial-title">{step.title}</h2>
        <p className="tutorial-description">{step.description}</p>

        {/* Navigation buttons */}
        <div className="tutorial-buttons">
          <button className="tutorial-btn tutorial-btn-skip" onClick={handleSkip}>
            Pular Tutorial
          </button>
          <div className="tutorial-btn-group">
            {currentStep > 0 && (
              <button className="tutorial-btn tutorial-btn-prev" onClick={handlePrev}>
                ← Anterior
              </button>
            )}
            <button className="tutorial-btn tutorial-btn-next" onClick={handleNext}>
              {isLast ? "Começar! 🎮" : "Próximo →"}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="tutorial-keyboard-hint">
          Use ← → ou Enter para navegar • ESC para pular
        </div>
      </div>
    </div>
  );
}
