// ========================
// Pause Menu — ESC key overlay
// ========================
import { useAuth } from "../hooks/useAuth";
import "./pauseMenu.css";

interface PauseMenuProps {
  onResume: () => void;
  onExitToHome: () => void;
}

export function PauseMenu({ onResume, onExitToHome }: PauseMenuProps) {
  const { logout } = useAuth();

  const handleExitToHome = () => {
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onExitToHome();
  };

  const handleLogout = async () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    await logout();
    onExitToHome();
  };

  const handleToggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="pause-overlay" onClick={onResume}>
      <div className="pause-menu" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pause-header">
          <div className="pause-icon">⚔️</div>
          <h2>Jogo Pausado</h2>
          <p className="pause-subtitle">RPG Ben Arcade — Era das Sombras</p>
        </div>

        {/* Menu Options */}
        <div className="pause-options">
          <button className="pause-btn pause-btn-resume" onClick={onResume}>
            <span className="pause-btn-icon">▶️</span>
            <span className="pause-btn-text">
              <span className="pause-btn-label">Continuar Jogando</span>
              <span className="pause-btn-hint">ESC para voltar</span>
            </span>
          </button>

          <button className="pause-btn" onClick={handleToggleFullscreen}>
            <span className="pause-btn-icon">🖥️</span>
            <span className="pause-btn-text">
              <span className="pause-btn-label">
                {document.fullscreenElement ? "Sair da Tela Cheia" : "Tela Cheia"}
              </span>
              <span className="pause-btn-hint">Alternar modo de tela</span>
            </span>
          </button>

          <div className="pause-divider" />

          <button className="pause-btn pause-btn-exit" onClick={handleExitToHome}>
            <span className="pause-btn-icon">🏠</span>
            <span className="pause-btn-text">
              <span className="pause-btn-label">Tela Inicial</span>
              <span className="pause-btn-hint">Voltar para a landing page</span>
            </span>
          </button>

          <button className="pause-btn pause-btn-logout" onClick={handleLogout}>
            <span className="pause-btn-icon">🚪</span>
            <span className="pause-btn-text">
              <span className="pause-btn-label">Sair da Conta</span>
              <span className="pause-btn-hint">Desconectar e voltar ao início</span>
            </span>
          </button>
        </div>

        {/* Footer hint */}
        <div className="pause-footer">
          Pressione <kbd>ESC</kbd> para fechar
        </div>
      </div>
    </div>
  );
}
