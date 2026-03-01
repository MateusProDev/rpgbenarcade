// ========================
// Talent Tree Panel
// ========================
import { useGameStore } from "../store/gameStore";
import { getTalentTree, canUnlockTalent } from "../game/entities/talents";
import "./styles.css";

export function TalentPanel() {
  const player = useGameStore((s) => s.player);
  const showTalents = useGameStore((s) => s.showTalents);
  const toggleTalents = useGameStore((s) => s.toggleTalents);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const addNotification = useGameStore((s) => s.addNotification);

  if (!showTalents || !player) return null;

  const talents = getTalentTree(player.classType);

  const handleUnlock = (talentId: string) => {
    const talent = talents.find((t) => t.id === talentId);
    if (!talent) return;

    if (player.talents.includes(talentId)) {
      addNotification("Talento já desbloqueado!");
      return;
    }

    if (!canUnlockTalent(talent, player.level, player.talents)) {
      addNotification("Requisitos não atendidos!");
      return;
    }

    updatePlayer({
      talents: [...player.talents, talentId],
    });
    addNotification(`Talento desbloqueado: ${talent.name}`);
  };

  return (
    <div className="panel talent-panel">
      <div className="panel-header">
        <h3>🌳 Árvore de Talentos</h3>
        <button className="close-btn" onClick={toggleTalents}>✕</button>
      </div>

      <div className="talent-tree">
        {talents.map((talent) => {
          const isUnlocked = player.talents.includes(talent.id);
          const canUnlock = canUnlockTalent(talent, player.level, player.talents);

          return (
            <div
              key={talent.id}
              className={`talent-node ${isUnlocked ? "unlocked" : ""} ${canUnlock && !isUnlocked ? "available" : ""}`}
              onClick={() => handleUnlock(talent.id)}
            >
              <div className="talent-name">{talent.name}</div>
              <div className="talent-desc">{talent.description}</div>
              <div className="talent-req">Nível {talent.requiredLevel}</div>
              {isUnlocked && <div className="talent-check">✅</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
