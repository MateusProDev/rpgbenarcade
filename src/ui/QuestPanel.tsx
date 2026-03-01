// ========================
// Quest Panel
// ========================
import { useGameStore } from "../store/gameStore";
import { getQuest } from "../game/entities/quests";
import { getItem } from "../game/entities/items";
import "./styles.css";

export function QuestPanel() {
  const player = useGameStore((s) => s.player);
  const showQuests = useGameStore((s) => s.showQuests);
  const toggleQuests = useGameStore((s) => s.toggleQuests);
  const addXp = useGameStore((s) => s.addXp);
  const addGold = useGameStore((s) => s.addGold);
  const addItem = useGameStore((s) => s.addItem);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const addNotification = useGameStore((s) => s.addNotification);

  if (!showQuests || !player) return null;

  const handleClaim = (questId: string) => {
    const quest = getQuest(questId);
    const progress = player.quests.find((q) => q.questId === questId);
    if (!quest || !progress) return;

    if (progress.progress < quest.amount) {
      addNotification("Quest ainda não completa!");
      return;
    }

    addXp(quest.xpReward);
    addGold(quest.goldReward);

    if (quest.itemReward) {
      const item = getItem(quest.itemReward);
      if (item) addItem(item);
    }

    // Mark completed
    const quests = player.quests.map((q) =>
      q.questId === questId ? { ...q, completed: true } : q
    );
    updatePlayer({ quests });
    addNotification(`Quest completa: ${quest.name}!`);
  };

  return (
    <div className="panel quest-panel">
      <div className="panel-header">
        <h3>📜 Quests</h3>
        <button className="close-btn" onClick={toggleQuests}>✕</button>
      </div>

      <div className="quest-list">
        {player.quests.length === 0 && (
          <p className="empty-text">Nenhuma quest ativa. Fale com NPCs!</p>
        )}
        {player.quests.map((qp) => {
          const quest = getQuest(qp.questId);
          if (!quest) return null;

          const isComplete = qp.progress >= quest.amount;
          return (
            <div
              key={qp.questId}
              className={`quest-item ${qp.completed ? "quest-claimed" : isComplete ? "quest-complete" : ""}`}
            >
              <div className="quest-name">{quest.name}</div>
              <div className="quest-desc">{quest.description}</div>
              <div className="quest-progress">
                Progresso: {qp.progress}/{quest.amount}
                <div className="quest-progress-bar">
                  <div
                    className="quest-progress-fill"
                    style={{
                      width: `${Math.min(100, (qp.progress / quest.amount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="quest-rewards">
                <span>⭐ {quest.xpReward} XP</span>
                <span>💰 {quest.goldReward} Gold</span>
                {quest.itemReward && <span>🎁 Item</span>}
              </div>
              {isComplete && !qp.completed && (
                <button
                  className="btn-claim"
                  onClick={() => handleClaim(qp.questId)}
                >
                  Resgatar Recompensa
                </button>
              )}
              {qp.completed && <div className="quest-done">✅ Concluída</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
