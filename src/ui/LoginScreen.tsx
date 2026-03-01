// ========================
// Login Screen
// ========================
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "./styles.css";

export function LoginScreen() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div className="login-container">
        <div className="login-header">
          <h1 className="game-title">⚔️ RPG Ben Arcade ⚔️</h1>
          <p className="game-subtitle">Era das Sombras</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>{isRegistering ? "Criar Conta" : "Entrar"}</h2>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Carregando..." : isRegistering ? "Registrar" : "Entrar"}
          </button>

          <button
            type="button"
            className="btn-link"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering
              ? "Já tem conta? Entre aqui"
              : "Não tem conta? Registre-se"}
          </button>
        </form>

        <div className="login-footer">
          <p>🏰 Um mundo medieval te aguarda 🏰</p>
        </div>
      </div>
    </div>
  );
}
