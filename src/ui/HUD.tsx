// ========================
// HUD — Premium Heads-Up Display
// Glass panels, animated bars, skill bar, danger effects
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
  const hpPercent = Math.min(100, (player.hp / player.maxHp) * 100);
  const manaPercent = Math.min(100, (player.mana / player.maxMana) * 100);
  const xpPercent = Math.min(100, (player.xp / player.xpToNext) * 100);
  const hpLow = hpPercent <= 25;

  return (
    <div className={`hud ${hpLow ? "hud-danger" : ""}`}>
      {/* Player Info Panel */}
      <div className="hud-player-info">
        <div className="hud-portrait">
          <span className="portrait-icon">
            {getClassEmoji(player.classType)}
          </span>
          <span className="portrait-level">{player.level}</span>
        </div>
        <div className="hud-bars">
          <div className="hud-name">
            {player.title && <span className="hud-title">{player.title}</span>}
            <span className="hud-player-name">{player.name}</span>
            <span className="hud-class">
              {player.advancedClass || player.classType}
            </span>
          </div>

          {/* HP Bar */}
          <div className="hud-bar hp-bar">
            <div
              className={`bar-fill hp-fill ${hpLow ? "bar-danger" : ""}`}
              style={{ width: `${hpPercent}%` }}
            />
            <span className="bar-text">
              {player.hp}/{player.maxHp}
            </span>
            <span className="bar-icon">❤️</span>
          </div>

          {/* Mana Bar */}
          <div className="hud-bar mana-bar">
            <div className="bar-fill mana-fill" style={{ width: `${manaPercent}%` }} />
            <span className="bar-text">
              {player.mana}/{player.maxMana}
            </span>
            <span className="bar-icon">💙</span>
          </div>

          {/* XP Bar */}
          <div className="hud-bar xp-bar">
            <div className="bar-fill xp-fill" style={{ width: `${xpPercent}%` }} />
            <span className="bar-text">
              {player.xp}/{player.xpToNext} XP
            </span>
            <span className="bar-icon">⭐</span>
          </div>
        </div>
      </div>

      {/* Gold display */}
      <div className="hud-gold-display">
        <span className="gold-icon">💰</span>
        <span className="gold-amount">{player.gold.toLocaleString()}</span>
      </div>

      {/* Skill Bar */}
      <div className="hud-skill-bar">
        <div className="skill-bar-frame">
          {skills.map((skill, i) => {
            const cd = getRemainingCooldown(skill.id, cooldowns);
            const isOnCd = cd > 0;
            const cdPercent = isOnCd ? (cd / (skill.cooldown / 1000)) * 100 : 0;
            return (
              <div
                key={skill.id}
                className={`skill-slot ${isOnCd ? "on-cooldown" : ""}`}
                title={`${skill.name}\n${skill.description}\nDano: ${skill.damage}\nCusto: ${skill.manaCost || 0} Mana\nCooldown: ${skill.cooldown / 1000}s`}
              >
                {isOnCd && (
                  <div
                    className="skill-cd-overlay"
                    style={{ height: `${cdPercent}%` }}
                  />
                )}
                <span className="skill-icon">{skill.icon}</span>
                <span className="skill-key">{i + 1}</span>
                {isOnCd && <span className="skill-cd">{cd.toFixed(1)}</span>}
              </div>
            );
          })}
          <div className="skill-divider" />
          <div
            className="skill-slot attack-slot"
            title="Ataque básico (Espaço / Clique direito)"
          >
            <span className="skill-icon">⚔️</span>
            <span className="skill-key">Spc</span>
          </div>
        </div>
      </div>

      {/* Minimap Frame Overlay */}
      <div className="minimap-frame" />

      {/* Mini Info — Top Right (below minimap) */}
      <div className="hud-mini-info">
        <div className="mini-badge time-badge">
          <span className="badge-icon">{getTimeEmoji(timeOfDay)}</span>
          <span className="badge-text">{timeOfDay}</span>
        </div>
        <div className="mini-badge players-badge">
          <span className="badge-icon">👥</span>
          <span className="badge-text">{remotePlayers.length + 1}</span>
        </div>
        {player.attributePoints > 0 && (
          <div className="mini-badge ap-badge">
            <span className="badge-icon">✨</span>
            <span className="badge-text">{player.attributePoints} pts</span>
          </div>
        )}
      </div>

      {/* Hotkey bar */}
      <div className="hud-hotkeys">
        <span className="hotkey"><kbd>I</kbd> Inventário</span>
        <span className="hotkey"><kbd>K</kbd> Skills</span>
        <span className="hotkey"><kbd>T</kbd> Talentos</span>
        <span className="hotkey"><kbd>Q</kbd> Quests</span>
        <span className="hotkey"><kbd>C</kbd> Chat</span>
        <span className="hotkey"><kbd>E</kbd> Interagir</span>
      </div>

      {/* Notifications */}
      <div className="hud-notifications">
        {notifications.map((msg, i) => (
          <div
            key={i}
            className="notification"
            onClick={() => removeNotification(i)}
          >
            <span className="notif-border" />
            {msg}
          </div>
        ))}
      </div>

      {/* Danger vignette overlay */}
      {hpLow && <div className="danger-vignette" />}
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

function getClassEmoji(classType: string): string {
  switch (classType) {
    case "mage": return "🧙";
    case "archer": return "🏹";
    case "swordsman": return "⚔️";
    case "knight": return "🛡️";
    case "assassin": return "🗡️";
    default: return "⚔️";
  }
}
