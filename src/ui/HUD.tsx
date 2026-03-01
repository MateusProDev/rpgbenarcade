// ========================
// HUD (Heads-Up Display)
// ========================
import { useGameStore } from "../store/gameStore";
import { getClassSkills } from "../game/entities/classes";
import { getRemainingCooldown } from "../game/combat";
import "./styles.css";

export function HUD() {
  const player = useGameStore((s) => s.player);
  const cooldowns = useGameStore((s) => s.cooldowns);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const notifications = useGameStore((s) => s.notifications);
  const removeNotification = useGameStore((s) => s.removeNotification);
  const remotePlayers = useGameStore((s) => s.remotePlayers);

  if (!player) return null;

  const skills = getClassSkills(player.classType, player.advancedClass);
  const hpPercent = (player.hp / player.maxHp) * 100;
  const manaPercent = (player.mana / player.maxMana) * 100;
  const xpPercent = (player.xp / player.xpToNext) * 100;

  return (
    <div className="hud">
      {/* Player Info */}
      <div className="hud-player-info">
        <div className="hud-name">
          {player.title && <span className="hud-title">{player.title}</span>}
          <span>{player.name}</span>
          <span className="hud-level">Lv.{player.level}</span>
          <span className="hud-class">
            {player.advancedClass || player.classType}
          </span>
        </div>

        {/* HP Bar */}
        <div className="hud-bar hp-bar">
          <div className="bar-fill hp-fill" style={{ width: `${hpPercent}%` }} />
          <span className="bar-text">
            ❤️ {player.hp}/{player.maxHp}
          </span>
        </div>

        {/* Mana Bar */}
        <div className="hud-bar mana-bar">
          <div className="bar-fill mana-fill" style={{ width: `${manaPercent}%` }} />
          <span className="bar-text">
            💙 {player.mana}/{player.maxMana}
          </span>
        </div>

        {/* XP Bar */}
        <div className="hud-bar xp-bar">
          <div className="bar-fill xp-fill" style={{ width: `${xpPercent}%` }} />
          <span className="bar-text">
            ⭐ {player.xp}/{player.xpToNext} XP
          </span>
        </div>

        <div className="hud-gold">💰 {player.gold} Gold</div>
      </div>

      {/* Skill Bar */}
      <div className="hud-skill-bar">
        {skills.map((skill, i) => {
          const cd = getRemainingCooldown(skill.id, cooldowns);
          const isOnCd = cd > 0;
          return (
            <div
              key={skill.id}
              className={`skill-slot ${isOnCd ? "on-cooldown" : ""}`}
              title={`${skill.name}\n${skill.description}\nDano: ${skill.damage}\nCusto: ${skill.manaCost || 0} Mana\nCooldown: ${skill.cooldown / 1000}s`}
            >
              <span className="skill-icon">{skill.icon}</span>
              <span className="skill-key">{i + 1}</span>
              {isOnCd && <span className="skill-cd">{cd.toFixed(1)}s</span>}
            </div>
          );
        })}
        <div className="skill-slot attack-slot" title="Ataque básico (Espaço)">
          <span className="skill-icon">⚔️</span>
          <span className="skill-key">Spc</span>
        </div>
      </div>

      {/* Mini Info */}
      <div className="hud-mini-info">
        <span className="time-badge">{getTimeEmoji(timeOfDay)} {timeOfDay}</span>
        <span className="players-badge">👥 {remotePlayers.length + 1}</span>
        {player.attributePoints > 0 && (
          <span className="ap-badge">✨ {player.attributePoints} pontos</span>
        )}
      </div>

      {/* Hotkey hints */}
      <div className="hud-hotkeys">
        <span>I: Inventário</span>
        <span>K: Skills</span>
        <span>T: Talentos</span>
        <span>Q: Quests</span>
        <span>C: Chat</span>
        <span>E: Interagir</span>
        <span>P: Pegar item</span>
      </div>

      {/* Notifications */}
      <div className="hud-notifications">
        {notifications.map((msg, i) => (
          <div
            key={i}
            className="notification"
            onClick={() => removeNotification(i)}
          >
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}

function getTimeEmoji(time: string): string {
  switch (time) {
    case "dawn": return "🌅";
    case "day": return "☀️";
    case "dusk": return "🌇";
    case "night": return "🌙";
    default: return "☀️";
  }
}
