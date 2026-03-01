// ========================
// Character Creation Screen
// ========================
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { CLASS_CONFIGS } from "../game/entities/classes";
import { auth } from "../firebase/config";
import type { ClassType } from "../types";
import "./styles.css";

export function CharacterCreation() {
  const { createCharacter } = useAuth();
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassType>("swordsman");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="login-screen">
      <div className="creation-container">
        <h1 className="game-title">Criar Personagem</h1>

        <form className="login-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Nome do Herói</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome..."
              maxLength={16}
              required
            />
          </div>

          <div className="class-selection">
            <label>Escolha sua Classe</label>
            <div className="class-grid">
              {classes.map((cls) => (
                <div
                  key={cls.type}
                  className={`class-card ${selectedClass === cls.type ? "selected" : ""}`}
                  onClick={() => setSelectedClass(cls.type)}
                >
                  <div className="class-icon">{cls.icon}</div>
                  <div className="class-name">{cls.name}</div>
                  <div className="class-desc">{cls.description}</div>
                  <div className="class-stats">
                    <span>STR: {cls.baseAttributes.strength}</span>
                    <span>DEX: {cls.baseAttributes.dexterity}</span>
                    <span>INT: {cls.baseAttributes.intelligence}</span>
                    <span>VIT: {cls.baseAttributes.vitality}</span>
                  </div>
                  <div className="class-stats">
                    <span>❤️ {cls.baseHp}</span>
                    <span>💙 {cls.baseMana}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Criando..." : "Criar Herói"}
          </button>
        </form>
      </div>
    </div>
  );
}
