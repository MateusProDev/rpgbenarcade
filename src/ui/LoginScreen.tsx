// ========================
// Login Screen — Premium Medieval UI
// Cinematic entry with particles, tips, glass card
// ========================
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import "./styles.css";

const TIPS = [
  "Explore masmorras para encontrar equipamentos lendários",
  "Cada classe possui uma árvore de evolução única",
  "Use combos de habilidades para maximizar seu dano",
  "O mundo muda entre dia e noite — cuidado com as sombras",
  "Forme grupos com outros jogadores para enfrentar chefões",
  "Distribua seus atributos sabiamente ao subir de nível",
  "Mercadores nas vilas vendem itens raros por bom preço",
  "Clique no mapa para mover seu personagem automaticamente",
  "Assassinos causam dano crítico ao atacar por trás",
  "Cavaleiros podem bloquear ataques e proteger aliados",
];

export function LoginScreen() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState("");

  // Generate persistent particles
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 10,
        size: Math.random() * 3 + 1,
        duration: 10 + Math.random() * 8,
      })),
    []
  );

  useEffect(() => {
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    const interval = setInterval(() => {
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar");
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      {/* Animated background particles */}
      <div className="login-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="login-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
          />
        ))}
      </div>

      <div className="login-vignette" />

      <div className="login-container">
        {/* Logo section */}
        <div className="login-header">
          <div className="login-logo-frame">
            <div className="login-logo-icon">⚔️</div>
          </div>
          <h1 className="game-title">
            <span className="title-line">RPG Ben</span>
            <span className="title-line title-accent">Arcade</span>
          </h1>
          <div className="game-subtitle-box">
            <span className="subtitle-deco">━━━</span>
            <span className="game-subtitle">Era das Sombras</span>
            <span className="subtitle-deco">━━━</span>
          </div>
          <p className="game-version">v1.0 — Mundo Medieval Online</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-tab-row">
            <button
              type="button"
              className={`form-tab ${!isRegistering ? "active" : ""}`}
              onClick={() => { setIsRegistering(false); setError(""); }}
            >
              🏰 Entrar
            </button>
            <button
              type="button"
              className={`form-tab ${isRegistering ? "active" : ""}`}
              onClick={() => { setIsRegistering(true); setError(""); }}
            >
              ⚔️ Registrar
            </button>
          </div>

          <div className="form-group">
            <label>
              <span className="label-icon">📧</span> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>
              <span className="label-icon">🔒</span> Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />
          </div>

          {error && (
            <div className="error-msg">
              <span className="error-icon">⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn-primary btn-glow" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="btn-spinner" />
                Carregando...
              </span>
            ) : isRegistering ? (
              "⚔️ Criar Conta"
            ) : (
              "🏰 Entrar no Mundo"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <div className="login-tip">
            <span className="tip-label">💡 Dica:</span>
            <span className="tip-text">{tip}</span>
          </div>
          <div className="login-features">
            <span>🗡️ 5 Classes</span>
            <span>🌍 Mundo Aberto</span>
            <span>👥 Multiplayer</span>
            <span>🏰 Masmorras</span>
          </div>
        </div>
      </div>
    </div>
  );
}
