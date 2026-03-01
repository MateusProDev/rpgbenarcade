// ========================
// Character Creation — Premium 2-Step Wizard
// Animated class cards, stat bars, hero preview
// ========================
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { CLASS_CONFIGS } from "../game/entities/classes";
import { auth } from "../firebase/config";
import type { ClassType } from "../types";
import "./styles.css";

const CLASS_LORE: Record<string, string> = {
  mage: "Dominadores das forças arcanas, os magos canalizam o poder dos elementos para destruir seus inimigos à distância. Sua inteligência é sua arma mais letal.",
  archer: "Olhos afiados e reflexos impecáveis. Arqueiros são letais antes que o inimigo chegue perto — cada flecha é um sussurro da morte.",
  swordsman: "A espada é uma extensão do corpo. Espadachins equilibram ataque e defesa com maestria, dominando o campo de batalha.",
  knight: "Fortalezas ambulantes, cavaleiros protegem seus aliados com armaduras pesadas e escudos inquebráveis. A linha de frente é seu lar.",
  assassin: "Sombras que dançam na escuridão. Assassinos atacam onde dói — e desaparecem antes que alguém perceba o que aconteceu.",
};

const CLASS_COLORS: Record<string, string> = {
  mage: "#6688ff",
  archer: "#66cc66",
  swordsman: "#ff8844",
  knight: "#88aadd",
  assassin: "#cc66cc",
};

export function CharacterCreation() {
  const { createCharacter } = useAuth();
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassType>("swordsman");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.length < 3) {
      setError("Nome deve ter pelo menos 3 caracteres");
      return;
    }
    if (name.length > 16) {
      setError("Nome deve ter no máximo 16 caracteres");
      return;
    }
    if (/[^a-zA-ZÀ-ÿ0-9_ ]/.test(name)) {
      setError("Nome contém caracteres inválidos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");
      await createCharacter(user.uid, name.trim(), selectedClass);
    } catch (err: any) {
      setError(err.message || "Erro ao criar personagem");
    }
    setLoading(false);
  };

  const classes = Object.values(CLASS_CONFIGS);
  const current = CLASS_CONFIGS[selectedClass];
  const accentColor = CLASS_COLORS[selectedClass] || "#c4a35a";

  return (
    <div className="login-screen">
      <div className="login-vignette" />
      <div className="creation-container">
        {/* Header */}
        <div className="creation-header">
          <h1 className="game-title" style={{ fontSize: 26 }}>⚔️ Forjar Herói</h1>
          <div className="creation-steps">
            <div className={`creation-step ${step >= 1 ? "active" : ""}`}>
              <span className="step-num">1</span>
              <span className="step-label">Classe</span>
            </div>
            <div className="step-connector" />
            <div className={`creation-step ${step >= 2 ? "active" : ""}`}>
              <span className="step-num">2</span>
              <span className="step-label">Identidade</span>
            </div>
          </div>
        </div>

        <form className="login-form" onSubmit={handleCreate}>
          {/* Step 1: Class Selection */}
          {step === 1 && (
            <div className="creation-step-content step-fade-in">
              <p className="creation-instruction">Escolha a classe que definirá seu destino</p>
              <div className="class-grid">
                {classes.map((cls) => (
                  <div
                    key={cls.type}
                    className={`class-card ${selectedClass === cls.type ? "selected" : ""}`}
                    onClick={() => setSelectedClass(cls.type)}
                    style={
                      selectedClass === cls.type
                        ? { borderColor: CLASS_COLORS[cls.type] || "#c4a35a" }
                        : undefined
                    }
                  >
                    <div className="class-card-glow" />
                    <div className="class-icon">{cls.icon}</div>
                    <div className="class-name">{cls.name}</div>
                    <div className="class-desc">{cls.description}</div>
                    <div className="class-stats">
                      <div className="stat-item">
                        <span className="stat-label">STR</span>
                        <div className="stat-bar-mini">
                          <div className="stat-fill str" style={{ width: `${cls.baseAttributes.strength * 10}%` }} />
                        </div>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">DEX</span>
                        <div className="stat-bar-mini">
                          <div className="stat-fill dex" style={{ width: `${cls.baseAttributes.dexterity * 10}%` }} />
                        </div>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">INT</span>
                        <div className="stat-bar-mini">
                          <div className="stat-fill int" style={{ width: `${cls.baseAttributes.intelligence * 10}%` }} />
                        </div>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">VIT</span>
                        <div className="stat-bar-mini">
                          <div className="stat-fill vit" style={{ width: `${cls.baseAttributes.vitality * 10}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="class-resources">
                      <span className="resource-hp">❤️ {cls.baseHp}</span>
                      <span className="resource-mp">💙 {cls.baseMana}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Class preview panel */}
              <div className="class-preview" style={{ borderColor: `${accentColor}40` }}>
                <div className="preview-icon">{current.icon}</div>
                <div className="preview-info">
                  <h3 className="preview-name" style={{ color: accentColor }}>
                    {current.name}
                  </h3>
                  <p className="preview-lore">{CLASS_LORE[selectedClass] || current.description}</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary btn-glow"
                onClick={() => setStep(2)}
              >
                Próximo — Escolher Nome →
              </button>
            </div>
          )}

          {/* Step 2: Name & Confirm */}
          {step === 2 && (
            <div className="creation-step-content step-fade-in">
              <div className="creation-summary">
                <div className="summary-class" onClick={() => setStep(1)}>
                  <span className="summary-icon">{current.icon}</span>
                  <span className="summary-label" style={{ color: accentColor }}>
                    {current.name}
                  </span>
                  <span className="summary-change">✏️ trocar</span>
                </div>
              </div>

              <div className="form-group name-input-group">
                <label>
                  <span className="label-icon">📜</span> Nome do Herói
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como será lembrado nos pergaminhos..."
                  maxLength={16}
                  required
                  autoFocus
                  className="name-input"
                />
                <div className="name-counter">{name.length}/16</div>
              </div>

              {name.length >= 3 && (
                <div className="hero-preview step-fade-in">
                  <span className="hero-preview-icon">{current.icon}</span>
                  <span className="hero-preview-name" style={{ color: accentColor }}>
                    {name}
                  </span>
                  <span className="hero-preview-class">— {current.name} Lv.1</span>
                </div>
              )}

              {error && (
                <div className="error-msg">
                  <span className="error-icon">⚠️</span> {error}
                </div>
              )}

              <div className="creation-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(1)}
                >
                  ← Voltar
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-glow"
                  disabled={loading || name.length < 3}
                  style={
                    name.length >= 3 && !loading
                      ? { background: `linear-gradient(135deg, ${accentColor}88, ${accentColor}cc)` }
                      : undefined
                  }
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="btn-spinner" />
                      Forjando...
                    </span>
                  ) : (
                    "⚔️ Forjar Herói"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
